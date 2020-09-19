define(['module', 'exports', 'backbone', 'text!html/room.html', 'views/AddRoomView'], function (module, exports, _backbone, _room, _AddRoomView) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _backbone2 = _interopRequireDefault(_backbone);

    var _room2 = _interopRequireDefault(_room);

    var _AddRoomView2 = _interopRequireDefault(_AddRoomView);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    exports.default = _backbone2.default.View.extend({
        template: _.template(_room2.default),
        tagName: "room-list",
        className: "container-fluid",
        initialize: function (options) {
            options = options || {};
            this.rooms = options.rooms;
            var view = this;
            App.socket.on('roomAdded', function (room) {
                App.addRoom(room);
                view.rooms.push(room);
                view.addRoom(room);
                if (room.author === App.user) {
                    App.displayRoom(room);
                }
            });
            App.socket.on('roomDeleted', function (room) {
                view.removeRoom(room);
                view.rooms.slice(view.rooms.indexOf(room), 1);
            });
            App.socket.on('roomData', function (room) {
                var i = view.rooms.length;
                while (i--) {
                    if (view.rooms[i].id === room.id) {
                        view.rooms[i] = room;
                        App.userView.render(room.connected);
                        break;
                    }
                }
            });
            App.socket.on('userJoinRoom', function (data) {
                var i = view.rooms.length;
                while (i--) {
                    if (view.rooms[i].id === data.roomId && view.rooms[i].connected.indexOf(data.user) === -1) {
                        view.rooms[i].connected.push(data.user);
                        App.userView.render(view.rooms[i].connected);
                        if (data.roomId === App.actualRoom) App.notification.notify(data.user + " join the room!");
                        break;
                    }
                }
            });
            App.socket.on('userLeaveRoom', function (data) {
                var i = view.rooms.length;
                while (i--) {
                    if (view.rooms[i].id === data.roomId && view.rooms[i].connected.indexOf(data.user) > -1) {
                        view.rooms[i].connected.splice(view.rooms[i].connected.indexOf(data.user), 1);
                        App.userView.render(view.rooms[i].connected);
                        if (data.roomId === App.actualRoom) App.notification.notify(data.user + " leave the room!");
                        break;
                    }
                }
            });
        },
        events: {
            'dblclick #roomList div': 'displayRoom',
            'click span.close': 'leaveRoom',
            'click span.add': 'createRoom'
        },
        createRoom: function () {
            App.popup.basic({
                template: new _AddRoomView2.default(),
                ok: function () {
                    var usersAuthorized = [];
                    var privateRoom = this.$el.find('#switch')[0].selected;
                    var name = this.$el.find('input.name').val();
                    var nameExist = _.where(App.roomView.rooms, { name: name }).length > 0;
                    if (name && name !== "" && !nameExist) {
                        _.each(this.$el.find('ul li.selected'), function (li) {
                            usersAuthorized.push(li.id.replace('-choice', ''));
                        });
                        var newRoom = {
                            id: name.toLowerCase(),
                            name: name,
                            authorized: privateRoom ? usersAuthorized : 'All',
                            author: App.user
                        };
                        App.socket.emit('addRoom', newRoom);
                    } else if (nameExist) {
                        alert('Name exist!');
                    }
                }
            });
        },
        leaveRoom: function (event) {
            var i = this.roomIndex($(event.currentTarget).parent()[0].id);
            this.removeRoom(this.rooms[i]);
            App.socket.emit('leaveRoom', this.rooms[i].id);
            this.rooms.splice(i, 1);
            App.displayRoom(this.rooms[0]);
        },
        roomIndex: function (roomId) {
            var i = this.rooms.length;
            while (i--) {
                if (this.rooms[i].id === roomId) break;
            }
            return i;
        },
        displayRoom: function (event) {
            var i = this.roomIndex(event.currentTarget.id);
            this.rooms[i].notif = 0;
            this.$el.find('#roomList #' + event.currentTarget.id + ' span.label').addClass('hide');
            App.displayRoom(this.rooms[i]);
        },
        addRoom: function (room, silent) {
            var roomList = this.$el.find('#roomList');
            roomList.append("<div id='" + room.id + "'>" + room.name + "<span class='round label hide'></span><span class='close'>&times;</span></div>");
            if (!silent) App.notification.notify(room.name + ' room opened!');
        },
        removeRoom: function (room, silent) {
            var $room = this.$el.find('#roomList #' + room.id);
            $room.remove();
            App.removeRoom(room);
            if (!silent) App.notification.notify(room.name + ' room closed!');
        },
        setActual: function (roomId) {
            this.$el.find('#roomList .actualRoom').removeClass('actualRoom');
            this.$el.find('#roomList #' + roomId).addClass('actualRoom');
        },
        addNotification: function (roomId) {
            var i = this.roomIndex(roomId);
            this.rooms[i].notif = this.rooms[i].notif || 0;
            this.rooms[i].notif++;
            var $roomNotif = this.$el.find('#roomList #' + roomId + ' span.label');
            $roomNotif.html(this.rooms[i].notif);
            $roomNotif.removeClass('hide');
        },
        render: function () {
            this.$el.html(this.template());
            for (var i = 0; i < this.rooms.length; i++) {
                this.addRoom(this.rooms[i], true);
            }
            this.delegateEvents();
            return this;
        }
    });
    module.exports = exports['default'];
});
