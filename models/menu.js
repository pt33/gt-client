var mongoose = require('mongoose')

//定义管理员表
const menuSchema = new mongoose.Schema({
    name: String,
    url: String,
    sort:Number,
    icon: String,
    status: {type: Number, default: 1},  // 状态：1：正常，-1：冻结, -2: 删除
})

const menu = mongoose.model('menu', menuSchema)

module.exports = menu

