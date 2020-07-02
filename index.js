const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const { addUser, removeUser, getUser, getUsersInChat } = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    socket.on('join', ({ name }, callback) => {
        const { error, user } = addUser({ id: socket.id, name });
        if (error) return callback(error);

        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the chat.` });
        socket.broadcast.emit('message', { user: 'admin', text: `${user.name} has joined!` });
        socket.join();
        io.emit('roomData', {users: getUsersInChat()});
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.emit('message', {user: user.name, text:message});
        io.emit('roomData', {users: getUsersInChat()});

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.emit('message', { user: 'admin', text: `${user.name} has left.`});
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server started on port: ${PORT}`));