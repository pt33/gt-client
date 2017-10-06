let mongoose = require('mongoose')

//定义管理员表
const areaSchema = new mongoose.Schema({
    province: String,
    pinyin: String,
    location: {
        type: [Number],
        index: {
            type: '2dsphere',
            sparse: true
        }
    },
    citys: [
        {
            cityName:String,
            pinyin: String,
            location: {
                type: [Number],
                index: {
                    type: '2dsphere',
                    sparse: true
                }
            },
            countys:[
                {
                    countyName:String,
                    pinyin: String,
                    location: {
                        type: [Number],
                        index: {
                            type: '2dsphere',
                            sparse: true
                        }
                    }
                }
            ]
        }
    ],
})

const area = mongoose.model('area', areaSchema)

module.exports = area

