		var replace=function(txt,request,boo2) {
			var reg=/(((\b(https?|ftp|file):\/\/)|\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
			var boo=false;
			var url=function(val) {
				var test=txt.split(val);
				if ((test[test.length-1]==='')&&(!boo2)) {
					boo=true;
					return;
				};
				var rurl=txt;
				val=url_decode(val);
				var fake_domain=request.fake_domain;
				var domain=OP_domains[fake_domain];
				var r=domain.real_domain_s; //lepoint.fr
				if (val.host) {
					if (val.host.indexOf(r)!==-1) {
						var h=val.host.split('.'); //[lepoint,fr]
						var r_d=domain.real_domain_a; //[www,lepoint,fr]
						if (val.host===domain.real_domain) { //www.lepoint.fr
							//rurl='http://'+fake_domain+'/'+encrypt_decrypt(val.rest?val.rest:'',true);
							//rurl=val.rest?val.rest:'';
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+(val.rest?val.rest:'');
						} else if (((h.length===2) && (r_d[0]==='www')) || ((r_d.length===2) && (h[0]==='www'))) { //lepoint.fr
							//rurl='http://'+fake_domain+'/'+encrypt_decrypt(val.rest?val.rest:'',true);
							//rurl=val.rest?val.rest:'';
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+(val.rest?val.rest:'');
						} else { //sport.lepoint.fr
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+encrypt_decrypt(url_encode(val),true);
						};
					} else {
						if (val.host.indexOf(fake_domain)===-1) {
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+encrypt_decrypt(url_encode(val),true);
							//rurl=val.protocol+'//'+fake_domain+'/'+encrypt_decrypt(url_encode(val),true);
						};
					};
				};
				return rurl;
			};
			var tmp=txt.replace(reg,url);
			if (boo) {
				request.pass_ +=txt;
			};
			return {html:boo?txt:tmp,pass:boo};
		};

									request.nb_try=0;
							var l=request.html_?((((request.content_l)&&(request.clength_===request.html_.length))||(request.encoding_==='chunked'))?false:true):false;
							if (!l) {
								//console.log('INCOMING STREAM : write response on port '+request.remotePort+' for request '+request.i_id);
								if (request.encoding_!=='chunked') {
									request.socks_s=false;
								};
								if (request.html_) {
									//oconsole('INCOMING STREAM : write html response on port '+request.remotePort+' for request '+request.i_id);
									/* only works with utf8 from here */
									//oconsole('html '+(new Date().valueOf()-request.t0_));
									//var html=request.html_.toString('utf8');
									var html=request.content_l?(request.html_.toString('utf8')):(request.decoder_.decode(sc?sc:resp,{stream:true}));
									//console.log('html1 '+html);
									if (!request.content_l) {
										request.buff_ +=html;
										if ((request.buff_.length<CHUNK_L)&&(!request.end_)) {
											return;
										} else {
											if (!request.pass_) {
												html=request.buff_;
											};
										};
									};
									//oconsole('replace '+(new Date().valueOf()-request.t0_));
									var htmlr=replace(html,request);
									//console.log(htmlr);
									if (!htmlr.pass) {
										if (request.pass_) {
											//console.log('----------pass--------------'+request.pass_);
											var tmp=replace([request.pass_,html].join(''),request);
											if (!tmp.pass) {
												html=tmp.html;
												request.pass_='';
											} else {
												return;
											}
										} else {
											html=htmlr.html;
										};
									} else {
										return;
									};
									//console.log('html2 '+html);
									if (!request.script_) {
										//oconsole('addscript '+(new Date().valueOf()-request.t0_));
										html=addScript(html,request);
										request.script_=true;
										//console.log('html3 '+html.substr(0,50));
									};
									if ((!request.header_sent)||(request.content_l)) {
										if (request.header_l) {
											var parse=simpleParser(request.header_.toString('utf8'));
											if (parse['X-Frame-Options']) {
												delete parse['X-Frame-Options'];
											};
											//console.log('edit parse');
											//for (var n in parse) {
											//	console.log(n+' '+parse[n]);
											//};
											//oconsole('head '+(new Date().valueOf()-request.t0_));
											if (request.content_l) {
												parse['Content-Length']=(new Buffer(html,'utf8')).length;
											};
											request.header_=reconstitute(parse);
											request.header_sent=true;
											if (!request.content_l) {
												//console.log('reconstituted header sent :\n'+request.header_.toString('utf8'));
												if (!tls) {
													request._write_(new Buffer(request.header_,'utf8'));
												} else {
													tls(new Buffer(request.header_,'utf8'));
												};
											} else {
												resp=new Buffer([request.header_,html].join(''),'utf8');
											};
										} else {
											return;
										};
									};
									//console.log(resp.toString('utf8'));
									if (!request.content_l) {
										var l=(new Buffer(html,'utf8')).length;
										if (request.end_) {
											html='\r\n'+(l-7).toString(16)+'\r\n'+html;
											console.log('end html-------');
											//html=html+'\r\n0\r\n\r\n';
											request._init_();
											request.socks_s=false;
										} else {
											html='\r\n'+l.toString(16)+'\r\n'+html;
											request.socks_s=true;
										};
										//console.log('html req :\n'+html);
										resp=new Buffer(html,'utf8');
										//console.log('html req :\n'+resp.toString('hex'));
										request.buff_='';
									} else {
										request.socks_s=false;
										request._init_();
									};

									//console.log('response header reconstituted :'+request.header_+' '+(new Buffer(request.header_,'utf8')).toString('hex'));
									//console.log('replaced html '+html);
									//console.log('html reconstituted '+[request.header_,html].join(''));
									//oconsole('write delay '+(request.t0_?(new Date().valueOf()-request.t0_):'end')+' length '+resp.length);
									//console.log('replaced '+resp.toString('hex'));
								};
								//console.log('write ');
								if (!tls) {
									request._write_(resp);
								} else {
									tls(resp);
								};
							};

									var replace=function(txt,request,boo2) {
			var reg=/(((\b(https?|ftp|file):\/\/)|\/\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
			var boo=false;
			var url=function(val) {
				var test=txt.split(val);
				if ((test[test.length-1]==='')&&(!boo2)) {
					boo=true;
					return;
				};
				var rurl=txt;
				val=url_decode(val);
				var fake_domain=request.fake_domain;
				var domain=OP_domains[fake_domain];
				var r=domain.real_domain_s; //lepoint.fr
				if (val.host) {
					if (val.host.indexOf(r)!==-1) {
						var h=val.host.split('.'); //[lepoint,fr]
						var r_d=domain.real_domain_a; //[www,lepoint,fr]
						if (val.host===domain.real_domain) { //www.lepoint.fr
							//rurl='http://'+fake_domain+'/'+encrypt_decrypt(val.rest?val.rest:'',true);
							//rurl=val.rest?val.rest:'';
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+(val.rest?val.rest:'');
						} else if (((h.length===2) && (r_d[0]==='www')) || ((r_d.length===2) && (h[0]==='www'))) { //lepoint.fr
							//rurl='http://'+fake_domain+'/'+encrypt_decrypt(val.rest?val.rest:'',true);
							//rurl=val.rest?val.rest:'';
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+(val.rest?val.rest:'');
						} else { //sport.lepoint.fr
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+encrypt_decrypt(url_encode(val),true);
						};
					} else {
						if (val.host.indexOf(fake_domain)===-1) {
							rurl='http'+TLS_OP+'://'+fake_domain+'/'+encrypt_decrypt(url_encode(val),true);
							//rurl=val.protocol+'//'+fake_domain+'/'+encrypt_decrypt(url_encode(val),true);
						};
					};
				};
				return rurl;
			};
			var tmp=txt.replace(reg,url);
			if (boo) {
				request.pass_ +=txt;
			};
			return {html:boo?txt:tmp,pass:boo};
		};

		//s_script.js
		var addScript=function(html,request) {
			var script="<SCRIPT Language='Javascript'>(function(){ /* insert after doctype - ok all browsers */ var K='';  var noT=['STYLE','BR','HEAD','META','TITLE','NOSCRIPT'];  var noA=['IFRAME','FRAME','EMBED','OBJECT','APPLET'];  var tab=['href','src','innerHTML','outerHTML'];  var attribs=['style','className','align','id','name','width','height'];  var protocol=document.location.protocol;  var url_decode=function(url) { 	var URL={url:url}; 	var res=url.split('/'); 	var dec=function(res) { 		if (res.length) { 			var tmp=res[0]; 				URL.host=tmp; 				res.shift(); 			}; 			URL.rest=res.join('/'); 	}; 	if (res.length>1) { 		if (res[1]==='') { 			URL.protocol=res[0]?res[0]:protocol; 			res.shift(); 			res.shift(); 		}; 	} 	dec(res); 	return URL; };  var url_encode=function(url) { 	var res=[]; 	if (url.protocol) { 		res.push(url.protocol); 		res.push(''); 	}; 	if (url.port) { 		res.push(url.rest); 	}; 	if (url.rest) { 		res.push(url.rest); 	}; 	return res.join('/'); }; 	 var encrypt_decrypt=function(txt,K) { 		var res=[]; 		txt=txt.split(''); 		while (txt.length) { 			res.push(txt.pop()); 		}; 		return res.join(''); };  var url_encrypt=function(url,bool,K) { 	var URL=url_decode(url); 	URL.host=URL.host?encrypt_decrypt(URL.host):null; 	if (bool) { 		URL.rest=URL.rest?encrypt_decrypt(URL.rest):null; 	}; 	return url_encode(URL); /*TODO replace by https */ };  var fake_domain=document.domain;  var real_domain=url_encrypt(fake_domain);  alert(fake_domain+' '+real_domain);  Object.Freeze=function(obj,prop) { 	try { 		Object.defineProperty(obj,prop,{value:obj[prop],configurable:false,writable:false}); 	} catch(ee) { 		/* Safari nok */ 	}; };  var tame=function(obj) { 	try { 		tab.forEach(function(prop) {observe(obj,prop)}); 		var osetAttribute=obj.setAttribute.bind(obj); 		obj.setAttribute=function(prop,val) { 			if (prop&&val) { 				if (((tab.indexOf(prop)!==-1)&&(val.indexOf('http')!==-1))||(['innerHTML','outerHTML'].indexOf(prop)!==-1)) { 					var tmp=url(val,prop); 					if (['innerHTML','outerHTML'].indexOf(prop)===-1) { 						obj['___'+prop+'___']=tmp; 					}; 					osetAttribute(prop,tmp); 				} else { 					if (tab.indexOf(prop)!==-1) { 						obj['___'+prop+'___']=val; 					}; 					osetAttribute(prop,val); 				}; 			}; 		}; 		Object.Freeze(obj,'setAttribute'); 		Object.Freeze(obj,'appendChild'); 		Object.Freeze(obj,'insertBefore'); 		Object.Freeze(obj,'replaceChild'); 	} catch(ee) {}; };  var ocreateElement=document.createElement.bind(document);  document.createElement=function(tag) { 	tag=tag.toLowerCase().trim(); 	switch (tag) { 		case ('iframe' || 'frame' || 'embed' || 'object' || 'applet') : return ocreateElement('canvas'); 		case ('script') : if (document.readyState==='complete') {return ocreateElement('span')}; 		default : var obj=ocreateElement(tag);tame(obj);return obj; 	}; };  var ocreateDocumentFragment=document.createDocumentFragment.bind(document);  document.createDocumentFragment=function() { 	var obj=ocreateDocumentFragment(); 	tame(obj); 	return obj; };  var owrite=document.write.bind(document);  document.write=function(txt) { 	if (txt.toLowerCase().indexOf('script')===-1) { 		owrite(txt); 	}; };  var url=function(val,prop) { /*TODO tame innerHTML outerHTML */ 	if (['innerHTML','outerHTML'].indexOf(prop)!==-1) { 		/* alert(prop+' '+val); */ 		return val; 	}; 	var rurl=''; 	val=url_decode(val); 	if (val.protocol) { 		if (val.host) { 			if (val.host.indexOf(real_domain)!==-1) { 				rurl=url_encrypt(url_encode(val)); 			} else { 				if (val.host.indexOf(fake_domain)===-1) { 					rurl='http://'+fake_domain+'/'+url_encrypt(url_encode(val)); 				} 			}; 		/*alert(rurl);*/ 		} else { 			rurl=url_encrypt(url_encode(val)); 		} 	} else { 		rurl=url_encode(val); 	}; 	return rurl; };  var observe=function(obj,prop) { /* watch js modification of prop */ 	if (['innerHTML','outerHTML'].indexOf(prop)!==-1) { /* if getter/setter */ 		var set_o=function(val) { 			delete this[prop]; 			this[prop]=url(val,prop); 			observe(this,prop); 		}; 	} else { 		var set_o=function(val) { 			delete this[prop]; 			this.setAttribute(prop,val); 			observe(this,prop); 		}; 	}; 	if (['innerHTML','outerHTML'].indexOf(prop)!==-1) { /* if getter/setter */ 		var get_o=function(){ 			delete this[prop]; 			var res=this[prop]; 			observe(this,prop); 			return res; 		}; 	} else { 		var get_o=function(){ 			return this['___'+prop+'___']||''; 		}; 	}; 	try { 		Object.defineProperty(obj,prop,{get:get_o,set:set_o,enumerable:true,configurable:true}); 	} catch (ee) { 		Object.freeze(obj); 	}; /*Safari crashes - unconfigurable property */ 	/* OK FF IE Chrome - NOK Safari */ };  var addEvent=function(o, e, f, p) { 	try {this.delEvent(o,e,f,p);} catch(ee){} 	if (o.addEventListener) { 		o.addEventListener(e, f, p); 	} else if (o.attachEvent) { 		o.attachEvent('on' + e, f); 	} };  var delEvent=function(o, e, f, p) { 	if (o.addEventListener) { 		o.removeEventListener(e, f, p); 	} else if (o.attachEvent) { 		o.detachEvent('on' + e, f); 	} };  var setEvtAllTree=function(obj) { 	obj=obj.nodeName?obj:this.document; 	if (!obj) { 		setTimeout(setEvtAllTree,0); 		return; 	}; 	if ((obj.nodeName=='#document')||(obj.nodeType===1)&&(noT.indexOf(obj.nodeName)===-1)) { 		if (noA.indexOf(obj.nodeName)===-1) { 			if (obj.nodeType!==9) { 				if (obj.href) { 					if (obj.getAttribute('href')) { 						if (obj.getAttribute('href').indexOf('http')!==-1) { 							obj.href=url(obj.href); 						}; 					} else { 						obj.href=url(obj.href); 					}; 				}; 				if (obj.src) { 					if (obj.getAttribute('src')) { 						if (obj.getAttribute('src').indexOf('http')!==-1) { 							obj.src=url(obj.src); 						}; 					} else { 						obj.src=url(obj.src); 					}; 				}; 				tame(obj); 			}; 			var l=obj.childNodes.length; 			for (var i=0;i<l;i++) { 				setEvtAllTree(obj.childNodes[i]); 			}; 		} else { 			var c=document.createElement('canvas'); 			attribs.forEach(function(val) {if (obj[val]) {c[val]=obj[val]}}); 			var ctx = c.getContext('2d'); 			ctx.fillStyle='#FAFAFA'; 			obj.parentNode.replaceChild(c,obj); 			ctx.fillRect(0, 0, c.offsetWidth,c.offsetHeight); 		}; 	}; };  addEvent(window,'load',setEvtAllTree,false); /*addEvent(window,'load',function() {alert('load event')},false);*/  Object.Freeze(document,'createElement'); Object.Freeze(document,'createDocumentFragment'); Object.Freeze(document,'write'); /*alert('loaded');*/  /*setEvtAllTree(window.document);*/ /* hook document.getElementsByTagName('script') */ /* hook window.open */ })();</SCRIPT>";
			script=''; //test to remove
			return [script,html].join(''); //TODO insert after doctype
		};


					relay_ws_handle:function(data,boo) { //WS OP SOCKS OP or OR request

				if (this.OP_) { //WS OP SOCKS
					//console.log('OP relay_ws_handle');
					var host_=null;
					var l=data.slice(0,2).readUInt();
					var tmp=((data.slice(2,2+l)).toString('utf8')).split(':'); //request.remoteAddress+':'+request.remotePort+':'+request.port_+':'+request.i_id;
					data=data.slice(2+l);
					console.log('OP ws receive request '+tmp[3]+' adresse '+tmp[0]+' port '+tmp[1]+' data '+data.length);
					//console.log(data.toString('utf8'));
					if (data.length) {
						var params={};
						var request=OP_fake_request[tmp[3]];
						if (!request) {
							request={nb_try:0,no_exit:[],i_id:tmp[3]};
							OP_fake_request[tmp[3]]=request;
						} else {
							if (request.params_) { //params_ not set if https for example
								host_=request.params_.host;
							};
						};
						var _write_=(function(resp) {
							//console.log(([new Buffer(tmp[0]+WS_SOCKS_PFX,'utf8'),resp].concatBuffers()).toString('utf8'));
							//var payload=[new Buffer(tmp[0]+WS_SOCKS_PFX,'utf8'),resp].concatBuffers();
							var payload=resp;
							var add=new Buffer(new Buffer(tmp[0]+':'+tmp[1],'utf8').toString('hex'),'hex'); //socks client ip:port
							var l=add.length.toString(16);
							while (l.length!==4) {
								l='0'+l;
							};
							add=[new Buffer(l,'hex'),add].concatBuffers();
							l=add.length;
							if (payload.length===0) {
								var stream=new Stream(Stream.prototype.RELAY_WS,0,add,this.Df_hash);
								var cell=new Cell(this.circId,Cell.prototype.RELAY_WS,this.stream_encrypt_forward(stream));
								this.send(cell);
							} else {
								while (payload.length) {
									var pay;
									if (payload.length+l>PAYLOAD_STREAM_WS) {
										pay=payload.slice(0,PAYLOAD_STREAM_WS-l);
									} else {
										pay=payload;
									};
									pay=[add,pay].concatBuffers();
									//console.log('OP write ws '+pay.length);
									var stream=new Stream(Stream.prototype.RELAY_WS,0,pay,this.Df_hash);
									var cell=new Cell(this.circId,Cell.prototype.RELAY_WS,this.stream_encrypt_forward(stream));
									this.send(cell);
									if (payload.length+l>PAYLOAD_STREAM_WS) {
										payload=payload.slice(PAYLOAD_STREAM_WS-l);
									} else {
										break;
									};
								};
							};
						}).bind(fake_cid); //signaling RELAY_ASSOCIATE AND RELAY_WS on fake_cid - relay_begin/relay_data on other circuits
						if ((!TLS_OP)||(!request.tls_server_connected)) {
							//TODO wait for TLS
							var wait=function() {
								request.wait_header=request.wait_header?[request.wait_header,data].concatBuffers():data;
								//console.log('wait '+request.wait_header.toString('utf8'));
								if (request.wsqueue_) {
									//request.wsqueue_.shift();
									if (request.wsqueue_.length) {
										var a=request.wsqueue_[0];
										request.wsqueue_.shift();
										a();
									};
								};
							};
							if (data.length>=4) {
								var check=data.toString('hex');
								//console.log('wait ??? '+data.toString('utf8')+' ??? '+request.i_id+' '+data.byteOffset);
								if (check.substr(check.length-8)!==CRLF+CRLF) { //header not complete
									wait();
								} else {
									data=request.wait_header?request.wait_header:data;
									delete request.wait_header;
									//console.log('header complete request '+request.i_id+' wqueue '+(request.wsqueue_?request.wsqueue_.length:0));
									//request.wsqueue_.shift();
									//console.log('header complete '+data.toString('utf8'));
								};
							} else {
								wait();
							};
							request._write_=_write_;
							request.destroy=function() {
									//console.log('OP WS Relay destroy '+this.i_id);
									if (TLS_OP) {
										delete request.abstract_server_tls;
										if (!request.abstract_client_tls) {
											request._write_(new Buffer(0));
										} else {
											delete request.abstract_client_tls;
											_write_(new Buffer(0));
										};
									} else {
										request._write_(new Buffer(0));
									};
								};
						};
						var relay_ws_handle=function(stream) {
							var port=tmp[2]; //destination port
							//var stream=params.stream.toString('utf8');
							//console.log('before reconstitute ---'+stream);
							var parse=simpleParser(stream);
							var accept=parse['Accept']?parse['Accept']:'';
							if (accept.indexOf('text/html')!==-1) {
								delete parse['Accept-Encoding'];
							};
							request.referer_=parse['Referer'];
							delete parse['Referer'];
							//parse['Referer']='http://'+'www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+FAKE_SFX; //some sites want a referer
							//parse['Referer']=protocol+'//'+real_domain;
							parse['Connection']='keep-alive';
							//console.log('parsein---'+parse['0a']);
							var gurl=parse['0a'].split(' ');
							var rurl='';
							if (gurl.length>1) {
								var tmp2=(gurl[1].substr(0,1)==='/')?gurl[1].substr(1):gurl[1]; //remove /
								rurl=encrypt_decrypt(tmp2);
							};
							var format_request=function() {
								if (rurl.substr(0,4)==='http') { //outside domain
									var out=url_decode(rurl);
									//gurl=parse['0a'].split(' ');
									//console.log(out);
									//var f=out.rest.split('/').pop();
									//console.log(f);
									gurl[1]='/'+(out.rest?out.rest:'');
									parse['0a']=gurl.join(' ');
									if (parse['Host']) {
										parse['Host']=out.host?out.host:''; //TODO distinguish http/https
									};
									delete parse['Cookie']; //important delete real domain cookies for outside requests
									if (!parse['X-Requested-With']) { //if not ajax request save outside domain
										request._host_=out.protocol+'//'+parse['Host'];
									};
									//console.log('parseout--- '+parse['0a']+' --host-- '+parse['Host']);
								} else { //real domain
									//gurl[1]='/'+rurl;
									//parse['0a']=gurl.join(' ');
									if (parse['Host']) {
										request.fake_domain=parse['Host'];
										parse['Host']=OP_domains[parse['Host']].real_domain;
									};
									//console.log('parsein--- '+parse['0a']+' --host-- '+parse['Host']);
								};
								if (parse['Accept']) {
									//console.log('Accept request '+request.i_id+' '+parse['Accept']+' '+parse['Accept-Encoding']);
									if (parse['Accept'].indexOf('text/html')!==-1) {
										parse['Accept-Encoding']='identity';
									};
								};
								stream=reconstitute(parse);
								//console.log('Received from socks request id '+request.i_id+' ---'+stream+' -------------');
								params.OP=true;
								params.nb_hop=NB_HOP;
								params.one_c=true;
								//params.host=real_domain+':'+port;
								if (TLS_OP) {
									port=((protocol===default_protocol)&&(port==='443'))?'80':port;
								};
								params.host=parse['Host']+':'+port;
								if ((host_)&&(params.host!==host_)) { // fake_domain request are streamed in same request but real host can change - then do not reuse existing connection
									//console.log('real host changed request '+request.i_id);
									delete request.tls_client_connected;
									delete request.abstract_client_tls;
									if (request.cid_) {
										request.cid_.destroy_cid(request,true);
									};
								};
								params.stream=new Buffer(stream,'utf8');
								request.params_=params;
								request._data_=false;
								//var nb_try=request.nb_try;
								//request.cid_=fake_cid;
								request._init_=init_request;
								request._init_();
								if (boo) {
									request.nb_try=n;
								};
								request.remoteAddress=tmp[0];
								request.remotePort=tmp[1];
								request.end=request.destroy;
								//request.addr_=tmp[0];
							};
							if ((rurl.substr(0,5)==='https')||(protocol==='https:')) {
								if (!TLS_OR) {
									console.log('https not supported now '+rurl); //send fake answer
									request._write_(new Buffer(req_200(),'utf8'));
									return;
								} else {
									format_request();
									if (!request.abstract_client_tls) {
										console.log('Create TLS Client for request '+request.i_id);
										var rurld=url_decode(rurl);
										var stream=request.params_.stream;
										request.abstract_client_tls=abstract_tls(request,rurld.host);
										request.abstract_client_tls.stream_tor_=new Buffer(0);
										request.abstract_client_tls.queue_socks=[];
										var request_decoded={};
										request_decoded._init_=init_request;
										request_decoded._init_();
										request_decoded._host_=request._host_;
										request_decoded.cid_=request.cid_;
										request_decoded.i_id=request.i_id;
										request_decoded.fake_domain=request.fake_domain;
										request_decoded.socks_s=true;
										request_decoded.__write__=request.__write__;
										request_decoded.destroy=request.destroy;
										request_decoded.referer_=request.referer_;
										request.request_decoded=request_decoded;
										request_decoded.request_=request;
										request_decoded.received_=0;
										var client=request.abstract_client_tls;
										var nwrite=function(resp) {
											var execute=function(data) {
												return function() {
													this.stream_tor_=this.stream_tor_.length?([this.stream_tor_,data].concatBuffers()):data;
													this.stream_tor_.parseTLS(this);
												};
											};
											client.queue_=client.queue_||[];
											client.queue_.push(execute(resp).bind(client));
											if (client.queue_.length===1) {
												client.queue_[0]();
											};
											if ((client.queue_socks.length)&&(!request_decoded.socks_s)) {
												request_decoded.socks_s=true;
												console.log('Unqueue request '+request.i_id);
												client.queue_socks[0]();
												client.queue_socks.shift();
											};
										};
										request._write_=nwrite;
										request.write_c=function(data) { //send to target
											request.params_.stream=data;
											Tor(request);
										};
										request.abstract_client_tls.closed=function(c) {
											console.log(' TLS client disconnected.');
											delete request.abstract_client_tls;
											delete request.tls_client_connected;
											if (request.cid_) {
												request.cid_.destroy_cid(request);
											};
										};
										request.abstract_client_tls.error=function(c,error) {
											console.log(' Error TLS client disconnected '+error.message);
											delete request.abstract_client_tls;
											delete request.tls_client_connected;
											if (request.cid_) {
												request.cid_.destroy_cid(request);
											};
										};
										request.abstract_client_tls.connected=function(c) {
											console.log('TLS client connected to site for request '+request.i_id);
											request.tls_client_connected=true;
											request._data_=false;
											console.log('Sending https request for request '+request.i_id+' to site '+stream.toString('utf8'));
											c.prepare(encode(stream.toString('hex'))); //send initial stream
										};
										request.abstract_client_tls.dataReady=function(c) {
											var data=c.data.data.slice(c.data.read,c.data.length_);
											c.data.read=c.data.length_;
											var tmp={streamId:(new Buffer(2)).writeUInt(request.sid_),data:data,length:(new Buffer(2)).writeUInt(data.length)};
											//console.log('decoded tls data send by tls client to tls server '+c.data.read);
											//console.log(data.toString('utf8'));
											//owrite(c.data.data.slice(0,c.data.length_));//send to tls server or to OR via _write_
											//request._write_=owrite; //send to OR WS
											if (request.cid_) {
												request.cid_.last_.stream_handle_data(tmp,request.__write__,request_decoded);//send to tls server or to OR via _write_);
												//request._write_=nwrite; //send to process
											};
										};
										request.abstract_client_tls.handshake();
									} else {
										console.log('Reuse TLS Client for request '+request.i_id);
										var process=function(){request.abstract_client_tls.prepare(encode(request.params_.stream.toString('hex')))};
										if (request.request_decoded.socks_s) {
											console.log('Queue '+request.i_id);
											request.abstract_client_tls.queue_socks.push(process);
										} else {
											process();
										};
									};
								};
							} else {
								format_request();
								Tor(request);
							};
						};
						request.relay_ws_handle=relay_ws_handle;
						if (TLS_OP) {
							if (!request.abstract_server_tls) {
								request.abstract_server_tls=abstract_tls(request,fake_domain,true);
								request.write_s=_write_;
								request.abstract_server_tls.closed=function(c) {
									console.log(' TLS server disconnected for request '+request.i_id);
									request.destroy();
								};
								request.abstract_server_tls.error=function(c,error) {
									if (error.message.indexOf('Unknown')===-1) {
										console.log('Error TLS server disconnected for request '+request.i_id+' '+error.message);
										request.destroy();
									};
								};
								request.abstract_server_tls.connected=function(c) {
									console.log('TLS server connected to socks client for request '+request.i_id);
									request.tls_server_connected=true;
									request._write_=function(resp) {
										//prepare and send to OR via request.write
										//from relay_data in clear to OR encrypted
										//overriden if https connexion to the site
										//relay_data goes through nwrite, get decoded, get back to handle relay_data and is sent to __write__
										if (request.abstract_server_tls) { //tls connexion can be reset during handshake
											console.log('tls server send to SOCKS');
											request.abstract_server_tls.prepare(encode(resp.toString('hex'))); //TODO optimize with buffers
											if (request.done_) {
												request.destroy();
											};
										} else {
											console.log('can\'t send to SOCKS server connection closed for request '+request.i_id);
										};
									};
									request.__write__=request._write_;
									request.abstract_server_tls.dataReady=function(c) {
										console.log(c.data.read);
										var tmp=c.data.data.slice(c.data.read,c.data.length_).toString('utf8');
										if (tmp.indexOf('Host')!==-1) { //TODO check valid request (FF Bug? TLS messages sent twice)
											c.data.read=c.data.length_;
											console.log('TLS server receive '+tmp);
											request.ini_data=tmp;
											relay_ws_handle(tmp);
										};
									};
								};
							};
							//console.log('ws receive tls');
							//console.log(data.toString('hex'));
							request.abstract_server_tls.process(data);
						} else {
							var sdata=data.toString('utf8');
							request.ini_data=sdata;
							relay_ws_handle(sdata);
						};
					};
				};
				if (this.OR_) { //OR
					//console.log('OR receive ws initial');
					//console.log(data.toString('hex'));
					var l=data.slice(0,2).readUInt();
					var tmp=(data.slice(2,2+l)).toString('utf8'); //request.remoteAddress+':'+request.remotePort;
					data=data.slice(2+l);
					//console.log(data.toString('utf8'));
					//var tmp=(data.toString('utf8')).split(WS_SOCKS_PFX);
					var request=OR_fake_request[tmp];
					if (data.length) {
						//OR_fake_request[tmp].resp__=OR_fake_request[tmp].resp__?(OR_fake_request[tmp].resp__+data.length):data.length;
						//console.log('OR receive ws '+tmp);
						//console.log('OR fake request '+OR_fake_request[tmp].i_id+' total '+OR_fake_request[tmp].resp__);
						//console.log((new Buffer(data,'utf8').toString('hex')));
						request.write(data);
						return;
					} else {
						if (!request.bufferSize) {
							console.log('OR ws destroy request '+request.i_id);
							//request.destroy();
							//request.close(true); //close with true (error)
							request.end();
						} else {
							//console.log('bufferSize for OR ws destroy request '+request.i_id);
						};
					};
				};
			},

			var ws_send=function(request,payload) {
			var addr=request.remoteAddress+':'+request.remotePort+':'+request.port_+':'+request.i_id;
			var circ=request.fake_;
			//console.log('OR send RELAY_WS CIC '+circ.circId+' '+addr);
			var add=new Buffer(new Buffer(addr,'utf8').toString('hex'),'hex');
			var l=add.length.toString(16);
			while (l.length!==4) {
				l='0'+l;
			};
			add=[new Buffer(l,'hex'),add].concatBuffers();
			l=add.toString('hex');
			//console.log(add.toString('hex'));
			while (payload.length) {
				var pay;
				if (payload.length+l>PAYLOAD_STREAM_WS) {
					pay=payload.slice(0,PAYLOAD_STREAM_WS-l);
				} else {
					pay=payload;
				};
				pay=[add,pay].concatBuffers();
				//console.log('OR write ws '+pay.toString('utf8'));
				var data=(new Stream(Stream.prototype.RELAY_WS,0,pay,circ.Db_hash)).toBuffer();
				data=new Buffer(circ.Kb_cipher.update(data,'hex','hex'),'hex');
				var cell=new Cell(circ.circId,Cell.prototype.RELAY_WS,data);
				circ.send(cell);
				if (payload.length+l>PAYLOAD_STREAM_WS) {
					payload=payload.slice(PAYLOAD_STREAM_WS-l);
				} else {
					break;
				};
			};
		};
