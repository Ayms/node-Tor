//Copyright 2012 jCore - Aymeric Vitte
//TODO : eradication of binary format (watch node.js's deprecating the binary format (0.10 ?))
//TODO : replace bind by fat arrow (=>) (ES6)
//TODO : replace do_not_wait and timeout by promises (tasks.js,q)

//DEBUG
var oconsole=console.log;
console.log=function(txt) {
var fd = fs.openSync('debug.txt', 'a');
fs.write(fd,txt+'\n');
fs.close(fd);
oconsole(txt);
};

var tls = require('tls'),
fs = require('fs'),
net = require('net');
http = require('http'),
URL = require('url'),
HTTPParser = process.binding('http_parser').HTTPParser,
crypto = require('crypto'),
Rsa = require('./crypto.js').Rsa,
PEM = require('./crypto.js').PEM,
Hash = require('./crypto.js').Hash, //See https://github.com/joyent/node/issues/3719
Guards = require('./guards.js').Guards,
Relays = require('./relays.js').Relays,
Dirs = require('./dirs.js').Dirs,
Exit = require('./exit.js').Exit,
OP_sock={},
OP_req=[],
OR_sock={},
port = 443,
port2=8000,
exp='010001',
IV=new Buffer('00000000000000000000000000000000','hex'),
NB_HOP_MAX=5,
NB_TRY_MAX=5,
NB_HOP=3,
ONE_C=true;
RSA_PUB_PFX='-----BEGIN RSA PUBLIC KEY-----',
RSA_PUB_SFX='-----END RSA PUBLIC KEY-----',
NB_MAX_CELLS=20,
TC_CREATE=5000,
TC_VERSION=1000,
TC_EXTEND=7000,
BEGIN_RETRY=5000;

var h_address=function(data) {
var type=data.slice(0,1);
var length=data.slice(1,2);
var value=data.slice(2,2+length.readUInt());
data=data.slice(length.readUInt()+2);
return {data:data,addr:{type:type,length:length,value:value}};
};

var simple_random=function(l) {
return parseInt(Math.random()*l);
};

var create_path=function(params) {
var r=[];
var p=[];
var i,l;
var list=[];
var nb_hop=params.nb_hop||NB_HOP_MAX;
if (nb_hop>NB_HOP_MAX) {
nb_hop=NB_HOP_MAX;
};
params.nb_try=params.nb_try||1;
if (params.nb_try>NB_TRY_MAX) {
console.log('createPath : Too many attempts');
return;
};
l=Guards.length;
i=simple_random(l);
i=Guards[i].split('-');
list.push(i[1]);
p.push({ip:i[1],fing:i[0],port:i[2],band:i[3]});
nb_hop--;
l=Relays.length;
nb_hop--;
while (nb_hop) {
i=simple_random(l);
if ((r.indexOf(i)==-1)&&(Relays[i].split('-')[1]!=p[0].ip)) {
r.push(i);
nb_hop--;
};
};
var f=function(val,i) {
var o=Relays[val].split('-');
var tmp={ip:o[1],fing:o[0],port:o[2],band:o[3]};
list.push(o[1]);
p.push(tmp);
};
r.forEach(f);
l=Exit.length;
i=simple_random(l);
while (list.indexOf((Exit[i].split('-'))[1])!=-1) {
i=simple_random(l);
};
i=Exit[i].split('-');
p.push({ip:i[1],fing:i[0],port:i[2],band:i[3]});
return p;
};

var get_request=function(host) {
var get='GET / HTTP/1.1\r\n';
get +='Host: '+host+'\r\n';
get +='User-Agent: Mozilla/5.0 (Windows NT 6.0; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0.1\r\n';
get +='Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n';
get +='Accept-Language: en\r\n';
get +='Accept-Encoding: gzip, deflate\r\n';
get +='Connection: keep-alive\r\n';
get +='\r\n';
return new Buffer((new Buffer(get)).toString('hex'),'hex');
};

var choose_id=function(obj) {
var cid=0;
obj.nbc_=obj.nbc_?obj.nbc_:0;
if (obj.nbc_==65534) {
return false;
};
while ((obj[cid])||(cid==0)) {
cid=obj.cid?((++obj.cid)%65535):1;
};
obj.cid=cid;
obj.nbc_++;
return cid;
};

var crypto_expand_key=function(K0) {
var r='';
for (var i=0;i<5;i++) {
var H = crypto.createHash('sha1');
H.update(new Buffer(K0+'0'+i,'hex'));
r +=H.digest('hex');
};
return new Buffer(r,'hex');
};

var crypto_aes_encrypt=function(m,K) {
var C2 = crypto.createCipheriv('aes-128-ctr',K.toString('binary'),IV.toString('binary'));
var K2=C2.update(m.toString('hex'),'binary','hex');
K2 +=C2.final('hex');
return K2;
};

var crypto_onion=function(modulus,M) {
var M1=M.slice(0,70);
var M2=M.slice(70);
var K=Rand(16);
var K1=[K,M1].concatBuffers();
var RSA=new Rsa();
K1=RSA.encrypt(new Buffer(modulus.toString('hex'),'binary'),new Buffer(exp,'binary'),new Buffer(K1.toString('binary'),'binary'),'RSA_PKCS1_OAEP_PADDING','hex');
var K2=crypto_aes_encrypt(M2,K);
return [new Buffer(K1,'hex'),new Buffer(K2,'hex')].concatBuffers();	
};

Buffer.prototype.readUInt=function() {
switch (this.length) {
case 1 : return this[0];
case 2 : return this.readUInt16BE(0);
case 4 : return this.readUInt32BE(0);
return 0;
};
};

Buffer.prototype.writeUInt=function(val) {
switch (this.length) {
case 1 : this.writeUInt8(val,0);break;
case 2 : this.writeUInt16BE(val,0);break;
case 4 : this.writeUInt32BE(val,0);break;
};
return this;
};

Buffer.prototype.map=function(buff) {
var l=buff.length;
for (var i=0;i<l;i++) {
this[i]=buff[i];
};
this.fill(0,l);
};

Array.prototype.concatBuffers = function() {
var str=[];
this.forEach(function(val) {
str.push(val.toString('hex'));
});
return new Buffer(str.join(''),'hex');
};

