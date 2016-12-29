// server.js

var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require('fs');

// configuration ===============================================================
require('./config/passport')(passport); // pass passport for configuration

app.use(express.static(__dirname+'/web'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser());

// required for passport
app.use(session({ secret: 'rudikiki' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================

if(require('./mode').demoMode()) {
    http.createServer(app).listen(80);
}
else {
    // http server redirecting to https
    http.createServer(function(req, res){    
        res.writeHead(302,  {Location: "https://rudiki.pp.ua"})
        res.end();
    }).listen(80);

    // https server
    var privateKey = fs.readFileSync(__dirname+'/config-production/ssl/server.pem');
    var certificate = fs.readFileSync(__dirname+'/config-production/ssl/server.crt');
    var ca = [fs.readFileSync(__dirname+'/config-production/ssl/bundle_01.crt'), 
              fs.readFileSync(__dirname+'/config-production/ssl/bundle_02.crt'), 
              fs.readFileSync(__dirname+'/config-production/ssl/bundle_03.crt')];
    var httpsOpts = { key: privateKey, cert: certificate, ca: ca };

    https.createServer(httpsOpts, app).listen(443);
}

console.log('The server is ready');