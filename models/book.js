var mongoose = require('mongoose')

//定义管理员表
const bookSchema = new mongoose.Schema({
    name: String,
    userId:mongoose.Schema.Types.ObjectId,
    cover:String,
    files:[],
    viewRange:{type: Number, default: 1}, //1:本人可见 2：亲友可见 3：姓氏可见 0：全网可见
    canShare:{type: Number, default: 1},
    viewNum:{type: Number, default: 0},
    likeNum:{type: Number, default: 0},
    collectionNum:{type: Number, default: 0},
    shareNum:{type: Number, default: 0},
    status:{type: Number, default: 0},
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

const book = mongoose.model('book', bookSchema)

module.exports = book

