var $validator
var isUploading = false

jQuery(document).ready(function() {

    var chooseTagBtn = $('#chooseTagBtn')

    $(document).on('input propertychange', 'textarea', function() {
        $('#wordNumInfo').html(Math.max(3000 - this.value.length,0))
    })

    if ($("#questionFiles").length>0) {
        $("#questionFiles").fileinput({
            rtl: true,
            maxFileCount: 5,
            maxSize:1024*2,
            allowedFileTypes: ["image"],
            previewFileType: "image",
            browseClass: "btn btn-default",
            removeClass: "btn btn-danger",
            mainClass: "input-group",
            removeIcon: "<i class=\"icon-trash\"></i>",
            language:'zh',
            showRemove: true,
            showCancel:true,
            showUpload: true,
            showDownload: false,
            showZoom: false,
            showDrag:true
        })

        // $('#questionContent').summernote({
        //     lang: 'zh-CN',
        //     placeholder: '请输入您想要咨询的详细内容,最多3000个字...',
        //     minHeight: 250,
        //     maxHeight: 800,
        //     focus: true,
        //     autoLink :false,
        //     height: 320,
        //     toolbar: false,
        //     disableDragAndDrop:true,
        //     isSkipPaddingBlankHTML:true,
        //     callbacks: {
        //         onChange: function(contents, $editable) {
        //             if (window.event &&((window.event.type === 'paste' && window.event.currentTarget.isContentEditable !== undefined) || window.event.type === 'click')) {
        //                 return
        //             }
        //             var contentsContainer = $('<div></div>').html(contents)
        //             var txt = contentsContainer[0].innerText
        //             if(txt.trim() === '') {
        //                 // $('.note-editor.note-frame').css('borderColor', '#d43f3a')
        //                 // $('.note-editor.note-frame .note-placeholder').css('color','#d43f3a')
        //                 $('.note-editor.note-frame .note-placeholder').show()
        //             } else if (txt.trim().length > 3000) {
        //                 contentsContainer[0].innerText = contentsContainer[0].innerText.trim().substring(0,3000)
        //                 $('#questionContent').summernote('code', contentsContainer.html())
        //             } else {
        //                 // $('.note-editor.note-frame .note-placeholder').css('color', 'gray')
        //                 // $('.note-editor.note-frame .note-placeholder').hide()
        //                 $('.note-editor.note-frame').css('borderColor', '#ddd')
        //             }
        //             $('#wordNumInfo').html( Math.max(3000-txt.length,0))
        //         },
        //         onInsertImagesOrCallback:function (contents) {
        //             alert('1111')
        //         },
        //         onPaste:function (e) {
        //             var s1 = replaceStr(e.currentTarget.innerText)
        //             if (s1.length > 3000) {
        //                 e.preventDefault()
        //                 e.stopPropagation()
        //             }
        //         }, onImageUpload: function(files) {
        //
        //         }
        //     }
        // })

        $validator = $("#addQuestionForm").validate({
            rules: {
                username: {
                    required: true
                },
                email: {
                    required: true,
                    email: true
                },
                telphone: {
                    required: function () {
                        var check = checkPhone($('#telphone').val())
                        if (check) {
                            $('#telphone').removeClass('error')
                        } else {
                            $('#telphone').addClass('error')
                        }
                        return check
                    }
                },
                title: {
                    required: true
                },
                questionContent: {
                    required: true
                }
            }
        })
    } else {
        if ($('#pageInfo').length > 0) {
            initTableView({'page':1})
        }
        try {
            $('.typeahead').typeahead(
            {
                input: '#keyWord',
                minLength:1,
                maxLength:20,
                offset: true,
                hint: true,
                searchOnFocus: true,
                href: "/question/getTitles",
                cache: true
            });
        } catch (e) {
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
        }
    }

    collectionQuestion = function (id, obj) {
        var type = $(obj).find('i.icon-star3').length
        $.ajax({
            type: type === 0 ? 'put' : 'delete',
            url: '/question/collection/' + id,
            success: function (result) {
                if (result.error) {
                    showMessage(result.error, '', 1000)
                } else {
                    if(type === 0) {
                        showMessage('收藏成功', 'success', 1000)
                        $(obj).find('span').html(result)
                        $(obj).find('i').removeClass('icon-star2')
                        $(obj).find('i').addClass('icon-star3')
                    } else {
                        showMessage('取消收藏成功', 'success', 1000)
                        $(obj).find('span').html(result)
                        $(obj).find('i').removeClass('icon-star3')
                        $(obj).find('i').addClass('icon-star2')
                    }
                }
            }
        })
    }

    likeQuestion = function (id, obj) {
        $.ajax({
            type: 'put',
            url: '/question/like/' + id,
            success: function (result) {
                if (result.error) {
                    showMessage(result.error, '', 1000)
                } else {
                    showMessage('点赞成功', 'success', 1000)
                    $(obj).find('span').html(result)
                }
            }
        })
    }
})

    // function insertFiles(files) {
    //     $.each(files, function (idx, file) {
    //         var filename = file.name;
    //
    //         if (file.size > 1024 * 1024 * 5) {
    //             $('#questionContent').attr('data-notify-msg','超出最大上传文件大小！')
    //             SEMICOLON.widget.notifications($('#questionContent'))
    //             return false
    //         } else {
    //             var reader = new FileReader();
    //             reader.onloadend = function (e) {
    //                 var arrayBuffer = e.target.result
    //                 $('#questionContent').summernote('insertImage', arrayBuffer, filename)
    //             };
    //             reader.readAsDataURL(file);
    //         }
    //     });
    // }

