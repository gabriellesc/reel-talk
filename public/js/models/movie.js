// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

reel.Movie = Backbone.Model.extend({
    idAttribute: "_id",

    defaults: {
	"title": "",  // movie title
	"released": "",  // release year
	"director": "",  // movie's director
	"starring": [],  // array principal actors
	"rating": "",  // MPAA movie rating: G, PG, PG-13, R, NC-17, NR
	"duration": null,   // run-time in minutes
	"genre": [],   // genre terms, e.g. action, comedy, etc
	"synopsis": "",  // brief outline of the movie
	"freshTotal": 0.0,   // cumulative total of review fresh (1.0) votes
	"freshVotes": 0.0,   // number of review ratings
	"trailer": null,  // URL for trailer/movie-streaming
	"poster": "img/placeholder.png",  // movie-poster image URL
	"dated": new Date()  // date of movie posting
    },

    // validation function, called by model.save() (and optionally, model.set())
    // if options.field is passed, this contains the name of the attribute to be
    // validated; otherwise, validate all attributes
    validate: function(attrs, options) {
	var validationError = []; // container for names of invalid attributes

	if ((options.field && options.field === "title" || !options.field)
	    && !this.validationReqs.title.test(attrs.title)){
	    validationError.push("title");
	}

	if ((options.field && options.field === "released" || !options.field)
	    && !this.validationReqs.released.test(attrs.released)){
	    validationError.push("released");
	}

	if ((options.field && options.field === "director" || !options.field)
	    && !this.validationReqs.director.test(attrs.director)){
	    validationError.push("director");
	}

	if ((options.field && options.field === "starring" || !options.field)
	    && !this.validationReqs.starring.test(attrs.starring)){
	    validationError.push("starring");
	}

	if ((options.field && options.field === "genre" || !options.field)
	    && !this.validationReqs.starring.test(attrs.genre)){
	    validationError.push("genre");
	}

	if ((options.field && options.field === "rating" || !options.field)
	    && !this.validationReqs.rating.test(attrs.rating)){
	    validationError.push("rating");
	}

	if ((options.field && options.field === "duration" || !options.field)
	    && !this.validationReqs.duration.test(attrs.duration)){
	    validationError.push("duration");
	}

	if ((options.field && options.field === "synopsis" || !options.field)
	    && !this.validationReqs.synopsis.test(attrs.synopsis)){
	    validationError.push("synopsis");
	}

	if ((options.field && options.field === "trailer" || !options.field)
	    && !this.validationReqs.trailer.test(attrs.trailer)){
	    validationError.push("trailer");
	}

	// dated is a Date value
	if (!options.field && !attrs.dated instanceof Date) {
	    validationError.push("dated");
	}

	// if any attributes were invalid, return a list of names of invalid
	// attributes; else, return nothing
	if (!_.isEmpty(validationError)) {
	    return validationError;
	}
    },

    // Regexs describing the validation requirements for each movie form field
    validationReqs: {
	// title must consist of one or more letter and/or digit characters
	// optionally with space characters and special characters: 
	// ",", ".", "!", "?", "-", "'", "*"
	"title": new RegExp("^[a-zA-Z0-9 ,.!?*\'\-]*[a-zA-Z0-9]+[a-zA-Z0-9 ,.!?*\'\-]*$"),

	// released must be a 4-digit year in the range 1910-2016	
	"released": new RegExp("^19[1-9][0-9]$|^200[0-9]$|^201[0-6]$"),
	
	// director must consist of one or more letter characters optionally with
	// digit and space characters and special characters: 
	// ",", ".", "!", "?", "-", "'", "*".
	"director": new RegExp("^[a-zA-Z0-9 ,.!?*\'\-]*[a-zA-Z]+[a-zA-Z0-9 ,.!?*\'\-]*$"),

	// starring must consist of one-or-more comma-separated sequences of 
	// whitespace-separated words, each such word which may optionally 
	// include special characters: "-", "'".
	"starring": new RegExp("^[\\w\-\']*\\w+[\\w\-\']*(\\s+[\\w\-\']*\\w+[\\w\-\']*)*" +
			       "(,\\s*[\\w\-\']*\\w+[\\w\-\']*(\\s+[\\w\-\']*\\w+[\\w\-\']*)*)*$"),

	// genre must consist of one-or-more comma-separated sequences of 
	// whitespace-separated words, each such word which may optionally 
	// include special characters: "-", "'".
	"genre": new RegExp("^[\\w\-\']*\\w+[\\w\-\']*(\\s+[\\w\-\']*\\w+[\\w\-\']*)*" + 
			    "(,\\s*[\\w\-\']*\\w+[\\w\-\']*(\\s+[\\w\-\']*\\w+[\\w\-\']*)*)*$"),

	// rating must consist of one of the MPAA rating values G, PG, PG-13, R, 
	// NC-17, NR
	"rating": new RegExp("^G$|^PG$|^PG-13$|^R$|^NC-17$|^NR$"),

	// duration must consist of an integer in the range 0-999
	"duration": new RegExp("^\\d{1,3}$"),

	// synopsis must consist of a non-empty word list
	"synopsis": new RegExp("^.*\\w+.*(.*\\w+.*)*$"),

	// trailer must be either an empty string or a properly-formatted URL 
	// (e.g. http://www.example.com). Note, this is a syntactic-only check, 
	// does not verify that the URL references an active site.	
	"trailer": new RegExp("^$|^https?://\\w+(\.\\w+)*(/[\\w\.#]+)*/?$")
	
    },

    // Text to be displayed for each form field if its value does not pass the 
    // validation check
    // First array element is text to be displayed if field is empty
    // Second array element is text to be displayed if field is non-empty
    validationReqsText: {
	"title": ["You must enter a title",
		  "Only 1 or more letters-digits-spaces allowed"],
	"released": ["You must enter a release date",
		     "Release date must be a year between 1910 and 2016"],
	"director": ["You must enter a director's name",
		     "Only 1 or more letters-digits-spaces allowed"],
	"starring": ["You must enter at least one actor's name",
		     "Names must be letters-digits-spaces separated by commas"],
	"rating": ["You must enter a rating",
		   "Rating must be one of: G, PG, PG-13, R, NC-17, NR"],
	"duration": ["You must enter a duration",
		     "Duration must be 0-999 minutes"],
	"genre": ["You must enter at least one genre",
		  "Genres must be letters-digits-spaces separated by commas"],
	"synopsis": ["You must enter a synopsis",
		     "Only 1 or more letters-digits-spaces allowed"],
	"trailer": ["", "Trailer must be a properly-formatted URL"]
    }
});