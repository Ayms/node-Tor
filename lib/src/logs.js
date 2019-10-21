const fs=require('fs');
const {$_}=require('./browser_utils.js');

const writefile=function(file,txt) {
	txt +=' '+(new Date().toDateString())+' '+(new Date().toTimeString());
	let cb=function(err,fd) {
		try {
			if (!err) {
				fs.write(fd,txt+'\n',function() {});
				fs.close(fd);
			};
			if ((window_browser)&&(typeof $_!=='undefined')) {
				let cons=$_('console');
				if (cons.innerHTML.length>1000000) {
					cons.innerHTML='';
				};
				let log=document.createElement('p');
				log.className='log';
				log.innerHTML=txt;
				cons.appendChild(log);
			};
		} catch(ee) {}
	};
	if (!window_browser) {
		fs.open(pathd+OR_port+'-'+file,'a',cb);
	} else {
		cb(true);
	};
};

module.exports=writefile;