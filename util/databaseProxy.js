const column = require('../models/column')
const index = require('../models/index')
const test = require('../models/test')
const user = require('../models/user')
const blog = require('../models/blog')
const book = require('../models/book')
const tag = require('../models/tag')
const friend = require('../models/friend')
const question = require('../models/question')
const comment = require('../models/comment')
const collection = require('../models/collection')
const share = require('../models/share')
const invite = require('../models/invite')
const donate = require('../models/donate')
const news = require('../models/news')
const mongoose = require('mongoose')

exports.getIndexData = async () => {
    return await index.find({status: 1, refTable: {$ne: ''}}).sort({sort: 1})
}

exports.getUserInfo = async (userId) => {
    return await user.findOne({_id: mongoose.Types.ObjectId(userId)})
}

exports.getTableListDetail = async (tableName, contentTitle, contentSubTitle, content) => {

    const schema = await test.getSchema('', tableName);
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

    return await schema.aggregate([
        {
            $match: {status: 1}
        },
        {
            $project: project
        }]
    ).sort({_id: 1}).skip(0).limit(10)
}

exports.getColumnData = async (status) => {

    let param = {}

    if (status !== undefined) {
        param.status = status
    }
    return await column.aggregate(
        [
            {
                $match: param
            },
            {
                $sort: {sort: 1}
            },
            {
                $project:
                    {
                        id: 1,
                        name: 1,
                        url: 1,
                        hasChild: 1,
                        childShowMode: {$ifNull: ['$childShowMode', '']},
                        childs: {$ifNull: ['$childs', []]}
                    }
            }
        ]
    )
}

exports.getBlogList = async (page, key, sort, limit, needCnt, userId) => {

    if (Object.keys(key).length === 0) {
        key.status = {$gte: 1}
    }

    // let count = 0
    //
    // if (needCnt) {
    //     count = await blog.count(key)
    // }

    // var map = {
    //     $map:
    //     {
    //         input: "$comments",
    //         as: "comment",
    //         in: {
    //             content: '$$comment.content',
    //             replyuserId: '$$comment.replyuserId',
    //             replydate: '$$comment.replydate',
    //             replytime:
    //             {
    //                 $dateToString: {
    //                     format: "%Y-%m-%d %H:%M:%S",
    //                     date: {$add: ['$$comment.replydate', 8 * 60 * 60000]}
    //                 }
    //             }
    //         }
    //     }
    // }

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
                        userId: 1,
                        user: {$arrayElemAt: ['$users', 0]},
                        shortContent: 1,
                        content: (Number(limit) === 1 ? '$content' : ''),
                        viewNum: 1,
                        likeNum: 1,
                        collectionNum: 1,
                        shareNum: 1,
                        viewRange: 1,
                        canShare: 1,
                        status: 1,
                        commentNum: 1,
                        imgPaths: 1,
                        friend: 1,
                        collection: userId === '' ? '0' : {
                            $size: {
                                $filter: {
                                    input: "$collection",
                                    as: "tmp",
                                    cond: {
                                        $and: [
                                            {$eq: ["$$tmp.userId", mongoose.Types.ObjectId(userId)]},
                                            {$eq: ["$$tmp.type", 'blog']}
                                        ]
                                    }
                                }
                            }
                        },
                        _id: 1
                    }
            }, {
            $match: key
        }
        ]).sort(sort);//.skip((Number(page) - 1) * Number(limit)).limit(Number(limit))

    let count = 0;

    if (result.length > 0) {
        if (needCnt) {
            count = result.length;
            result = result.slice(Math.max((Number(page) - 1) * Number(limit), 0), Math.min((Number(page)) * Number(limit), count))
        }
    }

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getQuestionList = async (page, key, sort, limit, needCnt, userId) => {

    if (Object.keys(key).length === 0) {
        key.status = {$gte: 1}
    }

    let count = 0;

    if (needCnt) {
        count = await question.count(key)
    }

    let map = {
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
                        shareNum:1,
                        likeNum: 1,
                        type: 1,
                        tag: {$arrayElemAt: ['$tag.name', 0]},
                        icon: {$arrayElemAt: ['$tag.icon', 0]},
                        status: 1,
                        isCommonly: {$cond: {if: {$eq: ["$isCommonly", true]}, then: 1, else: 0}},
                        comments: (Number(limit) === 1 ? map : ''),
                        images: '$images',
                        _id: 1,
                        userId: 1,
                        collection: userId === '' ? '0' : {
                            $size: {
                                $filter: {
                                    input: "$collection",
                                    as: "tmp",
                                    cond: {
                                        $and: [
                                            {$eq: ["$$tmp.userId", mongoose.Types.ObjectId(userId)]},
                                            {$eq: ["$$tmp.type", 'question']}
                                        ]
                                    }
                                }
                            }
                        }
                    }
            },
            {
                $match: key
            }
        ]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getTags = async () => {
    return await tag.find({status: 1})
}

