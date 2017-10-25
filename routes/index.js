const express = require('express');
const router = express.Router();
const user = require('../models/user')
const field = require('../models/field')
const menu = require('../models/menu')
const security = require('../util/security')
const test = require('../models/test')
const mongoose = require('mongoose')
const column  = require('../models/column')
const jwt = require('jsonwebtoken')
const index = require('../models/index')
const CryptoJS = require("crypto-js")
const table = require('../models/table')
const databaseProxy = require('../util/databaseProxy')
const md5 = require('md5')
const request = require('request')
const http = require('http')
/* GET home page. */
router.get('/', async function(req, res, next) {
    let data = await databaseProxy.getColumnData(1)
    let grid = await databaseProxy.getIndexData()
    for (let i in grid) {
        let obj = grid[i]
        obj.data = await databaseProxy.getTableListDetail(obj.refTable,obj.contentTitle,obj.contentSubTitle,obj.content)
    }
    let userId = ''
    if (req.userId) {
       userId = req.userId
    }
    res.render('index',{index: '/', columns: data, grids: grid, userId: userId})
})

router.get('/demo', function(req, res, next) {
    res.render('index-fullscreen-slider',{index: 'current'})
})

router.get('/login', function(req, res, next) {
    res.render('login');
})

router.get('/about', async function(req, res) {
    let data = await databaseProxy.getColumnData(1)
    let userId = '',
        title = ''
    if (req.userId) {
        userId = req.userId
    }

    if (req.query.current !== undefined && data.length > 0) {
        for(let i in data) {
            if(data[i].url === req.query.current) {
                title = data[i].name
                break
            }
        }
    }

    let param = {
        columns: data,
        userId: userId,
        title: title
    }

    if (req.query.index !== undefined) {
        param.index = req.query.index
    } else if (req.query.current !== undefined) {
        param.current = req.query.current
    }
    res.render('about',param)
})

router.get('/copyright', async function(req, res) {
    let data = await databaseProxy.getColumnData(1)
    let userId = '',
        title = ''
    if (req.userId) {
        userId = req.userId
    }

    if (req.query.current !== undefined && data.length > 0) {
        for(let i in data) {
            if(data[i].url === req.query.current) {
                title = data[i].name
                break
            }
        }
    }

    let param = {
        columns: data,
        userId: userId,
        title: title
    }

    if (req.query.index !== undefined) {
        param.index = req.query.index
    } else if (req.query.current !== undefined) {
        param.current = req.query.current
    }
    res.render('copyright',param)
})

router.get('/news/view', function(req, res) {
    res.render('newsDetail', {title:req.query.title, index: req.query.viewIndex})
})

router.post('/signIn', async function(req, res, next) {
    let password = md5(req.body.password)

    let url = 'http://sso1.nlc.cn/sso/foreign/authenManager/getAccessToken?uid=' + req.body.username + '&userPassword=' + password + '&appId=90010'

    let  options = {
        method: 'get',
        url: url,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        }
    }

    // let info_url = http://sso1.nlc.cn/sso/foreign/authenManager/getUserInfoByToken?access_token=*****
    let infoOption = {
        method: 'get',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        }
    }

    let userInfo = await user.findOne({username: req.body.username})

    request(options, function (err, response, body) {
        if (err) {
            return res.json({error:err.message})
        } else {
            let result = JSON.parse(body)
            if (result.success) {
                let accessToken = result.result.accessToken
                infoOption.url = 'http://sso1.nlc.cn/sso/foreign/authenManager/getUserInfoByToken?access_token=' + accessToken
                request(infoOption, async function (err, subResponse, sub) {
                    if (err) {
                        return res.json({error:err.message})
                    } else {
                        let sub_result = JSON.parse(sub)
                        if (sub_result.success) {
                            let info = sub_result.result
                            if (info.cn !== '' && info.cn !== undefined) {
                                info.surname = parseUsername(info.cn)
                                info.realname = info.surname === '' ? '' : info.cn.substring(info.surname.length)
                            }

                            let param = {
                                username:info.uid,
                                sex:info.sex === '' || info.sex === undefined ? '' : (info.sex === '男' ? 0 : 1),
                                phone:info.mobile||'',
                                email:info.mail||'',
                                surname:info.surname||'',
                                realname:info.realname||'',
                                birthday:info.birthday||'',
                                isreal:info.category === '01' ? 0 : 1,
                                password:password,
                                updateTime:new Date(),
                                createTime:userInfo ? userInfo.createTime : new Date(),
                                status:userInfo ? userInfo.status : 1,
                                avatarStatus:userInfo ? userInfo.avatarStatus : 0,
                                avatar: userInfo ? userInfo.avatar : '',
                                nickname: userInfo ? userInfo.nickname : ''
                            }

                            let user_info = await user.findAndModify(
                                {username: info.uid},
                                {_id:-1},
                                param,
                                {upsert: true,
                                    new : true})

                            if (user_info.ok === 1) {
                                if (user_info.value.status !== undefined && user_info.value.status === -1) {
                                    return res.json({error:'账号异常，无法登录'})
                                }

                                let token = jwt.sign({v:
                                    user_info.value._id.toString()
                                }, secretOrPrivateKey, {
                                    expiresIn: '1 days'
                                })
                                return res.json({token:token, user:JSON.stringify(user_info.value)})
                            } else {
                                return res.json({error:'服务器异常，请稍后重试'})
                            }
                        } else {
                            return res.json({error:sub.msg})
                        }
                    }
                })
            } else {
                return res.json({error:result.msg})
            }
        }
    })
})

