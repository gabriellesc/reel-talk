// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

Backbone.ajax = function() {
    // Invoke $.ajaxSetup in the context of Backbone.$
    Backbone.$.ajaxSetup.call(Backbone.$, {beforeSend: function(jqXHR){
        jqXHR.setRequestHeader("X-CSRF-Token", reel.csrftoken);
    }});
    return Backbone.$.ajax.apply(Backbone.$, arguments);
};

// Define Backbone router
reel.AppRouter = Backbone.Router.extend({

    // Map "URL paths" to "router functions"
    routes: {
	"": "home",
	"about": "about",
	"movies": "browse",
	"movies/add": "addHandler",
	"movies/:id": "editHandler",
	"movies/:id/reviews": "reviews",
	"*default": "invalidRoute"
    },

    // When an instance of an AppRouter is declared, create a Header view
    initialize: function() {
	// instantiate a Header view
        this.headerView = new reel.Header();
	// insert the rendered Header view element into the document DOM
        $('.header').html(this.headerView.render().el);

	// default movie collection ordering is by title
	reel.order = 'title';

	$('#orderdrop').hover(
	    function(){ $('#orderdrop').addClass('open'); },
	    function(){ $('#orderdrop').removeClass('open'); }
	);

	$('#signupdrop').hover(
	    function(){ $('#signupdrop').addClass('open'); },
	    function(){ $('#signupdrop').removeClass('open'); }
	);

	$('#signindrop').hover(
	    function(){ $('#signindrop').addClass('open'); },
	    function(){ $('#signindrop').removeClass('open'); }
	);

	this.movies = new reel.Movies();
	// load movies collection from server
	this.moviesFetch = this.movies.fetch({
	    // error activates on non-200 response code
	    error: function(collection, response) {
		// display the error response from the server
		reel.utils.showNotice('danger', 'Error', 
				      'Sorry, movie collection cannot be loaded at this time ' 
				      + response.responseText);
	    }
	});
    },

    invalidRoute: function() {
	reel.utils.showNotice('danger', 'Error', 'Invalid route');
    },

    home: function() {
	// If the Home view doesn't exist, instantiate one
        if (!this.homeView) {
            this.homeView = new reel.Home();
        };
	// insert the rendered Home view element into the document DOM
        reel.app.showView('#content', this.homeView);

	// make the "home" menu item "active"
	this.headerView.selectMenuItem("#app-name");
    },

    about: function() {
	// If the About view doesn't exist, instantiate one
        if (!this.aboutView) {
            this.aboutView = new reel.About();
        };

	// insert the rendered About view element into the document DOM
        reel.app.showView('#content', this.aboutView);

	// darken background so that white text is visible
	reel.utils.darkenBackground();
	
	// make the "about" menu item "active"
	this.headerView.selectMenuItem("#about-menu");
    },

    addHandler: function() {
	var self = this;
	var newMovie = new reel.Movie();

	this.moviesFetch.always(function() {
            self.detailsView = new reel.Details({model: newMovie,
						 collection: self.movies});

	    // insert the rendered Details view element into the document DOM
            reel.app.showView('#content', self.detailsView);

	    // make the "details" menu item "active"
	    self.headerView.selectMenuItem("#details-menu");
	});
    },

    editHandler: function(movieId) {
	var self = this;

	this.moviesFetch.always(function() {
	    self.movie = self.movies.get(movieId);

	    // if movie with this ID cannot be found in collection, show error notice
	    // and return to home view
	    if (!self.movie) {
		reel.utils.showNotice('danger', 'Error', "Movie ID requested does " +
				      "not exist");
		reel.app.navigate('#', {replace:true, trigger:true});
		
	    // else, populate details view with this movie model's values
	    } else {
		self.detailsView = new reel.Details({model: self.movie,
						     collection: self.movies});
		
		// insert the rendered Details view element into the document DOM
		reel.app.showView('#content', self.detailsView);
		
		self.headerView.unselectMenuItems();
	    }
	});
    },

    browse: function() {
	var self = this;

	// reload movies collection
	this.movies.fetch({

	    // success activates on 200 response code
	    success: function(collection, response) {
		self.moviesView = new reel.MoviesView({collection: self.movies});

		// insert the rendered MoviesView view element into the document DOM
		reel.app.showView('#content', self.moviesView);
		
		// make the "browse" menu item "active"
		self.headerView.selectMenuItem("#browse-menu");
	    },

	    // error activates on non-200 response code
	    error: function(collection, response) {
		// display the error response from the server
		reel.utils.showNotice('danger', 'Error',
				      'Sorry, movie collection cannot be loaded at this time ' 
				      + response.responseText);

		// use previous Movies collection
		self.moviesView = new reel.MoviesView({collection: self.movies});

		// insert the rendered MoviesView view element into the document DOM
		reel.app.showView('#content', self.moviesView);
		
		// make the "browse" menu item "active"
		self.headerView.selectMenuItem("#browse-menu");
	    }
	});
    },

    reviews: function(movieId) {
	var self = this;

	// darken background so that white text is visible
	reel.utils.darkenBackground();

	var newReview = new reel.Review({movieId: movieId});
	this.reviews = new reel.Reviews({movieId: movieId});

	this.reviews.fetch({

	    // error activates on non-200 response code
	    error: function(collection, response) {
		// display the error response from the server
		reel.utils.showNotice('danger', 'Error',
				      'Sorry, reviews collection cannot be loaded at this time '
				      + response.responseText);
	    }

	}).always(function () {

	    self.moviesFetch.always(function () {
		self.reviewsView = new reel.ReviewsView({model: newReview,
							 collection: self.reviews,
							 movie: self.movies.get(movieId)});
		// insert the rendered Reviews view element into the document DOM
		reel.app.showView('#content', self.reviewsView);

		self.headerView.unselectMenuItems();
	    });
	});
    },

    /* showView invokes close() on the currentView before replacing it
       with the new view, in order to avoid memory leaks and ghost views.
       Note that for composite views (views with subviews), must make sure
       to close “child” views when the parent is closed.  The parent view
       should keep track of its child views so it can call their respective
       close() methods when its own close() method is invoked. The
       beforeClose() method (explained above) of the parent View is a good
       place to close child Views. */
    showView: function(selector, view) {
        if (this.currentView) {
            this.currentView.close();
	}
	this.currentView = view;

        $(selector).html(view.render().el);
        return this.currentView;
    }
});

Backbone.View.prototype.close = function () {
    /* When closing a view, give it a chance to perform its own custom
     * onClose processing, e.g. handle subview closes, then remove the
     * view from the DOM and unbind events from it.  Based on approach 
     * suggested by D. Bailey (author of Marionette) */
    if (this.onClose) {
        this.onClose();
    }
    this.remove();
    this.unbind();  // implied by remove() in BB 1.0.0 and later

};

// Load HTML templates for Home, Header, About, Details views, MovieForm, MovieImg
// Reviewer subviews, and when template loading is complete, 
// instantiate a Backbone router with history.
reel.utils.loadTemplates(['Home', 'Header', 'About', 'Details', 'ReviewsView', 
			  'MovieForm', 'MovieImg', 'Reviewer'], 
			 function() {
    reel.app = new reel.AppRouter();
    Backbone.history.start();
});