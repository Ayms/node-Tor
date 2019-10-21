const {createIdLinkTLSCert}=require('./abstract-tls.js');
const {Rand}=require('./crypto.js');
const fs=require('fs');
const Cell=require('./cells.js');
const {init_request}=require('./requests.js');
const {url_decode}=require('./utils.js');

const client_tls_options= function(or_name) {
	let servername='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.net';
	let issuer='www.'+Rand(Math.floor(Math.random()*20+4)).toString('hex')+'.com';
	let options = {
		key: fs.readFileSync(pathd+or_name+'/priv-key.pem'),
		cert: createIdLinkTLSCert(pathd+or_name+'/pub-key.pem',pathd+or_name+'/priv-key.pem','pem',parseInt((Rand(8)).toString('hex'),16),new Date(),servername,issuer),
		servername: servername,
		rejectUnauthorized: false
	};
	return options
};

const init_socket=function(circ) {
	OP_sock[circ.server_.ip]=this;
	this[circ.circId]=circ;
	this.stream_tor_=new Buffer(0);
	let cell=new Cell(circ.circId,Cell.prototype.VERSIONS,(new Buffer(2)).writeUInt(3));
	circ.send(cell);
};

const ini_nosocks_request=function(url) {
	let request={};
	init_request.call(request);
	request.params_={};
	request.params_.OP=true;
	request.params_.nb_hop=NB_HOP;
	request.params_.one_c=true;
	request.nb_try=0;
	request.no_exit=[];
	request.squeue_=[];
	request.wsqueue_=[];
	request._date_=Date.now();
	request.i_id=db_id;
	db_id++;
	url=url_decode(url);
	request.params_.host=url.host;
	//let d=new Date();
	let get='GET /'+url.rest+' HTTP/1.1\r\n';
	get +='Host: '+url.host+'\r\n';
	get +='User-Agent: Mozilla/5.0 (Windows NT 6.0; WOW64; rv:22.0) Gecko/20100101 Firefox/22.0.1\r\n';
	get +='Accept: */*\r\n';
	get +='Accept-Language: en\r\n';
	get +='Accept-Encoding: gzip, deflate\r\n';
	get +='Connection: keep-alive\r\n';
	get +='\r\n';
	request.params_.stream=new Buffer(get,'utf8');
	//request.stream=get_request('www.kickstarter.com','projects/450023/ianonym-internet-privacy-everywhere-from-any-devic');
	request.remotePort='60000';
	request.remoteAddress='1.2.3.4';
	request.write=function() {				};
	request.end=function() {};
	request.destroy=function() {};
	request.close=function() {};
	request._init_=init_request;
	request._write_=request.write;
	return request;
};

module.exports={client_tls_options,init_socket,ini_nosocks_request};