router.get('/morelink', async function(req, res, next) {
    let data = await databaseProxy.getColumnData(1)
    let userId = ''
    if (req.userId) {
        userId = req.userId
    }
    res.render('sitemap',{index: '/', columns: data, userId:userId})
})

router.get('/moreList',async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)

        var tmp = req.query.param.replace(/\ /g,'+')
        let bytes  = CryptoJS.AES.decrypt(tmp, '_SALT_G(T#*)')
        let param = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

        let tableId = await getTableId(param.tablename)

        const fields = await field.find(
            {tableId: tableId._id, status:1, needShow:true}
            ,{name:1,title:1,needSort:1,_id:0}).sort({viewSort:1})

        let userId = ''
        if (req.userId) {
            userId = req.userId
        }

        res.render('more',{fields:fields
            , key: param.key
            , tablename: param.tablename
            , tableId: tableId._id.toString()
            , field: param.field
            , showDetail: true
            , index: '/'
            , columns: data
            , table: tableId.title
            , title: param.key + '姓家谱列表'
            , userId: userId
        })
    } catch (e) {
        res.render('error', e.message)
    }
})

async function getTableId(tableName) {

    let info = await table.findOne({name:tableName,status:1})

    return info
}

router.get('/default', function(req, res, next) {
    res.render('default')
})

router.post('/login', async function(req, res, next) {
    let info = await admin.aggregate(
    [
        {
            $lookup:
            {
                from: 'roles',
                localField: 'roleId',
                foreignField: '_id',
                as: 'rolename'
            }
        },
        {
            $match: {username: req.body.name}
        },
        {
          $project:
          {
              username: 1,
              roleId: 1,
              status: 1,
              password: 1,
              menus: {$arrayElemAt: [ '$rolename.menus', 0 ]},
              roleName: {$arrayElemAt: [ '$rolename.name', 0 ]}
          }
        }
    ])

    if (info.length === 0) {
        return res.json({error:'账号不存在'})
    } else {
        if (info[0].password !== security.encryptWithSalt(req.body.name, req.body.password)) {
            return res.json({error:'密码错误'})
        } else {
            if (info[0].status !== 1) {
                return res.json({error:'账号异常，无法登录'})
            } else {
                var menus = await menu.find(
                    {_id: {$in:info[0].menus}, status:1}
                ).select({name:1,_id:0,url:1}).sort({sort:1})

                let token = jwt.sign({v:
                    info[0]._id.toString(),r:info[0].roleId
                }, secretOrPrivateKey, {
                    expiresIn: '30 days'
                })
                return res.json({token:token, admin:JSON.stringify(info[0]), menus: JSON.stringify(menus)})
            }
        }
    }
})

