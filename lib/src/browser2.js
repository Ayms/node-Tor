const {$_,addEvent,delEvent,Myprompt,remove,Myalert,hide,show,delete_,hide_menu,property2_,add_menu_event,del_menu_event,clear_menu,workerjs,rand_hash,remove_ext,thumb,xhr,test_bandwidth,getmouseY,getmouseX,detkey,magnet,update_circ,get_extension}=require('./browser_utils.js');
const {Tor}=require('./circuits.js');
const {clearTimers,url_decode,get_request,simpleParser,delete_request,open_db}=require('./utils.js');
const {crypto,Hash,Rand}=require('./crypto.js');
const {ini_nosocks_request}=require('./sockets2.js');
const {clear_requests}=require('./requests.js');
Buffer=require('./browser_buffers.js');

let key_stored
let crashed;
let restore_chunk;
let peersm_started;

const show_menu=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	let men=$_('menu2');
	men.style.display='none';
	men=$_('menu');
	men.style.top=getmouseY(e)+'px';
	men.style.left=getmouseX(e)+'px';
	men.style.display='block';
	$_('open').getElementsByTagName('a').item(0).href=URL.createObjectURL(this.blob_);
	add_menu_event.call(this,'delete',delete_);
	add_menu_event.call(this,'reload',reload_);
	if (this.clength_===this.d_length) {
		hide($_('reload'));
	} else {
		show($_('reload'));
	};
};

const show_menu2=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble=true;
	if (db_cid&&NB_C>=1) {
		let men=$_('menu');
		men.style.display='none';
		men=$_('menu2');
		men.style.top=getmouseY(e)+'px';
		men.style.left=getmouseX(e)+'px';
		men.style.display='block';
		$_('open2').getElementsByTagName('a').item(0).href=URL.createObjectURL(this.blob_);
		add_menu_event.call(this,'delete2',delete2_);
		add_menu_event.call(this,'rename2',rename2_);
		add_menu_event.call(this,'property2',property2_);
		if (this.d_length===this.clength_) {
			hide($_('reload2'));
		} else {
			show($_('reload2'));
			add_menu_event.call(this,'reload2',reload2_);
		};
		let t=this.blob_.type||(this.content_chrome?this.content_chrome:this.content_);
		if ((this.key)||((t!==this.content_))||(get_extension(this.name_)==='enc')) {
			hide($_('encrypt2'));
			show($_('decrypt2'));
			add_menu_event.call(this,'decrypt2',decrypt2_);
		} else {
			show($_('encrypt2'));
			add_menu_event.call(this,'encrypt2',encrypt2_);
			hide($_('decrypt2'));
		};
	} else {
		Myalert('<p style="text-align:center">Not enough circuits established - Please wait to see at least one Peer to Peer circuit and one Direct Download circuit</p>');
	};
};

const add_thumb=function(request) {
	setTimeout(function() {$_('alert_box').style.display='none'},10000);
	let old=$_(request.hash_ini);
	request.thumb2_=thumb(request,request.hash_ini);
	if (old) {
		$_('local').insertBefore(request.thumb2_,old);
	} else {
		$_('local').appendChild(request.thumb2_);
	};
	if (request.d_length!==request.clength_) {
		request.thumb2_.firstChild.style.backgroundColor='orange';
		if (request.thumb_) {
			request.thumb_.firstChild.style.backgroundColor='orange';
		};
	};
	addEvent(request.thumb2_,'mousedown',show_menu2.bind({file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb2_:request.thumb2_,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,content_chrome:request.content_chrome,blob_:request.blob_}),false);
	remove(old);
};

const add_thumb_=function(request) {
	let old=request.thumb_;
	request.thumb_=thumb(request);
	if (old) {
		if (old.parentNode) {
			$_('downloaded').insertBefore(request.thumb_,old);
			remove(old);
		} else {
			$_('downloaded').appendChild(request.thumb_);
		};
	} else {
		$_('downloaded').appendChild(request.thumb_);
	};
	addEvent(request.thumb_,'mousedown',show_menu.bind(request),false);
};

const rename2_=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	hide_menu('menu2');
	let request=this;
	let func=function() {
		if (this.value) {
			let objectStore=open_db();
			let a=objectStore.get(request.hash_ini);
			a.onsuccess=(function(evt) {
				if (evt.target.result) {
					evt.target.result.name=this.value;
					request.name_=this.value;
					objectStore.put(evt.target.result);
					if (request.thumb_) {
						add_thumb_(request);
					};
					add_thumb(request);
				};
			}).bind(this); //this is input
		};
	};
	Myprompt("<p style='text-align:center'>Enter new name:</p>",func);
};

const delete2_=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	hide_menu('menu2');
	let objectStore=open_db();
	objectStore.delete(this.hash_ini);
	remove(this.thumb2_);
	remove(this.thumb_);
};

const open_db2=function() {
	let db=peersmDB.db;
	return db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
};

const compute_hash=function(request,data) {
	console.log('compute hash');
	request.file_hash=0;
	addEvent(document.body,'mousedown',function() {},false);
	Myalert("<p style='text-align:center'>Calculating hash for a resumed file, please wait...</p>");
	$_('progress-alert').style.display='block';
	$_('progint-alert').style.width='0%';
	let blob=request.blob_;
	let worker=new Worker(URL.createObjectURL(new Blob([workerjs],{type:'text/javascript'})));
	let size=blob.size;
	let tsize=0;
	worker.onmessage=function(evt) {
		let res=evt.data.pop?0:parseInt(evt.data);
		tsize +=res;
		$_('progint-alert').style.width=parseInt(100*tsize/size)+'%';
		if (evt.data.pop) {
			$_('progress-alert').style.display='none';
			setTimeout(function() {$_('alert_box').style.display='none'},10000);
			request.file_hash=evt.data[0];
			let fin=function() {
				add_thumb_(request);
				add_thumb(request);
				store_DB_final(request,data);
			};
			request.queue_.push(fin);
			addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
			if (request.queue_.length===1) {
				request.queue_[0]();
			};
		};
	};
	worker.postMessage(['hash',blob]);
};

