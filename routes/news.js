const express = require('express');
const router = express.Router();
const databaseProxy = require('../util/databaseProxy')
const news = require('../models/news')
const share = require('../models/share')
const like = require('../models/like')
const comment = require('../models/comment')
const collection = require('../models/collection')
const mongoose = require('mongoose')
const CryptoJS = require("crypto-js")

router.get('/', async function(req, res) {
    try{
        let data = await databaseProxy.getColumnData(1)
        let navTitle = ''
        for(let i in data) {
            if(data[i].url === '/news') {
                navTitle = data[i].name
                break
            }
        }
        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('news',{current: '/news', columns: data, navTitle:navTitle,userId:userId});
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/list',async function(req, res) {
    try{
        let param = {
            page: 1,
            key: {},
            sort:{updateTime: -1},
            limit:10
        }
        if(req.query.param !== undefined) {
            param = JSON.parse(req.query.param)
        }

        let list = await databaseProxy.getNewsList(
            param.page === undefined ? 1 : param.page
            ,param.key === undefined ? {} : param.key
            ,param.sort === undefined ? {updateTime: -1} : param.sort
            ,param.limit === undefined ? 10 : param.limit
            ,true
            ,req.userId === undefined ? '' : req.userId
        )
        res.render('news/newsCell',{list:list.rows, current:(param.page === undefined ? 1 : param.page),total:list.total, param:req.query.param})
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/detail/:id', async function(req, res, next) {

    let tmp = req.query.param.replace(/\ /g,'+')
    let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
    let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let list = await databaseProxy.getNewsList(
        1
        ,{_id: mongoose.Types.ObjectId(req.params.id),status:1}
        ,{createTime: -1}
        ,1
        ,false
        ,req.userId === undefined ? '' : req.userId
    )

    if (list.length > 0) {
        await news.update({_id:list[0]._id,status:1},{ $inc: {"viewNum": 1 } })
    }
    let data = await databaseProxy.getColumnData(1)

    res.render('news/newsDetail', {info:list.length > 0 ? list[0] : {}
        ,shortUrl: '192.168.1.102:8086' + '/share/1/' + list[0]._id.toString()
        // , shortUrl: req.headers.host + '/share/0/' + list[0]._id.toString()
        ,current: '/family'
        ,columns: data
        ,userId: req.userId
        ,title:param.title||''
        ,url:param.url||''
        ,isDetail: param.isDetail||false
    })
})

router.put('/like/:id',async function(req, res, next) {
    try{
        let param = [{ip:req.ip}]
        if (req.userId !== '' && req.userId !== undefined) {
            param.push({userId:mongoose.Types.ObjectId(req.userId)})
        }

        let url = await like.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'news',
                $or:param},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                type: 'news',
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
                ,ip:req.ip
                , createTime: new Date()
            }},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            if (!url.lastErrorObject.updatedExisting) {
                let result = await news.findAndModify({_id:mongoose.Types.ObjectId(req.params.id)},{_id:-1},{ $inc: {"likeNum": 1 } },{upsert: false,
                    new : true})
                if (result.lastErrorObject.updatedExisting) {
                    return res.json(result.value.likeNum)
                } else {
                    return res.json({error: ''})
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

router.post('/comment',function(req, res, next) {
    if (req.userId === undefined) {
        return res.json({error:'请先登录系统'})
    }

    let param = {
        userId:mongoose.Types.ObjectId(req.userId)
        ,content: req.body.content
        ,mainId:mongoose.Types.ObjectId(req.body.bid)
        ,type:'news'
    }

    if (req.body.replyTo !== undefined) {
        param.replyTo = mongoose.Types.ObjectId(req.body.replyTo)
    }

    comment.create(param).then(async (data) => {
        try {
            let result = await news.findAndModify(
                {_id:mongoose.Types.ObjectId(req.body.bid)}
                ,{_id:-1},{ $inc: {"commentNum": 1 } }
                ,{upsert: false, new : true})
            return res.json(result.value.commentNum)
        } catch (e) {
            return res.json({statusCode: 201, error: e.message})
        }
    }).catch((e) => {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.get('/comment/:id',async function(req, res, next) {
    let list = await databaseProxy.getCommentList(
        req.query.current === undefined ? 1 : req.query.current
        ,{mainId: mongoose.Types.ObjectId(req.params.id),status:1,type:'news'}
        ,10
    )
    res.render('news/comment', {comments:list.rows,current:req.query.current||1,total:list.total})
})

router.put('/collection/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await collection.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'news',
                userId:mongoose.Types.ObjectId(req.userId)},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                userId:req.userId !== '' && req.userId !== undefined ? mongoose.Types.ObjectId(req.userId) : ''
                ,ip:req.ip
                , status:1
                , createTime: new Date()
                ,type:'news'
            }},
            {upsert: true,
                new : true}
        )

        if (url.ok === 1) {
            if (!url.lastErrorObject.updatedExisting) {
                let result = await news.findAndModify({_id:mongoose.Types.ObjectId(req.params.id),status:1},{_id:-1},{ $inc: {"collectionNum": 1 } },{upsert: false,
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
                type: 'news',
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
                let result = await news.findAndModify({_id:mongoose.Types.ObjectId(req.params.id), status: 1},{_id:-1},{ $inc: {"collectionNum": -1 } },{upsert: false,
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

router.put('/share/:id',async function(req, res, next) {
    try{
        if (req.userId === '' || req.userId === undefined) {
            return res.json({error: '请先登录'})
        }

        let url = await share.findAndModify(
            {tid:mongoose.Types.ObjectId(req.params.id),
                type: 'news',
                userId:mongoose.Types.ObjectId(req.userId),
                source:req.query.source},
            {_id:-1},
            {$set:{tid:mongoose.Types.ObjectId(req.params.id),
                type: 'news',
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
                let result = await news.findAndModify({_id: mongoose.Types.ObjectId(req.params.id), status: 1}, {_id: -1}, {$inc: {"shareNum": 1}}, {
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
