"use strict";

var fs = require('fs'),
// path is "../" since reel.js is in routes/sub-dir
config = require(__dirname + '/../config'),  // port#, other params
express = require("express"),
url = require("url"),
path = require("path"),
_ = require("underscore"),
bcrypt = require("bcrypt");

// Instantiate a collection on a Mongo DB server:

var mongoose = require('mongoose'); // MongoDB integration
if (config.env === 'development') {
    mongoose.set('debug', true); // enable debugging during development
}

// Connect to database, using credentials specified in your config module
mongoose.connect('mongodb://' +config.dbuser+ ':' +config.dbpass+
                 '@10.15.2.164/' + config.dbname);

// Schemas

var MovieSchema = new mongoose.Schema({
    // movie title
    title: { type: String, required: true },
    // release year
    released: { type: String, required: true },
    // movie's director
    director: { type: String, required: true },
    // array principal actors
    starring: { type: [String], required: true },
    // MPAA movie rating: G, PG, PG-13, R, NC-17, NR
    rating: { type: String, required: true },
    // run-time in minutes
    duration: { type: Number, required: true },
    // genre terms, e.g. action, comedy, etc
    genre: { type: [String], required: true },
    // brief outline of the movie
    synopsis: { type: String, required: true },
    // cumulative total of review fresh (1.0) votes
    freshTotal: { type: Number, required: true },
    // number of review ratings
    freshVotes: { type: Number, required: true },
    // URL for trailer/movie-streaming
    trailer: { type: String, required: false },
    // movie-poster image URL
    poster: { type: String, required: true},
    // date of movie posting
    dated: { type: Date, required: true },
    // mongoose id of the User model associated with creation of the Movie model
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSchema', required: true }
});
// do not validate new Movie model values when saving, since validation is already
// performed on the client side
MovieSchema.set('validateBeforeSave', false);

var ReviewSchema = new mongoose.Schema({
    freshness: { type: Number, required: true },
    reviewText: { type: String, required: true },
    reviewName: { type: String, required: true },
    reviewAffil: { type: String, required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'MovieSchema', required: true }
});

var UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true }
});

// Constraints

// each title:director pair must be unique; duplicates are dropped
MovieSchema.index({title: 1, director: 1}, {unique: true, dropDups: true});

// each reviewName:reviewAffil pair must be unique for each movie; 
// duplicates are dropped
ReviewSchema.index({movieId: 1, reviewName: 1, reviewAffil: 1}, {unique: true});

// Models

// Compile a model from the MovieSchema Schema definition, which will be part of
// the 'movies' collection
var MovieModel = mongoose.model('Movie', MovieSchema);

// Compile a model from the ReviewSchema Schema definition, which will be part of
// the 'reviews' collection
var ReviewModel = mongoose.model('Review', ReviewSchema);

// Compile a model from the UserSchema Schema definition, which will be part of
// the 'users' collection
var UserModel = mongoose.model('User', UserSchema);

// Implemention of reel API handlers:

// "exports" is used to make the associated name visible
// to modules that "require" this file (in particular app.js)

// heartbeat response for server API
exports.api = function(req, res){
    res.status(200).send('<h3>Eatz API is running!</h3>');
};

// retrieve an individual movie model, using its id as a DB key
exports.getMovie = function(req, res){
    MovieModel.findById(req.params.id, function(error, movie) {
        if (error) {
	    if (error.name === 'CastError' && error.kind === 'ObjectId') {
		res.status(404).send("Sorry, that movie doesn't exist; " +
				     "try reselecting from Browse view");
	    } else {
		res.status(500).send("Sorry, unable to retrieve movie at this time (" 
				     + error.message + ")" );
	    }
        } else if (!movie) {
            res.status(404).send("Sorry, that movie doesn't exist; " +
				 "try reselecting from Browse view");
        } else {
            res.status(200).send(movie);
        }
    });
};

// add a new movie model
exports.addMovie = function(req, res) {
    MovieModel.create(_.extend(req.body, {'userid': req.session.userid}), 
		      function (error, movie) {
			  if (!error) {
			      res.status(200).send(movie);
			  } else {
			      res.status(404).send("(" + error.message + ")");
			  }
		      });
};

// retrieve all movie models in collection
exports.getMovies = function(req, res) {
    MovieModel.find(function(error, movies) {
	if (!error) {
	    res.status(200).send(movies);
	} else {
	    res.status(404).send("(" + error.message + ")");
	}
    });
};

// edit a movie model
exports.editMovie = function(req, res) {

    MovieModel.findById(req.params.id, function(finderror, movie) {
	if (!finderror) {
	    // old (no userid) models are treated as belonging to any user: any 
	    // authenticated user can modify and/or delete them

	    // new (userid) models are protected by an authorization check
	    // server-side permissions check: only the user who created a
	    // movie may modify and/or delete it
	    if (!movie.get('userid') || 
		movie.get('userid', String) === req.session.userid) {

		// remove the id field in the request body
		delete req.body['_id'];
	
		movie.update(req.body, function (error, movie) {
		    if (!error) {
			res.status(200).send(movie);
		    } else {
			res.status(404).send("(" + error.message + ")");	
		    }
		});

	    } else {
		res.status(403).send('Not permitted to make this change');
	    }

	} else {
	    res.status(500).send("(" + finderror.message + ")");
	}
    });
};

