let express = require('express')
let router = express.Router()
let role = require('../models/role')
let field = require('../models/field')
let table = require('../models/table')
let mongoose = require('mongoose')
let test = require('../models/test')
let fs = require('fs')
let column  = require('../models/column')
let child = require('../models/child')
let area = require('../models/area')
let CryptoJS = require("crypto-js")
let sizeOf = require('image-size')
let path = require('path')
let databaseProxy = require('../util/databaseProxy')

router.get('/',async function(req, res, next) {
    let data = await databaseProxy.getColumnData(1)
    let column = {}, child = []
    if (data.length > 0) {
        for(var i in data) {
            if(data[i].url === '/data') {
                column = data[i]
                break
            }
        }
    }
    if (column._id !== undefined) {
        child = await getChildData(column._id.toString())
    }

    if (child.length > 0) {
        for (let i in child) {
            if (child[i].showMode === 'group') {
                for (let j in child[i].groupFields) {
                    let obj = child[i].groupFields[j]
                    let tid = await getTableId(child[i].childTable)
                    let result = await getField(child[i].childTable)
                    obj.fields = result.length > 0 ? result[0].fields : []
                    obj.showDetail = result.length > 0 ? result[0].showDetail : false
                    if (obj.groupType === 'name') {
                        obj.datas = await initNameGroup(child[i].childTable, {}, obj.name, tid)
                    } else if (obj.groupType === 'area') {
                        obj.datas = await initLocationGroup(child[i].childTable, {}, obj.name, tid)
                    } else if (obj.groupType === 'field') {
                        obj.datas = await initFieldGroup(child[i].childTable, {}, obj.name, tid)
                    }
                }
            }
        }
    }

    let location = await area.find()
    let userId = ''
    if (req.userId) {
        userId = req.userId
    }
    res.render('data/center',{current: '/data', columns: data, column: column, childs: child, names: names, locations: location,userId:userId})
})

