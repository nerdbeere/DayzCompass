var Survivors = function() {
    "use strict";

    var survivors = [];
    var selectedSurvivor = null;
    var viewModel = {
        survivors: ko.observableArray([]),
        weapons: ko.observableArray([]),
        headline: ko.observable('Dashboard')
    };

    function loadSurvivors(callback) {
        $.getJSON('/get_survivors', function(data) {
            survivors = data;
            survivors = addTimestamps(survivors);
            viewModel.survivors.removeAll();
            for(var i = 0; i < survivors.length; i++) {
                if(selectedSurvivor == survivors[i].unique_id) {
                    viewModel.headline(survivors[i].name);
                }
                viewModel.survivors.push(survivors[i]);
            }
            if(typeof callback === 'function') {
                callback();
            }
            calcHealthbar();
            determineRowColor();
            $(".sidebar").mCustomScrollbar('update');
        });
    }

	function loadWeapons(callback) {
		$.getJSON('/get_weapon_stats', function(data) {
			viewModel.weapons.removeAll();
			for(var i = 0; i < data.length; i++) {
				viewModel.weapons.push(data[i]);
			}
			if(typeof callback === 'function') {
				callback();
			}
		});
	}

	function startDashboard() {
		loadWeapons(function() {
			selectedSurvivor = null;
			viewModel.headline('Dashboard');
		});
	}

    function init() {
        ko.applyBindings(viewModel);
        calcSidebarHeight();
    }

    function addTimestamps(survivors) {
        for(var i = 0; i < survivors.length; i++) {
            survivors[i].timeago = $.timeago(survivors[i].last_updated);
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

    function calcSidebarHeight() {
        $(".sidebar").height($(window).height());
        $(".sidebar").mCustomScrollbar({
            scrollInertia: 0
        });
        $(window).resize(function() {
            $(".sidebar").height($(window).height());
        });
    }

	function changeHash(key, value) {
		window.location.hash = key + ':' + value;
	}

	function treatHashChange() {
		var hashParts = window.location.hash.split(':');
		var key = hashParts[0].replace(/#/g, '');
		var value = hashParts[1];

		if(key == 'survivor') {
			selectedSurvivor = value;
			loadSurvivors();
		}
		if(key == '') {
			startDashboard();
		}
	}

    $('.survivorList tr').live('click', function() {
		var uniqueId = $('.survivorName', this).data('unique_id');
		changeHash('survivor', uniqueId);
    });

	$(window).hashchange(function() {
		treatHashChange();
	});

	treatHashChange();
	loadSurvivors(init);
	window.setInterval(loadSurvivors, 2000);

    return {

    };
};