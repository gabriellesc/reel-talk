// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

reel.ReviewsView = Backbone.View.extend({

    initialize: function(options) {
	// define sub-views
	this.reviewerView = new reel.Reviewer({model: this.model});
	this.reviewThumbsView = new reel.ReviewThumbs({collection: this.collection});

	// get associated movie model from input to view constructor
	this.movie = options.movie;
	
	// invoke showScore and renderReviews methods when collection is sync'd
	this.listenTo(this.collection, "sync", this.showScore);
	this.listenTo(this.collection, "sync", this.renderReviews);
    },

    // render the View
    render: function() {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template());

	// render sub-views
	this.reviewerView.render();
	this.reviewThumbsView.render();

	// inject sub-views into page
	this.$('#reviewer').replaceWith(this.reviewerView.el);
	this.$('#reviewThumbs').replaceWith(this.reviewThumbsView.el);

	this.showScore();

	return this;    // support method chaining
    }, 

    // remove subviews on close of Reviews view
    onClose: function() {
        if (this.reviewerView) { this.reviewerView.remove(); }
        if (this.reviewThumbsView) { this.reviewThumbsView.remove(); }

	reel.utils.undarkenBackground();
    },

    events: {
	"change .form-control": "changeHandler",
	"change [type='radio']": "changeHandler",
	"click #review-btn": "saveHandler"
    },

    // display review summary
    showScore: function() {
	var self = this;

	// re-fetch associated movie model to get freshTotal and freshVotes
	// attributes related to reviews
	this.movie.fetch({

	    success: function() {
		// if no reviews have been created yet, show "... no reviews yet"
		if (self.movie.get("freshVotes") == 0) {
		    self.$('#summary').text("... no reviews yet");
		    
		} else {
		    // calculate average number of "fresh" votes, to 1 decimal place
		    var avg = (self.movie.get("freshTotal")/
			       self.movie.get("freshVotes")*100).toFixed(1);

		    // display average with appropriate "fresh" or "rotten" image
		    self.$('#summary').html("currently rated: <img src='" 
					    + (avg < 50 ? "../img/rotten.png" : "../img/fresh.png")
					    + "'> " + avg + "% (" 
					    + self.movie.get("freshVotes") + ")");
		}
	    }
	});
    },

    // (re-)render review thumbnails
    renderReviews: function() {
	// create new review model for this view
	this.model = new reel.Review({movieId: this.movie.id});
	this.reviewerView = new reel.Reviewer({model: this.model});
	this.$('#reviewer').replaceWith(this.reviewerView.el);
	this.reviewerView.render();

	// reset freshness radio buttons to default state ("rotten" is checked)
	this.$('#reviewForm')[0].reset();
//	this.$("[value=0]:radio").prop('checked', true);

	this.reviewThumbsView.render();
    },

    // if user changes input field value, update corresponding review model value
    changeHandler: function(event) {
	this.model.set(event.currentTarget.name, _.escape(event.currentTarget.value));
    },

    // save review model to server
    saveHandler: function() {
	this.collection.create(this.model, {
	    // don't add new model to client collection until server responds
	    wait: true,
	    silent: true,
	    
	    success: function(model, response) {
		// show success notification in notification pane
		reel.utils.showNotice('success', 'Success', 'Movie review saved');
	    },

	    error: function(model, response) {
		// display the error response from the server
		reel.utils.showNotice('danger', 'Error', 'Movie review could not be saved (' 
				      + response.responseText + ')');

		// if error occurred because user is/has been logged out, update UI
		if (response.status === 403) {
		    reel.utils.signedOut();
		}
	    }
	});
    }
});