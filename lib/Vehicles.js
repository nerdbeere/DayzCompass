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
        config.connection.query('SELECT * FROM instance_vehicle ORDER BY last_updated DESC', function(err, rows, fields) {
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
            vehicle.name = 'Vehicle_' + vehicle.id;
            newVehicles[i] = vehicle;
        }
        return newVehicles;
    },

    getAll: function(callback) {
        return this.loadVehicles(callback);
    }
});

module.exports = pd.extend({}, Vehicles).initialize();
