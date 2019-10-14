var oBuffer=Buffer;

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

const http=require('http');
const fs=require('fs');
const {crypto}=require('./src/crypto.js');
const child_process = require('child_process');
const forge=require('./src/forge.js');

/*
 node publish.js OR_name OR_IP:OR_port version email
*/

const args=process.argv.splice(2);
const OR_name=args[0];
const OR_ip=args[1].split(':')[0];
const OR_port=args[1].split(':')[1];
const version=args[2]||'1.0.0';
const OR_contact=args[3]||''; //your email address
const pathd=__dirname+'/'+OR_name+'/';

const create=function() { //create onion and id keys in OR_name directory if they don't exist and publish
	let cb=function(err,data) {
		if (err) {
			let pubk=function() {
				let pubk2=function() {
					let pubk3=function() {
						create();
					};
					child_process.exec('openssl rsa -in '+pathd+'priv-key.pem -out '+pathd+'pub-key-rsa.pem -outform PEM -RSAPublicKey_out',pubk3);
				};
				child_process.exec('openssl rsa -in '+pathd+'priv-key.pem -pubout > '+pathd+'pub-key.pem',pubk2);
			};
			child_process.exec('openssl genrsa -out '+pathd+'priv-key.pem 1024',pubk);
		} else {
			let cb2=function(err,data) {
				if (err) {
					let pubkrsa=function() {
						let pubk2=function() {
							create();
						};
						child_process.exec('openssl rsa -in '+pathd+'priv-id-key.pem -out '+pathd+'pub-id-key-rsa.pem -outform PEM -RSAPublicKey_out',pubk2);
					};
					let pubk=function() {
						child_process.exec('openssl rsa -in '+pathd+'priv-id-key.pem -pubout > '+pathd+'pub-id-key.pem',pubkrsa);
					};
					child_process.exec('openssl genrsa -out '+pathd+'priv-id-key.pem 1024',pubk);
				} else {
					let pubidrsakey=fs.readFileSync(pathd+'pub-id-key-rsa.pem');
					let pubkey=fs.readFileSync(pathd+'pub-key-rsa.pem');
					pub(data,pubidrsakey,pubkey);
				};
			};
			let prividkey=fs.readFile(pathd+'priv-id-key.pem',cb2);
		};
	};
	let privkey=fs.readFile(pathd+'priv-key.pem',cb);
};

