// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

// note View-name (MovieForm) matches name of template file MovieForm.html
reel.MovieForm = Backbone.View.extend({

    render: function () {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template(this.model.toJSON()));
	return this;
    }

});