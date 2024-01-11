const express = require('express')
const app = express()
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
}));

const cors = require('cors')
app.use(cors())
const UserRouter = require('./user')
const messgeRouter = require('./message')
const applyRouter=require('./apply')
const socket=require('./socket')
app.listen(80, () => {
})
app.use('/user', UserRouter)
app.use('/message', messgeRouter)
app.use('/apply', applyRouter)
app.use('/socket', socket.socketRouter)
