let mongoose = require('mongoose')

//定义管理员表
const childSchema = new mongoose.Schema({
    columnId: mongoose.Schema.Types.ObjectId,
    showDetail: {type: Boolean, default: false},
    showMode: {type: String, default: 'list'},
    hasRef: {type: Boolean, default: false},
    showSearch:{type: Boolean, default: true},
    status: {type: Number, default: 1},  // 状态：1：正常，-1：冻结, -2: 删除
    refTables: [],
    groupFields:[{
        showMode : {type: Boolean, default: false},
        groupShow : {type: Boolean, default: false},
        groupType : String,
        groupTitle : String,
        fieldId : mongoose.Schema.Types.ObjectId,
        name: String
    }],
    detail: {
        canCollection:{type: Boolean, default: true},
        canLike:{type: Boolean, default: true},
        canShare:{type: Boolean, default: true},
        showViewNum:{type: Boolean, default: true},
        showTitle:String,
        refFile:{type: Boolean, default: false},
        refTable:{type: String, default: ''},
        refField:{type: String, default: ''},
        mainField:{type: String, default: ''},
        bgImgs:[]
    },
    searchs: [ {
        searchType : String,
        searchMode : String,
        canSearch : {type: Boolean, default: false},
        fieldId : mongoose.Schema.Types.ObjectId,
        name : String,
        title: String
    }]
})

childSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
}

const child = mongoose.model('child', childSchema)

module.exports = child

