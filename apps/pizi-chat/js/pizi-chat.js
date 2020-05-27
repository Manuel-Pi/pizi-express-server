define(['backbone', 'views/ChatView', 'views/UserListView', 'views/RoomListView', 'pizi-backbone'], function (_backbone, _ChatView, _UserListView, _RoomListView, _piziBackbone) {
    'use strict';

    var _backbone2 = _interopRequireDefault(_backbone);

    var _ChatView2 = _interopRequireDefault(_ChatView);

    var _UserListView2 = _interopRequireDefault(_UserListView);

    var _RoomListView2 = _interopRequireDefault(_RoomListView);

    var _piziBackbone2 = _interopRequireDefault(_piziBackbone);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    if (io) {
        var name = prompt("Enter a name:");
        if (name) {
            window.App = window.App || {
                user: name,
                socket: io('/pizi-chat'),
                notification: {
                    success: function (message) {
                        if (App.actualRoom) App.rooms[App.actualRoom].notification.success(message);
                    },
                    error: function (message) {
                        if (App.actualRoom) App.rooms[App.actualRoom].notification.error(message);
                    },
                    notify: function (message) {
                        if (App.actualRoom) App.rooms[App.actualRoom].notification.notify(message);
                    }
                },
                popup: new _piziBackbone2.default.PopupView(),
                rooms: {}
            };

            App.socket.on('unauthorized', function (data) {
                alert(data.message);
                App.name = prompt("Enter a name:");
                App.socket.emit('login', App.name);
            });

            App.socket.on('disconnect', function (message) {
                if (message === 'unauthorized') {
                    alert("Name already used!");
                } else {
                    alert("Server closed!");
                    document.getElementsByTagName('body')[0].innerHTML = "";
                }
            });

            App.socket.on('loginSuccess', function (data) {
                $('body').append("<pizi-chat><info></info></pizi-chat>");
                var $PiziChat = $('pizi-chat');
                var $Info = $PiziChat.find("info");

                App.roomView = new _RoomListView2.default(data);
                $Info.append(App.roomView.$el);
                App.roomView.render();

                App.userView = new _UserListView2.default(data);
                $Info.append(App.userView.$el);

                App.addRoom = function (room) {
                    if (room) {
                        room.connected.push(App.user);
                        var chatView = new _ChatView2.default({ room: room });
                        $PiziChat.prepend(chatView.$el.hide());
                        chatView.render();
                        App.rooms[room.id] = chatView;
                        App.socket.emit('joinRoom', room.id);
                    }
                };

                App.displayRoom = function (room) {
                    if (App.actualRoom) App.rooms[App.actualRoom].$el.hide();
                    if (room) {
                        if (App.actualRoom) App.rooms[App.actualRoom].$el.hide();
                        if (!App.rooms[room.id]) App.addRoom(room);
                        App.actualRoom = room.id;
                        App.rooms[App.actualRoom].$el.show();
                        // Render room view
                        App.roomView.setActual(App.actualRoom);
                        // Render user view
                        App.userView.render(room.connected);
                    } else {
                        if (App.actualRoom) App.rooms[App.actualRoom].$el.hide();
                    }
                };

                App.removeRoom = function (room) {
                    App.rooms[room.id].remove();
                    delete App.rooms[room.id];
                    if (App.actualRoom === room.id) App.actualRoom = null;
                };

                App.socket.on('message', function (message) {
                    if (App.rooms[message.roomId]) {
                        App.rooms[message.roomId].addMessage(message);
                        if (message.roomId !== App.actualRoom) {
                            App.roomView.addNotification(message.roomId);
                        }
                    }
                });

                if (data.rooms && data.rooms.length > 0) {
                    App.displayRoom(data.rooms[0]);
                }
                App.notification.success('Successfully connected!');
            });

            // Connect to server
            App.socket.emit('login', name);
        } else {
            alert("No name ... no chat!");
            document.getElementsByTagName("body")[0].innerHTML = "";
        }
    } else {
        console.log("io is not defined!");
    }
});
