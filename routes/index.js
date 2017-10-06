var express = require('express');
var router = express.Router();
let user = require('../models/user')
let field = require('../models/field')
let menu = require('../models/menu')
let role = require('../models/role')
let security = require('../util/security')
let test = require('../models/test')
let mongoose = require('mongoose')
let column  = require('../models/column')
let jwt = require('jsonwebtoken')
let index = require('../models/index')
let CryptoJS = require("crypto-js")
let table = require('../models/table')
let databaseProxy = require('../util/databaseProxy')
/* GET home page. */
router.get('/', async function(req, res, next) {
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
    res.render('index',{index: '/', columns: data, grids: grid, userId: userId});
})

router.get('/demo', function(req, res, next) {
    res.render('index-fullscreen-slider',{index: 'current'});
});

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.post('/signIn', async function(req, res, next) {
    let info = await user.aggregate(
        [
            {
                $match: {username: req.body.username}
            }
        ])

    if (info.length === 0) {
        return res.json({error:'账号不存在'})
    } else {
        if (info[0].password !== security.encryptWithSalt(req.body.username, req.body.password)) {
            return res.json({error:'密码错误'})
        } else {
            if (info[0].status !== 1) {
                return res.json({error:'账号异常，无法登录'})
            } else {

                let token = jwt.sign({v:
                    info[0]._id.toString()
                }, secretOrPrivateKey, {
                    expiresIn: '30 days'
                })
                return res.json({token:token, user:JSON.stringify(info[0])})
            }
        }
    }
});

router.get('/morelink', async function(req, res, next) {
    let data = await databaseProxy.getColumnData(1)
    let userId = ''
    if (req.userId) {
        userId = req.userId
    }
    res.render('sitemap',{index: '/', columns: data, userId:userId});
});

router.get('/moreList',async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)

        var tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

        let tableId = await getTableId(param.tablename)

        const fields = await field.find(
            {tableId: tableId._id, status:1, needShow:true}
            ,{name:1,title:1,needSort:1,_id:0}).sort({viewSort:1})

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('more',{fields:fields
            , key: param.key
            , tablename: param.tablename
            , tableId: tableId._id.toString()
            , field: param.field
            , showDetail: true
            , index: '/'
            , columns: data
            , table: tableId.title
            , title: param.key + '姓家谱列表'
            , userId: userId
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

async function getTableId(tableName) {

    let info = await table.findOne({name:tableName,status:1})

    return info
}

router.get('/default', function(req, res, next) {
    res.render('default')
})

router.post('/login', async function(req, res, next) {
    let info = await admin.aggregate(
    [
        {
            $lookup:
            {
                from: 'roles',
                localField: 'roleId',
                foreignField: '_id',
                as: 'rolename'
            }
        },
        {
            $match: {username: req.body.name}
        },
        {
          $project:
          {
              username: 1,
              roleId: 1,
              status: 1,
              password: 1,
              menus: {$arrayElemAt: [ '$rolename.menus', 0 ]},
              roleName: {$arrayElemAt: [ '$rolename.name', 0 ]}
          }
        }
    ])

    if (info.length === 0) {
        return res.json({error:'账号不存在'})
    } else {
        if (info[0].password !== security.encryptWithSalt(req.body.name, req.body.password)) {
            return res.json({error:'密码错误'})
        } else {
            if (info[0].status !== 1) {
                return res.json({error:'账号异常，无法登录'})
            } else {
                var menus = await menu.find(
                    {_id: {$in:info[0].menus}, status:1}
                ).select({name:1,_id:0,url:1}).sort({sort:1})

                let token = jwt.sign({v:
                    info[0]._id.toString(),r:info[0].roleId
                }, secretOrPrivateKey, {
                    expiresIn: '30 days'
                })
                return res.json({token:token, admin:JSON.stringify(info[0]), menus: JSON.stringify(menus)})
            }
        }
    }
})

router.get('/index', async (req, res, next) => {
    let info = await role.aggregate(
    [
        {
            $unwind:'$menus'
        },
        {
            $lookup:
            {
                from: 'menus',
                localField: 'menus',
                foreignField: '_id',
                as: 'info'
            }
        },
        {
            $lookup:
            {
                from: 'admins',
                localField: '_id',
                foreignField: 'roleId',
                as: 'admin'
            }
        },
        {
            $match: {_id: mongoose.Types.ObjectId(req.roleId)}
        },
        {
            $unwind: '$info'
        },
        {
            $group:
            {
                _id: '$_id',
                roleName: {$first: '$name'},
                list: {
                    $push: {
                        name:'$info.name',
                        icon:'$info.icon',
                        url:'$info.url',
                        status:'$info.status',
                        sort:'$info.sort'
                    }},
                admin: {
                    $first:
                    {
                        $filter: {
                            input: '$admin',
                            as: 'num',
                            cond: { $eq: [ '$$num._id', mongoose.Types.ObjectId(req.adminId)]}
                        }
                    }
                }
            }
        },
        {
            $project:
            {
                roleName: 1,
                menus: {
                    $filter: {
                        input: '$list',
                        as: 'num',
                        cond: { $eq: [ '$$num.status', 1 ]}
                    }
                },
                admin: { $arrayElemAt: [ '$admin.username', 0 ]},
                _id: 0
            }
        },
        {
            $sort:{
                sort:1
            }
        }
    ])

    res.render('index', {
        menus: info.length > 0 ? info[0].menus : [],
        adminName: info.length > 0 ? info[0].admin : '',
        roleName: info.length > 0 ? info[0].roleName : ''
    })
})

router.get('/main', function(req, res, next) {
    res.write('<script language=\'javascript\'>window.parent.location.href=\'/index\'</script>');
    res.end()
})

module.exports = router;
