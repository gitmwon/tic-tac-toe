const socket = io(window.location.origin);

let submit = document.getElementsByClassName("btn");
let submit2 = document.getElementsByClassName("btn2");
let locval = "";

socket.on("sendUsers",(room,loc)=>{
    socket.emit("forwardUsers",room,loc)
})

socket.on("initialRedirect", (val) => {
    window.location.href = val;
  });  

socket.on("redirect",(creatorURL)=>{
    window.location.href = locval;
})

submit[0].addEventListener('click',(e)=>{

    e.preventDefault();

    const name1 = document.getElementById('user').value;
    const room = document.getElementById('room').value;

    let locate = `./tic-tac.html?user=${name1}&room=${room}`;
    socket.emit("userCreated",locate,room,name1);

})

submit2[0].addEventListener('click',(e)=>{

    e.preventDefault();
    const name1 = document.getElementById('user1').value;
    const room = document.getElementById('room1').value;

    let locate = `./tic-tac.html?user=${name1}&room=${room}`;
    locval = locate;
    socket.emit("userJoined",locate,room,name1);   
})