Buffer.prototype.parse=function(socket) {
var nb=0;
var Cells=[];
var data=this;
console.log('cells '+data.length);
while(data.length) {
//try {
console.log((data.toString('hex')).substr(0,50));
var cir=data.slice(0,2);
var com=data.slice(2,3);
var payl;
var cid=cir.readUInt();
if (socket[cid]) {
socket[cid].clear_timers();
};
if (com.readUInt()==7 || com.readUInt()>=128) {
var l=data.readUInt16BE(3);
payl=data.slice(5,l+5);
data=data.slice(l+5);
} else {
if (data.length>=512) { //TODO Tor bug to report - some cells (relay_data) don't have 512 length
payl=data.slice(3,512);
data=data.slice(512);
} else { //workaround - reconstruct correct cell
if (data.length>=3) {
payl=data.slice(3,data.length);
var tmp=new Buffer(512);
tmp.map(payl);
} else {
console.log('Bad formatted cell - discard');
};
};
};
var cell=new Cell(cir.readUInt(),com.readUInt(),payl,true);
Cells.push(cell);
var l=Cells.length;
if (l>1) {
if (Cells[l-1].Payload[0].toString('hex')===Cells[l-2].Payload[0].toString('hex')) {
console.log('----- duplicate cells ------');
nb++;
};
};
if (nb<NB_MAX_CELLS) {
console.log('handle cell');
Handle_cells.bind(socket)([cell]);
} else { //TODO infinite duplicated cells received - Tor or node.js Bug to report
console.log('-------------- too many cells -------------------');
socket.destroy();
};
//} catch(ee) {
// console.log("Bad formatted cell - discard");
// return [];
//};
};
return Cells;
};

var Rand=function(length) {
return crypto.randomBytes(length);
};

var ValToIP=function(val,type) {
//TODO find this in node.js libraries
var l=val.length;
var ip=[];
for (var i=0;i<l;i++) {
ip.push(val[i]);
};
return ip.join('.');
};

var IPtoVal=function(ip) {
return new Buffer(ip.split('.'));
};

var Cell = function(id,command,payload,decode) {
this.CircID=(new Buffer(2)).writeUInt(id);
this.Command=(new Buffer(1)).writeUInt(command);
this.Length=(new Buffer(2)).writeUInt(payload.length);
if (decode) {
this.Payload=Payload.bind(this)(payload);
} else {
this.Payload=payload;
};
};

Cell.prototype = {
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
VPADDING:128,
CERTS:129,
AUTH_CHALLENGE:130,
AUTHENTICATE:131,
AUTHORIZE:132,
versions_cell_decode:function(data) {
var versions=[];
while (data.length) {
versions.push(data.slice(0,2));
data=data.slice(2);
};
console.log('VERSIONS');
console.log(versions);
return versions;
},
certs_cell_decode:function(data) {
var n=data.slice(0,1);
data=data.slice(1);
var certs=[];
var cert={};
certs.push(n);
while (data.length) {
cert.CertType=data.slice(0,1);
cert.CLEN=data.slice(1,3);
var l=cert.CLEN.toString('hex');
l=parseInt(l,16);
cert.Certificate=data.slice(3,3+l);
data=data.slice(3+l);
certs.push(cert);
};
console.log('CERTS');
return certs;
},
auth_challenge_cell_decode:function(data) {
var auths=[];
var auth={};
auth.Challenge=data.slice(0,32);
auth.N_Methods=data.slice(32,34);
auth.Methods=data.slice(34,34+auth.N_Methods);
auths.push(auth);
console.log('AUTH_CHALLENGE');
return auths;
},
netinfo_cell_decode:function(data) {
var netinfos=[];
var netinfo={};
netinfo.Timestamp=data.slice(0,4);
var h=h_address(data.slice(4));
data=h.data;
netinfo.other_OR=h.addr;
netinfo.nb_addresses=data.slice(0,1);
netinfo.this_ORs=[];
data=data.slice(1);
var l=netinfo.nb_addresses.readUInt();
for (var i=0;i<l;i++) {
var tmp=h_address(data);
netinfo.this_ORs.push(tmp.addr);
data=tmp.data;
};
netinfos.push(netinfo);
console.log('NETINFO');
return netinfos;
},
created_fast_cell_decode:function(data) {
var created_fasts=[];
var created_fast={};
created_fast.key_material=data.slice(0,20);
created_fast.derivative_key_data=data.slice(20,40);
created_fasts.push(created_fast);
return created_fasts;
},
created_cell_decode:function(data) {
var createds=[];
var created={};
console.log('CREATED');
created.dh_data=data.slice(0,128);
created.derivative_key_data=data.slice(128,148);
createds.push(created);
return createds;
}
};

var Circuit=function(p) {
if (p) {
this.OP_=true;
this.server_=p[0];
this.path_=p;
this.nb_=0;
this.conn_=0;
};
};

