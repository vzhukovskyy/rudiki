var fs = require('fs');

module.exports = {
    log: function(message, req) {
        var user = req ? (req.user ? req.user : 'unknown') : 'system';
        var s = String(new Date())+' '+user+' '+message;
        console.log(s);
        fs.appendFile(__dirname+'/messages.log', s+'\n');
    },
    logStartup: function() {
        module.exports.log('-----------------------------');
        module.exports.log('       Server start-up       ');
        module.exports.log('-----------------------------');
    }
};
