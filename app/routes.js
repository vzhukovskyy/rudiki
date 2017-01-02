// app/routes.js

var api = require('./api');
var demoMode = require('../mode').demoMode();
var auth = demoMode ? require('../config-demo/auth') : require('../config-production/auth');
var logger = require('./logger');
const path = require('path');

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
    app.get('/dashboard', isAuthenticated, isAuthorized, function(req, res) {
        var filename = path.join(__dirname, '..', 'views', 'dashboard.html');
        res.sendfile(filename);
    });

    app.get('/api/getSwitchState', function(req, res) {
        res.send(api.getSwitchState());
    });

    app.post('/api/setSwitchState', function(req, res) {
        api.setSwitchState(req);
        res.send(api.getSwitchState());
    });
}

function isAuthenticated(req, res, next) {
    if(req.isAuthenticated())
        return next();

    res.redirect('/');
}

function isAuthorized(req, res, next) {
    if(demoMode || auth.authorizedUsers.indexOf(req.user) >= 0)
        return next();

    res.status(403).send("Неавторизована спроба доступу занотована.");
    logger.log('Not authorized access attempt', req);
}