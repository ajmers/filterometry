$(function () {

    Filterometry.Search = Backbone.View.extend({
        el: $('.navbar-header'),
        initialize: function () {
            console.log('initializing');
        },
        events: {
            'submit form#user-search': 'formSubmit',
            'keyup input[name=searchTerm]': 'checkInputType'
        },

        checkInputType: function (ev) {
            var btn = this.$el.find('.search-btn');
            if (ev.currentTarget.value.indexOf('#') > -1) {
                btn.removeClass('user-search');
                btn.addClass('tag-search');
                this.inputType = 'tag';
            } else {
                btn.addClass('user-search');
                btn.removeClass('tag-search');
                this.inputType = 'username';
            }
        },
        formSubmit: function (ev) {
            var data = {};
            for (var i = 0, len = ev.target.length; i < len; i++) {
                var field = ev.target[i];
                if (field.value) {
                    field.name = this.inputType;
                    if (this.inputType === 'tag') {
                        field.value = field.value.replace('#', '');
                    }
                }
            }
            console.log('submit');
        },
    });

    Filterometry.SearchBar = new Filterometry.Search();
});
