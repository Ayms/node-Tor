const forge=require('./forge.js');
const fs=require('fs');

/*
encode/decode : equivalent to utils functions (forge)
*/
const decode=function(data) {
	let l=data.length;
	let arr=[];
	for (let i=0;i<l;i++) {
		let n=(data[i].charCodeAt()).toString(16); //utf8 SYN --> hex 16
		arr.push(n.length>1?n:'0'+n);
	};
	return arr.join('');
};

const encode=function(data) {
	let l=data.length;
	let arr=[];
	for (let i=0;i<l;i=i+2) {
		arr.push(String.fromCharCode(parseInt(data[i]+data[i+1],16))); //hex 16 --> dec 22 --> utf8 SYN
	};
	return arr.join('');
};

/*
abstract-tls
*/

const createIdLinkTLSCert=function(pub,priv,format,certid,date,subject,issuer,cert) {
	let publicKey=forge.pki.publicKeyFromPem(fs.readFileSync(pub).toString('utf8'));
	let privateKey=forge.pki.privateKeyFromPem(fs.readFileSync(priv).toString('utf8'));
	if (!cert) {
		cert = forge.pki.createCertificate();
		cert.serialNumber='00cc3f3ee26d9a574e';
		//stupid openssl X509 stuff - see https://icinga.com/2017/08/30/advisory-for-ssl-problems-with-leading-zeros-on-openssl-1-1-0/ and https://github.com/openssl/openssl/issues/7134 and https://github.com/digitalbazaar/forge/issues/349
		//won't fix, see if fingerprinting issues
		let date2=new Date(date.valueOf());
		date2.setHours(date2.getHours() - 2);
		cert.validity.notBefore = date2;
		cert.validity.notAfter = new Date(cert.validity.notBefore.valueOf());
		cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
		let attrs = [{
			name: 'commonName',
			value: subject||('www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com')
		}];
		let attri = [{
			name: 'commonName',
			value: issuer||('www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com')
		}];
		cert.setSubject(attrs);
		cert.setIssuer(attri);
	};
	cert.publicKey=publicKey;
	cert.sign(privateKey);
	let pem=forge.pki.certificateToPem(cert);
	if (format==='pem') {
		return pem;
	} else if (format==='der') {
		if (!forge_buffers) {
			return forge.pki.pemToDer(pem).data.toString('hex');
		} else {
			return forge.pki.pemToDer(pem).toHex();
		};
	} else {
		return cert;
	};
};

const createCert=function(cn) {
	console.log('Generating 512-bit key-pair and certificate for \"' + cn + '\".');
	let keys = forge.pki.rsa.generateKeyPair(512);
	console.log('Key-pair created.');
	let cert = forge.pki.createCertificate();
	cert.serialNumber = (Date.now()).toString(); //20 bytes max
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
	let attrs = [{
		name: 'commonName',
		value: cn
	}, {
		name: 'countryName',
		value: 'US'
	}, {
		shortName: 'ST',
		value: 'Virginia'
	}, {
		name: 'localityName',
		value: 'Blacksburg'
	}, {
		name: 'organizationName',
		value: 'Internet Widgits Pty Ltd'
	}, {
		shortName: 'OU',
		value: 'Internet Widgits Pty Ltd'
	}];
	cert.setSubject(attrs);
	cert.setIssuer(attrs);
	cert.setExtensions([{
		name: 'basicConstraints',
		cA: true
	}, {
		name: 'keyUsage',
		keyCertSign: true,
		digitalSignature: true,
		nonRepudiation: true,
		keyEncipherment: true,
		dataEncipherment: true
	}, {
		name: 'subjectAltName',
		altNames: [{
			type: 6, // URI
			value: 'http://www.ianonym.com'
	  }]
	}]);
	cert.publicKey = keys.publicKey;
	cert.sign(keys.privateKey);
	console.log('Certificate created for \"' + cn + '\", signature : <br><br>' + decode(cert.signature).toUpperCase());
	return {
		cert: forge.pki.certificateToPem(cert),
		privateKey: forge.pki.privateKeyToPem(keys.privateKey)
	};
};

