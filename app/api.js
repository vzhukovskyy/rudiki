var hw = require('../mode').demoMode() ? require('../config-demo/hardware') : require('../config-production/hardware');
var logger = require('./logger');

module.exports = {
    getSwitchState: function() {
        return composeSwitchStateJson();
    },

    setSwitchState: function(req) {
        var switchNo = req.body.switch;
        var state = req.body.state;
        
        hw.write(switchNo, state);
        logger.log('turned '+(state?'on':'off')+' switch '+hw.getSwitchName(switchNo), req);

        scheduleAutomaticTurnoff(switchNo, state);
    }
};

function composeSwitchStateJson() {
    var states = hw.read();
    var turnoffs = getScheduledTurnoffs();
    var jsonString = JSON.stringify({states: states, turnoffs: turnoffs});
    return jsonString;
}

var scheduledTasks = {};

function scheduleAutomaticTurnoff(switchNo, state) {
    //var timeout = 15*1000;
    var timeout = 10*60*1000;
    if(state) {
        var timeoutId = setTimeout(function(){
            delete scheduledTasks[switchNo];
            hw.write(switchNo, 0);            
            logger.log('automatically turned off switch '+hw.getSwitchName(switchNo));
        }, timeout);
        
        var task = {
            at: new Date(Date.now()+timeout),
            id: timeoutId
        };
        scheduledTasks[switchNo] = task;
        
        //console.log('Scheduled automatic turnoff at',task.at);
        //console.log(scheduledTasks);
    }
    else {
        var task = scheduledTasks[switchNo];
        if(task) {
            delete scheduledTasks[switchNo];
            clearTimeout(task.id);
        }
        
        //console.log('Cancelled automatic turnoff at',task.at);
        //console.log(scheduledTasks);
    }
}

function getScheduledTurnoffs() {
    var sched = [];
    var now = Date.now();
    sched.push(scheduledTasks[0] && Math.ceil((scheduledTasks[0].at.getTime()-now)/1000));
    sched.push(scheduledTasks[1] && Math.ceil((scheduledTasks[1].at.getTime()-now)/1000));
    return sched;
}
