//createSecurePair() is deprecated, use TLSSocket instead - see https://github.com/nodejs/node/issues/29559

//Hack for Buffer nodejs deprecation and backward compatibility with previous nodejs versions
//Hack for deprecation of binary format

var oBuffer=Buffer;

oBuffer.prototype.readUInt=function() {
	switch (this.length) {
		case 1 : return this[0];
		case 2 : return this.readUInt16BE(0);
		case 4 : return this.readUInt32BE(0);
		default : return 0;
	};
};

oBuffer.prototype.writeUInt=function(val) {
	switch (this.length) {
		case 1 : this.writeUInt8(val,0);break;
		case 2 : this.writeUInt16BE(val,0);break;
		case 4 : this.writeUInt32BE(val,0);break;
	};
	return this;
};

oBuffer.prototype.map=function(buff) {
	var l=buff.length;
	buff.copy(this);
	this.fill(0,l);
};

Array.prototype.concatBuffers=function() {
	return Buffer.concat(this);
};

oBuffer.prototype.parse=function(socket) {
	var stream_tor_=socket.stream_tor_;
	while(stream_tor_.length) {
			var cir=stream_tor_.slice(0,2);
			var com=stream_tor_.slice(2,3);
			var payl;
			var cid=cir.readUInt();
			if (socket[cid]) {
				socket[cid].clear_timers();
			};
			if (com.readUInt()==7 || com.readUInt()>=128) {
				var n=stream_tor_.length;
				if (n>=5) {
					var l=stream_tor_.readUInt16BE(3);
					if (n>=l+5) {
						payl=stream_tor_.slice(5,l+5);
						stream_tor_=stream_tor_.slice(l+5);
					} else {
						break;
					};
				} else {
					break;;
				};
			} else {
				if (stream_tor_.length>=512) {
					payl=stream_tor_.slice(3,512);
					stream_tor_=stream_tor_.slice(512);
				} else {
					break;;
				};
			};
			var cell=new Cell(cir.readUInt(),com.readUInt(),payl,true);
			Handle_cells.bind(socket)([cell]);
	};
	socket.stream_tor_=stream_tor_;
	var queue_=socket.queue_;
	queue_.shift();
	if (queue_.length) {
		queue_[0]();
	};
};

if (oBuffer.from) {
	Buffer=function() {
		if (typeof arguments[0]==='number') {
			return oBuffer.alloc(arguments[0]);
		} else {
			return oBuffer.from(...arguments);
		};
	};
	Object.keys(oBuffer).forEach(function(val) {
		Buffer[val]=oBuffer[val];
	});
	Object.setPrototypeOf(Buffer.prototype,oBuffer.prototype);
	Buffer.prototype.toString=function(enc) {
		if (enc==='binary') {
			return String.fromCharCode(...this);
		} else {
			return oBuffer.toString.bind(this)(enc);
		};
	};
};

//end Buffers

//Most of globals can be dispatched into modules and made local, keep here for now
global.window_browser=(typeof(WebSocket)==="undefined")?false:true; //true OP in browser, false OR server
global.pathd=__dirname+'/'; //can be replaced by './' relative path, usefull for batch command/respawn
//nodes
global.Guards=require(pathd+'guards.js').Guards; //OP Array of "fingerprint-OR_IP-OR_Port-bandwidth-DIR_IP:DIR_port-modulus"
global.Relays=Guards; //OP
global.Dirs=require(pathd+'dirs.js').Dirs; //OP same format
//circuits
global.NB_HOP=3; //OP side number of hops
global.NB_HOP_MAX=5; //OP side max number of hops
global.NB_DB_HOP=3; //OP side ORDB hops, can be 2 (former Peersm clients)
global.NB_TRY_MAX=5; //OP side Max number of attempts to create a circuit on a given path
global.NB_C=0; //Number of circuits established
global.NB_C_MAX=30; //Browser number of circuit max, reset if superior
global.NB_C_MAX2=12; //Used by monitor to clean circuits
global.NB=5; //Peersm number of circuits
global.BEST_CIRCS=3; //Best circuits sorted
global.CIRC_KA=2*3600*1000; //Timeout to kill circuit
global.CIRC_DB_TIME=3600*1000; //Timeout to kill ORDB circuit
global.WAIT=false; //stops circuits creation when true
global.I_ID=0; //OR side count the number of requests received
global.TIME_AVERAGE=5000; //Stats average life time circuits
global.T_A=2000; //Stats average life time circuits
global.monitor; //browser timer to create circuits - remove
//ORDB
global.db_cid=null; //ORDB cid for Peersm
global.DB_INFO_TIMER=1000*3600*10; //OP timer to send info to ORDB
global.DB_QUERY_RETRY=10000; //OP timer for db_query retry
global.DB_CIRC_TEST=5*60*1000; //OR timer to test ORDB circuits
global.DB_CIRC_POLL=15*60*1000; //OR timer for test_peers
global.DB_NB_TRY=5; //OP ORDB number of attempts to download/resume
global.DOWN_LIMIT=2000000; //ORDB high water mark - download limit - Mbps
global.TEST_HASH='0000000000000000000000000000000000000000'; //ORDB keep alive
//OR and OP
global.OP_sock={}; //OP side, when used OP_sock[OR IP]=socket
global.OP_req=[]; //unused? see Tor function
global.OR_sock={}; //OR side, OR_sock[next OR IP]=socket
global.OR_sock_in={}; //OR side, OR_sock_in[previous OR IP]=circuit in use
global.SOCK_RETRY=5000; //timeout to retry socket
global.OR_files={}; //ORDB side OR_files[hash_name]=[circ,hash_file,size,0] where circ is the circuit who has the file hash_name
global.OR_tid={}; //ORDB side - on query OR_tid[random]=[circ requesting party,sid,[circ serving party,hash_file,size,0],[file length,file hash],1]
global.OR_csid_b={}; //ORDB - on query OR_csid_b[requesting remotePort+'-'+requesting remoteAddress+'-'+requesting circId+'-'+requesting sid]=[serving circuit, sid]
global.OR_csid_f={}; //ORDB - on query OR_csid_f[serving remotePort+'-'+serving remoteAddress+'-'+serving circId+'-'+serving sid]]=[requesting circuit,sid];
global.ISOCKSin=[]; //push i_id of incoming sockets
global.ISOCKSout=[]; //push i_id of failing incoming sockets, used for debug
global.OR_name; //name of OR, directory holding the keys
global.OR_port; //OR port - Handle messages from OP and OR, handles SOCKS proxy and does OP
global.OR_wsport; //OR port listening for WebSockets from browser OP
global.OR_IP; //OR IP
global.OR_fing; //OR fingerprint
global.OR_version; //OR version node-Tor a.b.c
global.one_OR; //set inside browser, OR to connect WS
global.DB_OR; //OP (browser) DB_OR params
global.ORDB=true; //OR true for ORDB extended circuits
//flow control
global.CIRCUIT_WINDOW=1000;
global.LCIRCUIT_WINDOW=100;
global.STREAM_WINDOW=500;
global.LSTREAM_WINDOW=50;
global.FLOWC=0.8; //flow control
global.SENDME_TOUT=15000; //ORDB timeout sendme
//crypto
global.caStore={}; //Not used, keep the option
global.forge_buffers=true; //only used for abstract-tls and certificates der format - TODO fill buffers at creation