Circuit.prototype = {
versions_cell_handle:function(cell) {
cell.Payload.forEach(function(val){if (val.readUInt()==3) {this.socket_.handshake_=3}},this);
if (!this.socket_.handshake_) {this.end('v3 handshake not supported','handshake')};
},
certs_cell_handle:function(cell) {
//TODO check certificates
//TODO authenticate
},
auth_challenge_cell_handle:function(cell) {
//TODO authenticate
},
netinfo_cell_handle:function(cell) {
var other_OR=this.socket_.remoteAddress;
var netinfo={};
cell.Length=0;
netinfo.Timestamp=(new Buffer(4)).writeUInt(parseInt(new Date().valueOf()/1000)); //TODO check timestamp
cell.Length+=4;
cell.Payload[0].this_ORs.forEach(function(val) {if ((ValToIP(val.value)==other_OR)||(this)) {netinfo.other_OR=val;cell.Length+=val.length;this._OR_ip_verified=true;}},this);
//TODO test remove ||this
if (!this._OR_ip_verified) {
this.end('remote IP does not match','handshake')
} else {
netinfo.nb_addresses=(new Buffer(1)).writeUInt(1);
cell.Length++;
netinfo.this_ORs=[cell.Payload[0].other_OR]; //TODO is supposed to be checked
cell.Length+=netinfo.this_ORs[0].length;
cell.Payload=[netinfo];
this.send(cell);
console.log('HANDSHAKE SUCCESSFULL '+other_OR+' -----------------------------');
this.socket_.handshake=true;
if (this.OP_) {
//test CREATE
//TODO replace by create fast
console.log('CREATE-----------------------'+this.server_.ip);
this.setCircId();
this.create();
//console.log('CREATE FAST');
//this.X_=Rand(20);
//var fast=new Cell(this.circId,Cell.prototype.CREATE_FAST,this.X_); //TODO CircID
//this.send(fast);
};
};
},
created_fast_cell_handle:function(cell) {
this.Y_=cell.Payload[0].key_material;
var K0=[this.X_,this.Y_].concatBuffers();
var KH=this.circuit_keys(K0);
console.log('check keys');
if (KH.toString('hex')!=cell.Payload[0].derivative_key_data.toString('hex')) {this.end('KH key does not match','fast_key')} else {
console.log('CREATED_FAST SUCCESSFULL');
this.conn_++;
if (this.next_) {
console.log('EXTEND '+this.conn_);
this.extended_=this.next_;
this.extend();
} else {
console.log('CAN NOT HAVE ONLY ONE NODE IN THE PATH');
this.end('CAN NOT HAVE ONLY ONE NODE IN THE PATH');
}
};
},
created_cell_handle:function(cell) {
var lcirc=this.extended_?this.extended_:this;
lcirc.Y_=cell.Payload[0].dh_data; //TODO check g^y not degenerated
var K0=new Buffer(lcirc.DH_.computeSecret(lcirc.Y_, 'hex', 'hex'),'hex');
var KH=lcirc.circuit_keys(K0);
console.log(lcirc==this?'CREATED check keys':'EXTEND check keys');
console.log(KH);
console.log(cell.Payload[0].derivative_key_data);
if (KH.toString('hex')!=cell.Payload[0].derivative_key_data.toString('hex')) {lcirc.end('KH key does not match','created_extended_key')} else {
console.log(lcirc==this?'CREATED SUCCESSFULL----------------------------------':'EXTEND SUCCESSFULL--------------------------------------');
this.conn_++;
lcirc.ok_=true;
if (lcirc.next_) {
//TODO can not extend toward previous OR
console.log('EXTEND '+this.conn_);
lcirc.extended_=lcirc.next_;
lcirc.extend();
} else {
console.log('CIRCUIT ESTABLISHED');
this.first_.last_=lcirc;
this.first_.process();
var a=OP_req;
if (a) {
while (a.length) {
console.log('Process queue '+a.length);
this.first_.process(a[0]);
a.shift();
};
};
};
};
},
handle_destroy:function(error) {
if (error!==9) {
this.first_.circuit_retry();
};
},
relay_cell_handle:function(cell,bool) {
//TODO chek no more than 8 Relay Early Cell received by OR on a given circuit
var data=cell.Payload[0];
if (this.OP_) {
this.stream_decrypt_backward(data,bool);
}
},
relay_send_truncate:function() {
console.log('-------------------------- SEND TRUNCATE -------------------'+this.server_.ip);
var stream=new Stream(Stream.prototype.RELAY_TRUNCATE,0,new Buffer(Stream.prototype.RELAY_TRUNCATE,'hex'),this.Df_hash);
var cell=new Cell(this.circId,Cell.prototype.RELAY,this.stream_encrypt_forward(stream));
this.send(cell);
},
relay_end_handle:function(id,error) {
if (error!==6) {
var request=this.first_[id];
this.destroy_cid(id);
Tor(request,this.first_);
};
},
relay_truncate_handle:function(error) {
console.log('Truncated received from '+this.server_.ip+' '+error)
switch (error) {
case 8||11: this.handle_destroy(0);break;
default:var tmp=this.first_.last_?this.first_.last_.ok_:null;if (!tmp) {this.next_.change_or('- relay truncated',this.extend)};
};
},
stream_handle:function(stream) {
switch (stream.command.readUInt()) {
case stream.RELAY_EXTENDED : this.created_cell_handle(new Cell(this.circId,Cell.prototype.CREATED,stream.data,true));break;
case stream.RELAY_TRUNCATED : this.end('Error :'+stream.data.slice(0,1).readUInt(),'truncated');break;
case stream.RELAY_END : this.end('End :'+stream.data.slice(0,1).readUInt(),'relay_end',stream.streamId.readUInt());break;
case stream.RELAY_CONNECTED : this.stream_handle_connected(stream.streamId.readUInt());break;
case stream.RELAY_DATA : this.stream_handle_data(stream);break;
};
},
stream_handle_connected:function(id) {
console.log('--------------RELAY_CONNECTED TO---------------------- '+this.server_.ip);
var request=this.first_[id];
clearTimeout(request.rb_);
console.log('Stream '+id+' '+this.first_.server_.ip)
this.clear_timers();
if (request.params_.stream) {
var cd=request.params_.stream;
while (cd.length) {
console.log('--------------SEND RELAY_DATA TO----------------------'+this.server_.ip);
var stream=new Stream(Stream.prototype.RELAY_DATA,id,cd.slice(0,Math.min(cd.length,498)),this.Df_hash);
var cell=new Cell(this.circId,Cell.prototype.RELAY,this.stream_encrypt_forward(stream));
this.send(cell);
cd=cd.slice(Math.min(cd.length,498));
};
} else {
console.log(request.start_);
if (request.start_) {
request.write(request.start_);
delete request.start_;
};
};
},
stream_handle_data:function(stream) {
console.log('--------------RECEIVE RELAY_DATA FROM---------------------- '+this.server_.ip);
this.first_[stream.streamId.readUInt()].write(stream.data.slice(0,stream.length.readUInt()));
console.log(stream.length.readUInt());
console.log(stream.data.toString('utf8'));
},
send:function(cell) {
var mcell=[cell.CircID,cell.Command];
if ((cell.Command.readUInt()==7)||(cell.Command.readUInt()>=128)) {mcell.push(cell.Length)};

var recurse=function(val) {
if (!val.push) {
for (var n in val) {
if (Buffer.isBuffer(val[n])) {
mcell.push(val[n]);
} else {
recurse(val[n]);
};
};
} else {
val.forEach(function(a) {
if (Buffer.isBuffer(a)) {
mcell.push(a);
} else {
recurse(a);
};
});
};
};
if (cell.Payload.push) {
cell.Payload.forEach(function(val) {
recurse(val);
});
} else {
mcell.push(cell.Payload);
};
mcell=mcell.concatBuffers();
if ((cell.Command.readUInt()!==7)&&(cell.Command.readUInt()<128)) {
var tmp=new Buffer(512);
tmp.map(mcell);
mcell=tmp;
};
console.log('SEND CELL '+this.server_.ip);
console.log((mcell.toString('hex')).substr(0,50));
if (!this.first_.last_) {
var retry;
this.clear_timers();
var tc_;
if (this===this.first_) {
if (this.socket_.handshake_) {
retry=function() {console.log('Create or first extend too long '+cell.Command+' '+this.server_.ip);this.circuit_retry()};
tc_=TC_CREATE;
} else {
retry=function() {this.change_or('Handshake version no answer or bad answer - change OR')};
tc_=TC_VERSION;
};
} else {
retry=function() {console.log('Extend delay expired - change or '+this.server_.ip);this.change_or('- extend too long',this.extend);};
tc_=TC_EXTEND;
};
console.log('setTimeout circ');
this.first_.tc_.push(setTimeout(retry.bind(this),tc_));
};
if (this.OP_) {
try {
this.socket_.write(mcell);
} catch(ee) {
console.log('socket does not exist any longer');
};
} else {
sock.write(cell);
};
},
circuit_keys: function(K0) {
var exp_key=crypto_expand_key(K0.toString('hex'));
var KH=exp_key.slice(0,20);
this.Df_=exp_key.slice(20,40);
this.Db_=exp_key.slice(40,60);
this.Kf_=exp_key.slice(60,76);
this.Kb_=exp_key.slice(76,92);
this.Kf_cipher=crypto.createCipheriv('aes-128-ctr',this.Kf_.toString('binary'),IV.toString('binary'));
this.Kb_cipher=crypto.createCipheriv('aes-128-ctr',this.Kb_.toString('binary'),IV.toString('binary'));
this.Df_hash=new Hash('sha1');
this.Db_hash=new Hash('sha1');
this.Df_hash.update(this.Df_);
this.Db_hash.update(this.Db_);
return KH;
},
stream_encrypt_forward: function(stream) {
var circ=this;
var enc=stream.toBuffer();
while (circ) {
console.log('encrypt for '+circ.server_.ip);
enc=new Buffer(circ.Kf_cipher.update(enc.toString('hex'),'binary','hex'),'hex');;
circ=circ.prev_;
};
return enc;
},
stream_decrypt_backward: function(data,error) {
var circ=this;
var stream;
while (circ) {
if (circ.Kb_) {
data=new Buffer(circ.Kb_cipher.update(data.toString('hex'),'binary','hex'),'hex');
console.log('decrypt for '+circ.server_.ip);
stream=circ.recognized(data);
if (stream) {break;}
};
circ=circ.extended_;
};
if (!stream) {
this.last_.end('Unrecognized stream','unrecognized')
} else {
if (error) {
var stream_=new Stream(Stream.prototype.RELAY_END,stream.streamId,new Buffer('0A','hex'),circ.Df_hash);
var cell=new Cell(circ.circId,Cell.prototype.RELAY,circ.stream_encrypt_forward(stream));
circ.send(cell);
} else {
circ.stream_handle(stream);
};
};
},
recognized: function(data) {
if (data.slice(1,3).readUInt()==0) {
//try {
console.log('DECRYPTED STREAM FROM '+this.server_.ip);
console.log(data.toString('hex'));
console.log(data.length);
var l=data.slice(9,11);
console.log(l.readUInt()+11);
var m=Math.min(11+l.readUInt(),data.length); //check bad formatted stream
var stream=new Stream((data.slice(0,1)).readUInt(),(data.slice(3,5)).readUInt(),data.slice(11,m));
stream.length=l;
var digest=data.slice(5,9);
this.Db_hash.update(stream.toBuffer());
var res=(new Buffer(this.Db_hash.digest('hex'),'hex')).slice(0,4);
console.log(res);
console.log(digest);
if (res.toString('hex')==digest.toString('hex')) {
return stream;
};
//} catch(ee) {};
};
},
extend:function() {
var Address=IPtoVal(this.extended_.server_.ip);
console.log(this.server_.ip+' EXTEND TOWARD '+this.extended_.server_.ip+' '+this.extended_.server_.fing);
var Port=(new Buffer(2)).writeUInt(parseInt(this.extended_.server_.port));
var DH = crypto.getDiffieHellman('modp2');
//TODO private key x is recommended to be 320 bits length for optimization
//node.js improvment https://github.com/joyent/node/issues/3622
DH.generateKeys();
this.extended_.DH_=DH;
this.extended_.X_=new Buffer(DH.getPublicKey('hex'),'hex');
var cb=function() {
console.log(this.server_.ip+' extend modulus to '+this.extended_.server_.ip+' '+this.extended_.server_.o_modulus);
var Onion=crypto_onion(new Buffer(this.extended_.server_.o_modulus,'hex'),this.extended_.X_);
var Fing=new Buffer(this.extended_.server_.fing,'hex');
var stream=new Stream(Stream.prototype.RELAY_EXTEND,0,[Address,Port,Onion,Fing].concatBuffers(),this.Df_hash);
console.log('------------SEND RELAY EARLY EXTEND------------------- from'+this.server_.ip+' to '+this.extended_.server_.ip);
var cell=new Cell(this.circId,Cell.prototype.RELAY_EARLY,this.stream_encrypt_forward(stream));
this.send(cell);
};
console.log('extend calling get_certs extended '+this.extended_.server_.ip+' from '+this.server_.ip);
console.log(this.extended_.prev_===this);
this.extended_.get_certs(cb);
},
create:function() {
var DH = crypto.getDiffieHellman('modp2');
DH.generateKeys();
this.DH_=DH;
this.X_=new Buffer(DH.getPublicKey('hex'),'hex');
var cb=function() {
console.log('create modulus '+this.server_.o_modulus+' fing '+this.server_.fing);
var Onion=crypto_onion(new Buffer(this.server_.o_modulus,'hex'),this.X_);
var cell=new Cell(this.circId,Cell.prototype.CREATE,Onion);
console.log('SEND CREATE '+this.server_.ip);
this.send(cell);
};
if (!this.server_.o_modulus) {
this.get_certs(cb);
} else {
console.log('create modulus known');
cb.call(this);
};
},
destroy:function() {
console.log('-------------------------- SEND DESTROY -------------------'+this.server_.ip);
var cell=new Cell(this.circId,Cell.prototype.DESTROY,new Buffer('02','hex'));
this.send(cell);
},
destroy_cid:function(id) {
var request=this.first_[id];
delete request.cid_;
delete this.first_[id];
delete request.sid_;
},
setCircId:function() {
if (this.circId==0) {delete this.socket_['0'];};
this.circId=choose_id(this.socket_);
if (!this.circId) {
return false;
};
console.log(this.circId);
this.socket_[this.circId]=this;
var lcirc=this;
var l=this.path_.length-1;
this.first_=this;
this.t0_=[];
for (var i=0;i<l;i++) {
var circuit=new Circuit();
circuit.OP_=true;
circuit.t0_=[];
circuit.server_=lcirc.path_[i+1];
lcirc.next_=circuit;
circuit.prev_=lcirc;
circuit.path_=lcirc.path_;
circuit.nb_=lcirc.nb_+1;
circuit.socket_=this.socket_;
circuit.circId=this.circId;
circuit.first_=this;
lcirc=circuit;
};
return true;
},
process: function(request) {
this.last_.first_=this;
if (!request) {
var request=this.request_;
};
request.cid_=this;
if (this.params_.host) {
var payload=new Buffer(this.params_.host);
console.log(payload.toString('utf8'));
payload=new Buffer(payload.toString('hex')+'00','hex');
var id=choose_id(this);
if (id) {
console.log('Stream '+id+' '+this.first_.server_.ip);
this[id]=request;
request.sid_=id;
console.log('--------------SEND RELAY_BEGIN----------------------');
var begin_retry=function() {
console.log('retry send relay begin');
request.rb_try=request.rb_try?++request.rb_try:1;
if (request.rb_try<3) {
begin.call(this);
} else {
//this.last_.prev_.relay_send_truncate();//TODO truncate seems not to be working in Tor network - to check
Tor(request,this);
};
};
var begin=function() {
var stream=new Stream(Stream.prototype.RELAY_BEGIN,id,payload,this.last_.Df_hash);
var cell=new Cell(this.circId,Cell.prototype.RELAY,this.last_.stream_encrypt_forward(stream));
request.rb_=setTimeout(begin_retry.bind(this),BEGIN_RETRY);
this.send(cell);
};
begin.call(this);
} else {
console.log('too many streams opened');
}
};
},
set_certs: function(val) {
try {
val=val.split(RSA_PUB_PFX);
console.log('RSA_PUB '+val.length);
this.server_.onion_k=RSA_PUB_PFX+val[1].split(RSA_PUB_SFX)[0]+RSA_PUB_SFX;
this.server_.sign_k=RSA_PUB_PFX+val[2].split(RSA_PUB_SFX)[0]+RSA_PUB_SFX;
var pem=new PEM();
this.server_.o_modulus=pem.modulus(this.server_.onion_k);
this.server_.s_modulus=pem.modulus(this.server_.sign_k);
return true;
} catch(ee) {
this.nb_error=this.nb_error?++this.nb_error:1;
return false;
};
},
get_certs: function(cb) {
if ((this.server_)&&(!this.ok_)) {
var d=Dirs.length;
var fing=this.server_.fing;
var r=simple_random(d);
var tmp=Dirs[r].split(':');
var ip=tmp[0];
var port=tmp[1];
console.log(this.server_.ip+' get_certs '+r+' dir :'+ip+':'+port+'/tor/server/fp/'+fing);
var options = {
host: ip,
path: '/tor/server/fp/'+fing,
port: port,
headers: {'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Encoding':'gzip deflate','Accept-Language':'fr,fr-fr;q=0.8,en-us;q=0.5,en;q=0.3','Cache-Control':'max-age=0','Connection':'keep-alive','Host':ip,'User-Agent':'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:13.0) Gecko/20100101 Firefox/13.0'}
};
var req=http.request(options,(function(res) {
req.data_='';
if (res.statusCode!=200) {
this.clear_t0_();
try {
console.log('Error status code http://'+ip+'/tor/server/fp/'+fing+' '+this.server_.fing);
this.get_certs(cb);
} catch(ee) {};
};
res.on('data', (function(d) {
console.log('clear timeout ');
this.clear_t0_();
req.data_ +=d.toString('utf8');
}).bind(this));
res.on('end',(function() {
if ((this.server_)&&(!req.destroy_)) {
console.log('before calling cb '+this.certs_);
if (!this.certs_) {
if (this.set_certs(req.data_)) {
console.log('calling cb '+this.server_.ip+' '+fing+' from '+ip);
this.certs_=true;
if (!this.prev_) {
console.log('cb create');
cb.call(this);
} else {
console.log('cb extend');
console.log(this.prev_.server_);
cb.call(this.prev_);
};
} else {
if (this.nb_error>4) {
this.change_or('get_certs wrong cert for '+fing,this.first_!==this?function(){this.get_certs(cb)}:null);
} else {
console.log('Retry get_certs wrong cert for '+fing);
this.get_certs(cb);
};
};
};
};
}).bind(this));
}).bind(this));
var error_=(function(e) {
this.clear_t0_();
if (this.server_) {
console.log('error get_certs http://'+ip+'/tor/server/fp/'+fing+' '+e.message);
this.nb_error=this.nb_error?++this.nb_error:1;
if (this.nb_error>4) {
this.change_or('error get_certs',this.first_!==this?function() {this.get_certs(cb)}:null);
} else {
this.get_certs(cb);
};
};
}).bind(this);
req.on('error',error_);
req.end();
var do_not_wait=(function() {
this.clear_t0_();
//strange behavior (node.js), to investigate, error fired after abort
req.removeListener('error',error_);
error_=function() {console.log('error fired after abort for '+ip)};
req.on('error',error_);
req.destroy_=true;
req.socket.destroy();
//req.abort();
console.log('1-get_certs do not wait');
if (this.server_) {
console.log('2-get_certs do not wait '+this.server_.ip+' for '+ip);
this.get_certs(cb);
};
}).bind(this);
this.t0_.push(setTimeout(do_not_wait,1000));
console.log('timeout '+this.t0_);
};
},
change_or: function(msg,cb) {
console.log('change_or - '+msg);
var list=[];
var i;
var n_or=this.prev_?(this.next_?Relays:Exit):Guards;
var l=n_or.length;
this.clear_timers();
this.clear_t0_();
if (this.path_) {
list=this.path_.map(function(val) {return val.ip});
} else {
list.push(this.server_.ip);
};
i=simple_random(l);
while (list.indexOf(n_or[i].split('-')[1])!=-1) {
i=simple_random(l);
};
var o=n_or[i].split('-');
n_or={ip:o[1],fing:o[0],port:o[2],band:o[3]};
console.log(this.server_.ip+' ------changed or to ----------- ('+msg+') '+n_or.ip+' '+n_or.fing);
var lcirc=this;
while (lcirc) {
delete lcirc.destroy_;
delete lcirc.nb_error;
delete lcirc.ok_;
lcirc=lcirc.next_;
};
delete this.first_.last_;
var circ=new Circuit();
Object.keys(this).forEach(function(val) {circ[val]=this[val]},this);
circ.server_=n_or;
var old_ip=this.server_.ip;
this.server_o=this.server_;
delete this.server_;
delete circ.certs_;
if (this.next_) {
circ.next_.prev_=circ;
};
if (this.prev_) {
if (circ.prev_.extended_) {
circ.prev_.extended_=circ;
};

circ.prev_.next_=circ;

if (msg.indexOf('get_certs')==-1) {
circ=circ.prev_;//call extend
delete circ.certs_;
};
} else {
circ.first_=circ;
};
circ.first_.reconstruct_path();
if ((cb)&&(this.prev_||(this.first_===this))) {
console.log('change_or cb '+cb.toString().substr(0,50));
if (!circ.ok_) {
delete circ.extended_;
};
cb.call(circ);
} else {
if (this.socket_.first_===this) {
delete OP_sock[old_ip];
if (circ.socket_) {
this.destroy_=true;
circ.socket_.destroy();
delete circ.socket_;
};
delete circ.extended_;
circ.circId=0;
circ.first_=circ;
circ.path_.shift();
circ.path_.unshift(circ.server_);
console.log('change_or circ.server_');
console.log(circ.server_);
tls_socket(circ);
} else {
this.next_.change_or('first socket exists, change path',this.create.bind(this));
};
};
},
circuit_retry: function() {
if ((!this.ok_)&&(this.socket_.first_===this)) {
this.change_or('initial socket closed unexpectedly or unexpected circuit creation error or new circuit creation error');
} else {
delete this.ok_;
delete this.first_.last_;
var tmp=this.circId;
this.circId=choose_id(this.socket_);
delete this.socket_[tmp];
this.socket_[this.circId]=this;
this.socket_.nbc_--;
var lcirc=this;
while (lcirc.extended_) {
lcirc.extended_.circId=this.circId;
lcirc=lcirc.extended_;
delete lcirc.extended_;
};
if ((this===lcirc)&&(this.socket_.first_!==this)) {
lcirc.create();
} else {
lcirc.change_or('retry from first OR circId='+this.circId,this.create.bind(this));
};
};
},
reconstruct_path: function() {
var circ=this;
var path=[];
while (circ.next_) {
path.push(circ.server_);
circ=circ.next_;
};
while (circ.prev_) {
circ.path_=path;
circ.first_=this;
circ=circ.prev_;
};
},
clear_timers: function() {
console.log('clear_timers');
this.first_.tc_.forEach(function(val) {clearTimeout(val)});
this.first_.tc_=[];
},
clear_t0_: function() {
if (this.t0_) {
this.t0_.forEach(function(val) {clearTimeout(val)});
this.t0_=[];
};
},
end:function(msg,retry,id) {
console.log(msg+' '+retry);
msg=msg.split(':');
var circ_error=(function() {
if (msg.length>1) {
switch(parseInt(msg[1])) {
case 0 : console.log('-- NONE (No reason given.)');return 0;
case 1 : console.log('-- PROTOCOL (Tor protocol violation.)');return 1;
case 2 : console.log('-- INTERNAL (Internal error.)');return 2;
case 3 : console.log('-- REQUESTED (A client sent a TRUNCATE command.)');return 3;
case 4 : console.log('-- HIBERNATING (Not currently operating; trying to save bandwidth.)');return 4;
case 5 : console.log('-- RESOURCELIMIT (Out of memory, sockets, or circuit IDs.)');return 5;
case 6 : console.log(' -- CONNECTFAILED (Unable to reach relay.)');return 6;
case 7 : console.log('-- OR_IDENTITY (Connected to relay, but its OR identity was not as expected.)');return 7;
case 8 : console.log('-- OR_CONN_CLOSED (The OR connection that was carrying this circuit died');return 8;
case 9 : console.log('-- FINISHED (The circuit has expired for being dirty or old.)');return 9;
case 10 : console.log('-- TIMEOUT (Circuit construction took too long)');return 10;
case 11 : console.log('-- DESTROYED (The circuit was destroyed w/o client TRUNCATE)');return 11;
case 12 : console.log('-- NOSUCHSERVICE (Request for unknown hidden service)');return 12;
};
};
}).bind(this);

var relay_end=(function() {
if (msg.length>1) {
switch(parseInt(msg[1])) {
case 1 : console.log('-- REASON_MISC (catch-all for unlisted reasons)');return 1;
case 2 : console.log('-- REASON_RESOLVEFAILED (couldn t look up hostname)');return 2;
case 3 : console.log('-- REASON_CONNECTREFUSED (remote host refused connection) [*]');return 3;
case 4 : console.log('-- REASON_EXITPOLICY (OR refuses to connect to host or port)');return 4;
case 5 : console.log('-- REASON_DESTROY (Circuit is being destroyed)');return 5;
case 6 : console.log('-- REASON_DONE (Anonymized TCP connection was closed)');return 6;
case 7 : console.log('-- REASON_TIMEOUT (Connection timed out, or OR timed out while connecting)');return 7;
case 8 : console.log('-- REASON_NOROUTE (Routing error while attempting to contact destination)');return 8;
case 9 : console.log('-- REASON_HIBERNATING (OR is temporarily hibernating)');return 9;
case 10 : console.log('-- REASON_INTERNAL (Internal error at the OR)');return 10;
case 11 : console.log('-- REASON_RESOURCELIMIT (OR has no resources to fulfill request)');return 11;
case 12 : console.log('-- REASON_CONNRESET (Connection was unexpectedly reset)');return 12;
case 13 : console.log('-- REASON_TORPROTOCOL (Sent when closing connection because of Tor protocol violations.)');return 13;
case 14 : console.log('-- REASON_NOTDIRECTORY (Client sent RELAY_BEGIN_DIR to a non-directory relay.)');return 14;
};
};
}).bind(this);

if (!retry) {
//TODO close socket if no more circuits
delete this.socket_[this.circId];
} else {
switch(retry) {
case 'handshake':this.change_or('handshake failed');break;
case 'fast_key':this.change_or('wrong fast key');break; //TODO replace by create fast
case 'created_extended_key':this.change_or('wrong create or extend key',this.prev_?this.prev_.extend:null);break;
case 'truncated':this.relay_truncate_handle(circ_error());break;
case 'destroy':this.handle_destroy(circ_error());break;
case 'unrecognized':break;
case 'relay_end':this.relay_end_handle(id,relay_end());break;
};
};
}
};

