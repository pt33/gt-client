let mongoose = require('mongoose')

//定义管理员表
const tagSchema = new mongoose.Schema({
    name: String,
    icon: {type:String,default:'icon-book3'},
    status: {
        type: Number,
        default: 1
    },                     //是否可编辑
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

const tag = mongoose.model('tag', tagSchema)

module.exports = tag

