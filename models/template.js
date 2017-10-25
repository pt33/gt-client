let mongoose = require('mongoose')

//定义管理员表
const templateSchema = new mongoose.Schema({
    title: String,
    type: String,
    typeId: mongoose.Schema.Types.ObjectId,
    tableId: mongoose.Schema.Types.ObjectId,
    fields:[
        {
           fieldId: mongoose.Schema.Types.ObjectId,
            index: Number,
            filePath:{type: String, default: ''},
            refDir: {type: Boolean, default: false},
            needGroup: {type: Boolean, default: false},
            canDuplicate: {type: Boolean, default: true},
            canEmpty: {type: Boolean, default: true},
            markCanDuplicate: {type: Boolean, default: false},
            marcMark: {type: String, default: ''}
        }
    ],
    status: {type: Number, default: 1},  // 状态：1：正常，-1：冻结, -2: 删除
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

const template = mongoose.model('template', templateSchema)

module.exports = template

