var mongoose = require('mongoose')

//定义管理员表
const importTempDataSchema = new mongoose.Schema({
    createTime: {
        type: Date,
        default: new Date()
    },
    updateTime: {
        type: Date,
        default: new Date()
    }
})

// const importTempData = mongoose.model('importTempData', importTempDataSchema)

module.exports = importTempDataSchema

