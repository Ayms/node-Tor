const {wsdecode}=require('./websockets.js');
const {choose_id,clearTimers}=require('./utils.js');

const init_request=function() {
		delete this.end_;
		delete this.html_;
		delete this.header_;
		delete this.header_l;
		delete this.content_;
		delete this.content_l;
		delete this.clength_;
		delete this.encoding_;
		delete this.pass_;
		delete this.t0_;
		delete this.script_;
		delete this.header_sent;
		delete this.decoder_;
		delete this.f_;
		delete this.wait_;
		delete this.buff_;
		this.nb_try=0;
		delete this.time_resp;
};

const request_start=function(request) {
	if (request.start_) {
		request.write(request.start_);
		delete request.start_;
	};
};

const init_connected_request=function(circ) {
	let sid=choose_id(circ);
	let request={};
	request.sid_=sid;
	request.received_=0;
	request.sent_=0;
	request.stream_window=STREAM_WINDOW_PEER;
	request.stream_window_s=STREAM_WINDOW_PEER;
	request.send_data=true;
	circ[sid]=request;
	request.pause_={};
	return sid;
};

const execute=function(data) {
	return function() {
		if (this.ws_) {
			if ((!window_browser)||(this.OR_)) {
				let tmp=wsdecode(this.stream_ws_?([this.stream_ws_,data].concatBuffers()):data);
				try {
					data=tmp[0]; //decoded stream
				} catch(ee) {
					console.log('wsdecode error or FIN (first bit at 1):'+(data.length?data[0]:'')+' closing WS.');
					this.end();
					return;
				};
				this.stream_ws_=tmp[1].length?tmp[1]:null;
			};
		};
		this.stream_tor_=this.stream_tor_.length?([this.stream_tor_,data].concatBuffers()):data;
		if ((this.ws_)&&(!window_browser)) {
			this.encrypted.push(this.stream_tor_);
			this.stream_tor_=new Buffer(0);
			let queue_=this.queue_;
			queue_.shift();
			if (queue_.length) {
				queue_[0]();
			};
		} else {
			this.stream_tor_.parse(this);
		};
	};
};

const on_data=function(data) {
	this.queue_=this.queue_||[];
	if (window_browser) {
		//console.log('on_data '+this.queue_.length);
	};
	this.queue_.push(execute(data).bind(this));
	if (this.queue_.length===1) {
		this.queue_[0]();
	};
};

const destroy_ws_cid=function(request) {
	console.log('destroy ws cid');
	if (request.remoteAddress&&request.remotePort) {
		delete OR_sock_in[request.remoteAddress+':'+request.remotePort];
	} else {
		clear_circuits_OR_in();
	};
};

const clear_circuits_OR_in=function() {
	for (let n in OR_sock_in) {
		let sock=OR_sock_in[n];
		if (sock) {
			if (!sock.remoteAddress) {
				console.log('deleting or_sock_in remoteadd '+n);
				delete OR_sock_in[n];
			};
		} else {
			console.log('deleting or_sock_in '+n);
			delete OR_sock_in[n];
		};
	};
	clear_circuits_OR_out();
};

const clear_circuits_OR_out=function() {
	let a=[];
	let c=[];
	for (let n in OR_sock) {
		a.push([n,OR_sock[n]]);
	};
	a.forEach(function(d) {
		let boo;
		Object.keys(d[1]).forEach(function(n) {
			if ((!isNaN(n))&&(n!=null)&&(typeof(n)!=='function')) {
				let boo2;
				let circ=d[1][n];
				if (circ) {
					if (circ.prev_) {
						if (circ.prev_.socket_) {
							if (circ.prev_.socket_.remoteAddress) {
								boo2=true;
								boo=true;
							};
						};
					};
				};
				//console.log('Destroy '+boo2+' CID '+circ.circId+' socket out '+circ.server_.ip+' '+(circ.prev_?(circ.prev_.socket_?circ.prev_.socket_.remoteAddress:'no socket'):'no prev'));
				if (!boo2) {
					if (circ) {
						console.log('clearing circuit out n '+n+' CIC '+circ.circId);
						circ.circuit_destroy();
						delete d[1][n];
					};
				};
			};
		});
		if (!boo) {
			console.log('delete OR_sock '+d[0]);
			delete OR_sock[d[0]];
		};
	});
};

const clear_request=function(request) {
	if (request) {
		if ((request.queue_)&&(!request.eof_)) {
			request.eof_=true;
			console.log('clearing '+(request.hash_ini?request.hash_ini:''));
			request.queue_.push(request._fin_.bind(request));
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

module.exports={init_request,request_start,init_connected_request,on_data,clear_circuits_OR_out,destroy_ws_cid,clear_request,clear_requests};