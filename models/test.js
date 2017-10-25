let mongoose = require('mongoose')
let field = require('../models/field')
let table = require('../models/table')

//定义管理员表
exports.getSchema = async function (tabledId, name){

    if (mongoose.models[name]) {
        return mongoose.model(name)
    } else {
        let param = {}
        let data
        if(tabledId !== '') {
            data =  await field.find({
               tableId: mongoose.Types.ObjectId(tabledId), status: 1
            })
        } else {
            data = await field.find({
                name: name, status: 1
            })
        }

        for(let i=0;i<data.length;i++){
            let tmp = data[i]
            param[tmp.name] = 'String'
        }
        param.status = {type: Number, default: 1}
        param.createTime = {
            type: Date,
            default: () => new Date()
        }
        param.updateTime = {
            type: Date,
            default: () => new Date()
        }
        param.sourceFrom = 'String'
        param.paths = []
        param.children = []
        param.pinyin = 'String'
        param.location =  {
            type: [Number],
                index: {
                type: '2dsphere', sparse: true
            }
        }

        const custom = new mongoose.Schema(param)

        custom.statics.findAndModify = function (query, sort, doc, options, callback) {
            return this.collection.findAndModify(query, sort, doc, options, callback);
        }

        const obj = mongoose.model(name, custom)

        return obj
    }
}
