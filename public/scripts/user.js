$(function(){

    var chartSeries = {};

    function createPieChart(data) {
        function getPieData(data) {
            var series = []
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var point = [key, data[key]];
                    series.push(point);
                }
            }
            return series;
        }

        var pieChart = new Highcharts.Chart({
            chart: {
                backgroundColor: 'transparent',
                renderTo: 'chart',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: 'Photos by Filter'
            },
            plotOptions: {
                series: {
                    animation: false,
                    point: {
                        events: {
                            click: function () {
                                var filter = this.name;
                                Photos.filterByFilter(filter);
                                // this = Point
                            }
                        }
                    }
                },
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false,
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                type: 'pie',
                name: 'Filters',
                data: getPieData(data)
            }]
        });
        return pieChart;

    }

    window.Photo= Backbone.Model.extend({
        idAttribute: "id",
    });


    window.PhotoList = Backbone.Collection.extend({
        model: Photo,
        currentFilter: null,
        lastId: 0,
        fetchNextSet: function(resp) {
            var lastPhoto = resp && resp.models && resp.models[resp.models.length - 1];
            var lastId = lastPhoto && lastPhoto.get('id');
            Photos.lastId = lastId;
            if (lastId) {
                Photos.fetchNewItems();
            }
        },
        filterByFilter: function(filter) {
            if (this.currentFilter) {
                var $toShow = $('div.photo.' + filter);
                $toShow.fadeIn();
            }
            this.currentFilter = filter;
            var $toHide = $('div.photo:not(.' + filter + ')');
            $toHide.fadeOut();
        },
        getUserId: function() {
            var url = document.location.pathname;
            var id = /\/user\/(\d+)/.exec(url)[1];
            return id;
        },
        pieChart: {
            syncColors: function() {
                var series = this.chart.series;
                for (var i = 0, len = series.length; i < len; i++) {
                    var seriesi = series[i];
                    var points = seriesi.points;
                    for (j = 0, lenj = points.length; j < lenj; j++) {
                        var point = points[j];
                        var name = point.name;
                        var color = point.color;
                        var $photos = $('div.photo.' + name + ' img');
                        $photos.css({'background-color': color});
                    }
                }
            }
        },
        fetchNewItems: function () {
            var that = this;
            this.fetch({data: {'id': this.getUserId(), 'max_id': this.lastId || null},
                        success: function(resp) {
                            Photos.fetchNextSet(resp);
                            console.log(resp);
                            }
                        }).
                    then(function() {
                        that.pieChart.chart = createPieChart(chartSeries);
                        that.pieChart.syncColors();
                    });
        },

        url: '/api/photos'
    });

    window.Photos = new PhotoList;

    window.PhotoView = Backbone.View.extend({
        tagName: 'div',
        className: 'photo',
        template: _.template($('#photo-template').html()),
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
            this.addFilterData(this.model);
        },
        addFilterData: function(photo) {
            var filter = photo.get('filter');
            if (chartSeries[filter]) {
                chartSeries[filter]++;
            } else {
                chartSeries[filter] = 1;
            }
        },
        events: {
        },

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            this.setContent();
            return this;
        },

        remove: function() {
            $(this.el).remove();
        },

        setContent: function() {
            var filter = this.model.get('filter');
            this.$('.filter').html(filter);
            this.$('img').attr('src',
                this.model.attributes.images.low_resolution.url);
            this.$el.addClass(filter);
        },
        showUserProfile: function(ev) {
            console.log(this.model.get('username'));
        },

        clear: function() {
            this.model.destroy();
        }
    });


    window.AppView = Backbone.View.extend({
        el: $('#photos'),
        initialize: function() {
            Photos.bind('add', this.addOne, this);
            Photos.bind('all', this.render, this);
            Photos.fetchNewItems();
        },

        events: {
        },

        fetchNewItems: function(ev) {
            Photos.fetchNewItems();
        },

        addOne: function(photo) {
            var view = new PhotoView({model: photo});
            this.$('div.photos').append(view.render().el);
        },

        addAll: function() {
            Photos.each(this.addOne);
        }
    });
    $(function() {
        window.App = new AppView;
    });
});
