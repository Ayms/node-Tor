node-Tor API documentation and Dev Guide
===

## General design

The initial design was based on a simple call to the ``Tor`` function with a ``request`` object, depending on the ``request`` properties ``Tor`` will create circuits or choose one and process ``request``

Even if simple, the issue was that ``request`` object properties were mixed between different layers, for example the http protocol and the Tor protocol, making it difficult to implement for any protocol

The Duplex object ``node_Tor`` is replacing this now (except for automatic circuits creation) and any protocol can be chained and piped to it, for example ``http.pipe(gzip).pipe(tls).pipe(node_Tor)`` (https) where http, gzip and tls are also ``Duplex Objects``

Each chaining must be seen as a request which will select/create a circuit (``cid``) and associate a stream (``sid``)to it, therefore we have:

	node_Tor.cid_=cid
	node_Tor.sid_=sid
	cid[sid]=node_Tor

This means that each instance is using one circuit and one stream id, typically ``http.pipe(gzip).pipe(tls).pipe(node_Tor)`` will be used for one https request then closed, or all requests will be piped to the same stream, or any protocol will be piped to the selected circuit/stream, to change circuit/stream a new instance must be created or the already existing one can be modified

## Circuits creation and monitor_circuits

``monitor_circuits`` is supposed to be called by interval for any implementation, it will create ``NB_C`` circuits and check/renew circuits over time

Peers for circuits are chosen according to ``guards.js`` and ``exit.js``, those two files content can be customized/replaced according to your peer discovery system, the default is to retrieve them from our servers, they contain updated Tor network nodes according to the result of execution of ``build-relays_and_dirs.js``, please refer to the main page doc for this and the publish process

Creation of circuits is performed using:

	Tor({params_:{OP:true,nb_hop:NB_DB_HOP,ws:client or false,db:true or false}});
		OP indicates the Onion Proxy function (first node in the path)
		nb_hop is the number of hops (default 3)
		ws indicates the connection from a Websocket (browsers)
		db indicates a RDV circuit if true

## Circuits selection

``params_`` as shown above contains the main parameters related to a circuit and a ``node_Tor`` instance, when its ``one_c`` property is ``true`` a call to ``Tor(node_Tor)`` will select a circuit among the existing ones, it can be called also via ``Tor(node_Tor,circuit)`` to select a given circuit

## The Duplex Object and Evented pipes

