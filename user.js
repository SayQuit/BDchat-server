const express = require('express');
const UserApp = express();
var request = require('request');
const UserRouter = express.Router();
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const ejwt = require('express-jwt');


const secret = "agksgfakgfkasghfksa";
const uuidv1 = require('uuid/v1');
const socket  = require('./socket');
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "_test6",
})

function selectFrom(minValue, maxValue) {

    var choices = maxValue - minValue;
    return Math.floor(Math.random() * choices + minValue);
}

function formatDateTime(item_date) {
    let date = new Date(parseInt(item_date));
    let YY = date.getFullYear() + "-";
    let MM =
        (date.getMonth() + 1 < 10
            ? "0" + (date.getMonth() + 1)
            : date.getMonth() + 1) + "-";
    let DD = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    let hh =
        (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) + ":";
    let mm =
        (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) +
        ":";
    let ss =
        date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return YY + MM + DD + " " + hh + mm + ss;
};

UserRouter.post('/logout', (req, res) => {



    const selectStr = 'select * from user where token = "' + req.query.token + '";';
    db.query(selectStr, (err, results) => {
        if (err) {
            res.send({
                data: 200,
                message: 'error',
                isLogin: 0

            });
        }
        else {
            let account = results[0].account
            logout(account)
            res.send({
                data: 200,
                message: '退出成功',
            })
        }
    })




})

UserRouter.post('/login', (req, res) => {
    // 无需修改
    const selectStr = 'select * from user where account = "' + req.query.account + '";';

    let Token = jwt.sign({ account: req.query.account }, secret, {
        expiresIn: '24h'
    })

    db.query(selectStr, (err, results) => {
        if (err) console.log(err)
        else {

            if (results.length) {
                if (results[0].psw != req.query.psw) {
                    res.send({
                        data: 200,
                        message: '登录失败,密码错误',
                        isLogin: 0

                    });
                }
                else {
                    let updateStr = 'UPDATE user SET Token=? WHERE account="' + req.query.account + '";';
                    db.query(updateStr, [Token], (err2, results2) => {
                        if (err2) console.log(err2)
                        else {

                            // socket.login(req.query.account)

                            res.send({
                                data: 200,
                                message: '登录成功',
                                isLogin: 1,
                                name: results[0].name,
                                avatar: results[0].avatar,

                                token: Token,
                                account: req.query.account

                            });
                        }
                    })

                }
            }
            else {
                // console.log(results);
                res.send({
                    data: 200,
                    message: '登录失败,不存在该账号',
                    isLogin: 0

                });
            }

        }
    })

})
UserRouter.post('/tokenLogin', (req, res) => {





    // 无需修改
    const selectStr = 'select * from user where token = "' + req.query.token + '";';
    db.query(selectStr, (err, results) => {
        if (err) {
            res.send({
                data: 200,
                message: 'error',
                isLogin: 0

            });
        }
        else {

            jwt.verify(req.query.token, secret, (error, result) => {
                // console.log(results[0].account);
                if (error) {
                    res.send({
                        data: 200,
                        message: 'overdue',
                        isLogin: 0

                    });
                } else {
                    if (results.length) {
                        // socket.login(req.query.account)
                        res.send({
                            data: 200,
                            message: 'success',
                            name: results[0].name,
                            avatar: results[0].avatar,
                            token: req.query.token,
                            account: results[0].account
                        })
                    }
                    else {
                        // console.log(results);
                        res.send({
                            data: 200,
                            message: 'no user',
                            isLogin: 0

                        });
                    }
                }
            })



        }
    })

})
UserRouter.post('/register', (req, res) => {

    // 无需修改
    const account = selectFrom(10000, 99999999999);

    const insertStr = 'insert into user(account,name,psw) values (?,?,?)'
    db.query(insertStr, [account, req.query.name, req.query.psw], (err, results) => {
        if (err) {
            console.log(err);
            res.send({
                data: 200,
                message: '注册失败，请重新注册',
            })
        }
        else {
            // console.log('成功');
            res.send({
                data: 200,
                message: '注册成功',
                account: account,
                name: req.query.name

            });
        }
    })



})

