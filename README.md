node-Tor
===

Javascript open source implementation of the Tor protocol (The Onion Router https://www.torproject.org/) on server side and inside browsers

## Presentation

The purpose of this project is to offer a js implementation of the Tor protocol so it can be used on top of other protocols, whether on server side or inside browsers (using Websockets, WebRTC), most likely for p2p projects (like [Convergence](http://www.peersm.com/Convergence.pdf)), it supports the Onion Proxy and Onion Router features accessible via different interfaces (mainly direct TLS socket, SOCKS proxy and WebSockets, WebRTC might come)

Please see the [node-Tor presentation](https://nlnet.nl/project/node-Tor/), it is not intended to be used to add nodes in the Tor network, however it does support it but a minimum of Tor project specific features are implemented to allow this, please see the Specific settings section

And it must not be misunderstood as a remake of the Tor network, this is a complete implementation of the Tor protocol that can be used to anonymize any protocol

To give an idea of the global target and potential, please see [Anonymous IPFS, Filecoin or whatever protocol in fact](https://github.com/ipfs/ipfs/issues/439) or a complete redesign of the 2015 Convergence proposal [Convergence - 2020](http://www.peersm.com/Convergence-2020.pdf) "A universal and generic architecture to anonymize any application or protocol and turn it into an independent decentralized p2p network inside browsers and servers, with browsers acting as servers"


## Examples / Use cases

* Convergence proposal: A universal architecture to anonymize any application or protocol and turn it into an independent decentralized p2p network inside browsers and servers, with browsers acting as servers http://www.peersm.com/Convergence.pdf

* Peersm: bittorrent-like anonymous download/streaming inside browsers (http://www.peersm.com)

* Bridging with bittorrent [Peersm bridges](https://github.com/Ayms/node-Tor/tree/master/streaming-deprecated)

* Anonymous Webtorrent: https://github.com/webtorrent/webtorrent/issues/1767

* Compatibility with the Tor network and Snowflake

* Reimplement uproxy project: https://www.uproxy.org/

* Bypassing the Great China Firewall: https://github.com/Ayms/node-Tor/issues/2#issuecomment-66150611

* Bitcoin: https://github.com/bitcoin/bitcoin/pull/18988#issuecomment-646564853

* Anonymous wallets: https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2020-December/018329.html

* Decentralized crypto currency exchanges: [Internet of Coins](https://internetofcoins.org/blog/page:12)

* Anonymizing IOT: https://www.objetconnecte.com/objets-connectes-anonyme-peersm/

* IPFS: https://github.com/ipfs/ipfs/issues/439#issuecomment-593116241

* Covid apps - Stopcovid and DP-3T discussion:
https://github.com/ROBERT-proximity-tracing/documents/issues/6#issuecomment-623704990

* French covid app: https://github.com/ROBERT-proximity-tracing/documents/issues/55

* Filecoin: https://github.com/protocol/research/issues/4#issuecomment-388766158

* Anonymous Videoconf apps

* Anonymous Data portability

* Any app...

Some examples among many others

## History

This project was started in 2012 when we contacted the Tor project team with some objectives to use the Tor network at that time from the browser, then Aaron Swartz to whom we dedicate this project just replied "I think the right solution is to implement all of Tor in JavaScript, so that the web browser can set up the necessary tunnels and it has all the security guarantees of the client. Obviously, of course, this is quite a programming challenge."

Then we did it, he got aware of the first commit which is the one that was public until now

And we did continue the development over years, the full version used for [Peersm](http://www.peersm.com), [iAnonym](http://ianonym.peersm.com) was not public until now

## Phases and Funding

Phases 1 to 3 (refactoring of the whole initial code, split into modules and push everything open source) have been funded by [NLnet](https://nlnet.nl/) under the [EU Horizon 2020 Next Generation internet Privacy & Trust Enhancing Technologies](https://nlnet.nl/PET/)

The full code up to phase 3 is the current status of this repo and is now open source and provided in clear

Phase 4 will implement the ``Duplex Object`` and evented pipes method, please see below and the [docs](https://github.com/Ayms/node-Tor/tree/master/docs/README.md), the main concepts have been  developped but not the split of the ``request`` object, it's not part of this repo

Phase 5 goes along with phase 4 in order to implement elliptic crypto, the Tor protocol v3 features and WebRTC so browsers can perform the Onion Proxy and Onion Router functions as p2p peers, this will be compatible with [Snowflake](https://snowflake.torproject.org/) but is much more ambitious since browsers and nodes are really behaving like Tor protocol nodes on top of WebRTC not only relaying WebRTC messages

<b>For now there is no funding left for the development/release of phase 4 and phase 5

Phase 4 will be released if/when ~1 BTC is reached on address 19LgEmzSvD1oCr1QxT2dgmF5SSnh1aq94j

Then @Ayms will not be needed any longer for future uses/integrations of the project</b>

## License

Phase 1 to 3 are under a MIT license

Same license will apply to phase 4 and phase 5 if they are funded

## Phase 4 and Phase 5

### Evented pipes (phase4)

RDV below stands for 'RendezVous' point, which is a peer that will connect two anonymous peers

The detailed API documentation is [here](https://github.com/Ayms/node-Tor/tree/master/docs/README.md) (but please read what follows first)

	<any protocol>.(...).pipe(<any protocol>).pipe(node-Tor)

	sources --> A --> B --> C --> destination (web site for example)

For example:

	http.pipe(tls).pipe(node-Tor)

or

	http.pipe(parser).pipe(gzip).pipe(tls).pipe(node-Tor)

Where we are on the Onion Proxy side which will pipe https through Tor circuits and an exit node

Here and in what follows all objects piped are extending nodejs' `Duplex Streams` (<b>and `-->` or `<--` are bidirectional too but show the way the Tor circuits are established</b>)

And

	<any protocol>.(...).pipe(<any protocol>).pipe(node-Tor).pipe(RDV peer)

	hidden querying peer --> A --> B --> RDV <-- C <-- D <-- hidden queried peer

Where `RDV peer` allows to choose the last peer which can be an end point or a RDV point to which another Tor peer is connected to via several hops (like hidden services), the RDV peer is relaying the data between the two end points not knowing who they are, the two end points not knowing who they are also of course

For example:

	torrent.pipe(node-Tor).pipe(RDV peer)

Which for Peersm project is:

	DB.pipe(node-Tor).pipe(RDV peer)

Where `DB` is the `ORDB` protocol extending the Tor protocol to stream files downloaded inside browser's indexedDB storage between peers

The RDV peer is not using (hidden services)-like addresses to link two peers but simple hashes (so a peer transiting via the RDV peer to access another one must have the knowledge of its hash), this can be customized

And

	<any protocol>.pipe(<any protocol>).pipe(node-Tor)

	hidden querying peer --> A --> B --> C --> queried peer

Where we are on the Onion Router side as the last node (supposed to be an exit one but that's not the case here) which will pipe some protocols, most likely identical between peers (ie the OP initiator and the OR responder)

For example:

	bitcoin.pipe(node-Tor) between two bitcoin peers

	or

	ipfs.pipe(node-Tor) between two ipfs peers

	or

	webtorrent.pipe(node-Tor) between two webtorrent peers

	or

	sip.pipe(node-Tor) for conferencing services

You can do also:

	(bitcoin/ipfs/webtorrent/sip/etc).pipe(node-Tor).pipe(RDV peer)

If you want to hide who are operating the protocols

Both on Onion Proxy side (initiator) and Onion Router side (responder), knowing that both can be browsers

On both side the `pipe` method is bidirectional (ie you don't have to do `ipfs.pipe(node-Tor).pipe(ipfs)`) and allows to stream/pipe chained protocols

Future development are planning to include the `MESSAGES2` elliptic crypto and WebRTC transport layer between peers

So at the end:

	<any protocol>.(...).pipe(<any protocol>).pipe(node-Tor).pipe(RDV peer - optional)

where `node-Tor` circuits are:

	Tor TLS+Tor protocol over TCP (already implemented)
	Tor TLS+Tor protocol over TCP streamed via SOCKS proxy (already implemented)
	Tor TLS+Tor protocol over WebSockets (already implemented)
	Tor TLS+Tor protocol over WebRTC (TODO - phase5)

### Non Evented pipes (phase4)

The above pipes methods are using events but in case the initial source does not support events and cannot pipe natively with nodejs, the process can start automatically for example doing:

	(bitcoin or any process) | node-tor | (bitcoin or any process)

Where the protocol is piped to the node-Tor process via stdin and stdout (or unix sockets), this is similar to the socks proxy piping but is more secure since it stays local to the code and removes the need of a local (or distant) server implementing the SOCKS interface

### Phase 5

As stated above Phase 5 consists in implementing elliptic crypto, the Tor protocol v3 features and WebRTC, this is a short summary for something that is of course not trivial

## Dependencies

This module is using the very good [Forge](https://github.com/digitalbazaar/forge), [sjcl](http://bitwiseshiftleft.github.io/sjcl/), [RSA and ECC in JavaScript](http://www-cs-students.stanford.edu/~tjw/jsbn/), [Browserify](https://github.com/browserify/browserify), [Terser](https://github.com/terser-js/terser) and other modules from us under a MIT license

All dependencies (except browserify and terser) are currently embedded in the code (mainly because we had to modify some specific parts), so you don't have to [install](https://github.com/Ayms/node-Tor#installation) anything else

## Modifications (phases 1 to 3)

We did clean the code, update it to ES6 and make it modular, as well as update it to the latest nodejs version

We have removed the parts that we consider useless related to projects mentionned above (including browser emulation inside node, bittorrent and Peersm video streaming), but they still can be usefull for some potential uses, you can find them in [removed](https://github.com/Ayms/node-Tor/tree/master/lib/src/removed)

The full initial code can be found [here](https://github.com/Ayms/node-Tor/tree/master/lib/src/removed/node-tor-original.js) if needed (good luck...this is a complex monolithic block with many options)

We did keep the Peersm interface doing the OP to connect to Tor nodes, fetch the web or download from other peers, as well as the ORDB function for the ORs (please see the original doc https://github.com/Ayms/node-Tor/tree/master/README-old.md

## Installation

Install node and unzip [master](https://github.com/Ayms/node-Tor/archive/master.zip)

## Browser interface

Please see the Browserify and Test configuration sections

For now we have removed the demo interface but you can look at the test configuration below

Please not also that this configuration has been maintained for demo purposes only (and testing purposes, if the whole chain from the browser to the Tor nodes work then it becomes unlikely that something is incorrect in your code) without any focus on security considerations and usability since it has been simplified from the initial Peersm project, it is not the main purpose of this project, the main purpose being to allow the use of the Tor protocol inside browsers and on server side for your own projects, it can have some bugs and if circuits don't get created refresh the page

## Setting up your environment

For both processes below you can make it periodic by uncommenting the related call in ``node-tor.js``

See a concrete example here: https://github.com/Ayms/node-Tor/issues/20#issuecomment-1058021169

### Create your keys and publish your node

Create a directory ``OR_name`` in lib directory (for example OR1, note that only regular characters must be used for the names of the routers)

Run ``node publish.js OR_name OR_IP:OR_port version email``

This will create your onion key and long term ID key in the ``OR_name`` directory, then you must use that name when you launch the OR

You can also do this manually, please see an example [here](https://github.com/Ayms/node-Tor/tree/master/streaming-deprecated#node-tor-bridge-websocket-server-installation)

And this will publish your node to the Tor authorities who will add your node into the Tor consensus

Note that this is not mandatory, some years ago it appeared that a Tor node would not extend to you if you were not in the consensus, apparently this rule does not apply any longer but if you don't register you might be seen as a bridge

By default a small bandwidth will be advertised for your node, this is to discourage other nodes to choose your node, you can change it in ``publish.js``, and the version advertised is "node-Tor "+version (advised value: 1.0.0)

An unused ntor-onion-key is used in the publish descriptor, basically the base64 encoding of the sha256 of "Thanks Ayms this module is great", we don't know why it is mandatory for nodes that do not implement elliptic crypto (apparently it's a Tor project bug when releasing 0.2.4)

You can check that the process was successful by doing from the browser ``IP:port/tor/server/fp/<fingerprint>`` where fingerprint is the one displayed in the result of the call to ``publish.js`` and is the one to be used when you launch the OR, and where IP:port is the IP/port of an authority, you can also check that your node appears in [onionoo relay serach](https://metrics.torproject.org/rs.html)

If you don't want to publish (which we think is not really considered as good practices by the Tor community) you can comment the calls to ``publish`` at the end of ``publish.js``, please note that the authorities might change over time, then you musk keep the list up to date in ``publish.js``, and once you have published the autorities will check your node periodically sending VERSION cells

### Update the routers

Tor routers are stored in ``guards.js`` and ``exit.js``, by default ``Relays`` are equal to ``Guards`` in node-Tor

To update the list, run ``node build-relays_and_dirs.js OR_name``, this will query [onionoo](https://metrics.torproject.org/onionoo.html), select the nodes that have a good bandwidth and test them one by one sending VERSION cells to them (OR_name is the same as above and just used to emulate the tls connections to test other nodes), then this will store the working nodes in guards and exit files

It is important to update the nodes at least once a week since the onion keys are supposed to be rotated and Tor routers are for a big part not really stable

## Use

What starts everything is always a simple call to the ``Tor`` function or the use of ``handleRequest`` function

Launch the OR:

	Tor({params_:{port:OR_port}})

The OR will listen/create tls sockets with Tor circuits, it can perform the OP also if connected via SOCKS proxy, we don't really see the use case except for testing purposes and it should not be encouraged, probably it could instead be extended to support [Shadowsocks](https://shadowsocks.org/en/index.html)

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

Once some circuits are created you can create a ``request`` object with the ``one_c`` property set to true (see the Tor function), you can then simply call:

	Tor(request)

Which will select a circuit (associated to the initial socket via its ``socket_`` property) among those available in ``OP_sock`` and call ``circ.process(request)``, please see an example starting by the ``load`` function in ``browser2.js``, this will typically initiate a ``RELAY_BEGIN`` message establishing a TCP connection from the exit node to the target node (or site) and stream data through the established connection and anonymized circuits, received data is processed via the ``_write_`` property of the ``request`` object (which in our test configuration stores the data as chunks of Blobs inside indexedDB, see the ``load_Blob`` function

You can of course set all of this the way you like

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

This is just an example of use, by default the test configuration calls ``monitor_circuits`` periodically which will create up to 6 circuits, the first one being the ORDB circuit (if it fails the other circuits will not be created), you can change this removing the check of ``db_cid`` in ``choose_circuits`` and removing the check also in ``monitor_circuits`` (or changing the NB parameter) to create one to NB normal circuits

## Browserify

Please see [browserify](https://github.com/Ayms/node-Tor/tree/master/browserify)

To setup your test configuration you need to put the right parameters in ``node-tor.js`` for ``one_OR`` (who is the OR the browser will connect to via WebSockets) and ``DB_OR`` who is the OR performing the ORDB function, then launch the two ORs as explained above and serve the file ``index.html``

You must also xhr ``Guards.js`` and ``Exit.js`` built with ``build-relays_and_dir.js`` (see above) from your server or ours in ``browser2.js``

## Specific settings

Again the intent is not to add Tor nodes inside the Tor network, unlike the common belief the Tor network is very centralized, this implementation is more oriented for decentralized networks (and for p2p we think that two hops are enough since the guards concept does not apply, as well as tls, the Tor protocol does not need it), so following simplifications/specific settings apply:

- tls and onion keys are the same, not a big deal and not difficult to change
- tls certificates have always the same certid (see the bug below, this is an umpteenth openssl unfortunate change and is a won't fix for us for now despite of the fact that it allows fingerprinting)
- the onion keys are not rotated, this can easily be done via an external process
- CERTS cells and AUTH are implemented but not checked, as well as NETINFO
- the Exit function is not implemented for obvious reasons, it's of course trivial to implement
- CREATE_FAST are used from the browser to test the whole chain, now the use of CREATE_FAST should be discouraged for any implementation
- the directory/consensus features are not implemented (so for example you cannot proxy the Tor browser directly to node-Tor via SOCKS proxy, which is anyway not a good idea at all)
- we don't know how secure is the nodejs and browser prng
- forge buffers are used for some features, note that they are fast (faster in fact than nodejs Buffers and ArrayBuffers when we were testing streaming)
- MESSAGE2 with elliptic crypto are not implemented for now, probably this would be a good idea to do it so we get rid of RSA, PEM, DER formats for p2p implementations (phase 5), please note that for publishing nodes an unused curve25519 ntor-onion-key (ie a 32B buffer) is used in the descriptor

## Related bugs/issues

* [indexedDB broken - UnknownError - Error opening Database](https://bugzilla.mozilla.org/show_bug.cgi?id=944918) : we did open this bug end of 2013 (indexedDB is used by Peersm to store downloaded content by chunks), unfortunately, as you can see, it might survive us, quite annoying bug since it destroys indexedDB and everything that was in there when it happens (usually after a FF upgrade)
* [Undeprecate tls.createSecurePair](https://github.com/nodejs/node/issues/29559) : closed, we moved to TLSSocket and it looks to be the right way finally
* [Advisory for SSL problems with leading zeros on OpenSSL 1.1.0](https://icinga.com/2017/08/30/advisory-for-ssl-problems-with-leading-zeros-on-openssl-1-1-0/) : probably this is the issue with certid, please see the comment in abstract-tls, we will not fix it
* [Security error when trying to set a non SSL/TLS Websocket from a https page](https://bugzilla.mozilla.org/show_bug.cgi?id=917829) and this thread [WS/Service Workers, TLS and future apps - was Re: HTTP is just fine](https://lists.w3.org/Archives/Public/public-webapps/2015OctDec/0187.html), this is why the browser page can't be https, because the specs forbid a fallback to ws and of course wss can't be used since the nodes have self-signed certificates, this is a misdesign of the web but nobody wants to admit/correct it
* [ISSUE 22 - Re: Incomplete blocks](https://lists.w3.org/Archives/Public/public-webcrypto-comments/2013Feb/0016.html), this relates to the fact that only the Tor project in the world uses progressive hash stopped for each chunk (cells data), which means that it closes the hash for each cell received and then restarts from the previous state, this is not supported by anybody, neither openssl, Webcrypto or NSS, that's the purpose of the specific ``Hash`` function modifying forge hash to allow this, please see https://github.com/Ayms/node-Tor/tree/master/ext/my_sha1.js (this does not impact the aes encryption, my_aes.js is just a repackaging of aes to make it behave the nodejs way)
* [Relay_extended - hash and padding - specs are wrong or unclear](https://trac.torproject.org/projects/tor/ticket/32830#comment:4) - little change accepted by the Tor project team
* [Chaining pipe for streams - probably stupid question but...](https://github.com/nodejs/help/issues/2384) - the initial question was indeed stupid, now it is probably a misdesign of nodejs that a.pipe(b).pipe(a) creates an infinite loop and we have to use two duplex streams for the way back and forward instead of one
* [TLS - nothing looks to be working](https://github.com/digitalbazaar/forge/issues/758) - tls for https in node-Tor demo is implemented in tls.js but does not work, see the bug report

## Notes for the devs

This project has been maintained over years but it has been a huge work to clean everything and make it modular, and at the end is very small for what it does, now some parts might still need some changes, please keep in mind that it was quite difficult at the time it was developped to put everything inside browsers with associated crypto, that's why the previous code ended up to be a monolith

The same code is used at nodejs and browser side, then the browser has exactly the same functions than nodejs (and could therefore act as an OR as well)

Globals are used at the nodejs level (see the note for browsers in Browserify section), most of them can be splitted as local variables inside modules but not all, this is not an issue and comes from the initial design since at the beginning the code was not intended to be modular (and then no globals were used), changing this impacts a lot of things, this might be a TODO (as well as implementing the elliptic crypto)

If you PR something (please wait that we remove the experimental notice above, in the meantime you can email us) please make sure that the test configuration works for each type of circuit and download also (then it becomes unlikely that something is wrong)

## Peer review

This project has been quickly scanned by [ROS](https://radicallyopensecurity.com/) experts, it is useless to say that when you create an app using node-Tor inside browsers you must not do inept things like injecting the content donwloaded via the anonymized circuits inside the page to fetch resources outside of them (and then deanonymize you), this is the very purpose of the proxyJS concept in the Convergence proposal

## Related projects :

* [Discover and move your coins by yourself](https://peersm.com/wallet)
* [Ayms/bitcoin-transactions](https://github.com/Ayms/bitcoin-transactions)
* [Ayms/cashaddress](https://github.com/Ayms/cashaddress)
* [Ayms/bitcoin-wallets](https://github.com/Ayms/bitcoin-wallets)
* [Ayms/zcash-wallets](https://github.com/Ayms/zcash-wallets)
* [Ayms/bittorrent-nodeid](https://github.com/Ayms/bittorrent-nodeid)
* [Ayms/torrent-live](https://github.com/Ayms/torrent-live)
* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Interception Detector](http://ianonym.peersm.com/intercept.html)
* [Ayms/abstract-tls](https://github.com/Ayms/abstract-tls)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)
* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)