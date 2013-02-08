node-Tor
===

Javascript implementation of a Tor (or Tor like) anonymizer network (The Onion Router https://www.torproject.org/)

Anonymity into your browser everywhere from any device, see https://www.github.com/Ayms/iAnonym

## Presentation:

This is an unofficial and extended implementation of the Tor (or Tor like) protocol (Onion Proxy and Onion Router) which anonymizes communications via the Tor (or Tor like) network. This allows to simply connect to the Tor (or Tor like) network and use it, as well as creating and adding nodes into the network, creating complementary and/or parallel networks, implementing completely, partially or not the Tor protocol or a derived one, using completely, partially or not the Tor network, it can be used to create separated Tor like networks.

####But the most challenging goals are to put the OP and the OR inside the browsers.

####It's done for the OP : 9th February 2012's first successfull complete communication from the browser with the js OP totally inside the browser, see the results [First loading - in black the OR,in white the OP inside the browser with web console messages] (http://www.ianonym.com/img/first_browser_page3.jpg) 

It's already quite fast while no optimization efforts have been made.

Now we can envision the OR inside the browsers too.

This repository is a subset of the complete version, the complete version is stable but not public for now, see below "Why is the complete version not public?" and "node-Tor Status".

See live test possibility in section "Tests".

## Why is the complete version not public?

The complete version does include the OP and OR parts, websocket protocol extension, socks proxy interface + all communication interfaces for both (tcp, http, tls, websockets), the OP inside the browser (+ everything that is required : crypto, websocket, array buffer, etc - see [iAnonym](https://www.github.com/Ayms/iAnonym) ) and proxy auto config mechanisms.

Speechless to say that it's a huge and complicate work, but javascript's magic makes that the complete code is only about 4000 lines (certificates handling and TLS are not implemented for the browser part), the complete code with third party modules minified is about 200 KB.

It does offer numerous easy possibilities to access anonymizer networks or create your own and do whatever you like inside them. It's really fast and much faster than everything that exists.

Then we are a bit concerned about what people could do with it, that's why it's not public for now.

And we are concerned about how to finance it too.

## Tests :

See an example of communication in [logs OP and OR] (https://github.com/Ayms/node-Tor/blob/master/test/example.txt)

You can try it live :
* set the socks proxy V5 interface of your browser to IP 213.246.53.127 port 8100 (on Firefox : Options/Advanced/Network/Parameters/Manual configuration of proxy), clear the cache/history, close your browser and reopen it
* enter url http://www.lepoint.fr or http://www.monip.org

For security reasons this test address is restricted to the domains www.lepoint.fr, www.monip.org and related IP addresses, then while loading the pages the network will not fetch resources outside of these domains (for example facebook widget on www.lepoint.fr will display "outside of authorized domains") but this is enough to give an idea and you can navigate inside the domains.

www.lepoint.fr is a "usual" huge public site that does include whatever messy stuff the web has invented, so it's a good test site.

www.monip.org allows you to see your anonymized IP address (if you refresh the page you will see that your anonymized IP address can change since different circuits can be used inside the network).

Depending on the "health" of the circuits and associated routers when you try it, the delay for page loading might vary but it is usually fast.

The test configuration is :

	[Browser] <--socks--> [node-Tor_OP:8100] <-----> [node-Tor_OR] <-----> [Tor Network] <-----> [Site] 

## Install :

Install node.js on supported platforms : Unix, Windows, MacOS

For the record, you need the following to run node-Tor :

	node.js version >= v0.7.5 (getDiffieHelman function needed)
	openssl version >= 1.0.1 (aes counter mode encryption required - evp_aes_128_ctr)
	python >= 2.6 (node.js's requirement)
	
####Current release of node.js is v0.8.18 with openSSL 1.0.0f
	
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

To establish a connection, the OP does choose a path of n ORs (the first one being theorically a Guard node, the last one being an Exit node), creates a circuit with the first OR, and then extends the circuit with each OR choosen in the path consecutively via each OR, communications between the ORs and the OP are encrypted several time along the path (onion skin) with the keys negociated with each ORs, each OR only knows the preceding and next OR along the path and can not understand a content that is not addressed to him.

The Exit OR does decrypt the content, establish a TCP connection with the target server and send the instructions received (get HTTP, etc)

The ORs are maintaining onion RSA keys to negociate the different keys needed for the communications with the OP, these keys are rotated once a week and the directory servers are updated by the ORs accordingly.

The OP is maintaining different circuits inside the Tor Network in order to be able to quickly switch from a circuit to another.
	
## node-Tor Goals and possible Future :

####This section is a bit obsolete now, there are numerous possibilities mentioned below, the most challenging ones are to put the OP and the OR inside the browsers, it's done for the OP, now it has to be worked for the OR.

The intent of this project is to provide Tor mechanisms in a web language, so it might open the Tor (or Tor like) network to web languages interfaces.

It is easier to install and to scale, does not depend on specific applications and can interact with js modules, then it is possible to easily build web/js applications on top of it (chat, etc).

Implementation of the OP/OR part directly into the browser is ongoing, see http://www.ianonym.com and https://www.github.com/Ayms/iAnonym .

This could possibly federate the different Tor (or Tor like) projects and Tor (or Tor like) Browser Bundle into one unique code (OP, OR, Tor controller, TorButton, vidalia, tor2web, privoxy,etc)

Beside anonymity, node-Tor can have other multiple uses, for example it can be used to access services in a way that the service providers can not detect you based on the requests that you are sending (see Related projects below), more to come.

node-Tor's nodes can be used to create complementary and/or parallel networks, implementing completely, partially or not the Tor protocol or a derived one, using completely, partially or not the Tor network, it can be used to create separated Tor like networks.

## node-Tor Status :

This repo code source is showing a working subset version implementing the OP part, it can not be used as such.

It does allow to establish n connections with the ORs, then n circuits for each connection and n streams for each circuit. In practice only a few connections and circuits are supposed to be opened, then traffic is streamed along these few circuits.

The complete version does implement the OP and OR parts extended with the Websocket protocol extension (see below), it is stable and can be tested (see the "Tests" section), it is not public for now, please contact us for more information. 

## node-Tor OP :

Unlike Tor project, node-Tor does not maintain and parse a file containing all information about all routers.

The OP does retrieve real-time periodically a trustable list of working Guards, Relays and Exit nodes running the script ./lib/build-relays_and_dirs2.js periodically which creates the guards.js, relays.js and exit.js files used by node-Tor to select the ORs. The script does some testing to check that the ORs are alive and responding correctly and retrieve the required information for routers : {fingerprint-OR_IP:OR_port-bandwidth-DIR_IP:DIR_PORT-Onion_RSA_PUBLIC_KEY}

Node-Tor OP does support the V3 handshake with Guards, if Tor project's Guards are used, their release must be >= 0.2.3.6, the script mentioned above does select it automatically.

Instructions to the OP can be sent via :

	socks v5 proxy : you can configure your browser to use socks proxy with server:port where is installed the OP
	websosckets : directly or via socks proxy
	direct proxy (not recommended) : establish TCP connection with the OP and send the requests 
	
Socks requests are passed transparently, websockets and direct proxys can send usual HTTP GET requests for example or specific customized requests to pass parameters that you need to node-Tor, see below.

## node-Tor OP options (subset) :

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
* window :  switch to ArrayBuffers instead of node.js's buffers (default is true)
* window_browser : switch to js cryptography instead of node.js's one (true for the OP inside the browser, false for the OR)

For now the certificates used for TLS connections with Guards are files in ./lib and can be generated as indicated here http://nodejs.org/api/tls.html. It will be generated dynamically.
	
## node-Tor OP circuits :

If the one_c option is "true", the OP will open a few circuit and stream all incoming streams along these circuits, if "false" the OP will create a circuit for each stream, which takes more resources and is much longer.

If one_c is true, the OP does establish and change circuits randomly, a certain number of circuits are always kept alive and renewed periodically, datas are streamed along these circuits randomely.

See https://gitweb.torproject.org/torspec.git?a=blob_plain;hb=HEAD;f=path-spec.txt and https://www.torproject.org/docs/faq.html.en#EntryGuards and links (security issues regarding path creation, in theory the exit node should be fixed too).

## node-Tor OP security :

As explained above the communications between the application and the OP can be seen at the OP level, or between the application and the OP (except if you are using https or such encrypted protocol between the application and the target, see below), therefore you should normally insure that the OP is installed at a place that you are the only one to be able to access, and a place where the application is supposed to be too since communications with both can be intercepted.

If you are using https or such specific encrypted protocol, the communications between the application and the OP (via the socks proxy protocol), as well as between the exit node and the target one can not be seen.

## node-Tor OP response time :

node-Tor OP is doing its best to create circuits as fast as possible, as soon as it does not receive the answer from a given router within an acceptable timeframe, the OP switches instantly to another one.

## node-Tor OR and OP :

Extended with the Websocket protocol extension (RELAY_WS and RELAY_ASSOCIATE):

This is specific to [Ayms/iAnonym](https://github.com/Ayms/iAnonym).

Cells :

	--- New :
	120 -- CREATE_FAST_WS
	121 -- CREATED_FAST_WS
	
	Variable-length command values are:
	7 -- VERSIONS    (Negotiate proto version) (See Sec 4)
	128 -- VPADDING  (Variable-length padding) (See Sec 7.2)
	129 -- CERTS     (Certificates)            (See Sec 4.2)
	130 -- AUTH_CHALLENGE (Challenge value)    (See Sec 4.3)
	131 -- AUTHENTICATE (Client authentication)(See Sec 4.5)
	132 -- AUTHORIZE (Client authorization)    (Not yet used)
	--- New :
	190 -- RELAY_WS

Streams :

	The relay commands are:
	1 -- RELAY_BEGIN     [forward]
	2 -- RELAY_DATA      [forward or backward]
	3 -- RELAY_END       [forward or backward]
	4 -- RELAY_CONNECTED [backward]
	5 -- RELAY_SENDME    [forward or backward] [sometimes control]
	6 -- RELAY_EXTEND    [forward]             [control]
	7 -- RELAY_EXTENDED  [backward]            [control]
	8 -- RELAY_TRUNCATE  [forward]             [control]
	9 -- RELAY_TRUNCATED [backward]            [control]
	10 -- RELAY_DROP      [forward or backward] [control]
	11 -- RELAY_RESOLVE   [forward]
	12 -- RELAY_RESOLVED  [backward]
	13 -- RELAY_BEGIN_DIR [forward]
	--- New :
	40 -- RELAY_ASSOCIATE
	41 -- RELAY_WS
	42 -- RELAY_INFO

RELAY_WS cells act the same as RELAY cells but with a variable length (limited to 65535 bytes) allowing to transfer larger amount of data over the websocket interface more efficiently , they are used to transport RELAY_WS streams.

RELAY_WS and RELAY_ASSOCIATE streams are only exchanged between the OP and first OR.

RELAY_WS cells, RELAY_WS and RELAY_ASSOCIATE streams are only used in the context of [Ayms/iAnonym](https://github.com/Ayms/iAnonym) project, for normal websocket streaming between the OP and the OR the usual RELAY cells are used.

RELAY_ASSOCIATE streams are sent with RELAY cells, their payload is just : [fake_domain], while receiving a RELAY_ASSOCIATE stream on circuit CID, the OR does associate fake_domain to CID, this circuit will be dedicated for the OP and OR to stream RELAY_WS cells. CID is a specific circuit that only exists between the OP and the OR (ie is not extended). The OR might send to the OP a RELAY_ASSOCIATE stream too (see "Notes" in Details [iAnonym](https://www.ianonym.com) ), in that case the OP must close the page, generate a new fake_domain and restart the process.

RELAY_WS streams payload is :
* Length  [2 bytes]
* Addr    [Length bytes]
* Request [CELL_LEN - Length bytes - 14 bytes]

Where Addr and Request are :
 
from the OR : 
* Addr :	socks_request_remoteAddress:socks_request_remotePort:socks_request_connexion_port:socks_request_id
* Request :	socks_request_message (incoming from browser)

If Request is empty, the OR will end the associated socks request.

from the OP :
* Addr :	socks_request_remoteAddress:socks_request_remotePort
* Request :	socks_request_message (responses from network)
 
RELAY_WS cells are behaving exactly as RELAY cells in terms of encryption and hash, they are transported over the websocket interface and therefore encoded with the websocket protocol.

The non specific iAnonym signaling traffic (circuit creation, RELAY[RELAY_BEGIN, RELAY_CONNECTED, RELAY_DATA]) is transported over the websocket interface too between the OP and first OR using different circuits than CID. Since the fake_domain is common to all urls, the browser will try to stream the requests opening only a few socks connections, the OP will stream the traffic with already relay_connected streams for the real hostname associated to the fake_domain and open new connections if the real host is different.

CREATE_FAST_WS and CREATED_FAST_WS are the same as CREATE_FAST and CREATED_FAST except that X (OP to OR) is encrypted with the public onion key of the OR and Y (OR to OP) is encrypted with aes-128-ctr and the 16 first bytes of X. This is because secure websocket (wss) can not be used between the browser and the OR since the OR certificates are not valid, this does prevent that someone gets in clear X and Y. This is used only to set CID above and will be removed when RSA OAEP and Diffie-Hellman are available inside the browser, see below, then the fast circuit creation cells will not be used any longer.

RSA OAEP and Diffie-Hellman are not implemented inside the browser for now. So as a temporary mechanism the RELAY_INFO streams are used to get from the OR the computation of RSA OAEP and DH, RELAY_INFO streams are transported (encrypted) with RELAY_WS cells over CID :

				OP request                    OR response
	[01][ID 16 bytes][public modulus] - [ID][X_length][X][Onion]
	[02][ID 16 bytes][Y]              - [ID][DH secret(X,Y)]
	
The ID is randomely generated and identifies a transaction.

The OR knows the secret keys but does not know for what circuits/ORs in the path, but it's not impossible to correlate, therefore this will be removed as soon as RSA OAEP and DH are available inside the browser.
	
## Related projects :

http://www.ianonym.com

* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)

node-Tor can advantageously be coupled with :

* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)

## Support/Sponsors :

If you like this project you can contact us and/or possibly donate : donate at jcore.fr or via PayPal.

## Some words :

The recent disparition of Aaron Swartz was a shock for us as for everybody. We did not know each other but exchanged a few emails where he suggested briefly just "to implement all of Tor in JavaScript" while our intent at that time was only to access the network using server side javascript. Apparently Aaron meant to put it inside the browser recognizing a kind of technical challenge. With this idea in mind we did node-Tor and came up with iAnonym for the browser implementation, Aaron was aware of part of the result, hopefully this might help serving the causes he defended that we support too.




