const socket = io(window.location.origin);

socket.on("redirect", (creatorURL) => {
  console.log("link: ",creatorURL);
  window.location.href = creatorURL;
});


