const Cell=require('./cells.js');
const Stream=require('./streams.js');
const {Rand}=require('./crypto.js');
const {choose_id,open_db,clearTimers}=require('./utils.js');
const {init_connected_request}=require('./requests.js');
const {$_,addEvent}=require('./browser_utils.js');
const Extended=function() {};

Extended.prototype={
	send_db_info: function(boo) {
		boo=boo||null;
		let get_db_info=function(val) {
			if (val.file_length===val.current_length) {
				if (db_cid) {
					console.log('send_db_info');
					console.log(val.name_hash);
					let hash_name=new Buffer(val.name_hash,'hex');
					let hash_name_l=(new Buffer(1)).writeUInt(hash_name.length);
					let part=(new Buffer(1)).writeUInt(0);
					let facilitator=new Buffer(0);
					let payload=[hash_name_l,hash_name,part,facilitator].concatBuffers();
					let stream=new Stream(Stream.prototype.RELAY_DB_INFO,0,payload,db_cid.last_.Df_hash);
					let cell_=new Cell(db_cid.circId,Cell.prototype.RELAY,db_cid.last_.stream_encrypt_forward(stream));
					db_cid.send(cell_);
				};
			};
		};
		if (peersmDB) { //TODO investigate strange case doing OP
			peersmDB.list(get_db_info,boo);
		};
	},
	send_db_query: function(request,tid) {
		if (request) {
			console.log('send_db_query');
			let sid;
			let hash=request.params_?request.params_.hash_:request.hash_;
			let size=request.d_length.toString(16);
			size=size.length%2?('0'+size):size;
			size=new Buffer(size,'hex');
			size_l=(new Buffer(1)).writeUInt(size.length);
			console.log('send_db_query hash '+hash.toString('hex')+' CIC '+this.circId+' size '+size_l[0]+' size '+size.toString('hex')+' tid '+(tid?tid.toString('hex'):''));
			let payload=[(new Buffer(1)).writeUInt(hash.length),hash,size_l,size].concatBuffers();
			if (tid) {
				payload=[payload,tid].concatBuffers();
				sid=0;
			} else {
				sid=choose_id(this);
				request.cid_=this;
				if (sid) {
					this[sid]=request;
					request.sid_=sid;
					request.received_=0;
					request.sent_=0;
				} else {
					return;
				};
			};
			if (this.OP_) {
				console.log('OP send db_query  CID '+this.circId+' sid '+sid);
				let stream=new Stream(Stream.prototype.RELAY_DB_QUERY,sid,payload,this.last_.Df_hash);
				let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
				request.query_time=Date.now();
				this.send(cell);
				let end_p=(function() { //serving party not responding
					if (this.socket_) {
						console.log('serving party not responding');
						request.db_try++;
						this.send_db_end(1,sid);
						delete request.sid_;
						this.send_db_query(request);//retry
					};
				}).bind(this);
				if (request.db_try<DB_NB_TRY) {
					request.query_t0=request.query_t0||[];
					request.query_t0.push(setTimeout(end_p,DB_QUERY_RETRY));
				} else {
					request.no_answer.bind(this);
				};
			} else {
				this.prev_=this;
				this.nb_query=this.nb_query||0;
				this.nb_query++;
				console.log('ORDB send db_query  CID '+this.prev_.circId+' sid '+sid+' '+this.prev_.socket_.remoteAddress);
				let stream=new Stream(Stream.prototype.RELAY_DB_QUERY,sid,payload,this.prev_.Db_hash);
				this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
				delete this.prev_;
			};
		};
	},
	send_db_end: function(reason,sid,tid) {
		/*
		0 UNAVAILABLE
		1 FINISHED (aborted by requesting party)
		2 DESTROYED (serving party destroyed)
		*/
		sid=sid||0;
		console.log('send db_end CID '+this.circId+' sid '+sid+' reason '+reason+' '+((typeof tid!=='undefined')?(tid.toString('hex')):''));
		let payload=(new Buffer(1)).writeUInt(reason);
		payload=tid?[payload,tid].concatBuffers():payload;
		if (this.OP_) {
			let stream=new Stream(Stream.prototype.RELAY_DB_END,sid,payload,this.last_.Df_hash);
			let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
			this.send(cell);
		} else {
			this.prev_=this;
			let stream=new Stream(Stream.prototype.RELAY_DB_END,sid,payload,this.prev_.Db_hash);
			this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
			delete this.prev_;
		};
	},
	send_db_connected: function(size,sid,type,tid) {
		size=size.toString(16);
		size=size.length%2?('0'+size):size;
		size=new Buffer(size,'hex');
		size_l=(new Buffer(1)).writeUInt(size.length);
		type=new Buffer(type,'utf8');
		let type_l=(new Buffer(2)).writeUInt(type.length);
		console.log('send db_connected '+size.toString('hex')+' CID '+this.circId+' sid '+sid+' type '+type.toString('utf8'));
		let payload=[size_l,size,type_l,type].concatBuffers();
		if (tid) {
			payload=[tid,payload].concatBuffers();
		};
		if (this.OP_) {
			let stream=new Stream(Stream.prototype.RELAY_DB_CONNECTED,sid,payload,this.last_.Df_hash);
			let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
			this.send(cell);
		} else {
			this.prev_=this;
			let stream=new Stream(Stream.prototype.RELAY_DB_CONNECTED,sid,payload,this.prev_.Db_hash);
			this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
			delete this.prev_;
		};
	},
	send_db_data: function(cd,sid,nb_blocks,boo) {
		if (this.OP_) {
			let request=this[sid];
			if (!boo) {
				request.fc_t=[];
				console.log('sending db data '+ (this.OP_?'OP ':'ORDB sid ')+sid+' BANDWIDTH '+BANDWIDTH*8+' bps '+(this.OP_?(' 512 bytes every '+(1+1000/(BANDWIDTH/BSIZE))+' ms then nbblocks '+(Math.ceil((FLOWB*BANDWIDTH/1000)/BSIZE))+' every '+FLOWB+ 'ms window size '+request.stream_window_s+' '+this.circuit_window_s):'')+' cd '+cd.size);
				request.start_t0=Date.now();
				request.cd_length=cd.size;
				request.messageName='flush';
				addEvent(window,"message",flush_.bind(request),true);
				request.reader=new FileReader();
				request.cursor=0;
			};
			send_data.call(this,cd,sid,request,nb_blocks);
		} else {
			this.prev_=this;
			let stream=new Stream(Stream.prototype.RELAY_DB_DATA,sid,cd.slice(0,Math.min(cd.length,Stream.prototype.PAYLOAD_STREAM)),this.prev_.Db_hash);
			this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
			delete this.prev_;
		};
	},
	send_db_sendme: function(sid) {
		sid=sid||0;
		if (this.OP_) {
			let stream=new Stream(Stream.prototype.RELAY_DB_SENDME,sid,new Buffer(0),this.last_.Df_hash);
			let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
			this.send(cell);
		} else {
			this.prev_=this;
			let stream=new Stream(Stream.prototype.RELAY_DB_SENDME,sid,new Buffer(0),this.prev_.Db_hash);
			this.stream_encrypt_or_b(stream.toBuffer(),Cell.prototype.RELAY,true);
			delete this.prev_;
		};
	},
	relay_db_info_handle:function(stream) {
		console.log('receive relay_db_info CID '+this.circId);
		let lh,p,fa,hash_name,f,boo;
			lh=stream[0];
			stream=stream.slice(1);
			hash_name=stream.slice(0,lh).toString('hex');
			stream=stream.slice(lh);
			p=stream[0];
			stream=stream.slice(1);
			if (stream.length) {
				fa=stream[0];
			};
			console.log('db_info '+hash_name+' part '+p+' fac '+(fa?'yes':'no'));
			f=OR_files[hash_name];
			if (f) {
				f.forEach(function(val) {if (val[0]===this) {boo=true}},this);
				if (!boo) {
					f.push([this,null,null,0]);
				};
			} else {
				OR_files[hash_name]=[[this,null,null,0]];
			};
	},
	relay_db_query_handle:function(stream) {
		let sid=stream.streamId.readUInt();
		console.log('receive relay_db_query CIC '+this.circId+' sid '+sid);
		stream=stream.data.slice(0,stream.length.readUInt());
		let l=stream[0];
		stream=stream.slice(1);
		let hash=stream.slice(0,l).toString('hex');
		stream=stream.slice(l);
		l=stream[0];
		stream=stream.slice(1);
		let csize=parseInt(stream.slice(0,l).toString('hex'),16);
		stream=stream.slice(l);
		console.log('Receive db_query for '+hash+' on CID '+this.circId+' sid '+sid+' requesting '+csize+' bytes '+stream.toString('hex'));
		if (!this.OP_) {
			console.log('ORDB receive db_query for '+hash+' on CID '+this.circId+' sid '+sid+' requesting '+csize+' bytes ');
			let f=OR_files[hash]; //[circ,hash_file,size,0]
			if (f) {
				f.sort(function(a,b) { //sort min to max
					let a3=a[3];
					let b3=b[3];
					return a3===b3?0:(a3<b3?-1:1);
				}).sort(function(a,b) { //put destroyed circuits at the begining
					if (!a[0].socket_){
						return -1;
					};
					if (!b[0].socket_) {
						return 1;
					};
					return 0;
				});
				let l=f.length;
				f.forEach(function(val) {console.log('f has '+val[0].circId+' valid '+(val[0].socket_?'yes':'no'))});
				if (l) {
					while (f.length) { //remove destroyed circuits
						if (!f[0][0].socket_) {
							console.log('ORDB remove '+f[0][0].circId);
							f[0][0].circuit_destroy();
							f.shift();
						} else if (!f[0][0].socket_.remoteAddress) {
							console.log('ORDB remove '+f[0][0].circId);
							f[0][0].circuit_destroy();
							f.shift();
						} else if (f[0][0].destroyed_) {
							console.log('ORDB remove destroyed CIC '+f[0][0].circId);
							f.shift();
						} else {
							break;
						};
					};
					if (f.length) {
						let d_or=f[0][0];
						f[0][3]++;
						let tid=Rand(16);
						let param={d_length:csize,hash_:new Buffer(hash,'hex')};
						OR_tid[tid.toString('hex')]=[this,sid,f,param,1];
						d_or.send_db_query(param,tid);
					};
				};
			} else {
				console.log('ORDB does not know the file');
				this.send_db_end(0,sid);
			};
		} else {
			let tid=stream.slice(0,16);
			let first=this.first_;
			if (hash!==TEST_HASH) {
				let objectStore=open_db();
				let a=objectStore.get(hash);
				a.onsuccess=(function(evt) {
					let res=evt.target.result;
					if (res) {
						if ((res.file_length===res.current_length)&&(csize<res.file_length)) {
							res.data=(res.data instanceof Blob)?res.data:(new Blob(res.data));
							let file=res.data.slice(csize);
							let size=res.file_length;
							let type;
							if ((res.type!==res.data.type)||(res.enc)) {
								type=res.type+';'+(res.data.type||res.enc);
							} else {
								type=res.type;
							};
							let sid=init_connected_request(first);
							console.log('Have file '+hash+' length '+size+' to be sent '+csize+' tid '+tid.toString('hex')+' '+(file.size||file.byteLength)+' CID '+first.circId+' sid '+sid);
							first.send_db_connected(size,sid,type,tid);
							first.send_db_data(file,sid);
						} else {
							first.send_db_end(0,sid,tid);
						}
					} else {
						first.send_db_end(0,sid,tid);
					};
				}).bind(this);
			} else {
				first.send_db_end(0,sid,tid);
			};
		};
	},
	relay_db_connected_handle:function(stream) {
		let sid=stream.streamId.readUInt();
		console.log('receive relay_db_connected CID '+this.circId+' sid '+sid);
		stream=stream.data.slice(0,stream.length.readUInt());
		if (this.OP_) {
			let l=stream[0];
			stream=stream.slice(1);
			let size=parseInt(stream.slice(0,l).toString('hex'),16);
			stream=stream.slice(l);
			l=stream.slice(0,2).readUInt();
			stream=stream.slice(2);
			let type=stream.slice(0,l).toString('utf8');
			let request=this.first_[sid];
			console.log('relay_db_connected type '+type);
			if (request) {
				$_('alert_box').style.display='none';
				request.flowc=request.flowc?request.flowc:(Date.now()-request.query_time);
				console.log('db_query/db_connected '+(Date.now()-request.query_time)+' ms '+request.flowc);
				clearTimers(request.query_t0);
				request.clength_=size;
				request.pieces=Math.ceil(request.clength_/BSIZE);
				request.content_=type;
				request.sid_=sid;
				request.received_=0;
				request.sent_=0;
				request.nb_try=0;
				request.stream_window=STREAM_WINDOW_PEER;
				request.stream_window_s=STREAM_WINDOW_PEER;
			};
		} else {
			let tid=stream.slice(0,16).toString('hex');
			stream=stream.slice(16);
			let l=stream[0];
			stream=stream.slice(1);
			let size=parseInt(stream.slice(0,l).toString('hex'),16);
			stream=stream.slice(l);
			l=stream.slice(0,2).readUInt();
			stream=stream.slice(2);
			let type=stream.slice(0,l).toString('utf8');
			let i_or=OR_tid[tid];
			if (['start'].indexOf(type)===-1) { //handle next db_connected
				delete OR_tid[tid];
			};
			console.log('db_connected '+tid+' type '+type+' size '+size+' '+(typeof i_or));
			this.nb_query=0;
			if (i_or) {
				if (this.socket_) {
					if (i_or[0].socket_) {
						i_or[0].send_db_connected(size,i_or[1],type);
						OR_csid_b[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid]=i_or; //[this,sid]
						OR_csid_f[i_or[0].socket_.remotePort+'-'+i_or[0].socket_.remoteAddress+'-'+i_or[0].circId+'-'+i_or[1]]=[this,sid];
						this[sid]={}; //db_destroy
						i_or[0][i_or[1]]={}; //db_destroy
						console.log('i_or associated with remote port '+this.socket_.remotePort+' remote address '+this.socket_.remoteAddress+' CIC '+this.circId+' Stream '+sid);
						console.log('f_or associated with remote port '+i_or[0].socket_.remotePort+' remote address '+i_or[0].socket_.remoteAddress+' CIC '+i_or[0].circId+' Stream '+i_or[1]);
					};
				} else {
					i_or[0].send_db_end(0,i_or[1]);
				};
			};
		};
	},
	relay_db_end_handle:function(stream) {
		let sid=stream.streamId.readUInt();
		stream=stream.data.slice(0,stream.length.readUInt());
		let reason=stream.slice(0,1).readUInt();
		console.log('receive db_end sid '+sid+' reason '+reason+' CIC '+this.circId);
		if (this.OP_) {
			let first_=this.first_;
			let request=first_[sid];
			if (request) {
				request.db_end.call(this,reason);
			};
		} else {
			this.nb_query=0;
			if (stream.length>1) { //coming from serving OP
				console.log('db_end with tid CIC '+this.circId+' db_test length '+(this.db_test?this.db_test.length:''));
				if (this.db_test) {
					this.db_test.forEach(function(val) {clearTimeout(val);});
				};
				let tid=stream.slice(1,17).toString('hex');
				let i_or=OR_tid[tid];
				if (i_or) {
					let f=i_or[2];
					let cursor=i_or[4];
					if (f[cursor]) {
						i_or[4]++;
						let d_or=f[cursor][0];
						d_or.send_db_query(i_or[3],new Buffer(tid,'hex'));
						console.log('try another peer '+d_or.circId+' tid '+tid+' stream length '+stream.length);
					} else {
						i_or[0].send_db_end(reason,i_or[1]);
						delete OR_tid[tid];
					};
				};
			} else { //coming from requesting or serving OP without tid
				console.log('forwarding db_end');
				let f_or=OR_csid_f[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid];
				if (f_or) {
					try {
						if (reason!==3) {
							delete OR_csid_b[f_or[0].socket_.remotePort+'-'+f_or[0].socket_.remoteAddress+'-'+f_or[0].circId+'-'+f_or[1]];
							delete OR_csid_f[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid];
							delete f_or[0][f_or[2]];
						};
						f_or[0].send_db_end(reason,f_or[1]);
					} catch(ee) {};
				} else {
					let b_or=OR_csid_b[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid];
					if (b_or) {
						try {
							b_or[0].send_db_end(reason,b_or[1]);
							delete OR_csid_f[b_or[0].socket_.remotePort+'-'+b_or[0].socket_.remoteAddress+'-'+b_or[0].circId+'-'+b_or[1]];
							delete OR_csid_b[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid];
							delete b_or[0][b_or[2]];
						} catch(ee) {};
					};
				};
				delete this[sid];
			};
		};
	},
	relay_db_data_handle:function(stream) {
		let sid=stream.streamId.readUInt();
		stream=stream.data.slice(0,stream.length.readUInt());
		if (this.OP_) {
			let first_=this.first_;
			let request=first_[sid];
			if (request) {
				//_write_:2-4 Mbps
				//sendme p2p: 500ms
				if (request.received_===0) {
					console.log('start_t0 received '+Date.now());
					request.start_t0=Date.now();
					first_.send_db_sendme(sid);
				};
				request.received_++;
				first_.received_++;
				request.stream_window--;
				request._write_(stream);
				let m=request.received_;
				let current_rate=parseInt(stream.length*request.received_/((Date.now()-request.start_t0)/1000)); //Kbps
				let nbBlocs=Math.ceil((current_rate*((request.flowc/2)/1000))/stream.length);
				nbBlocs=Math.ceil((STREAM_WINDOW_PEER-nbBlocs>0)?(Math.min(nbBlocs,STREAM_WINDOW_PEER*(1-FLOWC))):(STREAM_WINDOW_PEER*(1-FLOWC)));
				let timeout;
				let sendme_=function(m) {
					let sendme_tout=function(rec) {
						console.log('sendme timeout received_ '+request.received_+' rec '+rec+' stream-blocs '+(STREAM_WINDOW_PEER-nbBlocs));
						if (request.received_===rec) {
							clearTimers(request.sendme_tout);
							clearTimers(request.waiting_);
							console.log('resuming peer to peer download received '+request.received_);
							first_.send_db_end(1,sid);
							first_.relay_db_end_handle({streamId:(new Buffer(2)).writeUInt(sid),length:(new Buffer(2)).writeUInt(1),data:(new Buffer(1)).writeUInt(2)});
						} else {
							sendme_(request.received_);
						};
					};
					clearTimers(request.sendme_tout);
					clearTimers(request.waiting_);
					console.log(current_rate*8+' bps nbBlocs '+nbBlocs+' stream window '+request.stream_window+' - sending sendme stream received '+(first_.received_*stream.length)+' - Buffer Amount: '+client.bufferedAmount+' '+Date.now());
					first_.send_db_sendme(sid);
					request.stream_window +=STREAM_WINDOW_PEER;
					console.log('sendme timeout '+timeout+' stream length '+stream.length);
					request.sendme_tout.push(setTimeout(function() {sendme_tout(m)},timeout));
				};
				if (request.stream_window===nbBlocs) {
					if ((client.bufferedAmount===0)||(first_.received_*stream.length<BUFFERED_AMOUNT_MAX)||(request.waiting_)) {
						request.last_sendme=Date.now();
						if (current_rate) {
							timeout=Math.ceil(((STREAM_WINDOW_PEER-nbBlocs)*stream.length/(current_rate))*1000)+SENDME_TOUT;
						} else {
							timeout=SENDME_TOUT;
						};
						sendme_(m);
					} else {
						clearTimers(request.sendme_tout);
						clearTimers(request.waiting_);
						request.waiting_.push(setTimeout(function() {console.log('timeout waiting_ buffered '+client.bufferedAmount);sendme_(m)},(Date.now()-(request.last_sendme||request.start_t0))));
						console.log(current_rate*8+' bps nbBlocs '+nbBlocs+' - waiting before sending sendme stream received '+(first_.received_*stream.length)+' - Buffer Amount: '+client.bufferedAmount+' '+Date.now());
					};
				};
			};
		} else {
			let i_or=OR_csid_b[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid];
			if (i_or) {
				i_or[0].send_db_data(stream,i_or[1]);
			};
		};
	},
	relay_db_sendme_handle:function(stream) {
		let sid=stream.streamId.readUInt();
		if (this.OP_) {
			console.log('OP received sendme sid '+sid+' resuming - buffered amount '+this.first_.socket_.bufferedAmount);
			let first_=this.first_;
			let request=first_[sid];
			if (request) {
				let pause=request.pause_[sid];
				request.stream_window_s +=STREAM_WINDOW_PEER;
				console.log('stream_window '+request.stream_window_s+' sent '+request.sent_+' fc_t '+request.fc_t.length);
				if (pause) {
					delete(request.pause_[sid]);
					first_.send_db_data(pause,sid,false,true);
				};
			};
		} else {
			let f_or=OR_csid_f[this.socket_.remotePort+'-'+this.socket_.remoteAddress+'-'+this.circId+'-'+sid];
			if (f_or) {
				f_or[0].send_db_sendme(f_or[1]);
			};
		};
	}
};

