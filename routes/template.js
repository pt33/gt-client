let express = require('express')
let router = express.Router()
let template = require('../models/template')
let templateType = require('../models/templateType')
let mongoose = require('mongoose')
let iconv = require('iconv-lite')
let path = require('path')
let fs = require('fs')
let formidable = require('formidable')
const SUBFLD  = 31	// 子字段指示符
const SPACE  = 32
const SUBEND = 30

router.get('/',async function(req, res, next) {
    try{
        // let data = await getTitleData()
        res.render('data')
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

    let count = await template.count({status: 1,'title': {$regex: key}})

    let info = []

    if (count !== 0) {
        info = await template.aggregate([
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
                $match: {status: 1,'title': {$regex: key}}
            },
            {
                $lookup:
                    {
                        from: 'fields',
                        localField: 'tableId',
                        foreignField: 'tableId',
                        as: 'infos'
                    }
            },
            {
                $lookup:
                    {
                        from: 'templatetypes',
                        localField: 'typeId',
                        foreignField: '_id',
                        as: 'typeInfo'
                    }
            },
            {
                $project:{
                    type: 1,
                    title: 1,
                    tableId: 1,
                    tags:1,
                    fields: 1,
                    infos:{
                        $map:
                            {
                                input: "$infos",
                                as: "info",
                                in: { value:'$$info._id',text:'$$info.title' }
                            }
                    },
                    tableName: {$arrayElemAt: [ '$table.title', 0 ]},
                    typeFields:{
                        $map:
                            {
                                input: {$arrayElemAt: [ '$typeInfo.fields', 0 ]},
                                as: "field",
                                in: { value:'$$field',text:'$$field' }
                            }
                    }
                }
            }
        ]).sort(sort).skip(Number(current)).limit(Number(limit))
    }

    return {
        rows: info,
        total: count,
    }
}

router.delete('/:templateId', function(req, res, next) {
    template.update(
        {_id:mongoose.Types.ObjectId(req.params.templateId)}, {status: 0}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.delete('/field/:subId', function(req, res, next) {
    template.update(
        {
            _id : mongoose.Types.ObjectId(req.query.templateId)
        }, {
            $pull: { fields: { _id: mongoose.Types.ObjectId(req.params.subId)}
        }}
    ).then(function () {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.put('/title', async function (req, res, next) {
    template.update(
        {
            _id : mongoose.Types.ObjectId(req.body._id)
        }, {title: req.body.title}, {new : true}
    ).then(function (e) {
        return res.json({statusCode: 200})
    }).catch(function (e) {
        return res.json({statusCode: 201, error: e.message})
    })
})

router.put('/field', async function (req, res, next) {
    if (req.body.subId.indexOf('_') > 0) {
        let param = {fields:{}}
        param.fields._id = mongoose.Types.ObjectId()
        param.fields[req.body.field] = req.body.value
        template.update(
            {
                _id : mongoose.Types.ObjectId(req.body.templateId),
                tableId : mongoose.Types.ObjectId(req.body.tableId)
            }, { $push: param}, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200, newId: param.fields._id.toString()})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    } else {
        template.update(
            {
                _id : mongoose.Types.ObjectId(req.body.templateId),
                tableId : mongoose.Types.ObjectId(req.body.tableId),
                'fields._id':mongoose.Types.ObjectId(req.body.subId)
            }, {$set:req.body.data}, {new : true}
        ).then(function (e) {
            return res.json({statusCode: 200})
        }).catch(function (e) {
            return res.json({statusCode: 201, error: e.message})
        })
    }
})

router.post('/checkTemplateName', function(req, res, next) {
    template.findOne({title:req.body.title, status: 1}).then(function (data) {
        if (!data){
            return res.json(true)
        } else {
            return res.json(false)
        }
    })
})

router.post('/checkMarcTypeName', function(req, res, next) {
    templateType.findOne({name:req.body.title, status: 1}).then(function (data) {
        if (!data){
            return res.json(true)
        } else {
            return res.json(false)
        }
    })
})

router.post('/save', async function (req, res, next) {
    template.findOne({title:req.body.title, status: 1}).then(function (data) {
        if (!data){
            let param = {
                type: req.body.type,
                title: req.body.title,
                tableId: req.body.tableId
            }
            if (req.body.typeId !== ''){
                param.typeId = req.body.typeId
            }
            template.create(param).then(function (e) {
                return res.json({statusCode: 200})
            }).catch(function (e) {
                return res.json({statusCode: 201, error: e.message})
            })
        } else {
            return res.json({statusCode:201,error:'模板名称已存在'})
        }
    })
})

router.get('/getMarcType',async function(req, res, next) {
    try{
        let marcs = await templateType.find({type: 'marc', status: 1}).select({name:1})
        return res.json(marcs)
    } catch (e) {
        return res.json({'error':e.message})
    }
})

router.get('/fields/:templateId', async function(req, res, next) {
    try{
        let data = await template.aggregate([
            {
                $match: {_id: mongoose.Types.ObjectId(req.params.templateId)}
            },
            {
                $unwind: '$fields'
            },{
                $lookup:
                {
                    from: 'fields',
                    localField: 'fields.fieldId',
                    foreignField: '_id',
                    as: 'infos'
                }
            },
            {
                $project:{
                    templateId:'$fields._id'
                    ,index:{$ifNull:['$fields.index',0]}
                    ,fieldId:{$ifNull:['$fields.fieldId',0]}
                    ,filePath:{$ifNull:['$fields.filePath','']},
                    refDir: {$ifNull:['$fields.refDir',false]},
                    needGroup: {$ifNull:['$fields.needGroup',false]},
                    canDuplicate: {$ifNull:['$fields.canDuplicate',true]},
                    canEmpty:{$ifNull:['$fields.canEmpty',true]},
                    markCanDuplicate:{$ifNull:['$fields.markCanDuplicate',false]},
                    marcMark: {$ifNull:['$fields.marcMark','']},
                    hasFile:{$arrayElemAt: [ '$infos.hasFile', 0 ]},
                    _id:1
                }
            }
        ])
        return res.json(data)
    } catch (e) {
        return res.json({error:e.message})
    }
})

router.post('/parse', async (req, res, next) =>{
    try {
        let paths = JSON.parse(req.body.paths)
        let fRead = fs.readFileSync(paths[0].dir)
        var s = iconv.decode(fRead, 'gbk')
        let ary = s.split('\r\n')
        let marks = []
        let str = ary[0]
        let header = str.substring(0, 24).trim()
        let begin_source = Number(header.substring(14,17))
        let mark = str.substring(24, begin_source)
        let len = parseInt(mark.length / 12)
        let data = str.substring(begin_source)
        for (let j = 0;j < len; j++){
            let sub = mark.substring(j*12,12*(j+1))
            marks.push({key:sub.substring(0,3), len:sub.substring(3, 7), start: sub.substring(7)})
        }
        let codeAry = new Set()
        getMarcTemplate(data, marks, codeAry)
        let param = []
        codeAry.forEach(function (e) {
            param.push(e)
        })
        await templateType.create({name:req.body.name, fields: param,type:'marc'})
        fs.unlinkSync(paths[0].dir)
        return res.json({statusCode: 200})
    } catch (e) {
        return res.json({error:e.message})
    }
})

function getMarcTemplate(str, marks, codeAry) {
    var realLength = 0, charCode = -1;
    let tmp = ''
    for (let j = 0; j< marks.length;j++) {
        tmp = ''
        realLength = 0
        for (var i = 0; i < str.length; i++) {
            charCode = str.charCodeAt(i)
            if (charCode >= 0 && charCode <= 128) {
                realLength += 1;
            } else {
                realLength += 2
            }
            tmp += str[i]

            if(realLength === Number(marks[j].len)) {
                str = str.substring(tmp.length)
                if (tmp.indexOf(String.fromCharCode(SUBFLD)) >= 0) {
                    let tmpAry = tmp.substring(tmp.indexOf(String.fromCharCode(SUBFLD))).split(String.fromCharCode(SUBFLD))
                    tmpAry.forEach(function (e) {
                        if (e !== '') {
                            let key = marks[j].key + '$' + e.substring(0,1)
                            codeAry.add(key)
                        }
                    })
                } else {
                    let key = marks[j].key
                    codeAry.add(key)
                }
                break
            }
        }
    }
}

router.post('/upload', function (req, res, next) {
    var form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir = uploadPath
    form.multiples = true
    form.keepExtensions = true
    form.maxFieldsSize = 1024 * 1024 * 1024

    let filePath = {}
    form.on('file', (filed, file) => {
        if (Number(file.size) !== 0) {
            filePath.dir = file.path
            filePath.name = file.name
        }
    })

    form.parse(req, (err, fields, files) => {
        console.log('')
    })

    form.on('end', async function () {
        return res.json(filePath)
    })

    form.on('error', (err) => {
        return res.json({error: err.message})
    })
})

module.exports = router