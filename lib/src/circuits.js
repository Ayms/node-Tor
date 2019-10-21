const Cell=require('./cells.js');
const Stream=require('./streams.js');
const {crypto,Rand,Hash,crypto_expand_key,crypto_onion,crypto_donion}=require('./crypto.js');
const {createIdLinkTLSCert,abstract_tls}=require('./abstract-tls.js');
const {simpleParser,choose_id,ValToIP,IPtoVal,get_resume,url_decode,simple_random}=require('./utils.js');
const {client_tls_options,init_socket}=require('./sockets2.js');
const tls=require('tls');
const fs=require('fs');
const {request_start,init_connected_request,on_data,clear_circuits_OR_out,init_request,destroy_ws_cid,clear_request,clear_requests}=require('./requests.js');
const {wsencode}=require('./websockets.js');
const stream=require('stream');
const forge=require('./forge.js');
const {update_circ}=require('./browser_utils.js'); //change to browser_utils

let Extended;
if (ORDB) {
	Extended=require('./circuits_extended.js');
};

const Circuit=function(p) {
	if (p) {
		this.OP_=true;
		this.server_=p[0];
		this.path_=p;
		this.nb_=0;
		this.conn_=0;
		this.sent_=0;
		this.received_=0;
		this.circuit_window=CIRCUIT_WINDOW;
		this.circuit_window_s=CIRCUIT_WINDOW;
		this.stream_=[];
		this.pause_={};
		this.time_=new Date().valueOf();
		this.resolved_failed=0;
	};
	this.perf_=0;
	this.time_average=0;
};

