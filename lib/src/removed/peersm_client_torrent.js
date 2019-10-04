if (peersm_client) {
	var magnet='magnet:?xt=urn:btih:'+hash;
	var CLOSEST={};
	var PEERS=[];
	console.log('looking for torrent '+magnet+' myip '+myip);
	var sid=init_connected_request(first);
	first.send_db_connected(0,sid,'torrent',tid); //wait response from torrent network, do not send db_query again for the requester
	var fakeinfohash=hash.substr(0,AB_PREFIX/4)+crypto.randomBytes((160-AB_PREFIX)/8).toString('hex');
	console.log('fake infohash '+fakeinfohash);
	start_DHT();
	var ini_dht=dht({debug:false,freerider:false,blocklist:blocked,myip:myip});
	first[sid].__ini_dht__=ini_dht;
	var nodeId=ini_dht.nodeId.toString('hex');
	ini_dht.on('ready',function() {
		first.send_db_connected(0,sid,'dhtready',tid);
		console.log('dht ready - starting lookup for infohash '+fakeinfohash+' '+(new Date().toTimeString()));
		ini_dht.lookup(fakeinfohash);
	});
	var onpeer=function(addr) {
		var ip=addr.split(':')[0];
		if (!blocked.contains(ip)) {
			console.log('new spy '+addr,true);
			blocked.add(ip);
			Arrayblocklist.push(ip);
		};
	};
	var onnode=function(addr,nodeId) {
		var pre=prefix(nodeId.toString('hex'),fakeinfohash);
		var ip=addr.split(':')[0];
		if (!blocked.contains(ip)) {
			if ((pre>=PREF_MIN)&&(pre<=PREF_MAX)) {
				var host=addr.split(':')[0];
				host=host.split('.');
				host.reverse();
				host=host.join('.')+'.'+BL_URL;
				var cb=function(bool) {
					if (bool) {
						//console.log('adding '+addr+' to closest ');
						CLOSEST[addr]=nodeId;
					} else {
						console.log('--------------- potential spy '+addr);
						onpeer(addr);
					};
				};
				//console.log('checking dnsbl '+host);
				dnsbl_lookup(host,cb);
			};
		};
	};
	var dnsbl_lookup=function(host,callback) {
		dns.resolve(host,function(err,addresses) {
			if (err) {
				if (err.code==='ENOTFOUND' ){
					return callback(true);
				} else {
					return callback();
				};
			} else {
				return callback();
			};
		});
	};
	ini_dht.on('peer',onpeer);
	ini_dht.on('node',onnode);
	ini_dht.on('closest',function() {
		ini_dht.removeListener('peer',onpeer);
		ini_dht.removeListener('node',onnode);
		first.send_db_connected(0,sid,'start',tid);
		console.log('starting torrent for '+magnet+' nb of closest nodes: '+ini_dht.closest_from_infohash.length);
		//var torrent=bittorrent(magnet,{connections:100,path:pathd+'node_modules/torrent',verify:true,dht:true});
		var torrent=bittorrent(magnet,{blocklist:Arrayblocklist||null,connections:20,path:pathd+'node_modules/torrent',verify:true,debug:false,freerider:true,dht:ini_dht});
		var onsettorrent=function() {
			var queue_speer=[];
			if (!Array.isArray(CLOSEST)) {
				var tmp=[];
				Object.keys(CLOSEST).forEach(function(val) {
					tmp.push({addr:val,id:CLOSEST[val]});
				});
				CLOSEST=tmp;
				tmp=[];
			};
			console.log('Number of closest '+CLOSEST.length)
			if (!CLOSEST.length) {
				CLOSEST=ini_dht.closest_from_infohash;
			};
			if (CLOSEST) {
				console.log('settorrent dht ready',true);
				var check_peer2=function(err,res,addr) {
					if (!err) {
						if (res.values) {
							var c=res.values.length;
							var rate=c>PEER_MIN?PEER_RATE:0;
							var l=Math.ceil(c*rate);
							res.values.forEach(function(add,i) {
								if (i>l) {
									if (!blocked.contains(add.split(':')[0])) {
										PEERS.push(add);
									} else {
										console.log('------------- blocked spy '+add,true);
									};
								};
							})
						};
					};
					if (queue_speer.length) {
						queue_speer.shift()();
					} else {
						var tmp=[];
						PEERS=unique.call(PEERS);
						PEERS.sort(function() {return 0.5 - Math.random()});//TODO - better random
						console.log('launch torrent nb_peers '+PEERS.length);
						if (PEERS.length>=PEER_MIN) {
							PEERS.forEach(function(addr) {
								var ip=addr.split(':')[0];
								if (tmp.indexOf(ip)===-1) {
									tmp.push(ip);
								} else {
									console.log('----------- potential spy');
									onpeer(addr);
								};
							});
						};
						PEERS.forEach(function(addr) {
							torrent.discovery.emit('peer',addr);
						});
					};
				};
				if (CLOSEST.length>20) {
					var tmp=[];
					var tmp2=[];
					CLOSEST.forEach(function(contact) {
						var ip=contact.addr.split(':')[0];
						if (tmp.indexOf(ip)===-1) {
							tmp.push(ip);
							tmp2.push(contact);
						};
					});
					CLOSEST=tmp2;
					CLOSEST.sort(function() {return 0.5 - Math.random()});
					CLOSEST=CLOSEST.slice(0,20);
				};
				CLOSEST.forEach(function (contact,i) {
					var addr=contact.addr;
					var ip=addr.split(':')[0];
					console.log(addr,true);
					queue_speer.push(function() {
						console.log('sending getpeer to '+addr);
						ini_dht._sendGetPeers(addr,hash,function(err,res) {check_peer2(err,res,addr)});
					});
				});
				if (queue_speer.length) {
					queue_speer.shift()();
				};
			} else {
				console.log('settorrent dht not ready, retry later');
				setTimeout(onsettorrent,RETRY);
			};
		};
		torrent.on('setTorrent',onsettorrent);
		//var torrent=bittorrent(magnet);
		first[sid].__torrent__=torrent;
		torrent.on('ready', function() {
			if (torrent.files.length) {
				console.log('torrent ready');
				var file={length:0};
				var streamres;
				torrent.files.forEach(function(fl) {if (fl.length>file.length) {file=fl}});
				console.log('sid '+sid+' csize '+csize+' file length '+file.length);
				if (csize<file.length) {
					var type;
					var ext=get_extension(file.name);
					if (ext) {
						type=ext_to_type[ext];
					};
					if (!type) {
						type='application/octet-binary';
					};
					console.log('filename '+file.name+' length '+file.length+' type '+type);
					file.size=file.length;
					if ((type.indexOf('video')!==-1)||(type.indexOf('audio')!==-1)) { //TODO change for mp4
						type='video/webm';
					};
					first.send_db_connected(file.length,sid,type,tid);
					var request=first[sid];
					request.fc_t=[];
					request.cd_length=file.length;
					request.reader=new FileReader_torrent;
					request.cursor=csize||0;
					console.log('cursor csize '+csize);
					request._torrent_=new Blob_torrent(file.length-request.cursor);
					if (!request._stream_) {
						request.down_limit=TORRENT_DOWN_LIMIT;
					};
					request._torrent_stream=file.createReadStream({start:csize,end:file.length});
					//option start:csize end:

					if (((type.indexOf('video')!==-1)||(type.indexOf('audio')!==-1))&&(ext!=='webm')) { //TODO change for mp4
						var n=0;
						var a='-i - -y -acodec libvorbis -vcodec libvpx -maxrate 750k -minrate 550k -bufsize 1600k -b:v 600k -keyint_min 48 -g 48 -sc_threshold 0 -ab 96k -f webm pipe:1';
						console.log('spawning ffmpeg '+a);
						a=a.split(' ');
						child=child_process.spawn(FFMPEG_BIN_PATH,a,{cwd:os.tmpdir()});
						child.stdin.on('error',function(err) {console.log('stdin error '+console.log(err.message))});
						child.stderr.on('data', function(chunk) {
							//if (!(n%10)) {
								console.log(' Transcoding still active: '+chunk.toString());
							//};
							n++;
						});
						child.on('exit',function(code) {
							console.log('---- Transcoding finished -----')
						});
						request._torrent_stream.pipe(child.stdin);
						streamres=child.stdout;
					} else {
						streamres=request._torrent_stream;
					};
					streamres.on('data',function(chunk) {
						var nb_peer_left=0;
						torrent.swarm._queues.forEach(function(val) {nb_peer_left +=val.length});
						console.log('got for torrent sid '+sid+' '+chunk.length+' bytes of data - offset '+request._torrent_stream._piece+' - nb peers: '+torrent.swarm.wires.length+' - other peers '+nb_peer_left);
						console.log(chunk.toString('hex'));
						request._torrent_.push(chunk);
						if (request.cursor===csize) {
							request.start_t0=Date.now();
							send_data.call(first,request._torrent_,sid,request);
						};
					});
					request._torrent_stream.on('end',function() {
						console.log('torrent stream end ----');
						console.log('destroying torrent engine');
						destroy_torrent(request);
						/*if (torrent.files.length) {
							first.send_db_end(3,sid);
							torrent.emit('ready');
						} else {
							first.send_db_end(0,sid);
						};*/
						//first.send_db_end(0,sid);
					});
					request._torrent_stream.on('close',function() {
						if (request.fc_t) {
							if (request.fc_t.length) {
								console.log('queue not empty - stop sending');
								request.stop_=true; //stop sending data
							} else {
								console.log('queue empty - delete request');
								delete first[sid];
							};
						};
						console.log('destroying torrent engine');
						destroy_torrent(request);
					});
					var nbwires=0;
					var onbwires=0;
					var peers=function() {
						nbwires=torrent.swarm.wires.length;
						if (nbwires!==onbwires) {
							console.log('--- Peers in swarn:',true)
							torrent.swarm.wires.forEach(function(wire) {
								console.log(wire.peerAddress,true);
							});
						};
						onbwires=nbwires;
					};
					setInterval(peers,10000);
				} else {
					console.log('bad torrent file');
					destroy_torrent(request);
					first.send_db_end(0,sid);
				};
			} else {
				console.log('no torrent files');
				destroy_torrent(request);
				first.send_db_end(0,sid);
			};
			//request._torrent_stream.on('download',function(p,data) {console.log('download '+p+' '+data.length)});
		});
	});
}