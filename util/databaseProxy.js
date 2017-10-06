let column  = require('../models/column')
let index  = require('../models/index')
let test  = require('../models/test')
let user = require('../models/user')
let blog = require('../models/blog')
let book = require('../models/book')
let tag = require('../models/tag')
let friend = require('../models/friend')
let question = require('../models/question')
let collection = require('../models/collection')
let share = require('../models/share')
let mongoose = require('mongoose')

exports.getIndexData = async () => {
    return await index.find({status:1,refTable:{$ne:''}}).sort({sort:1})
}

exports.getUserInfo = async (userId) => {
    return await user.findOne({_id:mongoose.Types.ObjectId(userId)})
}

exports.getTableListDetail = async (tableName, contentTitle, contentSubTitle, content) =>{

    const schema = await test.getSchema('', tableName)
    let project = {}

    if (contentTitle !== '') {
        project[contentTitle] = 1
    }
    if (contentSubTitle !== '') {
        project[contentSubTitle] = 1
    }
    if (content !== '') {
        project[content] = 1
    }

    let main = await schema.aggregate([
        {
            $match: {status: 1}
        },
        {
            $project: project
        }]
    ).sort({_id:1}).skip(0).limit(10)

    return main
}

exports.getColumnData = async (status) => {

    let param = {}

    if(status !==  undefined) {
        param.status = status
    }
    return await column.aggregate(
        [
            {
                $match:param
            },
            {
                $sort: {sort: 1}
            },
            {
                $project:
                {
                    id: 1,
                    name: 1,
                    url:1,
                    hasChild:1,
                    childShowMode: { $ifNull: [ '$childShowMode', '' ] },
                    childs:{ $ifNull: [ '$childs', [] ] }
                }
            }
        ]
    )
}

exports.getBlogList = async (page, key, sort, limit, needCnt, userId) => {

    if (Object.keys(key).length === 0) {
        key.status = {$gte:1}
    }

    // let count = 0
    //
    // if (needCnt) {
    //     count = await blog.count(key)
    // }

    var map = {
        $map:
        {
            input: "$comments",
            as: "comment",
            in: {
                content: '$$comment.content',
                replyuser: '$$comment.replyuser',
                replyuserId: '$$comment.replyuserId',
                replydate: '$$comment.replydate',
                replytime:
                {
                    $dateToString: {
                        format: "%Y-%m-%d %H:%M:%S",
                        date: {$add: ['$$comment.replydate', 8 * 60 * 60000]}
                    }
                }
            }
        }
    }

    let result = await blog.aggregate(
        [
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $lookup:
                    {
                        from: 'friends',
                        localField: 'userId',
                        foreignField: 'friendId',
                        as: 'friend'
                    }
            },
            {
                $lookup:
                    {
                        from: 'collections',
                        localField: userId === '' ? 'tid' : '_id',
                        foreignField: 'tid',
                        as: 'collection'
                    }
            },
            {
                $project:
                {
                    title: 1,
                    createStr: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ["$createTime", 8 * 60 * 60000]}
                        }
                    },
                    createTime: 1,
                    userId:1,
                    user:{$arrayElemAt: ['$users', 0]},
                    shortContent: 1,
                    content: (Number(limit) === 1 ? '$content' : ''),
                    reply: {$size: '$comments'},
                    viewNum: 1,
                    likeNum:1,
                    collectionNum:1,
                    shareNum:1,
                    viewRange:1,
                    canShare:1,
                    status: 1,
                    comments: (Number(limit) === 1 ? map : ''),
                    imgPaths: 1,
                    friend:1,
                    collection : userId === '' ? '0' : {$size:{
                        $filter: {
                            input: "$collection",
                            as: "tmp",
                            cond: {$and: [
                                { $eq: [ "$$tmp.userId", mongoose.Types.ObjectId(userId)]},
                                { $eq: [ "$$tmp.type", 'blog']}
                            ]}
                            }
                        }
                    },
                    _id:1
                }
            },{
                $match: key
            }
        ]).sort(sort)//.skip((Number(page) - 1) * Number(limit)).limit(Number(limit))

    let count = 0

    if (result.length > 0) {
        if (needCnt) {
            count = result.length
            result = result.slice(Math.max((Number(page) - 1) * Number(limit),0), Math.min((Number(page)) * Number(limit), count))
        }
    }

    return needCnt  ? {
        rows: result,
        total: count
    } : result
}

