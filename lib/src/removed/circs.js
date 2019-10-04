create_fast_ws_cell_handle:function(cell) {
		if (cell.Payload.length) {
			this.X_=cell.Payload[0].key_material;
			this.Y_=Rand(20);
			var K0=[this.X_,this.Y_].concatBuffers();
			var KH=this.circuit_keys(K0);
			var resp=new Cell(this.circId,Cell.prototype.CREATED_FAST_WS,new Buffer(crypto_aes_encrypt([this.Y_,KH].concatBuffers(),this.X_.slice(0,16)),'hex'));
			this.send(resp);
		} else {
			this.destroy(1);
		};
	},
	created_fast_ws_cell_handle:function(cell) {
		var dec=new Buffer(crypto_aes_encrypt(cell.Payload[0].key,this.X_.slice(0,16)),'hex');
		//console.log('created decoded Y KH '+dec.toString('hex'));
		this.Y_=dec.slice(0,20);
		var K0=[this.X_,this.Y_].concatBuffers();
		var KH=this.circuit_keys(K0);
		if (KH.toString('hex')!=dec.slice(20,40).toString('hex')) {this.end('KH key does not match','fast_key')} else {
			this.created_handle();
		};
	},

	//remove !tls stream_hanndle_data
	else {
					console.log('STREAM RELAY : --------------RECEIVE DECODED TLS DATA FROM---------------------- '+this.server_.ip+' CID '+this.circId+' Stream '+sid+' for request '+request.i_id+' length '+stream.length.readUInt());
					var deb=(stream.data.slice(0,stream.length.readUInt()));
				};
										if ((!request._data_)||(request.wait_header)) {
						var parse;
						request._data_=true;
						if (request.download_) {
							resp=request.wait_header?[request.wait_header,resp].concatBuffers():resp;
							parse=simpleParser(resp.toString('utf8'));
							if ((typeof parse['1a']==='undefined')||(parse['1a']!=='')) { //header not complete
								request.wait_header=resp;
								return;
							} else {
								delete request.wait_header;
							};
							var status=parse['0a'].split(' ');
							status=status[1]?status[1]:null;
							if (status) {
								oconsole('STREAM : status code '+status+' for request '+request.i_id);
								status=status.toString();
								if (['2','3'].indexOf(status[0])===-1) {
									Myalert('<p style="text-align:center">Wrong URL, please check and try again</p>');
									remove(request.bar_);
									first_.send_relay_end(request.sid_);
									return;
								} else {
									if (status[0]==='3') {
										if (parse['Location']) {
											var url=url_decode(parse['Location']);
											request.params_.stream=get_request(url.host,url.rest);
											first_.send_relay_end(request.sid_);
											delete first_[request.sid_];
											delete request.cid_;
											Tor(request);
										};
										return;
									} else {
										request.d_length=request.d_length||0; //resume
										if (parse['Content-Type']) {
											request.content_=parse['Content-Type'];
										} else {
											request.content_='application/octet-binary';
										};
										if ((parse['Content-Length'])&&(!request.clength_)) { //resume
											request.clength_=parseInt(parse['Content-Length']);
										};
										if (!request.clength_) {
											for (var n in parse) {
												if (n.toLowerCase().indexOf('content-length')!==-1) {
													request.clength_=parseInt(parse[n]);
													break;
												};
											};
										};
										request.pieces=Math.ceil(request.clength_/BSIZE);
										if (parse['Transfer-Encoding']) {
											request.encoding_=parse['Transfer-Encoding'];
										};
										console.log('Start relay_data');
										console.log(request.content_);
										console.log(request.clength_);
										console.log(request.encoding_?request.encoding_:'No encoding');
										resp=(resp.toString('hex')).split(CRLF+CRLF);
										resp.shift();
										resp=new Buffer(resp.join(CRLF+CRLF),'hex');
									};
								};
							};
							//clearTimeout(request.socket_retry);
						};
					}

					if (this.OP_) {
			if (!first_.last_) {
				//not used
				var retry;
				this.clear_timers();
				var tc_;
				if (this===first_) {
					if (this.socket_) {
						if (this.socket_.handshake_) {
							retry=function() {console.log('CIRC : Create or first extend too long '+this.circId);this.circuit_retry()};
							tc_=TC_CREATE;
						} else {
							retry=function() {this.change_or('Handshake version no answer or bad answer - change OR')};
							tc_=TC_VERSION;
						};
					} else {
						retry=function() {this.change_or('Handshake version no answer or bad answer - change OR')};
						tc_=TC_VERSION;
					};
				} else {
					retry=function() {console.log('CIRC : Extend delay expired - change or '+this.server_.ip);this.change_or('- extend too long',this.extend);};
					tc_=TC_EXTEND;
				};
			};
		};

		set_certs: function(val) {
		try {
			val=val.split(RSA_PUB_PFX);
			//console.log('RSA_PUB '+val.length);
			this.server_.onion_k=RSA_PUB_PFX+val[1].split(RSA_PUB_SFX)[0]+RSA_PUB_SFX;
			this.server_.sign_k=RSA_PUB_PFX+val[2].split(RSA_PUB_SFX)[0]+RSA_PUB_SFX;
			var pem=new PEM();
			this.server_.o_modulus=pem.modulus(this.server_.onion_k);
			this.server_.s_modulus=pem.modulus(this.server_.sign_k);
			return true;
		} catch(ee) {
			this.nb_error=this.nb_error?++this.nb_error:1;
			return false;
		};
	},
	get_certs: function(cb) {
		if ((this.server_)&&(!this.ok_)) {
			var d=Dirs.length;
			var fing=this.server_.fing;
			var r=simple_random(d);
			var tmp=Dirs[r].split(':');
			var ip=tmp[0];
			var port=tmp[1];
			//console.log('CERTS :'+this.server_.ip+' get_certs '+r+' dir :'+ip+':'+port+'/tor/server/fp/'+fing);
			var options = {
				host: ip,
				path: '/tor/server/fp/'+fing,
				port: port,
				headers: {'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Encoding':'gzip deflate','Accept-Language':'fr,fr-fr;q=0.8,en-us;q=0.5,en;q=0.3','Cache-Control':'max-age=0','Connection':'keep-alive','Host':ip,'User-Agent':'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0'}
			};
			var req=http.request(options,(function(res) {
				req.data_='';
				if (res.statusCode!=200) {
					this.clear_t0_();
					try {
						//console.log('CERTS : Error status code http://'+ip+'/tor/server/fp/'+fing+' '+this.server_.fing);
						this.get_certs(cb);
					} catch(ee) {};
				};
				res.on('data', (function(d) {
					//console.log('CERTS : clear timeout ');
					this.clear_t0_();
					req.data_ +=d.toString('utf8');
				}).bind(this));
				res.on('end',(function() {
					if ((this.server_)&&(!req.destroy_)) {
						//console.log('CERTS : before calling cb '+this.certs_);
						if (!this.certs_) {
							if (this.set_certs(req.data_)) {
								//console.log('CERTS : calling cb '+this.server_.ip+' '+fing+' from '+ip);
								this.certs_=true;
								if (!this.prev_) {
									//console.log('CERTS : cb create');
									cb.call(this);
								} else {
									//console.log('CERTS : cb extend');
									//console.log(this.prev_.server_);
									cb.call(this.prev_);
								};
							} else {
								if (this.nb_error>4) {
									this.change_or('CERTS : get_certs wrong cert for '+fing,this.first_!==this?function(){this.get_certs(cb)}:null);
								} else {
									//console.log('CERTS : Retry get_certs wrong cert for '+fing);
									this.get_certs(cb);
								};
							};
						};
					};
				}).bind(this));
			}).bind(this));
			var error_=(function() {
				this.clear_t0_();
				if (this.server_) {
					//console.log('CERTS : error get_certs http://'+ip+'/tor/server/fp/'+fing+' '+e.message);
					this.nb_error=this.nb_error?++this.nb_error:1;
					if (this.nb_error>4) {
						this.change_or('error get_certs',this.first_!==this?function() {this.get_certs(cb)}:null);
					} else {
						this.get_certs(cb);
					};
				};
			}).bind(this);
			req.on('error',error_);
			req.end();
			var do_not_wait=(function() {
				this.clear_t0_();
				//strange behavior (node.js), to investigate, error fired after abort
				req.removeListener('error',error_);
				error_=function() {console.log('CERTS : error fired after abort for '+ip)};
				req.on('error',error_);
				req.destroy_=true;
				req.socket.destroy();
				//req.abort();
				//console.log('CERTS : 1-get_certs do not wait');
				if (this.server_) {
					//console.log('CERTS : 2-get_certs do not wait '+this.server_.ip+' for '+ip);
					this.get_certs(cb);
				};
			}).bind(this);
			this.t0_.push(setTimeout(do_not_wait,1000));
			//console.log('CERTS : timeout '+this.t0_);
		};
	},