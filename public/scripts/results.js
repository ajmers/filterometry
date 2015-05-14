$(function(){

    Filterometry.User = Backbone.Model.extend({
        idAttribute: "id",
        urlRoot: "/api/user/"
    });


    Filterometry.UserList = Backbone.Collection.extend({
        model: Filterometry.User,
        fetchNewItems: function (data) {
            this.fetch({data: data,
                success: function() {
                    $('div.results-container').show();
                    $('.results-container .results-header').html('Results for ' + data.username);
                }});
        },

        url: '/api/users'
    });

    Filterometry.Users = new Filterometry.UserList;

    Filterometry.UserView = Backbone.View.extend({
        tagName: 'div',
        className: 'result',
        template: _.template($('#user-template').html()),
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },
        events: {
            'click a.user-result': 'checkUserProfile'
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
            this.$('a.user-result').attr('href', 'user/' + this.model.get('id'));
            this.$('span.username').html(this.model.get('username'));
            this.$('img.user-image').attr('src', this.model.get('profile_picture'))
        },
        checkUserProfile: function(ev) {
            ev.preventDefault();
            var user = this.model.fetch().
                    then(function(resp) {
                        console.log(resp);
                    }, function(err) {
                        console.log(err);
                    });
            console.log(this.model.get('username'));
        },

        clear: function() {
            this.model.destroy();
        }
    });


    Filterometry.AppView = Backbone.View.extend({
        el: $('#users'),
        initialize: function() {
            Filterometry.Users.bind('add', this.addOne, this);
            Filterometry.Users.bind('all', this.render, this);
            Filterometry.Users.bind('reset', this.removeViews, this);
            var queryUsername = this.getQueryUsername();
            if (queryUsername) {
                Filterometry.Users.fetchNewItems(queryUsername);
            }
        },

        getQueryUsername: function() {
            var queryParams = $.getQueryParameters();
            for (key in queryParams) {
                if (queryParams.hasOwnProperty(key) && key !== 'username') {
                    delete queryParams[key];
                }
            }
            return queryParams;
        },
        events: {
            "submit form#user-search" : "fetchNewItems"
        },

        fetchNewItems: function(ev) {
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

        addOne: function(user) {
            var view = new Filterometry.UserView({model: user});
            this.$('div.results').append(view.render().el);
        },

        addAll: function() {
            if (Users.length) {
                Users.each(this.addOne);
            }
        },

        removeViews: function(col, opts) {
            _.each(opts.previousModels, function(model){
                model.trigger('destroy');
            });
        }
    });
    $(function() {
        jQuery.extend({

            getQueryParameters : function(str) {
	            return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
            }
        });
        Filterometry.App = new Filterometry.AppView;
    });
});
