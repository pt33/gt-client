let express = require('express');
let router = express.Router();
let user = require('../models/user')
let security = require('../util/security')
let blog = require('../models/blog')
let mongoose = require('mongoose')
let databaseProxy = require('../util/databaseProxy')
let path = require('path')
let fs = require('fs')
let swig = require('swig')
let jszip = require('jszip')
let book = require('../models/book')
let question = require('../models/question')
// let swig = require('swig')
/* GET users listing. */

router.use(async function (req, res, next) {
    //   console.log();
    if (!req.userId) {

        let data = await databaseProxy.getColumnData(1)
        let grid = await databaseProxy.getIndexData()
        for (let i in grid) {
            let obj = grid[i]
            obj.data = await databaseProxy.getTableListDetail(obj.refTable,obj.contentTitle,obj.contentSubTitle,obj.content)
        }
        res.render('index',{index: '/', columns: data, grids: grid});
        return;
    }
    next()
})

router.get('/', async function(req, res, next) {
    let data = await databaseProxy.getColumnData(1)

    let userId = ''
    if (req.userId) {
        userId = req.userId
    }
    res.render('user',{current: '/user', columns: data, userId: userId});
});

router.get('/modifyAvatar', async function(req, res, next) {
    res.render('user/setAvatar');
});

router.get('/book', async function(req, res, next) {

    let list = await databaseProxy.getBookList(
        req.query.current === undefined ? 1 : req.query.current
        ,{userId: mongoose.Types.ObjectId(req.userId),status:{$ne:-2}}
        ,{createTime: -1}
        ,req.query.limit === undefined ? 8 : req.query.limit
        ,true
    )

    res.render('user/book',{list:list.rows,current:(req.query.current === undefined ? 1 : req.query.current),total:list.total});
});

router.get('/book/add', async function(req, res, next) {
    res.render('user/addBook', {current:(req.query.current === undefined ? 1 : req.query.current)})
})

router.get('/friend', async function(req, res, next) {
    res.render('user/friend',{list:[],current:(req.query.current === undefined ? 1 : req.query.current),total:0});
});

router.get('/friend/add', async function(req, res, next) {
    res.render('user/addFriend', {current:(req.query.current === undefined ? 1 : req.query.current)})
})

router.get('/donate', async function(req, res, next) {
    res.render('user/donate',{list:[],current:(req.query.current === undefined ? 1 : req.query.current),total:0});
});

router.get('/donate/add', async function(req, res, next) {
    res.render('user/addDonate', {current:(req.query.current === undefined ? 1 : req.query.current)})
})

router.get('/profile', async function(req, res, next) {
    let user = await databaseProxy.getUserInfo(req.userId)
    res.render('user/profile', {user: user})
})

router.get('/timeline', async function(req, res, next) {
    let list = await databaseProxy.getBlogList(
        req.query.current === undefined ? 1 : req.query.current
        ,{userId: mongoose.Types.ObjectId(req.userId),status:{$ne:-2}}
        ,{createTime: -1}
        ,req.query.limit === undefined ? 2 : req.query.limit
        ,true
        ,req.userId
    )
    res.render('user/timeline', {list:list.rows,current:(req.query.current === undefined ? 1 : req.query.current),total:list.total})
})

router.get('/timeline/view', function(req, res, next) {
     res.render('user/bdetail', {title:req.query.title})
})

router.get('/timeline/add', async function(req, res, next) {
    res.render('user/addTimeline', {current:req.query.current})
})

router.get('/question', async function(req, res, next) {
    let list = await databaseProxy.getQuestionList(
        req.query.current === undefined ? 1 : req.query.current
        ,{userId: mongoose.Types.ObjectId(req.userId),status:{$nin:[-2,-3]}}
        ,{createTime: -1}
        ,req.query.limit === undefined ? 2 : req.query.limit
        ,true
        ,req.userId
    )
    res.render('user/question', {list:list.rows,current:(req.query.current === undefined ? 1 : req.query.current),total:list.total})
})