loadMore = function (obj) {
    initTableView(obj.toString())
}

function replaceStr(str) {
    str = str.replace(/\s+/g, "")
    str = str.replace(/<\/?.+?>/g, "")
    str = str.replace(/[\r\n]/g, "")
    return str
}

function matchStr(str) {
    var r1 = new RegExp(/\s+/)
    var r2 = new RegExp(/<\/?.+?>/)
    var r3 = new RegExp(/[\r\n]/)
    if(!r1.test(str) && !r2.test(str) && !r3.test(str)) {
        return false
    }
    return true
}

function clearStyle(dom) {
    $(dom).children().each(function (e,obj) {
        if (obj.innerHTML !== '') {
            obj.removeAttribute('style')
            if ($(obj).children().length !== 0) {
                $(obj).children().removeAttr('style')
                clearStyle(obj)
            }
        } else {
            if( obj.outerHTML.indexOf('br') < 0)
                $(dom)[0].removeChild(obj)
        }
    })
}

function showContent(id, title,url) {
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify({id:id,title:title,url:url}), '_SALT_G(T#*)')
    encrypted = encrypted.toString()

    window.location.href = '/question/detail?param='+ encrypted
}

function collapsePanel(id, obj) {
    $('#accordion').find('.panel-collapse:visible:not(#' + id + ')').slideToggle()
    var h1 = $(obj).closest('.panel')[0].offsetTop
    $('#' + id).slideToggle(500, function () {
        $('html,body').stop(true).animate({
            'scrollTop': h1
        }, 900, 'easeOutQuad')
    })

    if ($(obj).find('.icon-double-angle-down').length > 0) {
        $(obj).find('.icon-double-angle-down').addClass('icon-double-angle-up')
        $(obj).find('.icon-double-angle-down').removeClass('icon-double-angle-down')
    } else {
        $(obj).find('.icon-double-angle-up').addClass('icon-double-angle-down')
        $(obj).find('.icon-double-angle-up').removeClass('icon-double-angle-up')
    }
}

function chooseTag(id,obj) {
    // .css('color', '#555')
    $('#typeId').val(id)
    $('#chooseTagBtn').html(obj.innerHTML)
    $('.type-error').html('')
}

