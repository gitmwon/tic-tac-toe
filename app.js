const express = require("express");

const { Server } = require("socket.io");

const app = express();

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

const { User, Datas, db } = require("./config.js");
const { forEach } = require("lodash");

app.use(express.json());

const exserver = app.listen(8080, "0.0.0.0", () => {
  console.log("server started at port 8080");
});

const io = new Server(exserver);

let users = [];

let turn = "x";

function changeTurn() {
  return turn === "x" ? "o" : "x";
}

io.on("connection", (socket) => {
  let lockedSocket = "";
  const ary = [];

  const getData = async () => {
    try {
      const querySnapshot = await db.collection("data").get();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const obj = {
          name: data.user,
          loc: data.loc,
          socketID: data.socketID,
          value: data.value,
          room: data.room,
        };
        ary.push(obj);
      });

      socket.emit("fetchData", ary);
      //console.log(ary);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  getData();

  socket.on("clearData", async () => {
    const querySnapshot = await db.collection("data").get();
    querySnapshot.forEach((doc) => {
      doc.ref.delete();
    });
  });

  socket.on("userCreated", async (loc, room, name) => {
    User.add({
      name: name,
      room: room,
      socketID: socket.id,
      urlVal: loc,
      lastTime: new Date().getTime(),
    })
      .then((docRef) => {
        console.log(`Added user ${name}`);

        socket.emit("sendUsers", room, loc, socket.id);
        return User.doc(docRef.id).update({
          id: docRef.id,
        });
      })
      .catch((error) => {
        console.log(`error adding document: ${error}`);
      });
  });

  socket.on("forwardUsers", async (room, loc,Uid) => {
    const rooms = await User.where("room", "==", room).get();
    const [roomsSnapshot] = await Promise.all([rooms]);

    if (roomsSnapshot.size < 2) {
      socket.emit("initialRedirect", `/waiting.html?id=${Uid}`);
    } else {
      io.emit("redirect", loc);
    }
  });

  socket.on("userJoined", async (loc, room, name) => {
    const rooms = await User.where("room", "==", room).get();
    const user = await User.where("room", "==", room)
      .where("name", "==", name)
      .get();
    const locval1 = await User.where("room", "==", room)
      .where("urlVal", "!=", "")
      .get();
    try {
      const [roomsSnapshot, userSnapshot, locval1Snapshot] = await Promise.all([
        rooms,
        user,
        locval1,
      ]);
      const roomSize = roomsSnapshot.size;
      const userSize = userSnapshot.size;
      if (roomSize > 0 && userSize == 0) {
        locval1Snapshot.forEach((e) => {
          socket.emit("sendUsers", room, e.data().urlVal);
        });
        User.add({
          name: name,
          room: room,
          socketID: socket.id,
          lastTime: new Date().getTime(),
          urlVal: "",
        })
          .then((docRef) => {
            console.log(`Added user ${name}`);

            return User.doc(docRef.id).update({
              id: docRef.id,
            });
          })
          .catch((error) => {
            console.log(`error adding document: ${error}`);
          });
      } else if (roomSize < 1) {
        console.log("Room does not exist");
      } else {
        console.log("username already in use");
      }
    } catch (error) {
      console.log("Error getting query: ", error);
    }
  });

  socket.on("joinroom", (user, room) => {
    socket.join(room);
  });

  socket.on("locval", (user, room, loc, val) => {
    socket.broadcast.to(room).emit("locdata", user, loc, val);
  });

  socket.on("getid", (room) => {
    if (lockedSocket == "") {
      lockedSocket = socket.id;
      socket.emit("return");
      socket.broadcast.to(room).emit("reverse");
    } else if (lockedSocket == socket.id) {
      console.log("same socket: ", socket.id);
      socket.emit("return");
      socket.broadcast.to(room).emit("reverse");
    }

    console.log("lockedsocket: ", lockedSocket);
  });

  socket.emit("initialval", turn);

  socket.on("getTurn", (room) => {
    io.to(room).emit("turn", changeTurn());
    turn = changeTurn();
  });

  //check if client disconnected

  socket.on("heartbeat", (val) => {
    //console.log("heartbeat:",val);
    const docRef = db.collection("users").where("socketID", "==", val);

    docRef
      .get()
      .then((snapShot) => {
        snapShot.forEach((doc) => {
          const dataval = { lastTime: new Date().getTime() };
          db.collection("users")
            .doc(doc.id)
            .update(dataval)
            .then(() => {
              console.log("document updated !!!");
              console.log(doc.data().socketID, doc.data().lastTime);
            })
            .catch((error) => {
              console.log("error");
            });
        });
      })
      .catch((error) => {
        console.log(error);
      });
  });

  async function checkDisconnected () {
    const currentTime = new Date().getTime();

    const docRef = await db.collection("users");
    docRef.get().then((snapShot) => {
      snapShot.forEach((doc) => {
        if (doc.data().lastTime !== undefined && doc.data().lastTime !== null) {
            const timeDelay = currentTime - doc.data().lastTime;
            if (timeDelay > 10000) {
              console.log(
                doc.data().socketID,
                timeDelay,
                " disconnected"
              );
              db.collection("users").doc(doc.id).delete().then(()=>{
                console.log("UserData removed from db");
              })
            }
        } else {
          console.log("socketId:", doc.data().socketID, "Timedelay: Not available");
        }
      });
    });
  }

  //store in DataBase

  socket.on("userData", (user, id, value, room) => {
    console.log(user, id, value);
    Datas.add({
      user,
      loc: id,
      socketID: socket.id,
      value,
      room,
    })
      .then((docRef) => {
        console.log("data added");
      })
      .catch((error) => {
        console.log(error);
      });
  });

  socket.on("checkwin", (room) => {
    io.to(room).emit("userwon");
  });

  setInterval(checkDisconnected, 5000);
});
