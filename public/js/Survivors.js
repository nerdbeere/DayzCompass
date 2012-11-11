var Survivors = function() {
    "use strict";

    var survivors = [];
    var selectedSurvivor = null;
    var viewModel = {
        survivors: ko.observableArray([]),
        survivorName: ko.observable('')
    };

    function loadSurvivors(callback) {
        $.getJSON('/get_survivors', function(data) {
            survivors = data;
            survivors = addTimestamps(survivors);
            viewModel.survivors.removeAll();
            for(var i = 0; i < survivors.length; i++) {
                if(selectedSurvivor == survivors[i].unique_id) {
                    viewModel.survivorName(survivors[i].name);
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

    loadSurvivors(init);
    window.setInterval(loadSurvivors, 2000);

    $('.survivorList tr').live('click', function() {
        selectedSurvivor = $('.survivorName', this).data('unique_id');
        loadSurvivors();
    });

    return {

    };
};