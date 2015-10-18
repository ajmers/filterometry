$(function (){

    Filterometry.User = Backbone.Model.extend({
        idAttribute: "id",
        urlRoot: "/api/user/"
    });

    Filterometry.Tag = Backbone.Model.extend({
        idAttribute: 'id',
        urlRoot: "/api/tag/"
    });

    Filterometry.TagList = Backbone.Collection.extend({
        model: Filterometry.Tag,
        fetchNewItems: function (data) {
            this.fetch({
                data: data,
                success: function () {
                    $('div.tag-results-container').show();
                    $('.tag-results-container .results-header').html('Tag results for #' + data.tag);
                },
            });
        },
        url: '/api/tags'
    });

    Filterometry.UserList = Backbone.Collection.extend({
        model: Filterometry.User,
        fetchNewItems: function (data) {
            this.fetch({data: data,
                success: function () {
                    $('div.results-container').show();
                    $('.results-container .results-header').html('Username results for ' + data.username);
                }});
        },

        url: '/api/users'
    });

    Filterometry.Users = new Filterometry.UserList();
    Filterometry.Tags = new Filterometry.TagList();

    Filterometry.NoAuthView = Backbone.View.extend({
        tagName: 'div',
        className: 'modal',
        events: {
            'click button.close': 'destroy_view'
        },
        destroy_view: function () {
            // COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();
            // Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },
        template: _.template($('#modal-template').html()),
        render: function (ev) {
            $(this.el).html(this.template(this.model.toJSON()));
            this.setContent();
            return this;
        },
        setContent: function () {
            var username = this.model.get('username');
            this.$('span.username').html(username);
        },
    });

    Filterometry.TagView = Backbone.View.extend({
        tagName: 'div',
        className: 'result',
        template: _.template($('#tag-template').html()),
        initialize: function () {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            this.formatNumber = numberWithCommas;
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
            this.$('a.tag-result').attr('href', 'tag/' + this.model.get('name'));
            this.$('span.tag').html('#' + this.model.get('name'));
            this.$('span.tagCount').html('(' +
                    this.formatNumber(this.model.get('media_count')) + ')');
        },
        clear: function () {
            this.model.destroy();
        }

    });

    Filterometry.UserView = Backbone.View.extend({
        tagName: 'div',
        className: 'result',
        template: _.template($('#user-template').html()),
        initialize: function () {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },
        events: {
            'click a.user-result': 'checkUserProfile'
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
            this.$('a.user-result').attr('href', 'user/' + this.model.get('id'));
            this.$('span.username').html(this.model.get('username'));
            this.$('img.user-image').attr('src', this.model.get('profile_picture'));
        },

        checkUserProfile: function (ev) {
            ev.preventDefault();
            var that = this;
            var user = this.model.fetch().
                    then(function (resp) {
                        console.log(resp);
                        var href = $(ev.currentTarget).attr("href");
                        window.location.pathname = href;
                    }, function (err) {
                        console.log(err);
                        var noAuthModal = new Filterometry.NoAuthView({model: that.model});
                        that.$el.append(noAuthModal.render().el);
                        noAuthModal.$el.show();
                    });
            console.log(this.model.get('username'));
        },

        clear: function () {
            this.model.destroy();
        }
    });


    Filterometry.AppView = Backbone.View.extend({
        el: $('#pageContent'),
        initialize: function () {
            Filterometry.Users.bind('add', this.addUser, this);
            Filterometry.Tags.bind('add', this.addTag, this);
            Filterometry.Users.bind('all', this.render, this);
            //TODO : what other events do I need to bind?
            Filterometry.Users.bind('reset', this.removeViews, this);
            var queryUsername = this.getQueryParam('username');
            if (queryUsername) {
                Filterometry.Users.fetchNewItems(queryUsername);
            }
            var queryTag = this.getQueryParam('tag');
            if (queryTag) {
                Filterometry.Tags.fetchNewItems(queryTag);
            }
        },

        getQueryParam: function (param) {
            var obj = {};
            var queryParams = $.getQueryParameters();
            for (var key in queryParams) {
                if (queryParams.hasOwnProperty(key) && key === param) {
                    obj[key] = queryParams[key];
                    return obj;
                }
            }
            return null;
        },

        events: {
            "click button.user-search": "fetchUsers",
            "click button.tag-search": "fetchTags"
            //"submit form#user-search" : "fetchNewItems"
        },

        fetchUsers: function (ev) {

        },

        fetchNewItems: function (ev) {
            ev.preventDefault();
            $('form#user-search button').blur();
            Filterometry.Users.reset();
            var data = {};
            for (var i = 0, len = ev.target.length; i < len; i++) {
                var field = ev.target[i];
                if (field.value) {
                    data[field.name] = field.value;
                }
            }

            Filterometry.Users.fetchNewItems(data);
        },

        addTag: function (tag) {
            var view = new Filterometry.TagView({model: tag});
            this.$('#tags div.results').append(view.render().el);
        },

        addUser: function (user) {
            var view = new Filterometry.UserView({model: user});
            this.$('#users div.results').append(view.render().el);
        },

        addAllUsers: function () {
            if (Users.length) {
                Users.each(this.addOne);
            }
        },

        removeViews: function (col, opts) {
            _.each(opts.previousModels, function (model){
                model.trigger('destroy');
            });
        }
    });
    $(function () {
        jQuery.extend({

            getQueryParameters: function (str) {
	            return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function (n){
                    return n = n.split("="),this[n[0]] = n[1],this;
                }.bind({}))[0];
            }
        });
        Filterometry.App = new Filterometry.AppView();
    });
});