function sortTime(sortby) {
    initTableView({'page':1,sort:{createTime:sortby}})
    $('.questionSort.active').removeClass('active')
    $('.questionSort.time.'+sortby+':not(.active)').addClass('active')
}

function sortNum(sortby) {
    initTableView({'page':1,sort:{viewNum:sortby}})
    $('.questionSort.active').removeClass('active')
    $('.questionSort.num.'+sortby+':not(.active)').addClass('active')
}

function showMore(type) {
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify({type:type,page:1}), '_SALT_G(T#*)')
        encrypted = encrypted.toString()

    window.location.href = '/question/more?param='+ encrypted
}

function initTableView(query) {
    $.ajax({
        url: '/question/subList?param=' + JSON.stringify(query),
        success: function (result) {
            if (result.error) {
                showMessage(result.error, '', 2000)
            } else {
                var param = []
                if (result.total === 0) {
                    $('#nodata').show()
                    $('#accordion').hide()

                } else {
                    $('#accordion').show()
                    $('#nodata').hide()
                    for (var i in result.rows) {
                        var question = result.rows[i]
                        param.push('<div class="panel panel-default noradius"><div class="panel-heading nopadding">')
                        param.push('<p class="t600 nomargin" style="padding: 18px 15px 18px 18px;">')
                        param.push(question.title)
                        param.push('</p></div>')
                        param.push('<div id="' + question._id.toString() + '" class="panel-collapse" hidden><div class="panel-body"><div class="well">')
                        param.push(decodeURI(question.content.shortContent))
                        param.push('</div><a href="#" class="more-link" title="查看回复" onclick="showContent(\'' + question._id.toString() + '\',\'专家咨询\',\'/question\')">查看回复&nbsp;<i class="icon-comment" style="font-size: 15px;"></i></a>')
                        param.push('</div></div>')
                        param.push('<div class="panel panel-footer nopadding"><div class="divider nomargin divider-center" style="top: -15px;"><a href="#" onclick="collapsePanel(\'' + question._id.toString() + '\',this)" onmouseover="stopAnimate(this)" onmouseout="startAnimate(this)"><i class="icon-double-angle-down animated infinite slideOutDown" style="color: #8B661A"></i></a></div>')
                        param.push('<ul class="entry-meta pull-bottom clearfix" style="margin: -15px 15px 0px 15px;"><li><i class="' + question.icon + '"></i>')
                        param.push(question.tag)
                        param.push('</li>')
                        param.push('<li><i class="icon-private-calendar-4"></i>')
                        param.push(question.createStr)
                        param.push('</li><li><i class="icon-private-user"></i>')
                        param.push(question.username)
                        param.push('</li><li><i class="icon-private-eye-1"></i>')
                        param.push(question.viewNum)
                        param.push('</li>')
                        param.push('<div class="pull-right userShare">')
                        param.push('<a href="javascript:void(0)" onclick="likeQuestion(\'' + question._id.toString() + '\', this)"><i class="icon-like"></i> 点赞 <span>' + (question.likeNum === undefined ? 0 : question.likeNum) + '</span></a>&nbsp;&nbsp;')
                        param.push('<a href="javascript:void(0)" onclick="collectionQuestion(\'' +question._id.toString()+ '\',this)">')
                        if(question.collection === 1) {
                            param.push('<i class="icon-star3"></i> 收藏 <span>' + (question.collectionNum === undefined ? 0 : question.collectionNum) + '</span></a>&nbsp</div>')
                        } else {
                            param.push('<i class="icon-star2"></i> 收藏 <span>' + (question.collectionNum === undefined ? 0 : question.collectionNum) + '</span></a>&nbsp</div>')
                        }
                        param.push('</ul></div></div>')

                    }
                    $('#accordion').html(param.join(''))
                }

                if (result.total !== 0) {
                    $('#pageDiv').show()
                    initPage(result.total, result.current,5)
                } else {
                    $('#pageDiv').hide()
                }

                $('#gotoTop').trigger('click')
            }
        }
    })
}

