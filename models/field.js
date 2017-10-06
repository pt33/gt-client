var mongoose = require('mongoose')

//定义管理员表
const fieldSchema = new mongoose.Schema({
    name: String,
    title:String,
    index:Number,
    viewSort:Number,
    needQuery: {type: Boolean, default: false},
    needShow: {type: Boolean, default: true},
    needSort: {type: Boolean, default: false},
    hasFile: {type: Boolean, default: false},
    refTable: {type: String, default: ''},
    refField: {type: String, default: '_id'},
    status:{type: Number, default: 1},
    tableId: mongoose.Schema.Types.ObjectId,
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const field = mongoose.model('field', fieldSchema)

module.exports = field

