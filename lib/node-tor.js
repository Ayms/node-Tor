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
	let l=buff.length;
	try {
		buff.copy(this);
		this.fill(0,l);
	} catch(ee) {
		this.set(buff);
		this.fill(0,l);
	};
};

Array.prototype.concatBuffers=function() {
	return Buffer.concat(this);
};

oBuffer.prototype.parse=function(socket) {
	let stream_tor_=socket.stream_tor_;
	while(stream_tor_.length) {
			let cir=stream_tor_.slice(0,2);
			let com=stream_tor_.slice(2,3);
			let payl;
			let cid=cir.readUInt();
			if (socket[cid]) {
				socket[cid].clear_timers();
			};
			if (com.readUInt()==7 || com.readUInt()>=128) {
				let n=stream_tor_.length;
				if (n>=5) {
					let l=stream_tor_.readUInt16BE(3);
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
			let cell=new Cell(cir.readUInt(),com.readUInt(),payl,true);
			Handle_cells.bind(socket)([cell]);
	};
	socket.stream_tor_=stream_tor_;
	let queue_=socket.queue_;
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
//They are not globals inside browsers
global.oBuffer=oBuffer;
global.oconsole=console.log.bind(console);
global.window_browser=(typeof WebSocket==="undefined")?false:true; //true OP in browser, false OR server
global.pathd=__dirname+'/'; //can be replaced by './' relative path, usefull for batch command/respawn
//nodes
global.Guards=window_browser?null:require(pathd+'guards.js').Guards; //OP Array of "fingerprint-OR_IP-OR_Port-bandwidth-DIR_IP:DIR_port-modulus"
global.Relays=Guards; //OP
global.Dirs=window_browser?null:require(pathd+'dirs.js').Dirs; //OP same format
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
global.db_cid=null; //ORDB circuit
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
global.OR_port=null; //OR port - Handle messages from OP and OR, handles SOCKS proxy and does OP
global.OR_wsport; //OR port listening for WebSockets from browser OP
global.OR_IP=null; //OR IP
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
global.IV=new Buffer('00000000000000000000000000000000','hex');
global.caStore={}; //Not used, keep the option
global.forge_buffers=true; //only used for abstract-tls and certificates der format - TODO fill buffers at creation
//browser
if (window_browser) {
	global.CRLF='0d0a';
	global.default_protocol='http:';
	global.PROGTXT='Retrieving... ';
	global.WS_TLS=true; //set to false for no CREATE_FAST from the browser
	global.db_id=0; //incremental id of db circuits
	global.client; //the WebSocket from the browser
	global.ENC_EXT='enc'; //extension for encrypted file
	global.peersmDB;
	global.FILE_BLOCK=65536; //size of chunks stored in DB
	global.DB_BLOCK=2097152; //size of chunks processed by workers
	global.BANDWIDTH=100000; //default download bandwidth, checked at launch
	global.BFACTOR=1; //flow control
	global.BSIZE=498; //flow control
	global.FLOWB=50; //flow control
	global.STREAM_WINDOW_PEER=1000;
	global.BUFFERED_AMOUNT_MAX=2000000;
	global.DEF_BLOCKS=5;
	global.peersmcode='peersm2'; //The database id for indexedDB
	global.chrome=(navigator.userAgent.indexOf('Chrome')!==-1)?true:false; //diff Blob/TypedArrays
	//Example to set the Websocket Server (DB_OR) and the first OR (one_OR)
	//If CREATE_FAST is not used you must set the modulus and fingerprint of one_OR
	//signature ordb_1: AD04F4C31490F2D6A61911973E97935EE8D5658D
	//modulus: cff0ec490689b965e54079981d8b2d1af0da453bd11faf3e61c6e89556c4084b51e7c534c482c74515658d68cb69e70451b84a4248531ef1b28bb0a2d1f2fd1a859a514376b79c1f70172ca1c7de2960d5a7cc402fa1ee6bfe114daee433776c9f88c28adc4ed3ebcc29dc64bfd721bee6882271408251df929c08ea6283de87
	global.one_OR={ip:'37.59.47.27',port:0,wsport:8051,fing:'',o_modulus:'',name:'Tor Bridge 1'};
	//signature ordb_2: 55C920B34C946B7A88DEE1165A0A1834CD6BCE66
	//modulus: d07e6882cd77a3d88eefd930f2dad797b05ccf4867e9efcb562283bcaece4fb56c0deab442b8b6c9ebd6513e9479e1714453efe1fb8403e39ec88ee5608bafc6c32b92952826383f0d47ecb1fd63afcd19e5ce52ca3979e5b3ef52d89a57ab29b8b2d437e9d4fb7460c76649ace73173b4625039d2ba18b639b0459a36d3a2d5
	global.DB_OR={ip:'37.59.47.27',port:8052,wsport:8053,fing:'55C920B34C946B7A88DEE1165A0A1834CD6BCE66',o_modulus:'d07e6882cd77a3d88eefd930f2dad797b05ccf4867e9efcb562283bcaece4fb56c0deab442b8b6c9ebd6513e9479e1714453efe1fb8403e39ec88ee5608bafc6c32b92952826383f0d47ecb1fd63afcd19e5ce52ca3979e5b3ef52d89a57ab29b8b2d437e9d4fb7460c76649ace73173b4625039d2ba18b639b0459a36d3a2d5'};
};

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
		let fd=fs.openSync('/debug.txt','a');
		fs.writeSync(fd,(new Date().toDateString())+' '+(new Date().toTimeString()));
		fs.writeSync(fd,err.stack);
		fs.closeSync(fd);
	//};
});
*/

if (!window_browser) {
	if (process.argv) {
		if (process.argv.length>1) {
			let args=process.argv.splice(2);
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
		//UPDATE ROUTERS
		const build=function() {
			console.log('update routers '+(new Date().toDateString())+' '+(new Date().toTimeString()));
			let cb=function() {console.log('child_process '+(new Date().toDateString())+' '+(new Date().toTimeString()))};
			child_process.exec('/usr/local/bin/node '+pathd+'build-relays_and_dirs.js',{timeout: 20*60*1000},cb);
			if (OR_name) {
				child_process.exec('/usr/local/bin/node '+pathd+'publish.js '+OR_name+' '+OR_IP+':'+OR_port+' '+OR_version,{timeout: 20*60*1000},cb);
			};
		};
		//setInterval(build,3600000*12); //TODO restart
		console.log(OR_name+' '+OR_IP+' '+OR_port+' '+OR_wsport+' '+OR_version);
		const unlink=function() {
			fs.rename(pathd+OR_port+'-debug-prod.txt',OR_port+'-debug-prod.txt.old',function() {});
		};
		const launchServer = function(port) {
			net.createServer(handleRequest).listen(port,function() {console.log('INCOMING SOCKET : incoming socket open SOCKS interface port '+port)});
			setInterval(monitor_circuits,10000);
		};

		const launchWSServer = function(port) {
			net.createServer(handleRequest).listen(port,function() {console.log('WS INCOMING SOCKET : incoming socket open WS Interface port '+port)});
		};
		unlink();
		/* Start OR */
		launchWSServer(OR_wsport);
		setInterval(clear_circuits_OR_out,10000);
		Tor({params_:{port:OR_port}});
	};
} else {
	const _init=require('./src/browser2.js');
	console.log=function(txt) {
		oconsole(txt);
		writefile('',txt);
	};
	_init(); //start browser
};