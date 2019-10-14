node-Tor
===

Javascript open source implementation of the Tor protocol (The Onion Router https://www.torproject.org/) on server side and inside browsers

## Presentation

The purpose of this project is to offer a js implementation of the Tor protocol so it can be used on top of other protocols, whether on server side or inside browsers (using Websockets, WebRTC), most likely for p2p projects (like [Convergence](http://www.peersm.com/Convergence.pdf)), it supports the Onion Proxy and Onion Router features accessible via different interfaces (mainly direct TLS socket, SOCKS proxy and WebSockets, it can be extended to WebRTC for example)

Please see the [node-Tor presentation](https://nlnet.nl/project/node-Tor/), it is not intended to be used to add nodes in the Tor network, however it does support it but a minimum of Tor project specific features are implemented to allow this, please see the Specific settings section

## Funding

This module is funded by [NLnet](https://nlnet.nl/) under the [EU Horizon 2020 Next Generation internet Privacy & Trust Enhancing Technologies](https://nlnet.nl/PET/)

The full code is now open source and provided in clear

You can consider donating to BTC 19LgEmzSvD1oCr1QxT2dgmF5SSnh1aq94j

## History

This project was started in 2012 when we contacted the Tor project team with some objectives to use the Tor network at that time from the browser, then Aaron Swartz to whom we dedicate this project just replied "I think the right solution is to implement all of Tor in JavaScript, so that the web browser can set up the necessary tunnels and it has all the security guarantees of the client. Obviously, of course, this is quite a programming challenge."

Then we did it, he got aware of the first commit which is the one that was public until now

And we did continue the development over years, the full version used for [Peersm](http://www.peersm.com), [Peersm bridges](https://github.com/Ayms/node-Tor/tree/master/install) (bridging with bittorrent), [iAnonym](http://www.ianonym.com) was not public until now

## License

This project is under a MIT license

## Phases

If you intend to fork this module probably you should wait for phase 3

Phase 1 and 2 are completed

- Phase 3 (now+1 week): browserify everything and release the full code + Peersm interface

## Dependencies

This module is using the very good [Forge](https://github.com/digitalbazaar/forge), [sjcl](http://bitwiseshiftleft.github.io/sjcl/), [RSA and ECC in JavaScript](http://www-cs-students.stanford.edu/~tjw/jsbn/), [Browserify](https://github.com/browserify/browserify), [Terser](https://github.com/terser-js/terser) and other modules from us under a MIT license

## Modifications

We did clean the code, update it to ES6 and make it modular, as well as update it to the latest nodejs version

We have removed the parts that we consider useless related to projects mentionned above (including browser emulation inside node, bittorrent and Peersm video streaming), but they still can be usefull for some potential uses, you can find them in [removed](https://github.com/Ayms/node-Tor/tree/master/lib/src/removed)

The full initial code can be found [here](https://github.com/Ayms/node-Tor/tree/master/lib/src/removed/node-tor-original.js) if needed (good luck...this is a complex monolithic block with many options)

We did keep the Peersm interface doing the OP to connect to Tor nodes, fetch the web or download from other peers, as well as the ORDB function for the ORs (please see the original doc https://github.com/Ayms/node-Tor/tree/master/README-old.md

## Installation

Install node and unzip [master](https://github.com/Ayms/node-Tor/archive/master.zip)

## Browser interface

To come - phase 3

For now you can take a look at [Peersm](http://peersm.com/peersm) which is using the original code

## Setting up your environment

For both processes below you can make it periodic by uncommenting the related call in ``node-tor.js``

### Create your keys and publish your node

Create a directory ``OR_name`` in lib directory (for example OR1, note that only regular characters must be used for the names of the routers)

Run ``node publish.js OR_name OR_IP:OR_port version email``

This will create your onion key and long term ID key in the ``OR_name`` directory, then you must use that name when you launch the OR

You can also do this manually, please see an example [here](https://github.com/Ayms/node-Tor/tree/master/install#node-tor-bridge-websocket-server-installation)

And this will publish your node to the Tor authorities who will add your node into the Tor consensus

Note that this is not mandatory, some years ago it appeared that a Tor node would not extend to you if you were not in the consensus, apparently this rule does not apply any longer but if you don't register you might be seen as a bridge

By default a small bandwidth will be advertised for your node, this is to discourage other nodes to choose your node, you can change it in ``publish.js``, and the version advertised is "node-Tor "+version (advised value: 1.0.0)

An unused ntor-onion-key is used in the publish descriptor, basically the base64 encoding of the sha256 of "Thanks Ayms this module is great", we don't know why it is mandatory for nodes that do not implement elliptic crypto

You can check that the process was successful by doing from the browser ``IP:port/tor/server/fp/<fingerprint>`` where fingerprint is the one displayed in the result of the call to ``publish.js`` and is the one to be used when you launch the OR, and where IP:port is the IP/port of an authority, you can also check that your node appears in [onionoo relay serach](https://metrics.torproject.org/rs.html)

If you don't want to publish you can comment the calls to ``publish`` at the end of ``publish.js``, please note that the authorities might change over time, then you musk keep the list up to date in ``publish.js``, and once you have published the autorities will check your node periodically sending VERSION cells

### Update the routers

Tor routers are stored in ``guards.js`` and ``exit.js``, by default ``Relays`` are equal to ``Guards`` in node-Tor

To update the list, run ``node build-relays_and_dirs.js OR_name``, this will query [onionoo](https://metrics.torproject.org/onionoo.html), select the nodes that have a good bandwidth and test them one by one sending VERSION cells to them (OR_name is the same as above and just used to emulate the tls connections to test other nodes), then this will store the working nodes in guards and exit files

It is important to update the nodes at least once a week since the onion keys are supposed to be rotated and Tor routers are for a big part not really stable

## Use

What starts everything is always a simple call to the ``Tor`` function or the use of ``handleRequest`` function

Launch the OR:

	Tor({params_:{port:OR_port}})

The OR will listen/create tls sockets with Tor circuits, it can perform the OP also if connected via SOCKS proxy, we don't really see the use case except for testing purposes and it should not be encouraged, probably it could instead be extended to support [Shadowsocks](https://shadowsocks.org/en/index.html)

Note that again the purpose is not to add nodes in the Tor network, therefore the default for the OR is NOT to extend circuits except from the WebSocket interface (you can modify this by removing the check in circuits.js, look for "does not extend" in circuits.js)

Launch the Websocket OR:

	net.createServer(handleRequest).listen(port,function() {console.log('WS INCOMING SOCKET : incoming socket open WS Interface port '+port)});

Create circuits from the OP:

	Tor((socket interface connected to an OR), this can be a Duplex stream too)

where socket.params_ is ``{OP:true,nb_hop:NB_DB_HOP}``

or

	Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:(Websocket interface)}});

or

	Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:(Websocket interface),db=true}});

which will create a circuit toward the ORDB, see the Test configuration section

Then pipe some data through the OP socket (http request for example)

To launch the OR from the command line, do:

	node node-tor.js OR_name OR_IP OR_port OR_wsport OR_fingerprint OR_version

Please see the section Setting up your environment for the details of parameters

## Test configuration and use

First circuit created from the browser OP via WS is:

	<browser> --> <our OR node> --> <a Tor node> --> <our ORDB>

Then 5 other circuits are created:

	<browser> --> <our OR node> --> <a Tor node> --> <a Tor Exit node>

From the browser interface you can enter:

	http://www.peersm.com/map.jpg

To download from the Tor Exit nodes

And:

	6faddcd7f92ce3111cdf55f493ac66b0bdbaebdb

To download from a peer (including yourself) that has map.jpg via the ORDB circuit/router (ie from the browser to the browser, the messages being relayed by the ORDB via anonymized circuits, one of the purpose of the Convergence project was to replace the ORDB server by a ORDB peer/browser)

## Browserify

To come - phase 3

## Specific settings

Again the intent is not to add Tor nodes inside the Tor network, unlike the common belief the Tor network is very centralized, this implementation is more oriented for decentralized networks (and for p2p we think that two hops are enough since the guards concept does not apply, as well as tls, the Tor protocol does not need it), so following simplifications/specific settings apply:

- tls and onion keys are the same, not a big deal and not difficult to change
- tls certificates have always the same certid (see the bug below, this is an umpteenth openssl unfortunate change and is a won't fix for us)
- the onion keys are not rotated, this can easily be done via an external process
- CERTS cells and AUTH are implemented but not checked, as well as NETINFO
- the Exit function is not implemented for obvious reasons, it's of course trivial to implement
- CREATE_FAST are used from the browser to test the whole chain, now the use of CREATE_FAST should be discouraged for any implementation
- the directory/consensus features are not implemented (so for example you cannot proxy the Tor browser directly to node-Tor via SOCKS proxy, which is anyway not a good idea at all)
- we don't know how secure is the nodejs and browser prng
- the OR will not extend circuits except from WebSocket interface in order not to handle the Tor traffic, it advertises also a ridiculous bandwidth in order not to be chosen by Tor nodes
- forge buffers are used for some features, note that they are fast (faster in fact than nodejs Buffers and ArrayBuffers when we were testing streaming)
- MESSAGE2 with elliptic crypto are not implemented for now, probably this would be a good idea to do it so we get rid of RSA, PEM, DER formats for p2p implementations, please note that for publishing nodes an unused curve25519 ntor-onion-key (ie a 32B buffer) is used in the descriptor

## Related bugs/issues

* [indexedDB broken - UnknownError - Error opening Database](https://bugzilla.mozilla.org/show_bug.cgi?id=944918) : we did open this bug end of 2013 (indexedDB is used by Peersm to store downloaded content by chunks), unfortunately, as you can see, it might survive us, quite annoying bug since it destroys indexedDB and everything that was in there when it happens (usually after a FF upgrade)
* [Undeprecate tls.createSecurePair](https://github.com/nodejs/node/issues/29559) : closed, we moved to TLSSocket and it looks to be the right way finally, implemented in this commit
* [Advisory for SSL problems with leading zeros on OpenSSL 1.1.0](https://icinga.com/2017/08/30/advisory-for-ssl-problems-with-leading-zeros-on-openssl-1-1-0/) : probably this is the issue with certid, please see the comment in abstract-tls, we will not fix it
* [Security error when trying to set a non SSL/TLS Websocket from a https page](https://bugzilla.mozilla.org/show_bug.cgi?id=917829) and this thread [WS/Service Workers, TLS and future apps - was Re: HTTP is just fine](https://lists.w3.org/Archives/Public/public-webapps/2015OctDec/0187.html), this is why the browser page can't be https, because the specs forbid a fallback to ws and of course wss can't be used since the nodes have self-signed certificates, this is a misdesign of the web but nobody wants to admit/correct it
* [ISSUE 22 - Re: Incomplete blocks](https://lists.w3.org/Archives/Public/public-webcrypto-comments/2013Feb/0016.html), this relates to the fact that only the Tor project in the world uses progressive hash stopped for each chunk (cells data), which means that it closes the hash for each cell received and then restarts from the previous state, this is not supported by anybody, neither openssl, Webcrypto or NSS, that's the purpose of the specific ``Hash`` function modifying forge hash to allow this, please see https://github.com/Ayms/node-Tor/tree/master/ext/my_sha1.js (this does not impact the aes encryption, my_aes.js is just a repackaging of aes to make it behave the nodejs way)

## Notes for the devs

This project has been maintained over years but it has been a huge work to clean everything and make it modular, and at the end is very small for what it does, now some parts might still need some changes, please keep in mind that it was quite difficult at the time it was developped to put everything inside browsers with associated crypto, that's why the previous code ended up to be a monolith

The major part of the ORDB function is isolated into circuits_extended.js, but you need to remove what relates to Peersm in the other modules if you really want to have a minimal version of node-Tor

The same code is used at nodejs and browser side, then the browser has exactly the same functions than nodejs (and could therefore act as an OR as well)

Globals are used at the nodejs level (but not inside browsers), most of them can be splitted as local variables inside modules but not all, this is not an issue and comes from the initial design since at the beginning the code was not intended to be modular (and then no globals were used), changing this impacts a lot of things, this might be a TODO (as well as implementing the elliptic crypto)

If you PR something please make sure that the test configuration works for each type of circuit and download also (then it becomes unlikely that something is wrong)

## Related projects :

* [Discover and move your coins by yourself](https://peersm.com/wallet)
* [Ayms/bitcoin-transactions](https://github.com/Ayms/bitcoin-transactions)
* [Ayms/cashaddress](https://github.com/Ayms/cashaddress)
* [Ayms/bitcoin-wallets](https://github.com/Ayms/bitcoin-wallets)
* [Ayms/zcash-wallets](https://github.com/Ayms/zcash-wallets)
* [Ayms/bittorrent-nodeid](https://github.com/Ayms/bittorrent-nodeid)
* [Ayms/torrent-live](https://github.com/Ayms/torrent-live)
* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Interception Detector](http://www.ianonym.com/intercept.html)
* [Ayms/abstract-tls](https://github.com/Ayms/abstract-tls)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)
* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)