
const socket = io(window.location.origin);
let submit2 = document.getElementsByClassName("btn2");
let locval = "";

socket.on("sendUsers", (room, loc) => {
    socket.emit("forwardUsers", room, loc,socket.id);
  });  

socket.on("redirect", (creatorURL) => {
  console.log(locval);
  window.location.href = locval;
});

submit2[0].addEventListener("click", (e) => {
    e.preventDefault();
    const name1 = document.getElementById("user").value;
    const room = document.getElementById("room").value;
  
    let locate = `./tic-tac.html?user=${name1}&room=${room}&id=${socket.id}`;
    locval = locate;
    socket.emit("userJoined", locate, room, name1);

    setInterval(() => {
        socket.emit("heartbeat", socket.id);
        console.log(socket.id);
      }, 5000);
  });