var Stream=function(command,streamId,data,D) {
this.command=(new Buffer(1)).writeUInt(command);
this.recognize=new Buffer('0000','hex');
this.streamId=(new Buffer(2)).writeUInt(streamId);
this.digest=new Buffer('00000000','hex');
this.length=(new Buffer(2)).writeUInt(data.length);
this.data=new Buffer(498);
this.data.map(data);
if (D) {
D.update(this.toBuffer());
this.digest=(new Buffer(D.digest('hex'),'hex')).slice(0,4);
};
};

Stream.prototype={
RELAY_BEGIN:1,
    RELAY_DATA:2,
RELAY_END:3,
RELAY_CONNECTED:4,
    RELAY_SENDME:5,
RELAY_EXTEND:6,
RELAY_EXTENDED:7,
RELAY_TRUNCATE:8,
RELAY_TRUNCATED:9,
RELAY_DROP:10,
RELAY_RESOLVE:11,
RELAY_RESOLVED:12,
RELAY_BEGIN_DIR:13,
toBuffer:function() {
return [this.command,this.recognize,this.streamId,this.digest,this.length,this.data].concatBuffers();
}
};

var Payload=function(data) {
switch(this.Command.readUInt()) {
case this.VERSIONS : return this.versions_cell_decode(data);
case this.CERTS : return this.certs_cell_decode(data);
case this.AUTH_CHALLENGE : return this.auth_challenge_cell_decode(data);
case this.NETINFO : return this.netinfo_cell_decode(data);
case this.CREATED_FAST : return this.created_fast_cell_decode(data);
case this.CREATED : return this.created_cell_decode(data);
default : return [data];
};
};

