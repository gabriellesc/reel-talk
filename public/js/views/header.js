// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

// note View-name (Header) matches name of template file Header.html
reel.Header = Backbone.View.extend({

    events: { 
	"change [name='sortOrder']": "sortOrder",
	"click [name='signinbtn']": "signin",
	"click [name='signoutbtn']": "signout",
	"click [name='signupbtn']": "signup",
	"blur input[type='text']": "blurHandler",
	"blur input[name='password']": "blurHandler"
    },

    // render the View
    render: function () {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template());

	// create new User model for signup
        this.model = new reel.User();

	return this;    // support method chaining
    },

    // make the selected menu item "active"
    selectMenuItem: function(menuItem) {
	this.unselectMenuItems();
	$( menuItem ).addClass("active");
    },

    // make all menu items "inactive"
    unselectMenuItems: function() {
	$( ".navbar *" ).removeClass("active");
    },

    // sort movie collection when user selects ordering from dropdown menu
    sortOrder: function(event) {
        event.stopPropagation();
        reel.order = _.escape(event.target.value);  // set app-level order field
        Backbone.trigger('orderevent', event);  // trigger event for other views
        $('#orderdrop').removeClass('open');  // close the dropdown menu
    },

    // Handler for event in which focus leaves an input-field
    blurHandler: function(event) {
	this.model.set(event.currentTarget.name, _.escape(event.currentTarget.value));
    },

    signin: function() {
	var self = this;
	this.model.set({login: 1});

	this.model.save(null, {
	    type: 'put',
            wait: true,
	    validate: false,

	    headers: {remember: $('input[name="remember"]').prop('checked') }, 

            success: function(model, response) {
		if (response.error) {
                    reel.utils.showNotice('danger', 'Signin Failed',
					  response.error);
		} else {
		    // reel.token = response.token;
		    reel.userid = response.userid; 
		    reel.username = response.username;
                    reel.utils.showNotice('success', 'Signin Successful!',
					  'Welcome back ' + reel.username);
		    self.signedIn(response);
		}
            },

            error: function (model, err) {
                reel.utils.showNotice('danger', 'Error', err.responseText);
            }
	});
    },

    signout: function() {
	var self = this;

	this.model.set({login: 0, username:"", password:""});

	this.model.save(null, {
	    type: 'put',
	    validate: false,

	    success: function(model, response) {
                // reel.token = response.token;
		reel.userid = response.userid;
		reel.username = response.username;
		
		reel.utils.showNotice('success', 'Signout Successful!',
				      'Please Come Back Soon');
		reel.utils.signedOut();
	    },

            error: function (err) {
                reel.utils.showNotice('danger', 'Error', err.responseText);
            }
        });
    },

    signup: function() {
	var self = this;

	// Check that both password fields match
	if ($('input[name="password"].signup').val() !== $('input[name="password2"].signup').val()) {

	    $('input[type="password"].signup').addClass("invalid");
	    $('input[name="password2"].signup+.help-block').text("Password values must match");

	} else {

	    $('input[type="password"].signup').removeClass("invalid");
	    $('input[name="password2"].signup+.help-block').text('');

	    this.model.unset('login');

	    if (this.model.save(null, {
		wait: true,
		
		success: function(model, response) {
		    if (response.error) {
			reel.utils.showNotice('danger', 'Signup Failed',
					      'Failed to create account');
		    } else {
			// reel.token = response.token;
			reel.userid = response.userid;
			reel.username = response.username;
			reel.utils.showNotice('success', 'Signup Successful!',
					      'Welcome ' + reel.username);

			self.signedUp(response);
		    }
		},
		error: function (model, err) {
                    reel.utils.showNotice('danger', 'Error', err.responseText);
		}
	    })
	       ) {
		// if validation is successful, remove validation errors
		$('.help-block.signup').text('');
		$('input[type="text"].signup').removeClass("invalid");

	    } else {
		// if validation fails, display validation errors
		$('input[type="text"].signup').each(function() {
		    if ($(this).attr('name') in self.model.validationError) {
			$(this).next().text(self.model.validationError[$(this).attr('name')]);
			$(this).addClass("invalid");
		    } else {
			$(this).next().text('');
			$(this).removeClass("invalid");
		    }
		});
	    }
	}
    },

    // helper for signedUp, signedIn to update UI on successful authentication
    authenticatedUI: function(response) {
        $('#greet').text(response.username);
	$('#signinForm').css("display","none");
        $('#signoutUsername').html('<b>'+response.username+'</b>');
        $('#signoutForm').css("display","block");

        $('#signupdrop').off();
        $('#details-menu').show();  // auth'd users can add movies
    },

    // update UI on successful signup authentication
    signedUp: function(response) {
        $('#signupdrop').removeClass('open');
        $('#signupForm')[0].reset();   // clear signup form
        this.authenticatedUI(response);
    },

    // update UI on successful signin authentication
    signedIn: function(response) {
        $('#signindrop').removeClass('open');
        $('#signinForm')[0].reset();   // clear signin form
        this.authenticatedUI(response);
    }
});
