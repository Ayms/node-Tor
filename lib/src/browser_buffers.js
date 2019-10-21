if (window_browser) {
	Buffer=function(a,e) {
		let b;
		if ((!e)&&(typeof(a)==='string')) {
			e='utf8';
		};
		if ((a instanceof Array) || ((!isNaN(a))&&(!e))) {
			return new Uint8Array(a);
		};
		if (e==='utf8') {
			return (new TextEncoder()).encode(a);
		};
		if (e==='hex') {
			try {
				b=new Uint8Array(a.length/2);
				let l=a.length;
				for (let i=0;i<l;i+=2) {
					b[i/2]=parseInt(a[i]+a[i+1],16);
				};
			} catch(ee) {
				//return new Uint8Array();
			};
		};
		if (e==='binary') {
			b=new Uint8Array(a.length);
			let l=b.length;
			for (let i=0;i<l;i++) {
				b[i]=a.charCodeAt(i);
			};
		};
		return b;
	};

	oBuffer.isBuffer=function(b) {
		return (b instanceof this)||(b instanceof Uint8Array);
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
		let l=buff.length;
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
		let l=this.length;
		for (let i=offset;i<l;i++) {
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
		let l=this.length;
		let r=[];
		if (enc==='utf8') {
			return (new TextDecoder('utf-8')).decode(this);
		};
		if (enc==='hex') {
			for (let i=0;i<l;i++) {
				let tmp=this[i].toString(16);
				r.push(tmp.length===1?('0'+tmp):tmp);
			};
		};
		if (enc==='binary') {
				return String.fromCharCode.apply(null,this);
		};
		return r.join('');
	};
module.exports=Buffer;
};