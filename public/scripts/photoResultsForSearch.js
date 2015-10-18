$(function (){

    var chartSeries = {};

    Filterometry.Photo = Backbone.Model.extend({
        idAttribute: "id",
    });

    Filterometry.User = Backbone.Model.extend({
        idAttribute: "id",
        initialize: function (options) {
            this.id = options.id;
            this.url = '/api/user/' + this.id;
        }
    });

    Filterometry.Tag = Backbone.Model.extend({
        idAttribute: "name",
        initialize: function (options) {
            this.name = options.name;
            this.url = '/api/tag/' + this.name;
        },
    });

    Filterometry.PhotoList = Backbone.Collection.extend({
        model: Filterometry.Photo,
        initialize: function (options) {
            this.type = options.type;
            this.idAttribute = options.userId || options.tagName;
            this.baseUrl = options.url;
        },
        currentFilters: [],
        totalMedia: 0,
        mediaFetched: 0,
        percentDone: 0,
        lastId: 0,
        parse: function (resp) {
            console.log('parsing');
            this.next_max_id = resp.pagination.next_max_tag_id;
            return resp.data;
        },
        fetchNextSet: function (resp) {
            console.log('fetchNextSet');
            if (!this.next_max_tag_id) {
                var oldestPhoto = resp && resp.models && resp.models[resp.models.length - 1];
                var lastId = oldestPhoto.get('id');
                Filterometry.Photos.lastId = lastId;
            } else {
                this.lastId = this.next_max_id;
            }

            this.updateProgressBar();
            this.fetchScroll = false;
            Filterometry.Photos.fetchNewItems();
        },
        //fetchOnScroll: function (ev) {
        //    if (!this.fetchScroll && this.percentDone < 1 && ((window.innerHeight + window.scrollY) >=
        //            $('.photos').height())) {
        //        this.fetchScroll = true;
        //        console.log('scroll fetch');
        //        this.fetchNewItems();
        //    }
        //},
        updateProgressBar: function () {
            this.percentDone = this.mediaFetched / this.totalMedia;
            var $progressBar = $('.progress-bar');
            var percentage = this.percentDone * 100 + '%';
            $progressBar.width(percentage);
            if (this.percentDone === 1) {
                setTimeout(function () {
                    $('.progress').fadeTo(1000, 0);
                }, 1000);
            }
        },
        clearFilter: function () {
            $('div.photo').fadeIn();
        },
        filterByFilter: function (filter, accumulate) {
            var sfn = Filterometry.stripFilterName;
            var filterStr = sfn(filter);

            var alreadySelected = accumulate ? this.pieChart.chart.getSelectedPoints() : [];
            var alreadySelectedFilters = $.map(alreadySelected, function (point, i) {
                return sfn(point.name);
            });

            alreadySelectedFilters.push(filterStr);

            var classnames = $.map(alreadySelectedFilters, function (point, i) {
                return '.' + point;
            });
            $toShow = $(classnames.join(','));
            $toShow.fadeIn();

            var photosToHide = Filterometry.getHideElements(classnames);
            photosToHide.fadeOut();
        },
        pieChart: {
            syncColors: function () {
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
            },
            centerVertically: function () {
                var scrollTop = $(window).scrollTop(),
                    elementOffset = $('#chart').offset().top,
                    distance = (elementOffset - scrollTop);
            }
        },
        fetchNewItems: function () {
            var id = this.idAttribute;
            console.log('fetching NEW items');
            this.fetch({data: {'id': id, 'max_id': this.lastId || null},
                        add: true,
                        success: function (resp) {
                            this.mediaFetched += resp.models.length;
                            if (this.mediaFetched < 500 || this.fetchScroll) {
                                this.fetchNextSet(resp);
                            }
                            console.log(resp);
                        }.bind(this)
                    }).
                    then(function () {
                        this.pieChart.chart = createPieChart(chartSeries);
                        this.pieChart.syncColors();
                        this.pieChart.centerVertically();
                    }.bind(this));
        },

        url: function () {
            return this.baseUrl;
        }
    });

    Filterometry.PhotoView = Backbone.View.extend({
        tagName: 'div',
        className: 'photo',
        template: _.template($('#photo-template').html()),
        initialize: function () {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
            this.addFilterData(this.model);
        },
        events: {
            'mouseenter img': 'focus',
            'mouseout img': 'blur'
        },
        focus: function () {
            console.log('mouseover');
            this.$('img').addClass('focused');
        },
        blur: function () {

        },
        addFilterData: function (photo) {
            var filter = photo.get('filter');
            if (chartSeries[filter]) {
                chartSeries[filter]++;
            } else {
                chartSeries[filter] = 1;
            }
        },

        render: function () {
            $(this.el).html(this.template(this.model.toJSON()));
            this.setContent();
            return this;
        },

        remove: function () {
            $(this.el).remove();
        },

        setContent: function () {
            var filter = this.model.get('filter');
            this.$('.filter').html(filter);
            this.$('img').attr('src',
                this.model.attributes.images.low_resolution.url);
            this.$el.addClass(Filterometry.stripFilterName(filter));
        },

        clear: function () {
            this.model.destroy();
        }
    });


    Filterometry.AppView = Backbone.View.extend({
        el: $('#photos'),
        userRegex: /^\/user\//,
        initialize: function () {
            var searchType = this.userRegex.test(document.location.pathname) ?
                    'user' : 'tag';
            if (searchType === 'user') {
                this.userId = this.getUserId();
                Filterometry.Photos = new Filterometry.PhotoList({
                    userId: this.userId,
                    type: searchType,
                    url: '/api/photos'
                });
                Filterometry.SearchedUser = new Filterometry.User({id: this.userId});
                Filterometry.SearchedUser.fetch({success: function (resp) {
                        this.username = resp.get('username');
                        Filterometry.Photos.totalMedia = resp.get('counts').media;
                        }
                    }).then(function () {
                        Filterometry.Photos.fetchNewItems();
                    });
            } else {
                this.tagName = this.getTagName();
                Filterometry.Photos = new Filterometry.PhotoList({
                    type: searchType,
                    url: '/api/tagPhotos',
                    tagName: this.tagName
                });
                Filterometry.SearchedTag = new Filterometry.Tag({name: this.tagName});
                Filterometry.SearchedTag.fetch({success: function (resp) {
                        Filterometry.Photos.totalMedia = resp.get('media_count');
                        }
                    }).then(function () {
                        Filterometry.Photos.fetchNewItems();
                    });
            }

            Filterometry.Photos.bind('add', this.addOne, this);
            Filterometry.Photos.bind('all', this.render, this);

            //$(window).bind('scroll', function (ev) {
            //    Filterometry.Photos.fetchOnScroll(ev);
            //});
        },
        getTagName: function () {
            var url = document.location.pathname;
            var name = /\/tag\/([A-z]+)/.exec(url)[1];
            return name;
        },
        getUserId: function () {
            var url = document.location.pathname;
            var id = /\/user\/(\d+)/.exec(url)[1];
            return id;
        },

        events: {
        },

        fetchNewItems: function (ev) {
            Filterometry.Photos.fetchNewItems();
        },

        addOne: function (photo) {
            var view = new Filterometry.PhotoView({model: photo});
            this.$('div.photos').append(view.render().el);
        },

        addAll: function () {
            Filterometry.Photos.each(this.addOne);
        }
    });

        Filterometry.App = new Filterometry.AppView();

    Filterometry.generalChartsConfig = {
        chart: {
            backgroundColor: 'transparent',
            events: {
                click: function () {
                    var selected = this.getSelectedPoints();
                    $.each(selected, function (i, p) {
                        p.select(false);
                    });
                    Filterometry.Photos.clearFilter();
                }
            },
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
                            Filterometry.Photos.filterByFilter(filter, accumulate);
                        }
                    }
                }
            }
        }
    };

    function createPieChart(data) {
        function getPieData(data) {
            var series = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var point = [key, data[key]];
                    series.push(point);
                }
            }
            return series;
        }

        var pieOptions = {
            chart: {
               renderTo: 'chart'
            },
            plotOptions: {
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
        };

        var pieConfig = jQuery.extend(true, pieOptions, Filterometry.generalChartsConfig);
        var pieChart = new Highcharts.Chart(pieConfig);
        return pieChart;
    }

    function createBarChart(data) {
        var barChartData = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var filterPoint = {};
                filterPoint.name = key;
                filterPoint.data = [data[key]];
                barChartData.push(filterPoint);
            }
        }

        var barOptions = {
            chart: {
                renderTo: 'barChart',
                type: 'column'
            },
            legend: {
                enabled: false,
                },
            title: {
                text: 'Filter Breakdown'
            },
            xAxis: {
                categories: ['Filters']
            },
            series: barChartData
        };
        var barConfig = jQuery.extend(true, barOptions,
                Filterometry.generalChartsConfig);
        var barChart = new Highcharts.Chart(barConfig);
    }

});
