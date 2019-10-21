## Browserification

Install browserify and terser via npm, then run from the lib repo

	browserify node-tor.js > ../html/browser.js

If you wan to minify it run from the html directory (note that for the current demo peersm2 the code is not minified, the size is ~1 MB):

	terser browser.js -c -m -o minified.js

Add browser.js or minified.js as the source script at the end of [index.html](https://github.com/Ayms/node-Tor/tree/master/html/index.html) or include the whole js code to replace the loading of the script

## Globals

If you want to remove globals, wrap the whole code into an anonymous function, then redefine for each global.VAR by ``var VAR``, ``delete window.VAR`` and remove globals.VAR in the code, or wrap all globals inside a single one and do the same, please see [Is there a simple way to wrap globals?](https://github.com/browserify/browserify/issues/1928)

On another hand you might want to keep globals if you create some code outside of node-Tor (here the whole node and browser code is browserified), or you might want to access some specific functions, in that case proceed as explained in [bitcoin-transactions](https://github.com/Ayms/bitcoin-transactions/tree/master/browserify) to export what you need (add ``module.exports={what you need}`` at the end of node-tor.js) and delete ``internal`` as global after

## Related projects :

* [Ayms/cashaddress](https://github.com/Ayms/cashaddress)
* [Ayms/bitcoin-wallets](https://github.com/Ayms/bitcoin-wallets)
* [Ayms/zcash-wallets](https://github.com/Ayms/zcash-wallets)
* [Ayms/bittorrent-nodeid](https://github.com/Ayms/bittorrent-nodeid)
* [Ayms/torrent-live](https://github.com/Ayms/torrent-live)
* [Ayms/node-Tor](https://github.com/Ayms/node-Tor)
* [Ayms/iAnonym](https://github.com/Ayms/iAnonym)
* [Interception Detector](http://www.ianonym.com/intercept.html)
* [Ayms/abstract-tls](https://github.com/Ayms/abstract-tls)
* [Ayms/websocket](https://github.com/Ayms/websocket)
* [Ayms/node-typedarray](https://github.com/Ayms/node-typedarray)
* [Ayms/node-dom](https://github.com/Ayms/node-dom)
* [Ayms/node-bot](https://github.com/Ayms/node-bot)
* [Ayms/node-gadgets](https://github.com/Ayms/node-gadgets)