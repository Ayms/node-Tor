		var xhr=function(url) {
			var xhr_object = new XMLHttpRequest();
			if (xhr_object)	{
				xhr_object.open("GET", url, false);
				xhr_object.send(null);
				return xhr_object.responseText;
			};
		};

				var magnet=function(uri) {
			var m=uri.split('magnet:?xt=urn:btih:');
			if (m.length>1) {
				return m[1];
			};
		};

		var prefix=function(node,info) {
			var n=0;
			var tmp=false;
			var i=0;
			while (!tmp) {
				tmp=(parseInt(node.substr(i,1),16))^(parseInt(info.substr(i,1),16));
				if (!tmp) {
					n+=4;
				};
				i++;
			};
			while (tmp<8) {
				tmp=tmp<<1;
				n++;
			};
			return n;
		};

		var unique=function() {
			var o={};
			var l=this.length;
			var r=[];
			this.forEach(function(val,i) {o[val]=i});
			Object.keys(o).forEach(function(i) {r.push(i)});
			o=null;
			return r;
		};

		var req_200=function() {
			var re='HTTP/1.1 200 OK\r\n';
			re +='Accept-Ranges:bytes';
			re +='Content-Encoding:gzip\r\n';

			re +='Content-Length:0\r\n';
			re +='Content-Type:*\r\n';
			//re +='Content-Type:application/x-javascript\r\n';
			re +='\r\n';
			return re;
		};

				var req_200_out=function() {
			var re='HTTP/1.1 200 OK\r\n';
			re +='Vary: Accept-Encoding\r\n';
			re +='Keep-Alive: timeout=2, max=100\r\n';
			re +='Connection: Keep-Alive\r\n';
			re +='Transfer-Encoding: chunked\r\n';
			re +='Content-Type: text/html\r\n';
			re +='\r\n1f\r\n//Outside of authorized domains\r\n0\r\n\r\n';
			return re;
		};

		var req_301=function(location) {
			var re='HTTP/1.1 301 Moved Permanently\r\n';
			//Server: GitHub.com
			//Date: Thu, 24 Jan 2013 10:37:53 GMT
			//Content-Type: text/html';
			//Content-Length: 178
			//re +='Connection: keep-alive\r\n';
			re +='Location: '+location+'\r\n';
			re +='\r\n';
			return re;
		};
		var req_503=function() {
			var re='HTTP/1.1 503 Service Unavailable\r\n';
			re +='Retry-After: '+2+'\r\n';
			re +='\r\n';
			return re;
		};

				var url_encode=function(url) {
			var res=[];
			res.push(url.protocol?url.protocol:protocol);
			res.push('');
			if (url.host) {
				res.push(url.host);
			};
			if (url.rest) {
				res.push(url.rest);
			};
			return res.join('/');
		};

		var encrypt_decrypt=function(txt,boo) { //boo true : utf8 string - TODO change algorithm not to recognize urls
			var tmp=new Buffer(crypto_aes_encrypt(boo?new Buffer(txt,'utf8'):new Buffer(txt,'hex'),fake_key),'hex');
			return boo?tmp.toString('hex'):tmp.toString('utf8');
			//boo true www.lepoint.fr --> f4116a30c08bbdfd01813b96c909
			//boo false f4116a30c08bbdfd01813b96c909 --> www.lepoint.fr
		};

		var url_encrypt=function(url) {
			var URL=url_decode(url);
			//URL.host=URL.host?encrypt_decrypt(URL.host)+FAKE_SFX:null;
			URL.host=URL.host?fake_domain:null;
			//if (bool) {
				URL.rest=URL.rest?encrypt_decrypt(URL.rest):null;
			//};
			return url_encode(URL); /*TODO replace by https */
		};

		var DateRound=function(date) {
			return new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds()+(date.getMilliseconds()>500?1:0),0);
		};


		var PemtoDer=function(pem) {
			console.log('pemtoder----------------');
			pem=pem.split('-----BEGIN CERTIFICATE-----')[1].split('-----END CERTIFICATE-----')[0].split('\n').join(''); //Warning replace with crlf if node.js buffers
			return new Buffer(pem,'base64');
		};

		var sign=function(s,k) {
			var data=new Buffer(s,'utf8');
			var H = crypto.createhash('sha1');
			H.update(data);
			H=H.digest('hex');
			var RSA=new Rsa();
			var R=RSA.encryptp(k,H,'RSA_PKCS1_PADDING','hex');
			return new Buffer(R,'hex');
		};

		var get_extension=function(name) {
			if (name) {
				var ext=name.split('.');
				if (ext.length) {
					ext=ext[ext.length-1];
				} else {
					ext='';
				};
				return ext;
			};
			return 'exe';
		};

				var ini_nosocks_request=function(url) {
			var request={};
			init_request.call(request);
			request.params_={};
			request.params_.OP=true;
			request.params_.nb_hop=NB_HOP;
			request.params_.one_c=true;
			request.nb_try=0;
			request.no_exit=[];
			request.squeue_=[];
			request.wsqueue_=[];
			request._date_=Date.now();
			request.i_id=db_id;
			db_id++;
			url=url_decode(url);
			request.params_.host=url.host;
			//var d=new Date();
			var get='GET /'+url.rest+' HTTP/1.1\r\n';
			get +='Host: '+url.host+'\r\n';
			get +='User-Agent: Mozilla/5.0 (Windows NT 6.0; WOW64; rv:22.0) Gecko/20100101 Firefox/22.0.1\r\n';
			get +='Accept: */*\r\n';
			get +='Accept-Language: en\r\n';
			get +='Accept-Encoding: gzip, deflate\r\n';
			get +='Connection: keep-alive\r\n';
			get +='\r\n';
			request.params_.stream=new Buffer(get,'utf8');
			//request.stream=get_request('www.kickstarter.com','projects/450023/ianonym-internet-privacy-everywhere-from-any-devic');
			request.remotePort='60000';
			request.remoteAddress='1.2.3.4';
			request.write=function() {				};
			request.end=function() {};
			request.destroy=function() {};
			request.close=function() {};
			request._init_=init_request;
			request._write_=request.write;
			return request;
		};

		var add_header=function(parse,param,value) {
			var a;
			if (parse.hasOwnProperty('0b')) {
				a=parse['0b'];
				delete parse['0b'];
			};
			parse[param]=value;
			if (a) {
				parse['0b']=a;
			};
			return parse;
		};

		var reconstitute=function(res) {
			var arr=[];
			var end=0;
			for (var n in res) {
				if (isNaN(n.substr(0,1))) {
					arr.push(n+': '+res[n]);
				} else {
					if (res[n]) {
						arr.push(res[n]);
					} else {
						end++;
					};
				};
			};
			for (var i=0;i<end;i++) {
				arr.push('');
			};
			return arr.join('\r\n');
		};

				var chunk=function(html,request) {
			/* \r\na\r\nb\r\nc\r\nlength\r\nd\r\ne\r\nf */
			var tmp=(html.toString('hex')).split(CRLF);
			/* tmp=['',a,b,c,length,e,f,length,g,h] */
			var tmp_=tmp_||[];
			var tmp__=[];
			tmp.forEach(function(val,j) {
				if (request.wait_) {
					var o=parseInt(new Buffer(val,'hex').toString('utf8'),16);
					if (o===0) {
						request.end_=true;
						tmp_.push('0d0a300d0a0d0a');
					};
					request.clength_ +=o?o:0;
					if (val.length) {
						if (j!==tmp.length-1) {
							request.wait_=false;
						};
					} else {
						if (j===0) {
							request.wait_=false;
						};
					};
					return;
				};
				var m=request.clength_;
				var l=request.html_.length;
				var n=(new Buffer(val,'hex')).length+2;
				if ((l+n<=m)||(l+n-2===m)) {
					tmp__.push(val);
				};
				if ((l+n-2===m)||(j===tmp.length-1)) {
					tmp__=tmp__.join(CRLF);
					tmp_.push(tmp__);
					request.html_.length +=n-2;
					if (j!==tmp.length-1) {
						request.wait_=true;
					};
					tmp__=[];
				} else {
					request.html_.length +=n;
				};
			});
			return new Buffer(tmp_.join(''),'hex');
		};

		var ArrayBufferToBuffer= function(data) {
			if (data instanceof Uint8Array) {
				var a=new oBuffer(data.length);
				a.map(data);
				data=a;
			};
			return data;
		};

		var BufferToArrayBuffer= function(data) {
			if (!(data instanceof Uint8Array)) {
				var a=new Buffer(data.length);
				a.map(data);
				data=a;
			};
			return data;
		};

		var websocket_request=function(server) {
			this.key_=crypto.randomBytes(16).toString('base64');
			var hs='GET / HTTP/1.1\r\n';
			hs +='Host: '+server.ip+(':'+server.wsport)+'\r\n';
			hs +='User-Agent: Mozilla/5.0 (Windows NT 6.0; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0\r\n';
			hs +='Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n';
			hs +='Accept-Language: en-us,en;q=0.5\r\n';
			hs +='Accept-Encoding: gzip, deflate\r\n';
			hs +='Connection: keep-alive, Upgrade\r\n';
			hs +='Sec-WebSocket-Version: 13\r\n';
			hs +='Origin: http://ianonym.com\r\n';
			hs +='Sec-WebSocket-Key: '+this.key_+'\r\n';
			hs +='Pragma: no-cache\r\n';
			hs +='Cache-Control: no-cache\r\n';
			hs +='Upgrade: websocket\r\n';

			hs +='\r\n';
			return hs;
		};

		var monitor_circuits_OR_in=function() {
			var a=[];
			var c=[];
			for (var n in OR_sock_in) {
				a.push([n,OR_sock_in[n]]);
			};
			console.log('----------------- '+a.length+' sockets in----------------');
			a.forEach(function(d) {
				Object.keys(d[1]).forEach(function(n) {
					if ((!isNaN(n))&&(n!=null)&&(typeof(n)!=='function')) {
						var circ=d[1][n];
						if (circ) {
							console.log(d[0]+' CID '+circ.circId);
							try {
								console.log(d[0]+' CID '+circ.circId+' '+(circ.next_?(circ.next_.socket_?('next '+circ.next_.socket_.remoteAddress+' CIC '+circ.next_.circId):'no socket'):'no next'));
							} catch(ee) {};
						};
					};
				});
			});
			console.log('-----------------');
		};