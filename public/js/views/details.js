// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

// note View-name (Details) matches name of template file Details.html
reel.Details = Backbone.View.extend({

    initialize: function() {
	// define sub-views
	this.movieFormView = new reel.MovieForm({model: this.model});
	this.movieImgView = new reel.MovieImg({model: this.model});

	// bind event handler to change event in model (i.e. if model attribute(s)
	// is successfully changed, post notification to make user aware of need 
	// to explicitly save his/her changes)
	this.model.on("change", function() {
	    reel.utils.showNotice('info', 'Note!', 
				  'Movie attribute updated; to make changes ' +
				  'permanent, click "Save Changes" button.');
	    
	    // hide validation error information
	    reel.utils.hideValidationError(this.model.changedAttributes());
	}, this);

	// bind event handler to invalid event in model (i.e. if model attribute(s)
	// fails validation-check, notify user)
	this.model.on("invalid", function() {
	    // display error message
	    reel.utils.showNotice('danger', 'Error!', 'Fix validation errors' +
				  ' and try again');

	    // display validation error information
	    reel.utils.showValidationError(this.model.validationError,
					   this.model.validationReqsText);
	}, this);
    },

    // render the View
    render: function() {
	// set the view element ($el) HTML content using its template
	this.$el.html(this.template());

	// render sub-views
	this.movieFormView.render();
	this.movieImgView.render();

	// inject sub-views into page
	this.$('#movieform').replaceWith(this.movieFormView.el);
	this.$('#movieimg').replaceWith(this.movieImgView.el);

	if (this.model.get("freshVotes") == 0) {

	    this.$('#avg').text("N/A");
	    this.$('#swatch').css('background-image', 'url("../img/rotten.png"),'+
				  'linear-gradient(palegreen,forestgreen)');
	    /* --used in Step 2
	       this.$('#avg').html("... no reviews yet");
	    */

	} else {
	    var avg = (this.model.get("freshTotal")/this.model.get("freshVotes")*100).toFixed(1);

	    /* --used in Step 2
	       this.$('#avg').html("currently rated: <img src='" 
	       + (avg < 50 ? "../img/rotten.png" : "../img/fresh.png")
	       + "'> " + avg + "% (" 
	       + this.model.get("freshVotes") + ")");
	    */
	    this.$('#avg').text(avg + "% (" + this.model.get("freshVotes") + ")");

	    this.$('#swatch').css('background-image', 'url("'
				  + (avg < 50 ? '../img/rotten.png' : '../img/fresh.png') 
				  + '"), linear-gradient(palegreen,forestgreen)' );
	}

	/* --used in Step 2
	   if (!this.model.isNew()) {
	   this.$('#summary').append("<a id='reviewLink' href='#movies/" +
	   this.model.id + "/reviews'>Review(s)</a>");
	   }
	*/

	return this;    // support method chaining
    },


    // remove subviews on close of Details view
    onClose: function() {
        if (this.movieFormView) { this.movieFormView.remove(); }
        if (this.movieImgView) { this.movieImgView.remove(); }
    },

    // event handlers
    events: {
	"click #moviesave": "saveHandler",
	"click #moviedel": "deleteHandler",
	"blur .form-control": "blurHandler",
	"dragover #detailsImage": "dragoverHandler",
	"drop #detailsImage": "dropHandler",
	"click #upload-btn": "proxyUpload"
    }, 

    // Handler for event in which user requests model be updated/saved (persisted
    // to storage)
    saveHandler: function() {
	var self = this;

	// retrieve input-field data and convert to format needed for model.set()
	var formValsArray = $("#movieform form").serializeArray();
	var formVals = _.mapObject(_.object(_.pluck(formValsArray, 'name'),
					    _.pluck(formValsArray, 'value')), 
				   function (val, key) {
				       return self.preprocAttr(key, _.escape(val));
				   });

	// update movie model attributes with input-field data, if data passes 
	// validation-check
	if (this.model.set(formVals, {validate: true})){
	    
	    var successText = this.model.isNew() ? 'Model saved' : 'Model updated';
	    var errorText = (this.model.isNew() ? 'Sorry, cannot add movie ' : 
			     'Sorry, cannot update movie ');

	    // if movie model attributes were successfully updated, persist
	    // model to storage
	    this.collection.create(this.model, {
		// don't add new model to client collection until server responds
		wait: true,
		
		success: function(model) {
		    // navigate to movie's details view upon success
		    reel.app.navigate('#movies/' + model.id, {replace:true});
		    // show success notification in notification pane
		    reel.utils.showNotice('success', 'Success', successText);

		    if ($("input[type='file']").prop('files')) {
			self.selectImage();
		    }
		},

		error: function(model, response) {
		    // display the error response from the server
		    reel.utils.showNotice('danger', 'Error', 
					  errorText + '(' + response.responseText + ')');
		    // if error occurred because user is/has been logged out, update UI
		    if (response.status === 403 && 
			/sign in/.test(response.responseText)) {
			reel.utils.signedOut();
		    }
		}
	    });
	}	   
    },

    // Handler for event in which user requests model be deleted
    deleteHandler: function() {

	this.model.destroy({
	    wait: true,  // don't destroy client model until server responds

	    success: function(model, response) {
		// navigate to the browse view upon success
		reel.app.navigate('#movies', {replace:true, trigger:true});
		// show success notification in notification panel
		reel.utils.showNotice('success', 'Success', 'Movie deleted');
	    },

	    error: function(model, response) {
		// display the error response from the server
		reel.utils.showNotice('danger', 'Error', 
				      'Sorry, cannot remove movie (' + response.responseText + ')');
	    }
	});
    },

    // Handler for event in which focus leaves an input-field
    blurHandler: function(event) {

	// set movie model attribute to input value, if it passes validation-check
	this.model.set(event.currentTarget.name, 
		       this.preprocAttr(event.currentTarget.name, 
					_.escape(event.currentTarget.value)),
		       {validate: true, field: event.currentTarget.name});
    },

    // Pre-process movie input-field data before adding it to movie model
    preprocAttr: function(name, value) {

	switch(name) {
	// for movie attributes that are arrays, split string input
	// into array and remove whitespace at ends
	case "starring":
	    return _.map(value.split(','), 
			 function (string) { return string.trim(); });
	    
	case "genre":
	    return _.map(value.split(','), 
			 function (string) { return string.trim(); });
	
	// for movie attributes that are numbers, create number object
	// from string input
	// if input is null or empty, do not convert to number (null and ''
        // are invalid inputs, but will be converted to 0, which is a valid input)
	case "duration":
	    return ((value === null || value === "") ? 
		    value : Number(value));

	// for movie attributes that have a default value of null but for which
        // an empty input is acceptable, convert a null value to '')
	case "trailer":
	    return ((value === null) ? "" : value);

	default:
	    return value;
	}
    },

    // proxy click from upload button to file input
    proxyUpload: function() {
	$("input[type='file']").click();
    },

    // select image from filesystem or camera
    selectImage: function() {
	// set object attribute for image uploader
	this.pictureFile = $("input[type='file']")[0].files[0];

	// if the file type is image, read it
	if (/image.*/.test(this.pictureFile.type)) {
	    this.imageRead(this.pictureFile, this.pictureFile.type);
	} else {
	    // else display error notification
	    reel.utils.showNotice('danger', 'Error', "Selected file is not an " +
				  "image file");
	}
    },

    // Read pictureFile from filesystem, resulting in
    // DataURL (base64 representation of image data). 
    // Use as model poster attrib. and image src attrib.
    imageRead: function(pictureFile, type) {
	var self = this;
	var reader = new FileReader();

	// callback for when read operation is finished
	reader.onload = function(event) {
	    // resize image to reduce space required to store it
	    // reader.result is image data in base64 format
	    self.resize(reader.result, type, "0.95", function (resizedImg) {

		var imageSave = $.ajax({
		    url: '/movies/' + self.model.id + '/image',
		    method: 'PUT',
		    data: {img: resizedImg},
		    dataType: 'text'
		});

		imageSave.done(function(fileSrc) {
		    self.model.set('poster', fileSrc);

		    var targetImgElt = $('#detailsImage')[0]; 
		    // add query string to ensure that image is reloaded, rather
		    // than cached image being displayed
		    targetImgElt.src = fileSrc + "?" + new Date().valueOf();
		});

		imageSave.fail(function(jqXHR, textStatus) {
		    // display notification error
		    reel.utils.showNotice('danger', 'Error', "Sorry, unable to"
					  + " upload poster image at this time ("
					  + textStatus + ")");
		});
	    });
	};	   

	// read image file
	reader.readAsDataURL(pictureFile); 
    },

    // Handle dragging picture to poster image
    dragoverHandler: function(event) {
	// don't let parent element catch event
	event.stopPropagation(); 
	// prevent default to enable drop event
	event.preventDefault(); 
	// jQuery event doesn't have dataTransfer field - so use originalEvent
	event.originalEvent.dataTransfer.dropEffect = 'copy';
    },

    // Handle picture drop onto poster image
    dropHandler: function (event) {
	event.stopPropagation();  
	event.preventDefault();
	var ev = event.originalEvent;
	// set object attribute for use by uploadPicture
	this.pictureFile = ev.dataTransfer.files[0];
	// only process image files
	if (/image.*/.test(this.pictureFile.type)) {
	    // Read image file and display in img tag
	    this.imageRead(this.pictureFile, this.pictureFile.type);
	} else {
	    // else display notification error
	    reel.utils.showNotice('danger', 'Error', "Selected file is not an " +
				  "image file");
	}
    },

    // Resize sourceImg, returning result as a DataURL value.  Type,  
    // quality are optional params for image-type and quality setting
    resize: function(sourceImg, type, quality, callback) {
	var type = type || "image/jpeg";   // default MIME image type
	var quality = quality || "0.95";  // tradeoff quality vs size
	var image = new Image(), MAX_HEIGHT = 300, MAX_WIDTH = 450;
	image.src = sourceImg;

	// add a tiny delay, to ensure that sourceImg is properly processed
	setTimeout(function() {
	    // if image height and/or width exceeds maximum height/width, resize
	    // image; else, keep image same size
	    var resizeFactor = (image.height > MAX_HEIGHT || image.width > MAX_WIDTH) ?
		Math.min(MAX_HEIGHT/image.height, MAX_WIDTH/image.width) : 1;
	    // reduce height and width by same factor to maintain aspect ratio of image
	    image.height = image.height*resizeFactor;
	    image.width = image.width*resizeFactor;

	    var canvas = document.createElement("canvas"); 
	    canvas.width = image.width;  // scale canvas to match image
	    canvas.height = image.height;
	    var ctx = canvas.getContext("2d");  // get 2D rendering context
	    ctx.drawImage(image,0,0, image.width, image.height);  // render
	    
	    if (callback) {
		callback(canvas.toDataURL(type, quality));
	    } else {
		return canvas.toDataURL(type, quality);
	    }
	}, 1);
    }
});