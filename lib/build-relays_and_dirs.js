//Copyright 2012 jCore - Aymeric Vitte

var http = require('http'),
	https = require('https'),
	tls = require('tls'),
	fs=require('fs');

//https://onionoo.torproject.org/details?running=true

var options = {
	host: 'onionoo.torproject.org',
	port: 443,
	path: '/details?running=true',
	method: 'GET'
};
var data='';
var req = https.request(options, function(res) {
	console.log("statusCode: ", res.statusCode);
	console.log("headers: ", res.headers);

	res.on('data', function(d) {
	console.log(d.length);
	data +=d.toString('utf8');
		});
  
	res.on('end',function() {
	console.log('--------------------------------');
	build(JSON.parse(data));
	});
});
req.end();
req.on('error', function(e) {
  console.error(e);
});
var build=function(relay) {
	var ans=relay.relays;
	//Guard version > 0.2.3
	console.log('Guard');
	arr=[];
	var fg=function(val,i) {
		var ft;
		if ((val.flags.indexOf('Guard')!=-1)&&(val.platform.indexOf('0.2.3')!=-1)) {
			ft=[val.fingerprint,val.or_addresses[0].split(':').join('-'),val.advertised_bandwidth].join('-');
			if (val.dir_address) {
			 ft +='-'+val.dir_address;
			};
			arr.push(ft);
		};
	};
	ans.forEach(fg);
	console.log('Guards '+arr.length);
	arr=['exports.Guards=["',arr.join('","'),'"];'].join('');
	fs.writeFile('guards.js',arr);
	//Relays
	console.log('Relays');
	var arr=[];
	var f=function(val,i) {
		var ft;
		if ((val.flags.indexOf('Stable')!=-1)&&(val.flags.indexOf('Fast')!=-1)) {
			ft=[val.fingerprint,val.or_addresses[0].split(':').join('-'),val.advertised_bandwidth].join('-');
			if (val.dir_address) {
			 ft +='-'+val.dir_address;
			};
			arr.push(ft);
		}
	};
	ans.forEach(f);
	var trusted_arr=[];
	var l1=arr.length;
	console.log(l1);
	var f1=function(val,i) {
		var tls_socket=function(circ) {
			var options = {
				key: fs.readFileSync('client-key.pem'),
				cert: fs.readFileSync('client.pem'),
				servername: 'www.azju67uikjhsop9y.com'
			};
			var tls_socket_ = tls.connect(circ[2], circ[1], options, function() {
				clearTimeout(t0);
				tls_socket_.write(new Buffer('00000700020003','hex'));
			});
			tls_socket_.on('data', function(data) {
				data=(data.toString('hex')).substr(0,50)+' '+i;
				if (data.indexOf('00000700020003')!=-1) {
					trusted_arr.push(val);
				};
				tls_socket_.destroy();
			});
			tls_socket_.on('end', function() {
				clearTimeout(t0);
				if (i==l1-1) {g1();}
			});
			tls_socket_.on('error',function(error) {
				clearTimeout(t0);
				if (i==l1-1) {g1();}
			});
			var do_not_wait=function() {
				tls_socket_.destroy();
			};
			var t0=setTimeout(do_not_wait,2000);
		};
		var circ=val.split('-');
		tls_socket(circ);
	};
	var h1=function(val,j) {
		var k=function() {f1(val,j)}
		setTimeout(k,50*j);
	};
	arr.forEach(h1);
	var g1=function() {
		var arr=trusted_arr;
		console.log('End Relays '+arr.length);
		f1=function() {};
		arr=['exports.Relays=["',arr.join('","'),'"];'].join('');
		fs.writeFile('relays.js',arr);
	};
	//Exit
	console.log('Exit');
	arr=[];
	var f=function(val,i) {
		var ft;
		if (val.flags.indexOf('Exit')!=-1) {
			ft=[val.fingerprint,val.or_addresses[0].split(':').join('-'),val.advertised_bandwidth].join('-');
			if (val.dir_address) {
			 ft +='-'+val.dir_address;
			};
			arr.push(ft);
		};
	};
	ans.forEach(f);
	console.log('Exit '+arr.length);
	arr=['exports.Exit=["',arr.join('","'),'"];'].join('');
	fs.writeFile('exit.js',arr);
	//Dirs
	console.log('Dirs');
	arr=[];
	var f=function(val,i) {
		var ft;
		if (val.dir_address) {
			if (val.dir_address.length) {
				ft =val.dir_address;
				arr.push(ft);
			};
		};
	};
	ans.forEach(f);
	var trusted_arr2=[];
	var l=arr.length;
	console.log('dir l '+l);
	var fing='21A7842A27843E8FAE662062FA2DBD822C25BD18'; //TODO
	var f2=function(val,i) {
		var tmp=val.split(':');
		var ip=tmp[0];
		var port=tmp[1];
		var options = {
			host: ip,
			path: '/tor/server/fp/'+fing,
			port: port,
			headers: {'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Encoding':'gzip deflate','Accept-Language':'fr,fr-fr;q=0.8,en-us;q=0.5,en;q=0.3','Cache-Control':'max-age=0','Connection':'keep-alive','Host':ip,'User-Agent':'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0'}
		};
		var req=http.request(options,function(res) {
			if (res.statusCode!=200) {
				clearTimeout(t0_);
				req.abort();
				if (i==l-1) {g2();}
			};
			res.on('data', function(d) {
				clearTimeout(t0_);
				if ((d.toString('utf8')).indexOf('onion-key')!=-1) {
					trusted_arr2.push(val);
				};
				if (i==l-1) {g2();}
			});
		});
		req.on('error',function(e) {
			//console.log(e);
			clearTimeout(t0_);
			if (i==l-1) {g2();}
		});
		req.end();
		var do_not_wait=function() {
			req.abort();
		};
		var t0_=setTimeout(do_not_wait,1000);
	};
	var h2=function(val,j) {
		var k=function() {f2(val,j)}
		setTimeout(k,50*j);
	};
	arr.forEach(h2);
	var g2=function() {
		var arr=trusted_arr2;
		console.log('End Dir '+arr.length);
		arr=['exports.Dirs=["',arr.join('","'),'"];'].join('');
		fs.writeFile('dirs.js',arr);
	};
};