Circuit.prototype = {
	padding_cell_handle:function() {
		if (this.next_) {
			this.next_.keep_alive();
		};
	},
	versions_cell_handle:function(cell) {
		let socket_=this.socket_;
		if ((!this.OR_)||(this.onion_)) { //OP or OR handshake
			cell.Payload.forEach(function(val){if (val.readUInt()==3) {socket_.handshake_=3}},this);
			if (!socket_.handshake_) {this.end('v3 handshake not supported','handshake')};
		} else {
			let cell=new Cell(this.circId,Cell.prototype.VERSIONS,(new Buffer(2)).writeUInt(3));
			this.send(cell);
			if (!socket_.ws_) {
				let cert1={};
				cert1.CertType=(new Buffer(1)).writeUInt(1);
				cert1.Certificate=new Buffer(createIdLinkTLSCert(pathd+OR_name+'/pub-key.pem',pathd+OR_name+'/priv-id-key.pem','der',socket_.certid_,socket_.cert_date,socket_.cert_subject,socket_.cert_issuer),'hex');
				cert1.CLEN=(new Buffer(2)).writeUInt(cert1.Certificate.length);
				cert1=[cert1.CertType,cert1.CLEN,cert1.Certificate].concatBuffers();
				let cert2={};
				cert2.CertType=(new Buffer(1)).writeUInt(2);
				cert2.Certificate=new Buffer(createIdLinkTLSCert(pathd+OR_name+'/pub-id-key.pem',pathd+OR_name+'/priv-id-key.pem','der',parseInt((Rand(8)).toString('hex'),16),socket_.cert_date,socket_.cert_issuer,socket_.cert_issuer),'hex');
				cert2.CLEN=(new Buffer(2)).writeUInt(cert2.Certificate.length);
				cert2=[cert2.CertType,cert2.CLEN,cert2.Certificate].concatBuffers();
				cell=new Cell(this.circId,Cell.prototype.CERTS,[(new Buffer(1)).writeUInt(2),cert1,cert2].concatBuffers());
				this.send(cell);
				let auth={};
				auth.Challenge=Rand(32);
				auth.N_Methods=(new Buffer(2)).writeUInt(1);
				auth.Methods=(new Buffer(2)).writeUInt(0);
				cell=new Cell(this.circId,Cell.prototype.AUTH_CHALLENGE,[auth.Challenge,auth.N_Methods,auth.Methods].concatBuffers());
				this.send(cell);
			};
			let netinfos=[];
			let netinfo={};
			netinfo.Timestamp=(new Buffer(4)).writeUInt(parseInt(new Date().valueOf()/1000));
			netinfo.other_OR={type:new Buffer('04','hex'),length:new Buffer('04','hex'),value:IPtoVal(socket_.remoteAddress)};
			netinfo.nb_addresses=new Buffer('01','hex');
			netinfo.this_ORs=[{type:new Buffer('04','hex'),length:new Buffer('04','hex'),value:IPtoVal(socket_.address().address)}];
			netinfos.push(netinfo);
			cell=new Cell(this.circId,Cell.prototype.NETINFO,netinfos);
			this.send(cell);
			//TODO ?? certs_cell and auth before netinfo
		};
	},
	certs_cell_handle:function(cell) {
		//TODO ?? check certificates
		//TODO ?? authenticate
		//console.log('received certs from '+this.socket_.remoteAddress);
	},
	auth_challenge_cell_handle:function(cell) {
		//TODO ?? authenticate
	},
	netinfo_cell_handle:function(cell) {
		let netinfo={};
		if (!this.OR_f) {
			let other_OR=this.socket_.remoteAddress;
			cell.Length=0;
			netinfo.Timestamp=(new Buffer(4)).writeUInt(parseInt(new Date().valueOf()/1000)); //TODO check timestamp
			cell.Length+=4;
			cell.Payload[0].this_ORs.forEach(function(val) {if ((ValToIP(val.value)==other_OR)||(this)) {netinfo.other_OR=val;cell.Length+=val.length;this._OR_ip_verified=true;}},this);
			if (!this._OR_ip_verified) {
					this.end('remote IP does not match','handshake');
			} else {
				netinfo.nb_addresses=(new Buffer(1)).writeUInt(1);
				cell.Length++;
				netinfo.this_ORs=[cell.Payload[0].other_OR]; //TODO ?? is supposed to be checked
				cell.Length+=netinfo.this_ORs[0].length;
				cell.Payload=[netinfo];
				this.send(cell);
				this.socket_.handshake=true;
				this.setCircId();
				if ((this.OP_)&&(WS_TLS)) { //set WS_TLS to false to avoid CREATE_FAST
					this.X_=Rand(20);
					let fast=new Cell(this.circId,Cell.prototype.CREATE_FAST,this.X_);
					this.send(fast);
				} else {
					this.create();
				};
			};
		} else {
			//TODO ?? check netinfo answer
		};
	},
	create_fast_cell_handle:function(cell) {
		console.log('OR receive create fast from '+this.socket_.remoteAddress+' CIC '+this.circId+' sending created_fast');
		this.X_=cell.Payload[0].key_material;
		this.Y_=Rand(20);
		let K0=[this.X_,this.Y_].concatBuffers();
		let KH=this.circuit_keys(K0);
		let resp=new Cell(this.circId,Cell.prototype.CREATED_FAST,[this.Y_,KH].concatBuffers());
		this.send(resp);
	},
	created_handle:function() {
		this.conn_++;
		if (this.next_) {
			this.extended_=this.next_;
			this.extend();
		};
	},
	created_fast_cell_handle:function(cell) {
		console.log('created fast received CIC '+this.circId);
		this.Y_=cell.Payload[0].key_material;
		let K0=[this.X_,this.Y_].concatBuffers();
		let KH=this.circuit_keys(K0);
		if (KH.toString('hex')!=cell.Payload[0].derivative_key_data.toString('hex')) {this.end('KH key does not match','fast_key')} else {
			this.created_handle();
		};
	},
	create_cell_handle:function(cell) {
		let M=cell.Payload[0].M_;
		let M2=cell.Payload[0].M2_;
		this.X_=crypto_donion(this.socket_.privkey_.toString('utf-8'),M.toString('hex'),M2);
		let DH = crypto.getDiffieHellman('modp2');
		DH.generateKeys();
		this.Y_=new Buffer(DH.getPublicKey('hex'),'hex');
		let K0=new Buffer(DH.computeSecret(this.X_, 'hex', 'hex'),'hex');
		let KH=this.circuit_keys(K0);
		let resp=new Cell(this.circId,Cell.prototype.CREATED,[this.Y_,KH].concatBuffers());
		this.send(resp);
	},
	created_cell_handle:function(cell) {
		if (this.OP_) {
			console.log('OP created '+this.circId);
			let lcirc=this.extended_?this.extended_:this;
			lcirc.Y_=cell.Payload[0].dh_data; //TODO ?? check g^y not degenerated
			let K0=new Buffer(lcirc.DH_.computeSecret(lcirc.Y_, 'hex', 'hex'),'hex');
			let KH=lcirc.circuit_keys(K0);
			if (KH.toString('hex')!=cell.Payload[0].derivative_key_data.toString('hex')) {lcirc.end('KH key does not match','created_extended_key');} else {
				this.conn_++;
				lcirc.ok_=true;
				if (lcirc.next_) {
					lcirc.extended_=lcirc.next_;
					lcirc.extend();
				} else {
					if ((this.first_.request_.params_.db)&&(!db_cid)) {
						db_cid=this.first_;
						db_cid.send_db_info();
						db_cid.process=db_cid.send_db_query;
						setInterval(this.send_db_info.bind(db_cid),DB_INFO_TIMER);
						if (lcirc) {
							console.log('CIRC : CIRCUIT ESTABLISHED -CID '+lcirc.circId+' '+(lcirc.socket_.ws_?'WS':'')+' FIRST OR :'+this.first_.server_.ip+' MIDDLE OR :'+(lcirc.prev_?lcirc.prev_.server_.ip:'NONE')+' LAST OR : '+lcirc.server_.ip);
						} else {
							console.log('OP created lcirc is undefined');
						};
					} else {
						if (this.first_.request_.params_.db) {
							console.log('created handle circuit destroy');
							this.first_.circuit_destroy();
						} else {
							if (lcirc) {
								console.log('CIRC : CIRCUIT ESTABLISHED - CID '+lcirc.circId+' '+(lcirc.socket_.ws_?'WS':'')+' FIRST OR :'+this.first_.server_.ip+' MIDDLE OR :'+(lcirc.prev_?lcirc.prev_.server_.ip:'NONE')+' LAST OR : LAST OR : '+lcirc.server_.ip);
							} else {
								console.log('OP created lcirc is undefined');
							};
							NB_C++;
						};
					};
					if (NB_C<NB) {
						if (db_cid) {
							console.log('create new dl circuit');
							Tor({params_:{OP:true,nb_hop:NB_HOP,ws:client}});
						} else {
							Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:client,db:true}});
						};
					};
					this.first_.last_=lcirc;
					this.first_.process();
					let a=OP_req;
					if (a) {
						while (a.length) {
							this.first_.process(a[0]);
							a.shift();
						};
					};
				};
			};
		} else {
			if (this.prev_) {
				console.log('OR process extend - created received from '+this.server_.ip+' sending relay_extended to CIC '+(this.prev_?this.prev_.circId:'undefined'));
				let tmp=cell.Payload[0];
				let stream=new Stream(Stream.prototype.RELAY_EXTENDED,0,[tmp.dh_data,tmp.derivative_key_data].concatBuffers(),this.prev_.Db_hash);
				this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
			} else if (this.next_) {
				this.next_.destroy();
			};
		};
	},
	extend_cell_handle:function(pay) {
		//The default is:
		//OR_port refuses to extend in order not to handle Tor nodes circuits
		//WS_port accepts to extend (from the browser)
		//Remove this check if you want to allow OR_port to extend
		if (this.socket_.address().port===OR_port) {
			console.log('OR does not extend send destroy');
			this.circuit_destroy(); //4 hibernating
		} else {
			let Address=ValToIP(pay.slice(0,4));
			let Port=(pay.slice(4,6)).readUInt();
			let onion=pay.slice(6,192);
			let fing=pay.slice(192,212).toString('hex');
			let circ=new Circuit();
			circ.server_={ip:Address,port:Port,fing:fing};
			console.log('OR process extend toward '+circ.server_.ip+' '+circ.server_.port+' '+circ.server_.fing);
			this.next_=circ;
			circ.prev_=this;
			circ.onion_=onion;
			circ.OR_=true;
			circ.way_='socket out';
			circ.circId=0;
			if (OR_sock[Address]) {
				circ.socket_=OR_sock[Address];
				circ.socket_.stream_tor_=new Buffer(0);
				circ.setCircId();
				circ.create();
				console.log('OUTGOING OR SOCKET EXTEND : ---------Socket already exists send create ------------ CIC '+circ.circId+' for '+circ.server_.ip);
			} else {
				let options=client_tls_options(OR_name);
				console.log('OUTGOING OR SOCKET EXTEND : ---------OR starts client socket with------------'+options.servername+' '+circ.server_.ip+' '+circ.server_.port);
				let or_tls_socket_=tls.connect(circ.server_.port, circ.server_.ip, options, function() {
					OR_sock[circ.server_.ip]=this;
					console.log('OR process extend sending versions');
					circ.socket_=this;
					this.OR_=true;
					this.way_='socket out';
					this[circ.circId]=circ;
					this.stream_tor_=new Buffer(0);
					let cell=new Cell(circ.circId,Cell.prototype.VERSIONS,(new Buffer(2)).writeUInt(3));
					circ.send(cell);
				});
				or_tls_socket_.on('data', on_data);
				or_tls_socket_.circuits_destroy=function() {
					for (let m in OR_sock_in) {
						Object.keys(OR_sock_in[m]).forEach(function(n) {
							if ((!isNaN(n))&&(n!=null)&&(typeof(n)!=='function')) {
								let circ=OR_sock_in[m][n];
								if (circ) {
									if (circ.socket_) {
										if (circ.socket_.remoteAddress) {
											if (circ.next_) {
												if (circ.next_.socket_===or_tls_socket_) {
													console.log('destroy circ in CIC '+circ.circId+' '+circ.socket_.remoteAddress);
													circ.circuit_destroy();
												};
											};
										};
									};
								};
							};
						});
					};
				};
				or_tls_socket_.on('end',function() {console.log('or_tls_socket end');delete OR_sock[Address];or_tls_socket_.circuits_destroy()});
				or_tls_socket_.on('close',function() {console.log('or_tls_socket close');delete OR_sock[Address];or_tls_socket_.circuits_destroy()});
				or_tls_socket_.on('error',function(error) {console.log('or_tls_socket error');console.log(error);delete OR_sock[Address];or_tls_socket_.circuits_destroy()});
			};
		};
	},
	handle_destroy:function(error) {
		if (this.OP_) {
			let circ=this.first_||this;
			console.log('OP receive destroy CIC '+circ.circId+(circ===db_cid?' ------- DB_CID destroyed --------------- ':''));
			circ.destroyed_=true;
			this.clear_timers();
			circ.circuit_destroy(true);
		} else {
			console.log('OR '+(this.OR_f?'in':'out')+' received destroy from '+this.socket_.remoteAddress+' on CID '+this.circId);
			let circ=this.prev_||this.next_;
			if (circ) {
				console.log('OR '+(this.OR_f?'in':'out')+' send destroy to '+(circ.socket_?circ.socket_.remoteAddress:'')+' on CID '+circ.circId);
				error=error.toString();
				error=(error.length===1)?('0'+error):error;
				circ.circuit_destroy();
				this.circuit_destroy(true);
			} else {
				this.circuit_destroy();
			};
		};
	},
	relay_cell_handle:function(cell,bool) {
		//TODO ?? chek no more than 8 Relay Early Cell received by OR on a given circuit
		let data=cell.Payload[0];
		let cmd=cell.Command.readUInt();
		if (this.OP_) {
			this.stream_decrypt_backward(data,bool);
		} else {
			if (this.prev_) {
				if (cmd!==cell.RELAY_EARLY) { //forbid inbound realy_early cells https://blog.torproject.org/blog/tor-security-advisory-relay-early-traffic-confirmation-attack
					this.stream_encrypt_or_b(data,cmd);
				};
			} else {
				this.stream_decrypt_or_f(data,cmd);
			};
		};
	},
	relay_send_truncate:function(error) {
		//console.log('STREAM :-------------------------- SEND TRUNCATE -------------------'+this.server_.ip+' CIRC '+this.circId);
		let stream=new Stream(Stream.prototype.RELAY_TRUNCATE,0,(new Buffer(1)).writeUInt(error),this.Df_hash);
		let cell=new Cell(this.circId,Cell.prototype.RELAY,this.stream_encrypt_forward(stream));
		this.send(cell);
	},
	relay_end_handle:function(id,error) {
		let first_=this.first_;
		let request=first_[id];
		let end_request=function() {
			if (request.download_) {
				request.unexpected_(error);
			};
			request._write_(new Buffer(req_410(),'utf8'));
			request.end();
		};
		if (request) {
			if (request.abstract_client_tls) {
				request.abstract_client_tls.close();
			};
			delete request.abstract_client_tls;
			if (!request.destroyed) {
				if ([6,12].indexOf(error)!==-1) {
					if (!request._data_) {
						request.nb_try++;
						first_.perf_--;
						first_.destroy_cid(request);
						first_.request_retry(request,error);
					} else {
						if (parseInt(error)===12) {
							console.log('END : CONNRESET RETRY '+error+' CID '+this.first_.circId+' on port '+request.remotePort+' for request '+request.i_id);
							if (!request.download_) {
								first_.perf_--;
								first_.destroy_cid(request);
								request.destroy();
							} else {
								//browser
								request.end_();
							};
						} else {
							if (!request.bufferSize) {
								if (!request.download_) {
									first_.destroy_cid(request);//do not close socks request but choose another circuit
									request.end();
								} else {
									request.fin_()
								};
							};
						};
					};
				};
			};
		};
	},
	request_retry:function(request,error) {
		console.log('Retry for request '+request.i_id);
		Tor(request,this,'end '+error);
	},
	relay_truncated_handle:function(error) {
		console.log('STREAM : Truncated received from '+this.server_.ip+' CIRC '+this.circId+' '+error);
		let first_=this.first_;
		switch (error) {
			case 8: this.handle_destroy(0);break;
			case 11: this.handle_destroy(0);break;
			default:let tmp=first_.last_?first_.last_.ok_:null;if (!tmp) {this.next_.change_or('- relay truncated',this.extend)};
		};
	},
	relay_truncate_handle:function(error) {
		console.log('truncate '+this.circId);
		let next_=this.next_;
		let cell=new Cell(next_.circId,Cell.prototype.DESTROY,(new Buffer('05','hex'))); //reason destroy
		next_.send(cell);
		let stream=new Stream(Stream.prototype.RELAY_TRUNCATED,0,(new Buffer(1)).writeUInt(error),this.Db_hash);
		this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
	},
	stream_handle:function(stream) {
		switch (stream.command.readUInt()) {
			case stream.RELAY_EXTEND : this.extend_cell_handle(stream.data);break; //OR
			case stream.RELAY_TRUNCATE : this.end('Error OR receive truncate :'+stream.data.slice(0,1).readUInt(),'truncate');break;//OR
			case stream.RELAY_EXTENDED : this.created_cell_handle(new Cell(this.circId,Cell.prototype.CREATED,stream.data,true));break;
			case stream.RELAY_TRUNCATED : this.end('Error OP receive truncated :'+stream.data.slice(0,1).readUInt(),'truncated');break;
			case stream.RELAY_END : this.end('End :'+stream.data.slice(0,1).readUInt(),'relay_end',stream.streamId.readUInt());break;
			case stream.RELAY_CONNECTED : this.stream_decode_connected(stream);this.stream_handle_connected(stream.streamId.readUInt());break;
			case stream.RELAY_DATA : this.stream_handle_data(stream);break;
			case stream.RELAY_SENDME : oconsole('RECEIVING SENDME CIC '+this.circId+' for stream '+stream.streamId.readUInt());this.stream_handle_sendme(stream.streamId.readUInt());break;
			case stream.RELAY_DB_INFO : this.relay_db_info_handle(stream.data.slice(0,stream.length.readUInt()));break; //DB_OR
			case stream.RELAY_DB_QUERY : this.relay_db_query_handle(stream);break; //DB_OR and OP
			case stream.RELAY_DB_CONNECTED : this.relay_db_connected_handle(stream);break; //DB_OR and OP
			case stream.RELAY_DB_END : this.relay_db_end_handle(stream);break; //DB_OR and OP
			case stream.RELAY_DB_DATA : this.relay_db_data_handle(stream);break; //DB_OR and OP
			case stream.RELAY_DB_SENDME : this.relay_db_sendme_handle(stream);break; //DB_OR and OP
			case stream.RELAY_BEGIN_DIR : this.end('End begin_dir :14','begin_dir',stream.data.slice(0,1).readUInt());break;//TODO - ugly - handle relay_end errors
		};
	},
	stream_decode_connected: function(stream) {
		//let ip=ValToIP(stream.data.slice(0,4));
		//let request=this.first_[stream.streamId.readUInt()];
		//oconsole('DNS IP connected TO '+ip+' for request '+request.i_id);
	},
	stream_handle_sendme:function(id) {
		let circ=this.first_;
		let stream=circ.stream_;
		oconsole('FLUSH BUFFER CIC '+circ.circId+' sid '+(id||' whole circuit ')+' buffer length '+stream.length);
		let l=Math.min(id?LSTREAM_WINDOW:LCIRCUIT_WINDOW,stream.length);
		let i=0;
		if (!id) {
			circ.circuit_window_s +=LCIRCUIT_WINDOW;
		} else {
			circ[id].stream_window_s +=LSTREAM_WINDOW;
		};
		while (i<l) {
			let cell=id?stream[i]:stream[0];
			if (id) {
				if (id===cell[1]) {
					setTimeout(function(){circ.send(cell[0])},parseInt(1+1000/(BANDWIDTH/BSIZE)));
					cell[0]=null;
					i++;
				};
			} else {
				if (cell[0]) {
					setTimeout(function(){circ.send(cell[0])},parseInt(1+1000/(BANDWIDTH/BSIZE)));
					i++;
				};
				stream.shift();
			};
		};
	},
	stream_handle_connected:function(id,tid) {
		let first_=this.first_;
		let request=first_[id];
		if (request) {
			clearTimeout(request.socket_retry);
			this.clear_timers();
			console.log('STREAM RELAY :--------------RELAY_CONNECTED TO---------------------- '+this.server_.ip+' VIA '+this.first_.server_.ip+' CID '+this.circId+' Stream '+id+' for request '+request.i_id);
			if (request.params_.stream) {
				let cd=request.params_.stream;
					while (cd.length) {
						let stream;
						if (!tid) {
							stream=new Stream(Stream.prototype.RELAY_DATA,id,cd.slice(0,Math.min(cd.length,Stream.prototype.PAYLOAD_STREAM)),this.Df_hash);
						} else {
							stream=new Stream(Stream.prototype.RELAY_DB_DATA,id,[new Buffer(tid,'hex'),cd.slice(0,Math.min(cd.length,Stream.prototype.PAYLOAD_STREAM-16))].concatBuffers(),this.Df_hash);
						};
						let cell=new Cell(this.circId,Cell.prototype.RELAY,this.stream_encrypt_forward(stream));
						request.sent_++;
						first_.resolved_failed=0;
						first_.sent_++;
						first_.time_=Date.now(); //update time circuit used
						request.start_t0=first_.time_;
						request.stream_window_s--;
						first_.circuit_window_s--;
						if ((request.stream_window_s===0)||(first_.circuit_window_s===0)) {
							console.log('Bufferizing CIC '+first_.circId+' for request '+request.i_id);
							first_.stream_.push[cell,id];
						} else {
							this.send(cell);
						};
						if (cd.length>Stream.prototype.PAYLOAD_STREAM) {
							cd=cd.slice(Stream.prototype.PAYLOAD_STREAM);
						} else {
							break;
						};
					};
				if (request.squeue_) {
					request.squeue_.shift();
					if (request.squeue_.length) {
						request.squeue_[0]();
					};
				};
			} else {
				request_start(request);
			};
		};
	},
	stream_handle_data:function(stream,req) {
		//'this' is last
		let first_=this.first_;
		if (first_) {
			let sid=stream.streamId.readUInt();
			let request=req||first_[sid];
			if (request) {
				let resp=(stream.data.slice(0,stream.length.readUInt()));
				if ((!request._data_)||(request.wait_header)) {
					resp=request.start_(resp);
				};
				request._data_=true;
				request.received_++;
				first_.received_++;
				first_.circuit_window--;
				request.stream_window--;
				request.resp__=request.resp__?(request.resp__+resp.length):resp.length;
				if ((first_.received_%LCIRCUIT_WINDOW===0)&&(first_.circuit_window<FLOWC*CIRCUIT_WINDOW)) {
					first_.sendme();
					first_.circuit_window +=LCIRCUIT_WINDOW;
				};
				if ((request.received_%LSTREAM_WINDOW===0)&&(request.stream_window<FLOWC*STREAM_WINDOW)) {
					first_.sendme(request);
					request.stream_window +=LSTREAM_WINDOW;
				};
				request._write_(resp);
			};
		};
	},
	send:function(cell) {
		let first_=this.first_;
		let mcell=[cell.CircID,cell.Command];
		let command=cell.Command.readUInt();
		if ((cell.Command.readUInt()==7)||(cell.Command.readUInt()>=128)) {mcell.push(cell.Length)};
		let recurse=function(val) {
			if (!val.push) {
				for (let n in val) {
					if (Buffer.isBuffer(val[n])) {
						mcell.push(val[n]);
					} else {
						recurse(val[n]);
					};
				};
			} else {
				val.forEach(function(a) {
					if (Buffer.isBuffer(a)) {
						mcell.push(a);
					} else {
						recurse(a);
					};
				});
			};
		};
		if (cell.Payload.push) {
			cell.Payload.forEach(function(val) {
				recurse(val);
			});
		} else {
			mcell.push(cell.Payload);
		};
		mcell=mcell.concatBuffers();
		if ((cell.Command.readUInt()!==7)&&(cell.Command.readUInt()<128)) {
			let tmp=new Buffer(512);
			tmp.map(mcell);
			mcell=tmp;
		};
		try {
			this.socket_.write(mcell);
		} catch(ee) {
			console.log('OUTGOING SOCKET '+(this.OP_?'OP ':'OR ')+(this.socket_?(this.socket_.ws_?'WS':'TLS'):'')+' IP '+(this.server_?this.server_.ip:'')+' socket does not exist any longer');
			if (this.OP_) {
				if (this.socket_) {
					this.socket_.destroy();
				} else {
					console.log('send1 circuit destroy');
					this.circuit_destroy(true);
				};
			} else if (!this.OR_f) {
				let sock=this.socket_;
				console.log('send2 circuit destroy');
				this.circuit_destroy(true);
				if (sock) {
					sock.circuits_destroy();
				};
			};
		};
	},
	circuit_keys: function(K0) {
		let exp_key=crypto_expand_key(K0.toString('hex'));
		let KH=exp_key.slice(0,20);
		this.Df_=exp_key.slice(20,40);
		this.Db_=exp_key.slice(40,60);
		this.Kf_=exp_key.slice(60,76);
		this.Kb_=exp_key.slice(76,92);
		this.Kf_cipher=crypto.createcipheriv('aes-128-ctr',this.Kf_,IV);
		this.Kb_cipher=crypto.createcipheriv('aes-128-ctr',this.Kb_,IV);
		this.Df_hash=new Hash('sha1');
		this.Db_hash=new Hash('sha1');
		this.Df_hash.update(this.Df_);
		this.Db_hash.update(this.Db_);
		return KH;
	},
	stream_encrypt_forward: function(stream) {
		let circ=this;
		let enc=stream.toBuffer();
		while (circ) {
			enc=new Buffer(circ.Kf_cipher.update(enc,'hex','hex'),'hex');
			circ=circ.prev_;
		};
		return enc;
	},
	stream_decrypt_backward: function(data,error) {
		let circ=this;
		let stream;
		let l=data.length;
		while (circ) {
			if (circ.Kb_) {
				data=new Buffer(circ.Kb_cipher.update(data,'hex','hex'),'hex');
				stream=circ.recognized(data);
				if (stream) {break;}
			};
			circ=circ.extended_;
		};
		if (!stream) {
			this.end('Unrecognized stream','unrecognized');
			console.log(data.toString('hex'));
		} else {
			if (error) {
				let stream_=new Stream(Stream.prototype.RELAY_END,stream.streamId,new Buffer('0A','hex'),circ.Df_hash);
				let cell=new Cell(circ.circId,Cell.prototype.RELAY,circ.stream_encrypt_forward(stream_));
				circ.send(cell);
			} else {
				circ.stream_handle(stream);
			};
		};
	},
	stream_decrypt_or_f: function(data,cmd,boo) {
		let stream;
		if (this.Kf_cipher) {
			data=new Buffer(this.Kf_cipher.update(data,'hex','hex'),'hex');
			if (!boo) {
				stream=this.recognized(data);
			};
			if (stream) {
				this.stream_handle(stream);
			} else {
				if (this.next_) {
					let cell=new Cell(this.next_.circId,cmd,data);
					this.next_.send(cell);
				};
			};
		};
	},
	stream_encrypt_or_b: function(data,cmd,boo) {
		let prev_=this.prev_;
		let stream;
		if (prev_) {
			if (prev_.Kb_cipher) {
				data=new Buffer(prev_.Kb_cipher.update(data,'hex','hex'),'hex');
				if (!boo) {
					stream=prev_.recognized(data);
				};
				if (stream) {
					this.stream_handle(stream);
				} else {
					if (prev_) {
						let cell=new Cell(prev_.circId,cmd,data);
						prev_.send(cell);
					};
				};
			};
		};
	},
	recognized: function(data) {
		if (data.slice(1,3).readUInt()==0) {
			let l=data.slice(9,11);
			let m=Math.min(11+l.readUInt(),data.length);
			let stream=new Stream((data.slice(0,1)).readUInt(),(data.slice(3,5)).readUInt(),data.slice(11,m));
			let res;
			stream.length=l;
			let digest=data.slice(5,9);
			if (!this.OR_f) {
				this.Db_hash.update(stream.toBuffer());
				res=(new Buffer(this.Db_hash.digest('hex'),'hex')).slice(0,4);
			} else {
				this.Df_hash.update(stream.toBuffer());
				res=(new Buffer(this.Df_hash.digest('hex'),'hex')).slice(0,4);
			};
			if (res.toString('hex')==digest.toString('hex')) {
				return stream;
			};
		};
	},
	extend:function() {
		let extended_=this.extended_;
		let Address=IPtoVal(extended_.server_.ip);
		let Port=(new Buffer(2)).writeUInt(parseInt(extended_.server_.port));
		let Fing=new Buffer(extended_.server_.fing,'hex');
		let DH = crypto.getDiffieHellman('modp2');
		//TODO ?? private key x is recommended to be 320 bits length for optimization
		//node.js improvment https://github.com/joyent/node/issues/3622
		DH.generateKeys();
		extended_.DH_=DH;
		extended_.X_=new Buffer(DH.getPublicKey('hex'),'hex');
		let cb=function() {
			let Onion=crypto_onion(new Buffer(extended_.server_.o_modulus,'hex'),extended_.X_);
			let stream=new Stream(Stream.prototype.RELAY_EXTEND,0,[Address,Port,Onion,Fing].concatBuffers(),this.Df_hash);
			let cell=new Cell(this.circId,Cell.prototype.RELAY_EARLY,this.stream_encrypt_forward(stream));
			this.send(cell);
		};
		cb.call(this);
	},
	create:function() {
		if (this.onion_) {
			let cell=new Cell(this.circId,Cell.prototype.CREATE,this.onion_);
			this.send(cell);
		} else {
			let DH = crypto.getDiffieHellman('modp2');
			DH.generateKeys();
			this.DH_=DH;
			this.X_=new Buffer(DH.getPublicKey('hex'),'hex');
			let cb=function() {
				let Onion=crypto_onion(new Buffer(this.server_.o_modulus,'hex'),this.X_);
				let cell=new Cell(this.circId,Cell.prototype.CREATE,Onion);
				this.send(cell);
			};
			if (!this.server_.o_modulus) {
				this.get_certs(cb);
			} else {
				cb.call(this);
			};
		};
	},
	destroy:function() {
		console.log('CIRC : -------------------------- SEND DESTROY ------------------- '+(this.server_?this.server_.ip:this.socket_.remoteAddress)+(this.OP_?' OP':' OR')+' CID '+this.circId);
		let cell=new Cell(this.circId,Cell.prototype.DESTROY,new Buffer('09','hex'));
		this.send(cell);
	},
	send_relay_end:function(sid,reason) {
		let first_=this.first_||this;
		reason=(typeof reason==='undefined')?0:reason;
		let stream=new Stream(Stream.prototype.RELAY_END,sid,new Buffer(reason),first_.last_.Df_hash);
		let cell=new Cell(first_.circId,Cell.prototype.RELAY,first_.last_.stream_encrypt_forward(stream));
		first_.send(cell);
	},
	send_relay_end_b:function(sid,reason) {
		let stream=new Stream(Stream.prototype.RELAY_END,sid,(new Buffer(1)).writeUInt(reason),this.Db_hash);
		this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
	},
	keep_alive:function() {
		let cell=new Cell(this.circId,Cell.prototype.PADDING,new Buffer('00','hex'));
		this.send(cell);
	},
	destroy_cid:function(request,bool) {
		let id=request.sid_;
		if (request) {
			if (bool) {
				let stream=new Stream(Stream.prototype.RELAY_END,request.sid_,new Buffer(0),this.last_.Df_hash);
				let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
				this.send(cell);
			};
			delete request.cid_;
			delete this.first_[id];
			delete request.sid_;
			delete this.first_.request_;
		};
	},
	setCircId:function() {
		if (this.circId==0) {delete this.socket_['0'];};
		if (this.OP_) {
			this.circId=choose_id(this.socket_);
			if (!this.circId) {
				return false;
			};
			this.socket_[this.circId]=this;
			let lcirc=this;
			let l=this.path_.length-1;
			this.first_=this;
			this.t0_=[];
			for (let i=0;i<l;i++) {
				let circuit=new Circuit();
				circuit.OP_=true;
				circuit.t0_=[];
				circuit.server_=lcirc.path_[i+1];
				lcirc.next_=circuit;
				circuit.prev_=lcirc;
				circuit.path_=lcirc.path_;
				circuit.nb_=lcirc.nb_+1;
				circuit.socket_=this.socket_;
				circuit.circId=this.circId;
				circuit.first_=this;
				lcirc=circuit;
			};
			return true;
		} else {
			let boo=(parseInt(this.server_.fing,16)<parseInt(OR_fing,16))?true:false;
			this.circId=choose_id(this.socket_,true,boo?32767:null);
			this.socket_[this.circId]=this;
		};
	},
	process: function(request) {
		this.last_.first_=this;
		if (!request) {
			request=this.request_;
		};
		if (request.download_) {
			request.process_.call(this);
		};
		request.cid_=this;
		if ((request.params_.host)&&(!request.destroyed)) {
			let payload=new Buffer(request.params_.host);
			payload=new Buffer(payload.toString('hex')+'00','hex');
			let id=choose_id(this);
			if (id) {
				console.log('STREAM : --------------SEND RELAY_BEGIN---------------------- CID '+this.circId+' on OR '+this.first_.server_.ip+' Stream '+id+' for request '+request.i_id+' on port '+request.remotePort+' host '+payload.toString('utf8'));
				this[id]=request;
				request.sid_=id;
				request.received_=0;
				request.sent_=0;
				request.stream_window=STREAM_WINDOW;
				request.stream_window_s=STREAM_WINDOW;
				let socket_retry=function() {
					let cid=this;
					console.log('Timeout Bad circuit '+cid.circId);
					if (!cid.perf_>0) {
						cid.bad_=true;
					};
					cid.send_relay_end(id);
					request.nb_try++;
					delete request.cid_;
					delete cid[id];
					Tor(request);
				};
				let begin=function() {
					//console.log(payload);
					let stream=new Stream(Stream.prototype.RELAY_BEGIN,id,payload,this.last_.Df_hash);
					let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
					request.socket_retry=setTimeout(socket_retry.bind(this),SOCK_RETRY);
					this.send(cell);
				};
				begin.call(this);
			} else {
				//console.log('STREAM : too many streams opened');
			}
		};
	},
	sendme: function(request) {
		request=request||{sid_:0,i_id:-1};
		let stream=new Stream(Stream.prototype.RELAY_SENDME,request.sid_,new Buffer(0),this.last_.Df_hash);
		let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
		this.send(cell);
	},
	change_or: function(msg,cb) {
		console.log('change_or ----------- CIC '+this.circId+' - '+msg);
		let list=[];
		let i,n_or;
		let request;
		if (this.first_) {
			request=this.first_.request_;
		};
		let db=(typeof(request)==='undefined')?null:(request.params_?request.params_.db:null);
		if ((!this.prev_&&one_OR)&&(typeof(this.server_)==='undefined'?false:(this.server_===one_OR))) {
			console.log('change_or one OR '+this.circId);
			n_or=one_OR;
		} else if ((this.first_===db_cid)||db) {
			if (this.first_) {
				console.log('change_or circuit destroy');
				this.first_.circuit_destroy();
				if (request) {
					circuit_start(request);
				};
			};
			return;
		} else {
			n_or=this.prev_?(this.next_?Relays:Exit):Guards;
			let l=n_or.length;
			this.clear_timers();
			this.clear_t0_();
			if (this.path_) {
				list=this.path_.map(function(val) {return val.ip});
			} else {
				list.push(this.server_.ip);
			};
			i=simple_random(l);
			while (list.indexOf(n_or[i].split('-')[1])!=-1) {
				i=simple_random(l);
			};
			let o=n_or[i].split('-');
			n_or={ip:o[1],fing:o[0],port:o[2],band:o[3],o_modulus:(o[5]?o[5]:o[4])};
		};
		let lcirc=this;
		while (lcirc) {
			delete lcirc.destroy_;
			delete lcirc.nb_error;
			delete lcirc.ok_;
			lcirc=lcirc.next_;
		};
		delete this.first_.last_;
		let circ=new Circuit();
		Object.keys(this).forEach(function(val) {circ[val]=this[val]},this);
		circ.server_=n_or;
		let old_ip;
		try {
			old_ip=this.server_.ip;
			this.server_o=this.server_;
		} catch(ee) {
			console.log('_server error');
			this.clear_timers();
			for (let n in this) {if (typeof(this[n])!='function') {console.log(n+' '+this[n]);}}; //TODO tests - remove
			this.first_.destroy();
		};
		delete this.server_; //do not reuse it
		delete circ.certs_;
		if (this.next_) {
			circ.next_.prev_=circ;
		};
		if (this.prev_) {
			if (circ.prev_.extended_) {
				circ.prev_.extended_=circ;
			};
			circ.prev_.next_=circ;
		} else {
			circ.first_=circ;
		};
		circ.first_.reconstruct_path();
		if ((cb)&&(this.prev_||(this.first_===this))) {
			cb.call(circ);
		} else {
				if (this.socket_.first_===this) {
					delete OP_sock[old_ip];
					if (circ.socket_) {
						this.destroy_=true;
						circ.socket_.destroy();
						delete circ.socket_;
					};
					delete circ.extended_;
					circ.circId=0;
					circ.first_=circ;
					circ.path_.shift();
					circ.path_.unshift(circ.server_);
					tls_socket(circ);
				} else {
					this.next_.change_or('PATH : first socket exists, change path',this.create);
				};
		};
	},
	circuit_retry: function() {
		//'this' is first
		if ((!WAIT)&&(this.socket_)) {
			if ((!this.ok_)&&(this.socket_.first_===this)) {
				this.change_or('initial socket closed unexpectedly or unexpected circuit creation error or new circuit creation error');
			} else {
				this.destroy();
				delete this.ok_;
				delete this.first_.last_;
				let tmp=this.circId;
				this.circId=choose_id(this.socket_);
				delete this.socket_[tmp];
				this.socket_[this.circId]=this;
				this.socket_.nbc_--;
				let lcirc=this;
				while (lcirc.extended_) {
					lcirc.extended_.circId=this.circId;
					lcirc=lcirc.extended_;
					delete lcirc.extended_;
				};
				if ((this===lcirc)&&(this.socket_.first_!==this)) {
					lcirc.create();
				} else {
					lcirc.change_or('circuit_retry from first OR circId='+this.circId,this.create.bind(this));
				};
			};
		}
	},
	reconstruct_path: function() {
		let circ=this;
		let path=[];
		while (circ.next_) {
			path.push(circ.server_);
			circ=circ.next_;
		};
		while (circ.prev_) {
			circ.path_=path;
			circ.first_=this;
			circ=circ.prev_;
		};
	},
	circuit_destroy: function(no_destroy) {
		if (this.socket_) {
			if (this.socket_.remoteAddress) {
				console.log('CIRC : circuit destroy '+(this.OP_?'OP ':('OR '+(this.OR_f?'in ':'out ')))+(this.socket_.address()?this.socket_.address().address:'')+' CID '+this.circId+' remote '+this.socket_.remoteAddress);
			} else {
				console.log('circuit destroy : socket no remote address CIC '+(this.OP_?'OP ':'OR ')+' '+this.circId);
			};
			let boo;
			if (this.socket_) { //socket still exists (no OR_CONN_CLOSED for example)
				let sock=this.socket_;
				if (!this.next_) {
					if (this.socket_.address()) {
						if ((DB_OR)&&(parseInt(this.socket_.address().port)===parseInt(OR_port))&&(sock.OR_f)) {
							console.log('ORDB - call db_destroy');
							this.circuit_db_destroy();
						};
					};
				} else {
					if (!no_destroy) {
						if (!this.destroyed_) {
							this.destroyed_=true;
							if (sock.remoteAddress) {
								console.log('circuit_destroy remote address '+sock.remoteAddress+' CIC '+this.circId);
								this.destroy();
							};
						};
					};
				};
				delete sock[this.circId];
				delete this.socket_;
				Object.keys(sock).forEach(function(n) {
					if ((!isNaN(n))&&(n!=null)) {
						boo=true;
					};
				},this);
				if (!boo) {
					if ((this!==db_cid)&&(!sock.ws_)) {
						console.log('circuit_destroy: destroy socket');
						sock.destroy();
					};
				};
			};
		};
		console.log('circuit_destroy '+(this.OP_?'OP':'OR'));
		if (this.OP_) {
			console.log('requests_destroy');
			this.requests_destroy();
		};
		delete this.next_;
		delete this.prev_;
	},
	circuit_db_destroy: function() {
		if (this.socket_) {
			Object.keys(this).forEach(function(n) {
				if ((!isNaN(n))&&(n!=null)) {
					let dest=this.socket_?(this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+n):(this.server_?(this.server_.port+'-'+this.server_.ip+'-'+this.circId+'-'+n):'');
					let or=OR_csid_b[dest]||OR_csid_f[dest];
					if (or) {
						console.log('------- '+or[1]);
						or[0].send_db_end(2,or[1]);
						delete OR_csid_f[dest];
						delete OR_csid_b[dest];
						delete this[n];
						delete or[0][or[1]];
					};
				}
			},this);
		};
	},
	requests_destroy: function() {
		for (let n in this) {
			if ((!isNaN(n))&&(n!=null)) {
				let request=this[n];
				if (request.abstract_client_tls) {
					request.abstract_client_tls.close();
				};
				delete request.abstract_client_tls;
				this.destroy_cid(request); //do not reuse cid
				if (db_cid) {
					if (this!==db_cid) {
						if (request._data_) {
							request.destroy();
						} else {
							this.request_retry(request,'requests_destroy');
						};
					} else {
						clear_request(request);
					};
				} else {
					clear_request(request);
				};
			};
		};
		if (db_cid) {
			if (this===db_cid) {
				db_cid=null;
				Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:client,db:true}});
			};
		} else {
			Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:client,db:true}});
		};
	},
	clear_timers: function() {
		if (this.OP_) {
			this.first_.tc_.forEach(function(val) {clearTimeout(val)});
			this.first_.tc_=[];
		};
	},
	clear_t0_: function() {
		if (this.t0_) {
			this.t0_.forEach(function(val) {clearTimeout(val)});
			this.t0_=[];
		};
	},
	end:function(msg,retry,id) {
		let request;
		if (id) {
			let c=this.first_||this;
			request=c[id]?c[id]:c.request_;
		};
		msg=msg.split(':');
		console.log2=function() {};
		let circ_error=(function() {
			if (msg.length>1) {
				switch(parseInt(msg[1])) {
					case 0 : console.log2('-- CIC NONE            (No reason given.)');return 0;
					case 1 : console.log2('-- CIC PROTOCOL        (Tor protocol violation.)');return 1;
					case 2 : console.log2('-- CIC INTERNAL        (Internal error.)');return 2;
					case 3 : console.log2('-- CIC REQUESTED       (A client sent a TRUNCATE command.)');return 3;
					case 4 : console.log2('-- CIC HIBERNATING     (Not currently operating; trying to save bandwidth.)');return 4;
					case 5 : console.log2('-- CIC RESOURCELIMIT   (Out of memory, sockets, or circuit IDs.) '+this.circId+' '+(this.OP_?' OP ':' OR '));return 5;
					case 6 : console.log2(' -- CIC CONNECTFAILED   (Unable to reach relay.)');return 6;
					case 7 : console.log2('-- CIC OR_IDENTITY     (Connected to relay, but its OR identity was not as expected.)');return 7;
					case 8 : console.log2('-- CIC OR_CONN_CLOSED  (The OR connection that was carrying this circuit died CID '+this.circId+' '+(this.OP_?' OP ':' OR '));return 8;
					case 9 : console.log2('-- CIC FINISHED        (The circuit has expired for being dirty or old.)');return 9;
					case 10 : console.log2('-- CIC TIMEOUT         (Circuit construction took too long)');return 10;
					case 11 : console.log2('-- CIC DESTROYED       (The circuit was destroyed w/o client TRUNCATE)');return 11;
					case 12 : console.log2('-- CIC NOSUCHSERVICE   (Request for unknown hidden service)');return 12;
				};
			};
		}).bind(this);

		let relay_end=(function() {
			if (msg.length>1) {
				switch(parseInt(msg[1])) {
					case 1 : console.log2('-- RELAY REASON_MISC           (catch-all for unlisted reasons)'+' request '+(request?request.i_id:''));return 1;
					case 2 : console.log2('-- RELAY REASON_RESOLVEFAILED  (couldn t look up hostname)'+' request '+(request?request.i_id:''));return 2;
					case 3 : console.log2('-- RELAY REASON_CONNECTREFUSED (remote host refused connection) [*]'+' request '+(request?request.i_id:''));return 3;
					case 4 : console.log2('-- RELAY REASON_EXITPOLICY     (OR refuses to connect to host or port)'+' request '+(request?request.i_id:''));return 4;
					case 5 : console.log2('-- RELAY REASON_DESTROY        (Circuit is being destroyed)'+' request '+(request?request.i_id:''));return 5;
					case 6 : console.log2('-- RELAY REASON_DONE           (Anonymized TCP connection was closed)'+' request '+(request?request.i_id:''));return 6;
					case 7 : console.log2('-- RELAY REASON_TIMEOUT        (Connection timed out, or OR timed out while connecting)'+' request '+(request?request.i_id:''));return 7;
					case 8 : console.log2('-- RELAY REASON_NOROUTE        (Routing error while attempting to contact destination)'+' request '+(request?request.i_id:''));return 8;
					case 9 : console.log2('-- RELAY REASON_HIBERNATING    (OR is temporarily hibernating)'+' request '+(request?request.i_id:''));return 9;
					case 10 : console.log2('-- RELAY REASON_INTERNAL       (Internal error at the OR)'+' request '+(request?request.i_id:''));return 10;
					case 11 : console.log2('-- RELAY REASON_RESOURCELIMIT  (OR has no resources to fulfill request)'+' request '+(request?request.i_id:''));return 11;
					case 12 : console.log2('-- RELAY REASON_CONNRESET      (Connection was unexpectedly reset)'+' request '+(request?request.i_id:''));return 12;
					case 13 : console.log2('-- RELAY REASON_TORPROTOCOL    (Sent when closing connection because of Tor protocol violations.)'+' request '+(request?request.i_id:''));return 13;
					case 14 : console.log2('-- RELAY REASON_NOTDIRECTORY   (Client sent RELAY_BEGIN_DIR to a non-directory relay.)'+' request '+(request?request.i_id:''));return 14;
				};
			};
		}).bind(this);

		if (!retry) {
			delete this.socket_[this.circId];
		} else {
			switch(retry) {
				case 'handshake':this.change_or('handshake failed');break;
				case 'fast_key':this.change_or('wrong fast key');break; //TODO replace by create fast
				case 'created_extended_key':this.change_or('wrong create or extend key',this.prev_?this.prev_.extend:null);break;
				case 'truncated':this.relay_truncated_handle(circ_error());break;
				case 'truncate':this.relay_truncate_handle(circ_error());break;
				case 'begin_dir':this.send_relay_end_b(id,relay_end());break;
				case 'destroy':this.handle_destroy(circ_error());break;
				case 'unrecognized':console.log('end unrecognized circuit destroy');this.circuit_destroy();break;
				case 'relay_end':if (request) {if (typeof request.i_id!=='undefined') {this.relay_end_handle(id,relay_end())}};break;
			};
		};
	}
};

