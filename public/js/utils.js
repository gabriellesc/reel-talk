// catch simple errors
"use strict";

// declare reel-app namespace, if it doesn't already exist
var reel = reel || {};
var notifCount = notifCount || 0;

reel.utils = {

    // Asynchronously load templates located in separate .html files using
    // jQuery "deferred" mechanism, an implementation of Promises.  Note we
    // depend on template file names matching corresponding View file names,
    // e.g. Home.html and home.js which defines Backbone View "Home".
    /*
     * @param {[String]} views:  filenames of templates to be loaded
     * @param {function} callback:  callback function invoked when file is loaded
     */
    loadTemplates: function(views, callback) {

	// Array of deferred actions to keep track of template load status
        var deferreds = [];

	// Process each template-file in views array
        /*
         * @param {[integer]} index:  position of view template within views array
         * @param {[String]} view:  root name (w/o .html) of view template file
         */
        $.each(views, function(index, view) {
	    // If an associated Backbone view is defined, set its template function
            if (reel[view]) {

		// Push task of retrieving template file into deferred array.
		// Task performs "get" request to load the template, then passes
		// resulting template data to anonymous function to process it.
	        /*
	         * @param {String} data:  HTML from template file as String
	         */
                deferreds.push($.get('tpl/' + view + '.html', function(data) {
	    	    // Set template function on associated Backbone view.
                    reel[view].prototype.template = _.template(data);
                }));

	    // No Backbone view file is defined; cannot set template function.
            } else {
                console.log(view + " not found");
            }
        });

	// When all deferred template-loads have completed,
	// invoke callback function.
        $.when.apply(null, deferreds).done(callback);
    },

    // make notification panel visible and then fade out after 5 seconds
    showNotice: function (alertType, alertTitle, alertText) {
	$("#notifications").stop(true, true).show(0);
	$("#notifications").removeClass('alert-success alert-info alert-warning' +
					' alert-danger').addClass('alert-' + 
								 alertType);
	$('#notifications').html('<strong>' + alertTitle + '</strong> ' + 
				 alertText + '</div>');
	$('#notifications').fadeOut(5000);
    },

    // hide notification panel
    hideNotice: function () {
	$("#notifications").hide();
    },

    // show validation errors for all fields in errorFields
    // errorText hashes field names to error text to be displayed for each field
    // eg. "title": ["You must enter a title",
    //               "Only 1 or more letters-digits-spaces allowed"]
    showValidationError: function(errorFields, errorText) {

	// iterate over invalid fields
	$.each(errorFields, function (ind, field) {

	    // display an error/warning message adjacent to relevant input field
	    if ($("[name=" + field + "]").val() === "" ||
		$("[name=" + field + "]").val() === null) {
		// if user has not entered any input, error message says that
		// input is required
		$("[name=" + field + "] + .help-block").text(
		     errorText[field][0]);
		
	    } else {
		// use predefined error message associated with field
		$("[name=" + field + "] + .help-block").text(
		    errorText[field][1]);
	    }

	    // highlight the erroneous field name
	    $("label[for=" + field + "]").removeClass("valid").addClass("invalid");

	    // change the colour of the input box to red
	    $("label[for=" + field + "]").parent().addClass("has-error");
	});
    },

    // hide validation errors for each newly-validated field in validatedFields
    hideValidationError: function(validatedFields) {
	var field;
	for (field in validatedFields) {
	    // remove the error/warning message adjacent to relevant input field
	    $("[name=" + field + "] + .help-block").empty();

	    // un-highlight the erroneous field name
	    $("label[for=" + field + "]").removeClass("invalid").addClass("valid");

	    // remove red colour of input box
	    $("label[for=" + field + "]").parent().removeClass("has-error");
	}	
    },

    // update UI on authentication signout/timeout
    signedOut: function() {
	$('#signupdrop').hover(
	    function(){ $('#signupdrop').addClass('open'); },
	    function(){ $('#signupdrop').removeClass('open'); }
	);

        $('#greet').html('Sign In');
        $('#signoutUsername').html('');
        $('#signoutForm').css("display","none");
        $('#signinForm').show();
        $('#signindrop').removeClass('open');
        $('#details-menu').hide();  // non-auth'd users can't add movies
    },

    darkenBackground: function() {
	$('body').css({'background-color': 'grey', 
		       'background-blend-mode': 'darken'
		      });
    },
    
    undarkenBackground: function() {
	$('body').css({'background-color': '', 
		       'background-blend-mode': ''
		      });
    }

};
