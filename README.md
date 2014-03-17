node-Tor
===

Javascript implementation of a Tor (or Tor like) anonymizer network (The Onion Router https://www.torproject.org/)

For a quick look, see the demo video on [Peersm] (http://www.peersm.com)

And try:

[Peersm app] (http://peersm.com/peersm)

The minified code for browsers is in the min directory.

You can install:

* [Peersm client](https://github.com/Ayms/node-Tor/tree/master/install)
* [node-Tor Bridge WebSocket server](https://github.com/Ayms/node-Tor/tree/master/install)

node-Tor nodes and bridges are live here:

* [ORDB1](https://atlas.torproject.org/#details/E0671CF9CB593F27CD389CD4DD819BF9448EA834)
* [ORDB2](https://atlas.torproject.org/#details/2679B51C906158F3DF4C59AFD73E2B1FDA6535E1)
* [ORDB3](https://atlas.torproject.org/#details/179B10784BF8955C73313CCB195904AE133E5F53)

Example of implementations:

* Peersm (http://www.peersm.com) : Anonymous P2P serverless network inside browsers, no installation, encrypted and untrackable

* iAnonym :Anonymity into your browser everywhere from any device, see https://www.github.com/Ayms/iAnonym and http://www.ianonym.com
 
## Presentation:

This is an unofficial and extended implementation of the Tor (or Tor like) protocol (Onion Proxy and Onion Router) which anonymizes communications via the Tor (or Tor like) network. This allows to simply connect to the Tor (or Tor like) network and use it, as well as creating and adding nodes into the network, creating complementary and/or parallel networks, implementing completely, partially or not the Tor protocol or a derived one, using completely, partially or not the Tor network, it can be used to create separated Tor like networks.

There are numerous possibilities of uses for node-Tor

**The most challenging goals are to put the OP and the OR inside the browsers.**

**This is done, see the 3 phases of [Peersm project](http://www.peersm.com) to achieve this.**

## License:

Only the initial code in the lib directory is under the MIT license.

The complete minified versions are subject to the following modified MIT license for now (which removes the rights to modify, merge, sublicense, and sell):

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, publish, and/or distribute copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

## Anonymous serverless P2P inside browsers - Peersm specs

#### Architecture (with servers):

									--- Node2 --- Node3 --- ORDB1
									--- Node5 --- Node6 --- ORDB2
	A (the peer)---	Node/Bridge(ws)	...
									--- Nodey --- Nodez --- ORDBw
									--- Node --- Node --- Web site
									...
									--- Node --- Node --- Web site

			----- ORDB2
	ORDB1	....
			----- ORDBn

#### Final Architecture (serverless for P2P / WS Bridges for direct download):

													--- A1(Peer + Node) --- A2(Peer + Node + ORDB)
	A(Peer + Node + ORDB)	(WebRTC + Tor protocol)	...
			|										--- Z1(Peer + Node) --- Z2(Peer + Node + ORDB)
			ws (direct download)
			|
			Bridge 	--- Nodea --- Nodeb --- Web site
					...
					--- Nodey --- Nodez --- Web site

	To give a visual representation of the P2P network it is similar to a bittorrent network
	with two layers:

	- the Peers are connected to the ORDBs via encrypted links
	- the ORDBs (that are the peers too) are talking "bittorrent" but encrypted and
	are acting as "bittorrent users".

	The peers are anonymized by the "bittorrent users" which are hiding what they are doing
	and what they have.

Each peer is implementing the Tor protocol (Onion proxy and Onion router) and the ORDB function.

The standalone js code is loaded using http://peersm.com/peersm or can be installed as a bookmarklet from [standalone](https://github.com/Ayms/node-Tor/tree/master/min)

Each peer generates a public/private key and a corresponding self-signed certificate (ID certificate), its fingerprint (or ID) is the hash of the DER format of its public key. In what follows 'modulus' is the modulus of the public key (128 B).

The ORDB function consists in relaying the anonymized messages between a Peer A and a Peer B, several ORDBs can be in the path.

Peers are implementing a Kadmelia DHT using their IDs (160 bits), each routing table is composed of 160 buckets of 8 peers max where for bucket j 2^j <=distance(peer,other peer)< 2^(j+1)

The DHT is not the only discovery means. The peers are communicating what they have to the ORDBs they are connected to, and the ORDBs (as peers) do the same as well as sending globally to the ORDBs they are connected too what they know other peers have, when a reference can not be found the DHT is used.

If a peer is new (A), it can know how to connect to other peers asking to some servers (the WebSocket bridges used for direct download) that know about the peers.

The Websocket bridges are a [Peersm bridge](https://github.com/Ayms/node-Tor/tree/master/install), anyone can install one, it can be an official Tor bridge but in that case it will not be able to advertise peers.

Some facilitators (the [Peersm clients](https://github.com/Ayms/node-Tor/tree/master/install)) running as background processes are doing the same than browsers in order to keep some peers alive and to share files if the peers close their browsers. They can run on PC, Mac, servers and ADSL boxes/routers.

A sends to the bridge a DB_FIND_PEER request [A-ID,A-IP,A-port,A-modulus], the bridge registers A and replies with a DB_FOUND_PEER request [ID,IP,port,modulus] of one peer connected to it randomely chosen if any, bridges are not numerous and at least the facilitators are connected to them, so it's unlikely that no peers are connected to a bridge.

If the servers are blocked, the peer introduction can be performed by other means : mirror servers or social networks, A just needs to know about one peer first.

For simplification reasons, A can load http://peersm.com/peersm#Bridge_IP:Bridge_port-Peer_IP:Peer_port, simplification because it's not supposed to be very good to have this information in the URL since our server delivering the code will know it, but in that case that's not really a sensitive information.

A can send different requests to differents bridges to discover some peers.

A connects to one of them (CREATE_FAST) and sends a FIND_NODE [ID, modulus], it receives n (<=8) peers (n FOUND messages [ID,IP,port,modulus]) closest to it.

Then it does this (CREATE_FAST + FIND_NODE) to closer and closer nodes until it cannot find any closer or until it has at least 6 circuits. When A has 6 circuits it continues to discover the peers the same way just sending a FIND_NODE message.

A adds the peers in its routing table.

A extends each circuit to another peer it know randomely chosen and different from the ones it has already connected to.

Each peer connected to A adds A in its routing table.

The peers where A connected to will act as the ORDBs.

Peers are ORDBs and ORDBs are peers but the two functions should not be mixed, even if it can be confusing since the same code and port are used for both functions.

The peers can leave the network without telling the others (the peer closes his browser for example), so peers are testing the peers they know with a PING every 15mn (question: how many peers in average in bittorrent routing tables?). They associate to each peer its live time and sort the bucket from the older to the newer, if the bucket is full no new peer can be added.

If a peer disconnects from A, A will establish a new circuit (CREATE_FAST) with a peer randomely chosen taking the first one of the selected bucket and extend to another one randomely chosen too.

A sends to the ORDBs what it has: db_info 'abcd',size,type --> I have something from 'abcd' whose total size is size (0 for a continuous stream) and type MIME-type. ORDBs as peers do the same, they advertise A of what they have.

The list is maintained by OR_files['abcd'] variable and OR_streams['abcd'] for a continuous stream.

If A does not know the size, the parameters size and type are missing in the request.

The ORDBs are peers too, so they are connected to other ORDBs, they tell them what they know other peers have: 'abcd',size,type, but they do this only when they get a reference from a peer and they know the ORDBs they are connected to don't know it (ie they don't send all their references each time they discover another ORDB in order not to overload the network), the list is maintained by OR_files and OR_streams variable too.

A stores the received chunks every block and advertises the ORDBs for the first chunk.

A advertises the ORDBs of what they have when a file is uploaded too.

Each time an ORDB has a new hash_name 'abcd' it sends a STORE message ['abcd',ID,IP,port,modulus] to the closest node from the hash_name.

Then the closest node sends the same STORE message to the closest node it knows from the hash_name, and so on.

Tor protocol cells have a size of 512 B, the payload for streams is 498 B.

Tor protocol handshake is the same as the normal one except that the link certificate used in CERTS cells is the self-signed certificate of the DTLS connection.

To identify the remote peer the certificate used for the DTLS connection is signed by the ID private key of the remote peer, A receives this certificate and the ID certificate, it checks that indeed the link certificate is correctly signed (as well as the ID certificate), therefore A is sure to talk to the peer with whom it has established the DTLS connection.

Chunk size : 1024 B (2x512 B, < payload of IP, UDP, DTLS, and SCTP protocols ~1150 B - unreliable mode)

Window size: 501760 B - NBLOCKS=490 blocks

A requests 'abcd' :

* A selects 5 ORDBs among the (at least) 6 he is connected to.

* GET [hash_name][Chunk nb][Nb of chunks][Counter] --> 'abcd' N n 0

* 5 GET on 5 circuits : GET1 1 (1-98), GET2 2 (99-196), GET3 3 (197-294),GET4 4 (295-392),GET5 5 (393-490)

* If the size of the file is less than NBLOCKS, the ORDBs close the useless requests (db_end DO_NOT_RETRY).

* The ORDB receives the request:

	* If the counter is equal to TBD (5?), send db_end (to avoid loops between ORDBs)

	* if chunk nb is 0, the ORDB checks OR_Stream['abcd'], the result is an array of chunks indexes.

		* if the result exists, the ORDBs chooses the index M of number of elements of the result minus 4 times the window size (N), the result is an array of [circ,type]

			* The ORDB chooses the first one that has a valid circuit and sends the request 'abcd' N 0, A will know N in the db_data answer, the ORDB removes the first from the list and put it at the end.

	* if chunk nb is not 0:

		* If the ORDB have chunks N to N+n it sends it to the stream that requested it.

		* If not the ORDB checks OR_files['abcd'], the result is an array of [circ,size,type]

			* if the result exists, the ORDB chooses the first one that has a valid circuit and sends the request, the ORDB removes the first from the list and put it at the end.

			* if no result, the ORDB sends a FIND_VALUE ['abcd'] to the 4 closest peers from 'abcd' it knows:

				* as soon as it receives a [ID,IP,port,modulus] answer it connects to the other ORDB node ID (CREATE_FAST), add the new circuit in OR_ORDB['abcd'], increments the counter and sends the request if not already sent.

				* if the answer is a list of nodes (8 max), these are nodes closest from 'abcd' for the queried node, it continues to send FIND_VALUE['abcd'] to these nodes and implement the same process on reply.

				* The reason to iterate is to avoid that the download is performed only from the first peer discovered that has the value.

* A computes tm for every GETm, the time between the request (db_query) and the answer (db_data). Example: 250ms so 31250 B if rate of 1 Mbps, 30 blocks.

* A computes the effective rate for each GETm.

* A waits for the two first GET to end and sends next request on the circuit that showed the best rate, then next one on the second that has the best rate and idem for each finished requests.

* A computes now for each requests sent when he must send a new GET using tm and the effective rate (for example A will compute that he must send a new GET after having received the 10th block)

* It's a bit approximative since the ORDB is rotating the peers by putting them at the end of the lists each time they are used, we suppose that the delay is more related to the connexion between A and the ORDBS.

* If the value is superior to 98 blocks, A sends a new GET after the 68th block.

* And so on.

* If a circuit has a too slow rate compared to others (slow node in the path), it is destroyed and replaced by one of the circuits not used, a new circuit is established.

* If a GET does not end it is resumed from where it was.

#### Handling the lists in the ORDBs:

OR_files['abcd'] an array of : [circ,size,type] where circ is a circuit with a peer, size the total size, type the MIME-type of the file.

OR_files is used for files or finished streaming.

OR_streams['abcd'][N] an array of : [circ,type] where circ is a circuit with a peer, size the total size, type the MIME-type of the file.

OR_streams is used for continuous streaming

If 'abcd' is a continuous streaming, the peers periodically remove from indexedDB chunks older than 4 times the window size.

The peers do not advertise the ORDBs of the removed chunks and the ORDBs do not update the lists if circuits break, this is to avoid to continuously sort the lists.

The lists are always manipulated as the same objects, no copy/duplication/clone

#### Streaming:

Add a stream button.

Continuous Streaming:

* Connection to the stream: http://mytv.fr hash_name efgh

* Direct download if nobody has chunks for efgh.

* A saves chunks from (a value derived from timestamp, something like this???)

* ...

* TODO: how to correlate chunks Nbs with the source if we must reconnect to it?

#### Messages format:

DB_QUERY [hash_name length 1B][hash_name][Counter 0 to 5 1B][file info optional 1B value 1]

DB_CONNECTED removed

DB_DATA
* answer to file_info 1:[size length 1B][file size][type length 1B][MIME-type][chunk nb length 1B][chunk nb][end 0 or 1 1B][data]
* answer to no file_info: [end 0 or 1 1B][chunk nb length 1B][chunk nb][data]

* the end field is used in case the requester does not know the total size of the file (TBD can it really happen?)

DB_INFO
	[hash_name length][hash_name][size length][size][type length][type]

DB_FIND_PEER and DB_FOUND_PEER
	[hash ID length][ID][IP length][IP][port length][port][modulus length][modulus]

DB_END
* [Reason 1B]
	* 0 UNAVAILABLE
	* 1 FINISHED (aborted by requesting party)
	* 2 DESTROYED (destroyed by serving party)
	* 3 DO_NOT_RETRY

#### Security (to be reviewed by experts):

The initial peers returned by the bridge could be compromised, therefore they could send only compromised peers.

But your ID does change for each session then if the peers are continuously returning peers that do not seem close enough to your ID, you could detect that they are compromised.

The DHT represents the public table of all the peers, it's unlikely that it's entirely compromised.

If you don't trust the bridges you can choose your peers as explained above yourself.

WebRTC is using self-signed certificates for DTLS, these certificates are changed so you can not be tracked, the SDP (peer introduction) does include the fingerprint of the certificate, this is not enough at all to guarantee there is not a MITM peer in the middle. Therefore it is foresee to add another mechanism where the fingerprint of the DTLS certificate will be signed by a third party that knows you, typically a social network where you have an account.

This is of course far from protecting your anonymity and privacy and can not be used in Peersm context, so Peersm is using the Tor protocol Certs cells mechanism explained above to make sure that you are talking to the peer with whom you have established the DTLS connection. This peer can still be a MITM but since you are extending the circuit to another peer known in the DHT, per the Tor protocol the possible MITM will not know what happens next, as mentionned above it becomes unlikely that the second peers are all compromised.

## Tests : 

See the demo video on [Peersm] (http://www.peersm.com), the first release is available.

## Install (initial version in lib directory) :

Install node.js on supported platforms : Unix, Windows, MacOS
	
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

To launch it, you need to be in the lib directory (some small inconvenient that will be fixed) :

	node node-tor.js

## node-Tor Goals and possible Future :

The intent of this project is to provide Tor mechanisms in a web language, so it might open the Tor (or Tor like) network to web languages interfaces.

It is easy to install and to scale, does not depend on specific applications and can interact with js modules, then it is possible to easily build web/js applications on top of it (chat, etc).

node-Tor's nodes can be used to create complementary and/or parallel networks, implementing completely, partially or not the Tor protocol or a derived one, using completely, partially or not the Tor network, it can be used to create separated Tor like networks.
	
## Related projects :

* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Interception Detector](http://www.ianonym.com/intercept.html)
* [Ayms/abstract-tls](https://github.com/Ayms/abstract-tls)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)

node-Tor can advantageously be coupled with :

* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)

## Support/Sponsors :

If you like this project you can contact us and/or possibly donate : contact at peersm.com or via PayPal.

## Some words :

The disparition of Aaron Swartz begining of 2013 was a shock for us as for everybody. We did not know each other but exchanged a few emails where he suggested briefly just "to implement all of Tor in JavaScript" while our intent at that time was only to access the network using server side javascript. Apparently Aaron meant to put it inside the browser recognizing a kind of technical challenge. With this idea in mind we did node-Tor and came up with iAnonym and Peersm for the browser implementation, Aaron was aware of part of the result, hopefully this might help serving the causes he defended that we support too.