if (Extended) {
	Object.keys(Extended.prototype).forEach(function(k) {
		Circuit.prototype[k]=Extended.prototype[k];
	});
};

const Tor=function(request,circuit,msg) {
	let params=request.params_;
	request.time_ini=Date.now();
	if (params) {
		if (params.OP) { //OP
			if (!params.one_c) {
				circuit_start(request);
			} else {
				if (circuit) {
					if (choose_circuit(request,true)===true) {
						if (circuit) {
							//oconsole('circuit retry for request '+request.i_id+' - no other circuit - circuit start');
						};
						circuit_start(request);
					} else {
						let circ;
						circ=choose_circuit(request);
						if (circuit) {
							let nbloop=5;
							while ((circuit===circ)&&(nbloop!==0)) {
								circ=choose_circuit(request);
								nbloop--;
							};
						};
						if (circ) {
							if (circuit) {
								//oconsole('STREAM : circuit retry CIRC '+circ.circId+' '+circ.server_.ip+' choosen for request '+request.i_id);
							};
							circ.process(request);
						} else {
							//oconsole('STREAM : no other circuits for request '+request.i_id);
							if (circuit) {
								//oconsole('STREAM : circuit retry circuit_start for request '+request.i_id);
							};
							circuit_start(request);
						};
					};
				} else {
					let circ;
					if (request.cid_) {
						if (request.cid_.bad_) {
							delete request.tls_client_connected;
							delete request.abstract_client_tls;
							request.cid_.destroy_cid(request);
						};
					};
					if (request.params_.ws||request.params_.db_) {
						circ=request.cid_?request.cid_:(params.one_c?choose_circuit(request):null);
					} else {
						circ=choose_circuit(request);
						while (circ===db_cid) {
							circ=choose_circuit(request);
						};
					};
					if (circ) {
						console.log('choose circuit '+circ.circId+' for request '+request.i_id);
						if (circ[request.sid_]) {
							if (circ.last_) {
								circ.last_.stream_handle_connected(request.sid_);
							} else {
								circ.destroy_cid(request);
								Tor(request);
							};
						} else {
							circ.process(request);
						};
					} else {
						console.log('no circuits');
						if (OP_req.length===0) {
							circuit_start(request);
						} else {
							OP_req.push(request);
						};
					};
				};
			};
		} else { //OR v3
			let servername='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.net'; //check .net or .com
			let issuer='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com';
			let date=new Date();
			let certid=parseInt((Rand(8)).toString('hex'),16);
			let cert=createIdLinkTLSCert(pathd+OR_name+'/pub-key.pem',pathd+OR_name+'/priv-key.pem','pem',certid,date,servername,issuer);
			let options = {
				key: fs.readFileSync(pathd+OR_name+'/priv-key.pem'),
				cert: cert,
				servername: servername
			};
			let server=tls.createServer(options, function(socket) {
				let ip=socket.remoteAddress;
				let port=socket.remotePort;
				init_socket_or(socket,OR_name);
				socket.on('data',on_data);
				socket.on('error',function(error) {console.log('OR socket error');console.log(error);delete OR_sock_in[ip+':'+port];});
				socket.on('end',function() {delete OR_sock_in[ip+':'+port];});
				socket.on('close',function() {delete OR_sock_in[ip+':'+port];});
				socket.cert_issuer=issuer;
				socket.cert_subject=servername;
				socket.cert_date=date;
				socket.certid_=certid;
				OR_sock_in[ip+':'+port]=socket;
			});
			server.listen(params.port, function() {
				console.log("OR : server launched port "+params.port+' '+servername);
				setInterval(test_peers,DB_CIRC_POLL);
			});
			server.on('tlsClientError',function(exception) {console.log(exception)});
			server.on('error',function(error) {console.log(error)});
			server.on('end',function(error) {console.log(error)});
		};
	};
};

