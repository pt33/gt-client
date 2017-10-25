let mongoose = require('mongoose')

//定义管理员表
const shareSchema = new mongoose.Schema({
    tid: mongoose.Schema.Types.ObjectId,
    type:String,
    userId: mongoose.Schema.Types.ObjectId,
    source: String,
    shareNum: Number,
    clickNum: Number,
    createTime:{
        type: Date,
        default: () => new Date()
    }
})

shareSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const share = mongoose.model('share', shareSchema)

module.exports = share

