module.exports = function(server){
    
    // Chargement de socket.io
    var io = require('socket.io').listen(server);
    
    var users = [];

    // Quand on client se connecte, on le note dans la console
    io.sockets.on('connection', function (socket) {
        
        socket.on('login', function (pseudo) {
            socket.emit('message', {text: 'Connected!', user: "server"});
            console.log('Connection: ' + pseudo);
            socket.user = pseudo;
            users.push(pseudo);
            socket.emit('users', users);
            socket.broadcast.emit('users', users);
        });
        
        // Quand le serveur reçoit un signal de type "message" du client
        socket.on('message', function (message) {
            socket.broadcast.emit('message', message);
        });
        
        socket.on('disconnect', function () {
            var i = users.indexOf(socket.user);
            if(i > -1){
                console.log('Deconnexion: ' + users[i]);
                delete users[i];
            }
            socket.emit('users', users);
        });
    });
}