const circuit_start=function(request) {
	console.log('circuit_start');
	if (NB_C>NB_C_MAX) {
		document.location.href=document.location.href;
	};
	let params=request.params_;
		let p=[];
		if (params.nb_hop) {
			if (params.nb_hop>2) {
				p=create_path(params);
			};
		} else {
			p=create_path(params);
		};
		if (one_OR) {
			p[0]=one_OR;
		};
		if (params.db) {
			p[NB_DB_HOP-1]=DB_OR;
		};
		console.log('PATH :'+p[0].ip+' '+p[1].ip+' '+(p.length>2?(p[2].ip):''));
		let s=OP_sock[p[0].ip];
		let circ=new Circuit(p);
		circ.request_=request;
		circ.first_=circ;
		circ.tc_=[];
		if (!s) {
			console.log('circuit_start init socket');
			circ.circId=0;
			if (!params.ws) {
				tls_socket(circ);
			} else {
				if (params.ws.wsconnected_) {
					init_socket_(params.ws,circ);
					init_socket.call(params.ws,circ);
				};
			};
		} else {
			if ((s.abstract_client_tls)&&(!s.tls_connected)&&(s.wsconnected_)) {
				console.log('start TLS handshake - circuit start ');
				s.abstract_client_tls.handshake();
			} else {
				console.log('TLS connected - start create_fast');
				circ.server_=s.server_;
				circ.socket_=s;
				circ.tc_=[];
				if (circ.setCircId()) {
					console.log('Sending fast CIC '+circ.circId+' '+s.server_.ip+' '+circ.destroyed_);
					if (params.db) {
						client.db_cid_launched=true;
					};
					circ.X_=Rand(20);
					let fast=new Cell(circ.circId,Cell.prototype.CREATE_FAST,circ.X_);
					circ.send(fast);

				} else {
					console.log('PATH : no more circuits available');
				};
			};
		};
};

