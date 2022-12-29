var express = require("express");
var router = express.Router();

var app = express();
var socketapi = require("../socketapi");
var io = socketapi.io;
app.set("socketio", io);

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("../utils/users");

// routes handling
router.get("/", function (req, res) {
  res.render("index");
});

router.get("/anonymousChat", function (req, res) {
  res.render("chatRoom");
});

router.get("/grantAccess", function (req, res) {
  res.render("grantAccess");
});

router.get("/videoChat", function (req, res) {
  res.render("vidChat");
});

router.get("/textChat", function (req, res) {
  res.render("textChat");
});

router.get("/enterRoom", function (req, res) {
  res.render("enterRoom");
});

// variables used in random text chat
var queue = []; // list of sockets waiting for peers
var rooms = {}; // map socket.id => room
var allUsers = {}; // map socket.id => socket

// variables used in random Video chat
var mapSp = {};
var queue2 = [];
var rooms2 = {};
var allUsers2 = {};
var peerToDisconnect;

//find peer function For random Text chat
var findPeerForLoneSocket = function (socket) {
  if (queue.length !== 0) {
    var peer = queue.pop();
    var roomName = socket.id + "#" + peer.id;

    peer.join(roomName);
    socket.join(roomName);
    io.to(roomName).emit("chatStart", { msg: "Stranger Connected" });
    // console.log('from connection : '+[...(socket.rooms)]+'\n')

    rooms[peer.id] = roomName;
    rooms[socket.id] = roomName;

    socket.emit("roomName", roomName);
  } else {
    queue.push(socket);
  }
};

//find peer function For random Video chat
function findPeerForVideoLoneSocket(socket) {
  if (queue2.length > 0) {
    var existingSocket = queue2.pop();
    var roomName = existingSocket.id + "#" + socket.id;

    existingSocket.join(roomName);
    socket.join(roomName);
    io.to(roomName).emit("chatStart", { msg: "Stranger Connected" });

    rooms2[existingSocket.id] = roomName;
    rooms2[socket.id] = roomName;

    peerToDisconnect = mapSp[socket.id];
    socket.to(roomName).emit("user-connected", mapSp[socket.id]);
  } else {
    queue2.push(socket);
  }
}
// var onlineUsers = [];
// socket handling
io.on("connection", function (socket) {
  // onlineUsers.push(socket.id);

  // io.emit("usersOnline", onlineUsers.length);

  // -------------- For Group Text Chat -------------------------
  socket.on("joinRoom", ({ uname, room }) => {
    // Telling Number of Users

    const user = userJoin(socket.id, uname, room);

    // Join room
    socket.join(room);

    // alert that user joined the chat
    socket.to(user.room).emit("alert", { user: user.username, msg: "joined" });

    // accept msg and emit to room
    socket.on("msg", function (data) {
      io.to(room).emit("reply", { data: data, id: socket.id });
    });

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    // Disconnection
    socket.on("disconnect", function () {
      const user = userLeave(socket.id);
      if (user) {
        // alert that user left the chat
        socket
          .to(user.room)
          .emit("alert", { user: user.username, msg: "left" });

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });

    // typing detection
    socket.on("typing", (data) => {
      if (data.istyping == true) socket.to(room).emit("display", data);
      else socket.to(room).emit("display", data);
    });
  });

  // -------------- For Random Text Chat Pairing -------------------------
  socket.on("inTextChat", () => {
    // if user refreshes tab then, non socket existing user will get popped from queue
    queue.forEach(function (s) {
      if (s.connected) {
        console.log(`User with socket id : ${s.id} is connected`);
      } else {
        console.log(`${s.id} is not connected`);
        queue.pop(s);
      }
    });

    // user connected to socket
    socket.on("userConnected", () => {
      allUsers[socket.id] = socket;
      findPeerForLoneSocket(socket);
    });

    // catch and send message to room only
    socket.on("message", (data) => {
      var room = rooms[socket.id];
      io.to(room).emit("reply", { data: data, id: socket.id });
    });

    // on disconnection
    socket.on("disconnect", () => {
      socket.leave(room);
      var room = rooms[socket.id];
      if (room) {
        socket.broadcast
          .to(room)
          .emit("chatEnd", { msg: "Stranger Disconnected" });
        var peerID = room.split("#");
        peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
        findPeerForLoneSocket(allUsers[peerID]);
      }
      console.log("from disconnection : " + queue.length);
    });

    // Ends Chat Purposely
    socket.on("leaveRoom", () => {
      socket.leave(room);
      var room = rooms[socket.id];
      if (room) {
        socket.broadcast
          .to(room)
          .emit("chatEnd", { msg: "Stranger Disconnected" });
        var peerID = room.split("#");
        peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
        findPeerForLoneSocket(allUsers[peerID]);
        findPeerForLoneSocket(socket);
      }
      // add both current and peer to the queue
    });

    // typing detection
    socket.on("typing", (data) => {
      var room = rooms[socket.id];
      if (data.istyping == true) socket.to(room).emit("display", data);
      else socket.to(room).emit("display", data);
    });
  });

  // -------------- For Random Video Chat Pairing -------------------------
  socket.on("inVidChat", () => {
    queue2.forEach(function (s) {
      if (s.connected) {
        console.log(`User with socket id : ${s.id} is connected`);
      } else {
        console.log(`${s.id} is not connected`);
        queue2.pop(s);
      }
    });

    allUsers2[socket.id] = socket;
    socket.on("peerId", (peerId) => {
      mapSp[socket.id] = peerId;
      console.log(mapSp);
      findPeerForVideoLoneSocket(socket);
    });

    // catch and send message to room only
    socket.on("message", (data) => {
      var room = rooms2[socket.id];
      io.to(room).emit("replyMessage", { data: data, id: socket.id });
    });

    socket.on("disconnect", function () {
      var room = rooms2[socket.id];
      socket.leave(room);
      socket.to(room).emit("user-disconnected", peerToDisconnect);

      if (room) {
        socket.broadcast
          .to(room)
          .emit("chatEnd", { msg: "Stranger Disconnected" });

        var pushedUser;
        var userToPush = room.split("#");
        pushedUser =
          userToPush[0] === socket.id ? userToPush[1] : userToPush[0];
        findPeerForVideoLoneSocket(allUsers2[pushedUser]);
      }
      console.log("from disconnection : " + queue2.length);
    });

    // Ends Chat Purposely
    socket.on("leaveRoom", () => {
      var room = rooms2[socket.id];
      socket.leave(room);

      socket.to(room).emit("user-disconnected", peerToDisconnect);
      if (room) {
        socket.broadcast
          .to(room)
          .emit("chatEnd", { msg: "Stranger Disconnected" });

        var pushedUser;
        var userToPush = room.split("#");
        pushedUser =
          userToPush[0] === socket.id ? userToPush[1] : userToPush[0];
        // add both current and peer to the queue2
        allUsers2[pushedUser].leave(room);
        findPeerForVideoLoneSocket(allUsers2[pushedUser]);
        findPeerForVideoLoneSocket(socket);
      }
    });

    // typing detection
    socket.on("typing", (data) => {
      var room = rooms2[socket.id];
      if (data.istyping == true) socket.to(room).emit("display", data);
      else socket.to(room).emit("display", data);
    });
  });
  // socket.on("disconnect", () => {
  //   onlineUsers.splice(onlineUsers.indexOf(socket.id), 1);
  //   io.emit("dis", onlineUsers.length);
  // });
});

module.exports = router;
