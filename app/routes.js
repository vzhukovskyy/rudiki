// app/routes.js

var api = require('./api');
var demoMode = require('../mode').demoMode();
var auth = demoMode ? require('../config-demo/auth') : require('../config-production/auth');
var logger = require('./logger');
const path = require('path');
var GoogleAuth = require('google-auth-library');

module.exports = function(app, passport) {
   
    // GOOGLE ROUTES
    // send to google to do the authentication
    app.get('/', passport.authenticate('google', { scope: ['profile', 'email']}));

    // the callback after google has authenticated the user
    app.get('/google-callback', passport.authenticate('google', {
        successRedirect: '/dashboard',
        failureRedirect: '/'
    }));
    
    
    // Only show dashboard if authenticated, so static serve does not work here
    app.get('/dashboard', isUiAuthorized, memStats, function(req, res) {
        var filename = path.join(__dirname, '..', 'views', 'dashboard.html');
        res.sendfile(filename);
    });

    app.get('/api/getSwitchState', isApiAuthorized, function(req, res) {
        res.send(api.getSwitchState());
    });

    app.post('/api/setSwitchState', isApiAuthorized, function(req, res) {
        console.log('route /api/setSwitchState req.user', req.user);
        api.setSwitchState(req);
        res.send(api.getSwitchState());
    });
}

function isUiAuthorized(req, res, next) {
    if(demoMode || auth.authorizedUsers.indexOf(req.user) >= 0)
        return next();

    if(req.user) {
        // someone not authorized tries to access web page
        logger.log('Not authorized UI access attempt. User '+req.use+' from '+req.connection.remoteAddress+', user-agent:'+req.headers['user-agent'], req);
        res.status(403).send("Not authorized API access attempt recorded.");
    }
    else {
        // need to authenticate
        res.redirect('/');
    }
}

var googleAuth = new GoogleAuth;
var oauthClient = new googleAuth.OAuth2(auth.googleAuth.clientID, '', '');

function isApiAuthorized(req, res, next) {
    
    var token;
    if(req.headers.authorization) {
        if(req.headers.authorization.startsWith("OAuth ")) {
            token = req.headers.authorization.substr(6);
        }
    }
    if(req.query.access_token) {
        token = req.query.access_token;
    }
    
    //console.log('isApiAuthorized req.user=', req.user, ' token=',token);
    
    if(token) {
        var verificationStarted = Date.now();
        oauthClient.verifyIdToken(
            token,
            auth.googleAuth.clientID,
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3],
            function(e, login) {
                var verificationFinished = Date.now();
                console.log('Token verification took', (verificationFinished-verificationStarted), 'ms');
                
                if(e) {
                    logger.log('Token verification error'+e, req);
                    res.status(403).send("Not authorized API access attempt recorded.");
                }
                else {
                    var payload = login.getPayload();
                    req.user = payload.email;              
                }
                
                return isUserAuthorized(req, res, next);
            });
    }
    else {
        return isUserAuthorized(req, res, next);
    }
}

function isUserAuthorized(req, res, next) {
    if(demoMode || auth.authorizedUsers.indexOf(req.user) >= 0)
        return next();
        
    res.status(403).send("Not authorized API access attempt recorded.");
    logger.log('Not authorized API access attempt from '+req.connection.remoteAddress+', user-agent:'+req.headers['user-agent'], req);
}

function memStats(req, res, next) {
    var mu = process.memoryUsage();
    logger.log('Memory usage rss='+toMb(mu.rss)+"Mb, heapTotal="+toMb(mu.heapTotal)+"Mb, heapUsed="+toMb(mu.heapUsed)+"Mb, external="+toMb(mu.external));
    return next();
}

function toMb(size) {
    return size ? Math.round(size/1024/1024) : null;
}