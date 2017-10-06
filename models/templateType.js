var mongoose = require('mongoose')

//定义管理员表
const templateTypeSchema = new mongoose.Schema({
    name: String,
    fields:[],
    status:{type: Number, default: 1},
    type: String,
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const templateType = mongoose.model('templateType', templateTypeSchema)

module.exports = templateType

