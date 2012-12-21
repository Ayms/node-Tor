node-Tor
===

Node.js Javascript implementation of a Tor (or Tor like) anonymizer network (The Onion Router https://www.torproject.org/)

Anonymity into your browser everywhere from any device, see https://www.github.com/Ayms/iAnonym

## Presentation:

This is an unofficial implementation of the Tor (or Tor like) protocol (Onion Proxy and Onion Router) which anonymizes communications via the Tor (or Tor like) network. This allows to simply connect to the Tor (or Tor like) network and use it, as well as creating and adding nodes into the network.

This repository is a subset of the complete version which is not public for now, see below "node-Tor Status".

## Install :

Install node.js on supported platforms : Unix, Windows, MacOS

For the record, you need the following to run node-Tor :

	node.js version >= v0.7.5 (getDiffieHelman function needed)
	openssl version >= 1.0.1 (aes counter mode encryption required - evp_aes_128_ctr)
	python >= 2.6 (node.js's requirement)
	
####Current release of node.js is v0.8.14 with openSSL 1.0.0f
	
Then as usual :

	npm install node-Tor

or

    git clone http://github.com/Ayms/node-Tor.git
    cd node-Tor
    npm link
	
If you encounter installation problems, you might look at :

	https://github.com/joyent/node/issues/3574 (openssl)
	https://github.com/joyent/node/issues/3504 (python)
	https://github.com/joyent/node/issues/3516 (node.js)
	
####Windows installation : you must wait for now, please see here why and how to proceed if you really want to install it on windows http://dailyjs.com/2012/05/17/windows-and-node-3/

To launch it, you need to be in the lib directory (some small inconvenient that will be fixed) :

	node node-tor.js

## Tor Network principles :

Specifications of the Tor protocol and associated protocols are available here : https://www.torproject.org/docs/documentation.html.en (Design documents and official repository source tree).

As a simplified summary, the Tor network is composed of Onion Proxys (OP) and Onion Routers (OR). The OP is usually located on the device that your are using to establish communications (ie on your PC for example), because communications between the application sending the instructions to the OP and the OP are not always protected. While operating, the OP does maintain a file retrieved from the Directory nodes giving it what it needs to know about the ORs to establish circuits.

To establish a connection, the OP does choose a path of n ORs (the first one being theorically a Guard node, the last one being an Exit node), creates a circuit with the first OR, and then extends the circuit with each OR choosen in the path consecutively via each OR, communications between the ORs and the OP are encrypted several time along the path (onion skin) with the keys negociated with each ORs, in that way each OR only knows the preceding and next OR along the path and can not understand a content that is not addressed to him.

The Exit OR does decrypt the content, establish a TCP connection with the target server and send the instructions received (get HTTP, etc)

The ORs are maintaining onion RSA keys to negociate the different keys needed for the communications with the OP, these keys are rotated once a week and the directory servers are updated by the ORs accordingly.

The OP is maintaining different circuits inside the Tor Network in order to be able to quickly switch from a circuit to another, this does enforce anonymity and prevent circuit errors that can occur.
	
## node-Tor Goals and possible Future :

The intent of this project is to provide Tor mechanisms in a web language, so it might open the Tor (or Tor like) network to web languages interfaces.

It might be easier to install, will not depend on specific applications and can interact with js modules, then it might be possible to easily build web/js applications on top of it (chat, etc).

Implementation of the OP/OR part directly into the browser is ongoing, see http://www.ianonym.com and https://www.github.com/Ayms/iAnonym .

This could possibly federate the different Tor (or Tor like) projects and Tor (or Tor like) Browser Bundle into one unique code (OP, OR, Tor controller, TorButton, vidalia, tor2web, privoxy,etc)

Beside anonymity, node-Tor can have other multiple uses, for example it can be used to access services in a way that the service providers can not detect you based on the requests that you are sending (see Related projects below), more to come.

node-Tor's nodes could be used to create complementary and/or parallel networks, implementing completely, partially or not the Tor protocol or a derived one, using completely, partially or not the Tor network, it can be used to create separated Tor like networks.

More to come again

## node-Tor Status :

This repo is showing a working "proof of concept" version implementing partially the OP part (see the TODOs in the code), it can not be used as such.

It does allow to establish n connections with the ORs, then n circuits for each connection and n streams for each circuit. In practice only a few connections and circuits are supposed to be opened, then trafic is streamed along these few circuits.

The complete version (OP and OR) is not public for now, please contact us for more information. 

## node-Tor OP :

This is the most complicate part, mainly due to the difficulty of establishing stable circuits into the Tor network where unexpected events are not rare.

It can happen that the Directory servers are not up to date, then the retrieved keys for a given OR might not be the good ones. The current implementation (that might change later) does retrieve an "almost" trustable list of Guards, Relays, Exit and Directory servers, for this you need to run the script ./lib/build-relays_and_dirs.js periodically (which uses Onionoo https://onionoo.torproject.org/details?running=true to get the initial information, wait for the message 'End Relays' announcing that the script is finished), this does create the guards.js, relays.js, exit.js and dirs.js files used by node-Tor to select the ORs. The script does some testing to check that the ORs are alive and responding correctly, and then tries to select trustable ORs, future implementations will update the lists automatically or might completely change.

Node-Tor OP does support currently only the V3 handshake with Guards, therefore Guards's release must be >= 0.2.3.6, the script mentioned above does select it automatically.

Unlike Tor project, node-Tor does not maintain and parse a file containing all information about all routers. node-Tor can retrieve real-time the information needed from the Directory servers or from the above script's output which is updated periodically.

Instructions to the OP can be sent via :

	socks v5 proxy : you can configure your browser to use socks proxy with server:port where is installed the OP
	websosckets : see ./lib/client.html simple example
	direct proxy : establish TCP connection with the OP and send the requests 
	
Socks requests are passed transparently, websockets and direct proxys can send usual HTTP GET requests for example or specific customized requests to pass parameters that you need to node-Tor, see below.

It is planned to add some changes mechanisms to incoming streams in order not to ease fingerprinting.

## node-Tor OP options :

* OP_port : OP TCP port (used for SOCKS proxy, websockets through SOCKS proxy, direct websockets and direct proxys) or OR websocket server port (see WS_OP_SOCKS below)
* OR_port : OR port for TLS connections
* OR_wsport : OR port for OR websocket server (see WS_OP below)
* OP : true indicates that this is an OP request (same code is used for OP and OR)
* OR and OR_f : OR request, backward and forward (_f)
* host : destination server (server_address:port)
* nb_hop : number of hops for a circuit, default 3, max 5
* one_c : see next section
* one_OR : first OR in the path when set, otherwise the first OR is randomely choosen
* WS_OP : if true the OP communicates with the OR via direct websockets, the OR implements a WS server
* WS_OP_SOCKS : if true the OP communicates with the OR using websockets via SOCKS proxy, the OR implements a TCP/SOCKS server,non websocket socks proxy messages are relayed to the OP via websockets over socks proxy
* WS_OP and WS_OP_SOCKS are exclusive
* anonym : if true switch to ArrayBuffers and iAnonym processing, see [Ayms/iAnonym](https://github.com/Ayms/iAnonym) and [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)
* NB / CIRC_KA: number of circuits kept alive permanently and renewed every CIR_KA time
* privkey : OR private key

For now the certificates used for SSL connections with Guards are files in ./lib and can be generated as indicated here http://nodejs.org/api/tls.html . It is planned to generate it dynamically.
	
## node-Tor OP circuits :

If the one_c option is "true", the OP will open a few circuit and stream all incoming streams along these circuits, if "false" the OP will create a circuit for each stream, which takes more resources and is much longer.

If one_c is true, the OP does establish and change circuits randomly. TODO give more details.

See https://gitweb.torproject.org/torspec.git?a=blob_plain;hb=HEAD;f=path-spec.txt and https://www.torproject.org/docs/faq.html.en#EntryGuards and links (security issues regarding path creation, in theory the exit node should be fixed too).

## node-Tor OP security :

As explained above the communications between the application and the OP can be seen at the OP level, or between the application and the OP (except if you are using https or such encrypted protocol between the application and the target, see below), therefore you should normally insure that the OP is installed at a place that you are the only one to be able to access, and a place where the application is supposed to be too since communications with both can be intercepted.

If you are using https or such specific encrypted protocol, the communications between the application and the OP (via the socks proxy protocol), as well as between the exit node and the target one can not be seen.

Main Tor project security features are implemented but some are still pending (see TODO in the code, authentication during the handshake for example and some other checks during circuit creation)

## node-Tor OP response time :

Unexpected events in Tor Network can cause large delays, mainly to establish circuits, node-Tor OP is doing its best to retrieve information and create circuits as fast as possible, as soon as it does not receive the answer from a given router within an acceptable timeframe, the OP switches instantly to another one.

It can happen that some ORs do persist not to answer correctly, it might be planned to learn from the ORs and banish failing ORs or strange ones.

## node-Tor OR :

Implemented and includes the websocket Tor protocol extension.

## Tests :

See an example of communication in [logs OP and OR] (https://github.com/Ayms/node-Tor/blob/master/test/example.txt)
	
## Related projects :

http://www.ianonym.com

* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)

node-Tor can advantageously be coupled for example with :

* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)

## Support/Sponsors :

If you like this project you can contact us and/or possibly donate : donate at jcore.fr or via PayPal
