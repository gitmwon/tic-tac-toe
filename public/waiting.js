const socket = io(window.location.origin);
const params = window.location.search;
const uid = new URLSearchParams(params).get("id");

socket.on("redirect", (creatorURL) => {
  console.log("link: ",creatorURL);
  window.location.href = creatorURL;
});

setInterval(() => {
  socket.emit("heartbeat", uid);
  console.log(socket.id);
}, 4000);