exports.getBookList = async (page, key, sort, limit, needCnt, userId) => {

    if (Object.keys(key).length === 0) {
        key.status = {$gte: 1}
    }

    let count = 0;

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
                        localField: '_id',
                        foreignField: 'tid',
                        as: 'collection'
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
                        userId: 1,
                        user: {$arrayElemAt: ['$users', 0]},
                        files: 1,
                        cover: 1,
                        status: 1,
                        viewNum: 1,
                        likeNum: 1,
                        collectionNum: 1,
                        shareNum: 1,
                        canShare: 1,
                        viewRange: 1,
                        friend: 1,
                        collection: userId === '' ? '0' : {
                            $size: {
                                $filter: {
                                    input: "$collection",
                                    as: "tmp",
                                    cond: {
                                        $and: [
                                            {$eq: ["$$tmp.userId", mongoose.Types.ObjectId(userId)]},
                                            {$eq: ["$$tmp.type", 'book']}
                                        ]
                                    }
                                }
                            }
                        },
                        _id: 1
                    }
            }, {
            $match: key
        }
        ]).sort(sort);//.skip((Number(page) - 1) * Number(limit)).limit(Number(limit))


    if (result.length > 0) {
        if (needCnt) {
            count = result.length;
            result = result.slice(Math.max((Number(page) - 1) * Number(limit), 0), Math.min((Number(page)) * Number(limit), count))
        }
    }

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getCollectList = async (page, key, sort, limit, needCnt) => {

    await collection.remove({userId: {$exists: false}});

    let count = 0;

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
                $lookup:
                    {
                        from: 'books',
                        localField: 'tid',
                        foreignField: '_id',
                        as: 'book'
                    }
            },
            {
                $lookup:
                    {
                        from: 'blogs',
                        localField: 'tid',
                        foreignField: '_id',
                        as: 'blog'
                    }
            },
            {
                $lookup:
                    {
                        from: 'questions',
                        localField: 'tid',
                        foreignField: '_id',
                        as: 'question'
                    }
            },
            {
                $project:
                    {
                        type: 1,
                        createTime: 1,
                        userId: 1,
                        status: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        question: {
                            _id: {$arrayElemAt: ['$question._id', 0]},
                            title: {$arrayElemAt: ['$question.title', 0]},
                            images: {$arrayElemAt: ['$question.images', 0]}
                        },
                        book: {
                            _id: {$arrayElemAt: ['$book._id', 0]},
                            title: {$arrayElemAt: ['$book.name', 0]},
                            images: '$book.cover'
                        },
                        blog: {
                            _id: {$arrayElemAt: ['$blog._id', 0]},
                            title: {$arrayElemAt: ['$blog.title', 0]},
                            images: {$arrayElemAt: ['$blog.imgPaths', 0]}
                        },
                        _id: 1
                    }
            }, {
            $match: key
        }]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getCommentList = async (page, key, limit) => {

    let count = await comment.count(key);

    let info = [];

    if (count > 0) {
        info = await comment.aggregate([
            {$match: key},
            {
                $graphLookup: {
                    from: "comments",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "replyTo",
                    as: "children"
                }
            },
            {$match: {replyTo: {$exists: false}}},
            {
                $addFields: {reply: {$size: "$children"}}
            },
            {$unwind: {path: "$children", preserveNullAndEmptyArrays: true}},
            {
                $lookup:
                    {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userinfo'
                    }
            },
            {
                $lookup:
                    {
                        from: 'users',
                        localField: 'children.userId',
                        foreignField: '_id',
                        as: 'subuser'
                    }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    content: 1,
                    mainId: 1,
                    type:1,
                    createTime: 1,
                    createStr: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ["$createTime", 8 * 60 * 60000]}
                        }
                    },
                    user: {
                        username: {$arrayElemAt: ['$userinfo.username', 0]},
                        avatar: {$arrayElemAt: ['$userinfo.avatar', 0]},
                        surname: {$arrayElemAt: ['$userinfo.surname', 0]},
                        nickname: {$arrayElemAt: ['$userinfo.nickname', 0]}
                    }, children: 1
                    , subuser: 1,
                    reply: 1
                }
            }, {
                $group: {
                    _id: '$_id',
                    children: {
                        $push: {
                            userId: '$children.userId',
                            content: '$children.content',
                            replyTo: '$children.replyTo',
                            replyStr:
                                {
                                    $dateToString: {
                                        format: "%Y-%m-%d %H:%M:%S",
                                        date: {$add: ["$children.createTime", 8 * 60 * 60000]}
                                    }
                                },
                            createTime: '$children.createTime',
                            username: {$arrayElemAt: ['$subuser.username', 0]},
                            avatar: {$arrayElemAt: ['$subuser.avatar', 0]},
                            surname: {$arrayElemAt: ['$subuser.surname', 0]},
                            realname: {$arrayElemAt: ['$subuser.realname', 0]},
                            nickname: {$arrayElemAt: ['$subuser.nickname', 0]}

                        }
                    },
                    userId: {$first: '$userId'},
                    content: {$first: '$content'},
                    mainId: {$first: '$mainId'},
                    createTime: {$first: '$createTime'},
                    createStr: {$first: '$createStr'},
                    user: {$first: '$user'},
                    reply: {$first: '$reply'}
                }
            }
        ]).sort({
            createTime: -1,
            'children.createTime': -1
        }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit))
    }
    return {
        rows: info,
        total: count
    }
}

