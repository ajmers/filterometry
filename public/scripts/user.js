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
                },
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
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


    }



    function createBarChart(data) {
        function getBarData(data) {
            var xAxis = [];
            var yValues = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    xAxis.push(key);
                    yValues.push(data[key]);
                }
            }
        }

        var filterBarChart = new Highcharts.Chart({
            chart: {
                renderTo: 'chart',
                type: 'column'
            },
            title: {
                text: 'Filter Breakdown'
            },
            xAxis: {
                categories: xAxis
            },
            yAxis: {
                min: 0,
                labels: {
                    enabled: false
                },
                title: {
                    text: '#'
                }
            },
            plotOptions: {
                series: {
                    stacking: 'normal'
                }
            },
            series: [{name: '# Photos', data: yValues}]
        });
    }

    window.Photo= Backbone.Model.extend({
        idAttribute: "id",
    });


    window.PhotoList = Backbone.Collection.extend({
        model: Photo,
        lastId: 0,
        fetchNextSet: function(resp) {
            var lastPhoto = resp && resp.models && resp.models[resp.models.length - 1];
            var lastId = lastPhoto && lastPhoto.get('id');
            Photos.lastId = lastId;
            if (lastId) {
                Photos.fetchNewItems();
            }
        },
        getUserId: function() {
            var url = document.location.pathname;
            var id = /\/user\/(\d+)/.exec(url)[1];
            return id;
        },
        fetchNewItems: function () {
            this.fetch({data: {'id': this.getUserId(), 'max_id': this.lastId || null},
                        success: function(resp) {
                            Photos.fetchNextSet(resp);
                            console.log(resp);
                            }
                        }).
                    then(function() {
                        createPieChart(chartSeries);
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
            this.$('div.filter').html(this.model.get('filter'));
            this.$('div.image img').attr('src',
                this.model.attributes.images.low_resolution.url)
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