const send_data=function(cd,sid,request,nb_blocks) {
	//browser
	if (request) {
		if (!request.stop_) {
			nb_blocks=(typeof nb_blocks==="undefined")?DEF_BLOCKS:nb_blocks;//modif zero timeout
			let cells=[];
			request.reader.onload=(function(evt) {
				if (evt.target.result) {
					let res=(evt.target.result instanceof ArrayBuffer)?(new Uint8Array(evt.target.result)):evt.target.result;
					if (res.length) {
						for (let i=0;i<nb_blocks;i++) {
							if (request.stream_window_s!==0) {
								request.stream_window_s--;
								cells.push(res.slice(0,Math.min(res.length,Stream.prototype.PAYLOAD_STREAM)));
								if (res.length>Stream.prototype.PAYLOAD_STREAM) {
									res=res.slice(Stream.prototype.PAYLOAD_STREAM);
								} else {
									break;
								};
							} else {
								request.cursor -=res.length;
								break;
							};
						};
					};
				};
				let t0=Date.now();
				request.fc_t.push((function() {flush.call(this,cd,cells,request,sid,t0)}).bind(this));
				window.postMessage('flush', "*");
			}).bind(this);
			if (nb_blocks!==0) {
				let chunk=cd.slice(request.cursor,Math.min(cd.size,request.cursor+nb_blocks*Stream.prototype.PAYLOAD_STREAM));
				request.cursor +=(typeof chunk.length!=='undefined')?chunk.length:chunk.size;
				request.reader.readAsArrayBuffer(chunk);
			} else {
				request.reader.onload({target:{result:null}});
			};
		};
	};
};

