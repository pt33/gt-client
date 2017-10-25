const express = require('express')
const router = express.Router()
const share = require('../models/share')
const mongoose = require('mongoose')
const databaseProxy = require('../util/databaseProxy')
const blog = require('../models/blog')
const book = require('../models/book')
const news = require('../models/news')

router.get('/:type/:id', async function(req, res, next) {
    try{
        let type = Number(req.params.type)
        let ary = Object.keys(req.query)
        if (ary.length > 0) {
            let source = Object.keys(req.query)[0].split(';')[1].split('-')[1]
            await share.update({tid:mongoose.Types.ObjectId(req.params.id), source:source},{ $inc: {"clickNum": 1 } })
        }
        if (type === 0) {
            let info = await databaseProxy.getBlogList(
                1
                ,{_id: mongoose.Types.ObjectId(req.params.id),status: 1}
                ,{createTime: -1}
                ,1
                ,false
                ,''
            )
            if (info.length > 0) {
                await blog.update({_id:info[0]._id},{ $inc: {"viewNum": 1 } })
            }
            res.render('family/blogDetail', {isShare:true, info:info.length > 0 ? info[0] : {}})
        } else if (type === 1) {
            let info = await databaseProxy.getBookList(
                1
                ,{_id: mongoose.Types.ObjectId(req.params.id),status: 1}
                ,{createTime: -1}
                ,1
                ,false
                ,''
            )
            if (info.length > 0) {
                await book.update({_id:info[0]._id},{ $inc: {"viewNum": 1 } })
            }
            res.render('family/bookDetail', {isShare:true, info:info.length > 0 ? info[0] : {}})
        }

    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/list', async function(req, res, next) {
    try{
        let data = await getPaperData(
            req.query.page
            ,req.query.limit
            ,req.query.sort
            ,req.query.key === undefined ? '' : req.query.key
        )
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

async function getPaperData(current, limit, sort, key) {

    let count = await uploadLog.count()

    let info = []

    if (count !== 0) {

        info = await uploadLog.aggregate(
            [
                {
                    $lookup:
                        {
                            from: 'admins',
                            localField: 'adminId',
                            foreignField: '_id',
                            as: 'admin'
                        }
                },
                {
                    $project:
                        {
                            desc: 1,
                            path: 1,
                            createTime:  { $dateToString: { format: "%Y-%m-%d %H:%M:%S", date: "$createTime" } },
                            admin:  {$arrayElemAt: [ '$admin.username', 0 ]}
                        }
                }
            ]
        ).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: info,
        total: count
    }
}

module.exports = router