const process_upload=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	addEvent(document.body,'mousedown',function() {},false);
	Myalert("<p style='text-align:center'>Uploading file from your disk to your browser storage...please wait until the file appears in the Local files box, this can take some time depending on the size of the file</p>");
	$_('progress-alert').style.display='block';
	$_('progint-alert').style.width='0%';
	let file=this.files[0];
	let file_enc=[];
	let request={};
	let h=file.name.split('#');
	if (h.length>1) {
		let tmp=h[1].split('.');
		request.name_=h[0]+(tmp.length>1?('.'+tmp[1]):'');
	} else {
		request.name_=file.name;
	};
	request.blob_=chrome?(new Buffer(0)):file;
	request.content_=file.type;
	request.clength_=file.size;
	request.d_length=file.size;
	request.url_='';
	request.queue_=[];
	if (h.length>1) {
		request.hash_ini=h[1].split('.')[0];
	} else {
		request.hash_ini=rand_hash();
	};
	let size=file.size;
	let tsize=0;
	let worker=new Worker(URL.createObjectURL(new Blob([workerjs],{type:'text/javascript'}))); //TODO replace by webcrypto hash
	worker.onmessage=function(evt) {
		let data=evt.data;
		let res=data.pop?(chrome?(new Buffer(0)):0):data;
		tsize +=chrome?res.length:parseInt(res);
		let l=tsize;
		if (chrome) {
			file_enc.push(res);
			if ((tsize%DB_BLOCK===0)||(tsize===size)) {
				let buff=file_enc;
				let execute=function() {
					$_('progint-alert').style.width=parseInt(100*l/size)+'%';
					if (!data.pop) {
						request.file_hash='00';
						request.d_length=tsize;
						store_DB2(request,buff);
					} else {
						request.check_hash=true;
						request.file_hash=data[0];
						addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
						$_('progress-alert').style.display='none';
						console.log('uploaded '+request.file_hash);
						store_DB(request,true);
					};
				};
				file_enc=[];
				request.queue_.push(execute);
				if (request.queue_.length===1) {
					request.queue_[0]();
				};
			};
		} else {
			$_('progint-alert').style.width=parseInt(100*l/size)+'%';
			if (evt.data.pop) {
				request.check_hash=true;
				request.file_hash=evt.data[0];
				$_('progress-alert').style.display='none';
				console.log('uploaded '+request.file_hash);
				store_DB(request,true);
			};
		};
	};
	worker.postMessage([chrome?'hashc':'hash',file]);
};

let restoring_chunk=function() {
	for (let n in crashed) {
		console.log('restoring_chunk');
		let request=crashed[n];
		if (request.k) {
			request.file_id=request.k[0];
			delete request.k;
			let type=request.data.type||(request.content_chrome?request.content_chrome:request.content_);
			request.blob_=new Blob([],{type:type});
			if (request.hash_ini) {
				store_DB(request);
			} else {
				console.log('deleting chunks file_id '+request.file_id);
				let t=peersmDB.db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
				t.openCursor().onsuccess = function(evt) {
					let cursor = evt.target.result;
					if (cursor) {
						let res=cursor.value.k;
						if (res instanceof Array) {
							if (res[0]===request.file_id) {
								t.delete(res);
							};
						};
						cursor.continue();
					};
				};
			};
		};
	};
};

const fin_=function() {
	console.log('execute fin');
	this.eof_=true;
	this.queue_=[];
	this.queue_s=[];
	if (this.cid_) {
		if (this.cid_===db_cid) {
			console.log('sending db_end CIC '+this.cid_.circId+' sid '+this.sid_);
			this.cid_.send_db_end(1,this.sid_);
		} else {
			if (this.d_length<this.clength_) {
				this.cid_.send_relay_end(this.sid_);
			};
		};
		this.cid_.destroy_cid(this);
	};
	load_Blob_Url(this);
};

const stop_=function() {
	hide_menu('menu');
	if (!this.eof) {
		this.nb_try=DB_NB_TRY+1;
		clearTimers(this.query_t0);
		clearTimers(this.sendme_tout);
		clearTimers(this.waiting_);
		clearTimeout(this.mp4box_t0);
		this.pieces=0;
		if (this.cid_) {
			if (this.cid_===db_cid) {
				this.cid_.send_db_end(1,this.sid_);
			} else {
				if (this.d_length<this.clength_) {
					this.cid_.send_relay_end(this.sid_);
				};
			};
			this.cid_.destroy_cid(this);
		};
		this.eof_=true;
		this.queue_=this.queue_||[];
		this.queue_.push(fin_.bind(this));
		setTimeout(function() {Myalert("<p style='text-align:center'>Stopping download, please wait that pending data are processed, use resume to restart</p>")},500);
		if (this.queue_.length===1) {
			this.queue_[0]();
		};
	};
};

