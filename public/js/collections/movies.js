// catch simple errors
"use strict";

// declare reel-app namespace, if it doesn't already exist
var reel = reel || {};

reel.Movies = Backbone.Collection.extend({

    // identify collection's model
    model: reel.Movie,

    // collection server-side route
    url: '/movies'
});