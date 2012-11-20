"use strict";

var pd = require("pd");
var Dayz = require('./Dayz.js');
var Helper = require('./Helper.js');
var config = require('../config');

var Vehicles = pd.extend({}, Dayz, {
    initialize: function () {
        return this;
    },

    loadVehicles: function(callback) {
        if(this.lastUpdate > (+new Date() - 3000)) {
            return callback(this.data);
        }
        var that = this;
		var connection  = new config.Connection().getConnection();
		var query = 'SELECT v.class_name, iv.* FROM instance_vehicle as iv LEFT JOIN world_vehicle as wv ON wv.id = iv.world_vehicle_id LEFT JOIN vehicle as v ON v.id = wv.vehicle_id';
		connection.query(query, function(err, rows, fields) {
			connection.end();
			if (err) {
                throw err;
            }
            that.data = that.parseVehicles(rows, that);
            that.lastUpdate = +new Date();
            callback(that.data);
        });
    },

    parseVehicle: function(vehicle) {

        vehicle.worldspace = this.parsePosition(vehicle.worldspace);
        vehicle.simplePos = this.setSimplePos(vehicle.worldspace);
        vehicle.inventory = this.parseInventory(vehicle.inventory);
        vehicle.parts = this.parseParts(vehicle.parts);
        vehicle.flags = this.setFlags(vehicle.inventory);

        return vehicle;
    },

    parseVehicles: function(vehicles, that) {
        var newVehicles = [];
        for(var i = 0; i < vehicles.length; i++) {
            var vehicle = that.parseVehicle(vehicles[i]);
            vehicle.name = vehicle.class_name;
            newVehicles[i] = vehicle;
        }
        return newVehicles;
    },

    getAll: function(callback) {
        return this.loadVehicles(callback);
    }
});

module.exports = pd.extend({}, Vehicles).initialize();