const progress_bar=function(cont,request) {
	let l=request.d_length||0;
	let t=request.clength_||0;
	let p=0;
	if (t) {
		p=parseInt((l/t)*100);
	};
	let a=document.createElement('div');
	a.className='progress';
	let d=document.createElement('p');
	d.className='bar';
	d.innerHTML=PROGTXT+p+'%'
	let b=document.createElement('div');
	b.className='progcont';
	let c=document.createElement('div');
	c.className='progint';
	c.style.width=p+'%';
	b.appendChild(c);
	a.appendChild(d);
	a.appendChild(b);
	cont.appendChild(a)
	a.progtxt=d;
	a.progbar=c;
	addEvent(a,'mousedown',stop_.bind(request),false);
	return a;
};

const reload_=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	let request=this;
	request.nb_try++;
	request.db_try=0;
	request.params_.db_=true;
	request.reload_=true;
	if (request.sid_) {
		delete request.cid_[request.sid_];
		delete request.sid_;
	};
	delete request.cid_;
	delete request.eof_;
	delete request.check_hash;
	delete request.last_saved;
	delete request.file_id;
	delete request.start_t0;
	clearTimers(request.query_t0);
	request.name_=this.name_||'';
	request.queue_=[];
	request.queue_s=[];
	request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
	request.cid_=db_cid;
	hide_menu('menu');
	remove(request.thumb_);
	request.bar_=progress_bar($_('downloaded'),request);
	Tor(request);
};

const reload2_=function(e) {
	// this {file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb:null,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,blob_:request.blob_}
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	let request=init_d_request(this.url_,this.hash_ini);
	request.clength_=this.clength_;
	request.d_length=this.d_length;
	request.content_=this.content_;
	request.reload2_=true;
	request.thumb2_=this.thumb2_;
	delete request.eof_;
	delete request.last_saved;
	delete request.file_id;
	delete request.start_t0;
	request.queue_=[];
	request.queue_s=[];
	request.name_=this.name_||'';
	clearTimers(request.query_t0);
	request.nb_try++;
	request.db_try=0;
	request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
	request.cid_=db_cid;
	hide_menu('menu2');
	remove(this.thumb_);
	request.bar_=progress_bar($_('downloaded'),request);
	Tor(request);
};

const store_DB=function(request,boo,cb) {
	console.log('store_DB ');
	addEvent(document.body,'mousedown',function() {},false);
	if ((request.nb_try!==DB_NB_TRY)&&(!request.reason_)) {
		Myalert("<p style='text-align:center'>Storing file, please wait that the file appears in Local Files (for large files this can take some time)</p>");
	};
	peersmDB.store=function() {
		let t0;
		let data;
		let arr=chrome?[]:null;
		let i=0;
		let chunkStore=open_db2();
		request.file_id=request.file_id||0;
		let a=chunkStore.get([request.file_id,i]);
		let type=(request.blob_ instanceof Uint8Array)?(request.content_chrome?request.content_chrome:request.content_):request.blob_.type;
		let blob=new Blob([],{type:type});
		a.onsuccess=function(evt) {
			let res=evt.target.result;
			if (res) {
				let data=res.data;
				if (!(data instanceof Array)) {
					blob=new Blob([blob,data],{type:type});
				} else {
					data.unshift(blob);
					blob=new Blob(data,{type:type});
				};
				if (chrome) {
					if (data instanceof Array) {
						data.shift();
						arr=arr.concat(data);
					} else {
						arr.push(data);
					};
				};
				chunkStore.delete([request.file_id,i]);
				i++;
				a=chunkStore.get([request.file_id,i]);
				a.onsuccess=this.onsuccess;
			} else {
				console.log('Saving chunks size '+blob.size+(t0?(' time to read all chunks '+(Date.now()-t0)):''));
				if (chrome) {
					if (request.blob_ instanceof Array) {
						arr=arr.concat(request.blob_);
					} else {
						arr.push(request.blob_);
					};
				};
				request.blob_=new Blob([blob,request.blob_],{type:type});
				let objectStore=open_db();
				let a=objectStore.get(request.hash_ini);
				console.log('store_DB open');
				let tmp=Date.now();
				a.onsuccess=function(evt) {
					console.log('store_DB success '+(Date.now()-tmp));
					let result=evt.target.result;
					if (result) {
						remove($_(result.name_hash));
						if (!chrome) {
							data=new Blob([result.data,request.blob_],{type:type});
							request.blob_=data;
						} else {
							data=result.data.concat(arr);
							request.blob_=new Blob(data,{type:(request.content_chrome?request.content_chrome:request.content_)});
						};
					} else {
						data=chrome?arr:request.blob_;
					};
					if (!request.name_) {
						let t=request.blob_.type||(request.content_chrome?request.content_chrome:request.content_);
						request.name_=request.hash_ini.substr(0,8);
						if (t!==request.content_) {
							request.name_=request.name_+'.'+ENC_EXT;
						};
					};
					request.file_hash=request.file_hash||0;
					request.d_length=request.blob_.size;
					if (!boo) {
						add_thumb_(request);
					};
					if (!cb) {
						add_thumb(request);
					};
					if ((!request.check_hash)&&(request.clength_===request.d_length)) {
						compute_hash(request,data);
					} else {
						store_DB_final(request,data,cb);
					};
					console.log('Chunks saved '+(Date.now()-tmp));
					$_('alert_box').style.display='none';
					addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
				};
			};
		};
	};
	peersmDB.store();
};

