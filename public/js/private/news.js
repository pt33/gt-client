jQuery(document).ready(function(){

    var newsCell = $('#newsCell')
    var newsDiv = $('#newsDiv')
    var keyWord = $('#keyWord')
    var commentform = $('#commentform')
    var reply   = $('#reply', commentform)
    var rid   = $('#qid', commentform)

    showNewsContent = function () {
        var param = {
            key:{}
        }

        if (storage['sortBy']) {
            param.sort = JSON.parse(storage['sortBy'])
            setSortParam(storage['sortBy'])
            storage.removeItem('sortBy')
        }

        if (storage['keyWord']) {
            param.key.title = {$regex: storage['keyWord']}
            keyWord.val(storage['keyWord'])
            storage.removeItem('keyWord')
        }

        if (storage['current']) {
            param.page = storage['current']
            storage.removeItem('current')
        }

        $('.form-process', newsDiv).fadeIn()

        newsCell.load('/news/list?param='+JSON.stringify(param),function () {
            $('.form-process',newsDiv).fadeOut()
            initPage($('#pagetotal', newsCell).val(), $('#pageCurrent', newsCell).val(), 10, 'newsCell')
        })
    }

    addComment = function () {
        if (reply.val() === '') {
            reply.addClass('error')
            return
        }

        $('.form-process', commentform).fadeIn()

        $.ajax({
            type: 'post',
            data: {
                content: encodeURI(reply.val()),
                bid: rid.val()
            },
            url: '/news/comment',
            success: function (result) {
                $('.form-process', commentform).fadeOut()
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    showMessage('评论提交成功', 'success', 2000)
                    reply.val('')
                    $('#commentNum').html(Math.max(Number(result),0))
                    $('#commentNumMini').html(Math.max(Number(result),0))
                    $('#commentlist').load('/news/comment/'+ rid.val(), function () {
                        initPage($('#pagetotal', commentform).val(), $('#pageCurrent', commentform).val(), 10, 'comment')
                    })
                }
            }
        })
    }

    sortTime = function(sortby) {
        $('.questionSort.active').removeClass('active')
        $('.questionSort.time.'+sortby+':not(.active)').addClass('active')
        $('.nav.nav-pills li:not(.questionSort).active a').first().trigger('click',{setActive:false})
    }

    sortNum = function(sortby) {
        $('.questionSort.active').removeClass('active')
        $('.questionSort.num.'+sortby+':not(.active)').addClass('active')
        $('.nav.nav-pills li:not(.questionSort).active a').first().trigger('click',{setActive:false})
    }

    showMoreInfo = function (id) {
        $('.form-process', newsDiv).fadeIn()

        var param = {
            title: '信息中心',
            url:'/news'
        }

        var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
        encrypted = encrypted.toString()

        storage['sortBy'] = JSON.stringify(getSortBy())
        storage['keyWord'] = keyWord.val()||''
        storage['current'] = $('#pageInfo li.page-number.active',newsCell)[0].outerText||1

        window.location.href = '/news/detail/' + id + '?param=' + encrypted
    }

    pageList = function (page, id, limit){
        $('.nav.nav-pills li:not(.questionSort).active a').first().trigger('click',{page:page,setActive:false})
    }

    $('.nav.nav-pills li:not(.questionSort) a').on('click', function (e, obj) {
        if (obj === undefined) {
            $('.nav.nav-pills li:not(.questionSort).active').first().removeClass('active')
            $(this).parents().first().addClass('active')
        }
        var page = 1,
            sort = getSortBy(),
            param = {
                page:page,
                sort:sort,
                key:{

                }
            },
            type = this.getAttribute('news-type')

        if(e.currentTarget.className === 'pageInfo') {
            page = Number(e.currentTarget.innerText)
        } else if (obj && obj.page !== undefined){
            page = obj.page
        }

        if (type !== null && type !== undefined) {
            param.key.type = type
        }

        if (keyWord.val() !== '' && keyWord.val() !== undefined) {
            param.key.title = {$regex: keyWord.val()}
        }

        $('.form-process', newsDiv).fadeIn()

        newsCell.load('/news/list?param='+JSON.stringify(param), function () {
            $('.form-process', newsDiv).fadeOut()
            initPage($('#pagetotal', newsCell).val(), $('#pageCurrent', newsCell).val(), 10, 'newsCell')
            $('#gotoTop').trigger('click')
        })
    })

    collectionNews = function (id, obj) {
        var type = $(obj).find('i.icon-star3').length
        $.ajax({
            type: type === 0 ? 'put' : 'delete',
            url: '/news/collection/' + id,
            success: function (result) {
                if (result.error) {
                    showMessage(result.error, '', 1000)
                } else {
                    if (type === 0) {
                        showMessage('收藏成功', 'success', 1000)
                        $(obj).find('span:last-child').html(Math.max(Number(result),0))
                        $(obj).find('i').removeClass('icon-star2')
                        $(obj).find('i').addClass('icon-star3')
                    } else {
                        showMessage('取消收藏成功', 'success', 1000)
                        $(obj).find('span:last-child').html(Math.max(Number(result),0))
                        $(obj).find('i').removeClass('icon-star3')
                        $(obj).find('i').addClass('icon-star2')
                    }
                }
            }
        })
    }

    likeNews = function (id, obj) {
        $.ajax({
            type: 'put',
            url: '/news/like/' + id,
            success: function (result) {
                if (result.error) {
                    showMessage(result.error, '', 1000)
                } else {
                    showMessage('点赞成功', 'success', 1000)
                    $(obj).find('span:last-child').html(Math.max(Number(result),0))
                    // $(obj).find('span').html(Math.max(Number(result),0))
                }
            }
        })
    }

    showSubText = function (id) {
        $('#'+id).slideToggle();
        $('#'+id).find('textarea')[0].value = ''
    }

    addReplyTo = function (newsId,commentId, obj) {
        var c_obj = $('#'+commentId)
        if (c_obj.find('textarea')[0].value === '') {
            c_obj.find('textarea').addClass('error')
            return;
        }

        $('.form-process', commentform).fadeIn()
        $.ajax({
            type: 'post',
            data: {
                content: encodeURI(c_obj.find('textarea')[0].value),
                bid: newsId,
                replyTo: commentId
            },
            url: '/news/comment',
            success: function (result) {
                $('.form-process', commentform).fadeOut()
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    showMessage('回复提交成功', 'success', 2000)
                    c_obj.find('textarea')[0].value = ''
                    c_obj.slideToggle()
                    $('#commentNum').html(Math.max(Number(result),0))
                    $('#commentNumMini').html(Math.max(Number(result),0))
                    $('#commentlist').load('/news/comment/'+ newsId, function () {
                        initPage($('#pagetotal', commentform).val(), $('#pageCurrent', commentform).val(), 10, 'comment')
                    })
                }
            }
        })
    }

    setSortParam = function (sortBy) {
        var param
        if (sortBy !== undefined) {
            param = JSON.parse(sortBy)
        } else {
            param = {updateTime: 'desc'}
        }

        $('.questionSort i').removeClass('active')

        for(var i in Object.keys(param)){
            var key = Object.keys(param)[i]
            var value = param[key]
            var name = ''
            if (key === 'updateTime') name = 'time'
            if (key === 'viewNum') name = 'num'
            $('.questionSort .'+ name + '.' + value).addClass('active')
        }
    }

    getSortBy = function () {
        var tmp = $('.questionSort.time.asc.active')
        var tmp1 = $('.questionSort.num.asc.active')
        var tmp2 = $('.questionSort.time.desc.active')
        var tmp3 = $('.questionSort.num.desc.active')
        var sort = {}
        if (tmp.length !== 0) {
            sort['updateTime'] = 'asc'
        }
        if (tmp1.length !== 0) {
            sort['viewNum'] = 'asc'
        }
        if (tmp2.length !== 0) {
            sort['updateTime'] = 'desc'
        }
        if (tmp3.length !== 0) {
            sort['viewNum'] = 'desc'
        }

        return sort
    }

    search = function () {
        $('.nav.nav-pills li:not(.questionSort).active a').first().trigger('click',{setActive:false})
    }

    initSlider = function(loadComment) {
        $('.nivoSlider').nivoSlider({
            effect: 'random',
            slices: 15,
            boxCols: 12,
            boxRows: 6,
            animSpeed: 500,
            pauseTime: 8000,
            directionNav: true,
            controlNav: true,
            pauseOnHover: true,
            prevText: '<i class="icon-angle-left"></i>',
            nextText: '<i class="icon-angle-right"></i>',
            afterLoad: function(){
                $('#slider').find('.nivo-caption').addClass('slider-caption-bg');
            }
        })

        if (loadComment) {
            $('#commentlist').load('/news/comment/'+ $('#qid').val(), function () {
                initPage($('#pagetotal').val(), $('#pageCurrent').val(), 10, 'comment')
            })
        }
    }
})

