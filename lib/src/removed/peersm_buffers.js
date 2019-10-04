if ((window_browser)||(window_OR)) {

	Buffer=function(a,e) {
		if ((!e)&&(typeof(a)==='string')) {
			e='utf8';
		};
		if ((a instanceof Array) || ((!isNaN(a))&&(!e))) {
			return new Uint8Array(a);
		};
		if (e==='utf8') {
			return (new TextEncoder('utf-8')).encode(a);
		};
		if (e==='hex') {
			try {
				var b=new Uint8Array(a.length/2);
				var l=a.length;
				for (var i=0;i<l;i+=2) {
					b[i/2]=parseInt(a[i]+a[i+1],16);
				};
			} catch(ee) {
				return new Uint8Array();
			};
		};
		if (e==='binary') {
			var b=new Uint8Array(a.length);
			var l=b.length;
			for (var i=0;i<l;i++) {
				b[i]=a.charCodeAt(i);
			};
		};
		return b;
	};

	oBuffer.isBuffer=function(b) {
		//window_OR true (no node.js Buffers), b is Uint8Array
		return (b instanceof this)||(b instanceof Uint8Array);
	};

	if (window_OR) {
		//Uint8Array.prototype.__proto__=oBuffer.prototype;
		//Buffer.prototype=Uint8Array.prototype;
		/*modif node.js buffer.cc
		replace in HasInstance
		ExternalArrayType type = obj->GetIndexedPropertiesExternalArrayDataType();
		if (type != kExternalUnsignedByteArray)
				return false;
		};
		by
		ExternalArrayType type = obj->GetIndexedPropertiesExternalArrayDataType();
		if (type == kExternalUnsignedByteArray)
				return true;
		};
		Watch util.js util.isBuffer
		*/
	};


	Uint8Array.prototype.isBuffer=oBuffer.prototype.isBuffer;

	Uint8Array.prototype.parse=oBuffer.prototype.parse;

	Uint8Array.prototype.parseTLS=oBuffer.prototype.parseTLS;

	/*
	Buffer API
	*/

	Buffer.isBuffer=function(b) {
		return b instanceof Uint8Array;
	};

	Uint8Array.prototype.slice=function(start,end) {
		if (end) {
			return this.subarray(start,end);
		} else {
			return this.subarray(start);
		};
	};

	Uint8Array.prototype.map=function(buff) {
		var l=buff.length;
		this.set(buff);
		this.fill(0,l);
	};

	Uint8Array.prototype.readUInt=function(o,n) {
		o=o||0;
		n=n||this.length;
		switch (n) {
			case 1 : return this[o];
			case 2 : return this.readUInt16BE(o);
			case 3 : return this.readUInt24BE(o);
			case 4 : return this.readUInt32BE(o);
			default : return 0;

		};
	};

	Uint8Array.prototype.readUIntLE=function(o,n) {
		o=o||0;
		n=n||this.length;
		switch (n) {
			case 1 : return this[o];
			case 2 : return this.readUInt16LE(o);
			case 4 : return this.readUInt32LE(o);
			default : return 0;
		};
	};

	Uint8Array.prototype.writeUInt=function(val,o,n) {
		o=o||0;
		n=n||this.length;
		switch (n) {
			case 1 : this.writeUInt8(val,o);break;
			case 2 : this.writeUInt16BE(val,o);break;
			case 3 : this.writeUInt24BE(val,o);break;
			case 4 : this.writeUInt32BE(val,o);break;
		};
		return this;
	};

	Uint8Array.prototype.writeUIntLE=function(val,o,n) {
		o=o||0;
		n=n||this.length;
		switch (n) {
			case 1 : this.writeUInt8(val,o);break;
			case 2 : this.writeUInt16LE(val,o);break;
			case 4 : this.writeUInt32LE(val,o);break;
		};
		return this;
	};

	Uint8Array.prototype.fill=function(val,offset) {
		var l=this.length;
		for (var i=offset;i<l;i++) {
			this[i]=val;
		};
	};

	Uint8Array.prototype.readUInt16BE=function(o) {
		return this[o] << 8 ^ this[o+1];
	};

	Uint8Array.prototype.readUInt24BE=function(o) {
		return this[o] << 16 ^ this[o+1] << 8 ^ this[o+2];
	};

	Uint8Array.prototype.readUInt32BE=function(o) {
		return this[o] << 24 ^ this[o+1] << 16 ^ this[o+2] << 8 ^ this[o+3];
	};

	Uint8Array.prototype.readUInt16LE=function(o) {
		return this[o] ^ this[o+1] << 8;
	};

	Uint8Array.prototype.readUInt32LE=function(o) {
		return this[o] ^ this[o+1] << 8 ^ this[o+2] << 16 ^ this[o+3] << 24;
	};

	Uint8Array.prototype.writeUInt8=function(val,o) {
		this[o]=val;
	};

	Uint8Array.prototype.writeUInt16BE=function(val,o) {
		this[o]=val >> 8 & 0xFF;
		this[o+1]=val & 0xFF;
	};

	Uint8Array.prototype.writeUInt24BE=function(val,o) {
		this[o]=val >> 16 & 0xFF;
		this[o+1]=val >> 8 & 0xFF;
		this[o+2]=val & 0xFF;
	};

	Uint8Array.prototype.writeUInt32BE=function(val,o) {
		this[o]=val >> 24 & 0xFF;
		this[o+1]=val >> 16 & 0xFF;
		this[o+2]=val >> 8 & 0xFF;
		this[o+3]=val & 0xFF;
	};

	Uint8Array.prototype.writeUInt16LE=function(val,o) {
		this[o]=val & 0xFF;
		this[o+1]=val >> 8 & 0xFF;
	};

	Uint8Array.prototype.writeUInt32LE=function(val,o) {
		this[o]=val & 0xFF;
		this[o+1]=val >> 8 & 0xFF;
		this[o+2]=val >> 16 & 0xFF;
		this[o+3]=val >> 24 & 0xFF;
	};

	Uint8Array.prototype.toString=function(enc) {
		var l=this.length;
		var r=[];
		if (enc==='utf8') {
			return (new TextDecoder('utf-8')).decode(this);
		};
		if (enc==='hex') {
			for (var i=0;i<l;i++) {
				var tmp=this[i].toString(16);
				r.push(tmp.length===1?('0'+tmp):tmp);
			};
		};
		if (enc==='binary') {
			//if (!chrome) {
				return String.fromCharCode.apply(null,this);
			/*} else { //bug max call http://code.google.com/p/chromium/issues/detail?id=252492
				//console.log('chrome workaround');
				var cut=16*1024;
				var part='';
				var tmp=this;
				while (tmp.length) {
					var k=Math.min(tmp.length,cut);
					part +=String.fromCharCode.apply(null,tmp.subarray(0,k));
					tmp=tmp.subarray(k);
				};
				return part;
			};*/
		};
		return r.join('');
	};

	/*
	End Buffer API
	*/

	IV=new Buffer('00000000000000000000000000000000','hex');
};

