var Filterometry = (function() {
    "use strict";

    var methods = {};

    var selectors = {
        photoElements: 'div.photo'
        }

    function privateMethod() {
    }

    methods.getHideElements = function(classnames) {
         var selector = selectors.photoElements + ':not(' + classnames.join(',') + ')';
         return $(selector);
    }

    methods.stripFilterName = function (filter) {
        return filter.replace(/[^A-Z0-9]/ig, '_');
    };

    return methods;
}());