UserRouter.post('/info', (req, res) => {

    // 已改已测

    const selectStr = 'select account,name,isLogin,signature,avatar,moodindex from user where token = "' + req.query.token + '";';
    // console.log(selectStr);
    db.query(selectStr, (err, results) => {
        if (err) {
            res.send({
                data: 200,
                message: '失败',

            });
            console.log(err);
        }
        else {
            if (results.length != 0) {

                const u = {
                    account: results[0].account,
                    name: results[0].name,
                    signature: results[0].signature,
                    avatar: results[0].avatar,
                    moodindex: results[0].moodindex
                }
                res.send({
                    data: 200,
                    message: '成功',
                    user: u

                });
            }
            else {
                res.send({
                    data: 200,
                    message: '用户未登录',

                });
            }
        }
    })


})

UserRouter.post('/add', (req, res) => {

    // 已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            if (acc == req.query.account2) {
                res.send({
                    data: 200,
                    message: '用户不能添加自己',
                    state: 'fail'

                });
                return;
            }
            const selectStr = 'select account from user where account = "' + acc + '";';
            db.query(selectStr, (err, results) => {
                if (err || results.length == 0) {
                    console.log(err);
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'

                    });
                }
                else {
                    const selectStr2 = 'select account from user where account = "' + req.query.account2 + '";';
                    db.query(selectStr2, (err2, results2) => {
                        if (err2 || results2.length == 0) {
                            console.log(err2);
                            res.send({
                                data: 200,
                                message: '失败',
                                state: 'fail'

                            });
                        }
                        else {

                            let time = new Date().getTime();
                            const insertStr = 'insert into friend(myID,friID,lastTime) values (?,?,?)';
                            db.query(insertStr, [acc, req.query.account2, time], (err3, results3) => {
                                if (err3) {
                                    console.log(err3);
                                    res.send({
                                        data: 200,
                                        message: '失败',
                                        state: 'fail'

                                    });
                                }
                                else {



                                    const insertStr2 = 'insert into friend(myID,friID,lastTime) values (?,?,?)';
                                    db.query(insertStr2, [req.query.account2, acc, time], (err4, results4) => {
                                        if (err4) {
                                            console.log(err4);
                                            res.send({
                                                data: 200,
                                                message: '失败',
                                                state: 'fail'

                                            });
                                        }
                                        else {
                                            res.send({
                                                data: 200,
                                                message: '成功',
                                                state: 'success'

                                            });
                                        }
                                    })

                                }
                            })
                        }
                    })

                }
            })






        }
    })

    // 未改未测







})

