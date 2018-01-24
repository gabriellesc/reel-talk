// app.js Node.js server

"use strict;"   // flag JS errors 

/* Module dependencies:
 *
 * require() loads a nodejs "module" - basically a file.  Anything
 * exported from that file (with "exports") can now be dotted off
 * the value returned by require(), in this case e.g. reel.api
 * The convention is use the same name for variable and module.
 */
// nodejs looks in <currpath>/node_modules for these
var http = require("http"),
// NOTE, use the version of "express" linked to the assignment handout
express = require("express"),
fs = require("fs"),
path = require("path"),
url = require("url"),
multer = require("multer"),
logger = require("morgan"),
compression = require("compression"),
session = require("express-session"),
bodyParser = require("body-parser"),
methodOverride = require("method-override"),
directory = require("serve-index"),
errorHandler = require("errorhandler"),
basicAuth = require("basic-auth-connect"),  // optional, for HTTP auth
https = require('https'),

// config is an object module, that defines app-config attribues,
// such as "port", DB parameters
config = require("./config"),
reel = require('./routes/reel.js');  // route handlers

var options = {
    key: fs.readFileSync('key.pem'),  // RSA private-key
    cert: fs.readFileSync('cert.pem')  // RSA public-key certificate
};

// middleware check that req is associated with an authenticated session
function isAuthd(req, res, next) {
    // checks the request's session authentication status
    if (req.session && req.session.auth) {
	// allow the request to proceed
        return next();
    } else {
	res.status(403).send('User must sign in');
    }
};

/* not used - permission checking is performed in route handlers
// middleware check that the session-userid matches the userid associated
// with the movie model, e.g. when deleting or updating a model
function hasPermission(req, res, next) {
    if (req.get('userid')) {
	// new (userid) models, protected by an authorization check
	if (req.session && req.session.userid === req.get('userid')) {
            return next();
	} else {
	    res.status(403).send('Not permitted to make this change');
	}
    } else {
	// old (no userid) models, treated as belonging to any user
	// any authenticated user can modify and/or delete them
	return next();
    }
};*/

var app = express();  // Create Express app server

// Configure app server

// use PORT environment variable, or local config file value
app.set('port', process.env.PORT || config.port);

// activate basic HTTP authentication (to protect your solution files)
app.use(basicAuth(config.basicAuthUser, config.basicAuthPass));

// change param value to control level of logging
app.use(logger('dev'));  // 'combined', 'common', 'short', 'tiny', 'dev'

// use compression (gzip) to reduce size of HTTP responses
app.use(compression());

// parse HTTP request body
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true
}));

// set file-upload directory for poster images
app.use(multer({dest: __dirname + '/public/img/uploads/'}));

// Session config, based on Express.session, values taken from config.js
app.use(session({
    name: 'app.sess',
    secret: config.sessionSecret,
    rolling: true,  // reset session timer on every client access
    // no-expire session-cookies for testing
    cookie: { maxAge: (config.env === 'development' ? null : config.sessionTimeout),
	      httpOnly: true,
	      secure: true },
    saveUninitialized: false,
    resave: false
}));

var csrf = require('csurf');
app.use(csrf());

// checks req.body for HTTP method overrides
app.use(methodOverride());

// add an HSTS header to all responses from server (default length is 1 year)
app.use(function (req, res, next) {
    res.append('Strict-Transport-Security',
	       'max-age=' + (config.hstsMaxage || '31536000')); 
    next();
});

// App routes (RESTful API) - handler implementation resides in routes/reel.js

// Perform route lookup based on HTTP method and URL.
// Explicit routes go before express.static so that proper
// handler is invoked rather than static-content processor

// Heartbeat test of server API
app.get('/', reel.api);

// Retrieve a single movie by its id attribute
// GET /movies/:id (handler getMovie) 
app.get('/movies/:id', reel.getMovie);

// Create new movie
// POST /movies (handler addMovie)
app.post('/movies', isAuthd, reel.addMovie);    

// GET /movies (handler getMovies)
app.get('/movies', reel.getMovies);

// PUT /movies/:id (handler editMovie)
app.put('/movies/:id', isAuthd, reel.editMovie);

// DELETE /movies/:id (handler deleteMovie) 
app.delete('/movies/:id', isAuthd, reel.deleteMovie);

// Save a movie poster image
app.put('/movies/:id/image', isAuthd, reel.uploadImage);

// Retrieve a collection of reviews for movie with given id
// GET /movies/:id/reviews (handler getReviews)
app.get('/movies/:id/reviews', reel.getReviews);

// Create a new review in the collection
// POST /movies/:id/reviews (handler addReview)
app.post('/movies/:id/reviews', isAuthd, reel.addReview);

// GET /movies/:id/video (handler playMovie)
app.get('/movies/:id/video', reel.playMovie);

// POST /auth  (signup)
app.post('/auth', reel.signup);

// PUT /auth  (signin/signout)
app.put('/auth', reel.auth);

// Setup for rendering csurf token into index.html at app-startup
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/public');
// When client-side requests index.html, perform template substitution on it
app.get('/index.html', function(req, res) {
    // req.csrfToken() returns a fresh random CSRF token value
    res.render('index.html', {csrftoken: req.csrfToken()});
});

// location of app's static content
app.use(express.static(__dirname + "/public"));

// allow browsing of docs directory
app.use(directory(__dirname +  "/public/docs"));

// return error details to client - use only during development
if (config.env === 'development') {
    app.use(errorHandler({ dumpExceptions:true, showStack:true }));
}

// Default-route middleware, in case none of above match
// respond with a status-code of 404 and an appropriate HTML-formatted message
// for display by the browser.
app.use(function (req, res) {
    res.status(404).send("<body title='Page Not Found' " +
			 "style=background-image:url('/img/404.jpg')>");
    // Image credit: http://worrydream.com/404notfound
});

app.use(function (err, req, res, next) {
    // if err.code doesn't match the CSRF error code, hand off control to the nex 
    // callback
    if (err.code !== 'EBADCSRFTOKEN') 
	return next(err);
 
    res.status(403).send('Authentication error, please reload app');
});

// Start HTTPS server
https.createServer(options, app).listen(app.get('port'), function () {
    console.log("Express server listening on port %d in %s mode",
		app.get('port'), config.env);
});
