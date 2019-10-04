const Stream=function(command,streamId,data,D) {
	this.command=(new Buffer(1)).writeUInt(command);
	this.recognize=new Buffer('0000','hex');
	this.streamId=(new Buffer(2)).writeUInt(streamId);
	this.digest=new Buffer('00000000','hex');
	this.length=(new Buffer(2)).writeUInt(data.length);
	this.data=command===this.RELAY_WS?new Buffer(data.length):new Buffer(this.PAYLOAD_STREAM);
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
	RELAY_ASSOCIATE:40,//ianonym
	RELAY_WS:41,//ianonym
	RELAY_INFO:42,//ianonym
	RELAY_DB_INFO:80,//download
	RELAY_DB_QUERY:81,//download
	RELAY_DB_CONNECTED:82,//download
	RELAY_DB_DATA:83,//download
	RELAY_DB_END:84,
	RELAY_DB_SENDME:85,
	PAYLOAD_STREAM:498,
	toBuffer:function() {
		return [this.command,this.recognize,this.streamId,this.digest,this.length,this.data].concatBuffers();
	}
};

module.exports=Stream;