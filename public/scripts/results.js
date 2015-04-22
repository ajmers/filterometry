$(function(){

    //Receipt model - has date, amount, name, description, item, method, funding, expense, envelope, roommate, notes, tag and id columsn.

    window.User = Backbone.Model.extend({
        idAttribute: "id",
    });


    window.UserList = Backbone.Collection.extend({
        model: User,
        fetchNewItems: function () {
            this.fetch({data: {'username': 'amaiale'}});
        },

        url: '/api/users'
    });

    window.Users = new UserList;

    window.UserView = Backbone.View.extend({
        tagName: 'div',
        className: 'result',
        template: _.template($('#user-template').html()),
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },
        events: {
            'click div.img': 'showUserProfile'
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
            this.$('a.user').attr('href', 'user/' + this.model.get('id'));
            this.$('div.username').html(this.model.get('username'));
            this.$('div.img img').attr('src', this.model.get('profile_picture'))
        },
        showUserProfile: function(ev) {
            console.log(this.model.get('username'));
        },

        clear: function() {
            this.model.destroy();
        }
    });


    window.AppView = Backbone.View.extend({
        el: $('#users'),
        initialize: function() {
            Users.bind('add', this.addOne, this);
            Users.bind('all', this.render, this);
            Users.fetchNewItems();
        },

        events: {
        },

        fetchNewItems: function(ev) {
            Users.fetchNewItems();
        },

        addOne: function(user) {
            var view = new UserView({model: user});
            this.$('div.results').append(view.render().el);
        },

        addAll: function() {
            Users.each(this.addOne);
        }
    });
    $(function() {
        window.App = new AppView;
    });
});
