const express = require('express');
const applyRouter = express.Router();
const mysql = require('mysql');
const uuidv1 = require('uuid/v1');
const socket = require('./socket');
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "_test6",
})
applyRouter.get('/get', (req, res) => {

    // 已测
    const selectStr1 = 'select account from user where token=?'
    db.query(selectStr1, [req.query.token], (err, results) => {
        if (err) {
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            // console.log(results);
                let account = results[0].account
                // console.log(account);
                const selectStr = 'select sendID,isSuccess,getID,id from apply where getID=? or sendID=? order by time desc'
                db.query(selectStr, [account, account], (err, results) => {
                    if (err) {
                        res.send({
                            data: 200,
                            message: '发送失败',
                            state: 'fail'
                        })
                    }

                    else {
                        let app = []
                        for (let i = 0; i < results.length; i++) {
                            let u = {}
                            if (results[i].sendID == account) {
                                u.isMe = true
                            }
                            else u.isMe = false
                            u.isSuccess = results[i].isSuccess
                            u.id = results[i].id
                            u.sendID = results[i].sendID
                            u.getID = results[i].getID

                            app.push(u)
                        }
                        res.send({
                            data: 200,
                            message: '发送成功',
                            state: 'success',
                            applyList: app
                        })
                    }
                })
            
            
        }
    })



})
applyRouter.post('/send', (req, res) => {
    // 已测
    const selectStr123 = 'Select account from user where token=?';
    db.query(selectStr123, [req.query.token], (err123, res123) => {
        if (err123) {
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            let acc = res123[0].account
            if (acc == req.query.hisaccount) {
                res.send({
                    data: 200,
                    message: '用户不能添加自己',
                    state: 'fail'

                });
                return;
            }
            const selectStrZ = 'Select * from user where account=?';
            db.query(selectStrZ, [req.query.hisaccount], (errz, resz) => {
                if (errz || resz.length == 0) {
                    res.send({
                        data: 200,
                        message: '失败,不存在该用户',
                        state: 'fail'
                    })
                }
                else {
                    let acc = res123[0].account
                    let strUUID = uuidv1();
                    let time = new Date().getTime();
                    const insertStr = 'insert into apply(sendID,getID,id,time) values (?,?,?,?)'
                    db.query(insertStr, [acc, req.query.hisaccount, strUUID, time], (err, results) => {
                        if (err) {
                            res.send({
                                data: 200,
                                message: '发送失败',
                                state: 'fail'
                            })
                        }
                        else {
                            socket.apply(req.query.hisaccount)
                            res.send({
                                data: 200,
                                message: '发送成功',
                                state: 'success'

                            });
                        }
                    })




                }
            })






        }
    })



})

applyRouter.post('/allow', (req, res) => {


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
            const updateStr = 'UPDATE apply SET isSuccess = ? WHERE id = ?'
            db.query(updateStr, [req.query.allow, req.query.id], (err, results) => {
                if (err) {
                    console.log(err);
                    res.send({
                        data: 200,
                        message: '发送失败',
                        state: 'fail'
                    })
                }
                else {
                    if (req.query.allow == -1) {
                        socket.apply(req.query.account2)
                        res.send({
                            data: 200,
                            message: '发送成功',
                            state: 'success'

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
                                        socket.apply(req.query.account2)
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
                }
            })




        }
    })




})


applyRouter.post('/hasBeFriend', (req, res) => {

    // 无需测
    const selectStr123 = 'Select account from user where token=?';



    const updateStr = 'UPDATE apply SET isSuccess = ? WHERE id = ?'
    db.query(updateStr, [req.query.allow, req.query.id], (err, results) => {
        if (err) {
            console.log(err);
            res.send({
                data: 200,
                message: '发送失败',
                state: 'fail'
            })
        }
        else {
            
            socket.apply(req.query.account2)
            res.send({
                data: 200,
                message: '发送成功',
                state: 'success'

            });

        }
    })

})


module.exports = applyRouter

