Installing Peersm client and node-Tor Bridge WebSocket server
===

Peersm client allows you to store files (downloaded with Peersm or not) that you want to share with others using Peersm without having to keep your browser open.

If you want to run a Tor Bridge implementing the WebSocket interface, ie a Tor access node for the browsers using Peersm, then install node-Tor Bridge WebSocket server.

Both can run on Linux, Windows or Mac.

####The installation is quite simple: just nodejs and one js file working for both - node-Tor-min.js v0.1.0 - SHA1: 91e3eb09aa9d317a93179b97cb79ba6b2540add4.

## Peersm client installation:

####For those that are not very familiar with installation stuff, please see the example for Windows below.

Install node (see below)
Get [the javascript file](http://www.peersm.com/node-Tor-min.js) and store it somewhere, example: /home/me/node-Tor-min.js

	Create a directory - example: /home/peersm
	Put your files inside this directory, example: photos.zip, video.mp4

Launch Peersm client:

	node /home/me/node-Tor-min.js /home/peersm/ 2

The first argument is your directory.

The second argument is your available bandwidth (here 2 MBytes/s)

Each file that you put into the peersm directory will become something like:

	photos#hash_name1.zip
	video#hash_name2.mp4

Where hash_name1 and hash_name2 are the references to use with Peersm to share these files.

If you save files downloaded with Peersm from your browser to the peersm directory, you can name them directly:

	file_name#hash_name.ext

Where hash_name is the hash_name of the file in Peersm application.

Test it: open [Peersm](http://peersm.com/peersm) and try hash_name1 or 2.

## node-Tor Bridge Websocket server installation:

Install node (see below)
Get [the javascript file](http://www.peersm.com/node-Tor-min.js) and store it somewhere, example: /home/me/node-Tor-min.js

	Create a directory - example: /home/bridge

Go into this directory and do:

	openssl genrsa -out priv-key.pem 1024
	openssl rsa -in priv-key.pem -pubout > pub-key.pem
	openssl genrsa -out priv-id-key.pem 1024
	openssl rsa -in priv-id-key.pem -pubout > pub-id-key.pem

priv-key.pem will be used for the TLS connections.

priv-id-key.pem is used for the Tor protocol as the long term identity key, it's not very relevant since the server is acting like a secret Tor Bridge, this is used to make sure that the browsers are talking to the right person.

Of course, keep both secret.

Launch the Bridge:

	node /home/me/node-Tor-min.js /home/bridge/ -P 80

The first argument is your directory.

The second argument is the port used for WebSockets, 80 or 443 are recommended but you can put another value if they are already used.

Test it:

	With your browser, open http://peersm.com/peersm#IP:port

Where IP is the IP address where you have installed the bridge and port the one that you have given as the second argument to launch it.

Your browser will use your new bridge, wait a little bit and you will see:

	Peer to Peer : 1 circuit (Tor Bridge - IP)

Send us the IP:port of the bridge so we can add it into the Bridges list and others can use it.

If you are behind a NAT, you must activate the port forwarding so the bridge can be accessed from the internet, it depends on your equipment but the overall procedure is usually the same, you can look at [Set-Up Port Forwarding on a Router](http://www.wikihow.com/Set-Up-Port-Forwarding-on-a-Router).

If Peersm can not connect to your bridge, probably the port forwarding is not working, you can test locally that the bridge is running:

	Open your browser on localhost 127.0.0.1

	With the Web console, do: new WebSocket('ws://127.0.0.1:port')

	If you don't get an error, the bridge is running, you can check the logs too in the debug-prod.txt file.

##Windows installation example for Peersm client:

	With your browser download:

	http://nodejs.org/dist/v0.11.9/node-v0.11.9-x86.msi (5.5 MB)

	or for a 64 bits conf:

	http://nodejs.org/dist/v0.11.9/x64/node-v0.11.9-x64.msi

	Execute the msi file to install node, node will be installed in C:/Program Files/nodejs

	Download:

	http://www.peersm.com/peersm_client.exe

	Execute the file, this will install the Peersm client in C:/Program Files/Peersm and launch it.<br><br>

	Put the files you want to share in C:/Program Files/Peersm/peersm_client

That's it, as simple, this will launch Peersm client in background and your files can now be downloaded by others anonymously for both.

## Background

You can of course run both processes in background and use respawn options to revive them if they die.

## Updates

Just update the node-Tor-min.js file when we notify here a new release.

## Troubleshooting

In case of problems, please send us the debug-prod.txt file.

## Nodejs installation:

Get nodejs version v0.11.9: go to [Nodejs downloads](http://nodejs.org/download/) and depending on your system replace node-v0.X.Y by node-v0.11.9 in the links.

Install node.js on supported platforms : Unix, Windows, MacOS, see [joyent/node](https://github.com/joyent/node)

Usually it's not difficult to install node, if you encounter installation problems, you might look at:

	https://github.com/joyent/node/issues/3504 (python)
	https://github.com/joyent/node/issues/3516 (node.js)