router.get('/question/add', async function(req, res, next) {
    let tags = await databaseProxy.getTags()
    let user = await databaseProxy.getUserInfo(req.userId)
    res.render('user/qmodify', {current:req.query.current, tags: tags, user: user})
})

router.get('/question/:id', async function(req, res, next) {
    let list = await databaseProxy.getQuestionList(
        1
        ,{userId: mongoose.Types.ObjectId(req.userId),status:{$nin:[-2,-3]},_id: mongoose.Types.ObjectId(req.params.id)}
        ,{createTime: -1}
        ,1
        ,false
        ,req.userId
    )

    if (list.length > 0 && list[0].status <= 0) {
        let tags = await databaseProxy.getTags()
        res.render('user/qmodify', {question:list.length > 0 ? list[0] : {},current:req.query.current, tags: tags})
    } else {
        res.render('user/qdetail', {question:list.length > 0 ? list[0] : {},current:req.query.current})
    }
})

router.get('/timeline/:id', async function(req, res, next) {
    let list = await databaseProxy.getBlogList(
        1
        ,{_id: mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
        ,{createTime: -1}
        ,1
        ,false
        ,req.userId
    )

    res.render('user/detail', {blog:list.length > 0 ? list[0] : {},current:req.query.current})
})

router.get('/book/:id', async function(req, res, next) {
    let list = await databaseProxy.getBookList(
        1
        ,{_id: mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
        ,{createTime: -1}
        ,1
        ,false
    )
    if (list.length > 0 && list[0].status !== 1) {
        res.render('user/addBook', {book:list.length > 0 ? list[0] : {},current:req.query.current})
    } else {
        res.render('user/viewBook', {book:list.length > 0 ? list[0] : {},current:req.query.current})
    }
})

router.get('/collection', async function(req, res, next) {
    // let list = await databaseProxy.getCollectList(
    //     1
    //     ,{_id: mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
    //     ,{createTime: -1}
    //     ,1
    //     ,false
    // )

    res.render('user/collection')
})

router.post('/checknickname', async function(req, res, next) {
    if (req.body.nickname === '' || req.body.nickname === undefined)
        return res.json(true)
    let cnt = await user.find({nickname:req.body.nickname,_id:{$ne:mongoose.Types.ObjectId(req.userId)}}).count()
    if(cnt === 0) {
        return res.json(true)
    } else {
        return res.json(false)
    }
})

router.post('/saveProfile', async function(req, res, next) {

    if(!fs.existsSync(path.join(uploadPath,'userImage'))){//不存在就创建一个
        fs.mkdirSync(path.join(uploadPath,'userImage'))
    }

    let filePath = req.body.avatar

    if(req.body.avatar !== '' && req.body.avatar.indexOf('data:image') >= 0) {
        let base64Data = req.body.avatar.replace(/^data:image\/\w+;base64,/, "");
        let dataBuffer = new Buffer(base64Data, 'base64');
        let p = path.join(uploadPath,'userImage',req.userId+'.png')
        let error = fs.writeFileSync(p,dataBuffer)
        if (!error) {
            filePath = p.replace(uploadPath,'')
        }
    }

    user.update({_id:mongoose.Types.ObjectId(req.userId)}
        ,{nickname:req.body.nickname
        , phone:req.body.phone
        , sex:Number(req.body.sex)
        , birthday: req.body.birthday
        , email:req.body.email
        , realname:req.body.realname
        , surname:req.body.surname
        , avatar: filePath
    },{new:true}).then(function (data) {
        return res.json({data: data})
    }).catch(function (e) {
        return res.json({error: e.message})
    })
})

router.delete('/timeline/:id', function(req, res, next) {
    let param = JSON.parse(req.query.value)
    param.updateTime = new Date()
    blog.update(
        {_id:mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
        ,param,{new:true}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.delete('/question/:id', function(req, res, next) {
    let param = JSON.parse(req.query.value)
    param.updateTime = new Date()
    question.update(
        {_id:mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
        ,param,{new:true}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.delete('/book/:id', function(req, res, next) {
    let param = JSON.parse(req.query.value)
    param.updateTime = new Date()
    book.update(
        {_id:mongoose.Types.ObjectId(req.params.id),userId: mongoose.Types.ObjectId(req.userId)}
        ,param,{new:true}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.post('/blog/add', async function(req, res, next) {

    let images = req.body.images
    let imgPaths = []

    let str = ''

    if(images && images.length > 0){
        if(!fs.existsSync(path.join(uploadPath,'blogImage'))){//不存在就创建一个
            fs.mkdirSync(path.join(uploadPath,'blogImage'))
        }
        for(let i in images) {
            let base64Data = images[i].replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer = new Buffer(base64Data, 'base64');
            let p = path.join(uploadPath,'blogImage',new Date().getTime() + '.jpeg')
            let error = fs.writeFileSync(p,dataBuffer)
            if (!error) {
                imgPaths.push(p.replace(uploadPath,''))
            }
        }
    }

    if (req.body.shortContent !== undefined && req.body.shortContent !== '') {

        str = decodeURI(req.body.shortContent)

        if(str.length > 200){
            str = encodeURI(str.substring(0, 200))
        } else {
            str = req.body.shortContent
        }
    }

    blog.create({title:req.body.title
            , userId:mongoose.Types.ObjectId(req.userId)
            , viewRange:Number(req.body.viewRange)
            , canShare: Number(req.body.canShare)
            , imgPaths:imgPaths
            , content:req.body.content
            , shortContent: str
        }).then(function (data) {
        return res.json({data: data})
    }).catch(function (e) {
        return res.json({error: e.message})
    })
})

router.post('/blog/update', async function(req, res, next) {

    let images = req.body.images
    let imagePaths = req.body.imagePaths !== '' && req.body.imagePaths !== undefined ? req.body.imagePaths.split(',') : []
    let deletePaths = req.body.deletePaths !== '' && req.body.deletePaths !== undefined ? req.body.deletePaths.split(',') : []
    let imgPaths = []

    let str = ''

    if(images && images.length > 0){
        if(!fs.existsSync(path.join(uploadPath,'blogImage'))){//不存在就创建一个
            fs.mkdirSync(path.join(uploadPath,'blogImage'))
        }
        for(let i in images) {
            let base64Data = images[i].replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer = new Buffer(base64Data, 'base64');
            let p = path.join(uploadPath,'blogImage',new Date().getTime() + '.jpeg')
            let error = fs.writeFileSync(p,dataBuffer)
            if (!error) {
                imgPaths.push(p.replace(uploadPath,''))
            }
        }

        if(imagePaths && imagePaths.length > 0) {
            for (let i in imagePaths) {
                if (imagePaths[i] !== '')
                    fs.unlinkSync(path.join(uploadPath, imagePaths[i]))
            }
        }
    } else {
        imgPaths = imagePaths && imagePaths.length > 0 ? imagePaths : []
    }

    if(deletePaths && deletePaths.length > 0) {
        for (let i in deletePaths) {
            if (deletePaths[i] !== '')
                fs.unlinkSync(path.join(uploadPath, deletePaths[i]))
        }
    }

    if (req.body.shortContent !== undefined && req.body.shortContent !== '') {

        str = decodeURI(req.body.shortContent)

        if(str.length > 200){
            str = encodeURI(str.substring(0, 200))
        } else {
            str = req.body.shortContent
        }
    }

    blog.update({_id: mongoose.Types.ObjectId(req.body.blogId),userId: mongoose.Types.ObjectId(req.userId)}
        ,{title:req.body.title
        , viewRange:Number(req.body.viewRange)
        , canShare: Number(req.body.canShare)
        , imgPaths:imgPaths
        , content:req.body.content
        , shortContent: str
        , updateTime: new Date()
    },{new:true}).then(function (data) {
        console.log(imgPaths)
        return res.json({imgPaths: imgPaths})
    }).catch(function (e) {
        return res.json({error: e.message})
    })
})

router.post('/question/update', async function(req, res, next) {

    let images = req.body.images
    let imagePaths = req.body.imagePaths !== '' && req.body.imagePaths !== undefined ? req.body.imagePaths.split(',') : []
    let deletePaths = req.body.deletePaths !== '' && req.body.deletePaths !== undefined ? req.body.deletePaths.split(',') : []
    let imgPaths = []


    let content = {}

    content.shortContent = req.body.content
    content.longContent = req.body.html

    if(images && images.length > 0){
        if(!fs.existsSync(path.join(uploadPath,'questionImage'))){//不存在就创建一个
            fs.mkdirSync(path.join(uploadPath,'questionImage'))
        }
        for(let i in images) {
            let base64Data = images[i].replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer = new Buffer(base64Data, 'base64');
            let p = path.join(uploadPath,'questionImage',new Date().getTime() + '.jpeg')
            let error = fs.writeFileSync(p,dataBuffer)
            if (!error) {
                imgPaths.push(p.replace(uploadPath,''))
            }
        }

        if(imagePaths && imagePaths.length > 0) {
            for (let i in imagePaths) {
                if (imagePaths[i] !== '')
                    fs.unlinkSync(path.join(uploadPath, imagePaths[i]))
            }
        }
    } else {
        imgPaths = imagePaths && imagePaths.length > 0 ? imagePaths : []
    }

    if(deletePaths && deletePaths.length > 0) {
        for (let i in deletePaths) {
            if (deletePaths[i] !== '')
                fs.unlinkSync(path.join(uploadPath, deletePaths[i]))
        }
    }

    question.update({_id: mongoose.Types.ObjectId(req.body.qid),userId: mongoose.Types.ObjectId(req.userId)}
            ,{title:req.body.title
            , telphone:req.body.telphone
            , username: req.body.username
            , email: req.body.email
            , images:imgPaths
            , type:mongoose.Types.ObjectId(req.body.type)
            , content: content
            , updateTime: new Date()
            , status: 0
        },{new:true}).then(function (data) {
        return res.json({imgPaths: imgPaths})
    }).catch(function (e) {
        return res.json({error: e.message})
    })
})

router.post('/question/add', async function(req, res, next) {

    let images = req.body.images
    let imgPaths = []

    let content = {}

    content.shortContent = req.body.content
    content.longContent = req.body.html

    if(images && images.length > 0){
        if(!fs.existsSync(path.join(uploadPath,'questionImage'))){//不存在就创建一个
            fs.mkdirSync(path.join(uploadPath,'questionImage'))
        }
        for(let i in images) {
            let base64Data = images[i].replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer = new Buffer(base64Data, 'base64');
            let p = path.join(uploadPath,'questionImage',new Date().getTime() + '.jpeg')
            let error = fs.writeFileSync(p,dataBuffer)
            if (!error) {
                imgPaths.push(p.replace(uploadPath,''))
            }
        }
    }

    question.create(
            {title:req.body.title
                ,userId: mongoose.Types.ObjectId(req.userId)
            , telphone:req.body.telphone
            , username: req.body.username
            , email: req.body.email
            , images:imgPaths
            , type:mongoose.Types.ObjectId(req.body.type)
            , content: content
        }).then(function (data) {
        return res.json(data)
    }).catch(function (e) {
        return res.json({error: e.message})
    })
})

router.post('/book/save', async function(req, res, next) {

    let name = req.body.name
    let canShare = req.body.canShare
    let viewRange = req.body.viewRange
    let cover = ''
    let id = req.body.id
    let files = req.body.files

    let paths = []

    if (id !== '' && id !== undefined) {
        var info = await book.findOne({_id:mongoose.Types.ObjectId(id), userId:mongoose.Types.ObjectId(req.userId), status: {$in:[0,-1,-3]}})
        if(info) {
            if (((req.body.cover !== '' && req.body.cover.indexOf('base64') > 0)
                || req.body.cover === ''
                || req.body.cover === undefined) && info.cover !== '') {
                fs.unlinkSync(path.join(uploadPath, info.cover))
            }
            if (info.files.length > 0) {
                let param = {}
                for (let i in files) {
                    let file = files[i]
                    if (file.type === 'image' && file.src.indexOf('base64') < 0 && file.src.indexOf('.jpeg') > 0) {
                        param[file.src.substring(file.src.indexOf('/book'))] = file.src
                    }
                }

                for ( let i in info.files) {
                    let file = info.files[i]
                    if (file.type === 'image') {
                        let tmp = file.src.substring(file.src.indexOf('/book'))
                        if(!param[tmp]) {
                            fs.unlinkSync(path.join(uploadPath, tmp))
                        }
                    }
                }
            }
        } else {
            return res.json({error:'记录不存在'})
        }
    }

    if (req.body.cover !== '') {
        if(!fs.existsSync(path.join(uploadPath,'book'))){//不存在就创建一个
            fs.mkdirSync(path.join(uploadPath,'book'))
        }
        if (req.body.cover.indexOf('base64') > 0 && req.body.cover.indexOf('.jpeg') < 0) {
            let base64Data = req.body.cover.replace(/^data:image\/\w+;base64,/, "");
            let dataBuffer = new Buffer(base64Data, 'base64');
            let p = path.join(uploadPath,'book',new Date().getTime() + '.jpeg')
            let error = fs.writeFileSync(p,dataBuffer)
            if (!error) {
                cover = p.replace(uploadPath,'')
            }
        } else {
            cover = req.body.cover
        }
    }

    for (let i in files) {
        let file = files[i]
        if(file.type === 'image') {
            if(!fs.existsSync(path.join(uploadPath,'book'))){//不存在就创建一个
                fs.mkdirSync(path.join(uploadPath,'book'))
            }
            if (file.src.indexOf('base64') > 0 && file.src.indexOf('.jpeg') < 0) {
                let base64Data = file.src.replace(/^data:image\/\w+;base64,/, "");
                let dataBuffer = new Buffer(base64Data, 'base64');
                let p = path.join(uploadPath,'book',new Date().getTime() + '.jpeg')
                let error = fs.writeFileSync(p,dataBuffer)
                if (!error) {
                    paths.push({type:'image',src:p.replace(uploadPath,''),name:file.name,size:file.size})
                }
            } else {
                paths.push({type:'image',src:file.src.substring(file.src.indexOf('/book')),name:file.name,size:file.size})
            }
        } else {
            paths.push(file)
        }
    }

    if (id !== '') {
        book.update({
            _id:mongoose.Types.ObjectId(id), userId:mongoose.Types.ObjectId(req.userId),status: {$in:[0,-1,-3]}},
            {
                name: name,
                cover: cover,
                files:paths,
                canShare:Number(canShare),
                viewRange:Number(viewRange),
                updateTime: new Date(),
                status:0
            }
        ).then(function (data) {
            return res.json(data)
        }).catch(function (e) {
            return res.json({error:e.message})
        })
    } else {
        book.create(
            {
                name:name
                ,userId: mongoose.Types.ObjectId(req.userId)
                , cover: cover
                , files: paths
                , canShare:Number(canShare)
                , viewRange:Number(viewRange)
            }).then(function (data) {
            return res.json(data)
        }).catch(function (e) {
            return res.json({error: e.message})
        })
    }
})

module.exports = router;