const flush_=function(event) {
	if (event.source==window&&event.data==this.messageName) {
		event.stopPropagation();
		if (this.fc_t.length) {
			let fn=this.fc_t.shift();
			fn();
		};
	};
};

const flush=function(cd,cells,request,sid,t0) {
	cells.forEach(function(data) {
		request.sent_+=data.length;
		let stream=new Stream(Stream.prototype.RELAY_DB_DATA,sid,data,this.last_.Df_hash);
		let cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
		this.send(cell);
	},this);
	let nb_bl;
	let t_=Date.now()-t0;
	let buffered=this.socket_.bufferedAmount;
	let real_bandwidth=parseInt((request.cursor-buffered)/((Date.now()-request.start_t0)/1000)); //Bytes per second
	let bps=real_bandwidth*8;
	let limit=DOWN_LIMIT;
	if (request.cursor<BSIZE*STREAM_WINDOW_PEER/2) {
		nb_bl=STREAM_WINDOW_PEER/4;
	} else if (bps>limit) {
		nb_bl=0;
	} else {
		let nb_buff=(BUFFERED_AMOUNT_MAX>buffered)?(Math.ceil((BUFFERED_AMOUNT_MAX-buffered)/BSIZE)):0;
		if (t_) {
			nb_bl=Math.ceil(((t_*real_bandwidth/1000)/BSIZE)/(FLOWC));
		};
		nb_bl=nb_bl?Math.min(nb_buff,nb_bl):nb_buff;
	};
	nb_bl=(bps>limit)?0:((buffered>BUFFERED_AMOUNT_MAX)?0:((nb_bl>DEF_BLOCKS)?nb_bl:DEF_BLOCKS));
	if ((request.stream_window_s===0)&&(!request.pause_[sid])) {
		console.log(parseInt(8*(request.cursor)/((Date.now()-request.start_t0)/1000))+' kbps');
		console.log('Pausing download CIC '+this.circId+' for stream '+sid+' sent '+request.sent_+' remaining length '+(cd.size-request.cursor)+' time '+Date.now()+' buffered amount '+buffered+' fc_t '+request.fc_t.length);
		request.pause_[sid]=cd;//pause
	} else {
		if (cd.size===request.cursor) {
			console.log('delete sid');
			delete(this[sid]);
			console.log(parseInt((8*request.cd_length/((Date.now()-request.start_t0)/1000)))+' bps');
		} else {
			this.send_db_data(cd,sid,nb_bl,true);
		};
	};
};

module.exports=Extended;