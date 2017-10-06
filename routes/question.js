let express = require('express')
let router = express.Router()
let column  = require('../models/column')
let question = require('../models/question')
let tag = require('../models/tag')
let like = require('../models/like')
let collection = require('../models/collection')
let path = require('path')
let fs = require('fs')
let mongoose = require('mongoose')
let CryptoJS = require("crypto-js")
let swig = require('swig')
let databaseProxy = require('../util/databaseProxy')
let shareUrl = require("../models/shareUrl")
let share = require("../models/share")
const os = require('os')

router.get('/', async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        var navTitle = ''
        for(var i in data) {
            if(data[i].url === '/question') {
                navTitle = data[i].name
                break
            }
        }
        let tags = await databaseProxy.getTags()

        let normal = await databaseProxy.getQuestionList(
            1
            ,{isCommonly: 1}
            ,{createTime: 1}
            ,10
            ,false
            ,''
        )

        let hot = await databaseProxy.getQuestionList(
            1
            ,{reply: {$ne:0}}
            ,{viewNum: -1}
            ,10
            ,false
            ,''
        )

        let unreply = await databaseProxy.getQuestionList(
            1
            ,{reply:0}
            ,{createTime:1}
            ,10
            ,false
            ,''
        )

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('question/main',{current: '/question'
            , columns: data
            , navTitle:navTitle
            , tags: tags
            , normal:normal
            , hot: hot
            , unreply: unreply
            , userId: userId
        })
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/add', async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        var navTitle = ''
        for(var i in data) {
            if(data[i].url === '/question') {
                navTitle = data[i].name
                break
            }
        }
        let tags = await databaseProxy.getTags()
        let user

        let userId = ''
        if (req.userId) {
            userId = req.userId
            user = await databaseProxy.getUserInfo(req.userId)
        }

        res.render('question/add',{current: '/question', columns: data, navTitle:navTitle, tags: tags, userId:userId, user:user});
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.post('/save', async function(req, res, next) {

    var str = decodeURI(req.body.content)
    var images = req.body.images
    var content = {shortContent:str},filePath = ''
    var imgPaths = []

    if(str.length > 200){
        content.shortContent = encodeURI(str.substring(0, 200))
        content.longContent = encodeURI(str)
    } else {
        content.shortContent = req.body.content
    }

    if(images && images.length > 0){
        if(!fs.existsSync(path.join(uploadPath,'questionImage'))){//不存在就创建一个
            fs.mkdirSync(path.join(uploadPath,'questionImage'))
        }
        for(var i in images) {
            var base64Data = images[i].replace(/^data:image\/\w+;base64,/, "");
            var dataBuffer = new Buffer(base64Data, 'base64');
            var p = path.join(uploadPath,'questionContent',new Date().getTime() + '.jpeg')
            var error = fs.writeFileSync(p,dataBuffer)
            if (!error) {
                imgPaths.push(p.replace(uploadPath,''))
            }
        }
    }

    var date = new Date()

    question.create({title:req.body.title
        , telphone:req.body.telphone
        , username:req.body.username
        , type:mongoose.Types.ObjectId(req.body.type)
        , email:req.body.email
        , telphone:req.body.telphone
        , content: content
        , images:imgPaths
        , createTime: date
        , userId: req.userId !== undefined && req.userId !== '' ? mongoose.Types.ObjectId(req.userId) : ''
    }).then(function (data) {
        return res.json({data: data})
    }).catch(function (e) {
        return res.json({error: e.message})
    })
})

router.get('/subList',async function(req, res, next) {
    try{
        var param = JSON.parse(req.query.param)

        if (param.key && param.key.type !== '' && param.key.type !== undefined) {
            param.key.type = mongoose.Types.ObjectId(param.key.type)
        }

        let data = await databaseProxy.getQuestionList(
            param.page
            ,param.key === undefined ? {} : param.key
            ,param.sort === undefined ? {createTime: -1} : param.sort
            ,5
            ,true
            ,req.userId === '' || req.userId === undefined ? '' : req.userId
        )
        data.current = param.page
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/more',async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        var navTitle = ''
        for(var i in data) {
            if(data[i].url === '/question') {
                navTitle = data[i].name
                break
            }
        }
        var tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

        if(param.type === 'normal') {
            title = '更多常见问题列表'
        }
        if(param.type === 'hot') {
            title = '更多热门问题列表'
        }
        if(param.type === 'norely') {
            title = '更多待回复问题列表'
        }

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('question/list', {title: title, type: param.type,columns: data
            , navTitle:navTitle, userId: userId})
    } catch (e) {
        res.render('error', {error: e.message})
    }
})

router.get('/more/list/:type',async function(req, res, next) {
    try{
        let sort = {}
        let param = {}
        try {
            param = JSON.parse(req.query.param)
        } catch(e) {
            param = req.query.param
        }

        if (param.key === undefined) {
            param = {}
        }
        if(req.params.type === 'normal') {
            param.key.isCommonly = 1
            sort.createTime = 'asc'
        }
        if(req.params.type === 'hot') {
            param.key.reply = {$ne:0}
            sort.viewNum = 'desc'
        }
        if(req.params.type === 'norely') {
            param.key.reply = 0
            sort.createTime = 'desc'
        }
        let data = await databaseProxy.getQuestionList(
            param.page === undefined ? 1 : (Number(param.page) + 1)
            ,param.key
            ,param.sort === undefined ? sort : param.sort
            ,param.limit === undefined ? 10 : param.limit
            ,true
            ,req.userId === '' || req.userId === undefined ? '' : req.userId
        )
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.put('/like/:id',async function(req, res, next) {
    try{
        let param = [{ip:req.ip}]
        if (req.userId !== '' && req.userId !== undefined) {
            param.push({userId:mongoose.Types.ObjectId(req.userId)})
        }

        let url = await like.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'question',
                $or:param},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                type: 'question',
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
                ,ip:req.ip
                , createTime: new Date()
            }},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            if (!url.lastErrorObject.updatedExisting) {
                let result = await question.findAndModify({_id:mongoose.Types.ObjectId(req.params.id), status: 1},{_id:-1},{ $inc: {"likeNum": 1 } },{upsert: false,
                    new : true})
                if (result.lastErrorObject.updatedExisting) {
                    return res.json(result.value.likeNum)
                } else {
                    return res.json({error: '记录未找到'})
                }
            } else {
                return res.json({error: '不要重复点赞'})
            }
        }

        return res.json(true)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.put('/collection/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await collection.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'question',
                userId:mongoose.Types.ObjectId(req.userId)},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                type: 'question',
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
                ,ip:req.ip
                , status:1
                , createTime: new Date()
            }},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            if (!url.lastErrorObject.updatedExisting) {
                let result = await question.findAndModify({_id:mongoose.Types.ObjectId(req.params.id), status: 1},{_id:-1},{ $inc: {"collectionNum": 1 } },{upsert: false,
                    new : true})
                if (result.lastErrorObject.updatedExisting) {
                    return res.json(result.value.collectionNum)
                } else {
                    return res.json({error: '记录未找到'})
                }
            } else {
                return res.json({error: '你已收藏过了'})
            }
        }
        return res.json(true)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.delete('/collection/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await collection.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'question',
                userId:mongoose.Types.ObjectId(req.userId),
            },
            {_id:-1},
            true,
            {
                upsert: false,
                new : true
            }
        )

        if (url.ok === 1) {
            if (url.lastErrorObject.updatedExisting) {
                let result = await question.findAndModify({_id:mongoose.Types.ObjectId(req.params.id), status: 1},{_id:-1},{ $inc: {"collectionNum": -1 } },{upsert: false,
                    new : true})
                if (result.lastErrorObject.updatedExisting) {
                    return res.json(result.value.collectionNum)
                } else {
                    return res.json({error: '记录未找到'})
                }
            } else {
                return res.json({error: '还未收藏'})
            }
        }
        return res.json(true)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/detail',async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        var navTitle = ''
        for(var i in data) {
            if(data[i].url === '/question') {
                navTitle = data[i].name
                break
            }
        }
        var tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
        let info
        if (param.key !== undefined && param.key !== '') {
            param.key._id = {$ne:mongoose.Types.ObjectId(param.id)}
            info = await databaseProxy.getQuestionList(
                1
                ,param.key
                ,param.order !== undefined ? param.order : {_id:1}
                ,1
                ,false
                ,req.userId === '' || req.userId === undefined ? '' : req.userId
            )
        } else {
            info = await databaseProxy.getQuestionList(
                1
                ,{_id: mongoose.Types.ObjectId(param.id)}
                ,{_id:1}
                ,1
                ,false
                ,req.userId === '' || req.userId === undefined ? '' : req.userId
            )
        }

        if (info.length > 0) {
           await question.update({_id:info[0]._id},{ $inc: {"viewNum": 1 } })
        }

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        // let url = await shareUrl.findAndModify(
        //     {url: '/question/detail' + '/' + param.id},
        //     {_id:-1},
        //     {$set:{url: '/question/detail' + '/' + param.id, status:1, createTime: new Date(), updateTime: new Date()}},
        //     {upsert: true,
        //         new : true}
        // )shortUrl: '192.168.1.102/question' + '/' + url.value._id.toString()

        res.render('question/detail' ,{current: '/question',columns: data
            , navTitle:navTitle,info:info.length > 0 ? info[0] : {},title:param.title, url: param.url, userId: userId})
    } catch (e) {
        res.render('error',{error: e.message})
    }
})


router.get('/getTitles',async function(req, res, next) {
    try{
        let data = await question.distinct('title',{title:{$regex: req.query.key}, status : 1}).sort({createTime: -1})
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/:id', async function(req, res, next) {
    try{
        let url = await shareUrl.findOne({_id: mongoose.Types.ObjectId(req.params.id),status:1})

        if (url) {
            res.redirect(url.url)
        } else {
            res.redirect('/')
        }
    } catch (e) {
        res.render('error',{error: e.message})
    }
})

router.get('/detail/:id', async function(req, res, next) {
    try{
        let info = await databaseProxy.getQuestionList(
            1
            ,{_id: mongoose.Types.ObjectId(req.params.id)}
            ,{_id:1}
            ,1
            ,false
        )

        res.render('question/detail', {isShare:true, info:info.length > 0 ? info[0] : {}})
    } catch (e) {
        res.render('error',{error: e.message})
    }
})

module.exports = router