var Handle_cells=function(cells,bool) {
if (cells) {
var l=cells.length;
for (var i=0;i<l;i++) {
var cell=cells[i];
var cid=cell.CircID.readUInt();
if (this[cid]) {
var circ=this[cid];
console.log('clear Timeout circ '+circ.tc_);
circ.clear_timers();
switch(cell.Command.readUInt()) {
case cell.VERSIONS : circ.versions_cell_handle(cell);break;
case cell.CERTS : circ.certs_cell_handle(cell);break;
case cell.AUTH_CHALLENGE : circ.auth_challenge_cell_handle(cell);break;
case cell.NETINFO : circ.netinfo_cell_handle(cell);break;
case cell.CREATED_FAST : circ.created_fast_cell_handle(cell);break;
case cell.CREATED : circ.created_cell_handle(cell);break;
case cell.RELAY : circ.relay_cell_handle(cell,bool);break;
case cell.DESTROY : circ.end('Destroy :'+((cell.Payload[0]).slice(0,1)).readUInt(),'destroy');break;
};
};
};
} else {
//TODO banish this OR
this.destroy();
};
};

var circuit_start=function(request) {
var params=request.params_;
console.log(params);
if (params.host) {
var p=create_path(params);
console.log(p);
var s=OP_sock[p[0].ip];
var circ=new Circuit(p);
circ.params_=params;
circ.request_=request;
circ.first_=circ;
circ.tc_=[];
if (!s) {
circ.circId=0;
tls_socket(circ);
} else {
circ.server_=s.server_;
circ.socket_=s;
circ.tc_=[];
if (circ.setCircId()) {
circ.create();
} else {
console.log('no more circuits available');
};
};
};
};

