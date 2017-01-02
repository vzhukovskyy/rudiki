// config/passport.js

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var configAuth = require('../mode').demoMode() ? require('../config-demo/auth') : require('../config-production/auth');

module.exports = function(passport) {
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    passport.serializeUser(function(email, done) {
        done(null, email);
    });

    passport.deserializeUser(function(email, done) {
        done(null, email);
    });

    
    passport.use(new GoogleStrategy(
        {
            clientID: configAuth.googleAuth.clientID,
            clientSecret: configAuth.googleAuth.clientSecret,
            callbackURL: configAuth.googleAuth.callbackURL
        },
        function(token, refreshToken, profile, done) {
             return done(null, profile.emails[0].value);
        }
    ));
}