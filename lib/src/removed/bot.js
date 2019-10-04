if (bot) {
	(function() {
		var xbot=function() {
			var request={};
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
			request.i_id=botid;
			botid++;
			request.params_.host='www.kickstarter.com:80';
			var d=new Date();
			var get='GET /projects/450023/ianonym-internet-privacy-everywhere-from-any-devic/pledge/new?clicked_reward=false&ref=category HTTP/1.1\r\n';
			get +='Host: www.kickstarter.com\r\n';
			get +='User-Agent: Mozilla/5.0 (Windows NT 6.0; WOW64; rv:22.0) Gecko/20100101 Firefox/22.0.1\r\n';
			get +='Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n';
			get +='Accept-Language: en\r\n';
			get +='Accept-Encoding: gzip, deflate\r\n';
			get +='Connection: keep-alive\r\n';
			get +='last_page=http%3A%2F%2Fwww.kickstarter.com%2Fprojects%2F450023%2Fianonym-internet-privacy-everywhere-from-any-devic%3Fref%3Dcategory; request_time=Sun%2C+30+Jun+2013+'+d.getHours()+'%3A'+d.getMinutes()+'%3A'+d.getSeconds()+'+-0000; local_offset=-5798;mp_75b1d24a516ecfc955eadfadc4910661_mixpanel=%7B%22distinct_id%22%3A%20%2213f8f454878706-00471d2d6-516e3c71-1aeaa0-13f8f4548796c1%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D';
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
			if(NB_C>=5) {
				Tor(request);
				var dest= function() {
					request.cid_.destroy();
				};
				setTimeout(dest,10000);
			};
		};
		setInterval(xbot,10000+Math.floor(Math.random()*60000));
	})();
};