function addQuestion(obj) {
    if (isUploading) return

    var $valid = $("#addQuestionForm").valid()
    if(!$valid) {
        $validator.focusInvalid()
        return
    }

    var checkType = ($('#typeId').val() === undefined || $('#typeId').val() === '')

    if(checkType) {
        $('.type-error').html('请选择问题类型')
        return
    } else {
        $('.type-error').html('')
    }

    var images = $('.kv-file-content img:visible')
    var file64 = []

    if (images.length > 0) {
        for (var i in images) {
            var image = images[i]
            if (image.src!== undefined) {
                file64.push(image.src)
            }
        }
    }

    isUploading = true
    $('.form-process').fadeIn()

    $.ajax({
        type: 'post',
        data: {title: $('#title').val()
            , telphone: $('#telphone').val()
            ,username:$('#username').val()
            ,content:$('#questionContent').val()
            ,type:$('#typeId').val()
            ,email:$('#email').val()
            ,images:file64
        },
        url: '/question/save',
        success: function (result) {
            isUploading = false
            $('#questionContent').val('')

            if (result.error) {
                showMessage(result.error, '', 2000)
            } else {
                showMessage('咨询提交成功，审核通过后，我们将尽快回复您的问题，请您耐心等待！', '', 2000)
                $("#questionFiles").fileinput('clear')
                $('#')
                SEMICOLON.initialize.goToTop()
                setTimeout(function() {
                    $('.tooltip').tooltip('hide')
                    $('#title').val('')
                    // $('#telphone').val('')
                    // $('#username').val('')
                    // $('#typeId').val('')
                    // $('#email').val('')
                    $('#wordNumInfo').html( 3000 )
                }, 1500)
            }
        }
    })
}

stopAnimate = function (obj) {
    $(obj).children().removeClass('infinite')
    $(obj).children().css('color','#7F5D18')

    if($(obj).children('.icon-double-angle-down').length > 0) {
        $(obj).children().removeClass('icon-double-angle-down')
        $(obj).children().addClass('icon-double-angle-up')
    } else {
        $(obj).children().removeClass('icon-double-angle-up')
        $(obj).children().addClass('icon-double-angle-down')
    }
}

startAnimate = function (obj) {
    $(obj).children().addClass('infinite')
    $(obj).children().css('color','#8b661a')
    if($(obj).children('.icon-double-angle-down').length > 0) {
        $(obj).children().removeClass('icon-double-angle-down')
        $(obj).children().addClass('icon-double-angle-up')
    } else {
        $(obj).children().removeClass('icon-double-angle-up')
        $(obj).children().addClass('icon-double-angle-down')
    }
}

resetMyEvent = function (e) {
    // if (e.bubbles) {
        e.originalEvent.stopPropagation()
    // }
    var types = e.originalEvent.clipboardData.types
    var content = ''
    for(var i in types) {
        if (types[i] === 'text/html') {
            content = e.originalEvent.clipboardData.getData('text/html')
            break;
        } else if (types[i] === 'text/plain'){
            content = e.originalEvent.clipboardData.getData('text/plain')
        }
    }

    if(content === '') {
        $('#questionContent').attr('data-notify-msg','输入有误，只能输入文字信息')
        $('#questionContent').attr('data-notify-type','error')
        SEMICOLON.widget.notifications($('#questionContent'))
        return
    }
    var contentsContainer = $('<div></div>').html(content)
    contentsContainer.removeAttr('style')
    contentsContainer.children().each(function (e,obj) {
        if (obj.innerHTML !== '') {
            obj.removeAttribute('style')
            if ($(obj).children().length !== 0) {
                $(obj).children().removeAttr('style')
                clearStyle(obj)
            }
        } else {
            if( obj.outerHTML.indexOf('br') < 0)
                contentsContainer[0].removeChild(obj)
        }
    })
    console.log(contentsContainer.html())
    $('#questionContent').summernote('pasteHTML', contentsContainer.html())
    $('.note-editor.note-frame .note-placeholder').css('color', 'gray')
    $('.note-editor.note-frame .note-placeholder').hide()
    $('.note-editor.note-frame').css('borderColor', '#ddd')
}

