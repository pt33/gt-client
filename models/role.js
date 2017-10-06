let mongoose = require('mongoose')

//定义管理员表
const roleSchema = new mongoose.Schema({
    name: String,
    enable: {
        type: Boolean,
        default: true
    },                     //是否可编辑
    menus:[],
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const role = mongoose.model('role', roleSchema)

module.exports = role

