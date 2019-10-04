//peersm buffers in browser see after browserify
oBuffer.prototype.map=function(buff) {
var l=buff.length;
if (window_browser) {
this.set(buff);
this.fill(0,l);
} else {
buff.copy(this);
this.fill(0,l);
};
};
Array.prototype.concatBuffers=function() {
if (window_browser) {
var n=0;
this.forEach(function(val) {
	n +=val.length;
});
var buff=new Buffer(n);
var index=0;
this.forEach(function(val) {
		var l=val.length;
		buff.set(val,index);
		index+=l;
});
return buff;
} else {
return Buffer.concat(this);
};
};
if (window_browser) { //browser

	/*
	Ayms
	*/

	if (!Hash) {

		Hash=forge.sha1.createhash;

		crypto.createcipheriv=forge.aes.createcipheriv;

		crypto.createhash=forge.sha1.createhash;

		crypto.randomBytes=function(length) {
			var a=new Buffer(length);
			(new SecureRandom()).nextBytes(a);
			return a;
		};

		crypto_aes_encrypt=function(m,K) {
			var C2 = crypto.createcipheriv('aes-128-ctr',K,IV);
			var K2=C2.update(m,'hex','hex');
			//K2 +=C2.final('hex');
			return K2;
		};

		crypto.getDiffieHellman=function() {
			var DH={};
			var prime=new BigInteger(modp2,16);
			var g=new BigInteger('02',16);
			DH.generateKeys=function() {
				this.X=new BigInteger(Rand(128).toString('hex'),16);
			};
			DH.getPublicKey=function() {
				return g.modPow(this.X,prime).toString(16);
			};
			DH.computeSecret=function(Y) {
				Y=new BigInteger(Y.toString('hex'),16);
				return Y.modPow(this.X,prime).toString(16);
			};
			return DH;
		};

		Rsa=Rsa_forge;

	};
} else {

}