const pub=function(privid,pubid,pub) {
	let a=(new Date()).toISOString().split('T')
	let time=a[0]+' '+a[1].split('Z')[0].split('.')[0];
	let publish=function(addr) {
		let fing=new Buffer(forge.pki.pemToDer(pubid.toString('utf8')).data,'binary');
		let H=crypto.createHash('sha1');
		H.update(fing);
		fing=H.digest('hex').toUpperCase();
		console.log('Fingerprint: '+fing);
		fing=fing.substr(0,4)+' '+fing.substr(4,4)+' '+fing.substr(8,4)+' '+fing.substr(12,4)+' '+fing.substr(16,4)+' '+fing.substr(20,4)+' '+fing.substr(24,4)+' '+fing.substr(28,4)+' '+fing.substr(32,4)+' '+fing.substr(36,4);
		let privkey=privid.toString('utf8');
		let desc='router '+OR_name+' '+OR_ip+' '+OR_port+' 0 0\nplatform node-Tor '+version+' on Linux x86_64\nopt protocols Link 1 2 Circuit 1\npublished '+time+'\nopt fingerprint '+fing+'\nuptime 3625\nbandwidth 65536 131072 56148\nonion-key\n'+pub.toString('utf8')+'signing-key\n'+pubid.toString('utf8')+'opt hidden-service-dir\nntor-onion-key 0mUyklUoSpBfW87n8v967FF1yJvvVGs7Ijt7NcnzNys=\ncontact '+OR_contact+'\nreject *:*\nrouter-signature\n';
		//example:
		//desc='router ordb_1 37.59.47.27 8050 0 0\nplatform node-Tor node-Tor 1.0.0 on Linux x86_64\nopt protocols Link 1 2 Circuit 1\npublished 2019-09-27 10:29:02\nopt fingerprint AD04 F4C3 1490 F2D6 A619 1197 3E97 935E E8D5 658D\nuptime 3625\nbandwidth 65536 131072 56148\nonion-key\n-----BEGIN RSA PUBLIC KEY-----\nMIGJAoGBAM/w7EkGibll5UB5mB2LLRrw2kU70R+vPmHG6JVWxAhLUefFNMSCx0UV\nZY1oy2nnBFG4SkJIUx7xsouwotHy/RqFmlFDdrecH3AXLKHH3ilg1afMQC+h7mv+\nEU2u5DN3bJ+IworcTtPrzCncZL/XIb7miCJxQIJR35KcCOpig96HAgMBAAE=\n-----END RSA PUBLIC KEY-----\nsigning-key\n-----BEGIN RSA PUBLIC KEY-----\nMIGJAoGBAK+1wUpAacNfBLkWQXLGcl9iTj9KFE9CDjw1Lb4kDhN7tGWXIhW9M5Nu\nS7Mpn63tXNkLVDUAR/MqreEVkBnh+/AKOGTds3j5WkEuKBJ3BreTFk4eu4ae8qT1\n7UbYwwQbvy1E1eHOrOqJlfZLxtNh/miF6MTuJmvCsx/VVVp8LYhvAgMBAAE=\n-----END RSA PUBLIC KEY-----\nopt hidden-service-dir\ncontact contact at peersm.com\nreject *:*\nrouter-signature\n-----BEGIN SIGNATURE-----\nlkAez4ys33giXNXbx1U1wgsJcvAs2oHs0huchrVro7bPzpsrLj58atpRuY91XOaW\niWn+CvPmgObZpcKLFauup1XJl8ZKSDzIUJB3hAO6EsNEVIxgZ0H5hiK/TNrjA3tm\nu4nnNJIi3OQXdTPbbutcJI8eOrfZeqKoq2Na4QM3CR0=\n-----END SIGNATURE-----\n'
		//key b7065122ace1a8faeeafe4cc1059f0f189460ddd65ebdd3f0ccc72bbedde4f1e
		//twZRIqzhqPrur+TMEFnw8YlGDd1l690/DMxyu+3eTx4=
		privkey=forge.pki.privateKeyFromPem(privkey);
		data=new Buffer(desc,'utf8');
		H=crypto.createHash('sha1');
		H.update(data);
		H=H.digest('hex');
		H=new Buffer(H,'hex').toString('binary');
		let R=new Buffer(forge.pki.rsa.encrypt(H,privkey,0x01),'binary').toString('hex');
		let S=(new Buffer(R,'hex')).toString('base64');
		let s=['-----BEGIN SIGNATURE-----'];
		while (S.length) {
			s.push(S.substr(0,Math.min(64,S.length)));
			S=S.substr(Math.min(64,S.length));
		};
		s.push('-----END SIGNATURE-----\n');
		s=s.join('\n');
		desc+=s;
		console.log(desc);
		addr=addr.split(':');
		let options = {
			host: addr[0],
			port: addr[1],
			path: '/tor/',
			method: 'POST'
		};
		let req=http.request(options, function(res) {
			console.log("statusCode: ", addr[0]+' '+addr[1]+' '+res.statusCode+' '+res.statusMessage);
		});
		req.write(desc);
		req.end();
		req.on('error', function(e) {
			console.log(e);
		});
	};

	publish('45.66.33.45:80');
	publish('66.111.2.131:9030');
	publish('128.31.0.34:9131');
	publish('86.59.21.38:80');
	publish('204.13.164.118:80');
	publish('171.25.193.9:443');
	publish('193.23.244.244:80');
	publish('154.35.175.225:80');
	publish('131.188.40.189:80');
	publish('199.58.81.140:80');

	//check
	//IP:port/tor/server/fp/<fingerprint>
};

create();