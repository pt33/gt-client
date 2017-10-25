let mongoose = require('mongoose')

//定义管理员表
const collectionSchema = new mongoose.Schema({
    tid: mongoose.Schema.Types.ObjectId,
    type:String,
    userId: mongoose.Schema.Types.ObjectId,
    ip:String,
    createTime:{
        type: Date,
        default: () => new Date()
    }
})

collectionSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const collection = mongoose.model('collection', collectionSchema)

module.exports = collection

