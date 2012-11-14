"use strict";

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.set("view options", {layout: false});
  app.engine('html', require('ejs').renderFile);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var Survivors = require('./lib/Survivors.js');
var Vehicles = require('./lib/Vehicles.js');

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

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
