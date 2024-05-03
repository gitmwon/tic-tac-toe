console.log("Welcome to TicTacToe");

const socket = io(window.location.origin);

// import socket from "./index.js";

const params = window.location.search;
const room = new URLSearchParams(params).get("room");
const user = new URLSearchParams(params).get("user");
const uid = new URLSearchParams(params).get("id");

let flag = false;

socket.emit("joinroom", user, room);

let box = document.getElementsByClassName("box");
let gameover = false;
let reset = document.getElementById("reset");
let click = new Audio("click.mp3");
let turn = "";

socket.on("initialval", (val) => {
  turn = val;
});

socket.on("turn", (e) => {
  turn = e;
});

//initial data fetch and allocation from dataBase
socket.on("fetchData", (data) => {
  data.forEach((e) => {
    if (e.room == room) {
      document.getElementById(e.loc).innerText = e.value;
    }
  });
});

//win logic
let checkwin = () => {
  let boxtext = document.getElementsByClassName("boxtext");
  let wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  wins.forEach((element) => {
    if (
      boxtext[element[0]].innerText === boxtext[element[1]].innerText &&
      boxtext[element[1]].innerText === boxtext[element[2]].innerText &&
      boxtext[element[0]].innerText !== ""
    ) {
      document.getElementsByClassName("info")[0].innerText =
        boxtext[element[0]].innerText + " won";
      gameover = true;
      flag = true;

      boxtext[element[0]].parentNode.style.backgroundColor = "rgb(217, 180, 252)";
      boxtext[element[1]].parentNode.style.backgroundColor = "rgb(217, 180, 252)";
      boxtext[element[2]].parentNode.style.backgroundColor = "rgb(217, 180, 252)";
    }
  });
};

socket.on("userwon", () => {
  checkwin();
});

//listen for clicks from server

socket.on("locdata", (user, loc, val) => {
  console.log(user, loc, val);

  let boxn = document.getElementsByClassName(loc);
  let textval = boxn[0].getElementsByClassName("boxtext");
  textval[0].innerHTML = val;
});

//lockboard logic

socket.on("return", () => {
  flag = true;
  console.log(flag);
});

socket.on("reverse", () => {
  flag = false;
  console.log(flag);
});

//sending heartbeat to server
setInterval(() => {
  socket.emit("heartbeat", uid);
  console.log(socket.id);
}, 5000);

//click logic
Array.from(box).forEach((element) => {
  element.addEventListener("click", () => {
    if (!flag) {
      console.log("locked socket");
      socket.emit("getid", room);
      let boxtext = element.querySelector(".boxtext");
      if (boxtext.innerText === "") {
        boxtext.innerText = turn;
        const params = window.location.search;
        const room = new URLSearchParams(params).get("room");
        const user = new URLSearchParams(params).get("user");
        socket.emit("locval", user, room, element.classList[1], turn);
        socket.emit("getTurn", room);
        socket.emit("userData", user, boxtext.id, turn, room);
        socket.emit("checkwin", room);
        if (!gameover) {
          document.getElementsByClassName("info")[0].innerText =
            "Turn for " + turn;
        }
      }
    }
  });
});

//reset
reset.addEventListener("click", () => {
  socket.emit("clearData");
  let boxtext = document.querySelectorAll(".boxtext");
  Array.from(boxtext).forEach((element) => {
    element.innerText = "";
    gameover = false;
    flag = false;
    boxtext.forEach((e)=>{
      e.parentNode.style.backgroundColor = "";
    })
    document.getElementsByClassName("info")[0].innerText = "Turn for " + turn;
  });
});