showQuestionList = function (num) {

    initTableView({page:num})
}

getMoreQueryParam = function (param) {

    var query = {
        page: param.offset
        , limit: param.limit
        , key: {}
    }

    if (param.sort !== undefined) {
        query.sort[param.sort] = param.order
    }
    if ($('#keyWord').val() !== '' && $('#keyWord').val() !== undefined) {
        query.key.title = {$regex: $('#keyWord').val()}
    }
    return {param: JSON.stringify(query)}
}

setDetailFormatter = function(value, row, index) {
    var a = []
    a.push('<a href="javascript:void(0)" class="social-icon si-borderless si-buffer" data-toggle="tooltip" data-placement="bottom" title="查看明细" onclick="showContent(\'' + row._id.toString() + '\',\'' +  $('#moreTitle').val() + '\',' + '\'/question' + '\')">')
    a.push('<i class="icon-hand-up"></i><i class="icon-hand-up"></i></a>')

    return a.join('')
}

showQuestionByType = function(type) {

    var e = event || window.event
    var page = 1
    if(e.currentTarget.className === 'pageInfo') {
        page = Number(e.currentTarget.innerText)
    }

    var sort =getSortBy()
    var param = {
        page:page,
        sort:sort,
        key:{

        }
    }
    if (type !== 'all') {
        param.key.type = type
    }
    if ($('#keyWord').val() !== '' && $('#keyWord').val() !== undefined) {
        param.key.title = {$regex: $('#keyWord').val()}
    }
    initTableView(param)
}

getSortBy = function () {
    var tmp = $('.questionSort.time.asc.active')
    var tmp1 = $('.questionSort.num.asc.active')
    var tmp2 = $('.questionSort.time.desc.active')
    var tmp3 = $('.questionSort.num.desc.active')
    var sort = {}
    if (tmp.length !== 0) {
        sort['createTime'] = 'asc'
    }
    if (tmp1.length !== 0) {
        sort['viewNum'] = 'asc'
    }
    if (tmp2.length !== 0) {
        sort['createTime'] = 'desc'
    }
    if (tmp3.length !== 0) {
        sort['viewNum'] = 'desc'
    }

    return sort
}

