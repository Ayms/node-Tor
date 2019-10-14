//node build-relays_and_dirs OR_name

var oBuffer=Buffer;

oBuffer.prototype.readUInt=function() {
	switch (this.length) {
		case 1 : return this[0];
		case 2 : return this.readUInt16BE(0);
		case 4 : return this.readUInt32BE(0);
		case 8 : return parseInt(this.toString('hex'),16);
		return 0;
	};
};

Array.prototype.concatBuffers=function() {
	return Buffer.concat(this);
};

if (oBuffer.from) {
	Buffer=function() {
		if (typeof arguments[0]==='number') {
			return oBuffer.alloc(arguments[0]);
		} else {
			return oBuffer.from(...arguments);
		};
	};
	Object.keys(oBuffer).forEach(function(val) {
		Buffer[val]=oBuffer[val];
	});
	Object.setPrototypeOf(Buffer.prototype,oBuffer.prototype);
	Buffer.prototype.toString=function(enc) {
		if (enc==='binary') {
			return String.fromCharCode(...this);
		} else {
			return oBuffer.toString.bind(this)(enc);
		};
	};
};

const {simpleParser,IPtoVal}=require('./src/utils.js');
const {createIdLinkTLSCert}=require('./src/abstract-tls.js');
const {Rand,crypto}=require('./src/crypto.js');
const http=require('http');
const https=require('https');
const tls=require('tls');
const fs=require('fs');
const RSA_PUB_PFX='-----BEGIN RSA PUBLIC KEY-----';
const RSA_PUB_SFX='-----END RSA PUBLIC KEY-----';
const forge=require('./src/forge.js');
const pathd=__dirname+'/';
const written=[];
//These are the directory servers, by default the authorities
//To be updated according to the bandwidth/behavior of the nodes
//You can replace by any nodes acting as a directory server with a good bandwidth
const DIRS=['45.66.33.45:80','66.111.2.131:9030','128.31.0.34:9131','86.59.21.38:80','204.13.164.118:80','171.25.193.9:443','193.23.244.244:80','154.35.175.225:80','131.188.40.189:80','199.58.81.140:80'];
const wrong={};

/*
process.on('uncaughtException', function (err) {
	console.log('uncaught');
	if (err.stack.indexOf('ECONNRESET')===-1) {
		console.log(err.stack);
	};
});
*/

const OR_name=process.argv.splice(2)[0];

const servername='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.net';

const issuer='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com';

const certid=parseInt((Rand(8)).toString('hex'),16);

const date=new Date();

const key=fs.readFileSync(pathd+OR_name+'/priv-key.pem');

const cert=createIdLinkTLSCert(pathd+OR_name+'/pub-key.pem',pathd+OR_name+'/priv-key.pem','pem',certid,date,servername,issuer);

const get_fingerprint=function(data) {
	let H=crypto.createHash('sha1');
	H.update(data);
	return H.digest('hex');
};

const certs_decode=function(data) {
	let n=data.slice(0,1);
	data=data.slice(1);
	let certs=[];
	certs.push(n);
	while (data.length) {
		let cert={};
		cert.CertType=data.slice(0,1);
		cert.CLEN=data.slice(1,3);
		let l=cert.CLEN.readUInt();
		cert.Certificate=data.slice(3,3+l);
		data=data.slice(3+l);
		certs.push(cert);
	};
	return certs;
};

const check_node=function(val,i) {
	let l=this.length;
	let circ;
	//console.log('checking '+val);
	const end=function(t0) {
		clearTimeout(t0);
		if (i===l-1) {
			get_cert(this.arr,this.name);
		};
	};
	let tls_socket=(function(circ) {
		let options = {
			key: key,
			cert: cert,
			servername: servername,
			rejectUnauthorized: false
		};
		let tls_socket_=tls.connect(circ[2], circ[1], options, function() {
			clearTimeout(t0);
			tls_socket_.write(new Buffer('00000700020003','hex'));
		});
		tls_socket_.on('data', (function(data) {
			data=(data.toString('hex')).substr(0,50)+' '+i;
			if (data.indexOf('000007000')!=-1) {
				this.arr.push(val);
			};
			tls_socket_.destroy();
		}).bind(this));
		tls_socket_.on('end', (function() {
			end.call(this,t0);
		}).bind(this));
		tls_socket_.on('close', (function() {
			end.call(this,t0);
		}).bind(this));
		tls_socket_.on('error',(function(error) {
			end.call(this,t0);
		}).bind(this));
		let t0=setTimeout(function() {tls_socket_.destroy();},2000);
	}).bind(this);
	circ=val.split('-');
	tls_socket(circ);
};

const check_node_p=function(val,j) {
	let check=(function() {
		check_node.call(this,val,j);
	}).bind(this);
	setTimeout(check,50*j);
};

const set_cert=function(val) {
	val=val.split(RSA_PUB_PFX);
	let publickey=forge.pki.publicKeyFromPem(RSA_PUB_PFX+val[1].split(RSA_PUB_SFX)[0]+RSA_PUB_SFX,false);
	return (publickey.n).toString(16);
};

