const firebase = require("firebase");

const firebaseConfig = {
    apiKey: "AIzaSyBGnMe1utxZzoxJV3B90p5xUUNlUnNfo0g",
    authDomain: "tic-tac-toe-90795.firebaseapp.com",
    projectId: "tic-tac-toe-90795",
    storageBucket: "tic-tac-toe-90795.appspot.com",
    messagingSenderId: "608844196125",
    appId: "1:608844196125:web:cf8c30f041d5733ed099f4",
    measurementId: "G-32D1Q9264L"
  };

  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  const User = db.collection("users");
  const Datas = db.collection("data");
  module.exports = {User,Datas,db};