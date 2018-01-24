// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

reel.User = Backbone.Model.extend({
    urlRoot: "/auth", 

    idAttribute: "_id",

    defaults: {
	"username": "",
	"password": "",
	"email": ""
    },

    // validation function, called by model.save() (and optionally, model.set())
    validate: function(attrs) {
	// container for names of invalid attributes and error text to display
	var validationError = {};

	if (!attrs.username){
	    validationError.username = "Username required";
	}
	if (!attrs.password){
	    validationError.password = "Password required";
	}
	if (!attrs.email){
	    validationError.email = "Email address required";
	}

	// based on http://tools.ietf.org/html/rfc3696 but does not handle quoting
	var emailFormat = new RegExp("^([a-zA-Z0-9!#$%&'*+\-/=?^_`.{|}~]+" +
				     "(\.[a-zA-Z0-9!#$%&'*+\-/=?^_`.{|}~])*" +
				     "[a-zA-Z0-9!#$%&'*+\-/=?^_`.{|}~]*" + 
				     ")@([a-zA-Z0-9\-.]+)$");
	var emailValid = emailFormat.exec(attrs.email);
	if (!emailValid || emailValid[1].length > 64 || emailValid[3].length > 255){
	    validationError.email = "Invalid email address";
	}

	// if any attributes were invalid, return a list of names of invalid
	// attributes; else, return nothing
	if (!_.isEmpty(validationError)) {
	    return validationError;
	}
    }
});