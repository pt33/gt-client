let mongoose = require('mongoose')

//定义管理员表
const questionSchema = new mongoose.Schema({
    username: String,
    userId:mongoose.Schema.Types.ObjectId,
    title:String,
    type:mongoose.Schema.Types.ObjectId,
    content:{
        shortContent:String,
        longContent:{
            type: String,
            default: ''
        }
    },
    email:String,
    telphone:String,
    comments:[{}],
    images:[],
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    },
    status: {
        type: Number,       //0:提交未审核 1：审核通过 2：已指派 -1：审核未通过 -2：管理员删除 -3：用户删除 -4：用户撤消
        default: 0
    },
    viewNum:{
        type: Number,
        default: 0
    },
    likeNum:{
        type: Number,
        default: 0
    },
    collectionNum:{
        type: Number,
        default: 0
    },
    isCommonly:{
        type: Boolean,
        default: false
    }
})

questionSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const question = mongoose.model('question', questionSchema)

module.exports = question

