const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const rooms = {};
const socketToRoom = {};

io.on("connection", socket => {
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
        socketToRoom[socket.id] = roomID;
    });

    socket.on("offer", payload => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });

    socket.on("code", ({language,code,id}) => {
        const otherUser = rooms[id].find(id => id !== socket.id);
        io.to(otherUser).emit("receive code",{language,code})
    })

    socket.on("send msg", (payload,id) => {
        const otherUser = rooms[id].find(id => id !== socket.id);
        io.to(otherUser).emit("receive msg",payload)
    })

    socket.on("send output", (payload,id) => {
        const otherUser = rooms[id].find(id => id !== socket.id);
        io.to(otherUser).emit("receive output",payload)
    })

    socket.on("send board", (data,id) => {
        const otherUser = rooms[id].find(id => id !== socket.id);
        io.to(otherUser).emit("receive board",data)
    })
    
    socket.on("CODE_CHANGED", payload => {
        const otherUser = rooms[payload.id].find(id => id !== socket.id);
        io.to(otherUser).emit("receive code",payload)
    })

    socket.on("language changed",payload => {
        const otherUser = rooms[payload.id].find(id => id !== socket.id);
        io.to(otherUser).emit("receive change language",payload)
    })

    socket.on("mute me",payload => {
        const otherUser = rooms[payload.id].find(id => id !== socket.id);
        io.to(otherUser).emit("muting you",payload.value)
    })

    socket.on("unmute me",payload => {
        const otherUser = rooms[payload.id].find(id => id !== socket.id);
        io.to(otherUser).emit("unmuting you",payload.value)
    })

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        if(!roomID) {
            return
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        let room = rooms[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            rooms[roomID] = room;
        }
        // socket.broadcast.emit("user left")
        io.to(otherUser).emit("user left")
    })
});


server.listen(8000, () => console.log('server is running on port 8000'));