UserRouter.get('/friend', (req, res) => {

    // 已测
    let friendList = [];
    const selectStr = 'Select account,name,signature,avatar,ign,lastTime,close,moodindex from user,friend where friID=account and myID in(select account from user where token =?) order by lastTime desc';
    db.query(selectStr, [req.query.token], (err, results) => {
        // console.log(results);
        const selectStr123 = 'Select account from user where token=?';
        db.query(selectStr123, [req.query.token], (err123, res123) => {
            if (err123) {
                console.log(err);
                res.send({
                    data: 200,
                    message: '发送失败',
                    state: 'fail'
                })
            }
            else {
                let acc = res123[0].account
                const selectStr2 = 'select message,time,isImg,sendID,getID,isRead,time from message where (message.sendID=?)or(message.getID=?) order by time'
                db.query(selectStr2, [acc, acc], (err2, results2) => {
                    if (err2) {
                        console.log(err);
                        res.send({
                            data: 200,
                            message: '发送失败',
                            state: 'fail'
                        })
                    }
                    else {

                        for (let i = 0; i < results.length; i++) {
                            friendList.push(results[i]);
                            friendList[i].lastMsg = '';
                            friendList[i].isRead = 1;
                            friendList[i].isMe = false;
                            friendList[i].isImg = 0;
                            friendList[i].time = '';
                            // friendList[i].signature=''

                            for (let j = 0; j < results2.length; j++) {


                                if (friendList[i].account == results2[j].sendID) {



                                    if (friendList[i].ign == 0) {
                                        friendList[i].isMe = false;
                                        friendList[i].lastMsg = results2[j].message;
                                        friendList[i].isRead = results2[j].isRead;
                                        friendList[i].isImg = results2[j].isImg;
                                        friendList[i].time = formatDateTime(results2[j].time);
                                    }
                                    else if (friendList[i].ign == 1 && friendList[i].lastTime >= results2[j].time) {
                                        friendList[i].isMe = false;
                                        friendList[i].lastMsg = results2[j].message;
                                        friendList[i].isRead = results2[j].isRead;
                                        friendList[i].isImg = results2[j].isImg;
                                        friendList[i].time = formatDateTime(results2[j].time);
                                    }
                                }

                                else if (friendList[i].account == results2[j].getID) {
                                    friendList[i].isMe = true;
                                    friendList[i].lastMsg = results2[j].message;
                                    friendList[i].isRead = 1;
                                    friendList[i].isImg = results2[j].isImg;
                                    friendList[i].time = formatDateTime(results2[j].time);
                                }
                            }

                        }
                        // console.log(friendList[results.length - 1]);
                        res.send({
                            data: 200,
                            message: '成功',
                            friendList: friendList
                        })


                    }
                })
            }
        })






    })


})


UserRouter.post('/name', (req, res) => {


    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const updateStr = 'UPDATE user SET name=? WHERE account=?';
            db.query(updateStr, [req.query.name, acc], (err, results) => {

                // console.log(results);
                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {
                    socket.friend(acc)
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success'
                    })
                }

            })




        }
    })



})

UserRouter.post('/signature', (req, res) => {


    // 已改已测

    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account

            const updateStr = 'UPDATE user SET signature=? WHERE account=?';
            db.query(updateStr, [req.query.signature, acc], (err, results) => {

                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {
                    socket.friend(acc)
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success'
                    })
                }

            })



        }
    })


})
UserRouter.post('/avatar', (req, res) => {
    const avatar=req.body.avatar
    const token=req.body.token

    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, token, (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account

            const updateStr = 'UPDATE user SET avatar=? WHERE account=?';
            db.query(updateStr, [avatar, acc], (err, results) => {

                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {
                    socket.friend(acc)
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                        avatar: req.query.avatar
                    })
                }

            })



        }
    })


})

UserRouter.post('/ignore', (req, res) => {

    // 已改未测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const updateStr = 'UPDATE friend SET ign=? WHERE myID=? and friID=?';
            db.query(updateStr, [req.query.ignore, acc, req.query.hisaccount], (err, results) => {

                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {




                    const mytime = new Date().getTime();
                    const updateStr2 = 'UPDATE friend SET lastTime=? WHERE myID=? and friID=?';
                    db.query(updateStr2, [mytime, acc, req.query.hisaccount], (err2, results2) => {

                        if (err) {
                            res.send({
                                data: 200,
                                message: '失败',
                                state: 'fail'
                            })
                        }
                        else {
                            res.send({
                                data: 200,
                                message: '成功',
                                state: 'success'
                            })
                        }

                    })

                }

            })




        }
    })


})

UserRouter.post('/delete', (req, res) => {

    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const deleteStr = 'delete from friend where  (myID=? and friID=?) or  (myID=? and friID=?)';
            db.query(deleteStr, [acc, req.query.hisaccount, req.query.hisaccount, acc], (err, results) => {

                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                    })
                }

            })




        }
    })

})