const abstract_tls=function(socket,domain,server) {
	let type=server?'server':'client';
	let data;
	if (server) {
		if (!caStore[domain]) {
			data=createCert(server?domain:'client');
			caStore[domain]=data;
		} else {
			data=caStore[domain];
		};
	} else {
		data={cert:{},privateKey:{}};
	};
	return forge.tls.createConnection({
		server: server?true:false,
		caStore: server?[data.cert]:'', //TODO populate caStore
		sessionCache: {},
		// supported cipher suites in order of preference
		//TLS_RSA_WITH_AES_128_CBC_SHA: [0x00,0x2f],TLS_RSA_WITH_AES_256_CBC_SHA: [0x00,0x35],TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA: [0xc0,0x0a],TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA: [0xc0,0x14],TLS_DHE_RSA_WITH_CAMELLIA_256_CBC_SHA: [0x00,0x88],TLS_DHE_DSS_WITH_CAMELLIA_256_CBC_SHA: [0x00,0x87],TLS_DHE_RSA_WITH_AES_256_CBC_SHA: [0x00,0x39],TLS_DHE_DSS_WITH_AES_256_CBC_SHA: [0x00,0x38],TLS_ECDH_RSA_WITH_AES_256_CBC_SHA: [0xc0,0x0f],TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA: [0xc0,0x05],TLS_RSA_WITH_CAMELLIA_256_CBC_SHA: [0x00,0x84],TLS_ECDHE_ECDSA_WITH_RC4_128_SHA: [0xc0,0x07],TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA: [0xc0,0x09],TLS_ECDHE_RSA_WITH_RC4_128_SHA: [0xc0,0x11],TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA: [0xc0,0x13],TLS_DHE_RSA_WITH_CAMELLIA_128_CBC_SHA: [0x00,0x45],TLS_DHE_DSS_WITH_CAMELLIA_128_CBC_SHA: [0x00,0x44],TLS_DHE_RSA_WITH_AES_128_CBC_SHA: [0x00,0x33],TLS_DHE_DSS_WITH_AES_128_CBC_SHA: [0x00,0x32],TLS_ECDH_RSA_WITH_RC4_128_SHA: [0xc0,0x0c],TLS_ECDH_RSA_WITH_AES_128_CBC_SHA: [0xc0,0x0e],TLS_ECDH_ECDSA_WITH_RC4_128_SHA: [0xc0,0x02],TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA: [0xc0,0x04],TLS_RSA_WITH_SEED_CBC_SHA: [0x00,0x96],TLS_RSA_WITH_CAMELLIA_128_CBC_SHA: [0x00,0x41],TLS_RSA_WITH_RC4_128_MD5: [0x00,0x04],TLS_RSA_WITH_RC4_128_SHA: [0x00,0x05],TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA: [0xc0,0x08],TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA: [0xc0,0x12],TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA: [0x00,0x16],TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA: [0x00,0x13],TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA: [0xc0,0x0d],TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA: [0xc0,0x03],SSL_RSA_FIPS_WITH_3DES_EDE_CBC_SHA: [0xfe,0xff],TLS_RSA_WITH_3DES_EDE_CBC_SHA: [0x00,0x0a]
		cipherSuites: [
			[0x00,0x2f],[0x00,0x35],[0xc0,0x0a],[0xc0,0x14],[0x00,0x88],[0x00,0x87],[0x00,0x39],[0x00,0x38],[0xc0,0x0f],[0xc0,0x05],[0x00,0x84],[0xc0,0x07],[0xc0,0x09],[0xc0,0x11],[0xc0,0x13],[0x00,0x45],[0x00,0x44],[0x00,0x33],[0x00,0x32],[0xc0,0x0c],[0xc0,0x0e],[0xc0,0x02],[0xc0,0x04],[0x00,0x96],[0x00,0x41],[0x00,0x04],[0x00,0x05],[0xc0,0x08],[0xc0,0x12],[0x00,0x16],[0x00,0x13],[0xc0,0x0d],[0xc0,0x03],[0xfe,0xff],[0x00,0x0a]],
		virtualHost: server?'':domain,
		verifyClient: false,
		verify: function(c, verified, depth, certs) {
			return true;
		},
		connected: function(c) {
			console.log('TLS '+type+' '+domain+' connected...');
			setTimeout(function() {
				let txt=forge.util.encodeUtf8('Hello '+((type==='server')?'client':'server')+' I want 100 â‚¬ ');
				c.prepare(txt);
			}, 1);
		},
		getCertificate: function(c, hint) {
			return data.cert;
		},
		getPrivateKey: function(c, cert) {
			return data.privateKey;
		},
		tlsDataReady: function(c) {
			if (!forge_buffers) {
				let a=c.tlsData.data.slice(0,c.tlsData.length_);
				if (a.length) {
					if (a[0]!==0) {
						c.tlsData.clear();
						if (type==='server') {
							socket.write_s(a);
						} else {
							socket.write_c(a);
						};
					};
				};
			} else {
				let tmp=c.tlsData.getBytes();
				if (type==='server') {
					socket.write_s(tmp);
				} else {
					socket.write_c(tmp);
				};
			};
		},
		dataReady: function(c) {
			if (!forge_buffers) {
				let response = c.data.data.toString('utf8');
				console.log(type+' '+domain+' received : '+response);
			} else {
				console.log(type+' '+domain+' received : '+forge.util.decodeUtf8(c.data.getBytes()));
			};
		},
		closed: function(c) {
			console.log(type+' '+domain+' disconnected.');
		},
		error: function(c, error) {
			console.log(type+' '+domain+' notification: ' + error.message);
			if (error.message.indexOf('Unknown')===-1) {
				console.log('Unexpected error - please retry');
			} else {
				console.log('Normal error message, so far, so good.');
			};
			c.close();
		}
	});
};
/*
end abstract-tls
*/
module.exports={createIdLinkTLSCert,abstract_tls};