const store_DB_final=function(request,data,cb) {
	request.file_hash=request.file_hash||0;
	let objectStore=open_db();
	if (!chrome) {
		objectStore.put({hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data});
	} else {
		objectStore.put({hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data,enc:request.content_chrome||''});
	};
	if (cb) {
		cb(request);
	} else {
		if (request.d_length===request.clength_) {
			if (db_cid) {
				db_cid.send_db_info();
			};
		};
		delete_request(request);
	};
};

const store_DB2=function(request,data) {
	//data: Blob if not chrome, Uint8Array if chrome
	let db=peersmDB.db;
	let tx=db.transaction([peersmcode+'_'],'readwrite');
	let objectStore=tx.objectStore(peersmcode+'_');
	if (!request.name_) {
		let type=request.blob_.type||(request.content_chrome?request.content_chrome:request.content_);
		request.name_=request.hash_ini.substr(0,8);
		if (type!==request.content_) {
			request.name_=request.name_+'.'+ENC_EXT;
		};
	};
	if (!request.file_id) {
		request.file_id=Date.now();
		request.chunk_nb=0;
	} else {
		request.chunk_nb++;
	};
	//{hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data}
	objectStore.put({k:[request.file_id,request.chunk_nb],file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,content_:request.content_,clength_:request.clength_,d_length:request.d_length,url_:request.url_,key:(request.key?request.key:''),data:data});
	let queue=request.queue_;
	queue.shift();
	if (queue.length) {
		queue[0]();
	};
};

const load_Blob_Url=function(request) {
	if (request.blob_) {
		if (request.check_hash) {
			request.file_hash=request.check_hash.digest('hex');
		}
		console.log('Blob loaded '+request.d_length+' '+(request.file_hash||''));
		store_DB(request);
		remove(request.bar_);

	} else {
		remove(request.bar_);
	};
};

const appendbuffer=function(request,val) {
	if (request.received_===val) {
		$_('alert_box').style.display='none';
		request._source_.addEventListener('updateend',function() {
			updateend(request);
		});
		updateend(request);
	} else if (request.received_>val) {
		if (request.append_cursor===0) {
			request.wait_chunk=true;
		};
		if (request.wait_chunk) {
			let seg=Math.min(Math.ceil((request.clength_-request.d_length)/BSIZE),VIDEO_APPEND/4);
			request.append_cursor++;
			if (request.append_cursor>=seg) {
				delete request.wait_chunk;
				updateend(request);
			};
		};
	};
};

const load_Blob=function(buff,request) {
	//console.log('buff '+buff.toString());
	if (!request.eof_) {
		let process=function(data) {
			return function() {
				request.d_length +=data.length;
				if (!request.blob_) {
					request.content_=request.content_||'application/octet-binary';
					let enc=request.content_.split(';');
					if (enc.length>1) {
						request.content_=enc[0]; //real type
						request.content_chrome=enc[1]||'application/octet-binary'; //save info encrypted
					};
					request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
					if ((!request.reload2_)&&(!request.reload_)) {
						request.check_hash=new Hash('sha1');
						let objectStore=open_db();
						objectStore.delete(request.hash_ini);
					};
					if (!request.clength_) {
						remove(request.bar_);
					};
				};
				if (chrome) {
					request.blob_=request.blob_.length?[request.blob_,data].concatBuffers():data;
				} else {
					request.blob_=new Blob([request.blob_,data],{type:(request.content_chrome?request.content_chrome:request.content_)});
				};
				if (request.check_hash) {
					request.check_hash.update(data);
				};
				if (request.clength_) {
					let size=request.blob_.size||request.blob_.length||request.blob_.byteLength;
					if ((size>=FILE_BLOCK)&&(request.d_length<request.clength_)) {
						request.queue_=request.queue_||[];
						let execute=function(data) {
							return function() {
								store_DB2(request,data);
							};
						};
						request.queue_.push(execute(request.blob_));
						request.blob_=chrome?(new Buffer(0)):(new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)}));
						if (request.queue_.length===1) {
							request.queue_[0]();
						};
					} else {
						if (request.d_length>=request.clength_) {
							console.log('Queue fin '+request.d_length+' '+request.clength_+' '+(parseInt((8*BSIZE*request.received_/((Date.now()-request.start_t0)/1000)))+' bps ')+(request.blob_.size||request.blob_.length||request.blob_.byteLength));
							clearTimers(request.sendme_tout);
							clearTimers(request.waiting_);
							request.eof_=true;
							request.queue_.push(fin_.bind(request));
							if (request.queue_.length===1) {
								request.queue_[0]();
							};
						};
					};
					if (request.clength_||(request.d_length>=request.clength_)) {
						let prog=parseInt((request.d_length/request.clength_)*100);
						request.bar_.progtxt.innerHTML=PROGTXT+parseInt(request.d_length/1000)+' kB';
						request.bar_.progbar.style.width=prog+'%';
					};
					request.queue_s.shift();
					if (request.queue_s.length) {
						request.queue_s[0]();
					};
				};
			};
		};
		request.queue_s=request.queue_s||[];
		request.queue_s.push(process(buff));
		if (request.queue_s.length===1) {
			request.queue_s[0]();
		};
	} else {
		console.log('EOF');
	};
};

const load_files=function() {
	peersmDB.list=function(func) {
		let objectStore=peersmDB.db.transaction([peersmcode],'readwrite').objectStore(peersmcode);
		objectStore.openCursor().onsuccess = function(event) {
		  let cursor=event.target.result;
			if (cursor) {
				let val=cursor.value;
				func(val);
				cursor.continue();
			} else {
				if (restore_chunk) {
					restoring_chunk();
				};
			};
		};
	};
	peersmDB.list(thumb_db_list);
};

