if (window_browser&&!window_browser_server) { //Peersm and ianonym start
		var detkey=function(e) {
			if(e.keyCode==13) {
				this.blur();
				return true;
			};
			return false;
		};
	if (anonym) {
		var fake_key=new Buffer('00112233445566778899001122334455','hex')
		var $b=document.body;
		var $h=document.getElementsByTagName('head');
		var example='http://www.lepoint.fr';
		var current;
		var loadTop=function() {
			var xdiv=xrounded();
			xdiv.className='rounded';
			$b.appendChild(xdiv);
			return xdiv;
		};
		var xrounded=function() {
			var rdiv=document.createElement('div');
			var rdivs=rdiv.style;
			rdivs.marginLeft='1%';
			//rdivs.marginTop='2%';
			Float(rdiv,'left');
			rdivs.width='98%';
			rdivs.textAlign='center';
			rdivs.color='#000';
			rdivs.fontWeight='800';
			rdivs.fontSize='1em';
			rdivs.background='white';
			rdivs.borderWidth='1px';
			rdivs.borderStyle='solid';
			rdivs.borderColor='rgb(217,217,217)';
			return rdiv;
		};
		var Float=function(obj,fl) {
			var objs=obj.style;
			objs.styleFloat=fl;
			objs.cssFloat=fl;
		};
		var clearObj=function(obj) {
			if (obj) {
				while (obj.firstChild) {
					obj.removeChild(obj.firstChild);
				};
			};
		};
		if ($h.length) {
			clearObj($h.item(0));
		};
		clearObj($b);
		var csstext='\
		html {\
		border:0;\
		padding:0;\
		border:0;\
		}\
		body {\
		font-family: Arial,"Trebuchet MS",helvetica,sans serif;\
		font-size: 14px;\
		font-style: normal;\
		font-weight: normal;\
		text-decoration: none;\
		height: 100%;\
		width:100%;\
		margin:auto;\
		padding:0;\
		background-color:black !important;\
		}\
		p {\
		margin-left:1%;\
		margin-right:1%;\
		}\
		a {\
		margin:1%;\
		}\
		div.ew{\
		border:0;\
		margin:0;\
		padding:0;\
		-webkit-tap-highlight-color:rgba(0,0,0,0);\
		}\
		.rounded {\
		-webkit-border-radius:8px;\
		-moz-border-radius:8px;\
		border-radius:8px;\
		}\
		input.ew{\
		font-size:1.2em;\
		-webkit-border-radius:7px;\
		-moz-border-radius:7px;\
		border-radius:7px;\
		border:1px solid;\
		}';
		var css=document.createElement('STYLE');
		css.appendChild(document.createTextNode(csstext));
		$b.appendChild(css);

		var x_x01=loadTop();
		var x_x1=document.createElement('INPUT');
		var x_x1s=x_x1.style;
		x_x1.className='ew';
		x_x1s.width='80%';
		x_x1s.padding='1%';
		x_x1s.marginTop='1%';
		x_x1s.marginBottom='1%';
		x_x1s.marginLeft='1%';
		x_x1s.textAlign='center';
		x_x1s.color='#000';
		x_x1.value=current||example;
		x_x01.appendChild(x_x1);
		x_x1.onkeydown = function(xevent) {
			if ((detkey.call(this,xevent||window.event))&&(this.value!=='')) {
				load(this.value);
			};
		};
		x_x1.onmousedown=function() {
			if (this.value===example) {
				this.value='';
			};
		};
		var x_x3=document.createElement('SPAN');
		var x_x3s=x_x3.style;
		x_x3.className='ew';
		x_x3s.padding='1%';
		x_x3s.width='8%';
		x_x3s.cursor='pointer';
		x_x3.className='rounded';
		x_x3s.marginTop='1%';
		x_x3s.marginLeft='1%';
		x_x3s.backgroundColor='#387BAF';
		x_x3s.color='white';
		x_x3.innerHTML='OK';
		x_x01.appendChild(x_x3);
		x_x3.onmousedown=function() {
			if (x_x1.value!=='') {
				load(x_x1.value);
			};
		};
		var x_x02=loadTop();
		x_x02.style.marginTop='1%';
		x_x02.style.textAlign='left';
		x_x02.innerHTML='<p>How to use it :<br><br>First please set your proxy settings (Options/Advanced/Network/Settings) to "Automatic proxy configuration" with the value "http://www.ianonym.com/proxy.pac". Then, reload this page. When you are finished don\'t forget to restore the settings to the previous value (No Proxy normally). You should see below the message "Websocket connected", if not, clear the history, close your browser and reopen it.<br><br>Replace "www.example.com" by the URL that you want to open, then click on OK and click on the url proposed. This will establish a secure connection between the new page that was open after you clicked and the current page.<br><br>The new page should indicate that you have initiated an untrusted connection because the certificate created for this connection is self signed, click that you "understand the risks", "Add Exception", and confirm.<br><br>The page will reload and you can start surfing anonymously. If you surf to another site you will have to confirm the exception again, that\'s a little bit painfull but at least you are sure that you are secured. If you have some doubts about your connection, you can first try the <a href="http://www.ianonym.com/intercept.html" target="_blank">Interception Detector</a>.<br><br>This will ensure that you are not intercepted and you can be totally sure to be anonym since all exchanges are encrypted and the domain where you are going looks the same as the link that you clicked, so is hidden, nobody except your browser (the initial page) can decrypt the messages and know the real domain.</p>';
		var x_x03=loadTop();
		x_x03.style.marginTop='1%';
		x_x03.style.paddingBottom='1%';
		x_x03.style.textAlign='left';

		if (demo) {
			x_x02.style.display='none';
			//x_x03.style.display='none';
		};

		var load=function(url) {
			var fake_d=url_decode(url);
			if (fake_d.host) {
				protocol=fake_d.protocol;
				fake_domain='www.'+encrypt_decrypt(fake_d.host,true)+FAKE_SFX;
				if ((NB_C>=2)&&(fake_cid)) {
					console.log('START PAGE real '+url+' fake http://'+fake_domain);
					client.associate(fake_cid,fake_domain);
					x_x03.innerHTML='<p>Click on the link below :<br><br><a href="http'+TLS_OP+'://'+fake_domain+'/'+fake_d.rest+'" target="_blank">http'+TLS_OP+'://'+fake_domain+'/'+fake_d.rest+'</a>';
				} else {
					alert('Not enough circuits established : '+NB_C+' - Please wait and retry');
					//setTimeout(load,10000);
				};
			};
		};
		try {
		var levels=128;
		var sc=5;
		var shape_size=256;
		var r,g,b;
		var op=1;
		var canvas=document.createElement("canvas");
		canvas.width=shape_size*4;
		canvas.height=shape_size*4;
		canvas.style.position='absolute';
		canvas.style.zIndex=-1;
		canvas.style.top='70%';
		canvas.style.left='50%';
		canvas.style.marginLeft=-(canvas.width/2)+'px';
		canvas.style.marginTop=-(canvas.height/2)+'px';
		document.body.appendChild(canvas);
		var context=canvas.getContext("2d");
		var shape=document.createElement("canvas");
		shape.width=shape_size;
		shape.height=shape_size;
		var shapeContext=shape.getContext("2d");
		shapeContext.beginPath();
		shapeContext.arc(shape_size/2,shape_size/2,shape_size/2,0,Math.PI*2,true);
		var draw=function(col) {
			shapeContext.fillStyle=col;
			shapeContext.fill();
			for (var i=0;i<levels;i++) {
				var size=shape_size+i*sc;
				var size_half=size * 0.5;
				var x=shape_size*2-size_half;
				var y=shape_size*2-size_half;
				context.globalAlpha=(shape_size*2/((i+4)*(i+4)*20));
				context.drawImage(shape,x,y,size,size);
			};
		};
		draw('rgb(106,253,123)');
		} catch(ee) {
			document.body.style.backgroundColor='black';
			document.body.style.backgroundColor='radial-gradient(circle at center top, #bdd8df, black)';
		};
	};
	if (download) { //Peersm

		/*

		var s=new Buffer('f4116a30c58fa3fd06962296cc14160102','hex');

		var s_=new Buffer('f4116a30c58fa3fd06962296cc14160102','hex');

		var K1=new Buffer('00112233445566778899aabbccddeeff','hex');

		var IV=new Buffer('00000000000000000000000000000000','hex');

		var C=crypto.createcipheriv('aes-128-ctr',K1,IV);

		var e=C.update(s,'hex','hex');

		console.log(e);

		var fg=C.update(s_,'hex','hex');

		console.log(fg);

		console.log(e+fg);

		var C=crypto.createcipheriv('aes-128-ctr',K1,IV);

		var e=C.update([s,s_].concatBuffers(),'hex','hex');

		console.log(e);

		var H=new Hash('sha1');

		H.update(s);

		H.update(s_);

		console.log(H.digest('hex'));

		var H=new Hash('sha1');

		H.update([s,s_].concatBuffers());

		console.log(H.digest('hex'));
		*/

		/*
		4d045f2cbfa9665f20f698a798db71c640410325
		*/

		/*
		09f5919e8f8643dde96100005397952a86
		20d8aabb8ac78b9ce53fe45597d0cf1cfb
		09f5919e8f8643dde96100005397952a8620d8aabb8ac78b9ce53fe45597d0cf1cfb
		09f5919e8f8643dde96100005397952a8620d8aabb8ac78b9ce53fe45597d0cf1cfb
		*/
		/*
		var H=crypto.createhash('sha1');
		H.update(s);
		H.update(s_);
		console.log(H.digest('hex'));

		var H=crypto.createhash('sha1');
		H.update([s,s_].concatBuffers());
		console.log(H.digest('hex'));
		*/

		/*
		4d045f2cbfa9665f20f698a798db71c640410325
		*/

		var Rsa_;
		var load_Blob_Url;
		var Media,divMedia,closebox;
		var isStreaming=false;
		var mediaSrc={};
		var store_DB,crashed,restore_chunk;
		var remove;
		var open_db,open_db2;
		var progress_bar;
		var stop_,init_media;
		var key_stored;
		var Dchart,Doptions,Ddata;
		var Pchart,Poptions,Pdata;
		var save_,graph_,debug_;
		var count_tls=0;
		var count_tls_data=0;
		var time_tls_data=0;
		var PERF_TLS=100;
		var clear_menu;
		var key__,update_proxy;
		var retry_media,duration;
		var Myprompt=function(msg,func) {
			$_('prompt_box').style.display='block';
			$_('prompt-message').innerHTML=msg;
			$_('prompt-input').value='';
			$_('prompt-input').submit=func;
			addEvent($_('prompt-input'),'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble = true;},false);
			addEvent($_('prompt-input'),'keydown',function(e) {if ((detkey.call(this,e||window.event))&&(this.value!=='')) {$_('prompt_box').style.display='none';this.submit()}},false);
		};
		var buttonp=$_('close_prompt');
		addEvent(buttonp,'mousedown',function() {$_('prompt_box').style.display='none';$_('prompt-input').submit()},false);
		var buttona=$_('close_alert');
		addEvent(buttona,'mousedown',function() {$_('alert_box').style.display='none';addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);},false);
		var Myalert=function(msg) {
			setTimeout(function() {$_('alert_box').style.display='block'},500);
			$_('dialog-message').innerHTML=msg;
		};
		var hide=function(obj) {
			obj.style.display='none';
		};
		var show=function(obj) {
			obj.style.display='block';
		};
		var clearTimers=function(t) {
			if (t) {
				t.forEach(function(val) {clearTimeout(val)});
			};
			t=[];
		};
		var workerjs='var forge={};(function(){var a=forge.util=forge.util||{};if(typeof process==="undefined"||!process.nextTick){if(typeof setImmediate==="function"){a.setImmediate=setImmediate;a.nextTick=function(b){return setImmediate(b)}}else{a.setImmediate=function(b){setTimeout(b,0)};a.nextTick=a.setImmediate}}else{a.nextTick=process.nextTick;if(typeof setImmediate==="function"){a.setImmediate=setImmediate}else{a.setImmediate=a.nextTick}}a.isArray=Array.isArray||function(b){return Object.prototype.toString.call(b)==="[object Array]"};a.ByteBuffer=function(c){this.data=c||"";this.read=0};a.ByteBuffer.prototype.length=function(){return this.data.length-this.read};a.ByteBuffer.prototype.isEmpty=function(){return this.length()<=0};a.ByteBuffer.prototype.putByte=function(c){this.data+=String.fromCharCode(c);return this};a.ByteBuffer.prototype.fillWithByte=function(c,f){c=String.fromCharCode(c);var e=this.data;while(f>0){if(f&1){e+=c}f>>>=1;if(f>0){c+=c}}this.data=e;return this};a.ByteBuffer.prototype.putBytes=function(b){this.data+=b;return this};a.ByteBuffer.prototype.putString=function(b){this.data+=a.encodeUtf8(b);return this};a.ByteBuffer.prototype.putInt16=function(b){this.data+=String.fromCharCode(b>>8&255)+String.fromCharCode(b&255);return this};a.ByteBuffer.prototype.putInt24=function(b){this.data+=String.fromCharCode(b>>16&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b&255);return this};a.ByteBuffer.prototype.putInt32=function(b){this.data+=String.fromCharCode(b>>24&255)+String.fromCharCode(b>>16&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b&255);return this};a.ByteBuffer.prototype.putInt16Le=function(b){this.data+=String.fromCharCode(b&255)+String.fromCharCode(b>>8&255);return this};a.ByteBuffer.prototype.putInt24Le=function(b){this.data+=String.fromCharCode(b&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b>>16&255);return this};a.ByteBuffer.prototype.putInt32Le=function(b){this.data+=String.fromCharCode(b&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b>>16&255)+String.fromCharCode(b>>24&255);return this};a.ByteBuffer.prototype.putInt=function(b,c){do{c-=8;this.data+=String.fromCharCode((b>>c)&255)}while(c>0);return this};a.ByteBuffer.prototype.putSignedInt=function(b,c){if(b<0){b+=2<<(c-1)}return this.putInt(b,c)};a.ByteBuffer.prototype.putBuffer=function(b){this.data+=b.getBytes();return this};a.ByteBuffer.prototype.getByte=function(){return this.data.charCodeAt(this.read++)};a.ByteBuffer.prototype.getInt16=function(){var b=(this.data.charCodeAt(this.read)<<8^this.data.charCodeAt(this.read+1));this.read+=2;return b};a.ByteBuffer.prototype.getInt24=function(){var b=(this.data.charCodeAt(this.read)<<16^this.data.charCodeAt(this.read+1)<<8^this.data.charCodeAt(this.read+2));this.read+=3;return b};a.ByteBuffer.prototype.getInt32=function(){var b=(this.data.charCodeAt(this.read)<<24^this.data.charCodeAt(this.read+1)<<16^this.data.charCodeAt(this.read+2)<<8^this.data.charCodeAt(this.read+3));this.read+=4;return b};a.ByteBuffer.prototype.getInt16Le=function(){var b=(this.data.charCodeAt(this.read)^this.data.charCodeAt(this.read+1)<<8);this.read+=2;return b};a.ByteBuffer.prototype.getInt24Le=function(){var b=(this.data.charCodeAt(this.read)^this.data.charCodeAt(this.read+1)<<8^this.data.charCodeAt(this.read+2)<<16);this.read+=3;return b};a.ByteBuffer.prototype.getInt32Le=function(){var b=(this.data.charCodeAt(this.read)^this.data.charCodeAt(this.read+1)<<8^this.data.charCodeAt(this.read+2)<<16^this.data.charCodeAt(this.read+3)<<24);this.read+=4;return b};a.ByteBuffer.prototype.getInt=function(c){var b=0;do{b=(b<<8)+this.data.charCodeAt(this.read++);c-=8}while(c>0);return b};a.ByteBuffer.prototype.getSignedInt=function(d){var c=this.getInt(d);var b=2<<(d-2);if(c>=b){c-=b<<1}return c};a.ByteBuffer.prototype.getBytes=function(b){var c;if(b){b=Math.min(this.length(),b);c=this.data.slice(this.read,this.read+b);this.read+=b}else{if(b===0){c=""}else{c=(this.read===0)?this.data:this.data.slice(this.read);this.clear()}}return c};a.ByteBuffer.prototype.bytes=function(b){return(typeof(b)==="undefined"?this.data.slice(this.read):this.data.slice(this.read,this.read+b))};a.ByteBuffer.prototype.at=function(b){return this.data.charCodeAt(this.read+b)};a.ByteBuffer.prototype.setAt=function(d,c){this.data=this.data.substr(0,this.read+d)+String.fromCharCode(c)+this.data.substr(this.read+d+1);return this};a.ByteBuffer.prototype.last=function(){return this.data.charCodeAt(this.data.length-1)};a.ByteBuffer.prototype.copy=function(){var b=a.createBuffer(this.data);b.read=this.read;return b};a.ByteBuffer.prototype.compact=function(){if(this.read>0){this.data=this.data.slice(this.read);this.read=0}return this};a.ByteBuffer.prototype.clear=function(){this.data="";this.read=0;return this};a.ByteBuffer.prototype.truncate=function(c){var b=Math.max(0,this.length()-c);this.data=this.data.substr(this.read,b);this.read=0;return this};a.ByteBuffer.prototype.toHex=function(){var e="";for(var d=this.read;d<this.data.length;++d){var c=this.data.charCodeAt(d);if(c<16){e+="0"}e+=c.toString(16)}return e};a.ByteBuffer.prototype.toString=function(){return a.decodeUtf8(this.bytes())};a.createBuffer=function(b,c){c=c||"raw";if(b!==undefined&&c==="utf8"){b=a.encodeUtf8(b)}return new a.ByteBuffer(b)};a.fillString=function(e,d){var b="";while(d>0){if(d&1){b+=e}d>>>=1;if(d>0){e+=e}}return b};a.xorBytes=function(j,f,l){var e="";var d="";var h="";var g=0;var k=0;for(;l>0;--l,++g){d=j.charCodeAt(g)^f.charCodeAt(g);if(k>=10){e+=h;h="";k=0}h+=String.fromCharCode(d);++k}e+=h;return e};a.hexToBytes=function(c){var d="";var b=0;if(c.length&1==1){b=1;d+=String.fromCharCode(parseInt(c[0],16))}for(;b<c.length;b+=2){d+=String.fromCharCode(parseInt(c.substr(b,2),16))}return d};a.bytesToHex=function(b){return a.createBuffer(b).toHex()};a.int32ToBytes=function(b){return(String.fromCharCode(b>>24&255)+String.fromCharCode(b>>16&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b&255))};a.encodeUtf8=function(b){return unescape(encodeURIComponent(b))};a.decodeUtf8=function(b){return decodeURIComponent(escape(b))};a.deflate=function(e,c,d){c=a.decode64(e.deflate(a.encode64(c)).rval);if(d){var f=2;var b=c.charCodeAt(1);if(b&32){f=6}c=c.substring(f,c.length-4)}return c};a.inflate=function(d,b,c){var e=d.inflate(a.encode64(b)).rval;return(e===null)?null:a.decode64(e)}})();(function(){var e=forge.sha1=forge.sha1||{};forge.md=forge.md||{};forge.md.algorithms=forge.md.algorithms||{};forge.md.sha1=forge.md.algorithms.sha1=e;var c=null;var b=false;var d=function(){c=String.fromCharCode(128);c+=forge.util.fillString(String.fromCharCode(0),64);b=true};var a=function(r,p,u){var q,o,n,m,l,k,j,g;var h=u.length();while(h>=64){o=r.h0;n=r.h1;m=r.h2;l=r.h3;k=r.h4;for(g=0;g<16;++g){q=u.getInt32();p[g]=q;j=l^(n&(m^l));q=((o<<5)|(o>>>27))+j+k+1518500249+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<20;++g){q=(p[g-3]^p[g-8]^p[g-14]^p[g-16]);q=(q<<1)|(q>>>31);p[g]=q;j=l^(n&(m^l));q=((o<<5)|(o>>>27))+j+k+1518500249+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<32;++g){q=(p[g-3]^p[g-8]^p[g-14]^p[g-16]);q=(q<<1)|(q>>>31);p[g]=q;j=n^m^l;q=((o<<5)|(o>>>27))+j+k+1859775393+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<40;++g){q=(p[g-6]^p[g-16]^p[g-28]^p[g-32]);q=(q<<2)|(q>>>30);p[g]=q;j=n^m^l;q=((o<<5)|(o>>>27))+j+k+1859775393+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<60;++g){q=(p[g-6]^p[g-16]^p[g-28]^p[g-32]);q=(q<<2)|(q>>>30);p[g]=q;j=(n&m)|(l&(n^m));q=((o<<5)|(o>>>27))+j+k+2400959708+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<80;++g){q=(p[g-6]^p[g-16]^p[g-28]^p[g-32]);q=(q<<2)|(q>>>30);p[g]=q;j=n^m^l;q=((o<<5)|(o>>>27))+j+k+3395469782+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}r.h0+=o;r.h1+=n;r.h2+=m;r.h3+=l;r.h4+=k;h-=64}};e.create=function(){if(!b){d()}var f=null;var i=forge.util.createBuffer();var g=new Array(80);var h={algorithm:"sha1",blockLength:64,digestLength:20,messageLength:0};h.start=function(){h.messageLength=0;i=forge.util.createBuffer();f={h0:1732584193,h1:4023233417,h2:2562383102,h3:271733878,h4:3285377520};return h};h.start();h.update=function(k,j){if(j==="utf8"){k=forge.util.encodeUtf8(k)}h.messageLength+=k.length;i.putBytes(k);a(f,g,i);if(i.read>2048||i.length()===0){i.compact()}return h};h.digest=function(){var j=h.messageLength;var m=forge.util.createBuffer();m.putBytes(i.bytes());m.putBytes(c.substr(0,64-((j+8)%64)));m.putInt32((j>>>29)&255);m.putInt32((j<<3)&4294967295);var k={h0:f.h0,h1:f.h1,h2:f.h2,h3:f.h3,h4:f.h4};a(k,g,m);var l=forge.util.createBuffer();l.putInt32(k.h0);l.putInt32(k.h1);l.putInt32(k.h2);l.putInt32(k.h3);l.putInt32(k.h4);return l};h.digest2=function(){var j=h.messageLength;var o=forge.util.createBuffer();var k=forge.util.createBuffer(i.data.slice(i.read));var m=g.slice(0);o.putBytes(i.bytes());o.putBytes(c.substr(0,64-((j+8)%64)));o.putInt32((j>>>29)&255);o.putInt32((j<<3)&4294967295);var l={h0:f.h0,h1:f.h1,h2:f.h2,h3:f.h3,h4:f.h4};a(l,g,o);var n=forge.util.createBuffer();n.putInt32(l.h0);n.putInt32(l.h1);n.putInt32(l.h2);n.putInt32(l.h3);n.putInt32(l.h4);i=k;g=m;return n};return h};e.createhash=function(){var g=e.create();var f=g.update;g.update=function(h){return f(h.toString("binary"))};g.digest=function(){return g.digest2().toHex()};return g}})();(function(){var j=false;var h=4;var f;var b;var d;var k;var g;var e=function(){j=true;d=[0,1,2,4,8,16,32,64,128,27,54];var x=new Array(256);for(var p=0;p<128;++p){x[p]=p<<1;x[p+128]=(p+128)<<1^283}f=new Array(256);b=new Array(256);k=new Array(4);g=new Array(4);for(var p=0;p<4;++p){k[p]=new Array(256);g[p]=new Array(256)}var s=0,o=0,v,t,q,w,l,u,r;for(var p=0;p<256;++p){w=o^(o<<1)^(o<<2)^(o<<3)^(o<<4);w=(w>>8)^(w&255)^99;f[s]=w;b[w]=s;l=x[w];v=x[s];t=x[v];q=x[t];u=(l<<24)^(w<<16)^(w<<8)^(w^l);r=(v^t^q)<<24^(s^q)<<16^(s^t^q)<<8^(s^v^q);for(var m=0;m<4;++m){k[m][s]=u;g[m][w]=r;u=u<<24|u>>>8;r=r<<24|r>>>8}if(s===0){s=o=1}else{s=v^x[x[x[v^q]]];o^=x[x[o]]}}};var a=function(z,o){var x=z.slice(0);var B,m=1;var r=x.length;var p=r+6+1;var s=h*p;for(var u=r;u<s;++u){B=x[u-1];if(u%r===0){B=f[B>>>16&255]<<24^f[B>>>8&255]<<16^f[B&255]<<8^f[B>>>24]^(d[m]<<24);m++}else{if(r>6&&(u%r===4)){B=f[B>>>24]<<24^f[B>>>16&255]<<16^f[B>>>8&255]<<8^f[B&255]}}x[u]=x[u-r]^B}if(o){var t;var D=g[0];var C=g[1];var A=g[2];var y=g[3];var v=x.slice(0);var s=x.length;for(var u=0,l=s-h;u<s;u+=h,l-=h){if(u===0||u===(s-h)){v[u]=x[l];v[u+1]=x[l+3];v[u+2]=x[l+2];v[u+3]=x[l+1]}else{for(var q=0;q<h;++q){t=x[l+q];v[u+(3&-q)]=D[f[t>>>24]]^C[f[t>>>16&255]]^A[f[t>>>8&255]]^y[f[t&255]]}}}x=v}return x};var c=function(u,v,t,o){var q=u.length/4-1;var p,n,m,l,s;if(o){p=g[0];n=g[1];m=g[2];l=g[3];s=b}else{p=k[0];n=k[1];m=k[2];l=k[3];s=f}var D,C,A,z,E,r,x;D=v[0]^u[0];C=v[o?3:1]^u[1];A=v[2]^u[2];z=v[o?1:3]^u[3];var y=3;for(var B=1;B<q;++B){E=p[D>>>24]^n[C>>>16&255]^m[A>>>8&255]^l[z&255]^u[++y];r=p[C>>>24]^n[A>>>16&255]^m[z>>>8&255]^l[D&255]^u[++y];x=p[A>>>24]^n[z>>>16&255]^m[D>>>8&255]^l[C&255]^u[++y];z=p[z>>>24]^n[D>>>16&255]^m[C>>>8&255]^l[A&255]^u[++y];D=E;C=r;A=x}t[0]=(s[D>>>24]<<24)^(s[C>>>16&255]<<16)^(s[A>>>8&255]<<8)^(s[z&255])^u[++y];t[o?3:1]=(s[C>>>24]<<24)^(s[A>>>16&255]<<16)^(s[z>>>8&255]<<8)^(s[D&255])^u[++y];t[2]=(s[A>>>24]<<24)^(s[z>>>16&255]<<16)^(s[D>>>8&255]<<8)^(s[C&255])^u[++y];t[o?1:3]=(s[z>>>24]<<24)^(s[D>>>16&255]<<16)^(s[C>>>8&255]<<8)^(s[A&255])^u[++y]};var i=function(H,r,u,o,v){var m=null;if(!j){e()}v=(v||"CBC").toUpperCase();if(typeof H==="string"&&(H.length===16||H.length===24||H.length===32)){H=forge.util.createBuffer(H)}else{if(forge.util.isArray(H)&&(H.length===16||H.length===24||H.length===32)){var B=H;var H=forge.util.createBuffer();for(var x=0;x<B.length;++x){H.putByte(B[x])}}}if(!forge.util.isArray(H)){var B=H;H=[];var z=B.length();if(z===16||z===24||z===32){z=z>>>2;for(var x=0;x<z;++x){H.push(B.getInt32())}}}if(!forge.util.isArray(H)||!(H.length===4||H.length===6||H.length===8)){return m}var I=(["CFB","OFB","CTR"].indexOf(v)!==-1);var p=(v==="CBC");var A=a(H,o&&!I);var w=h<<2;var n;var y;var s;var D;var q;var l;var F;m={output:null};if(v==="CBC"){F=E}else{if(v==="CFB"){F=G}else{if(v==="OFB"){F=t}else{if(v==="CTR"){F=C}else{throw {message:""}}}}}m.update=function(J){if(!l){n.putBuffer(J)}while(n.length()>=w||(n.length()>0&&l)){F()}};m.update2=function(J){if(J){if(J.length()){n.data=n.data.substr(n.read);n.read=0;n.putBuffer(J)}}while(n.length()>=w){F()}if(m.overflow){y.getBytes(m.overflow)}var M=n.length()%w;if(M){var K=forge.util.createBuffer(n.data.slice(n.read));var L=s.slice(0);while(n.length()>0){F()}n=K;s=L;y.truncate(w-M)}else{n.data="";n.read=0};m.overflow=M};m.finish=function(N){var M=true;var O=n.length()%w;if(!o){if(N){M=N(w,n,o)}else{if(p){var L=(n.length()===w)?w:(w-n.length());n.fillWithByte(L,L)}}}if(M){l=true;m.update()}if(o){if(p){M=(O===0)}if(M){if(N){M=N(w,y,o)}else{if(p){var J=y.length();var K=y.at(J-1);if(K>(h<<2)){M=false}else{y.truncate(K)}}}}}if(!p&&!N&&O>0){y.truncate(w-O)}return M};m.start=function(K,J){if(K===null){K=q.slice(0)}if(typeof K==="string"&&K.length===16){K=forge.util.createBuffer(K)}else{if(forge.util.isArray(K)&&K.length===16){var M=K;var K=forge.util.createBuffer();for(var L=0;L<16;++L){K.putByte(M[L])}}}if(!forge.util.isArray(K)){var M=K;K=new Array(4);K[0]=M.getInt32();K[1]=M.getInt32();K[2]=M.getInt32();K[3]=M.getInt32()}n=forge.util.createBuffer();y=J||forge.util.createBuffer();q=K.slice(0);s=new Array(h);D=new Array(h);l=false;m.output=y;if(["CFB","OFB","CTR"].indexOf(v)!==-1){for(var L=0;L<h;++L){s[L]=q[L]}q=null}};if(r!==null){m.start(r,u)}return m;function E(){if(o){for(var J=0;J<h;++J){s[J]=n.getInt32()}}else{for(var J=0;J<h;++J){s[J]=q[J]^n.getInt32()}}c(A,s,D,o);if(o){for(var J=0;J<h;++J){y.putInt32(q[J]^D[J])}q=s.slice(0)}else{for(var J=0;J<h;++J){y.putInt32(D[J])}q=D}}function G(){c(A,s,D,false);for(var K=0;K<h;++K){s[K]=n.getInt32()}for(var K=0;K<h;++K){var J=s[K]^D[K];if(!o){s[K]=J}y.putInt32(J)}}function t(){c(A,s,D,false);for(var J=0;J<h;++J){s[J]=n.getInt32()}for(var J=0;J<h;++J){y.putInt32(s[J]^D[J]);s[J]=D[J]}}function C(){c(A,s,D,false);for(var J=h-1;J>=0;--J){if(s[J]===4294967295){s[J]=0}else{++s[J];break}}for(var J=0;J<h;++J){y.putInt32(n.getInt32()^D[J])}}};forge.aes=forge.aes||{};forge.aes.startEncrypting=function(n,m,l,o){return i(n,m,l,false,o)};forge.aes.createEncryptionCipher=function(l,m){return i(l,null,null,false,m)};forge.aes.startDecrypting=function(n,m,l,o){return i(n,m,l,true,o)};forge.aes.createDecryptionCipher=function(l,m){return i(l,null,null,true,m)};forge.aes._expandKey=function(m,l){if(!j){e()}return a(m,l)};forge.aes._updateBlock=c;forge.aes.createcipheriv=function(r,o,n){var q=r.split("-")[2];var m=forge.util.createBuffer();o=forge.util.createBuffer(o.toString("binary"));n=forge.util.createBuffer(n.toString("binary"));var l=forge.aes.startEncrypting(o,n,m,q);var p=l.update2;l.update=function(t){var s;if(t){t=forge.util.createBuffer(t.toString("binary"))}else{t=forge.util.createBuffer()}p(t);s=m.toHex();m.data="";m.read=0;return s};return l}})();var wBuffer=function(a,e) {if (e==="hex") {try {var b=new Uint8Array(a.length/2);var l=a.length;for (var i=0;i<l;i+=2) {b[i/2]=parseInt(a[i]+a[i+1],16);};} catch(ee) {return new Uint8Array();};};return b;};Uint8Array.prototype.toString=function(enc) {var l=this.length;var r=[];if (enc==="hex") {for (var i=0;i<l;i++) {var tmp=this[i].toString(16);r.push(tmp.length===1?("0"+tmp):tmp);};};if (enc==="binary") {if (navigator.userAgent.indexOf("Chrome")===-1) {return String.fromCharCode.apply(null,this);}else{var cut=16*1024;var part="";var tmp=this;while (tmp.length) {var k=Math.min(tmp.length,cut);part +=String.fromCharCode.apply(null,tmp.subarray(0,k));tmp=tmp.subarray(k);};return part;};};return r.join("");};var createcipheriv=forge.aes.createcipheriv;self.onmessage=function(evt){var res=evt.data;var BL=65536;/*warning do not change*/;var type;var file;var size;/*modif chrome*/var reader=new FileReaderSync();file=res[1];type=res[0];size=file.size;var H=forge.sha1.createhash("sha1");if (type.indexOf("hash")===-1) {var C2=createcipheriv(res[0],res[2],res[3]);};var start=0;while (start!==size) {var chunk=new Uint8Array(reader.readAsArrayBuffer(file.slice(start,Math.min(start+BL,size))));if (type.indexOf("hash")!==-1) {H.update(chunk);if (type==="hash") {self.postMessage(chunk.length);} else {self.postMessage(chunk);};} else {var enc=new wBuffer(C2.update(chunk,"hex","hex"),"hex");H.update(enc);self.postMessage(enc);};start +=Math.min(BL,size-start);};self.postMessage([H.digest("hex")]);};';
		//google.load("visualization","1",{packages:["corechart"]});
		var restoring_chunk=function() {
			for (var n in crashed) {
				console.log('restoring_chunk');
				var request=crashed[n];
				if (request.k) { //typeerror todo check why
					request.file_id=request.k[0];
					delete request.k;
					var type=request.data.type||(request.content_chrome?request.content_chrome:request.content_);
					request.blob_=new Blob([],{type:type});
					if (request.hash_ini) {
						store_DB(request);
					} else {
						console.log('deleting chunks file_id '+request.file_id);
						var t=peersmDB.db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
						t.openCursor().onsuccess = function(evt) {
							var cursor = evt.target.result;
							if (cursor) {
								var res=cursor.value.k;
								if (res instanceof Array) {
									if (res[0]===request.file_id) {
										t.delete(res);
									};
								};
								cursor.continue();
							};
						};
					};
				};
			};
		};
		var _init=function() {
			//nlnet
			//TODO update automatically
			var peersm_started,routers;
			graph_=true;
			/*
			ordb2 fingerprint  2679B51C906158F3DF4C59AFD73E2B1FDA6535E1
			Bridges={ip:'37.59.47.27',port:0,wsport:8006,fing:'',o_modulus:'',name:'Tor Bridge 1'};

			ordb3 fingerprint  179B10784BF8955C73313CCB195904AE133E5F53	Server={ip:'37.59.47.27',port:8004,wsport:443,fing:'179B10784BF8955C73313CCB195904AE133E5F53',o_modulus:'da5efe2b08843218badece495d1400b13435e8acf426c4bb6382933467498ba106bb9198f9807bdf38f6fad8f5287b0799838f6e1c59fd2a39c524a68c25f835d9ee1ad495cc66757f13dd3335dd07ad96eac4c6e84672595fbe0d64f748de4c1d615a17753c63b52ac07eee234ffac18000b47116a38e37c78ceab72051f6cb'};
			*/
			//signature ordb_1: AD04F4C31490F2D6A61911973E97935EE8D5658D
			//modulus: cff0ec490689b965e54079981d8b2d1af0da453bd11faf3e61c6e89556c4084b51e7c534c482c74515658d68cb69e70451b84a4248531ef1b28bb0a2d1f2fd1a859a514376b79c1f70172ca1c7de2960d5a7cc402fa1ee6bfe114daee433776c9f88c28adc4ed3ebcc29dc64bfd721bee6882271408251df929c08ea6283de87
			Bridges={ip:'37.59.47.27',port:0,wsport:8051,fing:'',o_modulus:'',name:'Tor Bridge 1'};
			//signature ordb_2: 55C920B34C946B7A88DEE1165A0A1834CD6BCE66
			//modulus: d07e6882cd77a3d88eefd930f2dad797b05ccf4867e9efcb562283bcaece4fb56c0deab442b8b6c9ebd6513e9479e1714453efe1fb8403e39ec88ee5608bafc6c32b92952826383f0d47ecb1fd63afcd19e5ce52ca3979e5b3ef52d89a57ab29b8b2d437e9d4fb7460c76649ace73173b4625039d2ba18b639b0459a36d3a2d5
			Server={ip:'37.59.47.27',port:8052,wsport:8053,fing:'55C920B34C946B7A88DEE1165A0A1834CD6BCE66',o_modulus:'d07e6882cd77a3d88eefd930f2dad797b05ccf4867e9efcb562283bcaece4fb56c0deab442b8b6c9ebd6513e9479e1714453efe1fb8403e39ec88ee5608bafc6c32b92952826383f0d47ecb1fd63afcd19e5ce52ca3979e5b3ef52d89a57ab29b8b2d437e9d4fb7460c76649ace73173b4625039d2ba18b639b0459a36d3a2d5'};
			Guards=JSON.parse(xhr('guards').split('=')[1].split(';')[0]); //TODO
			Exit=JSON.parse(xhr('exit').split('=')[1].split(';')[0]); //TODO
			one_OR=Bridges;
			DB_OR=Server;
			WS_TLS=true; //No TLS for ORDB OR 8001
			Relays=Guards;
			show($_('debug'));
			unleash();
			$_('alert_box').style.display='none';
			//nlnet
			peersmcode='peersm2';
			try {
				peersmDB=indexedDB.open(peersmcode,6);
			} catch(ee) {
				$_('prompt_box').style.display='none';
				Myalert("<p style='text-align:center'>Your browser does not seem to support all the features required for Peersm. It is recommended to use Firefox version 26 or superior, or Chrome version 32 or superior.</p>");
				return;
			};
			peersmDB.onupgradeneeded=function(evt) {
				console.log('onupgradeneeded------------------');
				var db=evt.target.result;

				if(db.objectStoreNames.contains(peersmcode+'_')) {
					db.deleteObjectStore(peersmcode+'_');
				};
				if(db.objectStoreNames.contains(peersmcode)) {
					db.deleteObjectStore(peersmcode);
				};
				/*
				var store=db.createObjectStore(peersmcode,{keyPath:'hash'});
				store.createIndex('name','name_hash',{unique:true});
				*/
				db.createObjectStore(peersmcode,{keyPath:'name_hash'});
				db.createObjectStore(peersmcode+'_',{keyPath:'k'});
			};
			peersmDB.onsuccess=function (evt) {
				console.log('Success opening database');
				peersmDB.db=evt.target.result;
				//nlnet
				if (!key_stored) {
					var t=peersmDB.db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
					t.put({k:'00112233445566778899aabbccddeeff'}); //not used any longer
				};
				var t=peersmDB.db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
				crashed={};
				chrome=(navigator.userAgent.indexOf('Chrome')!==-1)?true:false;
				t.openCursor().onsuccess = function(evt) {
					var cursor = evt.target.result;
					if (cursor) {
						var res=cursor.value.k;
						if (!(res instanceof Array)) {
							key_stored=true;
						} else {
							//if (!chrome) {
								var val=cursor.value;
								var index=val.k[0];
								if (!(crashed.hasOwnProperty(index))) {
									console.log('restoring chunks '+index);
									crashed[index]=val;
									//{k[file_id,nb],hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data}
								};
							//} else {
								//t.delete(res);
								//cursor.continue();
							//};
						};
						cursor.continue();
					} else {
						if (store_DB) {
							restoring_chunk();
						} else {
							restore_chunk=true;
						};
					};
					if (!peersm_started) {
						peersm_started=true;
						start_download(); //nlnet start peersm
					};
				};
				//$_('graph').checked='checked';
				$_('debug').checked='checked';
			};
			peersmDB.onerror=function(err) {
				console.log('Error opening database');
			};
		};
		update_node=function() {
			//nlnet
			//TODO update automatically
		};
		var start_download=function() {
			console.log('start Peersm');
			var ini_direct_chart=function() {
				Ddata = new google.visualization.DataTable();
				Ddata.addColumn('datetime','Time');
				Ddata.addColumn('number','Received (KB)');
				Ddata.addColumn('number','Sent (KB)');
				var date=new Date();
				for (var i=70;i>0;i--) {
					var tmp=new Date();
					tmp.setTime(date.getTime()-1000*i);
					Ddata.addRow([tmp,0,0]);
				};
				Doptions = {
				  title: 'Direct Download : '+(NB_C>=0?NB_C:0)+' circuits',
				  hAxis: {title: 'Time',  titleTextStyle: {color: 'green'},textStyle: {fontSize:10}, viewWindow: {min:Ddata.getValue(5,0),max:Ddata.getValue(64,0)}},
				  vAxis: {title: 'Bytes',  titleTextStyle: {color: 'green'},textStyle: {fontSize:10},minValue:0,maxValue:1000},
				  colors:['green','yellow']
				};
				Dchart=new google.visualization.LineChart($_('chart1'));
				Dchart.index=null;
				Dchart.dynRow={};
				Dchart.dynRow2={};
				Dchart.draw(Ddata,Doptions);
			};
			var ini_peer_chart=function() {
				Pdata = new google.visualization.DataTable();
				Pdata.addColumn('datetime','Time');
				Pdata.addColumn('number','Received (KB)');
				Pdata.addColumn('number','Sent (KB)');
				var date=new Date();
				for (var i=70;i>0;i--) {
					var tmp=new Date();
					tmp.setTime(date.getTime()-1000*i);
					Pdata.addRow([tmp,0,0]);
				};
				Poptions = {
				  title: 'Peer to peer',
				  hAxis: {title: 'Time',  titleTextStyle: {color: 'green'},textStyle: {fontSize:10},viewWindow: {min:Pdata.getValue(5,0),max:Pdata.getValue(64,0)}},
				  vAxis: {title: 'Bytes',  titleTextStyle: {color: 'green'},textStyle: {fontSize:10},minValue:0,maxValue:1000},
				  colors:['red','orange']
				};
				Pchart=new google.visualization.LineChart($_('chart2'));
				Pchart.index=null;
				Pchart.dynRow={};
				Pchart.dynRow2={};
				Pchart.draw(Pdata,Poptions);
			};
			var redraw_chart=function(chart,data,options) {
				var n=5;
				var date0=DateRound(data.getValue(69,0)).getTime();
				for (var i=0;i<n;i++) {
					var date=new Date();
					date.setTime(date0+(i+1)*1000);
					data.removeRow(0);
					data.addRow([date,(chart.dynRow[date.getTime()])||0,(chart.dynRow2[date.getTime()])||0]);
					delete chart.dynRow[date.getTime()];
					delete chart.dynRow2[date.getTime()];
				};
				if (options.title.indexOf('Direct')!==-1) {
					options.title='Direct Download : '+(NB_C>=0?NB_C:0)+(NB_C>1?' circuits':' circuit');
				};
				if (options.title.indexOf('Peer')!==-1) {
					options.title='Peer to Peer : '+(db_cid?1:0)+' circuit';
				};
				options.hAxis.viewWindow.min = data.getValue(n,0);
				options.hAxis.viewWindow.max = data.getValue(64,0);
				options.hAxis.viewWindowMode = 'explicit';
				options.animation={duration: 4000,easing: 'linear'};
				//options.curveType='function';
				//options.smoothLine=true;
				//google.visualization.events.addListener(chart1, 'animationfinish', function() {setTimeout(scr,5000)});
				chart.draw(data,options);
			};
			var div=$_('input');
			var input=document.createElement('input');
			input.id='url';
			input.value='Enter_url_or_hash_name_or_magnet_link_or_infohash';
			div.appendChild(input);
			example=input.value;
			input.onkeydown = function(xevent) {
				addEvent(document.body,'mousedown',function() {},false); //pb click not detected
				if ((detkey.call(this,xevent||window.event))&&(this.value!=='')) {
					addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
					load(this.value);
				};
			};

			var button=$_('ok');
			addEvent(button,'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble = true;addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);load(input.value)},false);

			var buttonstream=$_('stream');
			addEvent(buttonstream,'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble = true;addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);load(input.value.trim(),true)},false);
			//input.onmousedown=function() {
			//	if (this.value===example) {
			//		this.value='';
			//	};
			//};

			open_db=function() {
				var db=peersmDB.db;
				return db.transaction([peersmcode],'readwrite').objectStore(peersmcode);
			};
			open_db2=function() {
				var db=peersmDB.db;
				return db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
			};
			var rand_hash=function() {
				var H=crypto.createhash('sha1');
				H.update(new Buffer((Date.now()).toString()+peersmcode,'utf8'));
				return H.digest('hex');
			};
			var remove_ext=function(name) {
				name=name.split('.');
				if (name.length>1) {
					if (name[name.length-1]===ENC_EXT) {
						name.pop();
					};
				};
				return name.join('.');
			};
			var add_thumb=function(request) {
				setTimeout(function() {$_('alert_box').style.display='none'},10000);
				var old=$_(request.hash_ini);
				request.thumb2_=thumb(request,request.hash_ini);
				if (old) {
					$_('local').insertBefore(request.thumb2_,old);
				} else {
					$_('local').appendChild(request.thumb2_);
				};
				if (request.d_length!==request.clength_) {
					request.thumb2_.firstChild.style.backgroundColor='orange';
					if (request.thumb_) {
						request.thumb_.firstChild.style.backgroundColor='orange';
					};
				};
				addEvent(request.thumb2_,'mousedown',show_menu2.bind({file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb2_:request.thumb2_,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,content_chrome:request.content_chrome,blob_:request.blob_}),false);
				remove(old);
			};
			var add_thumb_=function(request) {
				var old=request.thumb_;
				request.thumb_=thumb(request);
				if (old) {
					if (old.parentNode) {
						$_('downloaded').insertBefore(request.thumb_,old);
						remove(old);
					} else {
						$_('downloaded').appendChild(request.thumb_);
					};
				} else {
					$_('downloaded').appendChild(request.thumb_);
				};
				addEvent(request.thumb_,'mousedown',show_menu.bind(request),false);
			};
			var process_upload=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				remove(mediaSrc);
				remove(divMedia);
				addEvent(document.body,'mousedown',function() {},false);
				Myalert("<p style='text-align:center'>Uploading file from your disk to your browser storage...please wait until the file appears in the Local files box, this can take some time depending on the size of the file</p>");
				$_('progress-alert').style.display='block';
				$_('progint-alert').style.width='0%';
				var file=this.files[0];
				var file_enc=[];
				var request={};
				var h=file.name.split('#');
				if (h.length>1) {
					var tmp=h[1].split('.');
					request.name_=h[0]+(tmp.length>1?('.'+tmp[1]):'');
				} else {
					request.name_=file.name;
				};
				request.blob_=chrome?(new Buffer(0)):file;
				request.content_=file.type;
				request.clength_=file.size;
				request.d_length=file.size;
				request.url_='';
				request.queue_=[];
				if (h.length>1) {
					request.hash_ini=h[1].split('.')[0];
				} else {
					request.hash_ini=rand_hash();
				};
				var size=file.size;
				var tsize=0;
				var worker=new Worker(URL.createObjectURL(new Blob([workerjs],{type:'text/javascript'}))); //TODO replace by webcrypto hash
				worker.onmessage=function(evt) {
					var data=evt.data;
					var res=data.pop?(chrome?(new Buffer(0)):0):data;
					tsize +=chrome?res.length:parseInt(res);
					var l=tsize;
					if (chrome) {
						file_enc.push(res);
						if ((tsize%DB_BLOCK===0)||(tsize===size)) {
							var buff=file_enc;
							var execute=function() {
								//console.log(l+' '+data.pop);
								$_('progint-alert').style.width=parseInt(100*l/size)+'%';
								if (!data.pop) {
									request.file_hash='00';
									request.d_length=tsize;
									store_DB2(request,buff);
								} else {
									request.check_hash=true;
									request.file_hash=data[0];
									addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
									$_('progress-alert').style.display='none';
									console.log('uploaded '+request.file_hash);
									store_DB(request,true);
								};
							};
							file_enc=[];
							request.queue_.push(execute);
							if (request.queue_.length===1) {
								request.queue_[0]();
							};
						};
					} else {
						//console.log(l+' '+data.pop);
						$_('progint-alert').style.width=parseInt(100*l/size)+'%';
						if (evt.data.pop) {
							request.check_hash=true;
							request.file_hash=evt.data[0];
							$_('progress-alert').style.display='none';
							console.log('uploaded '+request.file_hash);
							store_DB(request,true);
							//add_thumb(request);
						};
					};
				};
				worker.postMessage([chrome?'hashc':'hash',file]);
					/*
					var res=new Uint8Array(reader.result);
					var H_=function() {
						var hash=forge.sha1.create();
						var oupdate=hash.update;
						hash.update=function(data) {
							return oupdate(data.toString("binary"));
						};
						hash.digest=function() {
							return hash.digest().toHex();
						};
						return hash;
					};
					alert('0');
					var BL=512;
					var n=0;
					var H=crypto.createhash('sha1');
					while(res.length&&n<100) {
						//console.log(n);
						H.update(res.subarray(0,BL));
						res=res.subarray(Math.min(res.length,BL));
						n++;
					};
					alert('a');
					alert(H.digest());
					*/

				//};
				//addEvent(reader,"loadend",readed,false);
				//reader.readAsArrayBuffer(file);
			};
			//var upload=$_('upload');
			var file_upload=$_('file_upload');
			addEvent(file_upload,'change',process_upload,false);
			progress_bar=function(cont,request) {
				var l=request.d_length||0;
				var t=request.clength_||0;
				var p=0;
				if (t) {
					p=parseInt((l/t)*100);
				};
				var a=document.createElement('div');
				a.className='progress';
				var d=document.createElement('p');
				d.className='bar';
				d.innerHTML=PROGTXT+p+'%'
				var b=document.createElement('div');
				b.className='progcont';
				var c=document.createElement('div');
				c.className='progint';
				c.style.width=p+'%';
				b.appendChild(c);
				a.appendChild(d);
				a.appendChild(b);
				cont.appendChild(a)
				a.progtxt=d;
				a.progbar=c;
				addEvent(a,'mousedown',stop_.bind(request),false);
				return a;
			};
			var thumb=function(request,id) {
				var name=request.name_||request.name;
				var file=request.blob_||request.data||(new Blob([]));
				var ext=get_extension(name);
				var type=file.type||request.content_chrome||request.content_||request.type;
				var url=file_extension[ext]?(file_extension[ext]):(((ext_img.indexOf(ext)!==-1)&&(type.indexOf('image')!==-1))?URL.createObjectURL(file):file_extension['exe']);
				var t=document.createElement('div');
				t.className='thumbwrap';
				if (id) {
					t.id=id;
				};
				var th=document.createElement('div');
				th.className='thumb';
				var i=document.createElement('img');
				i.className='thumbimg';
				i.src=url;
				var u=document.createElement('div');
				u.align='center';
				var s=document.createElement('span');
				s.className='thumbspan';
				s.innerHTML=name;
				th.appendChild(i);
				t.appendChild(th);
				u.appendChild(s);
				t.appendChild(u);
				return t;
			};
			var compute_hash=function(request,data) {
				console.log('compute hash');
				request.file_hash=0;
				addEvent(document.body,'mousedown',function() {},false);
				Myalert("<p style='text-align:center'>Calculating hash for a resumed file, please wait...</p>");
				$_('progress-alert').style.display='block';
				$_('progint-alert').style.width='0%';
				var blob=request.blob_;
				var worker=new Worker(URL.createObjectURL(new Blob([workerjs],{type:'text/javascript'})));
				var size=blob.size;
				var tsize=0;
				worker.onmessage=function(evt) {
					var res=evt.data.pop?0:parseInt(evt.data);
					tsize +=res;
					$_('progint-alert').style.width=parseInt(100*tsize/size)+'%';
					if (evt.data.pop) {
						$_('progress-alert').style.display='none';
						setTimeout(function() {$_('alert_box').style.display='none'},10000);
						request.file_hash=evt.data[0];
						var fin=function() {
							add_thumb_(request);
							add_thumb(request);
							store_DB_final(request,data);
						};
						request.queue_.push(fin);
						addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
						if (request.queue_.length===1) {
							request.queue_[0]();
						};
					};
				};
				worker.postMessage(['hash',blob]);
			};
			store_DB=function(request,boo,cb) {
				console.log('store_DB ');
				addEvent(document.body,'mousedown',function() {},false);
				if ((request.nb_try!==DB_NB_TRY)&&(!request.reason_)) {
					Myalert("<p style='text-align:center'>Storing file, please wait that the file appears in Local Files (for large files this can take some time)</p>");
				};
				peersmDB.store=function () {
					var t0;
					var data;
					var arr=chrome?[]:null;
					var i=0;
					var chunkStore=open_db2();
					request.file_id=request.file_id||0;
					var a=chunkStore.get([request.file_id,i]);
					var type=(request.blob_ instanceof Uint8Array)?(request.content_chrome?request.content_chrome:request.content_):request.blob_.type;
					var blob=new Blob([],{type:type});
					if (STORE_PERF) {
						var t0=Date.now();
					};
					a.onsuccess=function(evt) {
						var res=evt.target.result;
						if (res) {
							//console.log(i+' '+(res.data.length||res.data.size));
							var data=res.data;
							if (!(data instanceof Array)) {
								blob=new Blob([blob,data],{type:type});
							} else {
								data.unshift(blob);
								blob=new Blob(data,{type:type});
							};
							if (chrome) {
								if (data instanceof Array) {
									data.shift();
									arr=arr.concat(data);
								} else {
									arr.push(data);
								};
							};
							chunkStore.delete([request.file_id,i]);
							i++;
							//var b=this.onsuccess;
							a=chunkStore.get([request.file_id,i]);
							a.onsuccess=this.onsuccess;
						} else {
							console.log('Saving chunks size '+blob.size+(t0?(' time to read all chunks '+(Date.now()-t0)):''));
							if (chrome) {
								if (request.blob_ instanceof Array) {
									arr=arr.concat(request.blob_);
								} else {
									arr.push(request.blob_);
								};
							};
							request.blob_=new Blob([blob,request.blob_],{type:type});
							var objectStore=open_db();
							var a=objectStore.get(request.hash_ini);
							console.log('store_DB open');
							var tmp=Date.now();
							a.onsuccess=function(evt) {
								console.log('store_DB success '+(Date.now()-tmp));
								var result=evt.target.result;
								if (result) {
									remove($_(result.name_hash));
									if (!chrome) {
										data=new Blob([result.data,request.blob_],{type:type});
										request.blob_=data;
									} else {
										data=result.data.concat(arr);
										request.blob_=new Blob(data,{type:(request.content_chrome?request.content_chrome:request.content_)});
									};
								} else {
									data=chrome?arr:request.blob_;
								};
								if (!request.name_) {
									var t=request.blob_.type||(request.content_chrome?request.content_chrome:request.content_);
									request.name_=request.hash_ini.substr(0,8);
									if (t!==request.content_) {
										request.name_=request.name_+'.'+ENC_EXT;
									};
								};
								request.file_hash=request.file_hash||0;
								request.d_length=request.blob_.size;
								if (!boo) {
									add_thumb_(request);
								};
								if (!cb) {
									add_thumb(request);
								};
								if ((!request.check_hash)&&(request.clength_===request.d_length)) {
									compute_hash(request,data);
								} else {
									store_DB_final(request,data,cb);
								};
								console.log('Chunks saved '+(Date.now()-tmp));
								$_('alert_box').style.display='none';
								addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
							};
						};
					};
				};
				peersmDB.store();
			};
			var store_DB_final=function(request,data,cb) {
				request.file_hash=request.file_hash||0;
				var objectStore=open_db();
				if (!chrome) {
					objectStore.put({hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data});
				} else {
					objectStore.put({hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data,enc:request.content_chrome||''});
				};
				if (cb) {
					cb(request);
				} else {
					if (request.d_length===request.clength_) {
						if (db_cid) {
							db_cid.send_db_info();
						};
					};
					delete_request(request);
				};
			};
			var store_DB2=function(request,data) {
				//data: Blob if not chrome, Uint8Array if chrome
				if (DB_PERF) {
					var t0=Date.now();
				};
				var db=peersmDB.db;
				var tx=db.transaction([peersmcode+'_'],'readwrite');
				var objectStore=tx.objectStore(peersmcode+'_');
				if (!request.name_) {
					var type=request.blob_.type||(request.content_chrome?request.content_chrome:request.content_);
					request.name_=request.hash_ini.substr(0,8);
					if (type!==request.content_) {
						request.name_=request.name_+'.'+ENC_EXT;
					};
				};
				if (!request.file_id) {
					request.file_id=Date.now();
					request.chunk_nb=0;
				} else {
					request.chunk_nb++;
				};
				//{hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data}
				objectStore.put({k:[request.file_id,request.chunk_nb],file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,content_:request.content_,clength_:request.clength_,d_length:request.d_length,url_:request.url_,key:(request.key?request.key:''),data:data});
				//tx.oncomplete=function() {
					if (t0) {
						console.log('db_perf '+(Date.now()-t0));
					};
					var queue=request.queue_;
					queue.shift();
					if (queue.length) {
						queue[0]();
					};
				//};
			};
			var moof_parser=function(buff,request) {
			//aabbccdd6d6f6f66000000006d 6f6f66000000006d6f 6f66
				buff=request.append_wait.length?([request.append_wait,buff].concatBuffers()):buff;
				request.append_wait=new Buffer(0);
				var tmp=buff.toString('hex');
				tmp=tmp.split('6d6f6f66');
				var l=tmp.length;
				for (var i=0;i<l;i++) {
					var sbuff=new Buffer(tmp[i],'hex');
					if (i!==l-1) {
						if (sbuff.length>=4) {
							request.stream_buffer.push(sbuff.slice(0,sbuff.length-4));
						} else {
							console.log('bad formatted mp4');
						};
						request.append_buffer.push(request.stream_buffer.concatBuffers());
						request.stream_buffer=[];
					} else {
						if (sbuff.length>4) {
							if (sbuff[sbuff.length-1]===0x6d) {
								request.append_wait=sbuff;
							};
							if (sbuff.length>5) {
								if ((sbuff[sbuff.length-2]===0x6d)&&(sbuff[sbuff.length-1]===0x6f)) {
									request.append_wait=sbuff;
								};
							};
							if(sbuff.length>6) {
								if ((sbuff[sbuff.length-3]===0x6d)&&(sbuff[sbuff.length-2]===0x6f)&&(sbuff[sbuff.length-1]===0x6f)) {
									request.append_wait=sbuff;
								};
							};
						};
						if (!request.append_wait.length) {
							request.stream_buffer.push(sbuff);
						};
					};
				};
			};

			/*
			var test=new Buffer('cc','hex');
			var test1=new Buffer('aaaaaaaaaa6d6f6f66bbbbbbbbbb6d6f6f6600000000006d','hex');
			var test2=new Buffer('6f6f6611111111116d6f','hex');
			var test3=new Buffer('6f6622222222226d6f6f','hex');
			var test4=new Buffer('6633','hex');
			var test5=new Buffer('44','hex');
			var request={};
			request.append_buffer=[];
			request.stream_buffer=[];
			request.append_wait=new Buffer(0);
			moof_parser(test,request);
			moof_parser(test1,request);
			moof_parser(test2,request);
			moof_parser(test3,request);
			moof_parser(test4,request);
			moof_parser(test5,request);
			alert(request.append_buffer[0].toString('hex')); //ccaa
			alert(request.append_buffer[1].toString('hex')); //bb
			alert(request.append_buffer[2].toString('hex')); //00
			alert(request.append_buffer[3].toString('hex')); //11
			alert(request.append_buffer[4].toString('hex')); //22
			alert(request.append_buffer[5].toString('hex')); //33
			*/

			duration=function(t) {
				//PT0H2M19.29S
				console.log('duration: '+t);
				var hour=t.split('PT');
				var mn=hour[1].split('H');
				var s=parseFloat(mn[1].split('M')[1].split('S')[0]);
				hour=hour[1].split('H')[0];
				mn=mn[1].split('M')[0];
				return hour*3600+mn*60+s;
			};
			var addsourcebuffer=function() {
				try {
					console;log('addsourcebuffer '+this._stream_.readyState);
					this._source_=this._stream_.addSourceBuffer(this.mime_codec);
				} catch(ee) {
					console.log('wait open addsourcebuffer failed');
				};
			};
			var appendbuffer=function(request,val) {
				if (request.received_===val) {
					$_('alert_box').style.display='none';
					request._source_.addEventListener('updateend',function() {
						updateend(request);
					});
					updateend(request);
				} else if (request.received_>val) {
					if (request.append_cursor===0) {
						request.wait_chunk=true;
					};
					if (request.wait_chunk) {
						var seg=Math.min(Math.ceil((request.clength_-request.d_length)/BSIZE),VIDEO_APPEND/4);
						request.append_cursor++;
						if (request.append_cursor>=seg) {
							delete request.wait_chunk;
							//console.log('updateend called '+request._source_.updating);
							updateend(request);
						};
					};
				};
			};
			var load_Blob=function(buff,request) {
				//console.log(buff.toString('hex'));
				if ((request._stream_)&&(!request._streaming_)) { //_streaming_ --> non json file
					request.d_length +=buff.length;
					request._json_+=buff.toString('utf8');
					if (request.d_length>=request.clength_) {
						console.log('json '+request._json_);
						try {
							var mpd=JSON.parse(request._json_);
						} catch(ee) {
							console.log('wrong json file, retrying');
							request=init_d_request(request.hash_ini,null,true);
							Tor(request);
							return;
						};
						for (var n in mpd) {
							if (n!=='Duration') {
								var request_stream=init_d_request(mpd[n].Representation.BaseURL,null,true);
								request.nb_sources.push(request_stream);
								request_stream._streaming_=true;
								request_stream.mime_codec=mpd[n].Representation.mimeType+'; codecs="'+mpd[n].Representation.codecs+'"';
								request_stream._stream_=request._stream_;
								request_stream._parent_=request;
								request_stream._bandwidth_=mpd[n].Representation.bandwidth;
								request_stream._width_=mpd[n].Representation.width;
								request_stream._height_=mpd[n].Representation.height;
								if (request._stream_.readyState==='open') {
									try {
										request_stream._source_=request._stream_.addSourceBuffer(request_stream.mime_codec);
									} catch(ee) {
										console.log('addsourcebuffer failed');
										request._wait_open.push(addsourcebuffer.bind(request_stream));
									};
								} else {
									request._wait_open.push(addsourcebuffer.bind(request_stream));
								};
								Tor(request_stream);
							} else {
								retry_media=function() {
									var dur=mpd[n];
									if (request._stream_.readyState==='open') {
										request._stream_.duration=duration(dur);
									} else {
										console.log('media stream not ready yet - retry later');
										setTimeout(retry_media,500);
									};
								};
								retry_media();
							};
						};
						console.log('Queue fin json '+request.d_length+' '+request.clength_+' '+(parseInt((8*BSIZE*request.received_/((Date.now()-request.start_t0)/1000)))+' bps '));
						clearTimers(request.sendme_tout);
						clearTimers(request.waiting_);
						request.eof_=true;
						fin_.call(request);
					};
				} else if (request._streaming_) {
				//moof 6D6F6F66
					request.d_length +=buff.length;
					//if (!request.mp4box) {
						request.append_buffer.push(buff);
					//};
					//moof_parser(buff,request);
					//console.log(buff.toString('utf8'));

					if (request._source_) {
					/*
						if (!request._source_.updating) {
							try {
								if (request.append_cursor===request.received_-1) {
									request.append_cursor++;
									console.log('appending queue cursor '+request.append_cursor);
									request._source_.appendBuffer(request.append_buffer.shift());
								};
							} catch(ee) {
								request.append_buffer.unshift(buff);
								console.log('error appendbuffer');
							}
						};
					*/
					/*
						if (request.received_===Math.min(VIDEO_APPEND,request.pieces)) {
							//console.log('appending first '+request.append_buffer[0].toString('hex'));
							request.append_cursor++;
							$_('alert_box').style.display='none';
							try {
								request._source_.appendBuffer(request.append_buffer.shift());
							} catch(ee) {
								console.log('error first append');
							};
							request._source_.addEventListener('updateend',function() {
								if (request.append_buffer.length) {
									//console.log('appending '+request.append_buffer[0].length);
									request.append_cursor++;
									if (request.append_cursor<705) {
										//console.log('appending '+request.append_cursor+' '+request.append_buffer[0].toString('hex'));
									};
									try {
										clearTimers(request.append_to);
										var chunk=request.append_buffer.shift();
										request.debug_chunk.push(chunk);
										request._source_.appendBuffer(chunk);
									} catch(ee) {
										console.log('error updateend');
										console.log(request.debug_chunk[request.debug_chunk.length-1].toString('hex'));
										console.log(request.debug_chunk[request.debug_chunk.length-2].toString('hex'));
										console.log(request.debug_chunk[request.debug_chunk.length-3].toString('hex'));
									};
								} else {
									if ((request.append_cursor<=request.received_)&&(request.append_cursor<request.pieces)) {
										request.append_to.push(setTimeout(function() {
											//console.log('appending null '+' length '+request.append_buffer.length+' cursor '+request.append_cursor+' received '+request.received_+' pieces '+request.pieces+' '+request._source_.updating);
												request.append_to.shift();
												//console.log(request.append_to.length+' '+request._source_.updating);
												if (request.append_buffer.length) {
													var chunk=request.append_buffer.shift();
													request.debug_chunk.push(chunk);
													try {
														request._source_.appendBuffer(chunk);
													} catch(ee) {
														console.log('error append null not null');
													}
												} else {
													try {
														request._source_.appendBuffer(new Buffer(0));
													} catch (ee) {
														console.log('error append null');
													};
												};
										},100));
										//request._source_.appendBuffer(request.append_buffer.shift());
									};
								};
							});
						};*/
						appendbuffer(request,Math.min(VIDEO_APPEND,request.pieces));
					} else {
						if (request.mp4box) {
							var l=request.append_buffer.length;
							if ((l>=MP4BOX_APPEND)||(request.d_length>=request.clength_)) {
								if ((!request._moov_)||(request._moov_===MOOV)) {
									if (request._moov_) {
										if (!request.mp4box.inputIsoFile) {
											request.mp4box.inputIsoFile=new ISOFile();
										};
										if (request._parent_.mp4box.inputIsoFile) {
											request.mp4box.inputIsoFile.ftyp=request._parent_.mp4box.inputIsoFile.ftyp;
										} else {
											setTimeout(function() {load_Blob(new Buffer(0),request)},1000);
										};
									};

									var chunk=request.append_buffer.concatBuffers();
									for (var i=0;i<l;i++) {
										request.append_buffer.shift();
									};
									if (request._moov_) {
										console.log('appending moov mp4box length '+chunk.length)
									};
									//var chunk=request.append_buffer.shift();
									//console.log('mp4box append '+chunk.length+' Bytes');
									//console.log(chunk.toString('hex'));
									chunk.buffer.fileStart=request.mp4box._fileStart_||0;
									//console.log('chunk fileStart '+chunk.buffer.fileStart);
									request.mp4box._fileStart_ +=chunk.length;
									request.mp4box.appendBuffer(chunk.buffer);
								};
							};
							if ((request._moov_)&&(request._moov_!==MOOV)) {
								if (request._moov_===true) {
									request._moov_=buff.toString('hex');
								} else {
									request._moov_+=buff.toString('hex');
								};
								if (request._moov_.indexOf(MOOV)!==-1) {
									console.log('moov found');
									var moov=request._moov_.split(MOOV);
									var size=moov[0];
									var rest=moov[1];
									size=size.substr(size.length-8,size.length);
									console.log('moov size '+size+' rest '+rest.length);
									request._moov_=MOOV;
									request.append_buffer=[];
									request.append_buffer.push(new Buffer(size+MOOV+rest,'hex'));
								};
							};
						};
					};
					if (request.d_length>=request.clength_) {
						console.log('Queue fin streaming '+request.d_length+' '+request.clength_+' '+(parseInt((8*BSIZE*request.received_/((Date.now()-request.start_t0)/1000)))+' bps '));
						console.log('queue length '+request.append_buffer.length+' cursor '+request.append_cursor+' received '+request.received_);
						clearTimers(request.sendme_tout);
						clearTimers(request.waiting_);
						request.eof_=true;
						if (request.mp4box) {
							request.mp4box.flush();
						};
						fin_.call(request);
					};
				} else {
					if (!request.eof_) {
						var process=function(data) {
							return function() {
								request.d_length +=data.length;
								if (!request.blob_) {
									request.content_=request.content_||'application/octet-binary';
									var enc=request.content_.split(';');
									if (enc.length>1) {
										request.content_=enc[0]; //real type
										request.content_chrome=enc[1]||'application/octet-binary'; //save info encrypted
									};
									request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
									if ((!request.reload2_)&&(!request.reload_)) {
										request.check_hash=new Hash('sha1');
										var objectStore=open_db();
										objectStore.delete(request.hash_ini);
									};
									if (!request.clength_) {
										remove(request.bar_);
									};
								};
								if (chrome) {
									request.blob_=request.blob_.length?[request.blob_,data].concatBuffers():data;
								} else {
									request.blob_=new Blob([request.blob_,data],{type:(request.content_chrome?request.content_chrome:request.content_)});
								};
								if (request.check_hash) {
									request.check_hash.update(data);
								};
								if (request.clength_) {
									var size=request.blob_.size||request.blob_.length||request.blob_.byteLength;
									if ((size>=FILE_BLOCK)&&(request.d_length<request.clength_)) {
										request.queue_=request.queue_||[];
										var execute=function(data) {
											return function() {
												store_DB2(request,data);
											};
										};
										request.queue_.push(execute(request.blob_));
										//console.log('before db '+(request.blob_.size||request.blob_.length||request.blob_.byteLength)+' '+request.d_length);
										request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
										if (request.queue_.length===1) {
											request.queue_[0]();
										};
									} else {
										if (request.d_length>=request.clength_) {
											console.log('Queue fin '+request.d_length+' '+request.clength_+' '+(parseInt((8*BSIZE*request.received_/((Date.now()-request.start_t0)/1000)))+' bps ')+(request.blob_.size||request.blob_.length||request.blob_.byteLength));
											clearTimers(request.sendme_tout);
											clearTimers(request.waiting_);
											request.eof_=true;
											request.queue_.push(fin_.bind(request));
											if (request.queue_.length===1) {
												request.queue_[0]();
											};
										};
									};
									if (request.clength_||(request.d_length>=request.clength_)) {
										var prog=parseInt((request.d_length/request.clength_)*100);
										//request.bar_.progtxt.innerHTML=PROGTXT+prog+'%';
										request.bar_.progtxt.innerHTML=PROGTXT+parseInt(request.d_length/1000)+' kB';
										request.bar_.progbar.style.width=prog+'%';
									};
									request.queue_s.shift();
									if (request.queue_s.length) {
										request.queue_s[0]();
									};
								};
							};
						};
						request.queue_s=request.queue_s||[];
						request.queue_s.push(process(buff));
						if (request.queue_s.length===1) {
							request.queue_s[0]();
						};
					} else {
						console.log('EOF');
					};
				};
			};
			remove=function(obj) {
				if (obj) {
					if (obj.parentNode) {
						obj.parentNode.removeChild(obj);
					};
				};
			};
			fin_=function() {
				console.log('execute fin');
				this.eof_=true;
				this.queue_=[];
				this.queue_s=[];
				if (this.cid_) {
					if (this.cid_===db_cid) {
						console.log('sending db_end CIC '+this.cid_.circId+' sid '+this.sid_);
						this.cid_.send_db_end(1,this.sid_);
					} else {
						if (this.d_length<this.clength_) {
							this.cid_.send_relay_end(this.sid_);
						};
					};
					this.cid_.destroy_cid(this);
				};
				if (!this._stream_) {
					load_Blob_Url(this);
				} else {
					clearTimeout(this._torrentc_);
					isStreaming=false;
				};
			};
			stop_=function() {
				hide_menu('menu');
				//console.log('stopping '+this.eof);
				if (!this.eof) {
					this.nb_try=DB_NB_TRY+1;
					clearTimers(this.query_t0);
					clearTimers(this.sendme_tout);
					clearTimers(this.waiting_);
					clearTimeout(this.mp4box_t0);
					//console.log(this.cid_);
					this.pieces=0; //stop updateend
					if (this.cid_) {
						if (this.cid_===db_cid) {
							this.cid_.send_db_end(1,this.sid_);
						} else {
							if (this.d_length<this.clength_) {
								this.cid_.send_relay_end(this.sid_);
							};
						};
						this.cid_.destroy_cid(this);
					};
					this.eof_=true;
					this.queue_=this.queue_||[];
					if (!this._stream_) {
						this.queue_.push(fin_.bind(this));
						setTimeout(function() {Myalert("<p style='text-align:center'>Stopping download, please wait that pending data are processed, use resume to restart</p>")},500);
					} else {
						console.log('stop streaming');
						//setTimeout(function() {Myalert("<p style='text-align:center'>Streaming stopped</p>")},500);
						//remove(divMedia);
						//remove(mediaSrc);
						fin_.call(this);
					};
					if (this.queue_.length===1) {
						this.queue_[0]();
					};
				};
			};
			var stop_media=function(request,error) {
				Myalert('<p style="text-align:center"> Error: '+error+' - This media can not be streamed, please use Download</p>');
				remove(divMedia);
				remove(mediaSrc);
				stop_.call(request);
			};
			init_media=function(request) {
				var type=request.content_;
				console.log('init_media '+type);
				if ((type.indexOf('json')!==-1)||(((type.indexOf('video')!==-1)||(type.indexOf('audio')!==-1)||(type.indexOf('binary')!==-1))&&(!request._streaming_))) {
					remove(mediaSrc);
					mediaSrc=document.createElement('video');
					mediaSrc.className='mediasrc';
					//mediaSrc.autoplay=true;
					mediaSrc.controls=true;
					request._stream_=new Media();
					mediaSrc.src=URL.createObjectURL(request._stream_);
					mediaSrc._stream_=request._stream_;
					divMedia.appendChild(mediaSrc);
					addEvent(closebox,'mousedown',function(){remove(divMedia);remove(mediaSrc);request.nb_sources.forEach(function(req) {stop_.call(req)});stop_.call(request)},true);
					if (type.indexOf('json')===-1) {
						request._streaming_=true; //don't miss first chunks
					};
					var addsource=function(e) {
						if (type.indexOf('json')===-1) {
							if (type.indexOf('webm')!==-1) {
								request.nb_sources=[];
								request._streaming_=true;
								request._source_=request._stream_.addSourceBuffer('video/webm; codecs="vp8,vorbis"');
								//request._source_.addEventListener('error',function() {Myalert('<p style="text-align:center">This source can not be streamed or something unexpected happened, please retry</p>');stop_.call(request);try {request._stream_.endOfStream();} catch(ee) {}});
								console.log('play media video/webm; codecs="vp8,vorbis"');
								Myalert('<p style="text-align:center">Connected... the video is going to start, please wait</p>');
								mediaSrc.play();
							//} else if (type.indexOf('mp4')!==-1) {
							} else {
								if (!request.mime_codec) { //json parsed, file codec known
									//alert('source open');
									request.nb_sources=[];
									request._streaming_=true;
									request.mp4box=new MP4Box();
									Myalert('<p style="text-align:center">Connected... Analyzing if this video can be streamed, please wait</p>');
									//request.mp4box_t0=setTimeout(function() {stop_media(request,'mp4box timeout')},MP4BOX_TO);//remettre
									/*
									var request_moov=init_d_request(request.hash_ini,null,true);
									request_moov._moov_=true;
									request_moov._streaming_=true;
									request_moov.d_length=request.clength_-FIND_MOOV;
									request_moov._parent_=request;
									request_moov.mp4box=new MP4Box();
									request_moov.mp4box.onReady=function(info) {
										console.log('moov ready');
										request.mp4box.inputIsoFile.moov=this.inputIsoFile.moov;
										//alert(this.inputIsoFile.moov.boxes.length);
										//alert(request.mp4box.inputIsoFile.boxes.length);
										if (!request.mp4box.sampleListBuilt) {
											request.mp4box.inputIsoFile.buildSampleLists();
											request.mp4box.sampleListBuilt=true;
										}
										request.mp4box.inputIsoFile.updateSampleLists();
										request.mp4box.readySent=true;
										request.mp4box.onReady(info);
										request.mp4box.processSamples();
										delete request_moov.mp4box;
										//close moov mp4box
									};
									Tor(request_moov);
									*/
									request.mp4box._fileStart_=0;
									request.mp4box.onMoovStart=function () {
										console.log('moov start');
										Myalert('<p style="text-align:center">The video is going to start, please wait</p>');
									};
									request.mp4box.onReady=function(info) {
										//alert(this.inputIsoFile.moov.boxes.length);
										//alert(this.inputIsoFile.boxes.length);
										clearTimeout(request.mp4box_t0);
										if (request._moov_) {
											stop_.call(request._moov_);
											delete request_moov.mp4box;
										};
										console.log('play media mp4box ready');
										//Myalert('<p style="text-align:center">The video is going to start, please wait</p>');
										mediaSrc.play();
										//if (!info.isFragmented) {
											if (info.tracks) {
												while (info.tracks.length) {
													var subinfo=info.tracks.shift();
													if (subinfo) {
														var mime='video/mp4; codecs=" '+subinfo.codec+'"';
														console.log('mp4box mime: '+mime);
														console.log(JSON.stringify(subinfo));
														var supported=false;
														if (Media.isTypeSupported(mime)) {
															supported=true;
															var request_stream={append_buffer:[]};
															request_stream._stream_=request._stream_;
															request_stream._source_=request._stream_.addSourceBuffer(mime);
															request_stream._source_.request=request_stream;
															request_stream.pieces=request.pieces;
															request_stream.mp4box=true;
															request_stream.track=subinfo.id;
															request_stream.received_=0;
															request_stream.append_cursor=0;
															request_stream.clength_=request.clength_;
															request_stream.d_length_=0;
															//var seg=3; //TODO - calculate
															if (MP4BOX_PERF) {
																var t0=Date.now();
															};
															request.mp4box.onSegment=function(id,req,buffer) {
																//console.log('onsegment '+req.append_buffer.length
																buffer=new Uint8Array(buffer);
																req.received_++;
																if (t0) {
																	count_mp4box++;
																	count_mp4box_data +=buffer.length;
																	time_mp4box_data +=Date.now()-t0;
																	if (count_mp4box%PERF_MP4BOX===0) {
																		if (time_mp4box_data) {
																			console.log('MP4BOX perf track '+req.track+':'+parseInt(count_mp4box_data*8/(time_mp4box_data/1000))+' bps - received from mp4box'+count_mp4box_data+' Bytes since '+parseInt(time_mp4box_data/1000)+' s');
																			count_mp4box=0;
																		};
																	};
																};
																//console.log('onsegment '+buffer.length+' '+buffer.toString('hex').substr(0,100));
																//console.log('onsegment track '+req.track+' '+buffer.length+' '+buffer.toString('utf8').substr(0,100));
																//req.d_length +=buffer.length;
																req.append_buffer.push(buffer);
																//appendbuffer(req,seg);
																if (req._init_) {
																	if (req.received_===1) {
																		$_('alert_box').style.display='none';
																		req._source_.addEventListener('updateend',function() {
																			updateend(req);
																		});
																	};
																	updateend(req);
																} else {
																	req.wait_init=true;
																};
															};
															var nbSamples;
															if (subinfo.video) {
																var sample_size=parseInt(request.clength_/subinfo.nb_samples);
																nbSamples=Math.ceil(MP4BOX_SAMPLE/sample_size);
															} else {
																nbSamples=1000;
															};
															console.log('nbsamples for track '+subinfo.id+' '+nbSamples);
															request.mp4box.setSegmentOptions(subinfo.id,request_stream,{nbSamples:nbSamples});
															//request.mp4box.setSegmentOptions(subinfo.id,request_stream);
														};
														if (!supported) {
															console.log(subinfo.codec+' codec not supported');
															stop_media(request,subinfo.codec+' codec not supported');
															return;
														};
													};
												};
												var init=request.mp4box.initializeSegmentation();
												console.log('init length '+init.length);
												var onInitAppended=function(e) {
													var user=e.target.request;
													user._source_.removeEventListener('updateend',onInitAppended);
													user._init_=true;
													if (user.wait_init) {
														console.log('wait_init');
														user._source_.addEventListener('updateend',function() {
															updateend(user);
														});
														updateend(user);
													};
												};
												while (init.length) {
													var subinit=init.shift();
													var user=subinit.user;
													console.log('init segment track '+subinit.user.track+' '+subinit.buffer.byteLength);
													user.append_buffer.push(new Uint8Array(subinit.buffer));
													user._source_.addEventListener("updateend",onInitAppended);
													updateend(user);
												};
											};
										//} else {
										//
										//};
									};
									request.mp4box.onError = function(e) {
										console.log('mp4box error');
										stop_media(request,'mp4box error');
										delete request.mp4box;
									};
								};
							} //else {
							//	stop_media(request);
							//};
						} else {
							while (request._wait_open.length) {
								request._wait_open.shift()();
							};
						};
					};
					addEvent(request._stream_,'webkitsourceopen',addsource,false);
					addEvent(request._stream_,'sourceopen',addsource,false);
					request._stream_.addEventListener('sourceclose', function(e) {console.log("SOURCE CLOSED");request.nb_sources.forEach(function(val) {stop_.call(val)});stop_.call(request)}, false);
					mediaSrc.addEventListener('seeking',function(){});
					mediaSrc.addEventListener('pause',function(){});
					mediaSrc.addEventListener('play',function(){});
					mediaSrc.addEventListener('error',function() {Myalert('<p style="text-align:center">Error: Media Source error - This media can not be streamed or something unexpected happened</p>');request.nb_sources.forEach(function(val) {stop_.call(val)});stop_.call(request);try {request._stream_.endOfStream();} catch(ee) {}});
				} else if (((type.indexOf('video')!==-1)||(type.indexOf('audio')!==-1)||(type.indexOf('binary')!==-1))&&(request._parent_)) {
					if (!request._moov_) {
						request._parent_.connected_sources++;
						if (request._parent_.connected_sources===request._parent_.nb_sources.length) {
							console.log('play media already fragmented');
							Myalert('<p style="text-align:center">Connected... the video is going to start, please wait</p>');
							mediaSrc.play();
						};
					};
				} else {
					Myalert('<p style="text-align:center">Error: not an audio/video file - This media can not be streamed, please use Download</p>');
					document.body.removeChild(divMedia);
					stop_.call(request);
				};
			};
			var delete_=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				hide_menu('menu');
				remove(this.thumb_)
			};
			var rename2_=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				hide_menu('menu2');
				var request=this;
				var func=function() {
					if (this.value) {
						var objectStore=open_db();
						var a=objectStore.get(request.hash_ini);
						a.onsuccess=(function(evt) {
							if (evt.target.result) {
								evt.target.result.name=this.value;
								request.name_=this.value;
								objectStore.put(evt.target.result);
								if (request.thumb_) {
									add_thumb_(request);
								};
								add_thumb(request);
							};
						}).bind(this); //this is input
					};
				};
				Myprompt("<p style='text-align:center'>Enter new name:</p>",func);
			};
			var delete2_=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				hide_menu('menu2');
				var objectStore=open_db();
				objectStore.delete(this.hash_ini);
				remove(this.thumb2_);
				remove(this.thumb_);
			};
			var reload_=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				var request=this;
				request.nb_try++;
				request.db_try=0;
				request.params_.db_=true;
				request.reload_=true;
				if (request.sid_) {
					delete request.cid_[request.sid_];
					delete request.sid_;
				};
				delete request.cid_;
				delete request.eof_;
				delete request.check_hash;
				delete request.last_saved;
				delete request.file_id;
				delete request.start_t0;
				clearTimers(request.query_t0);
				request.name_=this.name_||'';
				request.queue_=[];
				request.queue_s=[];
				request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
				request.cid_=db_cid;
				hide_menu('menu');
				remove(request.thumb_);
				request.bar_=progress_bar($_('downloaded'),request);
				Tor(request);
			};
			var reload2_=function(e) {
				// this {file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb:null,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,blob_:request.blob_}
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				var request=init_d_request(this.url_,this.hash_ini);
				request.clength_=this.clength_;
				request.d_length=this.d_length;
				request.content_=this.content_;
				//request.blob_=this.blob_;
				request.reload2_=true;
				request.thumb2_=this.thumb2_;
				delete request.eof_;
				delete request.last_saved;
				delete request.file_id;
				delete request.start_t0;
				request.queue_=[];
				request.queue_s=[];
				request.name_=this.name_||'';
				clearTimers(request.query_t0);
				request.nb_try++;
				request.db_try=0;
				request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
				request.cid_=db_cid;
				hide_menu('menu2');
				remove(this.thumb_);
				request.bar_=progress_bar($_('downloaded'),request);
				Tor(request);
			};
			var encrypt_decrypt_w=function() {
				// this {file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb:null,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,blob_:request.blob_}
				var decrypt=this.key;
				hide_menu('menu2');
				addEvent(document.body,'mousedown',function() {},false);
				if (decrypt) {
					setTimeout(function() {Myalert("<p style='text-align:center'>"+(decrypt?'De':'En')+"crypting file... Please wait until the file appears in the Local files box, this can take some time depending on the size of the file</p>")},800);
				} else {
					Myalert("<p style='text-align:center'>"+(decrypt?'De':'En')+"crypting file... Please wait until the file appears in the Local files box, this can take some time depending on the size of the file</p>");
				};
				$_('progress-alert').style.display='block';
				$_('progint-alert').style.width='0%';
				var key=decrypt?(new Buffer(decrypt,'hex')):Rand(16);
				var file=this.blob_;
				var size=file.size;
				var clone={file_hash:'00',hash_ini:rand_hash(),name_:(decrypt?(remove_ext(this.name_)):(this.name_+'.'+ENC_EXT)),clength_:size,d_length:0,content_:this.content_,url_:this.url_,key:(decrypt?'':key.toString('hex')),content_chrome:decrypt?null:(chrome?'application/binary':null),blob_:(chrome?(new Buffer(0)):(new Blob([],{type:decrypt?this.content_:'application/octet-binary'}))),queue_:[]};
				var tsize=0;
				if (decrypt) {
					var objectStore=open_db();
					var a=objectStore.get(this.hash_ini);
					a.onsuccess=(function(evt) {
						if (evt.target.result) {
							var res=evt.target.result;
							res.key=decrypt;
							this.key=decrypt;
							addEvent(this.thumb2_,'mousedown',show_menu2.bind({file_hash:this.file_hash,hash_ini:this.hash_ini,name_:this.name_,url:url,thumb2_:this.thumb2_,thumb_:this.thumb_,clength_:this.clength_,d_length:this.d_length,content_:this.content_,url_:this.url_,key:this.key,content_chrome:this.content_chrome,blob_:this.blob_}),false);
							objectStore.put(res);
						};
					}).bind(this);
				};
				var worker=new Worker(URL.createObjectURL(new Blob([workerjs])));
				var file_enc=[];
				var buff;
				if (WORKER_PERF) {
					var t0=Date.now();
				};
				worker.onmessage=(function(evt) {
					var data=evt.data;
					var res=(data instanceof Array)?data[0]:data;
					if (!(data instanceof Array)) {
						tsize +=res.length;
					};
					var l=tsize;
					//$_('progint-alert').style.width=parseInt(100*(tsize/size))+'%';
					if (t0) {
						console.log('worker perf '+(Date.now()-t0));
						t0=Date.now();
					};
					file_enc.push(res);
					if ((tsize%DB_BLOCK===0)||(tsize===size)) {
						var buff=file_enc;
						var execute=(function() {
							//console.log('execute '+l+' '+(data instanceof Array)+' '+Date.now());
							$_('progint-alert').style.width=parseInt(100*(l/size))+'%';
							if (!(data instanceof Array)) {
								this.file_hash='00';
								this.d_length=l;
								store_DB2(this,chrome?buff:(new Blob(buff,{type:decrypt?this.content_:'application/octet-binary'})));
							} else {
								this.check_hash=true;
								this.file_hash=res;
								addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
								$_('progress-alert').style.display='none';
								store_DB(this,true);
							};
						}).bind(this);
						file_enc=[];
						this.queue_.push(execute);
						if (this.queue_.length===1) {
							this.queue_[0]();
						};
					};

				}).bind(clone);
				worker.postMessage(['aes-128-ctr',file,key,IV]);
				/*
				var res=new Uint8Array(reader.result);
				var BL=512;
				var n=0;
				var a;
				var H=forge.aes.createcipheriv('aes-128-ctr',key,IV);
				alert("0");
				while(res.length) {
					//console.log(n);
					a=H.update(res.subarray(0,BL));
					res=res.subarray(Math.min(res.length,BL));
					n++;
				};
				alert(a.substr(0,16));
				*/
			};
			var encrypt2_=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				encrypt_decrypt_w.call({file_hash:this.file_hash,hash_ini:this.hash_ini,name_:this.name_,url:url,thumb2_:this.thumb2_,thumb_:this.thumb_,clength_:this.clength_,d_length:this.d_length,content_:this.content_,url_:this.url_,key:this.key,blob_:this.blob_});
			};
			var decrypt2_=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				var request={file_hash:this.file_hash,hash_ini:this.hash_ini,name_:this.name_,content_:this.content_,url:url,thumb2_:this.thumb2_,thumb_:this.thumb_,clength_:this.clength_,d_length:this.d_length,content_:this.content_,url_:this.url_,key:this.key,blob_:this.blob_};
				if ((this.blob_.type!==this.content_)||(get_extension(this.name_)==='enc')) {
					if (this.key) {
						encrypt_decrypt_w.call(request);
					} else {
						//ask for the key
						var func=function() {
							var key=this.value;
							if (key.length===32) {
								request.key=key;
								encrypt_decrypt_w.call(request);
							} else {
								setTimeout(function() {Myalert("<p style='text-align:center'>Please enter a valid key</p>")},800);
							};
						}; //this is input
						Myprompt("<p style='text-align:center'>Enter key:</p>",func);
					}
				} else {
					Myalert("<p style='text-align:center'>This is not an encrypted file</p>")
				};
			};
			var property2_=function(e) {
				// this {file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb:null,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,blob_:request.blob_}
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				Myalert('<li>Hash Name: '+this.hash_ini+'</li><li>File hash: '+this.file_hash+'</li><li>File Type: '+this.content_+'</li><li>File size: '+this.clength_+' bytes</li><li>Current size: '+this.d_length+' bytes</li><li>Key: '+((this.content_chrome?false:((this.content_===this.blob_.type)&&(get_extension(this.name_)!=='enc')))?('Not encrypted'):(this.key?this.key:'Get the encryption key from peer'))+'</li>');
			};
			var add_menu_event=function(menu_item,func) {
				var obj=$_(menu_item);
				if (obj) {
					if (obj.event_) {
						delEvent(obj,'mousedown',obj.event_,false);
					};
					obj.event_=func.bind(this);
					addEvent(obj,'mousedown',obj.event_,false);
				};
			};
			var del_menu_event=function(menu_item) {
				var obj=$_(menu_item);
				if (obj) {
					if (obj.event_) {
						delEvent(obj,'mousedown',obj.event_,false);
					};
				};
			};
			var show_menu=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				var men=$_('menu2');
				men.style.display='none';
				men=$_('menu');
				men.style.top=getmouseY(e)+'px';
				men.style.left=getmouseX(e)+'px';
				men.style.display='block';
				$_('open').getElementsByTagName('a').item(0).href=URL.createObjectURL(this.blob_);
				add_menu_event.call(this,'delete',delete_);
				add_menu_event.call(this,'reload',reload_);
				if (this.clength_===this.d_length) {
					hide($_('reload'));
				} else {
					show($_('reload'));
				};
			};
			var show_menu2=function(e) {
				if (e.stopPropagation) {e.stopPropagation();};
				e.cancelBubble = true;
				/*
				$_('alert_box').style.top=(getmouseY(e)-250)+'px';
				$_('alert_box').style.display='none';
				$_('prompt_box').style.top=(getmouseY(e)-250)+'px';
				$_('prompt_box').style.display='none';
				*/
				if (db_cid&&NB_C>=1) {
					var men=$_('menu');
					men.style.display='none';
					men=$_('menu2');
					men.style.top=getmouseY(e)+'px';
					men.style.left=getmouseX(e)+'px';
					men.style.display='block';
					$_('open2').getElementsByTagName('a').item(0).href=URL.createObjectURL(this.blob_);
					add_menu_event.call(this,'delete2',delete2_);
					//add_menu_event.call(this,'open2',open2_);
					add_menu_event.call(this,'rename2',rename2_);
					add_menu_event.call(this,'property2',property2_);
					if (this.d_length===this.clength_) {
						hide($_('reload2'));
					} else {
						show($_('reload2'));
						add_menu_event.call(this,'reload2',reload2_);
					};
					var t=this.blob_.type||(this.content_chrome?this.content_chrome:this.content_);
					if ((this.key)||((t!==this.content_))||(get_extension(this.name_)==='enc')) {
						hide($_('encrypt2'));
						show($_('decrypt2'));
						add_menu_event.call(this,'decrypt2',decrypt2_);
					} else {
						show($_('encrypt2'));
						add_menu_event.call(this,'encrypt2',encrypt2_);
						hide($_('decrypt2'));
						//add_menu_event.call(this,'decrypt2',decrypt2_);
					};
				} else {
					Myalert('<p style="text-align:center">Not enough circuits established - Please wait to see at least one Peer to Peer circuit and one Direct Download circuit</p>');
				};
			};
			var hide_menu=function(menu) {
				var men=$_(menu);
				men.style.display='none';
			};
			clear_menu=function() {
				var men=$_('menu');
				men.style.display='none';
				men=$_('menu2');
				men.style.display='none';
				$_('alert_box').style.display='none';
				$_('prompt_box').style.display='none';
			};
			load_Blob_Url=function(request) {
				if (request.blob_) {
					if (request.check_hash) {
						request.file_hash=request.check_hash.digest('hex');
					}
					console.log('Blob loaded '+request.d_length+' '+(request.file_hash||''));
					store_DB(request);
					remove(request.bar_);

				} else {
					remove(request.bar_);
				};
			};
			addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false); //pb click not detected
			addEvent($_('dialog-message'),'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble=true;},false);
			var load=function(url,stream) {
				if ((!stream)||(stream&&(mediaSrc.parentNode?false:(!isStreaming)))) {
					if (db_cid&&NB_C>1) {
						console.log('Start loading url');
						var request=init_d_request(url,null,stream);
						if ((request.hash_ini.length===40)&&(!isNaN(Number('0x'+request.hash_ini)))) {
							//var objectStore=open_db();
							//objectStore.delete(request.hash_ini);
							request.d_length=0;
							remove(request.thumb_);
							remove($_(request.hash_ini));
							if (!stream) {
								request.bar_=progress_bar($_('downloaded'),request);
								remove(mediaSrc);
								remove(divMedia);
								isStreaming=false;
							} else {
								isStreaming=true;
								addmediasource(request);
							};
							if (request.bar_||(request._stream_&&Media)) {
								Tor(request);
							};
						} else {
							Myalert('<p style="text-align:center">Please enter a valid reference (hash_name, magnet link, infohash or url)</p>');
						};
					} else {
						Myalert('<p style="text-align:center">Not enough circuits established - Please wait to see at least one Peer to Peer circuit and one Direct Download circuit</p>');
					};
				};
			};
			var init_d_request=function(url,hash,stream) {
				if (!hash) {
					var mag=magnet(url);
					if (mag) {
						hash=mag;
						url='';
					} else if ((url.indexOf('http')!==-1)||(url.indexOf('https')!==-1)) {
						var H = crypto.createhash('sha1');
						H.update(new Buffer(url,'utf8')); //TODO check url www or not, etc
						hash=H.digest('hex');
					} else {
						hash=url;
						url='';
					};
				};
				var request=ini_nosocks_request(url);
				request.params_.hash_=new Buffer(hash,'hex');
				request.hash_ini=hash;
				request.url_=url;
				url=url_decode(url);
				request.params_.stream=get_request(url.host,url.rest);
				request.params_.host=url.host+':'+((url.protcol==='https')?'443':'80');
				request.params_.db_=true;
				request.cid_=db_cid;
				request.download_=[];
				//request.blob_=[];
				request.d_length=0;
				request.nb_try=0;
				var tmp=url.rest.split('/');
				request.name_=tmp.length?(tmp[tmp.length-1]):'';
				request._write_=function(buff) {load_Blob(buff,this)};
				request.queue_=[];
				request.db_try=0;
				request.sendme_tout=[];
				request.waiting_=[];
				request.queue_s=[];
				request._stream_=stream||false;
				if (stream) {
					request.stream_buffer=[];
					request.append_buffer=[];
					request.append_cursor=0;
					request.append_wait=new Buffer(0);
					request.nb_sources=[];
					request.connected_sources=0;
					request.debug_chunk=[];
					request.append_to=[];
					request._wait_open=[];
					request._json_='';
				};
				return request;
			};
			var addmediasource=function(request) {
				Media=window.MediaSource||window.webkitMediaSource||window.WebKitMediaSource||window.webkitMediaSource||window.MozMediaSource||false;
				if (Media) {
					divMedia=document.createElement('div');
					divMedia.className='media';
					document.body.appendChild(divMedia);
					closebox=document.createElement('div');
					closebox.className='boxclose';
					divMedia.appendChild(closebox);
					addEvent(closebox,'mousedown',function(){remove(divMedia);remove(mediaSrc);stop_.call(request)},true);
				} else {
					Myalert('<p style="text-align:center">Media Source is not available in your browser, so streaming is not possible, please update it or try with Chrome browser.</p>');
				};
			};
			var drawChart=function() {
				ini_direct_chart();
				ini_peer_chart();
				chart1_int=setInterval(function() {redraw_chart(Dchart,Ddata,Doptions)},5000);
				chart2_int=setInterval(function() {redraw_chart(Pchart,Pdata,Poptions)},5000);
				addEvent($_('chart1'),'mousedown',function() {
					if (CHART1) {
						clearInterval(chart1_int);
					} else {
						chart1_int=setInterval(function() {redraw_chart(Dchart,Ddata,Doptions)},5000);
					};
					CHART1=!CHART1;
				},false);
				addEvent($_('chart2'),'mousedown',function() {
					if (CHART2) {
						clearInterval(chart2_int);
					} else {
						chart2_int=setInterval(function() {redraw_chart(Pchart,Pdata,Poptions)},5000);
					};
					CHART2=!CHART2;
				},false);
			};
			//google.setOnLoadCallback(drawChart);
			var load_files=function() {
				peersmDB.list=function(func) {
					//if (!peersmDB.init) { //FF Bug #901884
					//	peersmDB.init=true; //FF Bug #901884
						var objectStore=peersmDB.db.transaction([peersmcode],'readwrite').objectStore(peersmcode);
						objectStore.openCursor().onsuccess = function(event) {
						  var cursor = event.target.result;
							if (cursor) {
								var val=cursor.value;
								func(val);
								cursor.continue();
							} else {
								if (restore_chunk) {
									restoring_chunk();
								};
							};
						};
					//};
				};
				peersmDB.list(thumb_db_list);
			};
			var thumb_db_list=function(val) {
				if (chrome) {
					val.data=new Blob(val.data,{type:val.enc?val.enc:val.type});
				};
				var thumb2=thumb(val,val.name_hash);
				$_('local').appendChild(thumb2);
				addEvent(thumb2,'mousedown',show_menu2.bind({file_hash:val.hash,hash_ini:val.name_hash,name_:val.name,thumb2_:thumb2,clength_:val.file_length,d_length:val.current_length,content_:val.type,url_:val.file_url,key:val.key,content_chrome:val.enc||'',blob_:val.data}),false);
				if (val.file_length!==val.current_length) {
					thumb2.firstChild.style.backgroundColor='orange';
				};
			};
			if (!graph_) {
				var script=document.createElement('script');
				script.src='http://www.peersm.com/gchart.js';
				script.onload=drawChart;
				document.body.appendChild(script);
				//drawChart();
			} else {
				var nb=(db_cid?1:0)+(NB_C>=0?NB_C:0);
				$_('direct_text').innerHTML='Direct, P2P and bittorrent anonymized circuits : '+nb+(nb>1?' circuits':' circuit');
				//$_('peer_text').innerHTML='Peer to Peer : '+(db_cid?1:0)+((!db_cid)?' circuit':(' circuit ('+db_cid.server_.name+')'));
				show($_('direct_text'));
				show($_('peer_text'));
			};
			$_('prompt-input').removeAttribute('type');
			load_files();
			/*for (var i=0;i<10;i++) {
				progress_bar($_('downloaded'),{});
			};
			for (var i=0;i<10;i++) {
				progress_bar($_('local'),{});
			};*/
		};
		_init();
	};
};