var Map = {
	Demo: {},
	infowindow: null,
	marker: null,
	mapMarkers: [],
	MapContainer: null,
	previousPositions: {},
	previousVehiclePositions: {},
	cleanupTimeout: 0,
	vehicleIconMap: {
		'UH1H_DZ': 'helicopter',
		'Mi17_Civilian_Nam': 'helicopter',
		'Smallboat_1': 'boat',
		'Fishing_Boat': 'boat',
		'PBX': 'boat',
		'smallboat_2': 'boat',
		'SUV_TK_CIV_EP1': 'sportutilityvehicle',
		'UAZ_Unarmed_TK_EP1': 'fourbyfour',
		'UAZ_Unarmed_TK_CIV_EP1': 'fourbyfour',
		'UAZ_Unarmed_UN_EP1': 'fourbyfour',
		'UAZ_RU': 'fourbyfour',
		'LandRover_CZ_EP1': 'fourbyfour',
		'V3S_Civ': 'truck3',
		'TT650_Ins': 'motorcycle',
		'TT650_TK_EP1': 'motorcycle',
		'TT650_TK_CIV_EP1': 'motorcycle'
	},

	initialize: function() {

		if(this.MapContainer) {
			return this;
		}

		this.cleanupTimeout = +new Date();

		this.MapContainer = $('#cherno-map');
		this.MapContainer.width($(window).width() - 213);
		this.MapContainer.height($(window).height() - 40);

		this.Demo.ImagesBaseUrl = 'http://xrayalpha.de/BlissAdmin/' + 'tiles/';

		this.pixelOrigin_ = new google.maps.Point(128, 128);
		this.pixelsPerLonDegree_ = 256 / 360;
		this.pixelsPerLonRadian_ = 256 / (2 * Math.PI);

		var that = this;

		this.infowindow = new google.maps.InfoWindow({
			content: "loading..."
		});

		that.Demo.ChernoMap = function (container) {
			// Create map
			this._map = new google.maps.Map(container, {
				zoom: 3,
				center: new google.maps.LatLng(0, 0),
				mapTypeControl: false,
				disableDefaultUI: true,
				streetViewControl: false
			});
			var map = this._map;
			var pt2 = new google.maps.Point(5, 0.66);
			//15360/zoom/256 = 30
			// map.fromPointToLatLng(pt2, 2)
			// 360/(x / xp) ||  180 - (y / yp)  left:1477.1 top:190.7
			// Creating a marker and positioning it on the map  x = 45.5, y = 47.25 72.85  94.5 85.055, 180


			function borders(){
				return {
					maxLat : map.getBounds().getNorthEast().lat(),
					maxLng : map.getBounds().getNorthEast().lng(),
					minLat : map.getBounds().getSouthWest().lat(),
					minLng : map.getBounds().getSouthWest().lng(),
					center : map.getCenter()
				}
			}


			/* var marker = new google.maps.Marker({
			 position: new google.maps.LatLng(84.6813202242, -147.544189453125),
			 map: map,
			 title: 'My workplace',
			 clickable: true,
			 //icon: 'http://google-maps-icons.googlecode.com/files/car.png',
			 zIndex: 10
			 });

			 google.maps.event.addListener(marker, 'click', function () {
			 // where I have added .html to the marker object.
			 //alert(google.maps.MapCanvasProjection.getWorldWidth());
			 infowindow.setContent('Hello world');
			 infowindow.open(map, this);
			 }); */


			// Set custom tiles
			this._map.mapTypes.set('cherno', new that.Demo.ImgMapType('cherno', '#000000'));
			this._map.setMapTypeId('cherno');
		};

		google.maps.Map.prototype.clearMarkers = function(id) {
			for(var i = 0; i < that.mapMarkers.length; i++){
				that.mapMarkers[i].setMap(null);
			}
			that.mapMarkers = new Array();
		};

		// ImgMapType class
		//////////////////////////////////
		that.Demo.ImgMapType = function (theme, backgroundColor) {
			this.name = this._theme = theme;
			this._backgroundColor = backgroundColor;
		};

		that.Demo.ImgMapType.prototype.tileSize = new google.maps.Size(256, 256);
		that.Demo.ImgMapType.prototype.minZoom = 2;
		that.Demo.ImgMapType.prototype.maxZoom = 6;

		that.Demo.ImgMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
			var tilesCount = Math.pow(2, zoom);

			if (coord.x >= tilesCount || coord.x < 0 || coord.y >= tilesCount || coord.y < 0) {
				var div = ownerDocument.createElement('div');
				div.style.width = this.tileSize.width + 'px';
				div.style.height = this.tileSize.height + 'px';
				div.style.backgroundColor = this._backgroundColor;
				return div;
			}

			var img = ownerDocument.createElement('IMG');
			img.width = this.tileSize.width;
			img.height = this.tileSize.height;
			img.src = that.Demo.Utils.GetImageUrl(this._theme + '/tile_' + zoom + '_' + coord.x + '_' + coord.y + '-fs8.png');

			return img;
		};

		// ZoomButtonControl class
		//////////////////////////////////
		that.Demo.ZoomButtonControl = function (container, map, level) {
			var button = document.createElement('IMG');
			button.style.cursor = 'pointer';
			button.src = that.Demo.Utils.GetImageUrl(level > 0 ? 'plus.png' : 'minus.png');
			container.appendChild(button);

			google.maps.event.addDomListener(button, 'click', function () {
				map.setZoom(map.getZoom() + level);
			});
		};

		// ImageControl class
		//////////////////////////////////
		that.Demo.ImageControl = function (image, container, map, callback) {
			var button = document.createElement('IMG');
			button.style.cursor = 'pointer';
			button.style.display = 'block';
			button.src = that.Demo.Utils.GetImageUrl(image);
			container.appendChild(button);

			google.maps.event.addDomListener(button, 'click', function () {
				callback();
			});
		};

		// ZoomLevelsControl class
		//////////////////////////////////
		that.Demo.ZoomLevelsControl = function (container, map) {
			this._container = container;
			this._map = map;

			this._buildUI();
			this._updateUI();
			this._bindZoomEvent();
		};

		that.Demo.ZoomLevelsControl.prototype._buildUI = function () {
			var currentMapType = this._map.mapTypes.get(this._map.getMapTypeId());

			for (var i = currentMapType.maxZoom; i >= currentMapType.minZoom; i--) {
				var level = document.createElement('IMG');
				level.style.cursor = 'pointer';
				if (i != currentMapType.minZoom) level.style.marginBottom = '2px';
				level.style.display = 'block';
				level.src = that.Demo.Utils.GetImageUrl('level.png');
				this._bindLevelClick(level, i);
				this._container.appendChild(level);
			}
		};

		that.Demo.ZoomLevelsControl.prototype._updateUI = function () {
			var currentMapType = this._map.mapTypes.get(this._map.getMapTypeId());
			var currentZoom = this._map.getZoom();
			var levelsCount = currentMapType.maxZoom - currentMapType.minZoom;

			for (var i = 0; i < levelsCount; i++)
				that.Demo.Utils.SetOpacity(this._container.childNodes[i], (currentMapType.maxZoom - i) <= currentZoom ? 100 : 30);
		};

		that.Demo.ZoomLevelsControl.prototype._bindZoomEvent = function () {
			var self = this;

			google.maps.event.addListener(this._map, 'zoom_changed', function () {
				self._updateUI();
			});
		};

		that.Demo.ZoomLevelsControl.prototype._bindLevelClick = function (bar, zoom) {
			var self = this;

			google.maps.event.addDomListener(bar, 'click', function () {
				self._map.setZoom(zoom);
			});
		};

		// TextWindow class
		//////////////////////////////////
		that.Demo.TextWindow = function (map) {
			this._map = map;
			this._window = null;
			this._text = null;
			this._position = null;
		};

		that.Demo.TextWindow.prototype = new google.maps.OverlayView();

		that.Demo.TextWindow.prototype.open = function (latlng, text) {
			if (this._window != null) this.close();

			this._text = text;
			this._position = latlng;

			this.setMap(this._map);
		};

		that.Demo.TextWindow.prototype.close = function () {
			this.setMap(null);
		};

		that.Demo.TextWindow.prototype.onAdd = function () {
			this._window = document.createElement('DIV');
			this._window.style.position = 'absolute';
			this._window.style.cursor = 'default';
			this._window.style.padding = '40px 20px 0px 20px';
			this._window.style.textAlign = 'center';
			this._window.style.fontFamily = 'Arial,sans-serif';
			this._window.style.fontWeight = 'bold';
			this._window.style.fontSize = '12px';
			this._window.style.width = '88px';
			this._window.style.height = '88px';
			this._window.style.background = 'url(' + that.Demo.Utils.GetImageUrl('window.png') + ')';
			this._window.innerHTML = this._text;

			this.getPanes().floatPane.appendChild(this._window);
		};

		that.Demo.TextWindow.prototype.draw = function () {
			var point = this.getProjection().fromLatLngToDivPixel(this._position);

			this._window.style.top = (parseInt(point.y) - 128) + 'px';
			this._window.style.left = (parseInt(point.x) - 110) + 'px';
		};

		that.Demo.TextWindow.prototype.onRemove = function () {
			this._window.parentNode.removeChild(this._window);
			this._window = null;
		};

		// Other
		//////////////////////////////////
		that.Demo.Utils = that.Demo.Utils || {};

		that.Demo.Utils.GetImageUrl = function (image) {
			return that.Demo.ImagesBaseUrl + image;
		};

		that.Demo.Utils.SetOpacity = function (obj, opacity /* 0 to 100 */ ) {
			obj.style.opacity = opacity / 100;
			obj.style.filter = 'alpha(opacity=' + opacity + ')';
		};

		that.ChernoMap;
		that.ChernoMap = new that.Demo.ChernoMap(document.getElementById('cherno-map'));

		google.maps.event.addListener(this.ChernoMap._map, 'zoom_changed', function() {

			if (this.getZoom() < 2) this.setZoom(2);
		});

		setInterval(function() {that.showSurvivors();}, 1000);
		that.showSurvivors();

		setInterval(function() {that.showVehicles();}, 1000);
		that.showVehicles();
	},

	degreesToRadians: function(deg) {
		return deg * (Math.PI / 180);
	},

	radiansToDegrees: function(rad) {
		return rad / (Math.PI / 180);
	},

	calcLocationData: function(data) {
		var x = data.worldspace.x;
		var y = Number(data.worldspace.y) + 1024;

		var lng = (x / 64 - this.pixelOrigin_.x) / this.pixelsPerLonDegree_;
		var latRadians = (y / 64 - this.pixelOrigin_.y) / this.pixelsPerLonRadian_;
		var lat = this.radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);

		return {
			x: x,
			y: y,
			lng: lng,
			latRadians: latRadians,
			lat: lat
		};
	},

	showSurvivors: function() {

		var survivors = Survivors.getSurvivors();

		var map = this.ChernoMap._map;

		// Cleanup all markers every 30 seconds
		if(this.cleanupTimeout < +new Date() - 30000) {
			map.clearMarkers();
			this.previousVehiclePositions ={};
			this.cleanupTimeout = +new Date();
		}

		if(typeof survivors == 'undefined') {
			return false;
		}

		for (i = 0; i < survivors.length; i++) {

			// only show users which were active in the last 2 minutes
			if(+new Date(survivors[i].last_updated) < +new Date() - 120000) {
				continue;
			}

			var location = this.calcLocationData(survivors[i]);

			// check if marker is already painted on the map
			if(typeof this.previousPositions[survivors[i].unique_id] != 'undefined') {
				// only reposition the marker if the position has changed
				if(this.previousPositions[survivors[i].unique_id].x != location.x || this.previousPositions[survivors[i].unique_id].y != location.y) {
					var walkCoords = [
						new google.maps.LatLng(this.previousPositions[survivors[i].unique_id].lat, this.previousPositions[survivors[i].unique_id].lng),
						new google.maps.LatLng(location.lat, location.lng)
					];
					var walkPath = new google.maps.Polyline({
						path: walkCoords,
						strokeColor: '#FF0000',
						strokeOpacity: 0.7,
						strokeWeight: 2
					});

					walkPath.setMap(map);

					// cache current survivor position
					this.previousPositions[survivors[i].unique_id].x = survivors[i].worldspace.x;
					this.previousPositions[survivors[i].unique_id].y = survivors[i].worldspace.y;
					this.previousPositions[survivors[i].unique_id].lat = location.lat;
					this.previousPositions[survivors[i].unique_id].lng = location.lng;

					this.previousPositions[survivors[i].unique_id].marker.setPosition(new google.maps.LatLng(location.lat, location.lng));
				}
				continue;
			}

			// create marker
			this.marker = new google.maps.Marker({
				position: new google.maps.LatLng(location.lat, location.lng),
				map: map,
				title: survivors[i].name,
				survivorId: survivors[i].unique_id,
				icon: '/img/icons/male-2.png'
			});


			// cache current survivor position
			this.previousPositions[survivors[i].unique_id] = {
				x: survivors[i].worldspace.x,
				y: survivors[i].worldspace.y,
				lat: location.lat,
				lng: location.lng,
				marker: this.marker
			};

			this.mapMarkers.push(this.marker);

			var that = this;
			google.maps.event.addListener(this.marker, 'click', (function(marker, i) {
				return function() {
					Survivors.changeHash('survivor', marker.survivorId);
				}
			})(this.marker, i));
		}
	},

	showVehicles: function() {

		var vehicles = Survivors.getVehicles();

		var map = this.ChernoMap._map;

		// Cleanup all markers every 30 seconds
		if(this.cleanupTimeout < +new Date() - 30000) {
			map.clearMarkers();
			this.previousVehiclePositions ={};
			this.cleanupTimeout = +new Date();
		}

		if(typeof vehicles == 'undefined') {
			return false;
		}

		for (i = 0; i < vehicles.length; i++) {

			var location = this.calcLocationData(vehicles[i]);

			// check if marker is already painted on the map
			if(typeof this.previousVehiclePositions[vehicles[i].id] != 'undefined') {
				// only reposition the marker if the position has changed
				if(this.previousVehiclePositions[vehicles[i].id].x != location.x || this.previousVehiclePositions[vehicles[i].id].y != location.y) {

					// cache current survivor position
					this.previousVehiclePositions[vehicles[i].id].x = vehicles[i].worldspace.x;
					this.previousVehiclePositions[vehicles[i].id].y = vehicles[i].worldspace.y;
					this.previousVehiclePositions[vehicles[i].id].lat = location.lat;
					this.previousVehiclePositions[vehicles[i].id].lng = location.lng;

					this.previousVehiclePositions[vehicles[i].id].marker.setPosition(new google.maps.LatLng(location.lat, location.lng));
				}
				continue;
			}

			// create marker
			this.marker = new google.maps.Marker({
				position: new google.maps.LatLng(location.lat, location.lng),
				map: map,
				title: vehicles[i].name,
				survivorId: vehicles[i].id,
				icon: this.getVehicleIconByClassName(vehicles[i].class_name)
			});


			// cache current survivor position
			this.previousVehiclePositions[vehicles[i].id] = {
				x: vehicles[i].worldspace.x,
				y: vehicles[i].worldspace.y,
				lat: location.lat,
				lng: location.lng,
				marker: this.marker
			};

			this.mapMarkers.push(this.marker);
		}
	},

	getVehicleIconByClassName: function(className) {
		if(typeof this.vehicleIconMap[className] == 'undefined') {
			return '/img/icons/car.png';
		}
		return '/img/icons/' + this.vehicleIconMap[className] + '.png';
	}
};

