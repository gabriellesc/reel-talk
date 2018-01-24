"use strict;"   // flag JS errors 

module.exports = {
    httpport: 41015, // 41015, 41016, 41018, 41019
    port: 41016, // same as HTTP server from A2 except use A2_port#+1

    // app credentials
    basicAuthUser: 'gabrielle',
    basicAuthPass: 'greenparrot',

    // MongoDB credentials
    dbuser: 'singhcad',
    dbpass: 'greenparrot',
    dbname: 'singhcad',

    env: 'development',

    // video-directory path
    viddir: 'img/videos/',

    sessionSecret: 'green parrot',
    sessionTimeout: 30*1000,

    // duration of STS policy (seconds)
    hstsMaxage: '31536000'
};
