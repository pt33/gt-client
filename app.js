const express = require('express')
const path = require('path')
const logger = require('morgan')
const compression = require('compression')
const CryptoJS = require('crypto-js')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const swig = require('swig')
const mongoose = require('mongoose')
const Promise = require('bluebird')
const user = require('./routes/user')
const index = require('./routes/index')
const news = require('./routes/news')
const name = require('./routes/name')
const share = require('./routes/share')
const family = require('./routes/family')
const data = require('./routes/data')
const question = require('./routes/question')
const reqLog = require('./models/reqLog')
const Cookies = require('cookies')
let app = express()

global.secretOrPrivateKey = 'gt-client'
global.uploadPath = '/Users/pt/Work/NodeJS/Business/Qingtime/Service/gt-service/public/upload'

app.engine('html', swig.renderFile)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')
swig.setDefaults({cache: false})

app.use(logger('dev'))
app.use(compression())

app.use(bodyParser.json({limit: '100mb'}))
app.use(bodyParser.urlencoded({
    limit: '100mb',
    extended: true,
}))

app.use(express['static'](global.uploadPath))
app.use(express['static'](path.join(__dirname, 'public')))

global.Promise = Promise
mongoose.Promise = Promise
mongoose.connect('mongodb://gt:admin@127.0.0.1/gt', {useMongoClient: true}, (error) => {
    if (error) {
        console.log('mongoDB连接失败')
    } else {
        console.error('mongoDB连接成功')
    }
})

app.use(async (req, res, next) => {
    let token = req.body.token || req.headers['x-access-token'] // 从body或query或者header中获取token
    let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    reqLog.create({
        ip: userIP,
        url: req.originalUrl,
    })
    let encrypted = ''
    if (!token) {
        req.cookies = new Cookies(req, res)
        token = req.cookies.get('token')
    }
    req.ip = userIP
    encrypted = token
    if (encrypted !== '' && encrypted !== undefined) {
        let bytes = CryptoJS.AES.decrypt(encrypted, '_SALT_G(T#*)')
        token = CryptoJS.enc.Utf8.stringify(bytes)
        await jwt.verify(token, global.secretOrPrivateKey, (err, decode) => {
            if (err) { //  时间失效的时候/ 伪造的token
                next()
            } else {
                req.token = token
                req.userId = decode.v
                req.aesToken = encrypted
                next()
            }
        })
    } else {
        next()
    }
})

app.use('/user', user)
app.use('/data', data)
app.use('/name', name)
app.use('/question', question)
app.use('/family', family)
app.use('/share', share)
app.use('/news', news)
app.use('/', index)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app