const choose_circuit=function(request,bool) {
	let a=[];
	let b=[];
	for (let n in OP_sock) {
		Object.keys(OP_sock[n]).forEach(function(m) {
			let tmp=OP_sock[n][m];
			if ((!isNaN(m))&&(m!=null)&&(tmp.last_)&&(request.no_exit.indexOf(tmp)===-1)&&(!tmp.bad_)) {//TODO remove no_exit ??
				if (tmp!==db_cid) {
					b.push(tmp);
				};
			};
		});
		if (b.length) {
			a.push(b);
		};
	};
	if (a.length) {
		if (!bool) {
				let r=a[simple_random(a.length)];
				let res,l;
				if (request.nb_try) {
					r=r.map(function(val) {return [val,val.time_average]});
					r.sort(function(a,b) {a=a[1];b=b[1];return a==b?0:(a<b?-1:1)});
					let n=0;
					let m=r.length;
					n=parseInt(r.length/2);
					if (n) {
						r=r.slice(n,Math.min(r.length,BEST_CIRCS+n));
					};
					oconsole('best circuits '+(r[0]?r[0][0].circId:'')+' '+(r[1]?r[1][0].circId:'')+' '+(r[2]?r[2][0].circId:''));
					l=simple_random(r.length);
					res=r[l][0];
				} else {
					l=simple_random(r.length);
					res=r[l];
					res.time_=new Date().valueOf();
				};
				return res;
		} else {
			if ((a.length===1)&&(a[0].length===1)) {
				return true;
			};
		};
	} else {
			console.log('choose circuit no circuit found for request '+request.i_id);
	};
};