// initPage = function (totalRows, pageNumber, pageSize) {
//
//     var html = [],
//         i, from, to,
//         $first, $pre,
//         $next, $last,
//         $number
//
//     pageNumber = Number(pageNumber)
//     var totalPages = 0
//     if (totalRows) {
//         totalPages = Math.ceil(totalRows / pageSize)
//     }
//     if (totalPages > 0 && pageNumber > totalPages) {
//         pageNumber =totalPages;
//     }
//
//     pageFrom = (pageNumber - 1) * pageSize + 1;
//     pageTo = pageNumber * pageSize;
//     if (pageTo > totalRows) {
//         pageTo = totalRows;
//     }
//
//     $('#total').html(totalRows)
//     $('#current').html(Math.min(pageNumber * Number(pageSize),totalRows))
//     $('#start').html(Math.max((pageNumber - 1) * Number(pageSize) + 1,1))
//
//         html.push('<div class="pull-right pagination nomargin">',
//         '<ul class="pagination pagination-normal label-primbreadcrumbary pagination-lg">',
//         '<li class="page-pre"><a href="javascript:void(0)" class="pageInfo"  onclick="pageList(1)"><i class="icon-angle-left icon-lg"></i></a></li>');
//
//         if (totalPages < 5) {
//             from = 1;
//             to = totalPages;
//         } else {
//             from = pageNumber - 2;
//             to = from + 4;
//             if (from < 1) {
//                 from = 1;
//                 to = 5;
//             }
//             if (to > totalPages) {
//                 to = totalPages;
//                 from = to - 4;
//             }
//         }
//
//         if (totalPages >= 6) {
//             if (pageNumber >= 3) {
//                 html.push('<li class="page-first' + (1 === pageNumber ? ' active' : '') + '">',
//                     '<a href="javascript:void(0)" class="pageInfo"  pageList(1)>', 1, '</a>',
//                     '</li>');
//
//                 from++;
//             }
//
//             if (pageNumber >= 4) {
//                 if (pageNumber == 4 || totalPages == 6 || totalPages == 7) {
//                     from--;
//                 } else {
//                     html.push('<li class="page-first-separator disabled">',
//                         '<a href="javascript:void(0)" class="pageInfo">...</a>',
//                         '</li>');
//                 }
//
//                 to--;
//             }
//         }
//
//         if (totalPages >= 7) {
//             if (pageNumber >= (totalPages - 2)) {
//                 from--;
//             }
//         }
//
//         if (totalPages == 6) {
//             if (pageNumber >= (totalPages - 2)) {
//                 to++;
//             }
//         } else if (totalPages >= 7) {
//             if (totalPages == 7 || pageNumber >= (totalPages - 3)) {
//                 to++;
//             }
//         }
//
//         for (i = from; i <= to; i++) {
//             html.push('<li class="page-number' + (i === pageNumber ? ' active' : '') + '">',
//                 '<a href="javascript:void(0)" class="pageInfo" onclick="pageList(\''+ i +'\')">', i, '</a>',
//                 '</li>');
//         }
//
//         if (totalPages >= 8) {
//             if (pageNumber <= (totalPages - 4)) {
//                 html.push('<li class="page-last-separator disabled">',
//                     '<a href="javascript:void(0)" class="pageInfo">...</a>',
//                     '</li>');
//             }
//         }
//
//         if (totalPages >= 6) {
//             if (pageNumber <= (totalPages - 3)) {
//                 html.push('<li class="page-last' + (totalPages === pageNumber ? ' active' : '') + '">',
//                     '<a href="javascript:void(0)" class="pageInfo" onclick="pageList(\''+ totalPages +'\')">', totalPages, '</a>',
//                     '</li>');
//             }
//         }
//
//         // var lastPage = Math.max()
//         html.push(
//             '<li class=""><a href="javascript:void(0)" class="pageInfo" onclick="pageList(\'' + to + '\')"><i class="icon-angle-right icon-lg"></i></a></li>',
//             '</ul>',
//             '</div>');
//
//         $('#pageInfo').html(html.join(''))
//
//         $first = $('#pagination').find('.page-first');
//         $pre = $('#pagination').find('.page-pre');
//         $next = $('#pagination').find('.page-next');
//         $last = $('#pagination').find('.page-last');
//         $number = $('#pagination').find('.page-number');
//
//         if (pageNumber === 1) {
//             $pre.addClass('disabled');
//         }
//         if (pageNumber === totalPages) {
//             $next.addClass('disabled');
//         }
// };

pageList = function (page){

    $('#portfolio-filter .activeFilter a').trigger('click',{page:page})
}

searchByKeyword = function () {
    $('#portfolio-filter .activeFilter a').trigger('click')
}

searchByList = function () {

    $("#questionList").bootstrapTable('refresh')
}

nextQuestion = function (time) {
    var param = {
        id: $('#qid').val(),
        title: $('#qtitle').val(),
        url: $('#qurl').val(),
        key: {createTime:{"$gte": new Date(time.substring(0, 10) + "T00:00:00")}},
        order: {createTime: 1}
    }
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()

    window.location.href = '/question/detail?param='+ encrypted
}

prevQuestion = function (time) {
    var param = {
        id: $('#qid').val(),
        title: $('#qtitle').val(),
        url: $('#qurl').val(),
        key: {createTime:{"$lte": new Date(time.substring(0, 10) + "T00:00:00")}},
        order: {createTime: -1}
    }
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()

    window.location.href = '/question/detail?param='+ encrypted
}
