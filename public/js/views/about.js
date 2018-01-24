// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

// note View-name (About) matches name of template file About.html
reel.About = Backbone.View.extend({

    // render the View
    render: function () {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template());
	return this;    // support method chaining
    },

    onClose: function () {
	reel.utils.undarkenBackground();
    }

});