const thumb_db_list=function(val) {
	if (chrome) {
		val.data=new Blob(val.data,{type:val.enc?val.enc:val.type});
	};
	let thumb2=thumb(val,val.name_hash);
	$_('local').appendChild(thumb2);
	addEvent(thumb2,'mousedown',show_menu2.bind({file_hash:val.hash,hash_ini:val.name_hash,name_:val.name,thumb2_:thumb2,clength_:val.file_length,d_length:val.current_length,content_:val.type,url_:val.file_url,key:val.key,content_chrome:val.enc||'',blob_:val.data}),false);
	if (val.file_length!==val.current_length) {
		thumb2.firstChild.style.backgroundColor='orange';
	};
};

const load=function(url) {
	if (db_cid&&NB_C>1) {
		console.log('Start loading url');
		let request=init_d_request(url,null);
		if ((request.hash_ini.length===40)&&(!isNaN(Number('0x'+request.hash_ini)))) {
			request.d_length=0;
			remove(request.thumb_);
			remove($_(request.hash_ini));
			request.bar_=progress_bar($_('downloaded'),request);
			if (request.bar_) {
				Tor(request);
			};
		} else {
			Myalert('<p style="text-align:center">Please enter a valid reference (hash_name, magnet link, infohash or url)</p>');
		};
	} else {
		Myalert('<p style="text-align:center">Not enough circuits established - Please wait to see at least one Peer to Peer circuit and one Direct Download circuit</p>');
	};
};

const init_d_request=function(url,hash) {
	if (!hash) {
		let mag=magnet(url);
		if (mag) {
			hash=mag;
			url='';
		} else if ((url.indexOf('http')!==-1)||(url.indexOf('https')!==-1)) {
			let H=crypto.createhash('sha1');
			H.update(new Buffer(url,'utf8')); //TODO check url www or not, etc
			hash=H.digest('hex');
		} else {
			hash=url;
			url='';
		};
	};
	let request=ini_nosocks_request(url);
	request.params_.hash_=new Buffer(hash,'hex');
	request.hash_ini=hash;
	request.url_=url;
	url=url_decode(url);
	request.params_.stream=get_request(url.host,url.rest);
	request.params_.host=url.host+':'+((url.protcol==='https')?'443':'80');
	request.params_.db_=true;
	request.cid_=db_cid;
	request.download_=init_download(request);
	request.d_length=0;
	request.nb_try=0;
	let tmp=url.rest.split('/');
	request.name_=tmp.length?(tmp[tmp.length-1]):'';
	request._write_=function(buff) {load_Blob(buff,this)};
	request.queue_=[];
	request.db_try=0;
	request.sendme_tout=[];
	request.waiting_=[];
	request.queue_s=[];
	request._stream_=false;
	return request;
};

