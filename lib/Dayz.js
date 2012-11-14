var pd = require("pd");
var Helper = require("./Helper.js");
var config = require('../config');

var Dayz = {

	itemCount: {},

	initialize: function() {
		return this;
	},

	parseValue: function(val) {
		var text = val.replace(/[\[|\]|\"]/g, '');
		return text.split(',');
	},

	isNumber: function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},

	filterItems: function(items) {
		var newItems = [];
		for(var i = 0; i < items.length; i++) {
			if(this.isNumber(items[i]) || items[i] === '') {
				continue;
			}
			newItems.push(items[i]);
		}
		return newItems;
	},

	addItems: function(items) {
		for(var i = 0; i < items.length; i++) {
			var item = items[i];
			if(typeof this.itemCount[item] === 'undefined') {
				this.itemCount[item] = 1;
				continue;
			}
			this.itemCount[item]++;
		}
		return items;
	},

	parsePosition: function(worldspace) {
		var pos = this.parseValue(worldspace);
		return {
			x: pos[1],
			y: pos[2],
			z: pos[3]
		};
	},

	parseMedical: function(medical) {
		var values = this.parseValue(medical);
		var blood = values[7];
		var bloodPercent = Math.round(blood * 100 / 12000);
		return {
			blood: blood,
			bloodPercent: bloodPercent
		};
	},

	parseHumanity: function(humanity) {
		var humanityPercent = Math.round(humanity * 100 / 6500);
		return {
			humanity: humanity,
			humanityPercent: humanityPercent
		};
	},


	parseDate: function(date) {
		return date.toISOString().replace(/\.000/g, '');
	},

	parseInventory: function(inventory) {
		return this.addItems(this.filterItems(this.parseValue(inventory)));
	},

	parseBackpack: function(backpack) {
		return this.addItems(this.filterItems(this.parseValue(backpack)));
	},

	parseState: function(state) {
		var values = this.parseValue(state);
		return {
			weapon: values[0],
			state: values[1]
		};
	},

	setFlags: function(items) {
		if(typeof items === 'undefined') {
			return false;
		}
		var flags = {};
		for(var i = 1; i < items.length; i++) {
			var item = items[i];
			if(Helper.in_array(item, config.weapons.sniper)) {
				flags.sniper = true;
			}
		}
		return flags;
	},

	setSimplePos: function(worldspace) {
		var loc = {
			x: Math.round(worldspace.x / 100),
			y: Math.round(config.world.max_y / 100) - Math.round(worldspace.y / 100),
			z: Math.round(worldspace.z / 100)
		};
		loc.name = this.calculateLocationName(loc.x, loc.y);
		return loc;
	},

	calculateLocationName: function(x, y) {
		for(var i = 0; i < config.locations[config.worldname].length; i++) {
			var loc = config.locations[config.worldname][i];
			if(
				loc.x <= x && ((loc.x + loc.offset_x) >= x) &&
				loc.y <= y && ((loc.y + loc.offset_y) >= y)
			) {
				return loc.name;
			}
		}
		return null;
	}
};

module.exports = pd.extend({}, Dayz).initialize();