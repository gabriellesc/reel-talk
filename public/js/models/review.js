// catch simple errors
"use strict";

// declare reel-app namespace if it doesn't already exist
var reel =  reel || {};

reel.Review = Backbone.Model.extend({
    idAttribute: "_id",

    defaults: {
	"freshness": 0.0,   // fresh review value 1.0, rotten value 0.0
	"reviewText": "",   // review comments
	"reviewName": "",  // name of reviewer
	"reviewAffil": "",  // affiliation of reviewer
	"movieId": ""  // id of reviewed movie
    }
});