var circuits_destroy=function(obj) {
Object.keys(obj).forEach(function(n) {
if (!isNaN(n)) {
var circ=obj[n];
delete circ.socket_;
delete obj[n];
delete OP_sock[circ.server_.ip];
};
});
};

var choose_circuit=function(bool) {
var a=[];
for (var n in OP_sock) {
a.push(OP_sock[n]);
};
if (a.length) {
var sock=a[simple_random(a.length)];
var b=[];
Object.keys(sock).forEach(function(n) {
if (!isNaN(n)) {
var tmp=sock[n].last_?sock[n].last_.ok_:null;
if (tmp) {
b.push(sock[n]);
};
};
});
if (!bool) {
if (b.length) {
return b[simple_random(a.length)];
};
} else {
if ((a.length===1)&&(b.length===1)) {
return true;
};
};
};
};

var on_data=function(data) {
console.log('OP RECEIVE');
data.parse(this);
};

var tls_socket=function(circ) {
//OP socket
//TODO generate keys dynamically
var options = {
key: fs.readFileSync('client-key.pem'),
cert: fs.readFileSync('client.pem'),
servername: 'www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com'
};
console.log('---------start initial socket------------'+options.servername+' '+circ.server_.ip+' '+circ.server_.port);
var tls_socket_ = tls.connect(circ.server_.port, circ.server_.ip, options, function() {
clearTimeout(t0);
OP_sock[circ.server_.ip]=this;
this[circ.circId]=circ;
var cell=new Cell(circ.circId,Cell.prototype.VERSIONS,(new Buffer(2)).writeUInt(3));
circ.send(cell);
});
tls_socket_.on('data', on_data);
tls_socket_.on('end', function() {
if (tls_socket_.nbc_>1) {
console.log('destroy');
circuits_destroy(tls_socket);
} else {
clearTimeout(t0);
if (circ.destroy_) {
console.log('End destroyed '+circ.server_o.ip);
circuits_destroy(tls_socket);
} else {
if (!circ.last_) {
circ.clear_t0_();
console.log('End from '+circ.server_.ip+' : close connection');
delete circ.ok_;
delete OP_sock[circ.server_.ip];
circ.circuit_retry();
} else {
circuits_destroy(tls_socket);
};
};
};
});
tls_socket_.on('error',function(error) {
clearTimeout(t0);
console.log('error client socket :'+error+' '+circ.server_.ip);
circ.destroy_=true;
tls_socket_.destroy();
if (!circ.last_) {
circ.change_or('initial socket error');
};
});
var do_not_wait=function() {
circ.destroy_=true;
tls_socket_.destroy();
console.log("socket - do not wait");
circ.change_or('initial socket failed');
};
circ.socket_=tls_socket_;
tls_socket_.first_=circ;
tls_socket_.server_=circ.server_;
tls_socket_.nbc_=0;
var t0=setTimeout(do_not_wait,2000);
};

