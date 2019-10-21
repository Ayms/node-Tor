const crypto=require('crypto');

if (window_browser) {
	var $_=document.getElementById.bind(document);
	var file_extension={};
	const ext=[ENC_EXT,"exe","com","bin","php","php3","php4","php5","phtml","inc","sql","pl","cgi","py","sh","c","cc","cpp","cxx","h","hpp","java","class","jar","html","html","shtml","dhtml","xhtml","xml","js","css","zip","tar","tgz","gz","bz2","tbz","rar","mp3","wav","3ga","midi","mid","rm","ra","ram","pls","m3u","mkw","webm","avi","mp4","m4v","mpg","mpeg","mov","swf","fla","doc","docx","xls","xlsx","rtf","pdf","txt","ppt","pptx","vcard","vcf","obj","max","3ds","3dm","kml","torrent","gpx","dxf","dwg","wsg","vb","pif","gadget","apk","msi","sxc","123","ots","nb","gsheet","xlr","ods","svgz","cdr","svg","ps","eps","orf","pef","rwl","mrw","mef","fff","erf","dcr","bay","3fr","srf","rw2","nef","cr2","arw","dng","dwt","irs","ait","art","aip","aia","ai","indd","prtpset","ppj","plb","prproj","aetx","aet","aes","aepx","aep","aec","ncorx","ncor","em","abr","csh","psb","psd","as","asc","ascs","aif","aiff","flac","iff","m4a","wma","srt","flv","3g2","3gp","asf","wmv","pcast","xlt","xltm","xltx","ans","ascii","log","odt","wpd","accdb","db","dbf","mdb","pdb","asp","aspx","asx","fnt","otf","ttf","dotx","wps2","dll","fon","cmd","srt"];
	var ext_img=["tga","gif","jpg","tiff","jpeg","bmp","png"];
	ext.forEach(function(val) {file_extension[val]='http://www.peersm.com/img/extensions/'+val+'.png'});
};

const getmouseY=function (e) {
	if (e.pageY) {
		return e.pageY;
	} else {
		return e.clientY;
	};
};

const getmouseX=function (e) {
	if (e.pageX) {
		return e.pageX;
	} else {
		return e.clientX;
	};
};

const detkey=function(e) {
	if(e.keyCode==13) {
		this.blur();
		return true;
	};
	return false;
};

