// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

// note View-name (MovieImg) matches name of template file MovieImg.html
reel.MovieImg = Backbone.View.extend({

    render: function () {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template(this.model.toJSON()));
	return this;
    }

});