let mongoose = require('mongoose')

//定义管理员表
const likeSchema = new mongoose.Schema({
    tid: mongoose.Schema.Types.ObjectId,
    type:String,
    userId: mongoose.Schema.Types.ObjectId,
    ip:String,
    createTime:{
        type: Date,
        default: new Date()
    }
})

likeSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const like = mongoose.model('like', likeSchema)

module.exports = like

