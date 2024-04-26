const express = require("express");

const { Server } = require("socket.io");

const app = express();

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.redirect("/index.html");
});

const { User, Datas, db} = require("./config.js");
const { forEach } = require("lodash");

app.use(express.json());

const exserver = app.listen(8080,"0.0.0.0", () => {
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
    const querySnapshot = await db.collection('data').get();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const obj={
        "name":data.user,
        "loc":data.loc,
        "socketID":data.socketID,
        "value":data.value,
        "room":data.room,
      }
      ary.push(obj);
    });

    socket.emit("fetchData",ary);
    //console.log(ary);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

getData();

  socket.on("clearData",async()=>{
    const querySnapshot = await db.collection('data').get();
    querySnapshot.forEach((doc)=>{
      doc.ref.delete();
    })
  })

  socket.on("userCreated", async (loc, room, name) => {
    User.add({
      name: name,
      room: room,
      socketID:socket.id,
      urlVal: loc,
    })
      .then((docRef) => {
        console.log(`Added user ${name}`);
        socket.emit("sendUsers", room, loc);
        return User.doc(docRef.id).update({
          id: docRef.id,
        });
      })
      .catch((error) => {
        console.log(`error adding document: ${error}`);
      });
  });

  socket.on("forwardUsers", async (room, loc) => {
    const rooms = await User.where("room", "==", room).get();
    const [roomsSnapshot] = await Promise.all([rooms]);

    if (roomsSnapshot.size < 2) {
      socket.emit("initialRedirect", "/waiting.html");
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
          socketID:socket.id,
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

  //store in DataBase

  socket.on("userData", (user, id, value,room) => {
    console.log(user, id, value);
    Datas.add({
      user,
      loc: id,
      socketID:socket.id,
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

  socket.on("checkwin",(room)=>{
    io.to(room).emit("userwon");
  })

//   socket.on("disconnect",async ()=>{
//     const user = socket.id;
//     const dltuser = await User.where("socketID","==",user).get();
//     //const datas = await Datas.where("socketID","==",user).get();
//     try{
//       // const [dltuserSnapshot] = Promise.all([dltuser]);
//       // dltuserSnapshot.forEach((e)=>{
//       //   console.log(e.data().name);
//       // })
//       console.log("dltuser");
//     }catch(error){
//       console.log(error);
//     }
//   })

 });