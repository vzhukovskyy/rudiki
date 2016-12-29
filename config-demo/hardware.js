module.exports = {
    write: function(index, state) {
        if(0 <= index && index <= 1) {
            io[index] = state;
        }
    },
    
    read: function() {
        return io;
    },
    
    getSwitchName: function(index) {
        return names[index];
    }
};

var io = [0, 0];
var names = ['light', 'unconnected'];