const init_download=function(request) {
	request.unexpected_=function(error) {
		Myalert('<p style="text-align:center">An unexpected event occured(error '+error+'), please retry</p>');
		remove(request.bar_);
	};
	request.process_=function() {
		addEvent(document.body,'mousedown',function() {},false);
		if ((!request._data_)&&(!request.nb_try)) {
			Myalert('<p style="text-align:center">File not available from Peers, starting direct download from '+this.last_.server_.ip+'</p>');
		} else { //resume
			request._data_=0;
			Myalert('<p style="text-align:center">Resuming direct download from '+this.last_.server_.ip+'</p>');
		};
		setTimeout(function(){$_('alert_box').style.display='none';addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);},12000);
	};
	request.start_=function(resp) {
		let parse;
		request._data_=true;
		resp=request.wait_header?[request.wait_header,resp].concatBuffers():resp;
		parse=simpleParser(resp.toString('utf8'));
		if ((typeof parse['1a']==='undefined')||(parse['1a']!=='')) { //header not complete
			request.wait_header=resp;
			return;
		} else {
			delete request.wait_header;
		};
		let status=parse['0a'].split(' ');
		status=status[1]?status[1]:null;
		if (status) {
			oconsole('STREAM : status code '+status+' for request '+request.i_id);
			status=status.toString();
			if (['2','3'].indexOf(status[0])===-1) {
				Myalert('<p style="text-align:center">Wrong URL, please check and try again</p>');
				remove(request.bar_);
				first_.send_relay_end(request.sid_);
				return;
			} else {
				if (status[0]==='3') {
					if (parse['Location']) {
						let url=url_decode(parse['Location']);
						request.params_.stream=get_request(url.host,url.rest);
						first_.send_relay_end(request.sid_);
						delete first_[request.sid_];
						delete request.cid_;
						Tor(request);
					};
					return;
				} else {
					request.d_length=request.d_length||0;
					if (parse['Content-Type']) {
						request.content_=parse['Content-Type'];
					} else {
						request.content_='application/octet-binary';
					};
					if ((parse['Content-Length'])&&(!request.clength_)) {
						request.clength_=parseInt(parse['Content-Length']);
					};
					if (!request.clength_) {
						for (let n in parse) {
							if (n.toLowerCase().indexOf('content-length')!==-1) {
								request.clength_=parseInt(parse[n]);
								break;
							};
						};
					};
					request.pieces=Math.ceil(request.clength_/BSIZE);
					if (parse['Transfer-Encoding']) {
						request.encoding_=parse['Transfer-Encoding'];
					};
					console.log('Start relay_data');
					console.log(request.content_);
					console.log(request.clength_);
					console.log(request.encoding_?request.encoding_:'No encoding');
					resp=(resp.toString('hex')).split(CRLF+CRLF);
					resp.shift();
					resp=new Buffer(resp.join(CRLF+CRLF),'hex');
				};
			};
		};
		return resp;
	};
	request.end_=function() {
		if (request.url_) { //direct download
			let resume=function() {
				request.queue_.shift();
				Myalert('<p style="text-align:center">Remote server closed the connection (error '+error+'), download could not be completed, resuming...</p>');
				setTimeout(function(){$_('alert_box').style.display='none'},10000);
				let cb=function(request) {
					let url=url_decode(request.url_);
					request.blob_=new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)});
					request.params_.stream=get_resume(url.host,url.rest,length);
					request.queue_=[];
					request.queue_s=[];
					delete request.eof_;
					delete first_[id];
					delete request.cid_;
					delete request.check_hash;
					delete request.file_id;
					delete request.start_t0;
					request.received_=0;
					Tor(request);
				};
				store_DB(request,true,cb);
			};
			request.queue_.push(resume);
			if (request.queue_.length===1) {
				request.queue_[0]();
			};
		} else {
			addEvent(document.body,'mousedown',function() {},false);
			Myalert('<p style="text-align:center">Remote server closed the connection (error '+error+'), download could not be completed, please use Resume to resume the download.</p>');
			if (!request.eof_) {
				request.eof_=true;
				request.queue_.push(fin_.bind(request));
				if (request.queue_.length===1) {
					request.queue_[0]();
				};
			};
		};
	};
	request.fin_=function() {
		if (!request.eof_) {
			request.eof_=true;
			request.queue_.push(fin_.bind(request));
			if (request.queue_.length===1) {
				request.queue_[0]();
			};
		};
	};
	request.db_end=function(reason) {
		if (!request.send_data) { //requesting OP
			clearTimers(request.query_t0);
			clearTimers(request.sendme_tout);
			clearTimers(request.waiting_);
			if ((reason!==2)&&(!request.reason_)&&(reason!==3)) {
				if (request.url_) {
					if ((!request.reload2_)&&(!request.reload_)) {
						console.log('direct download');
						this.destroy_cid(request);
						delete request.params_.db_;
						delete request.content_;
						delete request.d_length;
						delete request.clength_;
						delete request.blob_;
						Tor(request); //direct download - request.cid_ removed to chose another one than db_cid
					} else { //resume
						console.log('resuming direct download');
						let cb=function(request) {
							let length=request.d_length;
							request.blob_=new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)});
							let url=url_decode(request.url_);
							request.params_.stream=get_resume(url.host,url.rest,length);
							delete request.params_.db_;
							delete request.cid_;
							delete first_[sid];
							delete request.file_id;
							delete request.start_t0;
							request.received_=0;
							Tor(request);
						};
						store_DB(request,true,cb);
					};
				} else {
					addEvent(document.body,'mousedown',function() {},false);
					Myalert('<p style="text-align:center">The file is currently not available from peers in Peersm and Bittorrent networks and can not be downloaded directly, please check the URL or the Hash Name you are using</p>');
					delete_request(request);
					remove_bars(request);
				};
			} else {
				clearTimers(request.sendme_tout);
				clearTimers(request.waiting_);
				request.reason_=2;
				let fin=function() {
					if (request.nb_try<DB_NB_TRY) {
						console.log('Resuming peer download');
						request.queue_.shift();
						let cb=function(request) {
							request.params_.db_=true;
							delete first_[sid];
							delete request.cid_;
							delete request.eof_;
							delete request.check_hash;
							delete request.file_id;
							delete request.start_t0;
							request.received_=0;
							request.reload_=true;
							request.queue_=[];
							request.queue_s=[];
							request.blob_=new Blob([],{type:(request.content_chrome?request.content_chrome:request.content_)});
							//request.last_saved=result.data;
							request.cid_=db_cid;
							request.nb_try++;
							request.db_try=0;
							Tor(request);
						};
						store_DB(request,true,cb);
					} else if (request.nb_try===DB_NB_TRY){
						addEvent(document.body,'mousedown',function() {},false);
						Myalert('<p style="text-align:center">The remote peers closed the connections during the download, attempts to resume failed, storing downloaded part, please wait that the file appears in Local Storage.</p><p style="text-align:center">Use resume later to get the complete file.</p>');
						load_Blob_Url(request);
						delete request.reason_;
					};
				};
				request.queue_=request.queue_||[];
				request.queue_.push(fin);
				if (request.queue_.length===1) {
					request.queue_[0]();
				};
			};
		} else { //serving OP
			if (request.fc_t) {
				if (request.fc_t.length) {
					console.log('queue not empty - stop sending');
					request.stop_=true; //stop sending data
				} else {
					console.log('queue empty - delete request');
					delete first_[sid];
				};
			};
		};
	};
	request.no_answer=function() {
		this.send_db_end(1,sid);
		delete request.sid_;
		Myalert('<p style="text-align:center">No answer from the network, changing peer to peer circuits, please wait and retry</p>');
		remove(request.bar_);
		console.log('db_query no answer circuit destroy');
		db_cid.circuit_destroy();
		db_cid=null;
	};
	request._fin_=fin_;
	return true;
};

