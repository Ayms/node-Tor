const piping=require('./pipe.js');
if (window_browser) {
	Buffer=require('./browser_buffers.js');
};

//Client case client (protocol) --> Tor --> circuits --> serving party (protocol)
//new PROTOCOL(params).pipe(new Tor())
const PROTOCOL=function(params) {
	this.params_={OP:true,nb_hop:NB_DB_HOP,ws:client};
	piping.call(this);
	this.init();
};

PROTOCOL.prototype.init=function() {
	this.on('relay_connected',function() { //relay_connected sent by a node-Tor node for p2p over Tor or sent by a normal Tor node establishing a TCP connection to the destination, ie Exit function
		this._stream_f.push(some_data);
	});
	//this.on('event',f); //handle other events
	this.write_b=function(data) { //called with _write when pipe reads from incoming _stream_b and calls write
		//process data
		this._stream_f.push(result_processed_data_or_other_data);
	};
};

//Serving party case
////new PROTOCOL_S().pipe(new Tor())
const PROTOCOL_S=function() {
	piping.call(this);
	this.init();
};

PROTOCOL_S.prototype.init=function() {
	//this.on('event',f); //handle other events
	this.write_b=function(data) { //called with _write when pipe reads from incoming _stream_b and calls write
		//process data
		this._stream_f.push(result_processed_data_or_other_data);
	};
	this.emit_f('relay_connected'); //set cid on node_Tor side
};


//Non evented case
//duplex pair is not really used here
//Unix example stdin/stdout: (unix) bitcoin | node-Tor | bitcoin
if (process) {
	//Client and serving party case
	//new PROTOCOL_U().pipe(new Tor()
	const PROTOCOL_U=function() {
		piping.call(this);
		this.init();
	};
	PROTOCOL_U.prototype.init=function() {
		this.stream_b._read=function(buff) {
			process.stdout.write(buff);
		};
		process.stdin.on('data',(function(data) {
			this._stream_f.push(data);
		}).bind(this));
	};
};