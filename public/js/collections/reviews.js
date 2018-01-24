// catch simple errors
"use strict";

// declare reel-app namespace, if it doesn't already exist
var reel = reel || {};

reel.Reviews = Backbone.Collection.extend({
    // identify collection's model
    model: reel.Review, 

    initialize: function(options) {
	this.movieId = options.movieId;
    },

    // collection server-side route (based on associated movie id)
    url: function() {
	return '/movies/' + this.movieId + '/reviews';
    }
});