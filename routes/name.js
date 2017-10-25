const express = require('express')
const router = express.Router()
const column  = require('../models/column')
const databaseProxy = require('../util/databaseProxy')

router.get('/', async function(req, res, next) {
    try{
        let data = await databaseProxy.getColumnData(1)
        let navTitle = ''
        for(let i in data) {
            if(data[i].url === '/name') {
                navTitle = data[i].name
                break
            }
        }
        let userId = ''
        if (req.userId) {
            userId = req.userId
        }
        res.render('name',{current: '/name', columns: data, navTitle:navTitle,userId:userId});
    } catch (e) {
        res.render('error',{errorMsg:e.message})
    }
})

module.exports = router