The ``Duplex Object`` is defined in [pipe.js](https://github.com/Ayms/node-Tor/tree/master/lib/src/pipe.js) and represents any object that can be piped in node-Tor, for each constructor it is set by ``piping.call(this)``

It does implement two duplex streams, one forward and one backward:

	this._stream_f=new stream.Duplex();
	this._stream_b=new stream.Duplex();

And a ``pipe`` method, when called by ``a.pipe(b)`` it will trigger a ``pipe`` event which does:

	b.piped_in=a
	a.piped_out=b
	a._stream_f.pipe(b._stream_f)
	b._stream_b.pipe(a._stream_b)

The duplex streams ``pipe`` method is the nodejs' one, basically when ``a`` is piped to ``b``, a read on ``a`` will call a write on ``b``, which probably could be designed better, because we are not supposed to need two duplex streams here but just one, see the [bug section](https://github.com/Ayms/node-Tor#related-bugsissues)

The ``Duplex Object`` implements also:

	this._stream_f._write=(function(data,enc,cb) {
		if (data) {
			this._stream_f.push(this._write_f(data)); //equivalent transform, process data and push the result
		};
		cb();
	}).bind(this);
	this._stream_b._write=(function(data,enc,cb) {
		if (data) {
			this._stream_b.push(this._write_b(data)); //equivalent transform, process data and push the result
		};
		cb();
	}).bind(this);

Which means that when you push on ``a`` (``a.push(chunk)``) ``_write_f`` of ``b`` will be called and when you push on ``b`` ``_write_b`` of ``a`` will be called, so you must define ``_write_f`` and/or ``_write_b``

In addition the ``Duplex Object`` propagates events forward and backward:

	this.emit_b=function() { //propagate events backward
		emit(...arguments);
		if (this.piped_in) {
			this.piped_in.emit_b(...arguments);
		};
	};
	this.emit_f=function() { //propagate events forward
		if (this.piped_out) {
			this.piped_out.emit_f(...arguments);
		};
		emit(...arguments);
	};

To turn any object to a Duplex one, just do:

	piping.call(object)

Then define ``_write_b`` and/or ``_write_f`` and how data will be pushed to the streams according to the protocol and the events

Note that when emitted forward the last peer in the chain will execute first the action associated to the event and this will go backward, and when emited backward this is the contrary starting by the first peer and propagating the way back

It does also propagate the ``params_`` forward which are the most important parameters as explained above (example: ``(new HTTP(url,params)).pipe(new node_Tor())``), and if needed ``init_request`` does the same for other properties:

	this.params_=stream.parent.params_||{}; //propagate params forward
	if (this.piped_in.init_request) {
		this.piped_in.init_request.call(this); //propagate required params from incoming pipe
	};

A typical setting for a ``Duplex Object`` is:

	const PROTOCOL=function(prop,params) {
		this.params_=params;
		this.prop=prop;
		piping.call(this);
		this.init();
	};
	PROTOCOL.prototype.init=function() {
		this.on('relay_connected',function() { //relay_connected send request
			this._stream_f.push(some_data);
		});
		//this.on('event',f); //handle other events
		this.write_b=function(data) { //called with _write when pipe reads from incoming _stream_b and calls write
			//process data
			this._stream_f.push(result_processed_data_or_other_data);
		};
	};
	PROTOCOL.prototype.init_request=function() {
		this.prop=this.piped_in.prop;
	};
	(new PROTOCOL(prop,params)).pipe(new node_Tor());

See some examples in [protocol.js](https://github.com/Ayms/node-Tor/tree/master/lib/src/protocol.js) or [http.js](https://github.com/Ayms/node-Tor/tree/master/lib/src/http.js) or [DBpeer.js](https://github.com/Ayms/node-Tor/tree/master/lib/src/DBpeer.js)

## The node_Tor Duplex Object

This is the Tor protocol layer implementing the following events and actions:

	this.on('unpipe',function() {
		this.emit_b('end');
	});
	this.on('end',function() { //abnormal end
		send relay_end and destroy circuit
	});
	this.on('fin',function() { //normal end
		send relay_end
	});
	this.on('pause',function() { //the piped stream must stop emitting
		this.pause_=true;
	});
	this.on('unpause',function() { //the piped stream can restart
		this.pause_=false;
	});
	this.on('relay_connected',function(cid) {
		response from relay_begin
		this.relay_connected=true;
		this.cid_=cid;
	});
	this.on('send_relay_connected',function(stream) {
		this.sid_=incoming stream sid
		this.cid_[sid]=this
	});
	this._write_f=function(data) {
		Bufferize data if any and start sending relay_data when relay_connected is true
	};
	this.on('pipe',function() {
		Call Tor(this) select existing circuit and send relay_begin on selected sid
	});

The events are propagated backward to the ``Duplex Object(s)`` piped to node_Tor

### The last node is not a node-Tor peer and implements the Exit function

relay_begin will specify the destination and the Exit node will set a TCP connection with the destination and send back a relay_connected message

### The last node is a node-Tor peer

While receiving a relay_begin the peer will send back a relay_connected message and do:

	let protocol=new PROTOCOL();
	protocol.pipe(new node_Tor());
	protocol.emit_b('send_relay_connected');

	node_Tor.on('pipe',function() {
		Do nothing in that case
	});

``PROTOCOL`` can of course implement the Exit function but the use case is more related to P2P exchanges between the OP and the destination, for example [Unix pipe](https://github.com/Ayms/node-Tor/blob/master/lib/src/protocol.js#L42)

## The node_Tor Duplex Object and the RendezVous (RDV) protocol

The RDV protocol is extending the Tor protocol, like hidden services but not the same way

	this.on('end',function() { //abnormal end
		//handle end
	});
	this.on('fin',function() { //normal end
		//handle fin
	});
	this.on('pause',function() {
		this.pause_=true;
		//stop sending
	});
	this.on('unpause',function() {
		this.pause_=false;
		//restart sending
	});
	this.on('created_circuit_rdv',function(cid) {
		Emitted when a RDV circuit is created
		this.cid_=cid;
		unpipe RDV object if any
	});
	this.on('send_rdv_info',function(payload) {
		send relay_rdv_info
		this is a hash to notify what we have and/or what protocol we support
	});
	this.on('send_relay_rdv_begin',function(payload) {
		send relay_rdv_begin with a hash
	});
	this.on('relay_rdv_begin',function(stream) {
		receive relay_rdv_begin
	});
	this.on('send_relay_rdv_connected',function(tid,payload,rdv) { //serving party - //rdv is the protocol used with rdv point - create a new instance not on the 0 channel
		let circ=this.cid_;
		let sid=choose_id(circ); //choose sid for serving party that will be associated to requesting party via tid
		let tor_=new node_Tor(); //new instance for sid to replace the one on channel 0
		tor_.sid_=sid;
		tor_.cid_=circ;
		circ[sid]=tor_;
		tor_.received_=0; //flow control received
		tor_.sent_=0; //flow control sent
		tor_.stream_window=STREAM_WINDOW; //flow control received
		tor_.stream_window_s=STREAM_WINDOW; //flow control sent
		rdv.pipe(tor_);
		circ.send_db_connected(sid,tid,payload); //will link sid with incoming sid on RDV point using tid
		tor_.relay_connected=true;
		tor_.sender=true; //used for debug to differentiate serving and requesting
	});
	this.on('relay_rdv_connected',function(stream) {
		//requesting party
		this.received_=0; //flow control received
		this.sent_=0; //flow control sent
		this.stream_window=STREAM_WINDOW; //flow control received
		this.stream_window_s=STREAM_WINDOW; //flow control sent
		this.relay_connected=true; //allow to send data
	});
	this._write_f=function(data) {
		Bufferize data if any and start sending relay_rdv_data when relay_connected is true
	};
	this.on('pipe',function() {
		if ((this.params_.rdv)&&(this.params_.dest)) {
			this.pipe(new RDV(Tor)); //create RDV circuit - circuit layer so not a real stream here but why not
		}
	});

### params_.rdv and params_.dest

``params_.db`` must always be true in that case to indicate a circuit using the RDV protocol

If ``params_.rdv`` is false then ``params_.dest`` will be chosen for the destination of default ``db_cid`` (see below)

If ``params_.rdv`` is true then node_Tor will call a ``RDV`` instance that will create a new RDV circuit toward params_.dest, it's a ``Duplex Object`` also while not really necessary, on circuit creation it will be unpiped from node_Tor instance

If both are absent then de default RDV circuit is ``db_cid``

### The RDV protocol

This is similar to the Tor Hidden services (without onion addresses that are not relevant at all here) or typical RDV protocol

The RDV circuits are those that are associated to ``params_.db true``

Each OP of the RDV circuits advertises periodically the RDV peers of what it has/does implement, using a hash (for example a file linked to the hash, or a protocol identified by the hash)

This is done using ``sid 0`` of the RDV circuits, a bit like the Tor protocol using ``circuit 0`` for the initial handshake

The RDV peers test also periodically the OP peers sending a hash set to 0 with a random tid on ``sid 0``

When an OP A sends a rdv_begin with a given hash on ``sid a``, the RDV peers will create a random tid and send the request on ``sid 0`` with tid to a peer B chosen randomely that has advertised this hash

When the target peer receives the message it will choose a ``sid b`` and send back a rdv_connected message including the tid on ``sid b``

The RDV peer will then associate ``sid b`` with ``sid a`` by correlating the tid to pipe further messages between A ``sid a`` and B ``sid b``

The RDV peer gets the messages decrypted but does not know who are A and B

The "requesting peer" is the one that initiates the connexion and the "serving peer" is the one it is connected to via the RDV point but the communications are bidirectionnal, the flow control is performed on both side following the sendme process between the OPs and the two circuits of the RDV OR

Example:

A and B are bitcoin nodes, they advertise a hash to their RDV points corresponding to the bitcoin protocol (for example the hash of "Satoshi Nakamoto"), A sends a rdv_begin, a RDV point chooses B, A and B can now communicate anonymously via the RDV point

Note that this is also possible without RDV point from direct node_Tor connection with A the OP and B the last node in the path, the difference being that A and B must know each other or at least know that they implement the bitcoin protocol

### The db_cid and ORDB

``db_cid`` is the default RDV circuit created by node-Tor, the last node of this circuit is ``DB_OR`` unless you required another one via ``params_.dest`` (see above)

This is more for demo purpose than anything else but gives a good example for the RDV protocol on serving peer side (and indexedDB browser storage):

	let info=new DB(); //send db_info for default DB circuit
	db_cid[0]=new node_Tor(); //0 is the default channel for db_info and test db_query -associate request to 0
	db_cid[0].sid_=0;
	info.params_={db:true};//only one param so node_Tor does nothing on pipe
	info.pipe(db_cid[0]);
	info.emit_f('created_circuit_rdv',db_cid);//send db_info for default DB circuit

Where DB is a [DBpeer.js](https://github.com/Ayms/node-Tor/tree/master/lib/src/DBpeer.js) instance implementing the ORDB protcol, which is to advertise what files you have stored in indexedDB and send them on request

Files are associated to a hash_name which is derived from what you are looking for, example: hash_of(http://ayms.me) will be used first to query peers if they have the file, then node-Tor will fallback queyring the url if nobody has it via non rdv circuits

### The circuits

The code handles the same way the OP and OR circuits, with communications backward and forward, and with the RDV protocol, which can make difficult to understand ``who is this?`` sometimes (where ``this`` is typically a circuit or a Duplex object) and who is doing what

#### OP circuit

	Created when ``Circuit`` is called with a path
	this.first_ is the first circuit
	this.prev_ is the previous circuit
	this.next_ is the next circuit where this.next_.prev_ has extended to
	this.last_ is the last circuit
	Parameters are associated to each ``Circuit`` instance like keys, socket, etc
	For each of them this.OP_ is true

#### OR circuits

The ORs manage one incoming circuit and one outgoing circuit when relevant

	(outgoing circuit).prev_=(incoming circuit)
	(incoming circuit).next_ or extended_=(outgoing circuit)

In case the OR is the final OR, there is no ``prev_`` and ``next_`` properties so ``this.prev_`` derives to ``this``

## Flow control

The first level of flow control is following the Tor protocol specifications with relay_sendme messages and associated sliding windows

The second one is following the nodejs' stream flow control

We did implement in the past a flow control more complex and more sophisticated than both mentionned levels above for the files download and video streaming inside browsers, it is for now removed, we might get it back as another ``Duplex Object`` ``bittorrent.pipe(flow_control).pipe(node_Tor)``

The packets coming from asynchronous calls, if any, will be processed even after ``pause`` is fired but the sender must stop sending, another option would be to bufferize, anyway, back to the previous sentence