exports.getQuestionList = async (page, key, sort, limit, needCnt, userId) =>  {

    if (Object.keys(key).length === 0) {
        key.status = {$gte:1}
    }

    let count = 0

    if (needCnt) {
        count = await question.count(key)
    }

    var map = {
        $map:
            {
                input: "$comments",
                as: "comment",
                in: {
                    content: '$$comment.content',
                    replyuser: '$$comment.replyuser',
                    replyuserId: '$$comment.replyuserId',
                    replydate: '$$comment.replydate',
                    replytime:
                    {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ['$$comment.replydate', 8 * 60 * 60000]}
                        }
                    }
                }
            }
    }

    let result = await question.aggregate(
        [
            {
                $lookup:
                {
                    from: 'tags',
                    localField: 'type',
                    foreignField: '_id',
                    as: 'tag'
                }
            },
            {
                $lookup:
                {
                    from: 'collections',
                    localField: userId === '' ? 'tid' : '_id',
                    foreignField: 'tid',
                    as: 'collection'
                }
            },
            {
                $project:
                {
                    title: 1,
                    telphone: 1,
                    createStr: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ["$createTime", 8 * 60 * 60000]}
                        }
                    },
                    createTime: 1,
                    username: 1,
                    email: 1,
                    content: 1,
                    reply: {$size: '$comments'},
                    viewNum: 1,
                    collectionNum: 1,
                    likeNum:1,
                    type: 1,
                    tag: {$arrayElemAt: ['$tag.name', 0]},
                    icon: {$arrayElemAt: ['$tag.icon', 0]},
                    status: 1,
                    isCommonly: {$cond: { if: { $eq: [ "$isCommonly", true ] }, then: 1, else: 0 }},
                    comments: (Number(limit) === 1 ? map : ''),
                    images: '$images',
                    _id: 1,
                    userId:1,
                    collection : userId === '' ? '0' : {$size:{
                        $filter: {
                            input: "$collection",
                            as: "tmp",
                            cond: {$and: [
                                { $eq: [ "$$tmp.userId", mongoose.Types.ObjectId(userId)]},
                                { $eq: [ "$$tmp.type", 'question']}
                            ]}
                        }
                    }}
                }
            },
            {
                $match: key
            }
        ]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit))

    return needCnt  ? {
        rows: result,
        total: count
    } : result
}

exports.getTags = async () => {
    return await tag.find({status:1})
}

exports.getBookList = async (page, key, sort, limit, needCnt) => {

    if (Object.keys(key).length === 0) {
        key.status = {$gte:1}
    }

    let count = 0

    if (needCnt) {
        count = await book.count(key)
    }

    let result = await book.aggregate(
        [
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $project:
                {
                    name: 1,
                    createStr: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ["$createTime", 8 * 60 * 60000]}
                        }
                    },
                    createTime: 1,
                    userId:1,
                    user:{$arrayElemAt: ['$users', 0]},
                    files: 1,
                    cover: 1,
                    status:1,
                    viewNum:1,
                    likeNum:1,
                    collectionNum:1,
                    shareNum:1,
                    canShare:1,
                    viewRange:1,
                    _id:1
                }
            },{
            $match: key
        }
        ]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit))

    return needCnt  ? {
        rows: result,
        total: count
    } : result
}

exports.getCollectList = async (page, key, sort, limit, needCnt) => {

    await collection.remove({userId:{$exists:false}})

    let count = 0

    if (needCnt) {
        count = await collection.count(key)
    }

    let result = await collection.aggregate(
        [
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $project:
                    {
                        name: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        createTime: 1,
                        userId:1,
                        user:{$arrayElemAt: ['$users', 0]},
                        files: 1,
                        cover: 1,
                        status:1,
                        viewNum:1,
                        likeNum:1,
                        collectionNum:1,
                        shareNum:1,
                        canShare:1,
                        viewRange:1,
                        _id:1
                    }
            },{
            $match: key
        }
        ]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit))

    return needCnt  ? {
        rows: result,
        total: count
    } : result
}
