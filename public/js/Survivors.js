var Survivors = (function() {
    "use strict";

    var survivors = [];
    var selectedSurvivor = null;
    var renderedWeapons = 0;
    var weaponCount = 0;
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

	function startDashboard() {
		loadWeapons(function() {
			selectedSurvivor = null;
			viewModel.headline('Dashboard');
		});
	}

    function init() {
        ko.applyBindings(viewModel);
        calcSidebarHeight($('.sidebar'));
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

    function calcSidebarHeight($elem, offset) {
        if($elem.hasClass('mCustomScrollbar')) {
            return $elem.mCustomScrollbar('update');
        }
        if(typeof offset === 'undefined') {
            offset = 0;
        }
        $elem.height($(window).height() - offset);
        $elem.mCustomScrollbar({
            scrollInertia: 0
        });
        $(window).resize(function() {
            $elem.height($(window).height() - offset);
            $elem.mCustomScrollbar('update');
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

    function loadData() {
        loadSurvivors();
        loadWeapons();
    }

    $('.survivorList tr').live('click', function() {
		var uniqueId = $('.survivorName', this).data('unique_id');
		changeHash('survivor', uniqueId);
    });

	$(window).hashchange(function() {
		treatHashChange();
	});

    $().ready(function() {
        treatHashChange();
        loadSurvivors(init);
        window.setInterval(loadData, 2000);
    });

    return {
        afterRenderItems: function(data) {
            renderedWeapons++;
            if(renderedWeapons === weaponCount) {
                calcSidebarHeight($('.itemTable'), 40);
                $('#loadingOverlay').fadeOut();
            }
        }
    };
})();