if (window_browser) {
	var client;
	var unleash=function() {
		console.log('unleash');
		client=websocket_create(one_OR);
		client.onclose = function() {
			console.log('Websocket closed ws://'+one_OR.ip+':'+one_OR.wsport);
			//console.log('caller');
			//console.log(client.onclose.caller.toString().substr(0,50));
			db_cid=null;
			delete OP_sock[one_OR.ip];
			delete client.db_cid_launched;
			delete client.tls_connected;
			delete client.wsconnected_;
			if (client.abstract_client_tls) {
				client.abstract_client_tls.close();
			};
			clear_requests(client);
			update_circ();
			//Myalert("<p style='text-align:center'>Websocket was closed by remote party for unknown reasons, this might be a temporary network problem, if the system does not recover please refresh the page</p>");
			setTimeout(unleash,2000);
		};
	};
};


		var flush_=function(event) {
			if (event.source==window&&event.data==this.messageName) {
				event.stopPropagation();
				if (this.fc_t.length) {
					var fn=this.fc_t.shift();
					fn();
				};
			};

				var send_data=function(cd,sid,request,nb_blocks) {
			if (request) {
				if (!request.stop_) {
					nb_blocks=(typeof nb_blocks==="undefined")?DEF_BLOCKS:nb_blocks;//modif zero timeout
					var cells=[];
					request.reader.onload=(function(evt) {
						//console.log('reader');
						if (evt.target.result) {
							var res=(evt.target.result instanceof ArrayBuffer)?(new Uint8Array(evt.target.result)):evt.target.result;
							if (res.length) {
								for (var i=0;i<nb_blocks;i++) {
									if (request.stream_window_s!==0) {
										request.stream_window_s--;
										cells.push(res.slice(0,Math.min(res.length,PAYLOAD_STREAM)));
										if (res.length>PAYLOAD_STREAM) {
											res=res.slice(PAYLOAD_STREAM);
										} else {
											break;
										};
									} else {
										request.cursor -=res.length;
										break;
									};
								};
							};
						};
						//console.log('window '+request.stream_window_s);
						//console.log('window size '+request.stream_window_s+' '+this.circuit_window_s);
						var t0=Date.now();
						//request.fc_t.push(setTimeout(flush,FLOWB/2)); //to optimize//modif zero timeout
						request.fc_t.push((function() {flush.call(this,cd,cells,request,sid,t0)}).bind(this));//modif zero timeout
						window.postMessage('flush', "*");//modif zero timeout
					}).bind(this);
					if (nb_blocks!==0) {
						//console.log('avant chunk '+cd.size+' '+request.cursor+' '+nb_blocks);
						var chunk=cd.slice(request.cursor,Math.min(cd.size,request.cursor+nb_blocks*PAYLOAD_STREAM));
						//console.log('chunk length '+chunk.length+' request cursor '+request.cursor+' request cursor next '+request.cursor+nb_blocks*PAYLOAD_STREAM+' tcursor '+cd.cursor);
						//console.log(chunk.toString('hex'));
						//request.cursor +=Math.min(cd.size-request.cursor,nb_blocks*PAYLOAD_STREAM);
						request.cursor +=(typeof chunk.length!=='undefined')?chunk.length:chunk.size;
						request.reader.readAsArrayBuffer(chunk);
					} else {
						request.reader.onload({target:{result:null}});
					};
				};
			};
		};
		};

		var websocket_create=function(OR) {
				//console.log('start websocket ws://'+OR.ip+':'+OR.wsport);
				console.log('start websocket');
				var socket=new WebSocket('ws://'+OR.ip+':'+OR.wsport);
				socket.write=socket.send;
				socket.binaryType="arraybuffer";
				socket.setNoDelay=function() {};
				socket.connect=function() {};
				socket.WS_OP_=true;
				socket.onopen = websocket_start;
				/*
				Perf: 600 bytes 20ms TLS processed --> 240 kbps
				on messages are queued, waiting for end of previous message processing to process next one
				*/
				socket.onmessage = function(evt) {
					var data=(evt.data instanceof ArrayBuffer)?(new Uint8Array(evt.data)):evt.data;
					if (socket===client) {
						//console.log('received');
						//console.log(data.toString('hex'));
						if (!forge_buffers) {
							socket.abstract_client_tls.process(data);
						} else {
							socket.abstract_client_tls.process(data.toString('binary'));
						};
						//console.log('TLS processed since received '+(Date.now()-t0));
					} else {
						on_data.call(this,data)
					};
				};
				socket.onclose = function() {
					console.log('Websocket closed ws://'+OR.ip+':'+OR.wsport);
				};
				socket.destroy=socket.close;
				socket.bufferSize=socket.bufferedAmount;
				socket.remoteAddress=OR.ip;
				socket.remotePort=OP_port;
				socket.address=function() {return {port: 0,family:'IPv4',address: '127.0.0.1' }};//dummy
				socket.setKeepAlive=function() {};
				return socket;
		};

		var websocket_verify=function(data) {
			var res=simpleParser(data.toString('utf8'));
			var key=res['Sec-WebSocket-Accept'];
			if (key) {
				var H = crypto.createhash('sha1');
				H.update(this.key_+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
				var hash=H.digest('hex');
				hash=(new Buffer(hash,'hex')).toString('base64');
				if (key===hash) {
					console.log('WS Client says : Handshake successfull');
					websocket_start.call(this);
				};
			};
		};

		var websocket_start=function() {
			console.log('websocket connected');
			try {
				x_x03.innerHTML='<p>Websocket connected</p>';
			} catch(ee) {};
			this.connected_=true;
			this.wsconnected_=true;
			this.ws_=true;
		};

		var update_circ=function() {
				var nb=(db_cid?1:0)+(NB_C>=0?NB_C:0);
				$_('direct_text').innerHTML='P2P (Peersm, BitTorrent) and web anonymized circuits : '+nb+(nb>1?' circuits':' circuit');
				//$_('peer_text').innerHTML='Peer to Peer : '+(db_cid?1:0)+((!db_cid)?' circuit':(' circuit ('+db_cid.server_.name+')'));
		};