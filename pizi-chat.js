module.exports = function(server){
    
    // Get io for a specific namespace
    var io = require('socket.io').listen(server).of('/pizi-chat');
    
    var users = [];

    // On connection
    io.on('connection', function (socket) {
        
        socket.on('login', function (pseudo) {
            if(users.indexOf(pseudo) == -1){
                socket.emit('message', {text: 'Connected!', user: "server"});
                console.log('Connection: ' + pseudo);
                socket.user = pseudo;
                users.push(pseudo);
                socket.emit('users', users);
                socket.broadcast.emit('users', users);
            } else {
                socket.disconnect('unauthorized');
            }
        });
        
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
        });
        
        socket.on('disconnect', function () {
            var i = users.indexOf(socket.user);
            if(i > -1){
                console.log('Deconnexion: ' + users[i]);
                delete users[i];
            }
            socket.broadcast.emit('users', users);
        });
    });
}