exports.getShareList = async (page, key, sort, limit, needCnt) => {

    let count = 0;

    if (needCnt) {
        count = await share.count(key)
    }

    let result = await share.aggregate(
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
                        from: 'books',
                        localField: 'tid',
                        foreignField: '_id',
                        as: 'book'
                    }
            },
            {
                $lookup:
                    {
                        from: 'blogs',
                        localField: 'tid',
                        foreignField: '_id',
                        as: 'blog'
                    }
            },
            {
                $project:
                    {
                        type: 1,
                        createTime: 1,
                        userId: 1,
                        status: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        book: {
                            _id: {$arrayElemAt: ['$book._id', 0]},
                            title: {$arrayElemAt: ['$book.name', 0]},
                            images: '$book.cover'
                        },
                        blog: {
                            _id: {$arrayElemAt: ['$blog._id', 0]},
                            title: {$arrayElemAt: ['$blog.title', 0]},
                            images: {$arrayElemAt: ['$blog.imgPaths', 0]}
                        },
                        _id: 1
                    }
            }, {
            $match: key
        }]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getInviteList = async (page, key, sort, limit, needCnt, type) => {

    let count = 0;

    if (needCnt) {
        count = await invite.count(key)
    }

    let result = await invite.aggregate(
        [
            {
                $project:
                    {
                        createTime: 1,
                        userId: 1,
                        status: 1,
                        phone: 1,
                        name: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        _id: 1,
                        type: type
                    }
            }, {
            $match: key
        }]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getInvitedList = async (page, key, sort, limit, needCnt, type) => {

    let count = 0;

    if (needCnt) {
        count = await invite.count(key)
    }

    let result = await invite.aggregate(
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
                        createTime: 1,
                        userId: 1,
                        user: {$arrayElemAt: ['$users', 0]},
                        name: 1,
                        phone: 1,
                        status: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        _id: 1,
                        type: type
                    }
            }, {
            $match: key
        }]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getFriendList = async (page, key, sort, limit, needCnt) => {
    let count = 0;

    if (needCnt) {
        count = await friend.count(key)
    }

    let result = await friend.aggregate(
        [
            {
                $lookup:
                    {
                        from: 'users',
                        localField: 'friendId',
                        foreignField: '_id',
                        as: 'friends'
                    }
            },
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
                        createTime: 1,
                        userId: 1,
                        friendId: 1,
                        removeUser: 1,
                        status: 1,
                        createStr: {
                            $dateToString: {
                                format: "%Y-%m-%d %H:%M:%S",
                                date: {$add: ["$createTime", 8 * 60 * 60000]}
                            }
                        },
                        friend: {$arrayElemAt: ['$friends', 0]},
                        user: {$arrayElemAt: ['$users', 0]},
                        _id: 1,
                        type: 'friend'
                    }
            }, {
            $match: key
        }]).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getDonateList = async (page, key, sort, limit, needCnt) => {

    let count = 0;

    if (needCnt) {
        count = await donate.count(key)
    }

    let result = await donate.aggregate(([
        {
            $project:
                {
                    createTime: 1,
                    userId: 1,
                    title: 1,
                    place: 1,
                    tanghao: 1,
                    writer: 1,
                    isPrivate: 1,
                    phone: 1,
                    email: 1,
                    username: 1,
                    userPlace: 1,
                    remark: 1,
                    images: 1,
                    surname: 1,
                    status: 1,
                    createStr: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ["$createTime", 8 * 60 * 60000]}
                        }
                    },
                    _id: 1,
                }
        }, {
            $match: key
        }
    ])).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}

exports.getNewsList = async (page, key, sort, limit, needCnt,userId) => {

    let count = 0

    // if (Object.keys(key).length === 0) {
        key.status = 1
    // }

    if (needCnt) {
        count = await news.count(key)
    }

    let result = await news.aggregate(([
        {
            $match: key
        },
        {
            $lookup:
                {
                    from: 'collections',
                    localField: '_id',
                    foreignField: 'tid',
                    as: 'collection'
                }
        },
        {
            $project:
                {
                    createTime: 1,
                    title: 1,
                    type:1,
                    images: 1,
                    content: needCnt ? '' : 1,
                    viewNum: 1,
                    likeNum: 1,
                    collectionNum: 1,
                    commentNum: 1,
                    shareNum: 1,
                    createStr: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S",
                            date: {$add: ["$createTime", 8 * 60 * 60000]}
                        }
                    },
                    collection: userId === '' ? '0' : {
                        $size: {
                            $filter: {
                                input: "$collection",
                                as: "tmp",
                                cond: {
                                    $and: [
                                        {$eq: ["$$tmp.userId", mongoose.Types.ObjectId(userId)]},
                                        {$eq: ["$$tmp.type", 'news']}
                                    ]
                                }
                            }
                        }
                    },
                    _id: 1,
                }
        }
    ])).sort(sort).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

    return needCnt ? {
        rows: result,
        total: count
    } : result
}