router.get('/index', async (req, res, next) => {
    let info = await role.aggregate(
    [
        {
            $unwind:'$menus'
        },
        {
            $lookup:
            {
                from: 'menus',
                localField: 'menus',
                foreignField: '_id',
                as: 'info'
            }
        },
        {
            $lookup:
            {
                from: 'admins',
                localField: '_id',
                foreignField: 'roleId',
                as: 'admin'
            }
        },
        {
            $match: {_id: mongoose.Types.ObjectId(req.roleId)}
        },
        {
            $unwind: '$info'
        },
        {
            $group:
            {
                _id: '$_id',
                roleName: {$first: '$name'},
                list: {
                    $push: {
                        name:'$info.name',
                        icon:'$info.icon',
                        url:'$info.url',
                        status:'$info.status',
                        sort:'$info.sort'
                    }},
                admin: {
                    $first:
                    {
                        $filter: {
                            input: '$admin',
                            as: 'num',
                            cond: { $eq: [ '$$num._id', mongoose.Types.ObjectId(req.adminId)]}
                        }
                    }
                }
            }
        },
        {
            $project:
            {
                roleName: 1,
                menus: {
                    $filter: {
                        input: '$list',
                        as: 'num',
                        cond: { $eq: [ '$$num.status', 1 ]}
                    }
                },
                admin: { $arrayElemAt: [ '$admin.username', 0 ]},
                _id: 0
            }
        },
        {
            $sort:{
                sort:1
            }
        }
    ])

    res.render('index', {
        menus: info.length > 0 ? info[0].menus : [],
        adminName: info.length > 0 ? info[0].admin : '',
        roleName: info.length > 0 ? info[0].roleName : ''
    })
})

router.get('/main', function(req, res, next) {
    res.write('<script language=\'javascript\'>window.parent.location.href=\'/index\'</script>');
    res.end()
})

parseUsername = (name) =>{
    let surname = ''
    for (let j in names) {
        let param = names[j].substring(0,names[j].indexOf('('))
        if (name.match(param)){
            surname = name.match(param)[0]
            if (surname.length > 1) {
                return surname
            }
        }
    }
    return surname
}

