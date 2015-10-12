$(function() {
    Filterometry.SearchView = Backbone.View.extend({
        submitButton: $('#searchSubmit')[0],
        searchButtonText: {
            'user': 'Search by Username',
            'hash': 'Search by Hashtag'
        },
        el: $('#searchIn'),
        initialize: function() {
            console.log('Hello world');
        },

        events: {
            'keyup': 'checkForHashtag'
        },

        checkForHashtag: function(e) {
            var searchValue = e.target.value;
            if (searchValue.indexOf('#') > -1) {
                this.submitButton.innerHTML = this.searchButtonText.hash;
            } else {
                this.submitButton.innerHTML = this.searchButtonText.user;
            }
        }
    });

    Filterometry.Search = new Filterometry.SearchView();
});
