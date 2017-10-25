const express = require('express');
const router = express.Router();
const admin = require('../models/admin')
const role = require('../models/role')
const security = require('../util/security')
const mongoose = require('mongoose')

router.get('/', async function(req, res, next) {
    try{
        let roles = await role.find()
        let data = {
            roles: roles,
            headTitle: '系统账户管理',
            searchHolder: '请输入账户名/角色名....',
            headBtnId: 'addAdmin',
            headBtnTitle: '创建系统账户',
            headMode:'addAdminModal'
        }
        res.render('admin',data)
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

router.get('/list',async function(req, res, next) {
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

router.post('/save', function(req, res, next) {
    admin.create({
        username:req.body.username,
        password:security.encryptWithSalt(req.body.username, req.body.password),
        roleId:req.body.roleId
    }).then(function (error,result) {
        if(!error){
            return res.json({statusCode:200})
        } else {
            return res.json({statusCode:201,error:error.message})
        }
    }).catch(function (e) {
        return res.json({statusCode:201,error:e.message})
    })
})

router.put('/reset/:adminId', function(req, res, next) {
    admin.update(
        {_id: mongoose.Types.ObjectId(req.params.adminId)}
        ,{password:security.encryptWithSalt(req.params.adminId, '123456')}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.delete('/:adminId', function(req, res, next) {
    admin.remove(
        {_id:mongoose.Types.ObjectId(req.params.adminId)}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.post('/checkAdminName', function(req, res, next) {
    admin.findOne({username:req.body.name}).then(function (data) {
        if (!data){
            return res.json(true)
        } else {
            return res.json(false)
        }
    })
})

router.get('/setStatus/:adminId/:status', function(req, res, next) {
    admin.update(
        {_id:mongoose.Types.ObjectId(req.params.adminId)}
        ,{status:req.params.status}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

async function getPaperData(current, limit, sort, key) {

    let param = {'username': {$regex: key}}

    let count = await admin.count(param)

    let info = []

    if (count !== 0) {

        info = await admin.aggregate(
            [
                {
                    $lookup:
                    {
                        from: 'roles',
                        localField: 'roleId',
                        foreignField: '_id',
                        as: 'roles'
                    }
                },
                {

                    $match: param
                },
                {
                    $project:
                    {
                        username: 1,
                        roleId: 1,
                        status: 1,
                        password: 1,
                        statusName: {
                            $cond: { if: {$eq: [ "$status", 1]},
                                then: '正常',
                                else: '冻结'}
                        },
                        roleName: {$arrayElemAt: [ '$roles.name', 0 ]},
                        menus: {$arrayElemAt: [ '$roles.menus', 0 ]}
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
