#!/usr/bin/env python

import os
import Ice
import redis
import sys
import requests
import json
import threading
from dotenv import load_dotenv
Ice.loadSlice("'-I" + Ice.getSliceDir() + "' mumble/Murmur.ice")
import Murmur
load_dotenv()

r = redis.Redis(host='localhost', port=6379, db=0)


def publish(message):
    r.publish('mumble:event', json.dumps(message))


def contextListen(server, cb):
    p = r.pubsub()
    p.subscribe('mumble:context')
    for m in p.listen():
        try:
            if m['type'] == 'message':
                data = json.loads(m['data'].decode())
                scope = Murmur.ContextUser if data['scope'] == 'user' else Murmur.ContextChannel
                server.addContextCallback(
                    data['session'], data['action'], data['name'], cb, scope
                )
        except BaseException as e:
            pass


class MurmurAuthenticatorI(Murmur.ServerAuthenticator):
    def authenticate(self, name, pw, certs, certHash, certStrong, _ctx=None):
        try:
            response = requests.post(
                'http://localhost:10002/login', data=json.dumps({'username': name, 'password': pw})
            )
            response.raise_for_status()
            data = response.json()
            return int(data['id']), data['username'], data['roles']
        except Exception:
            return -1, None, []

    def idToName(self, uid, _ctx=None):
        pass

    def idToTexture(self, uid, _ctx=None):
        return []


class ServerCallbackI(Murmur.ServerCallback):
    def userConnected(self, state, current=None):
        publish({
            'type': 'rawconnect',
            'state': state.__dict__
        })

    def userDisconnected(self, state, current=None):
        publish({
            'type': 'disconnect',
            'state': state.__dict__
        })

    def userStateChanged(self, state, current=None):
        publish({
            'type': 'change',
            'state': state.__dict__
        })

    def userTextMessage(self, state, message, current=None):
        publish({
            'type': 'message',
            'state': state.__dict__,
            'message': message.__dict__
        })

    def channelCreated(self, state, current=None):
        publish({
            'type': 'channelCreated',
            'state': state.__dict__
        })

    def channelRemoved(self, state, current=None):
        publish({
            'type': 'channelRemoved',
            'state': state.__dict__
        })

    def channelStateChanged(self, state, current=None):
        publish({
            'type': 'channelStateChanged',
            'state': state.__dict__
        })


class ServerContextCallbackI(Murmur.ServerContextCallback):
    def contextAction(self, action, user, session, channel, current=None):
        publish({
            'type': 'rawContextAction',
            'action': action,
            'user': user.__dict__,
            'session': session,
            'channel': channel,
        })


class Client(Ice.Application):
    def run(self, *args):
        self.communicator().getImplicitContext().put("secret", os.getenv('ICE_PASS'))
        meta = Murmur.MetaPrx.checkedCast(
            self.communicator().propertyToProxy('Murmur.Meta'))
        adapter = self.communicator().createObjectAdapter('Murmur.Callbacks')
        adapter.activate()

        server = meta.getServer(1)

        server.setAuthenticator(
            Murmur.ServerAuthenticatorPrx.uncheckedCast(
                adapter.addWithUUID(MurmurAuthenticatorI()))
        )

        server.addCallback(
            Murmur.ServerCallbackPrx.uncheckedCast(
                adapter.addWithUUID(ServerCallbackI()))
        )

        contextCallback = Murmur.ServerContextCallbackPrx.uncheckedCast(
            adapter.addWithUUID(ServerContextCallbackI())
        )

        threading.Thread(
            target=contextListen, args=(server, contextCallback,)
        ).start()
        self.communicator().waitForShutdown()


if __name__ == "__main__":
    client = Client()
    initData = Ice.InitializationData()
    initData.properties = Ice.createProperties([], initData.properties)
    initData.properties.setProperty('Ice.ImplicitContext', 'Shared')
    initData.properties.setProperty('Ice.Default.EncodingVersion', '1.0')
    initData.properties.setProperty(
        'Murmur.Meta', 'Meta:tcp -h %s -p %s' % (
            os.getenv('ICE_HOST'), os.getenv('ICE_PORT'))
    )
    initData.properties.setProperty(
        'Murmur.Callbacks.Endpoints', 'tcp -h %s -p %s' % (
            os.getenv('ICE_HOST'), int(os.getenv('ICE_PORT'))+1)
    )
    client.main(sys.argv, None, initData=initData)
