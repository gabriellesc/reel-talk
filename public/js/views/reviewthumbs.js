// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

reel.ReviewThumbs = Backbone.View.extend({
    
    // render the View
    render: function () {
	var self = this;

	this.reviewThumbLoad.done(function(markup) {
	    // Now "markup" contains the response to the $.get() request.
	    // Turn this markup into a function using Underscore's
	    // template() function.
	    self.reviewTemplate = _.template(markup);
	    // Finally apply the reviewsTemplate shown below to your
	    // reviews collection and the template function you just created.
	    self.$el.html(self.reviewsTemplate({reviews: self.collection, 
						reviewTemplate: self.reviewTemplate}));
	});
	
	return this;    // support method chaining
    },

    // load HTML for individual review thumbnail
    initialize: function () {
	this.reviewThumbLoad = $.get('tpl/ReviewThumb.html');
    },

    // template function to join individual review thumbnails into table of thumbnails
    reviewsTemplate: _.template([
	"<div id='reviewThumbs'>",
	"<% reviews.each(function(review) { %>",
	"<%= reviewTemplate(review.toJSON()) %>", 
	"<% }); %>",
	"</div>"
    ].join('')),
});