const {clear_circuits_OR_out}=require('./src/requests.js');
const {Tor,handleRequest,Handle_cells}=require('./src/circuits.js');
const Cell=require('./src/cells.js');
const fs=require('fs');
const child_process=require('child_process');
const net=require('net');
const writefile=require('./src/logs.js');

/* uncomment for logs in file - change it to a stream if you prefer
console.log=function(txt) {
	writefile('debug-prod.txt',txt);
};
*/

/* uncomment for uncaught
process.on('uncaughtException', function (err) {
	//writefile('error.txt',err.stack);
	//if (err.stack.indexOf('ECONNRESET')===-1) {
		//console.log('uncaught');
		//console.log(err.stack);
		var fd=fs.openSync('/debug.txt','a');
		fs.writeSync(fd,(new Date().toDateString())+' '+(new Date().toTimeString()));
		fs.writeSync(fd,err.stack);
		fs.closeSync(fd);
	//};
});
*/

if (!window_browser) {
	if (process.argv) {
		if (process.argv.length>1) {
			var args=process.argv.splice(2);
			if (args.length===6) {
				OR_name=args[0];
				OR_IP=args[1];
				OR_port=args[2];
				OR_wsport=args[3];
				OR_fing=args[4];
				OR_version=args[5];
				DB_OR={ip:OR_IP,port:OR_port,wsport:OR_wsport,fing:OR_fing,o_modulus:''}; //TODO strange stuff, check
			};
		};
	};
	//UPDATE ROUTERS
	var build=function() {
		console.log('update routers '+(new Date().toDateString())+' '+(new Date().toTimeString()));
		var cb=function() {console.log('child_process '+(new Date().toDateString())+' '+(new Date().toTimeString()))};
		child_process.exec('/usr/local/bin/node '+pathd+'build-relays_and_dirs.js',{timeout: 20*60*1000},cb);
		if (OR_name) {
			child_process.exec('/usr/local/bin/node '+pathd+'publish.js '+OR_name+' '+OR_IP+':'+OR_port+' '+OR_version,{timeout: 20*60*1000},cb);
		};
	};
	//setInterval(build,3600000*12); //TODO restart
	console.log(OR_name+' '+OR_IP+' '+OR_port+' '+OR_wsport+' '+OR_version);
	var unlink=function() {
		fs.rename(pathd+OR_port+'-debug-prod.txt',OR_port+'-debug-prod.txt.old',function() {});
	};
	unlink();
};

/* Start */

var launchServer = function(port) {
	net.createServer(handleRequest).listen(port,function() {console.log('INCOMING SOCKET : incoming socket open SOCKS interface port '+port)});
	setInterval(monitor_circuits,10000);
};

var launchWSServer = function(port) {
	net.createServer(handleRequest).listen(port,function() {console.log('WS INCOMING SOCKET : incoming socket open WS Interface port '+port)});
};

if (!window_browser) {
	launchWSServer(OR_wsport);
	setInterval(clear_circuits_OR_out,10000);
	Tor({params_:{port:OR_port}});
};