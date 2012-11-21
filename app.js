"use strict";

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path');

var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');
	app.use(express.cookieParser());
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'keyboard cat' }));
	app.use(express.methodOverride());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
	app.set("view options", {layout: false});
	app.engine('html', require('ejs').renderFile);
});

var user = {
	id: 1,
	username: 'admin',
	password: 'test'
}

passport.use(new LocalStrategy(
	function(username, password, done) {
		if (username != user.username || password != user.password) {
			return done(null, false, { message: 'Incorrect password.' });
		}
		return done(null, user);
	}
));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	done(null, user);
});

app.post('/login',
	passport.authenticate('local', {
		successRedirect: '/'
	}),
	function(req, res) {
		// If this function gets called, authentication was successful.
		// `req.user` contains the authenticated user.
		console.log('success');
	}
);

app.get('/login',
	function (req, res) {
		res.render('../views/login.html');
	}
);

app.configure('development', function(){
  app.use(express.errorHandler());
});

var Survivors = require('./lib/Survivors.js');
var Vehicles = require('./lib/Vehicles.js');
var Deployables = require('./lib/Deployables.js');
var Rcon = require('./lib/Rcon.js');

app.get('/get_survivors', function(req, res){
	Survivors.getAll(function(data) {
        res.json(data);
    });
});

app.get('/get_weapon_stats', function(req, res){
	Survivors.getWeaponStats(function(data) {
		res.json(data);
	});
});

app.get('/get_vehicles', function(req, res){
	Vehicles.getAll(function(data) {
		res.json(data);
	});
});

app.get('/get_deployables', function(req, res){
	Deployables.getAll(function(data) {
		res.json(data);
	});
});

app.get('/', function(req, res) {
	res.render('../views/index.html');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