const get_cert=function(arr,name) {
	console.log('get_cert '+name+' '+arr.length);
	let res_=[];
	let l=arr.length;
	let n=-1;
	const request=function(val) {
		let ival=val;
		val=val.split('-');
		let fing=val[0];
		let rand=parseInt(Math.random()*(DIRS.length-1));
		let ip=DIRS[rand].split(':')[0];
		let port=DIRS[rand].split(':')[1];
		let t0;
		let options = {
			host: ip,
			path: '/tor/server/fp/'+fing,
			port: port,
			headers: {'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Encoding':'gzip deflate','Accept-Language':'fr,fr-fr;q=0.8,en-us;q=0.5,en;q=0.3','Cache-Control':'max-age=0','Connection':'keep-alive','Host':ip,'User-Agent':'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0'}
		};
		let req=http.request(options,function(res) {
			let data_='';
			res.on('data', function(d) {
				data_ +=d.toString('utf8');
			});
			res.on('end',function() {
				let k;
				clearTimeout(t0);
				if (data_) {
					try {
						k=set_cert(data_);
					} catch(ee) {};
					if (k) {
						val.push(k);
						res_.push(val.join('-'));
					};
				};
				next(t0);
			});
			res.on('error',function() {
				next(t0);
			});
		});
		req.on('error', function(e) {
			console.log('problem get_certs: '+fing+' '+ip+':'+port+' '+n);
			if (wrong[ip]) {
				wrong[ip]++;
				if (wrong[ip]>5) {
					if (DIRS.length>=3) {
						console.log('removing '+ip+' '+port);
						DIRS.splice(DIRS.indexOf(ip+':'+port),1);
					};
				};
			} else {
				wrong[ip]=1;
			};
		});
		req.end();
		t0=setTimeout(function() {req.abort();next();},2000);
	};
	const next=function(t0) {
		n++;
		if (t0) {
			clearTimeout(t0);
		};
		if (n<l-1) {
			request(arr[n],n);
		} else {
			writef(res_,name)
		};
	};
	if (l) {
		next();
	};
};

const writef=function(arr,name) {
	console.log('writing '+name+' '+arr.length);
	let common=0;
	written.push(arr);
	arr=['exports.'+name+'=["',arr.join('","'),'"];'].join('');
	fs.writeFile(pathd+name.toLowerCase()+'.js',arr,function() {
		if (written.length===2) {
			let a=written[0];
			let b=written[1];
			a.forEach(function(val) {if (b.indexOf(val)!==-1) {common++}});
			console.log('Number of common addresses '+common);
			console.log('close');
			process.exit(0);
		}
	});
};

const build=function(relay) {
	let nodes=relay.relays;
	let guards_t=[];
	let exit_t=[];
	let guards=[];
	let exit=[];
	const select=function(val) {
		let ft=[val.fingerprint,val.or_addresses[0].split(':').join('-'),val.advertised_bandwidth].join('-');
		if (val.dir_address) {
			ft +='-'+val.dir_address;
		};
		return ft;
	};
	const select_guards=function(val) {
		let version=val.platform.split(' ');
		if (version.length>0) {
			version=parseInt(version[1].split('.').join('').substr(0,4));
			//Guard version > 0.2.3
			if (((val.flags.indexOf('Guard')!=-1)&&(version>=230))&&(parseInt(val.advertised_bandwidth)/1000000>=2)) {
				guards.push(select(val));
			};
		};
	};
	nodes.forEach(select_guards);
	console.log('Guards '+guards.length);
	guards.forEach(check_node_p,{arr:guards_t,name:'Guards',length:guards.length});
	//Exit
	const select_exits=function(val) {
		if (val.flags.indexOf('Exit')!=-1) {
			exit.push(select(val));
		};
	};
	nodes.forEach(select_exits);
	console.log('Exit '+exit.length);
	exit.forEach(check_node_p,{arr:exit_t,name:'Exit',length:exit.length});
};

//https://onionoo.torproject.org/details?running=true
let options = {
	host: 'onionoo.torproject.org',
	port: 443,
	path: '/details?running=true',
	method: 'GET'
};
let data='';
let length=0;
let t0=Date.now();
let req = https.request(options, function(res) {
	console.log("Download https://onionoo.torproject.org/details?running=true statusCode: ", res.statusCode);
	res.on('data', function(d) {
		length +=d.length;
		data +=d.toString('utf8');
	});
	res.on('end',function() {
		console.log('Download Bandwidth :'+(parseInt(length*8/((Date.now()-t0)/1000))/1000000+' Mbps')+' length '+length+' time '+(Date.now()-t0)+' ms');
		build(JSON.parse(data));
	});
	res.on('error',function() {
		console.log('Error Onionoo');
	});
});

req.on('error', function(e) {
  console.log('problem contacting Onionoo: '+e.message);
});

req.end();