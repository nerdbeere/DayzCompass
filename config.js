var config = {};

config.db_host = '';
config.db_username = '';
config.db_password = '';
config.db_database = '';

config.worldname = 'chernarus';

config.rcon = {
	host: '',
	port: 2302,
	password: ''
};

config.weapons = {
	sniper: [
		'DMR',
		'M24',
		'M14_EP1',
		'BAF_L85A2_RIS_CWS'
	]
};

config.locations = {
	chernarus: [
		{
			name: 'Airstrip',
			x: 38,
			y: 43,
			offset_x: 13,
			offset_y: 15
		},
		{
			name: 'Berezino',
			x: 116,
			y: 49,
			offset_x: 16,
			offset_y: 6
		},
		{
			name: 'Stary Sobor',
			x: 58,
			y: 73,
			offset_x: 6,
			offset_y: 5
		},
		{
			name: 'Zelenogorsk',
			x: 23,
			y: 96,
			offset_x: 8,
			offset_y: 10
		},
		{
			name: 'Chernogorsk',
			x: 61,
			y: 121,
			offset_x: 14,
			offset_y: 10
		},
		{
			name: 'Elektrozavodsk',
			x: 93,
			y: 127,
			offset_x: 16,
			offset_y: 10
		},
	]
};

var mysql = require('mysql');

config.connection = mysql.createConnection({
	host: config.db_host,
	user: config.db_username,
	password: config.db_password,
	database: config.db_database
});

config.connection.connect();

config.world = null;
config.getWorld = function(callback) {
	if(this.world) {
		callback(this.world);
	}
	config.connection.query('SELECT * FROM world WHERE name = "' + this.worldname + '";', function(err, rows, fields) {
		if (err) {
			throw err;
		}
		config.world = rows[0];
		callback(rows[0]);
	});
};

config.getWorld(function() {});

module.exports = config;