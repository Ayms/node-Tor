const {h_address}=require('./utils.js');
const {Rsa}=require('./crypto.js');

const Payload=function(data) {
	switch(this.Command.readUInt()) {
		case this.VERSIONS : return this.versions_cell_decode(data);
		case this.CERTS : return this.certs_cell_decode(data);
		case this.AUTH_CHALLENGE : return this.auth_challenge_cell_decode(data);
		case this.NETINFO : return this.netinfo_cell_decode(data);
		case this.CREATED_FAST : return this.created_fast_cell_decode(data);
		case this.CREATED_FAST_WS : return this.created_fast_ws_cell_decode(data);
		case this.CREATE_FAST : return this.create_fast_cell_decode(data);
		case this.CREATE_FAST_WS : return this.create_fast_ws_cell_decode(data);
		case this.CREATED : return this.created_cell_decode(data);
		case this.CREATE : return this.create_cell_decode(data);
		default : return [data];
	};
};

const Cell=function(id,command,payload,decode) {
	this.CircID=(new Buffer(2)).writeUInt(id);
	this.Command=(new Buffer(1)).writeUInt(command);
	this.Length=(new Buffer(2)).writeUInt(payload.length);
	if (decode) {
		this.Payload=Payload.bind(this)(payload);
	} else {
		this.Payload=payload;
	};
};

Cell.prototype={
	PADDING:0,
	CREATE:1,
	CREATED:2,
	RELAY:3,
	DESTROY:4,
	CREATE_FAST:5,
	CREATED_FAST:6,
	NETINFO:8,
	RELAY_EARLY:9,
	VERSIONS:7,
	CREATE_FAST_WS:120,
	CREATED_FAST_WS:121,
	VPADDING:128,
	CERTS:129,
	AUTH_CHALLENGE:130,
	AUTHENTICATE:131,
	AUTHORIZE:132,
	RELAY_WS:190,
	versions_cell_decode:function(data) {
		let versions=[];
		while (data.length) {
			versions.push(data.slice(0,2));
			data=data.slice(2);
		};
		return versions;
	},
	certs_cell_decode:function(data) {
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
	},
	auth_challenge_cell_decode:function(data) {
		let auths=[];
		let auth={};
		auth.Challenge=data.slice(0,32);
		auth.N_Methods=data.slice(32,34);
		auth.Methods=data.slice(34,34+auth.N_Methods.readUInt());
		auths.push(auth);
		return auths;
	},
	netinfo_cell_decode:function(data) {
		let netinfos=[];
		let netinfo={};
		netinfo.Timestamp=data.slice(0,4);
		let h=h_address(data.slice(4));
		data=h.data;
		netinfo.other_OR=h.addr;
		netinfo.nb_addresses=data.slice(0,1);
		netinfo.this_ORs=[];
		data=data.slice(1);
		let l=netinfo.nb_addresses.readUInt();
		for (let i=0;i<l;i++) {
			let tmp=h_address(data);
			netinfo.this_ORs.push(tmp.addr);
			data=tmp.data;
		};
		netinfos.push(netinfo);
		return netinfos;
	},
	create_fast_cell_decode:function(data) {
		let create_fasts=[];
		let create_fast={};
		create_fast.key_material=data.slice(0,20);
		create_fasts.push(create_fast);
		return create_fasts;
	},
	create_fast_ws_cell_decode:function(data) {
		let create_fasts=[];
		let create_fast={};
		let RSA=new Rsa();
		try {
			create_fast.key_material=new Buffer(RSA.decrypt(privkey,data.slice(0,128).toString('hex'),'','hex'),'hex');
			create_fasts.push(create_fast);
		} catch(ee) {
			console.log('create fast pb decrypting');
		};
		return create_fasts;
	},
	created_fast_cell_decode:function(data) {
		let created_fasts=[];
		let created_fast={};
		created_fast.key_material=data.slice(0,20);
		created_fast.derivative_key_data=data.slice(20,40);
		created_fasts.push(created_fast);
		return created_fasts;
	},
	created_fast_ws_cell_decode:function(data) {
		let created_fasts=[];
		let created_fast={};
		created_fast.key=data.slice(0,40);
		created_fasts.push(created_fast);
		return created_fasts;
	},
	create_cell_decode:function(data) {
		let creates=[];
		let create={};
		create.M_=data.slice(0,128);
		create.M2_=data.slice(128,186);
		creates.push(create);
		return creates;
	},
	created_cell_decode:function(data) {
		let createds=[];
		let created={};
		created.dh_data=data.slice(0,128);
		created.derivative_key_data=data.slice(128,148);
		createds.push(created);
		return createds;
	}
};

module.exports=Cell;