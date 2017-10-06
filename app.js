let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
const compression = require('compression')
let CryptoJS = require("crypto-js")
let jwt = require("jsonwebtoken")
let bodyParser = require('body-parser')
let swig = require('swig')
let mongoose = require('mongoose')
let Promise = require('bluebird')
let index = require('./routes/index')
let user = require('./routes/user')
let admin = require('./routes/admin')
let name = require('./routes/name')
let role = require('./routes/role')
let log = require('./routes/log')
let share = require('./routes/share')
let family = require('./routes/family')
let data = require('./routes/data')
let template = require('./routes/template')
let client = require('./routes/client')
let question = require('./routes/question')
let reqLog = require('./models/reqLog')
let cookies = require('cookies')

let app = express()

// view engine setup
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'twig')
global.secretOrPrivateKey = 'gt-client'
// global.uploadPath = '/home/work/service/gt-service/upload'
global.uploadPath = '/Users/pt/Work/NodeJS/Business/Qingtime/Service/gt-service/public/upload'
// global.uploadPath = path.join(__dirname, 'public', 'upload')

app.engine('html', swig.renderFile)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')
swig.setDefaults({cache: false})

// twig.cache = false
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(compression())

app.use(bodyParser.json({limit: '100mb'}))
app.use(bodyParser.urlencoded({
    limit: '100mb',
    extended: true
}))
//app.use(cookieParser())
app.use(express.static(uploadPath))
app.use(express.static(path.join(__dirname, 'public')))

global.Promise = Promise
mongoose.Promise = Promise
mongoose.connect('mongodb://gt:admin@127.0.0.1/gt', {useMongoClient:true}, function (error) {
    if (error) {
        console.log('mongoDB连接失败')
    } else {
        console.error('mongoDB连接成功')
    }
})

app.use(async function (req, res, next) {

    let token = req.body.token || req.headers["x-access-token"] // 从body或query或者header中获取token
    let user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    reqLog.create({
        ip:user_ip,
        url:req.originalUrl
    })
    let encrypted = ''
    if (!token) {
        req.cookies = new cookies(req, res)
        token = req.cookies.get('token')
    }
    req.ip = user_ip
    encrypted = token
    if (encrypted !== '' && encrypted !== undefined) {
        let bytes  = CryptoJS.AES.decrypt(encrypted, '_SALT_G(T#*)')
        token = CryptoJS.enc.Utf8.stringify(bytes)
        await jwt.verify(token, secretOrPrivateKey, function (err, decode) {
            if (err) {  //  时间失效的时候/ 伪造的token
                res.write('<script language=\'javascript\'>window.location.href=\'/\'</script>')
                res.end()
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
app.use('/admin', admin)
app.use('/role', role)
app.use('/data', data)
app.use('/template', template)
app.use('/log', log)
app.use('/name', name)
app.use('/client', client)
app.use('/question',question)
app.use('/family',family)
app.use('/share',share)
app.use('/', index)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
