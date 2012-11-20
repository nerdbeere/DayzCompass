"use strict";

var pd = require("pd");
var Dayz = require('./Dayz.js');
var Helper = require('./Helper.js');
var config = require('../config');

var Deployables = pd.extend({}, Dayz, {
    initialize: function () {
        return this;
    },

    loadDeployables: function(callback) {
        if(this.lastUpdate > (+new Date() - 3000)) {
            return callback(this.data);
        }
        var that = this;
		var connection  = new config.Connection().getConnection();
		var query = 'SELECT d.class_name, id.* FROM instance_deployable as id LEFT JOIN deployable as d ON d.id = id.deployable_id';
		connection.query(query, function(err, rows, fields) {
			connection.end();
			if (err) {
                throw err;
            }
            that.data = that.parseDeployables(rows, that);
            that.lastUpdate = +new Date();
            callback(that.data);
        });
    },

    parseVehicle: function(deployable) {

        deployable.worldspace = this.parsePosition(deployable.worldspace);
        deployable.simplePos = this.setSimplePos(deployable.worldspace);
        deployable.inventory = this.parseInventory(deployable.inventory);
        deployable.flags = this.setFlags(deployable.inventory);

        return deployable;
    },

    parseDeployables: function(deployables, that) {
        var newDeployables = [];
        for(var i = 0; i < deployables.length; i++) {
            var deployable = that.parseVehicle(deployables[i]);
            deployable.name = deployable.class_name;
            newDeployables[i] = deployable;
        }
        return newDeployables;
    },

    getAll: function(callback) {
        return this.loadDeployables(callback);
    }
});

module.exports = pd.extend({}, Deployables).initialize();
