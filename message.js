const express = require('express');
const messgeRouter = express.Router();
const mysql = require('mysql');
const uuidv1 = require('uuid/v1');

const socket = require('./socket');
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "_test6",
})
// 均已测
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
messgeRouter.get('/get', (req, res) => {


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
            const selectStr = 'select lastTime,ign from friend where myID=? and friID=?'
            
            db.query(selectStr, [acc, req.query.hisaccount], (err, res1) => {
                if(res1.length==0){
                    res.send({
                        data: 200,
                        message: '失败',
                        state: 'fail'
                    })
                    return;
                }
                if (err) {
                    res.send({
                        data: 200,
                        message: '发送失败',
                        state: 'fail'
                    })
                }
                else {
                    let lt = res1[0].lastTime;
                    const selectStr = 'select message,time,sendID,isImg,base64,isRead from message where ((message.sendID=? and message.getID=?)or(message.sendID=? and message.getID=?)) order by time'
                    db.query(selectStr, [acc, req.query.hisaccount, req.query.hisaccount, acc], (err2, results) => {
                        if (err2) {
                            console.log(err2);
                            res.send({
                                data: 200,
                                message: '发送失败',
                                state: 'fail'
                            })
                        }
                        else {

                            // console.log(results[279]);


                            let msgList = []
                            for (let i = 0; i < results.length; i++) {
                                let msg = results[i].message
                                let time = formatDateTime(results[i].time)

                                let ig = res1[0].ign
                                isMe = false
                                if (acc == results[i].sendID) {
                                    isMe = true
                                }
                                else {
                                    isMe = false
                                }
                                // console.log(ig);
                                // console.log(lt,results[i].time);
                                if (ig == 0) {

                                    msgList.push({
                                        message: msg,
                                        time: time,
                                        isMe: isMe,
                                        isImg: results[i].isImg,
                                        base64: results[i].base64,
                                        isRead: results[i].isRead,
                                    });
                                }
                                else {
                                    if (lt >= results[i].time) {
                                        msgList.push({
                                            message: msg,
                                            time: time,
                                            isMe: isMe,
                                            isImg: results[i].isImg,
                                            base64: results[i].base64,
                                            isRead: results[i].isRead,
                                        });
                                    }
                                }
                            }
                            res.send({
                                data: 200,
                                message: '发送成功',
                                state: 'success',
                                message: msgList

                            });
                        }
                    })
                }
            })





        }
    })





})
messgeRouter.post('/send', (req, res) => {

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
            let date = new Date().getTime();
            let strUUID = uuidv1();
            let msg = req.query.message;

            const selectIllegal = 'select * from illegal'
            db.query(selectIllegal, (errI, resI) => {

                if (errI) {
                    console.log(err);
                    res.send({
                        data: 200,
                        message: '发送失败',
                        state: 'fail'
                    })
                }
                else {
                    let ill = JSON.parse(JSON.stringify(resI));
                    // console.log(ill[0].word);

                    for (let i = 0; i < ill.length; i++) {
                        if (msg.indexOf(ill[i].word) != -1) {
                            msg = msg.replace(ill[i].word, '***')

                        }

                    }

                    const insertStr = 'insert into message(sendID,getID,message,time,msgID) values (?,?,?,?,?)'
                    db.query(insertStr, [acc, req.query.hisaccount, msg, date, strUUID], (err, results) => {
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
                            // console.log(selectStr);
                            // req.query.hisaccount
                            // req.query.myaccount
                            db.query(selectStr, [req.query.hisaccount, acc], (err2, results2) => {
                                let ign = results2[0].ign
                                if (ign == 0) {
                                    
                                    const updateStr = 'update friend set lastTime=? where (myID=? and friID=?) or (myID=? and friID=?)'
                                    db.query(updateStr, [date, acc, req.query.hisaccount, req.query.hisaccount, acc], (err3, results3) => {
                                        if (err3) {
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
                                    db.query(updateStr, [date, acc, req.query.hisaccount, req.query.hisaccount, acc], (err3, results3) => {
                                        if (err3) {
                                            console.log(err3);
                                            res.send({
                                                data: 200,
                                                message: '发送失败',
                                                state: 'fail'
                                            })
                                        }
                                        else {
                                            // socket.sendMessage(acc,req.query.hisaccount)
                                            res.send({
                                                data: 200,
                                                message: '发送成功',
                                                state: 'success'

                                            });

                                            
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
messgeRouter.post('/sendImg', function (req, res, next) {

    console.log(req.body);
    console.log(req.params);

    const img=req.body.img
    const token=req.body.token
    const hisaccount=req.body.hisaccount


    // 已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [token], (err123, res123) => {
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


            let date = new Date().getTime();
            let isImg = 1;
            let strUUID = uuidv1();
            const insertStr = 'insert into message(sendID,getID,base64,time,msgID,isImg) values (?,?,?,?,?,?)'
            db.query(insertStr, [acc, hisaccount, img, date, strUUID, isImg], (err, results) => {
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
                    db.query(selectStr, [hisaccount, acc], (err2, results2) => {
                        let ign = results2[0].ign
                        if (ign == 0) {
                            const updateStr = 'update friend set lastTime=? where (myID=? and friID=?) or (myID=? and friID=?)'
                            db.query(updateStr, [date, acc, hisaccount, hisaccount, acc], (err3, results3) => {
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
                        else {
                            const updateStr = 'update friend set lastTime=? where (myID=? and friID=?)'
                            db.query(updateStr, [date, acc, hisaccount], (err3, results3) => {
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


                    })
                }
            })




        }
    })




})
messgeRouter.post('/read', function (req, res, next) {


    // console.log('/read');
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
            // console.log('/read-update');
            let acc = res123[0].account
            // console.log(acc,req.query.hisaccount);
            const updateStr = 'UPDATE message SET isRead = 1 WHERE getID = ? and sendID=?'
            db.query(updateStr, [acc, req.query.hisaccount], (err, results) => {
                // console.log(updateStr);
                if (err) {
                    console.log(err);
                    res.send({
                        data: 200,
                        message: '发送失败',
                        state: 'fail'
                    })
                }

                else {
                    // console.log(acc,'读过',req.query.hisaccount,"的消息");
                    socket.readMessage(acc,req.query.hisaccount)
                    res.send({
                        data: 200,
                        message: '发送成功',
                        state: 'success'
                    });
                }
            })




        }
    })







})

messgeRouter.post('/setClose', function (req, res, next) {


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
            const updateStr = 'UPDATE friend SET close = ? WHERE (myID = ? and friID=?) or (myID = ? and friID=?)'
            db.query(updateStr, [req.query.close, acc, req.query.hisaccount, req.query.hisaccount, acc], (err, results) => {
                if (err) {
                    console.log(err);
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
                }
            })




        }
    })






})


messgeRouter.get('/word', function (req, res, next) {

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
               const selectStr = 'select message from message where ((sendID=? and getID=?) or (sendID=? and getID=?)) and isImg=0 order by time desc'
    db.query(selectStr, [acc, req.query.hisaccount, req.query.hisaccount, acc], (err, results) => {
        if (err) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            // 对数据进行处理
            let r = JSON.parse(JSON.stringify(results))
            let word = []
            for (let i = 0; i < r.length; i++) {
                if (i == 0) {
                    let item = {}
                    item.name = r[i].message
                    item.value = 1;
                    word.push(item);
                    continue;
                }

                for (let j = 0; j < word.length; j++) {
                    if (word[j].name == r[i].message) {
                        word[j].value++;
                        break;
                    }
                    if (j == word.length - 1) {

                        let item = {}
                        item.name = r[i].message
                        item.value = 1;
                        word.push(item);
                        break;

                    }
                }

            }
            word.sort(function (a, b) {
                return b.value - a.value
            })
            let wordCloud = []
            for (let i = 0; i < 30; i++) {
                if (i == word.length) break;
                if(word[i]&&word[i].name.indexOf("***")==-1)wordCloud.push(word[i])
                
            }
            // console.log(word);
            res.send({
                data: 200,
                message: '发送成功',
                state: 'success',
                word: wordCloud
            });
        }
    })




        }
    })





})



module.exports = messgeRouter

