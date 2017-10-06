var OpenCC = require('opencc')

module.exports.check = function (s, needChange){
{
    if(typeof s !== 'string') return s;
    var pattern = new RegExp("[`~!@#$^&*()=|{}';'<>?~！@#￥……&*（）——|{}【】‘；：”“’。，、？]")
    var rs = "";
    for (var i = 0; i < s.length; i++) {
        rs =  rs+s.substr(i, 1).replace(pattern, '')
    }
    var opencc = new OpenCC('t2s.json')
    var converted = Number(needChange) === 1 ? opencc.convertSync(rs) : rs
    return converted;
}}