const encrypt_decrypt_w=function() {
	// {file_hash:request.file_hash,hash_ini:request.hash_ini,name_:request.name_,url:url,thumb:null,thumb_:request.thumb_,clength_:request.clength_,d_length:request.d_length,content_:request.content_,url_:request.url_,key:request.key,blob_:request.blob_}
	let decrypt=this.key;
	hide_menu('menu2');
	addEvent(document.body,'mousedown',function() {},false);
	if (decrypt) {
		setTimeout(function() {Myalert("<p style='text-align:center'>"+(decrypt?'De':'En')+"crypting file... Please wait until the file appears in the Local files box, this can take some time depending on the size of the file</p>")},800);
	} else {
		Myalert("<p style='text-align:center'>"+(decrypt?'De':'En')+"crypting file... Please wait until the file appears in the Local files box, this can take some time depending on the size of the file</p>");
	};
	$_('progress-alert').style.display='block';
	$_('progint-alert').style.width='0%';
	let key=decrypt?(new Buffer(decrypt,'hex')):Rand(16);
	let file=this.blob_;
	let size=file.size;
	let clone={file_hash:'00',hash_ini:rand_hash(),name_:(decrypt?(remove_ext(this.name_)):(this.name_+'.'+ENC_EXT)),clength_:size,d_length:0,content_:this.content_,url_:this.url_,key:(decrypt?'':key.toString('hex')),content_chrome:decrypt?null:(chrome?'application/binary':null),blob_:(chrome?(new Buffer(0)):(new Blob([],{type:decrypt?this.content_:'application/octet-binary'}))),queue_:[]};
	let tsize=0;
	if (decrypt) {
		let objectStore=open_db();
		let a=objectStore.get(this.hash_ini);
		a.onsuccess=(function(evt) {
			if (evt.target.result) {
				let res=evt.target.result;
				res.key=decrypt;
				this.key=decrypt;
				addEvent(this.thumb2_,'mousedown',show_menu2.bind({file_hash:this.file_hash,hash_ini:this.hash_ini,name_:this.name_,url:url,thumb2_:this.thumb2_,thumb_:this.thumb_,clength_:this.clength_,d_length:this.d_length,content_:this.content_,url_:this.url_,key:this.key,content_chrome:this.content_chrome,blob_:this.blob_}),false);
				objectStore.put(res);
			};
		}).bind(this);
	};
	let worker=new Worker(URL.createObjectURL(new Blob([workerjs])));
	let file_enc=[];
	let buff;
	worker.onmessage=(function(evt) {
		let data=evt.data;
		let res=(data instanceof Array)?data[0]:data;
		if (!(data instanceof Array)) {
			tsize +=res.length;
		};
		let l=tsize;
		file_enc.push(res);
		if ((tsize%DB_BLOCK===0)||(tsize===size)) {
			let buff=file_enc;
			let execute=(function() {
				$_('progint-alert').style.width=parseInt(100*(l/size))+'%';
				if (!(data instanceof Array)) {
					this.file_hash='00';
					this.d_length=l;
					store_DB2(this,chrome?buff:(new Blob(buff,{type:decrypt?this.content_:'application/octet-binary'})));
				} else {
					this.check_hash=true;
					this.file_hash=res;
					addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
					$_('progress-alert').style.display='none';
					store_DB(this,true);
				};
			}).bind(this);
			file_enc=[];
			this.queue_.push(execute);
			if (this.queue_.length===1) {
				this.queue_[0]();
			};
		};

	}).bind(clone);
	worker.postMessage(['aes-128-ctr',file,key,IV]);
};

const encrypt2_=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	encrypt_decrypt_w.call({file_hash:this.file_hash,hash_ini:this.hash_ini,name_:this.name_,url:url,thumb2_:this.thumb2_,thumb_:this.thumb_,clength_:this.clength_,d_length:this.d_length,content_:this.content_,url_:this.url_,key:this.key,blob_:this.blob_});
};

const decrypt2_=function(e) {
	if (e.stopPropagation) {e.stopPropagation();};
	e.cancelBubble = true;
	let request={file_hash:this.file_hash,hash_ini:this.hash_ini,name_:this.name_,content_:this.content_,url:url,thumb2_:this.thumb2_,thumb_:this.thumb_,clength_:this.clength_,d_length:this.d_length,content_:this.content_,url_:this.url_,key:this.key,blob_:this.blob_};
	if ((this.blob_.type!==this.content_)||(get_extension(this.name_)==='enc')) {
		if (this.key) {
			encrypt_decrypt_w.call(request);
		} else {
			//ask for the key
			let func=function() {
				let key=this.value;
				if (key.length===32) {
					request.key=key;
					encrypt_decrypt_w.call(request);
				} else {
					setTimeout(function() {Myalert("<p style='text-align:center'>Please enter a valid key</p>")},800);
				};
			}; //this is input
			Myprompt("<p style='text-align:center'>Enter key:</p>",func);
		}
	} else {
		Myalert("<p style='text-align:center'>This is not an encrypted file</p>")
	};
};

