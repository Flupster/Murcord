#!/usr/bin/env python
"""
This whole thing is because I can't figure out ICE with node
once I can figure that one out this will be scrapped
"""
import Ice
import sys
import requests
import json
Ice.loadSlice("'-I" + Ice.getSliceDir() + "' Murmur.ice")
import Murmur

class MurmurAuthenticatorI(Murmur.ServerAuthenticator):
    def __init__(self, server):
        self.server = server

    def authenticate(self, name, pw, certs, certHash, certStrong, _ctx=None):
        print("Login attempt %s:%s" % (name,pw) )
        payload = json.dumps({"username": name, "password": pw if pw else None, "hash": certHash})
        try:
            response = requests.post("http://localhost:10002/login", data=payload)
            response.raise_for_status()
            data = response.json()
            print("Login Success for: %s" % name)
            if 'admin' in data['roles']:
                data['username'] = data['username'] + ' [SA]'
            return int(data['id']), data['username'], data['roles']
        except Exception:
            print("Login Failure for: %s" % name)
            return -1, None, []
        

    def idToName(self, uid, _ctx=None):
        pass

    def idToTexture(self, uid, _ctx=None):
        return []


class Client(Ice.Application):
    def __init__(self):
        self.ready = False

    def run(self, *args):
        self.communicator().getImplicitContext().put("secret", "icepass123")
        meta = Murmur.MetaPrx.checkedCast(
            self.communicator().propertyToProxy('Murmur.Meta'))
        adapter = self.communicator().createObjectAdapter('Murmur.ServerAuthenticator')
        adapter.activate()
        servers = meta.getAllServers()
        for server in servers:
            identity = self.communicator().stringToIdentity(str(server))
            adapter.add(MurmurAuthenticatorI(server), identity)
            print("Setting the authenticator for server %s" % str(server))
            server.setAuthenticator(
                Murmur.ServerAuthenticatorPrx.uncheckedCast(adapter.createProxy(identity)))
        self.communicator().waitForShutdown()


if __name__ == "__main__":
    client = Client()
    initData = Ice.InitializationData()
    initData.properties = Ice.createProperties([], initData.properties)
    initData.properties.setProperty('Ice.ImplicitContext', 'Shared')
    initData.properties.setProperty('Ice.Default.EncodingVersion', '1.0')
    client.main(sys.argv, "config.client", initData=initData)
