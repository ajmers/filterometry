$(function () {

    Filterometry.Search = Backbone.View.extend({
        el: $('.navbar-header'),
        initialize: function () {
            console.log('initializing');
        },
        events: {
            'click button.user-search': 'userSearch',
            'click button.tag-search':  'tagSearch',
            'submit form#user-search': 'formSubmit'
        },
        formSubmit: function (ev) {
            ev.preventDefault();
            console.log('submit');
        },

        tagSearch: function (ev) {
            console.log('tag search');
        },

        userSeach: function (ev) {
            console.log('user search');

        },
    });

    Filterometry.SearchBar = new Filterometry.Search();
});