oBuffer.prototype.parseTLS=function(tls) {
	var stream_tor_=tls.stream_tor_;
	var payl;
	while(stream_tor_.length) {
		var n=stream_tor_.length;
		if (n>=5) {
			var l=stream_tor_.readUInt16BE(3);
			if (n>=l+5) {
				payl=stream_tor_.slice(0,l+5);
				stream_tor_=stream_tor_.slice(l+5);
			} else {
				break;
			};
		} else {
			break;
		};
		if ((payl[0]===22)&&(!tls.ccs_)) {//Handshake see forge bug #18
			var version=payl.readUInt(1,2);
			var length=payl.readUInt(3,3);
			var tmp=payl.slice(5,length);
			while (tmp.length) {
				var n=tmp.length;
				if (n>=4) {
					var slength=tmp.readUInt(1,3);
					if (n>=slength+4) {
						var buff=[new Buffer(1).writeUInt(22),new Buffer(2).writeUInt(version),new Buffer(2).writeUInt(slength+4),tmp.slice(0,slength+4)].concatBuffers();
						tls.process(buff);
						tmp=tmp.slice(slength+4);
					} else {
						break;
					};
				} else {
					break;
				};
			};
		} else {
			if (payl[0]===20) {
				tls.ccs_=true;
			};
			tls.process(payl);
		};
	};
	tls.stream_tor_=stream_tor_;
	var queue_=tls.queue_;
	queue_.shift();
	if (queue_.length) {
		queue_[0]();
	};
};