const addEvent=function (objet,typeEvent,nomFunction,typePropagation){
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

const delEvent=function (objet, typeEvent, nomFunction, typePropagation){
	if (objet.addEventListener) {
		objet.removeEventListener(typeEvent, nomFunction, typePropagation);
	} else if (objet.attachEvent) {
		objet.detachEvent('on' + typeEvent, nomFunction);
	}
};

const update_circ=function() {
	//browser
	let nb=(db_cid?1:0)+(NB_C>=0?NB_C:0);
	$_('direct_text').innerHTML='P2P and web anonymized circuits : '+nb+(nb>1?' circuits':' circuit');
};

const Myprompt=function(msg,func) {
	$_('prompt_box').style.display='block';
	$_('prompt-message').innerHTML=msg;
	$_('prompt-input').value='';
	$_('prompt-input').submit=func;
	addEvent($_('prompt-input'),'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble = true;},false);
	addEvent($_('prompt-input'),'keydown',function(e) {if ((detkey.call(this,e||window.event))&&(this.value!=='')) {$_('prompt_box').style.display='none';this.submit()}},false);
};

const magnet=function(uri) {
	let m=uri.split('magnet:?xt=urn:btih:');
	if (m.length>1) {
		return m[1];
	};
};

const remove=function(obj) {
	if (obj) {
		if (obj.parentNode) {
			obj.parentNode.removeChild(obj);
		};
	};
};

const Myalert=function(msg) {
	setTimeout(function() {$_('alert_box').style.display='block'},500);
	$_('dialog-message').innerHTML=msg;
};

const hide=function(obj) {
	obj.style.display='none';
};

const show=function(obj) {
	obj.style.display='block';
};

const delete_=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	hide_menu('menu');
	remove(this.thumb_);
};

const hide_menu=function(menu) {
	let men=$_(menu);
	men.style.display='none';
};

const property2_=function(e) {
	// this {file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb:null,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,blob_:request.blob_}
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	Myalert('<li>Hash Name: '+this.hash_ini+'</li><li>File hash: '+this.file_hash+'</li><li>File Type: '+this.content_+'</li><li>File size: '+this.clength_+' bytes</li><li>Current size: '+this.d_length+' bytes</li><li>Key: '+((this.content_chrome?false:((this.content_===this.blob_.type)&&(get_extension(this.name_)!=='enc')))?('Not encrypted'):(this.key?this.key:'Get the encryption key from peer'))+'</li>');
};

const get_extension=function(name) {
	if (name) {
		let ext=name.split('.');
		if (ext.length) {
			ext=ext[ext.length-1];
		} else {
			ext='';
		};
		return ext;
	};
	return 'exe';
};

const add_menu_event=function(menu_item,func) {
	let obj=$_(menu_item);
	if (obj) {
		if (obj.event_) {
			delEvent(obj,'mousedown',obj.event_,false);
		};
		obj.event_=func.bind(this);
		addEvent(obj,'mousedown',obj.event_,false);
	};
};

const del_menu_event=function(menu_item) {
	let obj=$_(menu_item);
	if (obj) {
		if (obj.event_) {
			delEvent(obj,'mousedown',obj.event_,false);
		};
	};
};

const clear_menu=function() {
	let men=$_('menu');
	men.style.display='none';
	men=$_('menu2');
	men.style.display='none';
	$_('alert_box').style.display='none';
	$_('prompt_box').style.display='none';
};

const rand_hash=function() {
	let H=crypto.createhash('sha1');
	H.update(new Buffer((Date.now()).toString()+peersmcode,'utf8'));
	return H.digest('hex');
};

const remove_ext=function(name) {
	name=name.split('.');
	if (name.length>1) {
		if (name[name.length-1]===ENC_EXT) {
			name.pop();
		};
	};
	return name.join('.');
};

const thumb=function(request,id) {
	let name=request.name_||request.name;
	let file=request.blob_||request.data||(new Blob([]));
	let ext=get_extension(name);
	let type=file.type||request.content_chrome||request.content_||request.type;
	let url=file_extension[ext]?(file_extension[ext]):(((ext_img.indexOf(ext)!==-1)&&(type.indexOf('image')!==-1))?URL.createObjectURL(file):file_extension['exe']);
	let t=document.createElement('div');
	t.className='thumbwrap';
	if (id) {
		t.id=id;
	};
	let th=document.createElement('div');
	th.className='thumb';
	let i=document.createElement('img');
	i.className='thumbimg';
	i.src=url;
	let u=document.createElement('div');
	u.align='center';
	let s=document.createElement('span');
	s.className='thumbspan';
	s.innerHTML=name;
	th.appendChild(i);
	t.appendChild(th);
	u.appendChild(s);
	t.appendChild(u);
	return t;
};

const xhr=function(url) {
	let xhr_object=new XMLHttpRequest();
	if (xhr_object)	{
		xhr_object.open("GET", url, false);
		xhr_object.send(null);
		return xhr_object.responseText;
	};
};

let test_bandwidth=function() {
	let xhr_object=new XMLHttpRequest();
	if (xhr_object)	{
		xhr_object.open("POST",'bandwidth.html',true);
		let a=Date.now();
		let size=100000;
		xhr_object.send(new Uint8Array(size));
		xhr_object.onreadystatechange=function() {
			if (xhr_object.readyState==4) {
				let b=100000/((Date.now()-a)/1000); //Bytes per second
				BANDWIDTH=parseInt((BANDWIDTH?((BANDWIDTH+b)/2):b)/BFACTOR);
				console.log('bandwidth : '+(BANDWIDTH*8/1000)+' Kbps');
			};
		};
	};
};

const workerjs='var forge={};(function(){var a=forge.util=forge.util||{};if(typeof process==="undefined"||!process.nextTick){if(typeof setImmediate==="function"){a.setImmediate=setImmediate;a.nextTick=function(b){return setImmediate(b)}}else{a.setImmediate=function(b){setTimeout(b,0)};a.nextTick=a.setImmediate}}else{a.nextTick=process.nextTick;if(typeof setImmediate==="function"){a.setImmediate=setImmediate}else{a.setImmediate=a.nextTick}}a.isArray=Array.isArray||function(b){return Object.prototype.toString.call(b)==="[object Array]"};a.ByteBuffer=function(c){this.data=c||"";this.read=0};a.ByteBuffer.prototype.length=function(){return this.data.length-this.read};a.ByteBuffer.prototype.isEmpty=function(){return this.length()<=0};a.ByteBuffer.prototype.putByte=function(c){this.data+=String.fromCharCode(c);return this};a.ByteBuffer.prototype.fillWithByte=function(c,f){c=String.fromCharCode(c);var e=this.data;while(f>0){if(f&1){e+=c}f>>>=1;if(f>0){c+=c}}this.data=e;return this};a.ByteBuffer.prototype.putBytes=function(b){this.data+=b;return this};a.ByteBuffer.prototype.putString=function(b){this.data+=a.encodeUtf8(b);return this};a.ByteBuffer.prototype.putInt16=function(b){this.data+=String.fromCharCode(b>>8&255)+String.fromCharCode(b&255);return this};a.ByteBuffer.prototype.putInt24=function(b){this.data+=String.fromCharCode(b>>16&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b&255);return this};a.ByteBuffer.prototype.putInt32=function(b){this.data+=String.fromCharCode(b>>24&255)+String.fromCharCode(b>>16&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b&255);return this};a.ByteBuffer.prototype.putInt16Le=function(b){this.data+=String.fromCharCode(b&255)+String.fromCharCode(b>>8&255);return this};a.ByteBuffer.prototype.putInt24Le=function(b){this.data+=String.fromCharCode(b&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b>>16&255);return this};a.ByteBuffer.prototype.putInt32Le=function(b){this.data+=String.fromCharCode(b&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b>>16&255)+String.fromCharCode(b>>24&255);return this};a.ByteBuffer.prototype.putInt=function(b,c){do{c-=8;this.data+=String.fromCharCode((b>>c)&255)}while(c>0);return this};a.ByteBuffer.prototype.putSignedInt=function(b,c){if(b<0){b+=2<<(c-1)}return this.putInt(b,c)};a.ByteBuffer.prototype.putBuffer=function(b){this.data+=b.getBytes();return this};a.ByteBuffer.prototype.getByte=function(){return this.data.charCodeAt(this.read++)};a.ByteBuffer.prototype.getInt16=function(){var b=(this.data.charCodeAt(this.read)<<8^this.data.charCodeAt(this.read+1));this.read+=2;return b};a.ByteBuffer.prototype.getInt24=function(){var b=(this.data.charCodeAt(this.read)<<16^this.data.charCodeAt(this.read+1)<<8^this.data.charCodeAt(this.read+2));this.read+=3;return b};a.ByteBuffer.prototype.getInt32=function(){var b=(this.data.charCodeAt(this.read)<<24^this.data.charCodeAt(this.read+1)<<16^this.data.charCodeAt(this.read+2)<<8^this.data.charCodeAt(this.read+3));this.read+=4;return b};a.ByteBuffer.prototype.getInt16Le=function(){var b=(this.data.charCodeAt(this.read)^this.data.charCodeAt(this.read+1)<<8);this.read+=2;return b};a.ByteBuffer.prototype.getInt24Le=function(){var b=(this.data.charCodeAt(this.read)^this.data.charCodeAt(this.read+1)<<8^this.data.charCodeAt(this.read+2)<<16);this.read+=3;return b};a.ByteBuffer.prototype.getInt32Le=function(){var b=(this.data.charCodeAt(this.read)^this.data.charCodeAt(this.read+1)<<8^this.data.charCodeAt(this.read+2)<<16^this.data.charCodeAt(this.read+3)<<24);this.read+=4;return b};a.ByteBuffer.prototype.getInt=function(c){var b=0;do{b=(b<<8)+this.data.charCodeAt(this.read++);c-=8}while(c>0);return b};a.ByteBuffer.prototype.getSignedInt=function(d){var c=this.getInt(d);var b=2<<(d-2);if(c>=b){c-=b<<1}return c};a.ByteBuffer.prototype.getBytes=function(b){var c;if(b){b=Math.min(this.length(),b);c=this.data.slice(this.read,this.read+b);this.read+=b}else{if(b===0){c=""}else{c=(this.read===0)?this.data:this.data.slice(this.read);this.clear()}}return c};a.ByteBuffer.prototype.bytes=function(b){return(typeof(b)==="undefined"?this.data.slice(this.read):this.data.slice(this.read,this.read+b))};a.ByteBuffer.prototype.at=function(b){return this.data.charCodeAt(this.read+b)};a.ByteBuffer.prototype.setAt=function(d,c){this.data=this.data.substr(0,this.read+d)+String.fromCharCode(c)+this.data.substr(this.read+d+1);return this};a.ByteBuffer.prototype.last=function(){return this.data.charCodeAt(this.data.length-1)};a.ByteBuffer.prototype.copy=function(){var b=a.createBuffer(this.data);b.read=this.read;return b};a.ByteBuffer.prototype.compact=function(){if(this.read>0){this.data=this.data.slice(this.read);this.read=0}return this};a.ByteBuffer.prototype.clear=function(){this.data="";this.read=0;return this};a.ByteBuffer.prototype.truncate=function(c){var b=Math.max(0,this.length()-c);this.data=this.data.substr(this.read,b);this.read=0;return this};a.ByteBuffer.prototype.toHex=function(){var e="";for(var d=this.read;d<this.data.length;++d){var c=this.data.charCodeAt(d);if(c<16){e+="0"}e+=c.toString(16)}return e};a.ByteBuffer.prototype.toString=function(){return a.decodeUtf8(this.bytes())};a.createBuffer=function(b,c){c=c||"raw";if(b!==undefined&&c==="utf8"){b=a.encodeUtf8(b)}return new a.ByteBuffer(b)};a.fillString=function(e,d){var b="";while(d>0){if(d&1){b+=e}d>>>=1;if(d>0){e+=e}}return b};a.xorBytes=function(j,f,l){var e="";var d="";var h="";var g=0;var k=0;for(;l>0;--l,++g){d=j.charCodeAt(g)^f.charCodeAt(g);if(k>=10){e+=h;h="";k=0}h+=String.fromCharCode(d);++k}e+=h;return e};a.hexToBytes=function(c){var d="";var b=0;if(c.length&1==1){b=1;d+=String.fromCharCode(parseInt(c[0],16))}for(;b<c.length;b+=2){d+=String.fromCharCode(parseInt(c.substr(b,2),16))}return d};a.bytesToHex=function(b){return a.createBuffer(b).toHex()};a.int32ToBytes=function(b){return(String.fromCharCode(b>>24&255)+String.fromCharCode(b>>16&255)+String.fromCharCode(b>>8&255)+String.fromCharCode(b&255))};a.encodeUtf8=function(b){return unescape(encodeURIComponent(b))};a.decodeUtf8=function(b){return decodeURIComponent(escape(b))};a.deflate=function(e,c,d){c=a.decode64(e.deflate(a.encode64(c)).rval);if(d){var f=2;var b=c.charCodeAt(1);if(b&32){f=6}c=c.substring(f,c.length-4)}return c};a.inflate=function(d,b,c){var e=d.inflate(a.encode64(b)).rval;return(e===null)?null:a.decode64(e)}})();(function(){var e=forge.sha1=forge.sha1||{};forge.md=forge.md||{};forge.md.algorithms=forge.md.algorithms||{};forge.md.sha1=forge.md.algorithms.sha1=e;var c=null;var b=false;var d=function(){c=String.fromCharCode(128);c+=forge.util.fillString(String.fromCharCode(0),64);b=true};var a=function(r,p,u){var q,o,n,m,l,k,j,g;var h=u.length();while(h>=64){o=r.h0;n=r.h1;m=r.h2;l=r.h3;k=r.h4;for(g=0;g<16;++g){q=u.getInt32();p[g]=q;j=l^(n&(m^l));q=((o<<5)|(o>>>27))+j+k+1518500249+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<20;++g){q=(p[g-3]^p[g-8]^p[g-14]^p[g-16]);q=(q<<1)|(q>>>31);p[g]=q;j=l^(n&(m^l));q=((o<<5)|(o>>>27))+j+k+1518500249+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<32;++g){q=(p[g-3]^p[g-8]^p[g-14]^p[g-16]);q=(q<<1)|(q>>>31);p[g]=q;j=n^m^l;q=((o<<5)|(o>>>27))+j+k+1859775393+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<40;++g){q=(p[g-6]^p[g-16]^p[g-28]^p[g-32]);q=(q<<2)|(q>>>30);p[g]=q;j=n^m^l;q=((o<<5)|(o>>>27))+j+k+1859775393+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<60;++g){q=(p[g-6]^p[g-16]^p[g-28]^p[g-32]);q=(q<<2)|(q>>>30);p[g]=q;j=(n&m)|(l&(n^m));q=((o<<5)|(o>>>27))+j+k+2400959708+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}for(;g<80;++g){q=(p[g-6]^p[g-16]^p[g-28]^p[g-32]);q=(q<<2)|(q>>>30);p[g]=q;j=n^m^l;q=((o<<5)|(o>>>27))+j+k+3395469782+q;k=l;l=m;m=(n<<30)|(n>>>2);n=o;o=q}r.h0+=o;r.h1+=n;r.h2+=m;r.h3+=l;r.h4+=k;h-=64}};e.create=function(){if(!b){d()}var f=null;var i=forge.util.createBuffer();var g=new Array(80);var h={algorithm:"sha1",blockLength:64,digestLength:20,messageLength:0};h.start=function(){h.messageLength=0;i=forge.util.createBuffer();f={h0:1732584193,h1:4023233417,h2:2562383102,h3:271733878,h4:3285377520};return h};h.start();h.update=function(k,j){if(j==="utf8"){k=forge.util.encodeUtf8(k)}h.messageLength+=k.length;i.putBytes(k);a(f,g,i);if(i.read>2048||i.length()===0){i.compact()}return h};h.digest=function(){var j=h.messageLength;var m=forge.util.createBuffer();m.putBytes(i.bytes());m.putBytes(c.substr(0,64-((j+8)%64)));m.putInt32((j>>>29)&255);m.putInt32((j<<3)&4294967295);var k={h0:f.h0,h1:f.h1,h2:f.h2,h3:f.h3,h4:f.h4};a(k,g,m);var l=forge.util.createBuffer();l.putInt32(k.h0);l.putInt32(k.h1);l.putInt32(k.h2);l.putInt32(k.h3);l.putInt32(k.h4);return l};h.digest2=function(){var j=h.messageLength;var o=forge.util.createBuffer();var k=forge.util.createBuffer(i.data.slice(i.read));var m=g.slice(0);o.putBytes(i.bytes());o.putBytes(c.substr(0,64-((j+8)%64)));o.putInt32((j>>>29)&255);o.putInt32((j<<3)&4294967295);var l={h0:f.h0,h1:f.h1,h2:f.h2,h3:f.h3,h4:f.h4};a(l,g,o);var n=forge.util.createBuffer();n.putInt32(l.h0);n.putInt32(l.h1);n.putInt32(l.h2);n.putInt32(l.h3);n.putInt32(l.h4);i=k;g=m;return n};return h};e.createhash=function(){var g=e.create();var f=g.update;g.update=function(h){return f(h.toString("binary"))};g.digest=function(){return g.digest2().toHex()};return g}})();(function(){var j=false;var h=4;var f;var b;var d;var k;var g;var e=function(){j=true;d=[0,1,2,4,8,16,32,64,128,27,54];var x=new Array(256);for(var p=0;p<128;++p){x[p]=p<<1;x[p+128]=(p+128)<<1^283}f=new Array(256);b=new Array(256);k=new Array(4);g=new Array(4);for(var p=0;p<4;++p){k[p]=new Array(256);g[p]=new Array(256)}var s=0,o=0,v,t,q,w,l,u,r;for(var p=0;p<256;++p){w=o^(o<<1)^(o<<2)^(o<<3)^(o<<4);w=(w>>8)^(w&255)^99;f[s]=w;b[w]=s;l=x[w];v=x[s];t=x[v];q=x[t];u=(l<<24)^(w<<16)^(w<<8)^(w^l);r=(v^t^q)<<24^(s^q)<<16^(s^t^q)<<8^(s^v^q);for(var m=0;m<4;++m){k[m][s]=u;g[m][w]=r;u=u<<24|u>>>8;r=r<<24|r>>>8}if(s===0){s=o=1}else{s=v^x[x[x[v^q]]];o^=x[x[o]]}}};var a=function(z,o){var x=z.slice(0);var B,m=1;var r=x.length;var p=r+6+1;var s=h*p;for(var u=r;u<s;++u){B=x[u-1];if(u%r===0){B=f[B>>>16&255]<<24^f[B>>>8&255]<<16^f[B&255]<<8^f[B>>>24]^(d[m]<<24);m++}else{if(r>6&&(u%r===4)){B=f[B>>>24]<<24^f[B>>>16&255]<<16^f[B>>>8&255]<<8^f[B&255]}}x[u]=x[u-r]^B}if(o){var t;var D=g[0];var C=g[1];var A=g[2];var y=g[3];var v=x.slice(0);var s=x.length;for(var u=0,l=s-h;u<s;u+=h,l-=h){if(u===0||u===(s-h)){v[u]=x[l];v[u+1]=x[l+3];v[u+2]=x[l+2];v[u+3]=x[l+1]}else{for(var q=0;q<h;++q){t=x[l+q];v[u+(3&-q)]=D[f[t>>>24]]^C[f[t>>>16&255]]^A[f[t>>>8&255]]^y[f[t&255]]}}}x=v}return x};var c=function(u,v,t,o){var q=u.length/4-1;var p,n,m,l,s;if(o){p=g[0];n=g[1];m=g[2];l=g[3];s=b}else{p=k[0];n=k[1];m=k[2];l=k[3];s=f}var D,C,A,z,E,r,x;D=v[0]^u[0];C=v[o?3:1]^u[1];A=v[2]^u[2];z=v[o?1:3]^u[3];var y=3;for(var B=1;B<q;++B){E=p[D>>>24]^n[C>>>16&255]^m[A>>>8&255]^l[z&255]^u[++y];r=p[C>>>24]^n[A>>>16&255]^m[z>>>8&255]^l[D&255]^u[++y];x=p[A>>>24]^n[z>>>16&255]^m[D>>>8&255]^l[C&255]^u[++y];z=p[z>>>24]^n[D>>>16&255]^m[C>>>8&255]^l[A&255]^u[++y];D=E;C=r;A=x}t[0]=(s[D>>>24]<<24)^(s[C>>>16&255]<<16)^(s[A>>>8&255]<<8)^(s[z&255])^u[++y];t[o?3:1]=(s[C>>>24]<<24)^(s[A>>>16&255]<<16)^(s[z>>>8&255]<<8)^(s[D&255])^u[++y];t[2]=(s[A>>>24]<<24)^(s[z>>>16&255]<<16)^(s[D>>>8&255]<<8)^(s[C&255])^u[++y];t[o?1:3]=(s[z>>>24]<<24)^(s[D>>>16&255]<<16)^(s[C>>>8&255]<<8)^(s[A&255])^u[++y]};var i=function(H,r,u,o,v){var m=null;if(!j){e()}v=(v||"CBC").toUpperCase();if(typeof H==="string"&&(H.length===16||H.length===24||H.length===32)){H=forge.util.createBuffer(H)}else{if(forge.util.isArray(H)&&(H.length===16||H.length===24||H.length===32)){var B=H;var H=forge.util.createBuffer();for(var x=0;x<B.length;++x){H.putByte(B[x])}}}if(!forge.util.isArray(H)){var B=H;H=[];var z=B.length();if(z===16||z===24||z===32){z=z>>>2;for(var x=0;x<z;++x){H.push(B.getInt32())}}}if(!forge.util.isArray(H)||!(H.length===4||H.length===6||H.length===8)){return m}var I=(["CFB","OFB","CTR"].indexOf(v)!==-1);var p=(v==="CBC");var A=a(H,o&&!I);var w=h<<2;var n;var y;var s;var D;var q;var l;var F;m={output:null};if(v==="CBC"){F=E}else{if(v==="CFB"){F=G}else{if(v==="OFB"){F=t}else{if(v==="CTR"){F=C}else{throw {message:""}}}}}m.update=function(J){if(!l){n.putBuffer(J)}while(n.length()>=w||(n.length()>0&&l)){F()}};m.update2=function(J){if(J){if(J.length()){n.data=n.data.substr(n.read);n.read=0;n.putBuffer(J)}}while(n.length()>=w){F()}if(m.overflow){y.getBytes(m.overflow)}var M=n.length()%w;if(M){var K=forge.util.createBuffer(n.data.slice(n.read));var L=s.slice(0);while(n.length()>0){F()}n=K;s=L;y.truncate(w-M)}else{n.data="";n.read=0};m.overflow=M};m.finish=function(N){var M=true;var O=n.length()%w;if(!o){if(N){M=N(w,n,o)}else{if(p){var L=(n.length()===w)?w:(w-n.length());n.fillWithByte(L,L)}}}if(M){l=true;m.update()}if(o){if(p){M=(O===0)}if(M){if(N){M=N(w,y,o)}else{if(p){var J=y.length();var K=y.at(J-1);if(K>(h<<2)){M=false}else{y.truncate(K)}}}}}if(!p&&!N&&O>0){y.truncate(w-O)}return M};m.start=function(K,J){if(K===null){K=q.slice(0)}if(typeof K==="string"&&K.length===16){K=forge.util.createBuffer(K)}else{if(forge.util.isArray(K)&&K.length===16){var M=K;var K=forge.util.createBuffer();for(var L=0;L<16;++L){K.putByte(M[L])}}}if(!forge.util.isArray(K)){var M=K;K=new Array(4);K[0]=M.getInt32();K[1]=M.getInt32();K[2]=M.getInt32();K[3]=M.getInt32()}n=forge.util.createBuffer();y=J||forge.util.createBuffer();q=K.slice(0);s=new Array(h);D=new Array(h);l=false;m.output=y;if(["CFB","OFB","CTR"].indexOf(v)!==-1){for(var L=0;L<h;++L){s[L]=q[L]}q=null}};if(r!==null){m.start(r,u)}return m;function E(){if(o){for(var J=0;J<h;++J){s[J]=n.getInt32()}}else{for(var J=0;J<h;++J){s[J]=q[J]^n.getInt32()}}c(A,s,D,o);if(o){for(var J=0;J<h;++J){y.putInt32(q[J]^D[J])}q=s.slice(0)}else{for(var J=0;J<h;++J){y.putInt32(D[J])}q=D}}function G(){c(A,s,D,false);for(var K=0;K<h;++K){s[K]=n.getInt32()}for(var K=0;K<h;++K){var J=s[K]^D[K];if(!o){s[K]=J}y.putInt32(J)}}function t(){c(A,s,D,false);for(var J=0;J<h;++J){s[J]=n.getInt32()}for(var J=0;J<h;++J){y.putInt32(s[J]^D[J]);s[J]=D[J]}}function C(){c(A,s,D,false);for(var J=h-1;J>=0;--J){if(s[J]===4294967295){s[J]=0}else{++s[J];break}}for(var J=0;J<h;++J){y.putInt32(n.getInt32()^D[J])}}};forge.aes=forge.aes||{};forge.aes.startEncrypting=function(n,m,l,o){return i(n,m,l,false,o)};forge.aes.createEncryptionCipher=function(l,m){return i(l,null,null,false,m)};forge.aes.startDecrypting=function(n,m,l,o){return i(n,m,l,true,o)};forge.aes.createDecryptionCipher=function(l,m){return i(l,null,null,true,m)};forge.aes._expandKey=function(m,l){if(!j){e()}return a(m,l)};forge.aes._updateBlock=c;forge.aes.createcipheriv=function(r,o,n){var q=r.split("-")[2];var m=forge.util.createBuffer();o=forge.util.createBuffer(o.toString("binary"));n=forge.util.createBuffer(n.toString("binary"));var l=forge.aes.startEncrypting(o,n,m,q);var p=l.update2;l.update=function(t){var s;if(t){t=forge.util.createBuffer(t.toString("binary"))}else{t=forge.util.createBuffer()}p(t);s=m.toHex();m.data="";m.read=0;return s};return l}})();var wBuffer=function(a,e) {if (e==="hex") {try {var b=new Uint8Array(a.length/2);var l=a.length;for (var i=0;i<l;i+=2) {b[i/2]=parseInt(a[i]+a[i+1],16);};} catch(ee) {return new Uint8Array();};};return b;};Uint8Array.prototype.toString=function(enc) {var l=this.length;var r=[];if (enc==="hex") {for (var i=0;i<l;i++) {var tmp=this[i].toString(16);r.push(tmp.length===1?("0"+tmp):tmp);};};if (enc==="binary") {if (navigator.userAgent.indexOf("Chrome")===-1) {return String.fromCharCode.apply(null,this);}else{var cut=16*1024;var part="";var tmp=this;while (tmp.length) {var k=Math.min(tmp.length,cut);part +=String.fromCharCode.apply(null,tmp.subarray(0,k));tmp=tmp.subarray(k);};return part;};};return r.join("");};var createcipheriv=forge.aes.createcipheriv;self.onmessage=function(evt){var res=evt.data;var BL=65536;/*warning do not change*/;var type;var file;var size;/*modif chrome*/var reader=new FileReaderSync();file=res[1];type=res[0];size=file.size;var H=forge.sha1.createhash("sha1");if (type.indexOf("hash")===-1) {var C2=createcipheriv(res[0],res[2],res[3]);};var start=0;while (start!==size) {var chunk=new Uint8Array(reader.readAsArrayBuffer(file.slice(start,Math.min(start+BL,size))));if (type.indexOf("hash")!==-1) {H.update(chunk);if (type==="hash") {self.postMessage(chunk.length);} else {self.postMessage(chunk);};} else {var enc=new wBuffer(C2.update(chunk,"hex","hex"),"hex");H.update(enc);self.postMessage(enc);};start +=Math.min(BL,size-start);};self.postMessage([H.digest("hex")]);};';

if (window_browser) {
	let buttonp=$_('close_prompt');
	addEvent(buttonp,'mousedown',function() {$_('prompt_box').style.display='none';$_('prompt-input').submit()},false);
	let buttona=$_('close_alert');
	addEvent(buttona,'mousedown',function() {$_('alert_box').style.display='none';addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);},false);
};

module.exports={$_,addEvent,delEvent,Myprompt,remove,Myalert,hide,show,delete_,hide_menu,property2_,add_menu_event,del_menu_event,clear_menu,workerjs,rand_hash,remove_ext,thumb,update_circ,xhr,test_bandwidth,getmouseY,getmouseX,detkey,magnet,get_extension}