let names = [
    '艾(ài)','安(ān)','敖(áo)'
    ,'巴(bā)','白(bái)','百里(bǎi  lǐ)','柏(bǎi)','班(bān)','包(bāo)','鲍(bào)','暴(bào)'
    ,'贝(bèi)','贲(bēn)','毕(bì)','边(biān)','卞(biàn)','别(bié) 邴(bǐng)','伯赏(bó shǎng)','薄(bó)'
    ,'卜(bǔ)','步(bù)','蔡(cài)','苍(cāng)','曹(cáo)','岑(cén)','柴(chái)','昌(chāng)','常(cháng)'
    ,'晁(cháo)','巢(cháo)','车(chē)','陈(chén)','成(chéng)','程(chéng)','池(chí)','充(chōng)','储(chǔ)'
    ,'褚(chǔ)','淳于(chún yú)','从崔(cóng cuī)','单于(chán yú)','戴(dài)','党(dǎng)','邓(dèng)','狄(dí)'
    ,'刁(diāo)','丁(dīng)','东(dōng) 东方(dōng fāng)','东郭(dōng guō)','东门(dōng mén)','董(dǒng)','都(dū)'
    ,'窦(dòu)','堵(dǔ)','杜(dù)','端木(duān mù)','段(duàn)','段干(duàn gān)','鄂(è)','封(fēng)','符(fú)'
    ,'富(fù)','傅(fù)','丰(fēng)','房(fáng)','扶(fú)','酆(fēng)','范(fàn)','方(fāng)','凤(fèng)','冯(féng)'
    ,'费(fèi)','伏(fú)','樊(fán)','盖(gài)','干(gān)','甘(gān)','高(gāo)','郜(gào)','戈(gē)','葛(gě)'
    ,'耿(gěng)','弓(gōng)','公(gōng)','公良(gōng liáng)','公孙(gōng sūn)','公西(gōng xī)','公羊(gōng yáng)'
    ,'公冶(gōng yě)','宫(gōng)','龚(gōng)','巩(gǒng)','贡(gòng)','勾(gōu)','缑亢(gōu kàng)','古(gǔ)'
    ,'谷(gǔ)','顾(gù)','关(guān)','管(guǎn)','广(guǎng)','归海(guī hǎi)','桂(guì)','郭(guō)','国(guó)'
    ,'黄(huáng)','胡(hú)','洪(hóng)','怀(huái)','滑(huá)','弘(hóng)','后(hòu)','宦(huàn)','侯(hóu)'
    ,'惠(huì)','红(hóng)','花(huā)','杭(háng)','郝(hǎo)','和(hé)','贺(hè)','霍(huò)','华(huà)','何(hé)'
    ,'衡(héng)','韩(hán)','桓(huán)','赫连(hè lián)','呼延(hū yán)','皇甫(huáng pǔ)','吉(jí)','景(jǐng)'
    ,'季(jì)','暨(jì)','嵇(jī)','居(jū)','焦(jiāo)','姬(jī)','家(jiā)','计(jì)','夹谷(jiá gǔ)','蒋(jiǎng)'
    ,'贾(jiǎ)','纪(jì)','经(jīng)','江(jiāng)','姜(jiāng)','靳(jìn)','井(jǐng)','简(jiǎn)','鞠(jū)'
    ,'蓟(jì)','郏(jiá)','荆(jīng)','冀(jì)','金(jīn)','康(kāng)','匡(kuāng)','况后(kuàng hòu)','柯(kē)'
    ,'空(kōng)','寇(kòu)','隗(kuí)','夔(kuí)','阚(kàn)','孔(kǒng)','赖(lài)','蓝(lán)','郎(láng)','劳(láo)'
    ,'雷(léi)','冷(lěng)','黎(lí)','李(lǐ)','厉(lì)','利(lì)','郦(lì)','连(lián)','廉(lián)','梁(liáng)'
    ,'梁丘(liáng qiū)','廖(liao)','林(lín)','蔺(lìn)','凌(líng)','令狐(lìng hú)','刘(liú)','柳(liǔ)','龙(lóng)'
    ,'隆(lóng)','娄(lóu)','卢(lú)','鲁(lǔ)','陆(lù)','逯(lù)','禄(lù)','路(lù)','闾丘(lǘ qiū)','吕(lǚ)'
    ,'栾(luán)','罗(luó)','骆(luò)','麻(má)','马(mǎ)','满(main)','毛(máo)','茅(máo)','梅(méi)','蒙孟(mèng)','糜(mí)'
    ,'米(mǐ)','宓(mì)','苗(miáo)','闵(mǐn)','明(míng)','缪(miào)','莫(mò)','墨哈(mò hǎ)','万俟(mò qí)'
    ,'牧(mù)','慕(mù)','慕容(mù róng)','穆(mù)','那(nā)','南宫(nán gōng)','南门(nán mén)','能(nài)','倪(ní)'
    ,'年爱(nián ài)','聂(niè)','乜(niè)','宁(nìng)','牛(niu)','钮(niǔ)','农(nóng)','欧(ōu)','欧阳(ōu yáng)'
    ,'潘(pān)','庞(páng)','逄裴(péi)','彭(péng)','蓬(péng)','皮(pí)','平(píng)','蒲(pú)','濮(pú)'
    ,'濮阳(pú yáng)','浦(pú)','戚(qī)','漆雕(qī diāo)','亓官(qí guān)','祁(qí)','齐(qí)','钱(qián)'
    ,'强(qiáng)','乔(qiáo)','谯笪(qiáo dá)','秦(qín)','邱(qiū)','秋(qiū)','仇(qiú)','裘(qiú)','曲(qū)'
    ,'屈(qū)','璩(qú)','全(quán)','权(quán)','阙(quē)','冉(rǎn)','壤驷(rǎng sì)','饶(ráo)','任(rèn)'
    ,'戎(róng)','荣(róng)','容(róng)','融(róng)','茹(rú)','汝鄢(rǔ yān)','阮(ruǎn)','芮(ruì)','桑(sāng)'
    ,'沙(shā)','山(shān)','单(shàn)','商牟(shāng móu)','上官(shàng guān)','尚(shàn)','韶(sháo)','邵(shào)'
    ,'佘佴(shé nài)','厍(shè)','申(shēn)','申屠(shēn tú)','莘(shēn)','沈(shěn)','慎(shěn)','盛(shèng)'
    ,'师(shī)','施(shī)','石(shí)','时(shí)','史(shǐ)','寿(shòu)','殳(shū)','舒(shū)','束(shù)','双(shuāng)'
    ,'水(shuǐ)','司(sī)','司空(sī kōng)','司寇(sī kòu)','司马(sī mǎ)','司徒(sī tú)','松(sōng)','宋(sòng)'
    ,'苏(sū)','宿(sù)','孙(sūn)','索(suǒ)','台(tái)','太叔(tài shū)','谈(tán)','谭(tán)','澹台(tán tái)'
    ,'汤(tāng)','唐(táng)','陶(táo) ','滕(téng)','田(tián)','通童(tóng)','钭(tǒu)','涂钦(tú qīn)','屠(tú)'
    ,'拓跋(tuò bá)','万(wàn)','汪(wāng)','王(wáng)','危(wēi)','微生(wēi shēng)','韦(wéi)','卫(wèi)'
    ,'蔚(wèi)','魏(wèi)','温(wēn)','文(wén)','闻(wén)','闻人(wén rén)','翁(wēng)','沃(wò)','乌(wū)'
    ,'邬(wū)','巫(wū)','巫马(wū mǎ)','吴(wú)','伍(wǔ)','武(wǔ)','郗(xī)','奚(xī)','西门(xī mén)','习(xí)'
    ,'席(xí)','夏(xià)','夏侯(xià hóu)','鲜于(xiān yú)','咸(xián)','相(xiàng)','向(xiàng)','项(xiàng)'
    ,'萧(xiāo)','谢(xiè)','解(xiè)','幸(xìng)','邢(xíng)','熊(xióng)','胥(xū)','须(xū)','徐(xú)','许(xǔ)'
    ,'轩辕(xuān yuán)','宣(xuān)','薛(xuē)','荀(xún)','闫法(yán fǎ)','严(yán)','阎(yán)','颜(yán)'
    ,'晏(yàn)','燕(yàn)','羊(yáng)','羊舌(yáng shé)','阳佟(yang tóng)','杨(yáng)','仰(yǎng)','养(yǎng)'
    ,'姚(yáo)','叶(yè)','伊(yī)','易(yì)','益(yì)','羿(yì)','阴(yīn)','殷(yīn)','尹(yǐn)','印(yìn)'
    ,'应(yīng)','雍(yōng)','尤(yóu)','游(yóu) 有琴(yǒu qín)','于(yú)','余(yú)','於(yū)','鱼(yú)','俞(yú)'
    ,'喻(yù)','虞(yú)','宇文(yǔ wén)','禹(yǔ)','郁(yù)','尉迟(yù chí)','元(yuán)','袁(yuán)'
    ,'岳帅(yuè shuài)','越(yuè)','乐(yuè)','乐正(yuè zhèng)','云(yún)','赵(zhào)','宰(zǎi)','宰父(zǎi fǔ)'
    ,'昝(zǎn)','臧(zāng)','曾(zēng)','翟(zhái)','詹(zhān)','湛(zhàn)','张(zhāng)','章(zhāng)'
    ,'仉督(zhǎng dū)','查(zhā)','长孙(zhǎng sūn)','甄(zhēn)','郑(zhèng)','支(zhī)','终(zhōng)'
    ,'钟(zhōng)','钟离(zhōng lí)','仲(zhòng)','仲孙(zhòng sūn)','周(zhōu)','朱(zhū)','诸(zhū)'
    ,'诸葛(zhū gě)','竺(zhú)','祝(zhù)','颛孙(zhuān sūn)','庄(zhuāng)','卓(zhuó)','子车(zǐ jū)'
    ,'訾(zǐ)','宗(zōng)','宗政(zōng zhèng)','邹(zōu)','祖(zǔ)','左(zuǒ)','左丘(zuǒ qiū)'
]

module.exports = router;
