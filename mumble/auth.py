#!/usr/bin/env python

import os
import Ice
import redis
import sys
import json
import time
from dotenv import load_dotenv
Ice.loadSlice("'-I" + Ice.getSliceDir() + "' mumble/Murmur.ice")
import Murmur
load_dotenv()

r = redis.Redis(host='localhost', port=6379, db=0)

def publish(message):
    r.publish('mumble:event', json.dumps(message))


def auth_user(name, pw):
    user = r.get('user:cache:' + name)
    if user is None:
        return -1, None, []

    user = json.loads(user)
    if user['password'] != pw:
        return -1, None, []

    return user['mumbleId'], user['displayName'], user['roles']


class MurmurAuthenticatorI(Murmur.ServerAuthenticator):
    def authenticate(self, name, pw, certs, certHash, certStrong, _ctx=None):
        try:
            return auth_user(name, pw)
        except Exception:
            return -1, None, []

    def idToName(self, uid, _ctx = None):
        pass

    def idToTexture(self, uid, _ctx = None):
        return []


class ServerCallbackI(Murmur.ServerCallback):
    def userConnected(self, state, current = None):
        publish({
            'type': 'rawconnect',
            'state': state.__dict__
        })

    def userDisconnected(self, state, current = None):
        publish({
            'type': 'disconnect',
            'state': state.__dict__
        })

    def userStateChanged(self, state, current = None):
        publish({
            'type': 'change',
            'state': state.__dict__
        })

    def userTextMessage(self, state, message, current = None):
        publish({
            'type': 'message',
            'state': state.__dict__,
            'message': message.__dict__
        })

    def channelCreated(self, state, current = None):
        publish({
            'type': 'channelCreated',
            'state': state.__dict__
        })

    def channelRemoved(self, state, current = None):
        publish({
            'type': 'channelRemoved',
            'state': state.__dict__
        })

    def channelStateChanged(self, state, current = None):
        publish({
            'type': 'channelStateChanged',
            'state': state.__dict__
        })


class Client(Ice.Application):
    def run(self, *args):
        self.communicator().getImplicitContext().put("secret", os.getenv('ICE_PASS'))
        meta=Murmur.MetaPrx.checkedCast(
            self.communicator().propertyToProxy('Murmur.Meta'))
        adapter=self.communicator().createObjectAdapter('Murmur.Callbacks')
        adapter.activate()

        server=meta.getServer(1)

        server.setAuthenticator(Murmur.ServerAuthenticatorPrx.uncheckedCast(
            adapter.addWithUUID(MurmurAuthenticatorI())))

        server.addCallback(Murmur.ServerCallbackPrx.uncheckedCast(
            adapter.addWithUUID(ServerCallbackI())))

        self.communicator().waitForShutdown()


if __name__ == "__main__":
    print("Waiting 10 seconds")
    time.sleep(10)
    client=Client()
    initData=Ice.InitializationData()
    initData.properties=Ice.createProperties([], initData.properties)
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
    client.main(sys.argv, None, initData = initData)
