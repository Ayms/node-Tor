//forge buffers - not used
if (!forge_buffers) {

	forge.util.ByteBuffer = function() {};

	forge.util.createBuffer = function(input, encoding) {
		var a=new forge.util.ByteBuffer();
		if (input) {
			a.data=new Buffer(input,encoding||'binary');
			a.length_=a.data.length;
		} else {
			a.data=new Buffer(buffer_size);
			a.length_=0;
		};
		a.read=0;
		return a;
	};

	forge.util.ByteBuffer.prototype.length = function() {
		return this.length_-this.read;
	};

	forge.util.ByteBuffer.prototype.isEmpty = function() {
		return (this.length_-this.read)===0;
	};

	forge.util.ByteBuffer.prototype.putByte = function(b) { //b charcode
		if (this.data.length>=this.length_+1) {
			this.data.writeUInt(b,this.length_,1);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),new Uint8Array([b])].concatBuffers()):(new Uint8Array([b]));
		};
		this.length_ +=1;
	};

	forge.util.ByteBuffer.prototype.getByte = function() { //return charcode
		return this.data[this.read++];
	};

	forge.util.ByteBuffer.prototype.at=function(i) {
		return this.data[this.read+i];
	};

	forge.util.ByteBuffer.prototype.last = function() {
		return this.data[this.length_-1];
	};

	forge.util.ByteBuffer.prototype.fillWithByte=function(b,n) {//b charcode
		if (this.data.length>=this.length_+n) {
			var o=this.length_;
			for (var i=0;i<n;i++) {
				this.data[o+i]=b;
			};
		} else {
			var arr=[];
			for (var i=0;i<n;i++) {
				arr.push(b);
			};
			this.data=this.length_?([this.data.slice(0,this.length_),new Uint8Array(arr)].concatBuffers()):(new Uint8Array(arr));
		};
		this.length_ +=n;
	};

	forge.util.ByteBuffer.prototype.putBytes = function(bytes) { //bytes string or Buffer (from process)
		var a;
		if (typeof(bytes)==='string') {
			a=new Buffer(bytes,'binary');
		} else {
			a=bytes;
		};
		var l=a.length;
		if (this.data.length>=this.length_+l) {
			this.data.set(a,this.length_);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),a].concatBuffers()):a;
		};
		this.length_+=l;
	};

	forge.util.ByteBuffer.prototype.getBytes = function(count) { //return string
		var rval;
		if(count) {
			count=Math.min(this.length(),count);
			rval=this.data.slice(this.read,this.read+count).toString('binary');
			this.read +=count;
		} else if(count===0) {
			rval = '';
		} else {
			rval=this.data.slice(this.read,this.length_).toString('binary');
			this.clear();
		};
		return rval;
	};

	forge.util.ByteBuffer.prototype.putBuffer = function(buffer) {
		if (this.data.length>=this.length_+buffer.length_) {
			if (buffer.length_) {
				this.data.set(buffer.data.slice(0,buffer.length_),this.length_);
			};
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),buffer.data.slice(0,buffer.length_)].concatBuffers()):(buffer.data.slice(0,buffer.length_));
		};
		this.length_+=buffer.length_;
		buffer.clear();
	};

	forge.util.ByteBuffer.prototype.bytes = function(count) {
		if (!count) {
			return (this.data.slice(this.read,this.length_)).toString('binary');
		} else {
			return this.data.slice(this.read,this.read+count).toString('binary');
		};
	};

	forge.util.ByteBuffer.prototype.putInt16 = function(i) {
		if (this.data.length>=this.length_+2) {
			this.data.writeUInt(i,this.length_,2);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),(new Buffer(2)).writeUInt(i)].concatBuffers()):((new Buffer(2)).writeUInt(i));
		};
		this.length_ +=2;
	};

	forge.util.ByteBuffer.prototype.putInt24 = function(i) {
		if (this.data.length>=this.length_+3) {
			this.data.writeUInt(i,this.length_,3);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),(new Buffer(3)).writeUInt(i)].concatBuffers()):((new Buffer(3)).writeUInt(i));
		};
		this.length_ +=3;
	};

	forge.util.ByteBuffer.prototype.putInt32 = function(i) {
		if (this.data.length>=this.length_+4) {
			this.data.writeUInt(i,this.length_,4);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),(new Buffer(4)).writeUInt(i)].concatBuffers()):((new Buffer(4)).writeUInt(i));
		};
		this.length_ +=4;
	};

	forge.util.ByteBuffer.prototype.putInt32Le = function(i) {
		if (this.data.length>=this.length_+4) {
			this.data.writeUIntLE(i,this.length_,4);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),(new Buffer(4)).writeUIntLE(i)].concatBuffers()):((new Buffer(4)).writeUIntLE(i));
		};
		this.length_ +=4;
	};

	forge.util.ByteBuffer.prototype.putInt = function(i,n) {
		n=n/8;
		if (this.data.length>=this.length_+n) {
			this.data.writeUInt(i,this.length_,n);
		} else {
			this.data=this.length_?([this.data.slice(0,this.length_),(new Buffer(n)).writeUInt(i)].concatBuffers()):((new Buffer(n)).writeUInt(i));
		};
		this.length_ +=n;
	};

	forge.util.ByteBuffer.prototype.getInt16 = function() {
		var a=this.data.readUInt(this.read,2);
		this.read += 2;
		return a;
	};

	forge.util.ByteBuffer.prototype.getInt24 = function() {
		var a=this.data.readUInt(this.read,3);
		this.read += 3;
		return a;
	};

	forge.util.ByteBuffer.prototype.getInt32 = function() {
		var a=this.data.readUInt(this.read,4);
		this.read += 4;
		return a;
	};

	//01000041 -->41000001
	forge.util.ByteBuffer.prototype.getInt32Le = function() {
		var a=this.data.readUIntLE(this.read,4);
		this.read += 4;
		return a;
	};

	forge.util.ByteBuffer.prototype.getInt = function(n) {
		n=n/8;
		var a=this.data.readUInt(this.read,n);
		this.read +=n;
		return a;
	};

	forge.util.ByteBuffer.prototype.compact = function() {
	//TODO check this - strange function
		if (this.length()) {
			//if(this.read < this.length_) {
				var a=this.data.slice(this.read,this.length_);
				this.data=new Buffer(Math.max(buffer_size,a.length));
				this.data.set(a);
				this.length_=a.length;
				this.read=0;
			//};
		} else {
			this.clear();
		};
	};

	forge.util.ByteBuffer.prototype.clear = function() {
		this.data=new Buffer(buffer_size);
		this.length_=0;
		this.read=0;
	};

	forge.util.ByteBuffer.prototype.truncate = function(count) {
		//console.log('truncate '+count+' '+this.length()+' '+this.data.length+' '+this.read);
		//console.log(this.data.toString('hex'));
		var len=Math.max(0,this.length()-count);
		var a=this.data.slice(this.read,len);
		this.data=new Buffer(buffer_size);
		if (this.data.length>a.length) {
			this.data.set(a);
		} else {
			this.data=a;
		};
		this.length_=a.length;
		this.read=0;
		//console.log(this.data.toString('hex'));
	};

	forge.util.ByteBuffer.prototype.toHex = function() {
		return this.data.slice(0,this.length_).toString('hex');
	};

	forge.util.ByteBuffer.prototype.toString = function() {
		return (new Buffer(this.data.slice(0,this.length_).toString('binary'),'utf8')).toString('utf8');
	};

};