UserRouter.post('/mood', (req, res) => {

    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const updateStr = 'UPDATE user SET moodindex=? WHERE account = ?';
            db.query(updateStr, [req.query.index, acc], (err, results) => {

                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {
                    socket.friend(acc)
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                    })
                }

            })




        }
    })


})

UserRouter.post('/emotionSend', (req, res) => {


    // console.log(req.query);

    // 已改已测

    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query[0]], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account

            let time = new Date().getTime();
            let strUUID = uuidv1();
            const insertStr = 'insert into emotion(account,emotionBase64,id,lastTime) values (?,?,?,?)'
            db.query(insertStr, [acc, req.query[1], strUUID, time], (err, results) => {

                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                }
                else {
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                    })
                }

            })



        }
    })


})

UserRouter.get('/emotionGet', (req, res) => {

    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const selectStr = 'select id,emotionBase64 from emotion where account = "' + acc + '";';
            db.query(selectStr, (err, results) => {
                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'

                    });
                    console.log(err);
                }
                else {

                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                        emotionList: results

                    });
                }
            })




        }
    })


})

















UserRouter.post('/emotionSendMessage', (req, res) => {



    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const emotionselectStr = 'select emotionBase64 from emotion where id = "' + req.query.id + '";';
            db.query(emotionselectStr, (err, emotionresults) => {
                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'

                    });
                    console.log(err);
                }
                else {


                    let date = new Date().getTime();
                    let isImg = 1;
                    let strUUID = uuidv1();
                    // console.log(req.query);
                    const insertStr = 'insert into message(sendID,getID,base64,time,msgID,isImg) values (?,?,?,?,?,?)'
                    db.query(insertStr, [acc, req.query.hisaccount, emotionresults[0].emotionBase64, date, strUUID, isImg], (err, results) => {
                        if (err) {
                            console.log(err);
                            res.send({
                                data: 200,
                                message: '发送失败',
                                state: 'fail'
                            })
                        }
                        else {
                            const selectStr = 'select * from friend where myID=? and friID= ?'
                            db.query(selectStr, [req.query.hisaccount, acc], (err2, results2) => {
                                let ign = results2[0].ign
                                if (ign == 0) {
                                    const updateStr = 'update friend set lastTime=? where (myID=? and friID=?) or (myID=? and friID=?)'
                                    db.query(updateStr, [date, acc, req.query.hisaccount, req.query.hisaccount, acc], (err3, results3) => {
                                        if (err3) {
                                            
                                            socket.sendMessage(acc,req.query.hisaccount)
                                            console.log(err3);
                                            res.send({
                                                data: 200,
                                                message: '发送失败',
                                                state: 'fail'
                                            })
                                        }
                                        else {
                                            socket.sendMessage(acc,req.query.hisaccount)
                                            res.send({
                                                data: 200,
                                                message: '发送成功',
                                                state: 'success'

                                            });

                                            ;
                                        }
                                    })
                                }
                                else {
                                    const updateStr = 'update friend set lastTime=? where (myID=? and friID=?)'
                                    db.query(updateStr, [date, acc, req.query.hisaccount], (err3, results3) => {
                                        if (err3) {
                                            console.log(err3);
                                            res.send({
                                                data: 200,
                                                message: '发送失败',
                                                state: 'fail'
                                            })
                                        }
                                        else {
                                            res.send({
                                                data: 200,
                                                message: '发送成功',
                                                state: 'success'

                                            });

                                            ;
                                        }
                                    })
                                }




                                // console.log('成功');
                            })
                        }
                    })




                }
            })




        }
    })





})
UserRouter.post('/font', (req, res) => {


    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {

            let acc = res123[0].account
            // console.log(acc);
            const updateStr = 'UPDATE font SET fontSize = ?,fontWeight=?,textDecoration=?,color=?,fontStyle=?,fontFamily=? WHERE account = ?'
            db.query(updateStr, [

                req.query.fontSize,
                req.query.fontWeight,
                req.query.textDecoration,
                req.query.color,
                req.query.fontStyle,
                req.query.fontFamily,
                acc],
                (err, results) => {
                    if (err) {
                        res.send({
                            data: 200,
                            message: '失败',
                            state: 'fail'

                        });
                        console.log(err);
                    }
                    else {
                        //
                        socket.changeFont(acc)
                        res.send({
                            data: 200,
                            message: '成功',
                            state: 'success',
                            font: results[0]
                        });

                    }
                })




        }
    })



})
UserRouter.get('/font', (req, res) => {

    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err123);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const selectStr = 'select fontSize,fontWeight,textDecoration,color,fontStyle,fontFamily from font where account = "' + acc + '";';
            db.query(selectStr, (err, results) => {
                if (err) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    });
                    console.log(err);
                }
                else {

                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                        font: results[0]

                    });

                }
            })




        }
    })


})
UserRouter.get('/friFont', (req, res) => {

    // 已改已测
    const selectStr = 'select fontSize,fontWeight,textDecoration,color,fontStyle,fontFamily from font where account = "' + req.query.account + '";';
    db.query(selectStr, (err, results) => {
        if (err) {
            res.send({
                data: 200,
                message: '失败',
                state: 'fail'
            });
            console.log(err);
        }
        else {

            res.send({
                data: 200,
                message: '成功',
                state: 'success',
                font: results[0]

            });

        }
    })






})
UserRouter.post('/newfont', (req, res) => {

    // 无需修改
    const insertStr = 'insert into font(account) values (?)'
    db.query(insertStr, [req.query.account], (err, results) => {
        if (err) {
            res.send({
                data: 200,
                message: '失败',
                state: 'fail'

            });
            console.log(err);
        }
        else {

            res.send({
                data: 200,
                message: '成功',
                state: 'success',

            });

        }
    })
})

