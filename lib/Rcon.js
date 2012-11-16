var Rcon = require('./NodeRcon').newHandle;
var config = require('../config');
var rcon = new Rcon();

rcon.connect(config.rcon.host, config.rcon.port, config.rcon.password, onConnected);


function onConnected(err, response){
	if(err){console.error(err);return;}

	console.log("connected", response);

	rcon.end();
}
