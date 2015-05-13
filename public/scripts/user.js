$(function(){

    var chartSeries = {};

    Filterometry.Photo = Backbone.Model.extend({
        idAttribute: "id",
    });

    Filterometry.User = Backbone.Model.extend({
        idAttribute: "id",
        initialize: function() {
            var that = this;
            this.id = this.setUserId();
            this.url = '/api/user/' + this.id;
            this.fetch({success: function(resp) {
                    that.username = resp.get('username');
                    that.totalMedia = resp.get('counts')['media'];
                }
            });
        },
        totalMedia: null,
        setUserId: function() {
            var url = document.location.pathname;
            var id = /\/user\/(\d+)/.exec(url)[1];
            return id;
        }
    });

    Filterometry.PhotoList = Backbone.Collection.extend({
        model: Filterometry.Photo,
        currentFilters: [],
        mediaFetched: null,
        lastId: 0,
        fetchNextSet: function(resp) {
            var lastPhoto = resp && resp.models && resp.models[resp.models.length - 1];
            var lastId = lastPhoto && lastPhoto.get('id');
            Filterometry.Photos.lastId = lastId;
            this.mediaFetched += resp.models.length;
            if (lastId) {
                Filterometry.Photos.fetchNewItems();
            }
        },
        clearFilter: function() {
            $('div.photo').fadeIn();
        },
        filterByFilter: function(filter, accumulate) {
            var sfn = Filterometry.stripFilterName;
            var filterStr = sfn(filter);

            var alreadySelected = accumulate ? this.pieChart.chart.getSelectedPoints() : [];
            var alreadySelectedFilters = $.map(alreadySelected, function(point, i) {
                return sfn(point.name);
            });

            alreadySelectedFilters.push(filterStr);

            var classnames = $.map(alreadySelectedFilters, function(point, i) {
                return '.' + point;
            });
            $toShow = $(classnames.join(','));
            $toShow.fadeIn();

            var photosToHide = Filterometry.getHideElements(classnames);
            photosToHide.fadeOut();
        },
        pieChart: {
            syncColors: function() {
                var that = this;
                var series = this.chart.series;
                for (var i = 0, len = series.length; i < len; i++) {
                    var seriesi = series[i];
                    var points = seriesi.points;
                    for (j = 0, lenj = points.length; j < lenj; j++) {
                        var point = points[j];
                        var name = point.name;
                        var nameStr = Filterometry.stripFilterName(name);
                        var color = point.color;
                        var $photos = $('div.photo.' + nameStr + ' img');
                        $photos.css({'background-color': color});
                    }
                }
            }
        },
        getUserId: function() {
            var url = document.location.pathname;
            var id = /\/user\/(\d+)/.exec(url)[1];
            return id;
        },
        fetchNewItems: function () {
            var that = this;
            var id = this.getUserId();
            this.fetch({data: {'id': id, 'max_id': this.lastId || null},
                        success: function(resp) {
                            that.fetchNextSet(resp);
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

    Filterometry.SearchedUser = new Filterometry.User;
    Filterometry.Photos = new Filterometry.PhotoList;

    Filterometry.PhotoView = Backbone.View.extend({
        tagName: 'div',
        className: 'photo',
        template: _.template($('#photo-template').html()),
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
            this.addFilterData(this.model);
        },
        events: {
            'mouseenter img': 'focus',
            'mouseout img': 'blur'
        },
        focus: function() {
            console.log('mouseover');
            this.$('img').addClass('focused');
        },
        blur: function() {

        },
        addFilterData: function(photo) {
            var filter = photo.get('filter');
            if (chartSeries[filter]) {
                chartSeries[filter]++;
            } else {
                chartSeries[filter] = 1;
            }
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
            this.$el.addClass(Filterometry.stripFilterName(filter));
        },

        clear: function() {
            this.model.destroy();
        }
    });


    Filterometry.AppView = Backbone.View.extend({
        el: $('#photos'),
        initialize: function() {
            Filterometry.Photos.bind('add', this.addOne, this);
            Filterometry.Photos.bind('all', this.render, this);
            Filterometry.Photos.fetchNewItems();
        },

        events: {
        },

        fetchNewItems: function(ev) {
            Filterometry.Photos.fetchNewItems();
        },

        addOne: function(photo) {
            var view = new Filterometry.PhotoView({model: photo});
            this.$('div.photos').append(view.render().el);
        },

        addAll: function() {
            Filterometry.Photos.each(this.addOne);
        }
    });
    $(function() {
        Filterometry.App = new Filterometry.AppView;
    });



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
                events: {
                    click: function() {
                        var selected = this.getSelectedPoints();
                        $.each(selected, function(i, p) {
                            p.select(false);
                        })
                        Photos.clearFilter();
                    }
                },
                renderTo: 'chart',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
               text: ''
            },
            plotOptions: {
                series: {
                    animation: false,
                    point: {
                        events: {
                            click: function (ev) {
                                var accumulate = ev.ctrlKey || ev.shiftKey;
                                var filter = this.name;
                                Photos.filterByFilter(filter, accumulate);
                            }
                        }
                    }
                },
                pie: {
                    allowPointSelect: true,
                    borderWidth: '0',
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

});
