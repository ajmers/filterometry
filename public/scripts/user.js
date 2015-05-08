$(function(){

    var chartSeries = {};

    window.Photo = Backbone.Model.extend({
        idAttribute: "id",
    });

    window.User = Backbone.Model.extend({
        idAttribute: "id",
        initialize: function() {
            this.id = this.setUserId();
            this.url = '/api/user/' + this.id;
            this.setUsername();
        },
        setUserId: function() {
            var url = document.location.pathname;
            var id = /\/user\/(\d+)/.exec(url)[1];
            return id;
        },
        setUsername: function() {
            var that = this;
            this.fetch({success: function(resp) {
                    this.username = resp.get('username');
                }
            });
        }
    });

    window.PhotoList = Backbone.Collection.extend({
        model: Photo,
        currentFilters: [],
        lastId: 0,
        fetchNextSet: function(resp) {
            var lastPhoto = resp && resp.models && resp.models[resp.models.length - 1];
            var lastId = lastPhoto && lastPhoto.get('id');
            Photos.lastId = lastId;
            if (lastId) {
                Photos.fetchNewItems();
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
            this.fetch({data: {'id': this.getUserId(), 'max_id': this.lastId || null},
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

    window.SearchedUser = new User;
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
               text: 'Photos by Filter'
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
