"use strict";

var pd = require("pd");
var Dayz = require('./Dayz.js');
var Helper = require('./Helper.js');
var config = require('../config');

var Survivors = pd.extend({}, Dayz, {

	// Total zombie kills
	//
	// select p.total_zombie_kills + coalesce(s.zombie_kills, 0) from
	// profile p left join survivor s on p.unique_id = s.unique_id
	// and s.is_dead = 0 where p.unique_id = '?';

	initialize: function () {
		return this;
	},

	idMap: {},

	load: function(callback) {
		if(this.lastUpdate > (+new Date() - 3000)) {
			return callback(this.data);
		}
		var that = this;
		var connection  = new config.Connection().getConnection();

		connection.query('SELECT * FROM survivor INNER JOIN profile ON survivor.unique_id = profile.unique_id WHERE survivor.is_dead = 0 AND survival_time > 0 ORDER BY last_updated DESC LIMIT 100', function(err, rows, fields) {
			connection.end();
			if (err) {
				throw err;
			}
			that.itemCount = {};
			that.data = that.parseSurvivors(rows, that);
			that.lastUpdate = +new Date();
			callback(that.data);
		});
	},

	getItemStats: function(callback, that) {
		var items = Helper.arsort(that.itemCount);
		var newItems = [];
		Object.keys(items).forEach(function(key) {
			var value = items[key];
			newItems.push({name: key, amount: value});
		});
		callback(newItems);
	},

	parseSurvivor: function(survivor) {

		survivor.worldspace = this.parsePosition(survivor.worldspace);
		survivor.simplePos = this.setSimplePos(survivor.worldspace);
		survivor.inventory = this.parseInventory(survivor.inventory);
		survivor.backpack = this.parseBackpack(survivor.backpack);
		survivor.medical = this.parseMedical(survivor.medical);
		survivor.state = this.parseState(survivor.state);
		survivor.last_updated = this.parseDate(survivor.last_updated);
		survivor.humanity = this.parseHumanity(survivor.humanity);
		survivor.flags = this.setFlags(Helper.array_merge(survivor.backpack, survivor.inventory));

		return survivor;
	},

	parseSurvivors: function(survivors, that) {
		var newSurvivors = [];
		for(var i = 0; i < survivors.length; i++) {
			var survivor = that.parseSurvivor(survivors[i]);
			that.idMap[survivor.unique_id] = i;
			newSurvivors[i] = survivor;
		}
		return newSurvivors;
	},

	get: function (id, callback) {
		return this.load(function (data) {
			callback(data[idMap[id]]);
		});
	},

	getAll: function (callback) {
		return this.load(callback);
	},

	getWeaponStats: function (callback) {
		var that = this;
		return that.load(function () {
			that.getItemStats(callback, that);
		});
	}
});

module.exports = pd.extend({}, Survivors).initialize();