const create_path=function(params) {
	let r=[];
	let p=[];
	let i,l;
	let list=[];
	let nb_hop=params.nb_hop||NB_HOP_MAX;
	if (nb_hop>NB_HOP_MAX) {
		nb_hop=NB_HOP_MAX;
	};
	params.nb_try=params.nb_try||1;
	if (params.nb_try>NB_TRY_MAX) {
		console.log('PATH : createPath : Too many attempts');
		return;
	};
	l=Guards.length;
	i=simple_random(l);
	i=Guards[i].split('-');
	list.push(i[1]);
	p.push({ip:i[1],fing:i[0],port:i[2],band:i[3],o_modulus:(i[5]?i[5]:i[4])});
	nb_hop--;
	l=Relays.length;
	nb_hop--;
	while (nb_hop) {
		i=simple_random(l);
		if ((r.indexOf(i)==-1)&&(Relays[i].split('-')[1]!=p[0].ip)) {
			r.push(i);
			nb_hop--;
		};
	};
	let f=function(val) {
		let o=Relays[val].split('-');
		let tmp={ip:o[1],fing:o[0],port:o[2],band:o[3],o_modulus:(o[5]?o[5]:o[4])};
		list.push(o[1]);
		p.push(tmp);
	};
	r.forEach(f);
	l=Exit.length;
	i=simple_random(l);
	while (list.indexOf((Exit[i].split('-'))[1])!=-1) {
		i=simple_random(l);
	};
	i=Exit[i].split('-');
	p.push({ip:i[1],fing:i[0],port:i[2],band:i[3],o_modulus:(i[5]?i[5]:i[4])});
	return p;
};

