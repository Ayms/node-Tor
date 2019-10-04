//peersm_client not used
if (download) {
	//Ikoula 100Mbps duplex
	//user average: 500Kbps
	//100000 users - 50 Gbps
	//300 E/Y/200 users
	//150000 E/Y/100 Kusers - 500 servers
	anonym=false;
	anonym_OR=false;
	var DB_OR=one_OR;
	WS_OP=true;
	WS_OP_SOCKS=false;
	if (peersm_client) {
		var BANDWIDTH=client_band?(client_band*1000000):100000;
		var BFACTOR=1;
		var BSIZE=498;
		var FLOWB=50;
		var file_extension={};
		var STREAM_WINDOW_PEER=1000;
		var BUFFERED_AMOUNT_MAX=2000000;
		var DEF_BLOCKS=5;
		var db_id=0;
		var peersmDB={};
		OR=false;//monitor circuits
		var options = {
			host: 'www.monip.org',
			path: '/',
			port: 80,
			method: 'GET'
		};
		var destroy_torrent=function(request) {
			if (request._torrent_) {
				console.log('destroy torrent stream');
				request._torrent_stream.destroy();
				delete request._torrent_;
			};
			if (request.__ini_dht__) {
				console.log('destroying dht');
				request.__ini_dht__.destroy();
			};
			if (request.__torrent__) {
				console.log('destroying engine');
				request.__torrent__.destroy();
			};
		};
		var start_DHT=function() {
			var spies;
			try {
				spies=fs.readFileSync(SPIES_FILE).toString('utf8');
			} catch(ee) {
				console.log('could not read spies');
			};
			if (spies) {
				Arrayblocklist=JSON.parse(spies);
				blocked=blocklist(Arrayblocklist);
				console.log('number of spies in blocklist '+Arrayblocklist.length);
			};
		};
		var req=http.request(options,function(res) {
			var data_='';
			res.on('data', function(d) {
				data_ +=d.toString('utf8');
			});
			res.on('end',function() {
				if (data_) {
					try {
						var res=data_.split("<BR>");
						if (res.length) {
							res=res[1];
							res=res.split("<br>");
							if (res.length) {
								res=res[0].split(':');
								if (res.length>1) {
									myip=res[1].trim();
									console.log('myip '+myip);
								};
							};
						};
					} catch(ee) {};
				};
				start_DHT();
			});
			res.on('error',function() {
				start_DHT();
			});
		});
		req.on('error', function(e) {
			start_DHT();
		});
		req.end();
		peersmDB.list=function(cb,boo) {
			fs.readdir(pathd,function(err,files) {
				if (!err) {
					files.forEach(function(file,m) {
						if ((file.indexOf('debug.txt')===-1)&&(file.indexOf('debug-prod.txt')===-1)) {
							var h=file.split('#');
							var name,hash_name;
							if (h.length>1) {
								var tmp=h[1].split('.');
								name=h[0]+(tmp.length>1?('.'+tmp[1]):'');
								hash_name=h[1].split('.')[0];
								//console.log(name+' '+hash_name);
							};
							if (name) {
								if (!boo) {
									fs.stat(pathd+file,function(err,stats) {
										if (!err) {
											var val={file_name:file,name:name,name_hash:hash_name,hash:'0000000000000000000000000000000000000000',file_length:stats.size,current_length:stats.size,type:'application/octet-binary'};
											cb(val);
										};
									});
								};
							} else {
								//console.log(client.localAddress.toString()+client.localPort.toString());
								var H=crypto.createhash('sha1');
								H.update(new Buffer((Date.now()).toString()+client.localAddress.toString()+client.localPort.toString(),'utf8'));
								H=H.digest('hex');
								var tmp=file.split('.');
								if (tmp.length) {
									var ext=tmp.pop();
									if (tmp.length) {
										var name=tmp.join('.');
										var file2=name+'#'+H+'.'+ext;
										fs.rename(pathd+file,pathd+file2,function() {
											fs.stat(pathd+file2,function(err,stats) {
												if (!err) {
													var val={file_name:file2,name:name,name_hash:H,hash:'0000000000000000000000000000000000000000',file_length:stats.size,current_length:stats.size,type:'application/octet-binary'};
													cb(val);
												};
											})
										});
									};
								};
							};
						};
					});
				};
			});
		};
		var parse_db=function() {
			if (db_cid) {
				db_cid.send_db_info(true);
			};
		};
		var WebSocket_node=function(ws) {
			ws=ws.split('ws://')[1].split(':');
			var port=ws[1];
			var ip=ws[0];
			console.log('peersm client '+ip+' '+port);
			var pclient=new net.Socket();
			//pclient.bufferedAmount=pclient.bufferSize;
			pclient.on('connect',function() {
				pclient.key_=crypto.randomBytes(16).toString('base64');
				var hs='GET / HTTP/1.1\r\n';
				hs +='Host: '+pclient.remoteAddress+':'+pclient.remotePort+'\r\n';
				hs +='User-Agent: Mozilla/5.0 (Windows NT 6.0; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0\r\n';
				hs +='Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n';
				hs +='Accept-Language: en-us,en;q=0.5\r\n';
				hs +='Accept-Encoding: gzip, deflate\r\n';
				hs +='Connection: keep-alive, Upgrade\r\n';
				hs +='Sec-WebSocket-Version: 13\r\n';
				hs +='Origin: http://peersm.com\r\n';
				hs +='Sec-WebSocket-Key: '+pclient.key_+'\r\n';
				hs +='Pragma: no-cache\r\n';
				hs +='Cache-Control: no-cache\r\n';
				hs +='Upgrade: websocket\r\n';
				hs +='\r\n';
				console.log(hs);
				pclient.write(hs);
			});
			pclient.on('data',function(data) {
				if (!pclient.connected__) {
					pclient.on('end',function() {console.log('websocket_node end');pclient.onclose()});
					pclient.on('error',function() {console.log('websocket_node error');pclient.onclose()});
					var res=simpleParser(data.toString('utf8'));
					var key=res['Sec-WebSocket-Accept']||res['Sec-Websocket-Accept']; //bug Tor
					if (key) {
						var H = crypto.createHash('sha1');
						H.update(pclient.key_+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
						var hash=H.digest('base64');
						if (key===hash) {
							console.log('Client says : Handshake successfull for '+client.remoteAddress+' '+client.remotePort);
							pclient.write=function(data) {
								//console.log('Client write before wsencode:'+data.toString('hex'));
								pclient._write(wsencode(data,0x2,true),null,function(){});
							};
							pclient.send=pclient.write;
							pclient.connected__=true;
							pclient.onopen();
						} else {
							pclient.end();
						};
					} else {
						pclient.end();
					};
				} else {
					//console.log('received '+data.toString('hex'));
					var tmp=wsdecode(pclient.stream_ws__?([pclient.stream_ws__,data].concatBuffers()):data);
					pclient.stream_ws__=tmp[1].length?tmp[1]:null;
					pclient.onmessage({data:tmp[0]});
				};
			});
			pclient.close=pclient.end;
			pclient.connect(port,ip);
			return pclient;
		};
		var FileReader_torrent=function() {
		};
		FileReader_torrent.prototype.readAsArrayBuffer=function(chunk) {
			this.onload({target:{result:chunk}});
		};
		var FileReader_node=function() {
		};
		FileReader_node.prototype.readAsArrayBuffer=function(chunk) {
			this.onload({target:{result:chunk}});
		};
		var Blob_torrent=function(size) {
			this.data=[];
			this.cursor=0;
			this.size=size;
		};
		Blob_torrent.prototype.push=function(chunk) {
			this.data.push(chunk);
			this.cursor +=chunk.length;
			//this.updating=false;
			//this.rest=new Buffer(0);
		};
		Blob_torrent.prototype.unshift=function(chunk) {
			this.data.unshift(chunk);
			this.cursor -=chunk.length;
		};
		Blob_torrent.prototype.slice=function(begin,end) {
			var s=end-begin;
			//console.log('s '+s+' cursor '+this.cursor+' data '+this.data.length);
			var c=0;
			var buffer,rest;
			var temp=[];
			if ((s>0)&&(this.data.length)) {
				s=Math.min(s,this.cursor);
				while (c<s) {
					var chunk=this.data.shift();
					var l=chunk.length;
					temp.push(chunk);
					c +=l;
					this.cursor -=l;
				};
				buffer=temp.concatBuffers();
				rest=buffer.slice(s);
				buffer=buffer.slice(0,s);
				this.cursor +=rest.length;
				//if (this.data.length) {
				//	this.data[0]=[rest,this.data[0]].concatBuffers();
				//} else {
				if (rest.length) {
					this.data.unshift(rest);
				};
				//};
				//console.log('after rest '+rest.length+' cursor '+this.cursor+' data '+this.data.length);
				return buffer;
			} else {
				//console.log('blob_torrent return 0');
				return new Buffer(0);
			};
		};
		/*
		Blob_torrent.prototype.slice=function(begin,end) {
			if (!this.updating) {
				this.updating=true;
				var s=end-begin;
				var r=0;
				console.log('s '+s+' cursor '+this.cursor+' rest '+this.rest.length);
				var c=0;
				var buffer;
				var temp=[];
				if (s>0) {
					s=Math.min(s,this.cursor);
					r=this.rest.length;
					if (r) {
						chunk=this.rest.slice(0,Math.min(r,s))
						temp.push(chunk);
						this.rest=this.rest.slice(Math.min(r,s));
						c=chunk.length;
						this.cursor -=c;
						buffer=chunk;
					};
					if (!r) {
						while (c<s) {
							chunk=this.data.shift();
							var l=chunk.length;
							temp.push(chunk);
							c +=l;
							this.cursor -=l;
						};
						buffer=temp.concatBuffers();
						this.rest=buffer.slice(s);
						buffer=buffer.slice(0,s);
						this.cursor +=this.rest.length;
						//if (this.data.length) {
						//	this.data[0]=[rest,this.data[0]].concatBuffers();
						//} else {
						//if (rest.length) {
							//console.log('rest '+rest.toString('hex'));
						//	this.data.unshift(rest);
						//};
					//};
					//console.log('after rest '+rest.length+' cursor '+this.cursor+' data '+this.data.length);
					};
					this.updating=false;
					return buffer;
				} else {
					//console.log('blob_torrent return 0');
					this.updating=false;
					return new Buffer(0);
				};
			} else {
				console.log('torrent updating');
				return new Buffer(0);
			};
		};*/
		var Blob_node=function(data) {
			this.fd=data.fd;
			this.size=data.size;
			this.type=data.type;
			this.cursor=0;
		};
		Blob_node.prototype.slice=function(begin,end) {
			if (!end) {
				this.size=this.size-begin;
				this.cursor=begin;
				return this;
			} else {
				if (end>begin) {
					var buffer=new Buffer(end-begin);
					//console.log('begin '+begin+' end '+end);
					fs.readSync(this.fd,buffer,0,end-begin,begin+this.cursor);
					return buffer;
				} else {
					return new Buffer(0);
				};
			};
		};

		var open_db=function() {
			var a={};
			a.get=function(hash) {
				var b={};
				fs.readdir(pathd,function(err,files) {
					if (!err) {
						var found=false;
						var l=files.length;
						var ext;
						for (var i=0;i<l;i++) {
							var file=files[i];
							if (file.indexOf('debug.txt')===-1) {
								var h=file.split('#');
								var name,hash_name;
								if (h.length>1) {
									var tmp=h[1].split('.');
									if (tmp.length>1) {
										ext=tmp[1];
										name=h[0]+(tmp.length>1?('.'+tmp[1]):'');
									};
									hash_name=h[1].split('.')[0];
								};
								//console.log(hash_name+' '+hash);
								if (hash_name===hash) {
									found=true;
									fs.stat(pathd+file,function(err,stats) {
										if ((!err)&&(ext)) {
											fs.open(pathd+file,'r',function(err,fd) {
												if (!err) {
													var type;
													if (ext) {
														type=ext_to_type[ext];
													};
													if (!type) {
														type='application/octet-binary';
													};
													console.log(name+' '+hash_name+' '+type);
													var data={fd:fd,size:stats.size,type:type};
													b.onsuccess({target:{result:{file_length:stats.size,current_length:stats.size,type:type,data:data}}});
												} else {
													b.onsuccess({target:{result:null}});
												};
											});
										} else {
											b.onsuccess({target:{result:null}});
										};
									});
									break;
								};
							};
						};
						if (!found) {
							b.onsuccess({target:{result:null}});
						};
					} else {
						b.onsuccess({target:{result:null}});
					};
				});
				return b;
			};
			return a;
		};
		start=function() {
			pac='var FindProxyForUrl='+pac;
			eval(pac);
			var routers=FindProxyForUrl('http://'+fake_domain,fake_domain,true);
			one_OR=routers[1][simple_random(routers[1].length)];
			if (!TEST_CONF) {
				DB_OR=routers[2];
			} else {
				DB_OR={ip:'37.59.47.27',port:8001,wsport:0,fing:'E0671CF9CB593F27CD389CD4DD819BF9448EA834',o_modulus:'ca2a670479816ca562f7afc2667db1811f0efa7d595aa27cf532092a052c697b102c03d8b8dddc276050fe9cad15efe72758d9d9b0f581f5cbfd0be92ecd721711797354006625e74e0f733efee3ee779116efe87da3b5f8c1729e2d0a5f2c4de4d5906b6e383c0a0d8dddbc076cf426423f6f2b6fd46fab9f54fb8e42601a2d',name:'Tor Bridge'};
			};
			WS_TLS=true;
			Relays=Guards;
			navigator.userAgent='node-Tor';
			unleash();
		};
		update_proxy=function() {
			var proxy=function() {
				console.log('update prox --------');
				pac='var FindProxyForUrl='+pac;
				eval(pac);
				FindProxyForUrl('http://'+fake_domain,fake_domain,true);
			};
			xhr(proxy);
		};
		xhr(start);
		setInterval(parse_db,10000);
		setInterval(update_proxy,UPDATE_PROXY);
	};
	if (window_browser) {
		var BANDWIDTH=0;
		var BFACTOR=1;
		var BSIZE=498;
		var FLOWB=50;
		var file_extension={};
		var STREAM_WINDOW_PEER=1000;
		var BUFFERED_AMOUNT_MAX=2000000;
		var DEF_BLOCKS=5;
		var $_=document.getElementById.bind(document);
		var db_id=0;
		var loc=document.location.href.split('/');
		var peersmcode=loc[loc.length-1].split('#')[0];
		var peersmDB;
		var getmouseY=function (e) {
			if (e.pageY) {
				return e.pageY;
			} else {
				return e.clientY;
			};
		};
		var getmouseX=function (e) {
			if (e.pageX) {
				return e.pageX;
			} else {
				return e.clientX;
			};
		};
		var addEvent=function (objet,typeEvent,nomFunction,typePropagation){
			objet.__event=objet.__event||{};
			if (objet.__event[typeEvent]) {
				delEvent(objet,typeEvent,objet.__event[typeEvent][0],objet.__event[typeEvent][1]);
			};
			objet.__event[typeEvent]=[nomFunction,typePropagation];
			if (objet.addEventListener) {
				objet.addEventListener(typeEvent,nomFunction,typePropagation);
			} else if (objet.attachEvent) {
				objet.attachEvent('on' + typeEvent, nomFunction);
			};
		};
		var delEvent=function (objet, typeEvent, nomFunction, typePropagation){
			if (objet.addEventListener) {
				objet.removeEventListener(typeEvent, nomFunction, typePropagation);
			} else if (objet.attachEvent) {
				objet.detachEvent('on' + typeEvent, nomFunction);
			}
		};
		var ext=[ENC_EXT,"exe","com","bin","php","php3","php4","php5","phtml","inc","sql","pl","cgi","py","sh","c","cc","cpp","cxx","h","hpp","java","class","jar","html","html","shtml","dhtml","xhtml","xml","js","css","zip","tar","tgz","gz","bz2","tbz","rar","mp3","wav","3ga","midi","mid","rm","ra","ram","pls","m3u","mkw","webm","avi","mp4","m4v","mpg","mpeg","mov","swf","fla","doc","docx","xls","xlsx","rtf","pdf","txt","ppt","pptx","vcard","vcf","obj","max","3ds","3dm","kml","torrent","gpx","dxf","dwg","wsg","vb","pif","gadget","apk","msi","sxc","123","ots","nb","gsheet","xlr","ods","svgz","cdr","svg","ps","eps","orf","pef","rwl","mrw","mef","fff","erf","dcr","bay","3fr","srf","rw2","nef","cr2","arw","dng","dwt","irs","ait","art","aip","aia","ai","indd","prtpset","ppj","plb","prproj","aetx","aet","aes","aepx","aep","aec","ncorx","ncor","em","abr","csh","psb","psd","as","asc","ascs","aif","aiff","flac","iff","m4a","wma","srt","flv","3g2","3gp","asf","wmv","pcast","xlt","xltm","xltx","ans","ascii","log","odt","wpd","accdb","db","dbf","mdb","pdb","asp","aspx","asx","fnt","otf","ttf","dotx","wps2","dll","fon","cmd","srt"];
		var ext_img=["tga","gif","jpg","tiff","jpeg","bmp","png"];
		ext.forEach(function(val) {file_extension[val]='http://www.peersm.com/img/extensions/'+val+'.png'});
		var test_bandwidth=function() {
			var xhr_object = new XMLHttpRequest();
			if (xhr_object)	{
				xhr_object.open("POST",'bandwidth.html',true);
				var a=Date.now();
				var size=100000;
				xhr_object.send(new Uint8Array(size));
				xhr_object.onreadystatechange=function() {
					if (xhr_object.readyState==4) {
						var b=100000/((Date.now()-a)/1000); //Bytes per second
						BANDWIDTH=parseInt((BANDWIDTH?((BANDWIDTH+b)/2):b)/BFACTOR);
						//console.log('bandwidth : '+parseInt(b*8/1000)+' Kbps');
						console.log('bandwidth : '+(BANDWIDTH*8/1000)+' Kbps');
					};
				};
			};
		};
		setInterval(test_bandwidth,5*3600*1000);
		test_bandwidth();
	};
}