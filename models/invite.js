var mongoose = require('mongoose')

//定义管理员表
const inviteSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name:{type: String, default: ''}, //1:邮件 2:短信
    phone:{type: String, default: ''},
    status:{type: Number, default: 0},  //0:已发送，-1：拒绝 1：同意
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

inviteSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const invite = mongoose.model('invite', inviteSchema)

module.exports = invite

