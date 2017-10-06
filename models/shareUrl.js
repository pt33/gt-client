let mongoose = require('mongoose')

//定义管理员表
const shareUrlSchema = new mongoose.Schema({
    url:String,
    status: {
        type: Number,
        default: 1
    },                     //是否可编辑
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

shareUrlSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const shareUrl = mongoose.model('shareUrl', shareUrlSchema)



module.exports = shareUrl


