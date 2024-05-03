const socket = io(window.location.origin);
let submit = document.getElementById("submit");
let submit2 = document.getElementsByClassName("btn2");
let loader = document.querySelector(".loader");
let locval = "";

socket.on("sendUsers", (room, loc) => {
  socket.emit("forwardUsers", room, loc,socket.id);
});

socket.on("showLoader",()=>{
  //show loader
  console.log("show loader");
  loader.style.display = 'flex';

  setInterval(() => {
    socket.emit("heartbeat", socket.id);
    console.log(socket.id);
  }, 5000);
})

socket.on("redirect",(creatorURL)=>{
  console.log(creatorURL)
  window.location.href = creatorURL;
})

submit.addEventListener("click", (e) => {
  e.preventDefault();

  const name1 = document.getElementById("user").value;
  const room = document.getElementById("room").value;

  let locate = `./tic-tac.html?user=${name1}&room=${room}&id=${socket.id}`;
  socket.emit("userCreated", locate, room, name1);
});