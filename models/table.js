var mongoose = require('mongoose')

//定义管理员表
const tableSchema = new mongoose.Schema({
    title: String,
    name:String,
    type: String,
    index: Number,
    status: {type: Number, default: 1},
    fields: [
        {
            name: String,
            needQuery: {type: Boolean, default: false},
            needSort: {type: Boolean, default: false},
            status:{type: Number, default: 1},
            isRef:{type: Boolean, default: false},
            refTable: String
        }
    ],
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const table = mongoose.model('table', tableSchema)

module.exports = table