UserRouter.post('/color', (req, res) => {


    // 已改已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const updateStr = 'UPDATE font SET color=? WHERE account = ?'
            db.query(updateStr, [


                req.query.color,
                acc],
                (err, results) => {
                    if (err) {
                        res.send({
                            data: 200,
                            message: '失败',
                            state: 'fail'

                        });
                        console.log(err);
                    }
                    else {

                        socket.changeFont(acc)
                        res.send({
                            data: 200,
                            message: '成功',
                            state: 'success',

                        });

                    }
                })




        }
    })



})

UserRouter.post('/changePsw', (req, res) => {


    // 无需修改
    const selectStr = 'select psw from user where account=?'
    db.query(selectStr, [req.query.account], (selecterr, res1) => {
        if (res1[0].psw == req.query.oldpsw) {
            const updateStr = 'UPDATE user SET psw=? WHERE account = ?'
            db.query(updateStr, [req.query.newpsw, req.query.account],
                (err, results) => {
                    if (err) {
                        res.send({
                            data: 200,
                            message: '失败',
                            state: 'fail'

                        });
                        console.log(err);
                    }
                    else {
                        // console.log('12345');
                        res.send({
                            data: 200,
                            message: '成功',
                            state: 'success',

                        });

                    }
                })
        }
        else {


            // console.log('123455677');
            res.send({
                data: 200,
                message: '密码错误',
                state: 'fail'

            });

        }

    })



})



UserRouter.post('/closeRank', (req, res) => {

    // 已改已测

    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            const selectStr = 'select friID,close,name,avatar from friend,user where myID=? and friID=account order by close desc'
            db.query(selectStr, [acc], (selectErr, results) => {
                if (selectErr) {
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'

                    });

                }
                else {
                    // console.log(results);
                    res.send({
                        data: 200,
                        message: '成功',
                        state: 'success',
                        closeRank: results

                    });
                }

            })





        }
    })


})
module.exports = UserRouter

