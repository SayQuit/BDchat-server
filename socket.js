const express = require('express')
const socketRouter = express.Router();
const app = express()
const mysql = require('mysql')
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "_test6",
})


let port = 3000

const server = app.listen(port, () => {
  console.log('成功启动socket服务,端口号是' + port)
})

let user = []
let k = 0;
const io = require('socket.io')(server);

io.on('connection', function (socket) {

  socket.on('disconnect', function () {
    let account = socket.account
    logout(account)
    socket.leave(account);
  });

  socket.on('join', function (token) {
    const selectStr = 'select * from user where token = "' + token + '";';
    db.query(selectStr, (err, results) => {
      if (err) {
        console.log('socket error');
      }
      else {
        let account = results[0].account
        login(account)
        socket.join(account);
        socket.account = account
      }
    })
  });


  socket.on('leave', function () {
    let account = socket.account
    logout(account)
    socket.leave(account);
  });

  // socket.on('read', function () {
  //   this.readMessage()
  // });


});



function login(account) {
  if (account) {
    user.push(account)
  }
}

function logout(account) {
  user.splice(user.indexOf(account), 1)
}

function isLogin(account) {
  for (let i = 0; i < user.length; i++) {
    if (user[i] == account) return true
  }
  return false
}



function sendMessage(myaccount,hisaccount) {
  if (isLogin(hisaccount)) {
    io.to(hisaccount).emit('message', myaccount);
  }
}

function changeFont(account) {
  let selectStr = `select * from friend where myID = ${account}`
  db.query(selectStr, (err, results) => {
    if (!err) {
      for (let i = 0; i < results.length; i++) {
        if (isLogin(results[i].friID)) {
          io.to(results[i].friID).emit('font', account);
        }
      }
    }
  })

}


function readMessage(myaccount,hisaccount) {
  if (isLogin(hisaccount)) {
    io.to(hisaccount).emit('readMessage', myaccount);
  }
}


function apply(account) {
  if (isLogin(account)) {
    io.to(account).emit('apply', 1);
  }
}


function friend(account) {
  let selectStr = `select * from friend where myID = ${account}`
  db.query(selectStr, (err, results) => {
    if (!err) {
      for (let i = 0; i < results.length; i++) {
        if (isLogin(results[i].friID)) {
          io.to(results[i].friID).emit('friend', account);
        }
      }
    }
  })
}




module.exports = { socketRouter, sendMessage, changeFont,readMessage,apply,friend }

