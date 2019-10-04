const simpleParser=function(data) {
	try {
	let res={};
	let i=0;
	data=data.split('\r\n');
	data.forEach(function(val,j) {
		val=val.split(':');
		if ((val.length>1)&&(j!=0)) {
			let p=val[0];
			val=val.map(function(v) {return v.trim()});
			val.shift();
			val=val.join(':');
			res[p]=val;
		} else {
			res[i+'a']=val.join(':'); //v8 wrong enumeration order bug #2353
			i++;
		};
	});
	return res;
	} catch(ee) {
		console.log('caller');
		console.log(simpleParser.caller.toString().substr(0,50));
	};
};


const req_410=function() {
	let re='HTTP/1.1 410 Gone\r\n';
	re +='\r\n';
	return re;
};


const url_decode=function(url) {
	let URL={url:url};
	let res=url.split('/');
	let dec=function(res) {
		if (res.length) {
			let tmp=res[0];
				URL.host=tmp;
				res.shift();
			};
			URL.rest=res.join('/');
	};
	if (res.length>1) {
		if (res[1]==='') {
			URL.protocol=res[0]?res[0]:default_protocol;
			//if (!res[0]) {
				//console.log('check protocol');
				//console.log(protocol+' '+url);
			//};
			res.shift();
			res.shift();
		} else {
			URL.protocol=default_protocol;
		};
	} else {
		URL.protocol=default_protocol;
	};
	dec(res);
	return URL;
};

const h_address=function(data) {
	let type=data.slice(0,1);
	let length=data.slice(1,2);
	let value=data.slice(2,2+length.readUInt());
	data=data.slice(length.readUInt()+2);
	return {data:data,addr:{type:type,length:length,value:value}};
};

const simple_random=function(l) {
	return parseInt(Math.random()*l);
};

const clear_request=function(request) {
	if (request) {
		if ((request.queue_)&&(!request.eof_)) {
			request.eof_=true;
			console.log('clearing '+(request.hash_ini?request.hash_ini:''));
			request.queue_.push(fin_.bind(request));
			if (request.queue_.length===1) {
				request.queue_[0]();
			};
		};
		clearTimers(request.query_t0);
	};
};

const clear_requests=function(socket) {
	for (let n in socket) {
		if ((!isNaN(n))&&(n!=null)&&(typeof(n)!=='function')) {
			let cid=socket[n];
			if (cid) {
				if (cid===db_cid) {
					for (let m in cid) {
						if ((!isNaN(m))&&(m!=null)&&(typeof(m)!=='function')) {
							let request=cid[m];
							if (request) {
								clear_request(request);
							};
						};
					};
				};
				console.log('clear_requests circuit destroy');
				cid.circuit_destroy();
			};
		};
	};
};

const get_request=function(host,req) {
	let get='GET /'+req+' HTTP/1.1\r\n';
	get +='Host: '+host+'\r\n';
	get +='User-Agent: Mozilla/5.0 (Windows NT 6.0; rv:24.0) Gecko/20100101 Firefox/24.0\r\n';
	get +='Accept: */*\r\n';
	get +='Accept-Language: en\r\n';
	get +='Accept-Encoding: gzip, deflate\r\n';
	get +='Connection: keep-alive\r\n';
	get +='\r\n';
	return new Buffer(get,'utf8');
};

const get_resume=function(host,req,bytes) {
	let get='GET /'+req+' HTTP/1.1\r\n';
	get +='Host: '+host+'\r\n';
	get +='User-Agent: Mozilla/5.0 (Windows NT 6.0; rv:24.0) Gecko/20100101 Firefox/24.0\r\n';
	get +='Range: bytes='+bytes+'-\r\n';
	get +='Accept: */*\r\n';
	get +='Accept-Language: en\r\n';
	get +='Accept-Encoding: gzip, deflate\r\n';
	get +='Connection: keep-alive\r\n';
	get +='\r\n';
	return new Buffer(get,'utf8');
};

const clearTimers=function(t) {
	if (t) {
		while (t.length) {
			clearTimeout(t.shift());
		};
	};
};

const choose_id=function(obj,boo,index) {
	const midc=32767;
	let cid=0;
	obj.nbc_=obj.nbc_?obj.nbc_:0;
	if (!boo) {
		if (obj.nbc_===65534) {
			return false;
		};
	} else {
		if (obj.nbc_===midc) {
			return false;
		};
	};
	while ((obj[cid])||(cid===0)) {
		if (!boo) {
			cid=obj.cid?((++obj.cid)%65535):1;
		} else {
			if (!index) {
				cid=obj.cid?((++obj.cid)%midc):1; //0 to midc
			} else {
				cid=obj.cid?((++obj.cid)%midc):midc; //midc to 65534
			};
		};
	};
	obj.cid=cid;
	obj.nbc_++;
	return cid;
};

const delete_request=function(request) {
	let cid=request.cid_;
	let sid=request.sid_;
	if (sid) {
		delete(cid[sid]);
	};
	delete request.cid_;
	delete request.sid_;
};

const remove_bars=function(request) {
	remove(request.bar_);
	remove(mediaSrc);
	remove(divMedia);
};

const ValToIP=function(val) {
	let l=val.length;
	let ip=[];
	for (let i=0;i<l;i++) {
		ip.push(val[i]);
	};
	return ip.join('.');
};

const IPtoVal=function(ip) {
	return new Buffer(ip.split('.'));
};

module.exports={simpleParser,req_410,url_decode,h_address,simple_random,clear_request,clear_requests,get_request,get_resume,clearTimers,choose_id,delete_request,remove_bars,ValToIP,IPtoVal};