var Tor=function(request,circuit) {
var params=request.params_;
if (params.OP) { //OP
if (!params.one_c) {
circuit_start(request);
} else {
if (circuit) {
console.log('relay begin failed');
if (choose_circuit(true)) {
circuit_start(request);
} else {
var circ=choose_circuit();
while (circuit===circ) {
circ=choose_circuit();
};
circ.process(request);
};
} else {
var circ=request.cid_?request.cid_:(params.one_c?choose_circuit():null);
if (circ) {
console.log('-------------------------------- Circuit choosen '+circ.server_.ip+' -------------------------------');
if (circ[request.sid_]) {
if (circ.last_) {
circ.last_.stream_handle_connected(request.sid_);
} else {
circ.destroy_cid(request.sid_);
Tor(request);
};
} else {
circ.process(request);
};
} else {
if (OP_req.length===0) {
circuit_start(request);
} else {
OP_req.push(request);
};
};
};
};
} else { //OR v3
var options = {
key: fs.readFileSync('server-key.pem'),
cert: fs.readFileSync('server.pem'),
requestCert: true
};
var server = tls.createServer(options, function(socket) {
console.log('--------------------OR launched------------------------------------');
socket.on('data', function(data) {
console.log('OR RECEIVE');
console.log(data.toString('hex'));
});
});
server.listen(params.port, function() {
console.log("server launched");
});
server.on('clientError',function(exception) {console.log(exception)});
};
};

