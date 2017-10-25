var mongoose = require('mongoose')

//定义管理员表
const donateSchema = new mongoose.Schema({
    title: String,           //家谱名称
    surname:String,         //姓氏
    place:String,           //所在地
    tanghao:String,         //堂号
    writer: String,         //责任者
    isPrivate: {type: Number, default: 0},      //是否公开
    phone: String,              //捐赠人联系方式
    email: String,              //捐赠人邮箱
    username: String,           //捐赠人姓名
    userPlace: String,          //捐赠人所在地
    remark:String,              //备注
    checkRemark:String,         //审核意见
    checkTime:{                 //审核时间
        type: Date,
        default: () => new Date()
    },
    images:[],
    userId:mongoose.Schema.Types.ObjectId,
    status:{type: Number, default: 0},
    createTime: {
        type: Date,
        default: () => new Date()
    },
    updateTime: {
        type: Date,
        default: () => new Date()
    }
})

const donate = mongoose.model('donate', donateSchema)

module.exports = donate

