const crypto=require('./crypto.js');

const wsdecode=function(data,b) {
	b=b||[];
	let length=0;
	let index=0;
	let tlength=data.length;
	let payload=new Buffer(0);
	let stream=new Buffer(0);
	let n;
	if (data.length===0) {
		return [payload,stream];
	};
	let type=data[0];
	if (data.length>1) {
		let mask=data[1]&0x80;
		let length_=data[1]&0x7f;
		if (length_===0x7E) {
			length=(data.slice(2,4)).readUInt();
			mask=mask&&data.slice(4,8);
			index=mask?8:4;
		} else if (length_===0x7F) {
			length=parseInt(data.slice(2,10).toString('hex'),16);
			mask=mask&&data.slice(10,14);
			index=mask?14:10;
		} else {
			length=length_;
			mask=mask&&data.slice(2,6);
			index=mask?6:2;
		};
		payload=data.slice(index,index+length);
		n=payload.length;
		if ((mask)&&(payload.length===length)&&(length!=0)) { //stream part, do not apply mask (slice method does modify the object)
			for (let i=0;i<n;i++) {
				payload[i]=payload[i]^mask[i%4];
			};
		};
	};
	if ((payload.length!==length)||(length===0)) {
		n=payload.length;
		index=tlength;
		stream=data;
	} else {
		b.push(payload);
	};
	if (tlength-index>n) {
		return wsdecode(data.slice(n+index),b);
	} else {
		if (type&0x01) { //string
			return [(b.concatBuffers()).toString('utf8'),stream.toString('utf8')];
		};
		if (type&0x02) { //buffer
			return [b.concatBuffers(),stream];
		};
	};
};

const wsencode=function(data,type,mask) {
	let l=data.length;
	let bytes;
	let b,m;
	mask=mask?crypto.randomBytes(4):mask;
	let a=type===1?'81':'82';
	if (l<0x7E) {
		b=(mask?(l|0x80):l).toString(16);
		b=b.length===1?('0'+b):b;
	} else if (l>=0x7E && l<=0xFFFF) {
		a +=mask?'FE':'7E';
		m=2;
	} else {
		a +=mask?'FF':'7F';
		m=8;
	};
	if (!b) {
		b=l.toString(16);
		b=b.length%2?('0'+b):b;
		while (b.length!==m*2) {b ='00'+b};
	};
	a +=b;
	bytes=new Buffer(a,'hex');
	if (mask) {
		let n=data.length;
		let payload=new Buffer(n);
		for (let i=0;i<n;i++) {
			payload[i]=data[i]^mask[i%4];
		};
	} else {
		payload=data;
	};
	return mask?([bytes,mask,payload].concatBuffers()):([bytes,payload].concatBuffers());
};

module.exports={wsdecode,wsencode};