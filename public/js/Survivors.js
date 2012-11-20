var Survivors = (function() {
    "use strict";

    var survivors = [];
    var vehicles = [];
    var selectedSurvivor = null;
    var renderedWeapons = 0;
    var renderedVehicles = 0;
    var weaponCount = 0;
    var vehicleCount = 0;
    var survivorIsActive = false;
	var previousHash = '#';
    var viewModel = {
        survivors: ko.observableArray([]),
        weapons: ko.observableArray([]),
        headline: ko.observable('Dashboard'),
        vehicles: ko.observableArray([]),
        survivor: {
            name: ko.observable(''),
            timeago: ko.observable(''),
            blood: ko.observable(''),
            bloodPercent: ko.observable(''),
            getBloodPercent: ko.observable(''),
            bloodLabel: ko.observable(''),
            getHumanityPercent: ko.observable(''),
            humanityPercent: ko.observable(''),
            humanityLabel: ko.observable(''),
            positionLabel: ko.observable('')
        }
    };

    function loadSurvivors(callback) {
        $.getJSON('/get_survivors', function(data) {
            survivors = data;
            survivors = addTimestamps(survivors);
            survivors = addAzimuthCss(survivors);
            viewModel.survivors.removeAll();
            for(var i = 0; i < survivors.length; i++) {
                if(selectedSurvivor == survivors[i].unique_id) {
                    showSurvivor(survivors[i]);
                }
                viewModel.survivors.push(survivors[i]);
            }
            if(typeof callback === 'function') {
                callback();
            }
            calcHealthbar();
            determineRowColor();
        });
    }

    function loadVehicles(callback) {
        $.getJSON('/get_vehicles', function(data) {
            vehicles = data;
            vehicles = addTimestamps(vehicles);
            viewModel.vehicles.removeAll();
            vehicleCount = data.length;
            for(var i = 0; i < vehicles.length; i++) {
                viewModel.vehicles.push(vehicles[i]);
            }
            if(typeof callback === 'function') {
                callback();
            }
        });
    }

	function loadWeapons(callback) {
        renderedWeapons = 0;
		$.getJSON('/get_weapon_stats', function(data) {
			viewModel.weapons.removeAll();
            weaponCount = data.length;
			for(var i = 0; i < data.length; i++) {
				viewModel.weapons.push(data[i]);
			}
			if(typeof callback === 'function') {
				callback();
			}
		});
	}

    function showSurvivor(survivor) {
        viewModel.survivor.name(survivor.name);
        viewModel.survivor.timeago(survivor.timeago);
        viewModel.survivor.blood(survivor.medical.blood);

        viewModel.survivor.bloodPercent(survivor.medical.bloodPercent);
        viewModel.survivor.getBloodPercent(survivor.medical.bloodPercent + '%');
        viewModel.survivor.bloodLabel(survivor.medical.bloodPercent + '% (' + survivor.medical.blood + ')');

        viewModel.survivor.humanityPercent(survivor.humanity.humanityPercent);
        viewModel.survivor.getHumanityPercent(survivor.humanity.humanityPercent + '%');
        viewModel.survivor.humanityLabel(survivor.humanity.humanity);

        viewModel.survivor.positionLabel(survivor.worldspace.x + ' | ' + survivor.worldspace.y);

        if(!survivorIsActive) {
            $('#survivorDialog').modal('show');
            survivorIsActive = true;
        }
    }

	function startDashboard() {
		loadWeapons(function() {
			selectedSurvivor = null;
		});
	}

    function init() {
        ko.applyBindings(viewModel);
        calcSidebarHeight($('.sidebar'));
		startDashboard();
    }

    function addTimestamps(survivors) {
        if(!survivors) {
            return survivors;
        }
        for(var i = 0; i < survivors.length; i++) {
            survivors[i].timeago = $.timeago(survivors[i].last_updated);
        }
        return survivors;
    }

    function addAzimuthCss(survivors) {
        if(!survivors) {
            return survivors;
        }
        for(var i = 0; i < survivors.length; i++) {
            survivors[i].azimuthCss = 'rotate(' +  survivors[i].worldspace.azimuth + 'deg)';
        }
        return survivors;
    }

    function calcHealthbar() {
        $('.healthbar').each(function() {
            var percent = $(this).data('percent');
            var parentHeight = $(this).parent().height();
            var height = Math.round(percent * parentHeight / 100);

            $(this).height(height);
        });
    }

    function determineRowColor() {
        $('.survivorList tr').each(function() {
            var humanity = $(this).data('humanity');
            if(humanity <= 0) {
                $(this).addClass('error');
            }
        });
    }

    function calcSidebarHeight($elem, offset) {
        if($elem.hasClass('mCustomScrollbar')) {
            return $elem.mCustomScrollbar('update');
        }
        if(typeof offset === 'undefined') {
            offset = 0;
        }
        $elem.height($(window).height() - offset);
        $elem.css({marginTop: offset});
        $elem.mCustomScrollbar({
            scrollInertia: 0
        });
        $(window).resize(function() {
            $elem.height($(window).height() - offset);
            $elem.mCustomScrollbar('update');
        });
    }

	function changeHash(key, value) {
		previousHash = window.location.hash;
		window.location.hash = key + ':' + value;
	}

	function treatHashChange() {
		var hashParts = window.location.hash.split(':');
		var key = hashParts[0].replace(/#/g, '');
		var value = hashParts[1];

		$('.menuLink').removeClass('active');
		if(key == 'survivor') {
			selectedSurvivor = value;
            survivorIsActive = false;
			loadSurvivors();
		}
		if(key == '') {
            $('#survivorDialog').modal('hide');
			$('#mapView').hide();
			$('#dashboardLink').addClass('active');
			$('#dashboardView').show();
		}
		if(key == 'map') {
			$('#survivorDialog').modal('hide');
			$('#dashboardView').hide();
			$('#mapLink').addClass('active');
			$('#mapView').show();
			Map.initialize();
		}
	}

    function loadData() {
        loadSurvivors();
        loadVehicles();
        loadWeapons();
    }

    $('.survivorList tr').live('click', function() {
		var uniqueId = $('.survivorName', this).data('unique_id');
		changeHash('survivor', uniqueId);
    });

    $('#closeDialog').live('click', function() {
        window.location.hash = previousHash;
		return false;
    });

	$(window).hashchange(function() {
		treatHashChange();
	});

    $().ready(function() {
        treatHashChange();
        loadSurvivors(init);
        loadData();
        window.setInterval(loadData, 20000);
    });

    return {
		getSurvivors: function() {
			return survivors;
		},
		getVehicles: function() {
			return vehicles;
		},
        afterRenderItems: function(data) {
            renderedWeapons++;
            if(renderedWeapons === weaponCount) {
                calcSidebarHeight($('.itemTable'), 40);
            }
        },
        afterRenderVehicles: function(data) {
            renderedVehicles++;
            if(renderedVehicles === vehicleCount) {
                calcSidebarHeight($('.vehicleTable'), 40);
                $('#loadingOverlay').fadeOut();
            }
        },
		changeHash: function(key, value) {
			return changeHash(key, value);
		}
    };
})();