const crypto=require('crypto');
const forge=require('./forge.js');
const Hash=forge.sha1.createhash;
const Rsa=function() {};
const exp='010001';
crypto.createhash=Hash;
crypto.createcipheriv=crypto.createCipheriv;

const crypto_expand_key=function(K0) {
	let r='';
	for (let i=0;i<5;i++) {
		let H=crypto.createhash('sha1');
		H.update(new Buffer(K0+'0'+i,'hex'));
		r+=H.digest('hex');
	};
	return new Buffer(r,'hex');
};

const crypto_aes_encrypt=function(m,K,IV=new Buffer('00000000000000000000000000000000','hex')) {
	let C2=crypto.createcipheriv('aes-128-ctr',K,IV);
	let K2=C2.update(m,'hex','hex');
	K2+=C2.final('hex');
	return K2;
};

const crypto_onion=function(modulus,M) {
	let M1=M.slice(0,70);
	let M2=M.slice(70);
	let K=Rand(16);
	let K1=[K,M1].concatBuffers();
	let RSA=new Rsa();
	K1=RSA.encrypt(new Buffer(modulus.toString('hex'),'binary'),new Buffer(exp,'binary'),new Buffer(K1.toString('binary'),'binary'),'RSA_PKCS1_OAEP_PADDING','hex');
	let K2=crypto_aes_encrypt(M2,K);
	return [new Buffer(K1,'hex'),new Buffer(K2,'hex')].concatBuffers();
};

const crypto_donion=function(key,M,M2) {
	let RSA=new Rsa();
	let X=new Buffer(RSA.decrypt(key,M,'RSA_PKCS1_OAEP_PADDING','hex'),'hex');
	let K=X.slice(0,16);
	return [X.slice(16),new Buffer(crypto_aes_encrypt(M2,K),'hex')].concatBuffers();
};

const xorBytes=function(s1,s2,n) {
	let s3='';
	let b='';
	let t='';
	let i=0;
	let c=0;
	for(;n>0;--n,++i) {
		b=s1.charCodeAt(i)^s2.charCodeAt(i);
		if(c>=10) {
			s3+=t;
			t='';
			c=0;
		};
		t +=String.fromCharCode(b);
		++c;
	};
	s3 +=t;
	return s3;
};

const rsa_mgf1=function rsa_mgf1(seed,maskLength,digestLength) {
	let t='';
	let hash;
	let count=Math.ceil(maskLength/digestLength);
	for(let i=0;i<count;++i) {
		let c=String.fromCharCode((i >> 24) & 0xFF, (i >> 16) & 0xFF, (i >> 8) & 0xFF, i & 0xFF);
		hash=new Hash('sha1');
		hash.update(new Buffer(seed+c,'binary'));
		t+=(new Buffer(hash.digest('hex'),'hex')).toString('binary');
	};
	return t.substring(0,maskLength);
};

const encode_rsa_oaep=function(keyLength,message,options) {
	let label='';
	let seed;
	let md;
	let digestLength=20;
	if (options) {
		label=options.label;
		seed=options.seed;
	};
	md=new Hash('sha1');
	let maxLength=keyLength-2*digestLength-2; //86
	if(message.length>maxLength) {
		throw {
		  message: 'RSAES-OAEP input message length is too long.',
		  length: message.length,
		  maxLength: maxLength
		};
	};
	md.update(new Buffer(label,'binary'));
	let lHash=md.digest('hex'); //txt_hex
	lHash=(new Buffer(lHash,'hex')).toString('binary');
	let PS='';
	let PS_length=maxLength-message.length;
	for (let i=0;i<PS_length;i++) {
		PS += '\x00';
	};
	let DB=lHash+PS+'\x01'+message;
	if(!seed) {
		seed=Rand(digestLength).toString('binary');
	};
	let dbMask=rsa_mgf1(seed,keyLength-digestLength-1,digestLength);
	let maskedDB=xorBytes(DB,dbMask,DB.length);
	let seedMask=rsa_mgf1(maskedDB,digestLength,digestLength);
	let maskedSeed=xorBytes(seed,seedMask,seed.length);
	return '\x00'+maskedSeed+maskedDB;
};

const decode_rsa_oaep=function(keyLength,em,options) {
	let label='';
	let md;
	let digestLength=20;
	if(options) {
		label=options.label;
		md=options.md;
	};
	if(em.length!==keyLength) {
		 throw {
			 message:'RSAES-OAEP encoded message length is invalid.',
			 length:em.length,
			 expectedLength:keyLength
		 };
	};
	md=new Hash('sha1');
	if(keyLength<2*digestLength+2) {
		throw {
		message: 'RSAES-OAEP key is too short for the hash function.'
		};
	};
	md.update(new Buffer(label,'binary'));
	let lHash=md.digest('hex');
	lHash=(new Buffer(lHash,'hex')).toString('binary');
	let y=em.charAt(0);
	let maskedSeed=em.substring(1,digestLength+1);
	let maskedDB=em.substring(1+digestLength);
	let seedMask=rsa_mgf1(maskedDB,digestLength,digestLength);
	let seed=forge.util.xorBytes(maskedSeed,seedMask,maskedSeed.length);
	let dbMask=rsa_mgf1(seed,keyLength-digestLength-1,digestLength);
	let db=forge.util.xorBytes(maskedDB,dbMask,maskedDB.length);
	let lHashPrime=db.substring(0,digestLength);
	let error=(y !== '\x00');
	for(let i=0; i<digestLength;++i) {
		error|=(lHash.charAt(i)!==lHashPrime.charAt(i));
	};
	let in_ps=1;
	let index=digestLength;
	for(let j=digestLength;j<db.length;j++) {
		let code=db.charCodeAt(j);
		let is_0=(code & 0x1) ^ 0x1;
		let error_mask=in_ps?0xfffe:0x0000;
		error|=(code&error_mask);
		in_ps=in_ps&is_0;
		index+=in_ps;
	};
	if(error||db.charCodeAt(index)!==0x1) {
		throw {
			message:'Invalid RSAES-OAEP padding.'
		};
	};
	return db.substring(index + 1);
};

Rsa.prototype.encrypt=function(buff_modulus_bin,buff_exp_bin,buff_mess_bin,mode) {
	let key={};
	key.n=new BigInteger(buff_modulus_bin.toString('binary'),16);
	key.e=new BigInteger(buff_exp_bin.toString('binary'),16);
	if (mode==='RSA_PKCS1_OAEP_PADDING') {
		let oaep=encode_rsa_oaep(buff_modulus_bin.length/2,buff_mess_bin.toString('binary'));
		let res=new Buffer(forge.pki.rsa.encrypt(oaep,key,true),'binary').toString('hex');
		return res;
	} else {
		return new Buffer(forge.pki.rsa.encrypt(buff_mess_bin.toString('binary'),key),'binary').toString('hex');
	};
};

Rsa.prototype.decrypt=function(key,string_mess_hex,mode) {
	key=forge.pki.privateKeyFromPem(key);
	if (mode==='RSA_PKCS1_OAEP_PADDING') {
		let res=forge.pki.rsa.decrypt((new Buffer(string_mess_hex,'hex')).toString('binary'),key,false,false);
		res=decode_rsa_oaep(key.n.bitLength()/8,res);
		return (new Buffer(res,'binary').toString('hex'));
	} else {
		return new Buffer(forge.pki.rsa.decrypt(buff_mess_bin.toString('binary'),key),'binary').toString('hex');
	};
};

const Rand=function(length) {
	return crypto.randomBytes(length);
};

module.exports={crypto,Hash,Rsa,crypto_expand_key,crypto_onion,crypto_donion,Rand};