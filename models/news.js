let mongoose = require('mongoose')

//定义管理员表
const newsSchema = new mongoose.Schema({
    adminId: mongoose.Schema.Types.ObjectId,
    title: String,
    images: [],
    content: String,
    type: String,
    status: {type: Number, default: 1},  // 状态：1：正常，-1：冻结, -2: 删除
    viewNum:{type: Number, default: 0},
    likeNum:{type: Number, default: 0},
    collectionNum:{type: Number, default: 0},
    shareNum:{type: Number, default: 0},
    commentNum:{type: Number, default: 0},
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

newsSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const news = mongoose.model('news', newsSchema)

module.exports = news

