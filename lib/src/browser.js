const update_circ=function() {
	//browser
	let nb=(db_cid?1:0)+(NB_C>=0?NB_C:0);
	$_('direct_text').innerHTML='P2P (Peersm, BitTorrent) and web anonymized circuits : '+nb+(nb>1?' circuits':' circuit');
};

module.exports={update_circ};