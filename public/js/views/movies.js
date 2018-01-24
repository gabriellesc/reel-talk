// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

reel.MoviesView = Backbone.View.extend({
    
    // render the View
    render: function () {
	var self = this;

	// comparator function on collection is the basis for comparing movie
	// models
	// Note that this sorts in ASCII-order, not in alphabetical order
	this.collection.comparator = function(movie) {
            return movie.get(reel.order);
	};
	// sort collection before rendering it - implicitly uses comparator
        this.collection.sort();

	this.movieThumbLoad.done(function(markup) {
	    // Now "markup" contains the response to the $.get() request.
	    // Turn this markup into a function using Underscore's
	    // template() function.
	    self.movieTemplate = _.template(markup);
	    // Finally apply the moviesTemplate shown below to your
	    // movies collection and the template function you just created.
	    self.$el.html(self.moviesTemplate({movies: self.collection, 
					       movieTemplate: self.movieTemplate}));
	});

	return this;    // support method chaining
    },

    // load HTML for individual movie thumbnail
    initialize: function () {
	this.movieThumbLoad = $.get('tpl/MovieThumb.html');

	this.listenTo(Backbone, 'orderevent', this.render);
    },

    // template function to join individual movie thumbnails into table of thumbnails
    moviesTemplate: _.template([ 
	"<% movies.each(function(movie) { %>",
	"<%= movieTemplate(movie.toJSON()) %>", 
	"<% }); %>", 
    ].join('')),

    onClose: function() {
        this.remove();
    }
});