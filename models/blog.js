let mongoose = require('mongoose')

//定义管理员表
const blogSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    title:String,
    content:String,
    shortContent: String,
    status:{type: Number, default: 1},
    viewRange:{type: Number, default: 1}, //1:本人可见 2：亲友可见 3：姓氏可见 0：全网可见
    canShare:{type: Number, default: 1},
    viewNum:{type: Number, default: 0},
    likeNum:{type: Number, default: 0},
    collectionNum:{type: Number, default: 0},
    shareNum:{type: Number, default: 0},
    commentNum:{type: Number, default: 0},
    imgPaths:[],
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

blogSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const blog = mongoose.model('blog', blogSchema)

module.exports = blog

