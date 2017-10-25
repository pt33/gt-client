var mongoose = require('mongoose')

//定义管理员表
const indexSchema = new mongoose.Schema({
    name: {type: String, default: ''},
    sort:{type: Number, default: 0},
    refTable:{type: String, default: ''},
    showMode:{type: String, default: ''},
    showButton: {type: Number, default: 1},
    contentTitle: {type: String, default: ''},
    contentSubTitle: {type: String, default: ''},
    content: {type: String, default: ''},
    showMore: {type: Number, default: 1},
    buttons:[],
    status:{type: Number, default: 1},
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

const index = mongoose.model('index', indexSchema)

module.exports = index