const test_peers=function() {
	//testing ORDB circuits alive
	for (let m in OR_sock_in) {
		if (parseInt(OR_sock_in[m].address().port)===parseInt(OR_port)) {
			Object.keys(OR_sock_in[m]).forEach(function(n) {
				if ((!isNaN(n))&&(n!=null)) {
					try {
						let circ=OR_sock_in[m][n];
						if (circ.db_test) {
							circ.db_test.forEach(function(val) {clearTimeout(val);});
						};
						circ.db_test=[];
						let dest=function() {
							if (!circ.destroyed_) {
								console.log('Destroying db_query_no_answer CID '+circ.circId+' remote '+(circ.socket_?circ.socket_.remoteAddress:'null'));
								circ.circuit_destroy();
								circ.destroyed_=true;
							};
						};
						if (circ.circId!==0) {
							if ((circ.socket_)&&(!circ.destroyed_)) {
								let boo;
								for (let sid in circ) {
									if ((!isNaN(sid))&&(sid!=null)) {
										if (OR_csid_b[circ.socket_.remotePort+'-'+circ.socket_.remoteAddress+'-'+circ.circId+'-'+sid]||OR_csid_f[circ.socket_.remotePort+'-'+circ.socket_.remoteAddress+'-'+circ.circId+'-'+sid]) {
											boo=true;
											break;
										};
									};
								};
								if (!boo) {
									console.log('Testing CID '+circ.circId+' remote '+circ.socket_.remoteAddress+' '+Date.now());
									let tid=Rand(16);
									let param={d_length:0,hash_:new Buffer('0000000000000000000000000000000000000000','hex')};
									circ.send_db_query(param,tid);
									circ.db_test.push(setTimeout(dest,DB_CIRC_TEST));
								} else {
									console.log('Download in progress - Not testing CID '+circ.circId+' remote '+circ.socket_.remoteAddress+' '+Date.now());
								};
							} else {
								dest();
							};
						};
					} catch (ee) {};
				};
			});
		};
	};
};

const handleRequest=function (request) {
	request.i_id=I_ID;
	request.nb_try=0;
	request.no_exit=[];
	request.squeue_=[];
	request.wsqueue_=[];
	request._date_=Date.now();
	I_ID++;
	ISOCKSin.push(request.i_id);
	console.log('INCOMING SOCKET : ------------------------------------- new incoming socket ----------------------------------------------- request '+request.i_id+' on remote port '+request.remotePort+' for port '+request.address().port);
	let socket_retry=function() {
		if (request.cid_) {
			request.socket_retry=setTimeout(socket_retry,SOCK_RETRY);
			let cid=request.cid_;
			cid.perf_--;
			if (request.no_exit.indexOf(cid)===-1) {
				request.no_exit.push(cid);
			};
			if (request.sid_) {
				cid.relay_end_handle(request.sid_,' socket retry ');
			} else {
				Tor(request,cid,'socket retry');
			};
		} else {
			request.destroy();
		};
	};
	let socket_handle=function(data) {
		let tab=data.split(':::');
		if (tab.length===3) { //specific
			request.params_={host:tab[0],OP:true,nb_hop:tab[1],stream:new Buffer((new Buffer(tab[2],'utf8')).toString('hex'),'hex'),one_c:tab[3]};
			Tor(request);
		} else { //protocols
			let params={};
			let res=simpleParser(data);
			params.OP=true;
			params.nb_hop=NB_HOP;
			params.one_c=true;
			if (data.indexOf('WebSocket')!=-1) { //websocket
				console.log('Answer websocket');
				websocket_answer(res,request,OR_name);
				//handle tls over WS
					let servername='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.net';
					let issuer='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com';
					let date=new Date();
					let certid=parseInt((Rand(8)).toString('hex'),16);
					let cert=createIdLinkTLSCert(pathd+OR_name+'/pub-key.pem',pathd+OR_name+'/priv-key.pem','pem',certid,date,servername,issuer);
					let socket=new stream.Duplex();
					let sslcontext=tls.createSecureContext({key: fs.readFileSync(pathd+OR_name+'/priv-key.pem'),cert: cert,servername: servername});
					let cleartext=new tls.TLSSocket(socket,{secureContext:sslcontext,isServer:true});
					request.encrypted=socket;
					cleartext.tlspair_=true;
					cleartext.server=request.server;
					cleartext.i_id=request.i_id;
					cleartext.nb_try=request.nb_try;
					cleartext.no_exit=request.no_exit;
					cleartext.squeue_=request.squeue_;
					cleartext.wsqueue_=request.wsqueue_;
					cleartext._date_=request._date_;
					cleartext._init_=request._init_;
					cleartext.OR_=request.OR_;
					cleartext.OR_f=request.OR_f;
					cleartext.way_=request.way_;
					cleartext.privkey_=request.privkey_;
					cleartext.connected_=request.connected_;
					cleartext.wsconnected_=request.wsconnected_;
					cleartext.address=function() {return {port: request.address().port,family:'IPv4',address:request.address().address}};
					cleartext.__defineGetter__('remoteAddress',function() {return request.remoteAddress}); //override stupid node getter
					cleartext.__defineGetter__('remotePort',function() {return request.remotePort}); //override stupid node getter
					cleartext.stream_tor_=new Buffer(0);
					cleartext.cert_issuer=issuer;
					cleartext.cert_subject=servername;
					cleartext.cert_date=date;
					cleartext.certid_=certid;
					request.encrypted._read=function() {
						const cb=this['cb'];
						if (cb) {
							this['cb']=null;
							cb();
						};
					};
					request.encrypted._write=function(chunk,encoding,cb) {
						this['cb']=cb;
						request.write(wsencode(chunk));
					};
					OR_sock_in[request.remoteAddress+':'+request.remotePort]=cleartext;
					cleartext.on('data',function(data) {
						//console.log('cleartext received: '+data.slice(0,100).toString('utf8'));
						on_data.call(cleartext,data);
					});
					cleartext.on('end',function() {request.end()});
					cleartext.on('error',function() {request.end()});
				return false;
			};
			if (data.indexOf('HTTP')!=-1) { //direct proxy
				if (res.Host) {
					params.host=res.Host+':80';
					request.connected_=true;
				};
			};
			params.stream=new Buffer((new Buffer(data,'utf8')).toString('hex'),'hex');
			if (params.stream.slice(0,1).readUInt()===5) { //socks v5 proxy
				request.socks_=true;
				request.connected_=true;
				request.write(new Buffer('0500','hex'));
				return false;
			};
			return params;
		};
	};
	request.on('data', function(data) {
		if (!request.ws_) {
			console.log('INCOMING SOCKET :------------- RECEIVED FROM INCOMING SOCKET ------------ '+request.i_id+' on port '+request.remotePort+' '+request.remoteAddress+' '+request.address().port);
		};
		let params;
		if (!request.connected_) {
			params=socket_handle(data.toString('utf8'));
		} else {
			params={};
			params.OP=true;
			params.nb_hop=NB_HOP;
			params.one_c=true;
			params.host=request.host_?request.host_:false;
			if (!request.params_) {
				request.params_=params;
			} else {
				request.params_.host=params.host;
			};
			params.stream=params.host?data:false;
			if (params.stream) {
				let execute=function(data) {
					return function() {
						this.params_.stream=data;
						Tor(request);
					};
				};
				request.squeue_.push(execute(data).bind(request));
			};
			if (request.ws_) { //WS_OP_SOCK and WS_OP
				if (!request.wsconnected_) {
					console.log('server ws not connected');
					websocket_answer(simpleParser(data.toString('utf8')),request,OR_name); //request is OR, client is OP
					return;
				} else {
					on_data.call(this,data);
					return;
				};
			};
			if (request.socks_) {
				if (!params.stream) {
					switch (data.slice(3,4).readUInt()) {
						case 1:request.host_=ValToIP(data.slice(4,8))+':'+data.slice(8).readUInt();break
						case 3:
							let l=data.slice(4,5).readUInt();
							request.host_=(data.slice(5,5+l)).toString('utf8')+':'+data.slice(l+5).readUInt();
							break;
						default:return
					};
					params.host=request.host_;
					console.log('INCOMING SOCKET : socks request '+request.i_id+' host '+request.host_+' remote '+request.remoteAddress+':'+request.remotePort);
					request.start_=[new Buffer('050000','hex'),data.slice(3)].concatBuffers();
					request_start(request);
					return;
				};
			};
		};
		if (params) {
			console.log('Received socks and doing OP, params request '+request.i_id+' '+(params.stream?(params.stream.toString('utf8').substr(0,200)):''));
			if (params.stream) {
				request._data_=false;
				if (request.squeue_.length===1) {
					request.squeue_[0]();
				};
			};
		};
	});
	request.on('end',function() {
		console.log('INCOMING SOCKET : End -------------------------end incoming socket------------------------------------- request '+request.i_id+' host '+request.host_);
		monitor_circuits_OR_out();
		setTimeout(clear_circuits_OR_out,0);
		ISOCKSout.push(request.i_id);
		if (request.ws_) {
			destroy_ws_cid(request);
		};
		try {request.cid_.destroy_cid(request,true);} catch(ee) {};
	});

	request.on('close',function() {
		console.log('INCOMING SOCKET : Close -------------------------end incoming socket------------------------------------- request '+request.i_id);
		setTimeout(clear_circuits_OR_out,0);
		ISOCKSout.push(request.i_id);
		if (request.ws_) {
			destroy_ws_cid(request);
		};
		try {request.cid_.destroy_cid(request,true);} catch(ee) {};
		//console.log(request.i_id);
	});

	request.on('error',function(e) {
		console.log('INCOMING SOCKET : Error -------------------------end incoming socket------------------------------------- request '+request.i_id);
		setTimeout(clear_circuits_OR_out,0);
		ISOCKSout.push(request.i_id);
		//console.log(e.name);
		//console.log(e.message);
		//console.log(e.code);
		if (request.ws_) {
			destroy_ws_cid(request);
		};
		try {request.cid_.destroy_cid(request,true);} catch(ee) {};
	});

	request._write_=function(resp) {
		if (!request.destroyed) {
			try {
				request.write(resp);
			} catch(ee) {};
		};
	};
	request._init_=init_request;
};