// remove a movie model
exports.deleteMovie = function(req, res) {
    MovieModel.findById(req.params.id, function(finderror, movie) {
	if (!finderror) {
	    // old (no userid) models are treated as belonging to any user: any 
	    // authenticated user can modify and/or delete them

	    // new (userid) models are protected by an authorization check
	    // server-side permissions check: only the user who created a
	    // movie may modify and/or delete it
	    if (!movie.get('userid') || 
		movie.get('userid', String) === req.session.userid) {
	
		var rmpromise = movie.remove();

		// remove associated image if not placeholder
		// assumes that this operation is successful (rather than 
		// performing a two-phase commit)
		rmpromise.then(function(movie2) {
		    if (movie2.get('poster') !== 'img/placeholder.png') {
			fs.unlink(__dirname + '/../public/' + movie2.get('poster'), 
				  function (rmerror2) {
				      if (rmerror2) {
					  console.log('unable to remove movie poster image file');
				      }
				  });
		    }
		});

		rmpromise.then(function(movie2) {
		    // remove associated movie reviews
		    // assumes that this operation is successful (rather
		    // than performing a two-phase commit)
		    ReviewModel.remove({movieId: req.params.id}, 
				       function(rmerror2, reviews) {
					   if (rmerror2) {
					       console.log('unable to delete movie reviews');
					   }
				       });
		});

		rmpromise.then(function(movie2) {
		    res.status(200).json(null);
		}, function(rmerr) {
		    res.status(500).send("(" + rmerr.message + ")");
		});

	    } else {
		res.status(403).send('Not permitted to make this change');
	    }

	} else {
	    res.status(500).send("(" + finderror.message + ")");
	}
    });
};

// retrieve all Review models in collection associated with movie id
exports.getReviews = function(req, res) {
    ReviewModel.find({movieId: req.params.id}, function(error, reviews) {
	if (!error) {
	    res.status(200).send(reviews);
	} else {
	    res.status(404).send("(" + error.message + ")");
	}
    });
};

// add a new review
exports.addReview = function(req, res) {
    ReviewModel.create(req.body, function (error, review) {
	if (!error) {
	    // update the associated movie model's freshVotes and freshTotal 
	    // fields to reflect the freshness of the new review
	    MovieModel.findByIdAndUpdate(req.params.id,
					 {$inc: {freshVotes: 1, 
						 freshTotal: req.body.freshness}},
					 function(error, movie) {
					     res.status(200).send(review);
					 });
	} else {
	    res.status(404).send("(" + error.message + ")");
	}
    });
};

// video server (called by HTML5 <video> element)
exports.playMovie = function(req, res) {
    // compute absolute file-system video path from __dirname and URL with id
    var file = (config.viddir ? 
		path.resolve(__dirname, '../public', config.viddir, 
			     req.params.id + '.mp4') : 
		path.resolve(__dirname, '../public/img/videos/', 
			     req.params.id + '.mp4'));

    // get HTTP request "range" header, and parse it to get starting byte position
    var range = req.get('range');
    var start = Number(range.slice(6).split('-')[0]);

    // get a file-stats object for the requested video file, including its size
    fs.stat(file, function(err, stats) {
	if (!err) {
            // set end position from range header or default to video file size
	    var end = Number(range.split('-')[1]) || stats.size - 1,
	    // set chunksize to be the difference between end and start values +1
                chunksize = end - start + 1;

	    // send HTTP "partial-content" status (206) together with
	    // HTML5-compatible response-headers describing video being sent
	    res.writeHead(206, {
		'Accept-Ranges': 'bytes',
		'Content-Range': 'bytes ' + start + '-' + end + '/' + stats.size,
		'Content-Length': chunksize,
		'Content-Type': 'video/mp4'
	    });

	    // create ReadStream object, specifying start, end values computed
	    // above to read range of bytes rather than entire file
	    var stream = fs.createReadStream(file, { start: start, end: end })
                // when ReadStream is open
		.on("open", function() {
		    // use stream pipe() method to send the HTTP response object,
		    // with flow automatically managed so destination is not overwhelmed
		    stream.pipe(res);
 	        // when error receiving data from stream, send error back to client
		// stream is auto closed
		}).on("error", function(err) {
		    res.status(404).send(err.message);
		});

	} else {
	    res.status(404).send(err.message);
	}
    });
};