var simpleParser=function(data) {
var res={};
data=data.split('\r\n');
data.forEach(function(val) {
val=val.split(':');
if (val.length>1) {
var p=val[0];
val=val.map(function(v) {return v.trim()});
val.shift();
val=val.join(':');
res[p]=val;
};
});
return res;
};

var handleRequest = function (request) {
console.log('------------------------------------- new incoming socket -----------------------------------------------');	
var socket_handle=function(data) {
var tab=data.split(':::');
if (tab.length===3) { //specific
request.params_={host:tab[0],OP:true,nb_hop:tab[1],stream:new Buffer((new Buffer(tab[2],'utf8')).toString('hex'),'hex'),one_c:tab[3]};
Tor(request);
} else { //protocols
var params={};
var res=simpleParser(data);
console.log(res);
params.OP=true;
params.nb_hop=NB_HOP;
params.one_c=true;
if (data.indexOf('WebSocket')!=-1) { //websocket
var key=res['Sec-WebSocket-Key'];
var H = crypto.createHash('sha1');
H.update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
var hash=H.digest('base64');
var resp='HTTP/1.1 101 WebSocket Protocol Handshake\r\n';
resp +='Upgrade: websocket\r\n';
resp +='Connection: Upgrade\r\n';
resp +='Sec-WebSocket-Accept:'+hash+'\r\n';
resp +='Access-Control-Allow-Origin:'+res['Origin']+'\r\n';
resp +='\r\n';
console.log(resp);
request.websocket_=true;
request.connected_=true;
request.write(resp);
return false;
};
if (data.indexOf('HTTP')!=-1) { //direct proxy
if (res.Host) {
params.host=res.Host+':80';
request.connected_=true;
};
};
params.stream=new Buffer((new Buffer(data,'utf8')).toString('hex'),'hex');
if (params.stream.slice(0,1).readUInt()===5) { //socks v5 proxy
request.socks_=true;
request.connected_=true;
request.write(new Buffer('0500','hex'));
return false;
};
return params;
};
};
request.on('data', function(data) {
//try {
console.log('------------- RECEIVED FROM INCOMING SOCKET ------------');
console.log(data.toString('utf8'));
console.log(data.toString('hex'));
console.log('--------------------------------------------------------');
var params;
if (!request.connected_) {
params=socket_handle(data.toString('utf8'));
} else {
params={};
params.OP=true;
params.nb_hop=NB_HOP;
params.one_c=true;
params.host=request.host_?request.host_:false;
params.stream=params.host?data:false;
if (request.websocket_) {
//TODO - decode websocket
};
if (request.socks_) {
if (!params.stream) {
switch (data.slice(3,4).readUInt()) {
case 1:request.host_=ValToIP(data.slice(4,8))+':'+data.slice(8).readUInt();break
case 3:var l=data.slice(4,5).readUInt();request.host_=(data.slice(5,5+l)).toString('utf8')+':'+data.slice(l+5).readUInt();break;
};
params.host=request.host_;
console.log(request.host_);
request.start_=[new Buffer('050000','hex'),data.slice(3)].concatBuffers();
request.params_=params;
Tor(request);
return;
};
};
};
if (params) {
if (params.stream) {
request.params_=params;
Tor (request);
};
};
//} catch(ee) {
// console.log('Bad formatted request');
//};
});
request.on('end',function() {console.log('-------------------------end incoming socket-------------------------------------')});
};

//TODO SSL (??)
var launchServer = function(port) {
net.createServer(handleRequest).listen(port,function() {console.log('incoming socket open')});
};
launchServer(8000);