router.get('/subList',async function(req, res, next) {
    try{
        let data = await getTableList(
            req.query.page
            ,req.query.limit
            ,req.query.key === undefined ? {} : req.query.key
            ,req.query.sort === undefined ? {_id: 1} : req.query.sort
            ,req.query.tableId
            ,req.query.tableName
        )
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/mapList',async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        let column = {}
        if (data.length > 0) {
            for(var i in data) {
                if(data[i].url === '/data') {
                    column = data[i]
                    break
                }
            }
        }

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

        res.render('data/location',{fields:fields
            , key: JSON.stringify({ $near : [Number(param.lng),Number(param.lat)] , $maxDistance : 5 })
            , tablename: param.tablename
            , tableId: tableId._id.toString()
            , field: 'location'
            , showDetail: true
            , current: '/data'
            , columns: data
            , column: column
            , childs: column.childs
            , table: tableId.title
            , navTitle: param.navTitle
            , title: param.title.substring(param.title.indexOf('-') + 1)
            , userId: userId
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/locationList',async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        let column = {}
        if (data.length > 0) {
            for(var i in data) {
                if(data[i].url === '/name') {
                    column = data[i]
                    break
                }
            }
        }

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
        res.render('data/location',{fields:fields
            , key: JSON.stringify({ $near : [Number(param.lng),Number(param.lat)] , $maxDistance : 5 })
            , tablename: param.tablename
            , tableId: tableId._id.toString()
            , field: 'location'
            , showDetail: true
            , current: '/name'
            , columns: data
            , column: column
            , childs: column.childs
            , table: tableId.title
            , navTitle: param.navTitle
            , title: param.title.substring(param.title.indexOf('-') + 1)
            , userId: userId
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/viewLocationList',async function(req, res, next) {
    try{
        if(req.query.key && req.query.key.location) {
            req.query.key.location = { $near : [Number(req.query.key.location['$near'][0]),Number(req.query.key.location['$near'][1])] , $maxDistance : 5 }
        }
        let data = await getTableListByLocation(
            req.query.page
            ,req.query.limit
            ,req.query.key === undefined ? {} : req.query.key
            ,req.query.sort === undefined ? {_id: 1} : req.query.sort
            ,req.query.tableId
            ,req.query.tablename
        )

        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/viewList',async function(req, res, next) {
    try{
        let data = await getTableListByArea(
            req.query.page
            ,req.query.limit
            ,req.query.key === undefined ? {} : req.query.key
            ,req.query.sort === undefined ? {_id: 1} : req.query.sort
            ,req.query.tableId
            ,req.query.tablename
        )

        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/pageData',async function(req, res, next) {
    try{

        let param = {}

        let tableInfo = await getTableId(req.query.tablename)

        let detail = await getChildDetail(tableInfo.name)

        if (detail.length > 0 && detail[0].child.refFile) {
            param.query = {
                refTable: detail[0].child.refTable,
                mainField: detail[0].child.mainField,
                refField: detail[0].child.refField
            }
        } else {
            param.query = null
        }

        let result = await getPageDetail(tableInfo._id.toString(), tableInfo.name, param.query, JSON.parse(req.query.key))

        res.render('data/page',{
            detail: detail.length > 0 ? detail[0] : {}
            ,main: result
            ,tableInfo:tableInfo
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/subList/:tablename/:field',async function(req, res, next) {
    try{
        let tableId = await getTableId(req.params.tablename)

        let data = await getTableList(
            req.query.page
            ,req.query.limit
            ,req.query.key === undefined ? {} : JSON.parse(req.query.key)
            ,req.query.sort === undefined ? {_id: 1} : req.query.sort
            ,tableId._id.toString()
            ,req.params.tablename
        )

        data.group = await initNameGroup(req.params.tablename
            , req.query.key === undefined ? {} : JSON.parse(req.query.key)
            , req.params.field
            ,tableId)
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/areaSubList/:tablename/:field',async function(req, res, next) {
    try{
        let tableId = await getTableId(req.params.tablename)

        let data = await getTableList(
            req.query.page
            ,req.query.limit
            ,req.query.key === undefined ? {} : JSON.parse(req.query.key)
            ,req.query.sort === undefined ? {_id: 1} : req.query.sort
            ,tableId._id.toString()
            ,req.params.tablename
        )

        data.group = await initNameGroup(req.params.tablename
            , req.query.key === undefined ? {} : JSON.parse(req.query.key)
            , req.params.field
            ,tableId)
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.get('/index/detail', async function (req, res, next) {
    try{
        let tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

        let data = await databaseProxy.getColumnData(1)
        let column = {}

        let tableInfo

        if (param.tableId === undefined || param.tableId === '') {
            tableInfo = await getTableId(param.tablename)
        } else {
            tableInfo = await getTableInfo(param.tableId)
        }

        let detail = await getChildDetail(tableInfo.name)

        if (detail.length > 0 && detail[0].child.refFile) {
            param.query = {
                refTable: detail[0].child.refTable,
                mainField: detail[0].child.mainField,
                refField: detail[0].child.refField
            }
        } else {
            param.query = null
        }

        let result = await getTableListDetail(tableInfo._id.toString(), tableInfo.name, param.query, param.key)

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('data/detail',{
            index: '/'
            ,columns: data
            ,tableInfo: tableInfo
            ,detail: detail.length > 0 ? detail[0] : {}
            ,title: ''
            ,main: result
            ,userId: userId
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/showDetail', async function (req, res, next) {
    try{
        let tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

        let data = await databaseProxy.getColumnData(1)
        let column = {}
        if (data.length > 0) {
            for(var i in data) {
                if(data[i].url === '/data') {
                    column = data[i]
                    break
                }
            }
        }

        let tableInfo

        if (param.tableId === undefined || param.tableId === '') {
            tableInfo = await getTableId(param.tablename)
        } else {
            tableInfo = await getTableInfo(param.tableId)
        }

        let detail = await getChildDetail(tableInfo.name)

        if (detail.length > 0 && detail[0].child.refFile) {
            param.query = {
                refTable: detail[0].child.refTable,
                mainField: detail[0].child.mainField,
                refField: detail[0].child.refField
            }
        } else {
            param.query = null
        }

        let result = await getTableListDetail(tableInfo._id.toString(), tableInfo.name, param.query, param.key)

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('data/detail',{
            current: '/data'
            ,columns: data
            ,column: column
            ,childs: column.childs
            ,tableInfo: tableInfo
            ,detail: detail.length > 0 ? detail[0] : {}
            ,title: param.title
            ,main: result
            ,userId: userId
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

// router.get('/groupByLocation',async function(req, res, next) {
//     try{
//         let data = await getLocationGroupData(
//             req.query.page
//             ,req.query.limit
//             ,req.query.key === undefined ? '' : req.query.key
//             ,req.query.sort
//         )
//         res.render('data/areagroup', data)
//     } catch (e) {
//         res.render('error', e.message)
//     }
// })

router.get('/getField/:tablename',async function(req, res, next) {
    try{
        let data = await table.find(
            {
                name: req.params.tablename
                ,status: 1
            }
        ).sort({viewSort:1})
        return res.json({data: data})
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/getField',async function(req, res, next) {
    try{

        let info = await getField(req.query.tablename)

        return res.json({info:info.length > 0 ? info[0] : {}})
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/refList',async function(req, res, next) {
    try{

        let data = await getRefTableList(
            req.query.page
            ,req.query.limit
            ,req.query.sort
            ,req.query.tableName
            ,req.query.refField
            ,req.query.value
            ,req.query.showField
            ,req.query.notId
        )
        return res.json(data)
    } catch (e) {
        return res.json({error: e.message})
    }
})

router.get('/showFile', async function (req, res, next) {
    try {
        var tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

        let info = await getFileDetail(param)
        let size = {
            width: 0,
            height: 0
        }

        let paths = []
        let newInfo = []

        if (info.length !== 0) {
            newInfo = info
            let newPaths = []
            if (info[0].paths.length > 0) {

                size = sizeOf(uploadPath + '/' + info[0].paths[0])
                if (size.height > size.width) {
                    paths.push(info[0].paths[0])
                    newPaths.push(info[0].paths[0])
                }
            }

            let tmp = ''
            let dir = ''
            let check = 0

            for (let i in info) {
                for (let j in info[i].paths) {
                    if (size.height > size.width) {
                        if (Number(j) !== 0 && Number(j) !== info[i].paths.length - 1) {
                            paths.push(info[i].paths[j])
                            newPaths.push(info[i].paths[j])
                        } else if (Number(j) === info[i].paths.length - 1){
                            if ((info[i].paths.length - 2) % 2 !== 0) {
                                paths.push(info[i].paths[j])
                                newPaths.push(info[i].paths[j])
                            }
                        }
                    } else {
                        if (Number(i) === 0 && Number(j) === 0) {
                            paths.push('../img/fengmian.jpg')
                        }
                        let lastIndex = info[i].paths[j].lastIndexOf('-0')
                        let name = info[i].paths[j].substring(0, lastIndex) + '-right-' + j + '.jpg'
                        let name1 = info[i].paths[j].substring(0, lastIndex) + '-left-' + j + '.jpg'
                        paths.push(name)
                        paths.push(name1)
                        // if (check === 0) {
                        //     let name = info[i].paths[j].split('/')
                        //     for (let m in name) {
                        //         dir+= name[m]
                        //         tmp = path.join(uploadPath, dir, 'left-'+ j + '.jpg')
                        //         if (fs.syncExists(tmp)) {
                        //             paths.push(path.join(name[m], 'left-'+ j + '.jpg'))
                        //             paths.push(path.join(name[m], 'right-'+ j + '.jpg'))
                        //             dir = ''
                        //             check = 1
                        //             break
                        //         }
                        //     }
                        // } else {
                        //     paths.push(path.join(tmp, 'left-'+(Number(j) - 1)))
                        //     paths.push(path.join(tmp, 'right-'+(Number(j) - 1)))
                        // }
                    }
                }
                if (size.height > size.width && Number(i) !== info.length - 1) {
                    newInfo[i].paths = newPaths
                    newPaths = []
                }
            }
            if (info[0].paths.length > 0) {
                if (size.height > size.width) {
                    newPaths.push(info[0].paths[info[0].paths.length - 1])
                    newInfo[newInfo.length - 1].paths = newPaths
                    info = newInfo
                } else {
                    paths.push('../img/fengmian.jpg')
                }
            }
        }

        let data = await databaseProxy.getColumnData(1)
        let column = {}
        if (data.length > 0) {
            for(var i in data) {
                if(data[i].url === '/data') {
                    column = data[i]
                    break
                }
            }
        }

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        if (size.height > size.width) {
            res.render('data/view',{current: '/data', columns: data, column: column, childs: column.childs,infos:info,paths: paths, w:size.width,h:size.height, is_Horizontal:false, userId: userId})
        } else {
            res.render('data/view',{current: '/data', columns: data, column: column, childs: column.childs,infos:info,paths: paths, w:Math.round(size.width / 2),h:size.height, is_Horizontal: true, userId: userId})
        }
        // res.render('data/view',{current: '/data', columns: data, column: column, childs: column.childs,infos:info,paths: paths, w:size.width,h:size.height})
    } catch (e) {
        res.render('error', e.message)
    }
})

router.get('/refPageData', async function (req, res, next) {
    try {
        let tableInfo = await getTableId(req.query.tablename)
        let fields = await getRefPageField(req.query.tablename, req.query.showField.split(','))
        let result = await getRefPageData(req.query.value, req.query.refField, req.query.tablename, tableInfo._id.toString(), req.query.showField)
        res.render('data/refPage',{refData: result, refFields: fields})
    } catch (e) {
        res.render('error', e.message)
    }
})

async function getTableListDetail(tableId, tableName, param, key) {

    if (param !== null) {
        const schema = await test.getSchema(tableId, tableName)

        const mainFields = await field.find(
        {
            tableId: mongoose.Types.ObjectId(tableId.toString()), status:1
        },{_id:0,name:1,title:1,needShow:1,needQuery:1}).sort({viewSort:1})

        let project = {
            cnt: {$size:{
                $filter: {
                    input: '$children',
                    as: 'num',
                    cond: { $eq: [ '$$num.status', 1 ]}
                    }
                }
            }
        }

        for (let i in mainFields) {
            project[mainFields[i].name] = 1
        }

        let main = await schema.aggregate([
        {

            $lookup:
            {
                from: param.refTable,
                localField: param.mainField,
                foreignField: param.refField,
                as: 'children'
            }
        },
        {
            $match: {_id:mongoose.Types.ObjectId(key), status: 1}
        },
        {
            $project: project
        }])

        return {info: main.length > 0 ? main[0] : {}, fields:mainFields}
    } else {
       return await getDataByTableName({_id:mongoose.Types.ObjectId(key)}, tableName, tableId)
    }
}

async function getPageDetail(tableId, tableName, param, key) {

    if (param !== null) {
        const schema = await test.getSchema(tableId, tableName)

        const mainFields = await field.find(
        {
            tableId: mongoose.Types.ObjectId(tableId.toString()), status:1
        },{_id:0,name:1,title:1,needShow:1,needQuery:1,hasFile:1,refTable:1}).sort({viewSort:1})

        let project = {
            cnt: {$size:{
                $filter: {
                    input: '$children',
                    as: 'num',
                    cond: { $eq: [ '$$num.status', 1 ]}
                }
            }
            }
        }

        key.status = 1

        for (let i in mainFields) {
            project[mainFields[i].name] = 1
        }

        let main = await schema.aggregate([
            {

                $lookup:
                {
                    from: param.refTable,
                    localField: param.mainField,
                    foreignField: param.refField,
                    as: 'children'
                }
            },
            {
                $match: key
            },
            {
                $project: project
            }])

        return {info: main.length > 0 ? main[0] : {}, fields:mainFields}
    } else {
        return await getDataByTableName(key, tableName, tableId)
    }
}

async function getFileDetail(query) {

    let tid = await getTableId(query.refTable)

    let param = {status: 1}
    param[query.refField] = query.value

    const schema = await test.getSchema(tid._id.toString(), query.refTable)

    const refFields = await field.find(
        {
            tableId: mongoose.Types.ObjectId(tid._id.toString()), status:1, needShow: true
        },{
            _id:0,name:1,title:1
        }).sort({viewSort:1})

    let refProject = {
        paths:{
            $map:
            {
                input: "$paths",
                as: "path",
                in:{ $concat:[{$arrayElemAt:[ { $split: [ "$$path", "." ]}, 0 ] },'-1.jpg']}
            }
            },children:1,index:{$size: '$paths'}
    }

    for (let i in refFields) {
        refProject[refFields[i].name] = 1
    }

    let main = await schema.aggregate([
    {
        $match: param
    },
    {
        $project: refProject
    }, {$sort: {_id:1}}])

    return main
}

async function getDataByTableName(key, tablename, tableId) {
    const schema = await test.getSchema(tableId, tablename)

    const fields = await field.find(
        {
            tableId: mongoose.Types.ObjectId(tableId)
            ,status:1
        },{_id:0,name:1,title:1,needShow:1,needQuery:1,hasFile:1,refTable:1}).sort({viewSort:1})

    let lookups = []
    let project = {}
    let fileField = ''
    key.status = 1

    for (let i = 0;i < fields.length;i++) {
        project[fields[i].name] = 1
        if (fields[i].hasFile) {
            fileField = fields[i].name
        }
    }
    lookups.push({$match:key})
    lookups.push({$project:project})
    let info = await schema.aggregate(lookups)
    return {info: info.length > 0 ? info[0] : {}, fields:fields}
}

async function getRefPageData(key, field, tablename, tableId, showField) {
    const schema = await test.getSchema(tableId, tablename)
    let lookups = []
    let project = {}
    let query = {}
    let ary = showField.split(',')
    query[field] = key
    query.status = 1

    for (let i = 0;i < ary.length;i++) {
        project[ary[i]] = 1
    }
    lookups.push({$match:query})
    lookups.push({$project:project})
    let info = await schema.aggregate(lookups)
    return info.length > 0 ? info[0] : {}
}

async function getTableInfo(tableId) {

    let info = await table.findOne({_id:mongoose.Types.ObjectId(tableId),status:1})

    return info
}

async function getTableList(current, limit, key, sort, tableId, tableName) {

    let result = []

    const schema = await test.getSchema(tableId, tableName)

    const fields = await field.find(
        {tableId: mongoose.Types.ObjectId(tableId), status:1}
        ,{refField:1,refTable:1,_id:0,name:1}).sort({viewSort:1})

    key.status = 1

    let count = await schema.count(key)
    let lookups = []
    let project = {paths:1,children:1}

    if (count !== 0) {
        for (let i = 0;i < fields.length;i++) {
            if (fields[i].refTable !== '') {
                lookups.push({
                    $lookup:
                    {
                        from: fields[i].refTable,
                        localField: fields[i].name,
                        foreignField: fields[i].refField,
                        as: fields[i].refTable
                    }
                })
                project[fields[i].refTable] = {$size: "$"+fields[i].refTable}
            }
            project[fields[i].name] = 1
        }
        lookups.push({$match:key})
        lookups.push({$project:project})
        result = await schema.aggregate(lookups).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: result,
        total: count
    }
}

async function getRefTableList(current, limit, sort, tablename, field, value, showField, notId) {

    let result = []
    let tid = await getTableId(tablename)
    const schema = await test.getSchema(tid._id.toString(), tablename)

    let query = {}
    query[field] = value
    query._id = {$ne: mongoose.Types.ObjectId(notId)}
    query.status = 1
    let count = await schema.count(query)
    let lookups = []
    let project = {}

    if (count !== 0) {
        for (let i = 0;i < showField.length;i++) {
            project[showField[i]] = 1
        }
        lookups.push({$match:query})
        lookups.push({$project:project})
        result = await schema.aggregate(lookups).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: result,
        total: count
    }
}

async function getTableListByArea(current, limit,key,sort,tableId,tablename) {
    let result = []

    const schema = await test.getSchema(tableId, tablename)

    key.status = 1

    let count = await schema.count(key)
    let lookups = []
    let project ={}

    const fields = await field.find(
        {tableId: mongoose.Types.ObjectId(tableId), status:1, needShow: true}
        ,{_id:0,name:1}).sort({viewSort:1})

    if (count !== 0) {
        for (let i = 0;i < fields.length;i++) {
            project[fields[i].name] = 1
        }

        lookups.push({$match:key})
        lookups.push({$project:project})
        result = await schema.aggregate(lookups).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: result,
        total: count
    }
}

async function getTableListByLocation(current, limit,key,sort,tableId,tablename) {
    let result = []

    const schema = await test.getSchema(tableId, tablename)

    key.status = 1

    let count = await schema.count(key)
    let project ={}

    const fields = await field.find(
        {tableId: mongoose.Types.ObjectId(tableId), status:1, needShow: true}
        ,{_id:0,name:1}).sort({viewSort:1})

    if (count !== 0) {
        for (let i = 0;i < fields.length;i++) {
            project[fields[i].name] = 1
        }
        result = await schema.find(key,project).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: result,
        total: count
    }
}

async function getTableId(tableName) {

    let info = await table.findOne({name:tableName,status:1})

    return info
}

async function getNameGroupData(tableId, tableName, key, field) {

    if (key[field] === undefined) {
        key[field] =  {$exists: true, $ne:''}
    }

    key.status = 1
    let group = {}
    group.pinyin = '$pinyin'
    group.surname = "$" + field

    const schema = await test.getSchema(tableId, tableName)

    let count = await schema.count(key)

    let result = []

    if (count !== 0) {
        result = await schema.aggregate([
            {
                $match:key
            },
            {
                $group:
                {
                    _id: group
                }
            },
            {
                $group:
                {
                    _id:'$_id.pinyin'
                    ,surname:{$push:'$_id.surname'}
                }
            },
            {
                $sort:{_id: 1}
            },
            {
                $project:
                {
                    _id:1
                    ,surname:1
                    ,cnt:{$size:'$surname'}
                }
            },
            {
                $match:{cnt:{$ne: 0}}
            }
            ]
        )
    }
    return result
}

async function getLocationGroupData(tableId, tableName, key, field) {

    if (key[field] === undefined) {
        key[field] =  {$exists: true, $ne:''}
    }

    key.status = 1
    key.simplePlace = {$exists: true, $ne:''}

    const schema = await test.getSchema(tableId, tableName)

    let count = await schema.count(key)

    let result = []

    if (count !== 0) {
        result = await schema.aggregate([
                {
                    $match:key
                },
                {
                    $group:
                    {
                        _id: '$simplePlace',
                        location: {$first: '$location'},
                        cnt:{$push:
                            {
                                '_id': '$_id'
                            }
                        }
                    }
                },
                {
                    $sort:{_id: 1}
                },
                {
                    $project:
                    {
                        _id:1
                        ,location:1
                        ,cnt:{$size:'$cnt'}
                    }
                },
                {
                    $match:{cnt:{$ne: 0}}
                }
            ]
        )
    }

    let datas = []

    if (result.length !== 0) {
        let param = {}
        for (let i in result) {
            param[result[i]._id] = {location:result[i].location, cnt:result[i].cnt}
        }

        let areas = await area.find()

        for (let i in areas) {
            let obj = areas[i]
            // console.log(obj.province)
            let tmp = null
            if (param[obj.province]) {
                tmp = {
                    name: obj.province,
                    location: param[obj.province].location,
                    citys:[]
                }
            }
            for (let m in obj.citys) {
                let citys = null
                let city = obj.citys[m]
                if (typeof city === 'string') {
                    break
                }
                if (param[city.cityName]) {
                    if (!tmp) {
                        tmp = {
                            name: obj.province,
                            location: param[obj.province].location,
                            city:[]
                        }
                    }
                    citys = {
                        name:city.cityName,
                        location:param[city.cityName].location,
                        countys:[]
                    }
                }
                // console.log(city.cityName,city.countys.length)
                if ( typeof city.countys !== 'string' && city.countys.length !== 0) {
                    for (let n in city.countys) {
                        let county = city.countys[n]
                        if (param[county.countyName]) {
                            // console.log(param[county.countyName],county.countyName)
                            if (!tmp) {
                                tmp = {
                                    name: obj.province,
                                    location: obj.location,
                                    citys:[]
                                }
                            }
                            if (!citys) {
                                citys = {
                                    name:city.cityName,
                                    location:city.location,
                                    countys:[]
                                }
                            }
                            citys.countys.push({
                                name:county.countyName,
                                location:param[county.countyName].location
                            })
                        }
                    }
                }
                if (citys) {
                    if (!tmp) {
                        tmp = {
                            name: obj.province,
                            location: obj.location,
                            citys:[]
                        }
                    }
                    tmp.citys.push(citys)
                }
            }
            if (tmp) {
                datas.push(tmp)
            }
        }
    }
    return datas
}

async function getFieldGroupData(tableId, tableName, key, field) {

    if (key[field] === undefined) {
        key[field] =  {$exists: true, $ne:''}
    }

    key.status = 1

    const schema = await test.getSchema(tableId, tableName)

    let count = await schema.count(key)

    let result = []

    if (count !== 0) {
        result = await schema.aggregate([
                {
                    $match:key
                },
                {
                    $group:
                    {
                        _id: '$' + field,
                        cnt:{
                            $push:
                            {
                                '_id': '$_id'
                            }
                        }
                    }
                },
                {
                    $sort:{_id: 1}
                },
                {
                    $project:
                    {
                        _id:1
                        ,cnt:{$size:'$cnt'}
                    }
                },
                {
                    $match:{cnt:{$ne: 0}}
                }
            ]
        )
    }
    return result
}

async function getRefField(tableName) {
    let info = await field.aggregate([
        {
            $lookup:
                {
                    from: 'tables',
                    localField: 'tableId',
                    foreignField: '_id',
                    as: 'table'
                }
        },
        {
            $unwind:'$table'
        },
        {
            $match: { status : 1,'table.name': req.query.tableName }
        },{
            $project:
                {
                    value:'$name',
                    text:'$title',
                    _id:0
                }
        }
    ])

    return info
}

async function getRefPageField(tableName, key) {
    let info = await field.aggregate([
        {
            $lookup:
                {
                    from: 'tables',
                    localField: 'tableId',
                    foreignField: '_id',
                    as: 'table'
                }
        },
        {
            $unwind:'$table'
        },
        {
            $match: { status : 1,'table.name': tableName, name : {$in: key} }
        },{
            $project:
                {
                    value:'$name',
                    text:'$title',
                    _id:0
                }
        }
    ])

    return info
}

async function getChildDetail(tablename) {

   return await column.aggregate(
    [
        {
            $unwind: '$childs'
        },
        {
            $match:{status: 1, 'childs.childTable' : tablename}
        },
        {
            $project:
            {

                cid:'$childs._id',
                childTable:'$childs.childTable',
                _id:0
            }
        },
        {
            $lookup:
            {
                from: 'children',
                localField: 'cid',
                foreignField: 'columnId',
                as: 'childs'
            }
        },
        {
            $project:
            {

                cid:1,
                childTable:1,
                child:{$arrayElemAt: [ '$childs.detail', 0 ]},
                refTables:{$arrayElemAt: [ '$childs.refTables', 0 ]}
            }
        }
    ])
}

async function getField(tablename) {
    let info = await table.aggregate([
        {
            $lookup:
                {
                    from: 'fields',
                    localField: '_id',
                    foreignField: 'tableId',
                    as: 'fields'
                }
        },
        {
            $unwind: '$fields'
        },
        {
            $match:
                {
                    status : 1,
                    name : tablename,
                    'fields.status': 1,
                    $or: [ {"fields.needShow": true }, {"fields.needQuery": true }
                    ,{"fields.refTable": {$ne:''}}
                    ,{"fields.hasFile": true } ]
                }
        },
        {
            $sort:{'fields.viewSort':1}
        },
        {
            $group:
            {
                _id: '$_id',
                title: {$first: '$title'},
                name: {$first: '$name'},
                fields: {$push:
                    {
                        'name': '$fields.name',
                        'needSort': '$fields.needSort',
                        'title': '$fields.title',
                        'refField': '$fields.refField',
                        'refTable': '$fields.refTable',
                        'needShow': '$fields.needShow',
                        'hasFile': '$fields.hasFile',
                        '_id':'$fields._id'
                    }
                }
            }
        }
    ])
    let columns = await column.aggregate([
        {
            $unwind: '$childs'
        },

        {
            $match:{'childs.childTable':tablename}
        },
        {
            $project:{
                columnId:'$childs._id',
                childTable:'$childs.childTable',
                _id:0
            }
        },
        {
            $lookup:
                {
                    from: 'children',
                    localField: 'columnId',
                    foreignField: 'columnId',
                    as: 'sub'
                }
        },{
            $project:{
                columnId:1,
                childTable:1,
                showDetail:{$arrayElemAt: [ '$sub.showDetail', 0 ]},
                _id:0
            }
        }])

    if (columns.length > 0){
        for(var i in info) {
            if(info[i].name.toString() === columns[0].childTable){
                info[i].showDetail = columns[0].showDetail
            }
        }
    }
    return info
}

async function initNameGroup(tableName, key,field, tid) {
    try{

        let data = []
        if (tid) {
            data = await getNameGroupData(
                tid._id.toString()
                , tableName
                , key
                , field
            )
        }
        return data
    } catch (e) {
        console.log(e.message)
        return []
    }
}

async function initLocationGroup(tableName, key,field, tid) {
    try{
        let data = []
        if (tid) {
            data = await getLocationGroupData(
                tid._id.toString()
                , tableName
                , key
                , field
            )
        }
        return data
    } catch (e) {
        console.log(e.message)
        return []
    }
}

async function initFieldGroup(tableName, key,field, tid) {
    try{
        let data = []
        if (tid) {
            data = await getFieldGroupData(
                tid._id.toString()
                , tableName
                , key
                , field
            )
        }
        return data
    } catch (e) {
        console.log(e.message)
        return []
    }
}

async function getChildData(columnId) {

    return await column.aggregate(
        [
            {
                $match:{status: 1, _id : mongoose.Types.ObjectId(columnId), childs:{$exists:true}}
            },
            {
                $unwind: '$childs'
            },
            {
                $project:
                {
                    childName:'$childs.childName',
                    cid:'$childs._id',
                    childTable:'$childs.childTable',
                    sort:'$childs.sort',
                    _id:1,
                }
            },
            {
                $lookup:
                {
                    from: 'children',
                    localField: 'cid',
                    foreignField: 'columnId',
                    as: 'childs'
                }
            },
            {
                $project:
                {
                    childName:1,
                    cid:1,
                    childTable:1,
                    sort:1,
                    childs:{$arrayElemAt: [ '$childs', 0 ]}
                }
            },
            {
                $sort:{sort:1}
            },{
            $project:
                {
                    childName:1,
                    cid:1,
                    childTable:1,
                    sort:1,
                    normalSearch:{
                        $filter: {
                            input: '$childs.searchs',
                            as: 'num',
                            cond: { $eq: [ '$$num.searchMode', 'normal' ]}
                        }
                    },
                    highSearch:{
                        $filter: {
                            input: '$childs.searchs',
                            as: 'num',
                            cond: { $eq: [ '$$num.searchMode', 'high' ]}
                        }
                    },
                    detail:'$childs.detail',
                    groupFields:'$childs.groupFields',
                    showDetail:'$childs.showDetail',
                    showMode:'$childs.showMode',
                    hasRef:'$childs.hasRef',
                    showSearch:'$childs.showSearch'
                }
            }
        ]
    )
}

var names = [
    {key:'A', val:['艾(ài)','安(ān)','敖(áo)']},
    {key:'B', val:['巴(bā)','白(bái)','百里(bǎi  lǐ)','柏(bǎi)','班(bān)','包(bāo)','鲍(bào)','暴(bào)','贝(bèi)','贲(bēn)','毕(bì)','边(biān)','卞(biàn)','别(bié) 邴(bǐng)','伯赏(bó shǎng)','薄(bó)','卜(bǔ)','步(bù)']},
    {key:'C', val:['蔡(cài)','苍(cāng)','曹(cáo)','岑(cén)','柴(chái)','昌(chāng)','常(cháng)','晁(cháo)','巢(cháo)','车(chē)','陈(chén)','成(chéng)','程(chéng)','池(chí)','充(chōng)','储(chǔ)','褚(chǔ)','淳于(chún yú)','从崔(cóng cuī)','单于(chán yú)']},
    {key:'D', val:['戴(dài)','党(dǎng)','邓(dèng)','狄(dí)','刁(diāo)','丁(dīng)','东(dōng) 东方(dōng fāng)','东郭(dōng guō)','东门(dōng mén)','董(dǒng)','都(dū)','窦(dòu)','堵(dǔ)','杜(dù)','端木(duān mù)','段(duàn)','段干(duàn gān)']},
    {key:'E', val:['鄂(è)']},
    {key:'F', val:['封(fēng)','符(fú)','富(fù)','傅(fù)','丰(fēng)','房(fáng)','扶(fú)','酆(fēng)','范(fàn)','方(fāng)','凤(fèng)','冯(féng)','费(fèi)','伏(fú)','樊(fán)']},
    {key:'G', val:['盖(gài)','干(gān)','甘(gān)','高(gāo)','郜(gào)','戈(gē)','葛(gě)','耿(gěng)','弓(gōng)','公(gōng)','公良(gōng liáng)','公孙(gōng sūn)','公西(gōng xī)','公羊(gōng yáng)','公冶(gōng yě)','宫(gōng)','龚(gōng)','巩(gǒng)','贡(gòng)','勾(gōu)','缑亢(gōu kàng)','古(gǔ)','谷(gǔ)','顾(gù)','关(guān)','管(guǎn)','广(guǎng)','归海(guī hǎi)','桂(guì)','郭(guō)','国(guó)']},
    {key:'H', val:['黄(huáng)','胡(hú)','洪(hóng)','怀(huái)','滑(huá)','弘(hóng)','后(hòu)','宦(huàn)','侯(hóu)','惠(huì)','红(hóng)','花(huā)','杭(háng)','郝(hǎo)','和(hé)','贺(hè)','霍(huò)','华(huà)','何(hé)','衡(héng)','韩(hán)','桓(huán)','赫连(hè lián)','呼延(hū yán)','皇甫(huáng pǔ)']},
    {key:'J', val:['吉(jí)','景(jǐng)','季(jì)','暨(jì)','嵇(jī)','居(jū)','焦(jiāo)','姬(jī)','家(jiā)','计(jì)','夹谷(jiá gǔ)','蒋(jiǎng)','贾(jiǎ)','纪(jì)','经(jīng)','江(jiāng)','姜(jiāng)','靳(jìn)','井(jǐng)','简(jiǎn)','鞠(jū)','蓟(jì)','郏(jiá)','荆(jīng)','冀(jì)','金(jīn)']},
    {key:'K', val:['康(kāng)','匡(kuāng)','况后(kuàng hòu)','柯(kē)','空(kōng)','寇(kòu)','隗(kuí)','夔(kuí)','阚(kàn)','孔(kǒng)']},
    {key:'L', val:['赖(lài)','蓝(lán)','郎(láng)','劳(láo)','雷(léi)','冷(lěng)','黎(lí)','李(lǐ)','厉(lì)','利(lì)','郦(lì)','连(lián)','廉(lián)','梁(liáng)','梁丘(liáng qiū)','廖(liao)','林(lín)','蔺(lìn)','凌(líng)','令狐(lìng hú)','刘(liú)','柳(liǔ)','龙(lóng)','隆(lóng)','娄(lóu)','卢(lú)','鲁(lǔ)','陆(lù)','逯(lù)','禄(lù)','路(lù)','闾丘(lǘ qiū)','吕(lǚ)','栾(luán)','罗(luó)','骆(luò)']},
    {key:'M', val:['麻(má)','马(mǎ)','满(mǎn)','毛(máo)','茅(máo)','梅(méi)','蒙孟(mèng)','糜(mí)','米(mǐ)','宓(mì)','苗(miáo)','闵(mǐn)','明(míng)','缪(miào)','莫(mò)','墨哈(mò hǎ)','万俟(mò qí)','牧(mù)','慕(mù)','慕容(mù róng)','穆(mù)']},
    {key:'N', val:['那(nā)','南宫(nán gōng)','南门(nán mén)','能(nài)','倪(ní)','年爱(nián ài)','聂(niè)','乜(niè)','宁(nìng)','牛(niú)','钮(niǔ)','农(nóng)']},
    {key:'O', val:['欧(ōu)','欧阳(ōu yáng)']},
    {key:'P', val:['潘(pān)','庞(páng)','逄(péi)','裴(péi)','彭(péng)','蓬(péng)','皮(pí)','平(píng)','蒲(pú)','濮(pú)','濮阳(pú yáng)','浦(pú)']},
    {key:'Q', val:['戚(qī)','漆(qī)','亓官(qí guān)','祁(qí)','齐(qí)','钱(qián)','强(qiáng)','乔(qiáo)','谯笪(qiáo dá)','秦(qín)','邱(qiū)','秋(qiū)','仇(qiú)','裘(qiú)','曲(qū)','屈(qū)','璩(qú)','全(quán)','权(quán)','阙(quē)']},
    {key:'R', val:['冉(rǎn)','壤驷(rǎng sì)','饶(ráo)','任(rèn)','戎(róng)','荣(róng)','容(róng)','融(róng)','茹(rú)','汝鄢(rǔ yān)','阮(ruǎn)','芮(ruì)']},
    {key:'S', val:['桑(sāng)','沙(shā)','山(shān)','单(shàn)','商牟(shāng móu)','上官(shàng guān)','尚(shàn)','韶(sháo)','邵(shào)','佘佴(shé nài)','厍(shè)','申(shēn)','申屠(shēn tú)','莘(shēn)','沈(shěn)','慎(shěn)','盛(shèng)','师(shī)','施(shī)','石(shí)','时(shí)','史(shǐ)','寿(shòu)','殳(shū)','舒(shū)','束(shù)','双(shuāng)','水(shuǐ)','司(sī)','司空(sī kōng)','司寇(sī kòu)','司马(sī mǎ)','司徒(sī tú)','松(sōng)','宋(sòng)','苏(sū)','宿(sù)','孙(sūn)','索(suǒ)']},
    {key:'T', val:['台(tái)','太叔(tài shū)','谈(tán)','谭(tán)','澹台(tán tái)','汤(tāng)','唐(táng)','陶(táo) ','滕(téng)','田(tián)','通童(tóng)','钭(tǒu)','涂(tú)','屠(tú)','拓跋(tuò bá)']},
    {key:'W', val:['万(wàn)','汪(wāng)','王(wáng)','危(wēi)','微生(wēi shēng)','韦(wéi)','卫(wèi)','蔚(wèi)','魏(wèi)','温(wēn)','文(wén)','闻(wén)','闻人(wén rén)','翁(wēng)','沃(wò)','乌(wū)','邬(wū)','巫(wū)','巫马(wū mǎ)','吴(wú)','伍(wǔ)','武(wǔ)']},
    {key:'X', val:['郗(xī)','奚(xī)','西门(xī mén)','习(xí)','席(xí)','夏(xià)','夏侯(xià hóu)','鲜于(xiān yú)','咸(xián)','相(xiàng)','向(xiàng)','项(xiàng)','萧(xiāo)','谢(xiè)','解(xiè)','幸(xìng)','邢(xíng)','熊(xióng)','胥(xū)','须(xū)','徐(xú)','许(xǔ)','轩辕(xuān yuán)','宣(xuān)','薛(xuē)','荀(xún)']},
    {key:'Y', val:['闫法(yán fǎ)','严(yán)','阎(yán)','颜(yán)','晏(yàn)','燕(yàn)','羊(yáng)','羊舌(yáng shé)','阳佟(yang tóng)','杨(yáng)','仰(yǎng)','养(yǎng)','姚(yáo)','叶(yè)','伊(yī)','易(yì)','益(yì)','羿(yì)','阴(yīn)','殷(yīn)','尹(yǐn)','印(yìn)','应(yīng)','雍(yōng)','尤(yóu)','游(yóu) 有琴(yǒu qín)','于(yú)','余(yú)','於(yū)','鱼(yú)','俞(yú)','喻(yù)','虞(yú)','宇文(yǔ wén)','禹(yǔ)','郁(yù)','尉迟(yù chí)','元(yuán)','袁(yuán)','岳帅(yuè shuài)','越(yuè)','乐(yuè)','乐正(yuè zhèng)','云(yún)']},
    {key:'Z', val:['赵(zhào)','宰(zǎi)','宰父(zǎi fǔ)','昝(zǎn)','臧(zāng)','曾(zēng)','翟(zhái)','詹(zhān)','湛(zhàn)','张(zhāng)','章(zhāng)','仉督(zhǎng dū)','查(zhā)','长孙(zhǎng sūn)','甄(zhēn)','郑(zhèng)','支(zhī)','终(zhōng)','钟(zhōng)','钟离(zhōng lí)','仲(zhòng)','仲孙(zhòng sūn)','周(zhōu)','朱(zhū)','诸(zhū)','诸葛(zhū gě)','竺(zhú)','祝(zhù)','颛孙(zhuān sūn)','庄(zhuāng)','卓(zhuó)','子车(zǐ jū)','訾(zǐ)','宗(zōng)','宗政(zōng zhèng)','邹(zōu)','祖(zǔ)','左(zuǒ)','左丘(zuǒ qiū)']}
]

module.exports = router
