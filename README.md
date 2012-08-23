node-Tor
===

Node.js Javascript implementation of the Tor anonymizer project (The Onion Router https://www.torproject.org/)

## Presentation:

This is an unofficial implementation of the Tor protocol (Onion Proxy and Onion Router) which anonymizes communications via the Tor network. This allows to simply connect to the Tor network and use it, as well as adding nodes into the network.

## Install :

Install node.js on supported platforms : Unix, Windows, MacOS

For the record, you need the following to run node-Tor :

	node.js version >= v0.7.5 (getDiffieHelman function needed)
	openssl version >= 1.0.1c (aes counter mode encryption required)
	python >= 2.6 (node.js's requirement)
	
####Current release of node.js is v0.8.7 with openSSL 1.0.0f
	
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

As a simplified summary, the Tor network is composed of Onion Proxys (OP) and Onion Routers (OR). The OP is usually located on the device that your are using to establish communications (ie on your PC for example), because communications between the application sending the instructions to the OP and the OP are not protected. While operating, the OP does maintain a file retrieved from the Directory nodes giving it what it needs to know about the ORs to establish circuits.

To establish a connexion, the OP does choose a path of n ORs (the first one been a Guard node, the last one been an Exit node), creates a circuit with the first OR, and then extends the circuit with each OR choosen in the path consecutively via each OR, communications between the ORs and the OP are crypted several time along the path (onion skin) with the keys negociated with each ORs, in that way each OR only knows the preceding and next OR along the path and can not see a content that is not addressed to him.

The Exit OR does decrypt the content, establish a TCP connection with the target server and send the instructions received (get HTTP, etc)

The ORs are maintaining onion RSA keys to negociate the different keys needed for the communications with the OP, these keys are rotated once a week and the directory servers are updated by the ORs accordingly.

The OP is maintaining different circuits inside the Tor Network in order to be able to quickly switch from a circuit to another in order to enforce anonymity and prevent circuit errors that can occur.
	
## node-Tor Goals and possible Future (related to Tor Project) :

The intent of this project is to provide Tor mechanisms in a web language, so it might open the network to web languages interfaces.

It might be easier to install, will not depend on specific applications and can interact with js modules, then it might be possible to easily build web/js applications on top of it (chat, etc).

It is not unrealist to envision the OP part directly into the browser, for example the OR Guards could implement the wss protocol, or future harmony modules could be used, or as a plugin.

This could then possibly federate the different Tor projects and Tor Browser Bundle into one unique code (OP, OR, TorButton, vidalia, tor2web, privoxy,etc)

## node-Tor Goals and possible Future (not related to Tor Project) :

Beside anonymity, node-Tor can have other multiple uses, for example it can be used to access services that used to be free but that are not any longer (even if yourself did contribute to it!!!) in a way that the service providers can not detect you based on the requests that you are sending (see Related projects below), more to come.

node-Tor's nodes could be used to create complementary and/or parallel networks, implementing completely, partially or not the Tor protocol or a derived one, using completely, partially or not the Tor network, depending on the uses.

More to come again

## node-Tor Status :

This is a working prototype for now implementing the OP part, see the TODOs in the code.

It does allow to establish n connections with the ORs, then n circuits for each connection and n streams for each circuit. In practice only a few connections and circuits are supposed to be opened, then trafic is streamed along these few circuits.

## node-Tor OP :

This is the most difficult part, mainly due to the difficulty of establishing stable circuits into the Tor network where unexpected events are not rare.

It can happen that the Directory servers are not up to date, then the retrieved keys for a given OR might not be the good ones. The current implementation (that might change later) does retrieve an "almost" trustable list of Guards, Relays, Exit and Directory servers, for this you need to run the script ./lib/build-relays_and_dirs.js periodically (which uses Onionoo https://onionoo.torproject.org/details?running=true to get the initial information, wait for the message 'End Relays' announcing that the script is finished), this does create the guards.js, relays.js, exit.js and dirs.js files used by node-Tor to select the ORs. The script does some testing to check that the ORs are alive and responding correctly, and then tries to select trustable ORs, future implementations will update the lists automatically or might completely change.

Node-Tor OP does support currently only the V3 handshake with Guards, then Guards's release must be >= 0.2.3.6, the script mentioned above does select it automatically.

Then unlike Tor project, node-Tor does not maintain and parse a file containing all information about all routers, and then node-Tor does retrieve real-time the information needed from the Directory servers and can switch routers in case the information received is not up to date.

Instructions to the OP can be sent via :

	socks v5 proxy : for example you can configure your browser to use socks proxy with server:port where is installed the OP
	websosckets : see ./lib/client.html simple example
	direct proxy : establish TCP connection with the OP and send the requests 
	
Socks requests are passed transparently, websockets and direct proxys can send usual HTTP GET requests for example or specific customized requests to pass parameters that you need to node-Tor, see below.

It is planned to add some changes mechanisms to incoming streams in order not to ease fingerprinting.

## node-Tor OP options :

The options are set by default but some of them can be changed via customized requests :

	OP proxy port : launchServer(OP_port) 
	OP : true indicates that this is an OP request (same code is used for OP and OR)
	host : destination server (server_address:port)
	nb_hop : number of hops for a circuit, default 3, max 5
	one_c : see next section
	stream : the stream to be passed along the circuit
	
For now the certificates used for SSL connections with Guards are files in ./lib and can be generated as indicated here http://nodejs.org/api/tls.html . It is planned to generate it dynamically.
	
## node-Tor OP circuits :

If the one_c option is "true", the OP will open a few circuit and stream all incoming streams along these circuits, if "false" the OP will create a circuit for each stream, which take more resources and is much longer.

If one_c is true, the OP does establish and change circuits randomly.

The option one_c originally stands for "one circuit", but depending on what method your are using to instruct the OP, it is not possible to set only one circuit, and anyway it's better like this since this allows a random repartition.

The Tor project is doing (we believe) about the same as one_c option "true", it does mainly establish a few circuits and stream everything along, the default value for one_c is "true".

## node-Tor OP security :

As explained above the communications between the application and the OP can be seen at the OP level (or between the application and the OP), then you should normally insure that the OP is installed at a place that you are the only one to be able to access, and a place where the application is supposed to be too since communications with both can be intercepted.

Main Tor project security features are implemented but some are still pending (see TODO in the code, authentication during the handshake for example and some other checks during circuit creation)

## node-Tor OP response time :

Unexpected events in Tor Network can cause large delays, mainly to establish circuits, then node-Tor OP is doing its best to retrieve information and create circuits as fast as possible, as soon as it does not receive the answer from a given router within an acceptable timeframe, the OP switches instantly to another one.

It can happen that some ORs do persist not to answer correctly, then it might be planned to learn from the ORs and banish failing ORs (or attacking ones since it does not seem unlikely that false ORs are inserted into the network)

## node-Tor OR :

TODO but basically it is similar to the OP. It might be planned to retrieve the OR's information (keys, etc) directly from the OR (ie not from the directory servers).

## Tests :

Coming soon, one easy test would be to configure the socks proxy of your browser to the address that we will provide (same as Tor application is doing between Aurora/Firefox and the Tor localhost OP)

In the meantime you can look an example of communication in ./test/debug.txt 
	
## Related projects :

node-Tor can advantageously be coupled for example with :

[Ayms/node-dom](https://github.com/Ayms/node-dom)
[Ayms/node-bot](https://github.com/Ayms/node-bot)
[Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)

## node-Tor/Tor Documentation

A lot of articles on the web talking about the Tor network are approximative or completely wrong regarding how it works, technical details, ways to use it and warning to take into account.

Then you should rely more on official Tor Project documentation and take time to read it before using Tor or node-Tor.

## Support/Sponsors :

If you like this project you can contact us and/or possibly donate : donate at jcore.fr or via PayPal
