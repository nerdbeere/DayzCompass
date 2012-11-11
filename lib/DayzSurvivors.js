"use strict";

var mysql = require('mysql');
var config = require('../config');
var connection  = mysql.createConnection({
    host     : config.db_host,
    user     : config.db_username,
    password : config.db_password,
    database : config.db_database
});

connection.connect();

var DayzSurvivors = function() {

    var idMap = {};
    var lastUpdate = 0;
    var data = [];

    function load(callback) {
        if(lastUpdate > (+new Date() - 3000)) {
            return callback(data);
        }
        connection.query('SELECT * FROM survivor INNER JOIN profile ON survivor.unique_id = profile.unique_id WHERE is_dead = 0 AND survival_time > 0 ORDER BY last_updated DESC', function(err, rows, fields) {
            if (err) {
                throw err;
            }
            data = parseSurvivors(rows);
            lastUpdate = +new Date();
            callback(data);
        });
    }

    function parseValue(val) {
        var text = val.replace(/[\[|\]|\"]/g, '');
        return text.split(',');
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function filterItems(items) {
        var newItems = [];
        for(var i = 0; i < items.length; i++) {
            if(isNumber(items[i]) || items[i] === '') {
                continue;
            }
            newItems.push(items[i]);
        }
        return newItems;
    }

    function parsePosition(worldspace) {
        var pos = parseValue(worldspace);
        return {
            x: pos[1],
            y: pos[2],
            z: pos[3]
        };
    }

    function parseMedical(medical) {
        var values = parseValue(medical);
        var blood = values[7];
        var bloodPercent = Math.round(blood * 100 / 12000);
        return {
            blood: blood,
            bloodPercent: bloodPercent
        };
    }

    function parseDate(date) {
        return date.toISOString().replace(/\.000/g, '');
    }

    function parseInventory(inventory) {
        return filterItems(parseValue(inventory));
    }

    function parseBackpack(backpack) {
        return filterItems(parseValue(backpack));
    }

    function parseState(state) {
        var values = parseValue(state);
        return {
            weapon: values[0],
            state: values[1]
        };
    }

    function parseSurvivor(survivor) {

        survivor.worldspace = parsePosition(survivor.worldspace);
        survivor.inventory = parseInventory(survivor.inventory);
        survivor.backpack = parseBackpack(survivor.backpack);
        survivor.medical = parseMedical(survivor.medical);
        survivor.state = parseState(survivor.state);
        survivor.last_updated = parseDate(survivor.last_updated);

        return survivor;
    }

    function parseSurvivors(survivors) {
        var newSurvivors = [];
        for(var i = 0; i < survivors.length; i++) {
            var survivor = parseSurvivor(survivors[i]);
            idMap[survivor.unique_id] = i;
            newSurvivors[i] = survivor;
        }
        return newSurvivors;
    }

    return {

        /**
         * Get a single survivor
         * @param id
         * @return object
         */
        get: function(id, callback) {
            return load(function(data) {
                callback(data[idMap[id]]);
            });
        },

        /**
         * Get all survivors
         * @return array
         */
        getAll: function(callback) {
            return load(callback);
        }
    };
};

module.exports = DayzSurvivors;