const _init=function() {
	let peersm_started,routers;
	test_bandwidth();
	setInterval(test_bandwidth,5*3600*1000);
	Guards=JSON.parse(xhr('guards').split('=')[1].split(';')[0]); //This is loading the Guards and Relays, you can set a periodical update
	Exit=JSON.parse(xhr('exit').split('=')[1].split(';')[0]); //This is loading the Exits, you can set a periodical update
	Relays=Guards;
	show($_('debug'));
	unleash();
	$_('alert_box').style.display='none';
	try {
		peersmDB=indexedDB.open(peersmcode,6);
	} catch(ee) {
		$_('prompt_box').style.display='none';
		Myalert("<p style='text-align:center'>Your browser does not seem to support all the features required for Peersm. It is recommended to use Firefox version 26 or superior, or Chrome version 32 or superior.</p>");
		return;
	};
	peersmDB.onupgradeneeded=function(evt) {
		console.log('onupgradeneeded------------------');
		let db=evt.target.result;

		if(db.objectStoreNames.contains(peersmcode+'_')) {
			db.deleteObjectStore(peersmcode+'_');
		};
		if(db.objectStoreNames.contains(peersmcode)) {
			db.deleteObjectStore(peersmcode);
		};
		db.createObjectStore(peersmcode,{keyPath:'name_hash'});
		db.createObjectStore(peersmcode+'_',{keyPath:'k'});
	};
	peersmDB.onsuccess=function (evt) {
		console.log('Success opening database');
		peersmDB.db=evt.target.result;
		if (!key_stored) {
			let t=peersmDB.db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
			t.put({k:'00112233445566778899aabbccddeeff'}); //not used any longer
		};
		let t=peersmDB.db.transaction([peersmcode+'_'],'readwrite').objectStore(peersmcode+'_');
		crashed={};
		chrome=(navigator.userAgent.indexOf('Chrome')!==-1)?true:false;
		t.openCursor().onsuccess = function(evt) {
			let cursor=evt.target.result;
			if (cursor) {
				let res=cursor.value.k;
				if (!(res instanceof Array)) {
					key_stored=true;
				} else {
					let val=cursor.value;
					let index=val.k[0];
					if (!(crashed.hasOwnProperty(index))) {
						console.log('restoring chunks '+index);
						crashed[index]=val;
						//{k[file_id,nb],hash:request.file_hash,name_hash:request.hash_ini,name:request.name_,type:request.content_,file_length:request.clength_,current_length:request.d_length,file_url:request.url_,key:(request.key?request.key:''),data:data}
					};
				};
				cursor.continue();
			} else {
				if (store_DB) {
					restoring_chunk();
				} else {
					restore_chunk=true;
				};
			};
			if (!peersm_started) {
				peersm_started=true;
				start_download(); //nlnet start peersm
			};
		};
		$_('debug').checked='checked';
	};
	peersmDB.onerror=function(err) {
		console.log('Error opening database');
	};
};

const start_download=function() {
	console.log('start Peersm');
	let div=$_('input');
	let input=document.createElement('input');
	input.id='url';
	input.value='Enter_url_or_hash_name';
	div.appendChild(input);
	example=input.value;
	input.onkeydown = function(xevent) {
		addEvent(document.body,'mousedown',function() {},false);
		if ((detkey.call(this,xevent||window.event))&&(this.value!=='')) {
			addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);
			load(this.value);
		};
	};
	let button=$_('ok');
	addEvent(button,'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble = true;addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false);load(input.value)},false);
	let file_upload=$_('file_upload');
	addEvent(file_upload,'change',process_upload,false);
	addEvent(document.body,'mousedown',function() {setTimeout(clear_menu,1000)},false); //pb click not detected
	addEvent($_('dialog-message'),'mousedown',function(e) {if (e.stopPropagation) {e.stopPropagation();};e.cancelBubble=true;},false);
	let nb=(db_cid?1:0)+(NB_C>=0?NB_C:0);
	$_('direct_text').innerHTML='Direct and P2P anonymized circuits : '+nb+(nb>1?' circuits':' circuit');
	show($_('direct_text'));
	show($_('peer_text'));
	$_('prompt-input').removeAttribute('type');
	load_files();
};

const websocket_create=function(OR) {
	console.log('start websocket');
	let socket=new WebSocket('ws://'+OR.ip+':'+OR.wsport);
	socket.write=socket.send;
	socket.binaryType="arraybuffer";
	socket.setNoDelay=function() {};
	socket.connect=function() {};
	socket.WS_OP_=true;
	socket.onopen=websocket_start;
	socket.onmessage=function(evt) {
		let data=(evt.data instanceof ArrayBuffer)?(new Uint8Array(evt.data)):evt.data;
		if ((WS_TLS)&&(socket===client)) {
			console.log('received-----------------------------------------------');
			console.log(data.toString('hex'));
			if (!forge_buffers) {
				socket.abstract_client_tls.process(data);
			} else {
				socket.abstract_client_tls.process(data.toString('binary'));
			};
		} else {
			on_data.call(this,data)
		};
	};
	socket.onclose = function() {
		console.log('Websocket closed ws://'+OR.ip+':'+OR.wsport);
	};
	socket.destroy=socket.close;
	socket.bufferSize=socket.bufferedAmount;
	socket.remoteAddress=OR.ip;
	socket.remotePort='';
	socket.address=function() {return {port: 0,family:'IPv4',address: '127.0.0.1' }};//dummy
	socket.setKeepAlive=function() {};
	return socket;
};

const websocket_start=function() {
	console.log('websocket connected');
	this.connected_=true;
	this.wsconnected_=true;
	this.ws_=true;
	console.log('launch db_cid');
	this.db_cid_launched=true;
	Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:this,db:true}});
};

const unleash=function() {
	console.log('unleash');
	client=websocket_create(one_OR);
	client.onclose=function() {
		console.log('Websocket closed ws://'+one_OR.ip+':'+one_OR.wsport);
		db_cid=null;
		delete OP_sock[one_OR.ip];
		delete client.db_cid_launched;
		delete client.tls_connected;
		delete client.wsconnected_;
		if (client.abstract_client_tls) {
			client.abstract_client_tls.close();
		};
		clear_requests(client);
		update_circ();
		setTimeout(unleash,2000);
	};
};

module.exports=_init;