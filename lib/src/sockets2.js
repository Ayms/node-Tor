const {createIdLinkTLSCert,abstract_tls}=require('./abstract-tls.js');
const {Rand}=require('./crypto.js');
const fs=require('fs');
const Cell=require('./cells.js');
const forge=require('./forge.js');
const {on_data}=require('./requests.js');
const {update_circ}=require('./browser.js');

const client_tls_options= function(or_name) {
	let servername='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.net';
	let issuer='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com';
	let options = {
		key: fs.readFileSync('./'+or_name+'/priv-key.pem'),
		cert: createIdLinkTLSCert('./'+or_name+'/pub-key.pem','./'+or_name+'/priv-key.pem','pem',parseInt((Rand(8)).toString('hex'),16),new Date(),servername,issuer),
		servername: servername,
		rejectUnauthorized: false
	};
	return options
};

const init_socket=function(circ) {
	OP_sock[circ.server_.ip]=this;
	this[circ.circId]=circ;
	this.stream_tor_=new Buffer(0);
	let cell=new Cell(circ.circId,Cell.prototype.VERSIONS,(new Buffer(2)).writeUInt(3));
	circ.send(cell);
};

const init_socket_=function(socket,circ) {
	circ.socket_=socket;
	socket.first_=circ;
	socket.server_=circ.server_;
	socket.nbc_=0;
	if (socket===client) { //browser
		socket.buff_w=forge_buffers?(new forge.util.ByteBuffer()):new Buffer(0);
		socket.abstract_client_tls=abstract_tls(socket,'www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.net');
		socket.abstract_client_tls.closed=function(c) {
			console.log(' TLS client disconnected.');
			clearInterval(monitor);
			clear_requests(socket);
			socket.destroy();
			update_circ();
		};
		socket.abstract_client_tls.error=function(c,error) {
			if (error.message.indexOf('MAC')===-1) {
				console.log(' Error TLS client disconnected '+error.message);
				clearInterval(monitor);
				clear_requests(socket);
				socket.destroy();
				update_circ();
			} else {
				console.log('bad MAC');
			};
		};
		socket.write=function(data) {
			if (!forge_buffers) {
				socket.buff_w=socket.buff_w.length?[socket.buff_w,data].concatBuffers():data;
			} else {
				socket.buff_w.putBytes(data.toString('binary'));
			};
		};
		socket.abstract_client_tls.connected=function(c) {
			console.log('TLS client connected');
			monitor=setInterval(monitor_circuits,10000);
			socket.tls_connected=true;
			socket.write=function(data) { //data is ArrayBuffer
				if (!forge_buffers) {
					socket.abstract_client_tls.prepare(encode(data.toString('hex')));
				} else {
					socket.abstract_client_tls.prepare(data.data?data.getBytes():data.toString('binary'));
				};
			};
			socket.write(socket.buff_w);
		};
		socket.write_c=function(data) {
			if (data.length) {
				if (!forge_buffers) {
					socket.send(data);
				} else { //data is string
					socket.send(new Buffer(data,'binary'));
				};
			};
		};
		socket.abstract_client_tls.dataReady=function(c) {
			if (!forge_buffers) {
				let data=c.data.data.slice(c.data.read,c.data.length_);
				c.data.read=c.data.length_;
				console.log(data.length);
				if (data.length) {
					on_data.call(socket,data);
				};
			} else {
				if (c.data.length()) {
					let data=new Buffer(c.data.getBytes(),'binary');
					if (socket.t0) {
						count_tls++;
						count_tls_data +=data.length;
						time_tls_data +=Date.now()-socket.t0;
						if (count_tls%PERF_TLS===0) {
							if (time_tls_data) {
								console.log('TLS perf (dataReady): '+parseInt(count_tls_data*8/(time_tls_data/1000))+' bps');
								count_tls=0;
								count_tls_data=0;
								time_tls_data=0;
							};
						};
					};
					on_data.call(socket,data);
				};
			};
		};
		if (socket.wsconnected_) {
			console.log('start TLS handshake ');
			delete socket.abstract_client_tls.handshaking;
			socket.abstract_client_tls.handshake();
		};
	};
};

module.exports={client_tls_options,init_socket,init_socket_};