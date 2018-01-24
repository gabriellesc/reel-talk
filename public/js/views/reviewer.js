// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

// note View-name (Reviewer) matches name of template file Reviewer.html
reel.Reviewer = Backbone.View.extend({

    // render the View
    render: function () {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template());
	return this;    // support method chaining
    }

});