const init_socket_or=function(socket,or_name) {
	socket.OR_=true;
	socket.OR_f=true;
	socket.way_='socket in';
	socket.privkey_=fs.readFileSync(pathd+or_name+'/priv-key.pem');
	socket.stream_tor_=new Buffer(0);
	let circ=new Circuit();
	circ.remote_=socket.remoteAddress;
	circ.OR_=true;
	circ.OR_f=true;
	circ.circId=0;
	circ.socket_=socket;
	circ.way_='socket in';
	socket[0]=circ;
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

const websocket_answer=function(res,request,or_name) {
	let key=res['Sec-WebSocket-Key'];
	let H=crypto.createhash('sha1');
	H.update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
	let hash=H.digest('hex');
	hash=(new Buffer(hash,'hex')).toString('base64');
	let resp='HTTP/1.1 101 WebSocket Protocol Handshake\r\n';
	resp +='Upgrade: websocket\r\n';
	resp +='Connection: Upgrade\r\n';
	resp +='Sec-WebSocket-Accept:'+hash+'\r\n';
	resp +='Access-Control-Allow-Origin:'+res['Origin']+'\r\n';
	resp +='\r\n';
	console.log('INCOMING SOCKET :'+resp);
	request.ws_=true;
	init_socket_or(request,or_name);
	request.connected_=true;
	request.wsconnected_=true;
	request.write(resp);
};

const Handle_cells=function(cells,bool) {
	if (cells) {
		let l=cells.length;
		let circ;
		for (let i=0;i<l;i++) {
			let cell=cells[i];
			let cid=cell.CircID.readUInt();
			if (this[cid]) {
				circ=this[cid];
			} else {
				if (this.OR_&&this.OR_f) {
					if (this[0]) {
						circ=this[0];
						circ.circId=cid;
						this[cid]=circ;
						delete this[0];
					} else {
						circ=new Circuit();
						circ.OR_=true;
						circ.OR_f=true;
						circ.circId=cid;
						circ.socket_=this;
						circ.way_='socket in';
						this[cid]=circ;
					};
				} else {
					return;
				};
			};
			try {circ.clear_timers();} catch(ee) {};
			if (cell.Command.readUInt()===6) {
				console.log('handle cell '+cell.Command.readUInt());
			};
			if (!circ.destroyed_) {
				switch(cell.Command.readUInt()) {
					case cell.PADDING : circ.padding_cell_handle(cell);break;//OR
					case cell.VERSIONS : circ.versions_cell_handle(cell);break;
					case cell.CERTS : circ.certs_cell_handle(cell);break;
					case cell.AUTH_CHALLENGE : circ.auth_challenge_cell_handle(cell);break;
					case cell.NETINFO : circ.netinfo_cell_handle(cell);break;
					case cell.CREATE_FAST : circ.create_fast_cell_handle(cell);break;//OR
					case cell.CREATE_FAST_WS : circ.create_fast_ws_cell_handle(cell);break;//OR
					case cell.CREATED_FAST : circ.created_fast_cell_handle(cell);break;
					case cell.CREATED_FAST_WS : circ.created_fast_ws_cell_handle(cell);break;
					case cell.CREATE : circ.create_cell_handle(cell);break; //OR
					case cell.CREATED : circ.created_cell_handle(cell);break;
					case cell.RELAY : circ.relay_cell_handle(cell,bool);break; //OP and OR
					case cell.RELAY_EARLY : circ.relay_cell_handle(cell,bool);break; //OP and OR
					case cell.DESTROY : circ.end('Destroy reason:'+((cell.Payload[0]).slice(0,1)).readUInt(),'destroy');break;
				};
			} else {
				console.log('received cell for destroyed CIC '+circ.circId);
			};
		};
	} else {
		console.log('end or banish circuit_destroy');
		this.circuit_destroy();
	};
};

const tls_socket=function(circ) {
	//OP socket
	let options=client_tls_options(OR_name);
	console.log('OUTGOING SOCKET : ---------start initial socket------------'+options.servername+' '+circ.server_.ip+' '+circ.server_.port);
	let tls_socket_=tls.connect(circ.server_.port, circ.server_.ip,options, function() {
		clearTimeout(t0);
		init_socket.call(this,circ);
	});
	tls_socket_.on('data', on_data);
	let end_=function() {
		if (tls_socket_.nbc_>1) {
				circuits_destroy(tls_socket);
		} else {
			clearTimeout(t0);
			if (circ.destroy_) {
				circuits_destroy(tls_socket);
			} else {
				if (!circ.last_) {
					circ.clear_t0_();
					delete circ.ok_;
					delete OP_sock[circ.server_.ip];
					circ.circuit_retry();
				} else {
					circuits_destroy(tls_socket);
				};
			};
		};
	};
	tls_socket_.on('end',end_);
	tls_socket_.on('close',end_);
	tls_socket_.on('error',function() {
		clearTimeout(t0);
		circ.destroy_=true;
		tls_socket_.destroy();
		if (!circ.last_) {
			circ.change_or('initial socket error');
		};
	});
	let do_not_wait=function() {
		circ.destroy_=true;
		tls_socket_.destroy();
		circ.change_or('initial socket failed');
	};
	init_socket_(tls_socket_,circ);
	let t0=setTimeout(do_not_wait,2000);
};

const monitor_circuits=function() {
	//console.log('MONITOR start ----');
	//monitor and create circuits
	let a=[];
	let c=[];
	let nb=0;
	let na=0;
	let time=false;
	let time_=new Date().valueOf();
	for (let n in OP_sock) {
		a.push([n,OP_sock[n]]);
	};
	let times=0;
	a.forEach(function(d) {
		Object.keys(d[1]).forEach(function(n) {
			if ((!isNaN(n))&&(n!=null)) {
				let circ=d[1][n];
				let tmp=circ.last_?circ.last_:null;
				if (tmp) {
				Object.keys(circ).forEach(function(m) {
					if ((!isNaN(m))&&(m!=null)) {
						c.push(circ[m].i_id+' '+circ[m].remotePort);
					};
				});
					if ((nb<NB_C_MAX2)&&(((time_-circ.time_)<CIRC_KA))&&(NB_C<NB||((circ.time_average<TIME_AVERAGE+T_A)))&&(circ.perf_>=0)&&((!circ.bad_)||((circ.time_average<TIME_AVERAGE)&&circ.bad_))||(circ===db_cid)) {
						delete circ.bad_;
						if (circ.time_average) {
							times +=circ.time_average;
							na++;
						};
						circ.keep_alive();
						if (circ!==db_cid) {
							nb++;
						};
						if ((circ===db_cid)&&((time_-circ.time_)>CIRC_DB_TIME)) {
							let req;
							for (let n in circ) {
								if ((!isNaN(n))&&(n!=null)&&(typeof n!=='function')) {
									req=true;
									break;
								};
							};
							if (!req) {
								console.log('monitor UPDATE DB CID ---------'+circ.circId);
								circ.circuit_destroy(); //destroy if no more pending streams
							} else {
								console.log('download in progres, not changing DB CID ----------');
								circ.time_=Date.now();
							};
						};
						if (circ.last_) {
							let last=circ.last_;
							if (last.server_) {
								if ((circ!==db_cid)&&(last.server_.ip===OR_IP)&&(last.server_.port===OR_port)) {
									console.log('destroying ordb last CIC '+circ.circId);
									circ.circuit_destroy();
								};
							};
						}
					} else {
						if (circ.bad_) {
							let req;
							for (let n in circ) {
								if ((!isNaN(n))&&(n!=null)) {
									req=true;
									break;
								};
							};
							if (!req) {
								console.log('monitor DESTROY '+circ.circId);
								circ.circuit_destroy(); //destroy if no more pending streams
							};
						} else {
							circ.bad_=true;
						};
					};
				};
			};
		});
		//console.log('MONITOR : circuits available ---------'+d[0]+' '+b.length+' '+b.toString());
	});
	let op=[];
	ISOCKSin.forEach(function(id) {if (ISOCKSout.indexOf(id)===-1) {op.push(id)}});
	NB_C=nb;
	TIME_AVERAGE=na?(times/na):TIME_AVERAGE;
	if ((nb>=NB)&&(!time)) {
		if (db_cid) {
			WAIT=true;
		} else {
			WAIT=false;
		};
	} else {
		WAIT=false;
	};
	if (!WAIT) {
		if (window_browser) {
			if (client) { //browser define client
				console.log('establish new circuit');
				if (db_cid) {
					Tor({params_:{OP:true,nb_hop:NB_HOP,ws:client}});
				} else {
					if (!client.tls_connected) {
						delete client.db_cid_launched;
					};
					console.log('monitor create db circuit');
					Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:client,db:true}});
				}
			};
		};
	};
	update_circ();
};

const monitor_circuits_OR_out=function() {
	let a=[];
	let c=[];
	for (let n in OR_sock) {
		a.push([n,OR_sock[n]]);
	};
	console.log('----------------- '+a.length+' sockets out----------------');
	a.forEach(function(d) {
		Object.keys(d[1]).forEach(function(n) {
			if ((!isNaN(n))&&(n!=null)) {
				let circ=d[1][n];
				//console.log('CID '+circ.circId+' socket out remote '+circ.server_.ip+' '+(circ.prev_?(circ.prev_.socket_?('prev '+circ.prev_.socket_.remoteAddress):'no socket'):'no prev'));
			};
		});
	});
	console.log('-----------------');
};

module.exports={Tor,handleRequest,Handle_cells,monitor_circuits};