// upload an image file; returns image file-path on server
exports.uploadImage = function(req, res) {

    MovieModel.findById(req.params.id, function(finderror, movie) {
	if (!finderror) {
	    // old (no userid) models are treated as belonging to any user: any 
	    // authenticated user can add a poster image to it

	    // new (userid) models are protected by an authorization check
	    // server-side permissions check: only the user who created a
	    // movie may add a poster image to it
	    if (!movie.get('userid') || 
		movie.get('userid', String) === req.session.userid) {

		var encoding = req.body.img.search(';base64'),
		// data:image/<suffix>;base64,<imageData>
		suffix = req.body.img.slice(11, encoding),
		imageData = req.body.img.slice(encoding + 8),
		// imageURL is used as the value of a movie-model poster field 
		// id parameter is the movie's "id" attribute as a string value
		imageURL = 'img/uploads/' + req.params.id + '.' + suffix,
		// rename the image file to match the imageURL
		newPath = __dirname + '/../public/' + imageURL;

		// create/overwrite image file on server
		fs.writeFile(newPath, imageData, { encoding: 'base64' }, 
			     function(writeerror) {
				 if (!writeerror) { 
				     // update poster field of associated movie 
				     // model on server
				     // assumes that this operation is successful 
				     // (rather than performing a two-phase commit)
				     movie.update({poster: imageURL}, 
						  function (seterror, result) {
						      if (seterror) {
							  console.log('unable to add poster to movie model');							  
						      }
						      res.status(200).send(imageURL);
						  });
				 } else {
				     res.status(500).send('(' + writeerror.message + ')');
				 }
			     });
	    } else {
		res.status(403).send('Not permitted to make this change');
	    }

	} else {
	    res.status(500).send("(" + finderror.message + ")");
	}
    });
};

exports.isAuth = function (req, res) {
    console.log('isAuth ', req.session);
    if (req.session && req.session.auth) {
        res.send(200, {'userid': req.session.userid,
                       'username': req.session.username});
    } else {
        res.status(200).send({'userid': '', 'username': ''});
    };
};

exports.auth = function (req, res) {

    if (req.body.login) {   // login request
	var username = req.body.username;
	var password = req.body.password;
	if (!username || !password) {
	    res.status(403).send('Invalid username-password combination, please try again');

	} else {
	    // find the user's entry in the DB
	    UserModel.findOne({username:username}, function(error, user){
		if (user !== null) {
		    // use bcrypt to compare the user-supplied password with the one 
		    // stored in the database
		    bcrypt.compare(password, user.password, function(error2, same) {
			
			if (same) {
			    var sess = req.session;  // create session
			    sess.auth = true;
			    sess.username = username;
			    sess.userid = user.id;
			    // set session-timeout, from config file
			    if (req.get('remember')) {
				// if "remember me" selected on signin form,
				// extend session to 10*default-session-timeout
				sess.cookie.maxAge = (config.env === 'development' ? 
						      null : 10*config.sessionTimeout);
			    }
			    res.status(200).send({'userid': user.id, 'username': username});
			} else if (!error2) {
			    res.status(403).send('Invalid username-password combination, please try again');
			} else {
			    res.status(500).send("Unable to login at this time; please try again later " 
						 + error2.message);
			}
		    });

		} else if (!error) {  // unrecognized username, but not DB error
		    res.status(403).send('Invalid username-password combination, please try again');

		} else {  // error response from DB
		    res.status(500).send("Unable to login at this time; please try again later " 
					 + error.message);
		}
	    });
	}

    } else { // logout request
	req.session.auth = false; // set the value of the session auth flag to false
	req.session.username = undefined; // set the username to undefined
	// don't destroy session on signout to keep from losing CSRF protection
	//req.session.destroy(); // destroy session in the session-store
	// Return a JSON object with the username and userid both set to undefined
	res.status(200).send({'userid': undefined, 'username': undefined});
    };
};

exports.signup = function(req, res) {
    var user = new UserModel(req.body);

    // generate salt value
    bcrypt.genSalt(function(error, salt) { 
	if (!error) {
	    // hash password using salt value generated
	    bcrypt.hash(req.body.password, salt, function (error2, hash) {
		if (!error2) {
		    // store the hashed-with-salt password in the DB
		    user.password = hash;

		    user.save(function (serr, result) {
			if (!serr) {
			    req.session.auth = true;
			    req.session.username = result.username;
			    req.session.userid = result.id;
			    res.status(200).send({'username':result.username, 'userid':result.id});
			} else {
			    console.log(serr);
			    if (serr && serr.code === 11000) {
				res.status(403).send("Sorry, username '"+
						     user.username+
						     "' is already taken; please choose another username");
			    } else {
				res.status(500).send("Unable to create account at this time; please try again later (" +serr.message+ ")");
			    }
			}
		    });

		} else {
		    res.status(500).send("Unable to create account at this time; please try again later (" +error2.message+ ")");
		}
	    });

	} else {
	    res.status(500).send("Unable to create account at this time; please try again later (" +error.message+ ")");
	}
    });
};