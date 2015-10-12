$(function() {

    Filterometry.Photo = Backbone.Model.extend({
        idAttribute: 'id'
    });

    Filterometry.PhotoStrip = Backbone.Collection.extend({
        model: Filterometry.Photo,
        fetchNewItems: function () {
            var that = this;
            var id = 1944086551;
            this.fetch({data: {'id': id},
                        success: function(resp) {
                            console.log(resp);
                            }
                        });
        },

        url: '/api/photos'

    });

    Filterometry.Photos = new Filterometry.PhotoStrip;

    Filterometry.PhotoView = Backbone.View.extend({
        tagName: 'li',
        className: 'photo',
        template: _.template($('#filmstrip-template').html()),
        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            this.setContent();
            return this;
        },

        setContent: function() {
            var url = this.model.get('images').standard_resolution.url;
            this.$('a').css("background-image", "url(" + url + ")");
        },

        clear: function() {
            this.model.destroy();
        }
    });

    Filterometry.AppView = Backbone.View.extend({
        el: $('#film'),
        initialize: function() {
            Filterometry.Photos.bind('add', this.addOne, this);
            Filterometry.Photos.bind('all', this.render, this);
            Filterometry.Photos.fetchNewItems();
        },

        addOne: function(photo) {
            var view = new Filterometry.PhotoView({model: photo});
            this.$('ul').append(view.render().el);
        }
    }, {
        el:$('#searchIn'),
        initialize: function() {
            console.log('Hello, world');
            debugger;
        }
    });

    Filterometry.App = new Filterometry.AppView();
});
