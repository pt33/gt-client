let express = require('express')
let router = express.Router()
let mongoose = require('mongoose')
let like = require('../models/like')
let collection = require('../models/collection')
let databaseProxy = require('../util/databaseProxy')
let shareUrl = require("../models/shareUrl")
let share = require("../models/share")
let blog = require("../models/blog")
let CryptoJS = require("crypto-js")

router.use(async function (req, res, next) {
    if (!req.userId) {
        res.redirect('/login')
        return;
    }
    next()
})

router.get('/', async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        let grid = await databaseProxy.getIndexData()
        for (let i in grid) {
            let obj = grid[i]
            obj.data = await databaseProxy.getTableListDetail(obj.refTable,obj.contentTitle,obj.contentSubTitle,obj.content)
        }
        let userId = ''
        if (req.userId) {
            userId = req.userId
        }
        res.render('family',{current: '/family', columns: data, grids: grid, userId: userId,node:req.query.node||'blog', currentpage:req.query.current||1})
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/blog/view', function(req, res, next) {
    res.render('user/bdetail', {title:req.query.title})
})

router.get('/book', async function(req, res, next) {

    let uinfo = await databaseProxy.getUserInfo(req.userId)

    let list = await databaseProxy.getBookList(
        req.query.current === undefined ? 1 : req.query.current
       ,{$or:[{viewRange: 0}
           ,{viewRange: 1,userId: mongoose.Types.ObjectId(req.userId)}
           ,{viewRange: 2,'friend.friendId': mongoose.Types.ObjectId(req.userId)}
           ,{viewRange: 3,'user.surname': uinfo.surname,'user.surname':{$exists: true, $ne:''}
            }],status:1}
       ,{createTime: -1}
       ,req.query.limit === undefined ? 8 : req.query.limit
       ,true
    )

    res.render('family/book',{list:list.rows,current:(req.query.current === undefined ? 1 : req.query.current),total:list.total});
});

router.get('/book/add', async function(req, res, next) {
    res.render('family/addBook', {current:(req.query.current === undefined ? 1 : req.query.current)})
})

router.get('/blog', async function(req, res, next) {

    let uinfo = await databaseProxy.getUserInfo(req.userId)

    let list = await databaseProxy.getBlogList(
        req.query.current === undefined ? 1 : req.query.current
       ,{$or:[{viewRange: 0}
           ,{viewRange: 1,userId: mongoose.Types.ObjectId(req.userId)}
           ,{viewRange: 2,'friend.friendId': mongoose.Types.ObjectId(req.userId)}
           ,{viewRange: 3,'user.surname': uinfo.surname,'user.surname':{$exists: true, $ne:''}}
           ,{userId: mongoose.Types.ObjectId(req.userId)}
            ],status:1}
       ,{createTime: -1}
       ,req.query.limit === undefined ? 2 : req.query.limit
       ,true
       ,req.userId
    )
    res.render('family/blog', {list:list.rows,current:(req.query.current === undefined ? 1 : req.query.current),total:list.total})
})

router.get('/blog/view', function(req, res, next) {
    res.render('family/bdetail', {title:req.query.title})
})

router.get('/blog/add', async function(req, res, next) {
    res.render('family/addBlog', {current:req.query.current})
})

router.get('/blog/:id', async function(req, res, next) {

    var tmp = req.query.param.replace(/\ /g,'+')
    let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
    let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let list = await databaseProxy.getBlogList(
        1
       ,{_id: mongoose.Types.ObjectId(req.params.id),status: 1}
       ,{createTime: -1}
       ,1
       ,false
       ,req.userId
    )
    if (list.length > 0) {
        await blog.update({_id:list[0]._id},{ $inc: {"viewNum": 1 } })
    }
    let data = await databaseProxy.getColumnData(1)

    res.render('family/blogDetail', {info:list.length > 0 ? list[0] : {},current:param.current
       , url: param.url
        ,shortUrl: '192.168.1.102:8086' + '/share/0/' + list[0]._id.toString()
       // , shortUrl: req.headers.host + '/share/0/' + list[0]._id.toString()
        , current: '/family'
        ,columns: data, userId: req.userId
        ,title:param.title
    })
})

router.get('/book/:id', async function(req, res, next) {
    let list = await databaseProxy.getBookList(
        1
       ,{_id: mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
       ,{createTime: -1}
       ,1
       ,false
    )

    res.render('family/bookDetail', {book:list.length > 0 ? list[0] : {},current:req.query.current})
})

router.put('/blog/like/:id',async function(req, res, next) {
    try{
        let param = [{ip:req.ip}]
        if (req.userId !== '' && req.userId !== undefined) {
            param.push({userId:mongoose.Types.ObjectId(req.userId)})
        }

        let url = await like.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'blog',
                $or:param},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                type: 'blog',
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
               ,ip:req.ip
               , createTime: new Date()
            }},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            if (!url.lastErrorObject.updatedExisting) {
                let result = await blog.findAndModify({_id:mongoose.Types.ObjectId(req.params.id)},{_id:-1},{ $inc: {"likeNum": 1 } },{upsert: false,
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

router.post('/blog/comment',async function(req, res, next) {
    if (req.userId === undefined) {
        return res.json({error:'请先登录系统'})
    }
    blog.findAndModify(
        {_id: mongoose.Types.ObjectId(req.body.bid), status: 1}
        ,{_id:-1}
        , {
            $push: {
                comments:
                {
                    content: req.body.content
                    , commentUid: mongoose.Types.ObjectId(req.userId)
                    , commentTime: new Date()
                }
            }
        },
        {
            upset: true,new : true
        }
    ).then(async function (result) {
        return res.json(result.value.comments.length)
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.get('/blog/comment/:id',async function(req, res, next) {
    if (req.userId === undefined) {
        return res.json({error:'请先登录系统'})
    }

    let info = await blog.findOne({_id: mongoose.Types.ObjectId(req.params.id), status: 1})
})

router.put('/blog/collection/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await collection.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'blog',
                userId:mongoose.Types.ObjectId(req.userId)},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
               ,ip:req.ip
               , status:1
               , createTime: new Date()
               ,type:'blog'
            }},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            if (!url.lastErrorObject.updatedExisting) {
                let result = await blog.findAndModify({_id:mongoose.Types.ObjectId(req.params.id)},{_id:-1},{ $inc: {"collectionNum": 1 } },{upsert: false,
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

router.delete('/blog/collection/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await collection.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'blog',
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
                let result = await blog.findAndModify({_id:mongoose.Types.ObjectId(req.params.id), status: 1},{_id:-1},{ $inc: {"collectionNum": -1 } },{upsert: false,
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

router.put('/blog/share/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await share.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'blog',
                userId:mongoose.Types.ObjectId(req.userId),
                source:req.query.source},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                type: 'blog',
                source:req.query.source,
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
                ,createTime: new Date()
            },$inc: {"shareNum": 1}},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            console.log(url.lastErrorObject.updatedExisting)
            if (!url.lastErrorObject.updatedExisting) {
                let result = await blog.findAndModify({_id: mongoose.Types.ObjectId(req.params.id), status: 1}, {_id: -1}, {$inc: {"shareNum": 1}}, {
                    upsert: false,
                    new: true
                })
                if (result.lastErrorObject.updatedExisting) {
                    return res.json(result.value.shareNum)
                }
            }
        }
        return res.json({ignore:true})
    } catch (e) {
        return res.json({error: e.message})
    }
})

module.exports = router
