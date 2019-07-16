#!/usr/bin/env python
import Murmur
import os

import Ice
import redis
import sys
import requests
import json
from dotenv import load_dotenv
Ice.loadSlice("'-I" + Ice.getSliceDir() + "' mumble/Murmur.ice")
load_dotenv()

r = redis.Redis(host='localhost', port=6379, db=0)


def publish(message):
    r.publish('mumble:event', json.dumps(message))


class MurmurAuthenticatorI(Murmur.ServerAuthenticator):
    def __init__(self, server):
        self.server = server

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
    def __init__(self, server, adapter):
        self.server = server

    def userConnected(self, state, current=None):
        publish({
            'type': 'connect',
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


class Client(Ice.Application):
    def run(self, *args):
        self.communicator().getImplicitContext().put("secret", os.getenv('ICE_PASS'))
        meta = Murmur.MetaPrx.checkedCast(
            self.communicator().propertyToProxy('Murmur.Meta'))
        adapter = self.communicator().createObjectAdapter('Murmur.ServerAuthenticator')
        adapter.activate()
        servers = meta.getAllServers()
        for server in servers:
            auth_identity = self.communicator().stringToIdentity('auth:'+str(server))
            callback_identity = self.communicator().stringToIdentity('callback:'+str(server))
            adapter.add(MurmurAuthenticatorI(server), auth_identity)
            adapter.add(ServerCallbackI(server, None), callback_identity)

            server.setAuthenticator(
                Murmur.ServerAuthenticatorPrx.uncheckedCast(
                    adapter.createProxy(auth_identity))
            )

            server.addCallback(
                Murmur.ServerCallbackPrx.uncheckedCast(
                    adapter.createProxy(callback_identity))
            )
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
        'Murmur.ServerAuthenticator.Endpoints', 'tcp -h %s -p %s' % (
            os.getenv('ICE_HOST'), int(os.getenv('ICE_PORT'))+1)
    )
    client.main(sys.argv, None, initData=initData)
