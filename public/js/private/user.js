jQuery(window).load(function(){

    var isUploading = false
    var filesize = 0
    showUserContent('profile')
    initCheckBox()

    $("#avatarFiles").fileinput({
        maxFileCount: 1,
        maxSize:1024*5,
        allowedFileTypes: ["image"],
        browseClass: "btn btn-default",
        removeClass: "btn btn-danger",
        mainClass: "input-group",
        removeIcon: "<i class=\"icon-trash\"></i>",
        language:'zh',
        showRemove: false,
        showCancel:false,
        showUpload: true,
        showDownload: false,
        showZoom: false,
        showDrag:true,
        showPreview:false
    }).on('fileloaded', function (event, file, i, reader) {
        var reader = new FileReader()
        reader.onloadend = function (e) {
            var arrayBuffer = e.target.result
            $('#modifyUserAvatar').cropper('replace',arrayBuffer)
        }
        reader.readAsDataURL(file)
    })

    $('#modifyUserAvatar').cropper({
        aspectRatio: 1,
        minContainerWidth:520,
        minContainerHeight:520,
        minCropBoxWidth:200,
        minCropBoxHeight:200,
        viewMode:2,
        crop: function(e) {
//             console.log(e.x);
//             console.log(e.y);
//             console.log(e.width);
//             console.log(e.height);
//             console.log(e.rotate);
//             console.log(e.scaleX);
//             console.log(e.scaleY);
        }
    })

    saveAvatar = function () {
        if($('#avatarFiles')[0].files.length === 0) {
            $('#profile #errorMsg').html('请选择要上传的图片')
            $('#profile .errormsg').show()
            setTimeout(function() {
                $('#profile .errormsg').fadeOut()
            }, 1500)
            return false
        }

        var dataUrl = $('#modifyUserAvatar').cropper('getCroppedCanvas').toDataURL('image/jpeg', 0.6)
        $('#profile #userAvatar').attr('src',dataUrl)
        $.magnificPopup.close()
    }

    saveCover = function () {
        if($('#coverFiles')[0].files.length === 0) {
            $('#book #errorMsg').html('请选择要上传的图片')
            $('#book .errormsg').show()
            setTimeout(function() {
                $('#book .errormsg').fadeOut()
            }, 1500)
            return false
        }
        var dataUrl = $('#bookCoverImg').cropper('getCroppedCanvas').toDataURL('image/jpeg', 0.6)
        $('#book #bookCover').attr('src',dataUrl)
        $('#book #bookCover').show()
        $('#book .coverLightbox i').fadeOut()
        $('#book .coverLightbox span').fadeOut()
        $.magnificPopup.close()
    }

    resetCover = function () {
        $('#bookCoverImg').cropper('destroy')
        $('#bookCoverImg').attr('src','')
        $("#coverFiles").fileinput('clear')

        $('#book #bookCover').attr('src','')
        $('#book #bookCover').fadeOut()
        $('#book .coverLightbox i').fadeIn()
        $('#book .coverLightbox span').fadeIn()
        $('#bookCoverImg').cropper({
            aspectRatio: 20/31,
            cropBoxResizable:false,
            minContainerWidth:200,
            minContainerHeight:310,
            minCropBoxWidth:200,
            minCropBoxHeight:310,
            viewMode:1,
        })
    }

    resetAvatar = function () {
        $('#modifyUserAvatar').cropper('destroy')
        $('#modifyUserAvatar').attr('src','')
        $('#profile #userAvatar').attr('src','img/avatar.jpg')
        $("#avatarFiles").fileinput('clear')
        $('#modifyUserAvatar').cropper({
            aspectRatio: 1,
            minContainerWidth:520,
            minContainerHeight:520,
            minCropBoxWidth:200,
            minCropBoxHeight:200,
            viewMode:2,
        })
    }

    saveProfile = function () {
        if($('#profile .error').length > 0) {
            return
        }
        $.ajax({
            type: 'post',
            data: {
                nickname: $('#nickname').val(),
                realname: $('#realname').val(),
                surname: $('#surname').val(),
                birthday: $('#birthday').val(),
                email: $('#email').val(),
                phone: $('#phone').val(),
                sex: $('#userSex').val(),
                avatar:$('#userAvatar').attr('src') !== 'img/avatar.jpg' ? $('#userAvatar').attr('src') : ''
            },
            url: '/user/saveProfile',
            success: function (result) {
                if(result.error){
                    showMessage(result.error,'',2000)
                } else {
                    showMessage('个人资料修改成功','success',2000)
                }
            }
        })
    }

    saveBook = function () {
        if (isUploading) return
        var check = 0
        if($('#book .error').length > 0) {
            return
        } else {
            $('#book input[type="text"]:visible').each(function (i,e) {
                if($(e).trigger('keyup').hasClass('error')) {
                    check = 1
                    $(e).focus()
                    return false
                }
            })
        }
        if (check === 1) return

        if ($('#book #bookUploader').pluploadQueue().files.length === 0 && $('#book article .gallery-item').length === 0) {
            showMessage('请选择要上传的家谱文件','',2000)
            return
        }

        var range, canShare
        $('#book').find('input[type=radio]:visible').each(function (e, obj) {
            if (obj.checked && obj.name.indexOf('range-group') >= 0) {
                range = obj.id.replace('range-','')
            }
            if (obj.checked && obj.name.indexOf('canShare') >= 0) {
                canShare = obj.id.replace('canShare','')
            }
        })

        var files = []
        $('#book article .gallery-item').each(function (i, e) {
            var name = $(e).parents('article').first().find('div.portlet-header .file-name')[0].outerText
            var size = $(e).parents('article').first().find('div.portlet-header .file-size')[0].outerText
            if (e.src !== '' && e.src !== undefined) {
                files.push({type:'image',src:e.src,name:name,size:size})
            } else {
                files.push({type:'text',src:e.outerText,name:name,size:size})
            }
        })

        isUploading = true
        $('#book .form-process').fadeIn()

        $.ajax({
            type: 'post',
            data: {
                name: $('#book #bookname').val(),
                cover: $('#book #bookCover').attr('src') !== undefined ? $('#book #bookCover').attr('src') : '',
                id:$('#book #bookId').val(),
                viewRange: range,
                canShare: canShare,
                files:files
            },
            url: '/user/book/save',
            success: function (result) {
                isUploading = false
                if(result.error){
                    showMessage(result.error,'',2000)
                } else {
                    showMessage('家谱提交成功','success',2000)
                    setTimeout(function () {
                        $('#book .form-process').fadeOut()

                        if ($('#book #bookId').val() === '' || $('#book #bookId').val() ===  undefined){
                            $('#book #bookname').val('')
                            $('#book #bookId').val('')
                            $('#book article').remove('')
                            initBookUploader()
                            resetCover()
                        }
                    }, 1000)
                }
            }
        })
    }

    checkValue = function (obj, type, require) {
        if (require && obj.value == '') {
            $(obj).addClass('error')
            return false
        } else {
            $(obj).removeClass('error')
        }
        if (type === 'email') {
            if (obj.value !== '' && !checkEmail(obj.value)) {
                $(obj).addClass('error')
                return false
            } else {
                $(obj).removeClass('error')
            }
        } else if (type === 'nickname') {
            $.ajax({
                type: 'post',
                data: {nickname: obj.value},
                url: '/user/checknickname',
                success: function (result) {
                    if(result){
                        $(obj).removeClass('error')
                        $('#errorMsg').html('')
                    } else {
                        $(obj).addClass('error')
                        $('#errorMsg').html('昵称已被使用')
                        return false
                    }
                }
            })
        } else if (type === 'phone') {
            if (obj.value !== '' && !checkPhone(obj.value)) {
                $(obj).addClass('error')
                return false
            } else {
                $(obj).removeClass('error')
            }
        }
        return true
    }

    chooseSex = function (obj) {
        $('#userSex').val(obj.id.replace('radio-',''))
    }

    showPopUp = function (obj) {
        $('#'+obj).magnificPopup({
            type: 'inline',
            src: '#'+obj,
            mainClass: 'mfp-no-margins mfp-fade',
            closeBtnInside: false,
            fixedContentPos: true,
            overflowY: 'scroll'
        }).magnificPopup('open')
    }

    initUpload = function (node) {
        $('#'+node+'Files').fileinput({
            maxFileCount: 5,
            maxFileSize:1024*3,
            allowedFileTypes: ["image"],
            browseClass: "btn btn-default",
            removeClass: "btn btn-danger",
            mainClass: "input-group",
            removeIcon: "<i class=\"icon-trash\"></i>",
            defaultPreviewContent:$('#imgPaths').length > 0 && $('#imgPaths').val() !== '' ? $('#imageDiv').html() : '',
            language:'zh',
            showRemove: true,
            showCancel:false,
            showUpload: true,
            showDownload: false,
            showZoom: false,
            showDrag:true,
            showPreview:true
        }).on('filecleared', function(e, params) {
            if ($('#imageDiv').length > 0) {
                $('#imageDiv').html('')
                $('#deletePaths').val($('#imgPaths').val())
                $('#imgPaths').val('')
            }
            if (node === 'blog') {
                clearObjectStore('images')
            }
        }).on('fileloaded', function (event, file, i, reader) {
            var key = i.substring(i.length - 1)
            var mpImg = new MegaPixImage(file)
            mpImg.render($('#' + i + ' img')[0], { quality: 0.4 }, function (e) {
                if (node === 'blog') {
                    addData('images',{key:key,value:$('#' + i + ' img')[0].src})
                }
            })
        })
    }

    initSummerNote = function (node) {
        if (node === 'blog') {
            $('#blogContent').summernote({
                lang: 'zh-CN',
                placeholder: '请输入日志的详细内容,最多5000个字...',
                minHeight: 200,
                maxHeight: 600,
                maximumImageFileSize:1024*1024*3,
                focus: false,
                autoLink :false,
                dialogsFade: true,
                dialogsInBody: true,
                height: 253,
                toolbar: [
                    ['style', ['style']],
                    ['font', ['bold', 'italic','underline', 'clear']],
                    ['fontname', ['fontname']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['height', ['height']],
                    ['insert', ['picture']],
                    ['view', ['fullscreen']]
                ],
                disableDragAndDrop:true,
                isSkipPaddingBlankHTML:true,
                callbacks: {
                    onChange: function(contents, $editable) {
                        var contentsContainer = $('<div></div>').html(contents)
                        filesize = contentsContainer.find('img').length
                        // contentsContainer.find('img').each(function (i,e) {
                        //     var str = e.src
                        //     str = str.substring(23)
                        //     var equalIndex= str.indexOf('=');
                        //     if(str.indexOf('=')>0)
                        //     {
                        //         str=str.substring(0, equalIndex);
                        //
                        //     }
                        //     var strLength = str.length
                        //     var fileLength=parseInt(strLength-(strLength/8)*2)
                        //     console.log(fileLength/1024*1024)
                        // })
                        var txt = contentsContainer[0].innerText
                        if(txt.trim() === '') {
                            $('#timeline .note-editor.note-frame .note-placeholder').show()
                        } else {
                            $('#timeline .note-editor.note-frame').css('borderColor', '#ddd')
                        }
                        $('#timeline #wordNumInfo').html( Math.max(5000-txt.length,0))
                        addData('contents', {key:'blogContent',value:encodeURI($('#blogContent').summernote('code'))})
                    },
                    onInsertImagesOrCallback:function (contents) {

                    },onKeydown:function (e) {

                        if (e.key === 'Backspace' || e.keyCode === 8) {
                            return
                        }

                        var os = checkOS()
                        if (((os === 'windows' && e.ctrlKey) || (os === 'mac' && e.metaKey)) && e.keyCode === 65) {
                            return
                        }

                        var tmp = $('#blogContent').summernote('code')
                        var contentsContainer1 = $('<div></div>').html(tmp)
                        var h1 = contentsContainer1[0].innerText.length

                        if (h1 > 5000) {
                            e.originalEvent.preventDefault()
                            e.originalEvent.stopPropagation()
                            e.preventDefault()
                            e.stopPropagation()
                        }
                    },
                    onPaste:function (e) {
                        var tmp = $('#blogContent').summernote('code')
                        var contentsContainer1 = $('<div></div>').html(tmp)
                        var h1 = contentsContainer1[0].innerText.length

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

                        var contentsContainer = $('<div></div>').html(content)
                        var regex = /<meta.*?">| style=".*?;"/g
                        var html = contentsContainer[0].innerHTML
                        html = html.replace(regex, '')
                        contentsContainer.html(html)

                        var h2 = contentsContainer[0].innerText.length

                        if ((h1 + h2) > 5000) {
                            e.originalEvent.preventDefault()
                            e.originalEvent.stopPropagation()
                            e.preventDefault()
                            e.stopPropagation()
                            showMessage('超出最大输入范围','',1000)
                        }
                    },onImageUpload: function(files) {
                        if ((files.length + filesize) > 10) {
                            showMessage('最多上传10张图片','',2000)
                            return false
                        }
                        $.each(files, function (idx, file) {
                            var filename = file.name;
                            if (file.size > 1024 * 1024 * 3) {
                                showMessage('单张图片大小不能超过3MB','',2000)
                                return false
                            }
                            else {
                                var reader = new FileReader();
                                reader.onloadend = function (e) {
                                    var arrayBuffer = e.target.result
                                    $('#blogContent').summernote('insertImage', arrayBuffer, filename)
                                };
                                reader.readAsDataURL(file)
                            }
                        })
                    }
                }
            })
        } else {
            $('#questionContent').summernote({
                lang: 'zh-CN',
                placeholder: '请输入您想要咨询的详细内容,最多3000个字...',
                minHeight: 200,
                maxHeight: 600,
                focus: false,
                autoLink :false,
                height: 298,
                toolbar: false,
                disableDragAndDrop:true,
                isSkipPaddingBlankHTML:true,
                callbacks: {
                    onChange: function(contents, $editable) {
                        if (window.event &&((window.event.type === 'paste' && window.event.currentTarget.isContentEditable !== undefined) || window.event.type === 'click')) {
                            return
                        }
                        var contentsContainer = $('<div></div>').html(contents)
                        var txt = contentsContainer[0].innerText
                        if(txt.trim() === '') {
                            $('#questionContent .note-editor.note-frame .note-placeholder').show()
                        } else {
                            $('#questionContent .note-editor.note-frame').css('borderColor', '#ddd')
                        }
                        $('#question #wordNumInfo').html( Math.max(3000-txt.length,0))
                    },
                    onKeydown:function (e) {

                        var os = checkOS()
                        if (((os === 'windows' && e.ctrlKey) || (os === 'mac' && e.metaKey)) && e.keyCode === 65) {
                            return
                        }

                        if (e.key === 'Backspace' || e.keyCode === 8) {
                            return
                        }

                        var tmp = $('#questionContent').summernote('code')
                        var contentsContainer1 = $('<div></div>').html(tmp)
                        var h1 = contentsContainer1[0].innerText.length

                        if (h1 > 3000) {
                            e.originalEvent.preventDefault()
                            e.originalEvent.stopPropagation()
                            e.preventDefault()
                            e.stopPropagation()
                        }
                    },
                    onPaste:function (e) {
                        e.preventDefault()
                        e.stopPropagation()
                        var tmp = $('#questionContent').summernote('code')
                        var contentsContainer1 = $('<div></div>').html(tmp)
                        var h1 = contentsContainer1[0].innerText.length
                        if (h1 > 3000) return
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

                        var contentsContainer = $('<div></div>').html(content)
                        var regex = /<meta.*?">| style=".*?;"/g
                        var html = contentsContainer[0].innerHTML
                        html = html.replace(regex, '')
                        contentsContainer.html(html)

                        var h2 = contentsContainer[0].innerText.length
                        if ((h1 + h2) > 3000){
                            const regex = /<.*?>/g

                            var m
                            var txt_len = 0
                            var total_len = 0
                            var tmp_str = ''
                            var sub_len = 3000 - h1
                            var str = contentsContainer.html()
                            while ((m = regex.exec(contentsContainer.html())) !== null) {
                                // This is necessary to avoid infinite loops with zero-width matches
                                if (m.index === regex.lastIndex) {
                                    regex.lastIndex++;
                                }

                                if (txt_len !== m.index) {
                                    tmp_str += str.substring(txt_len, m.index)
                                    total_len += (m.index - txt_len)
                                }

                                if (total_len >= sub_len) {
                                    tmp_str = tmp_str.substring(0,tmp_str.length - (total_len - sub_len))
                                    if (m[0].indexOf('</') === 0  ) {
                                        tmp_str += m[0]
                                    }
                                    tmp_str += '</pre>'
                                    break
                                }
                                txt_len = regex.lastIndex

                                if(tmp_str === '') {
                                    tmp_str = m[0]
                                } else {
                                    tmp_str += m[0]
                                }
                            }
                            $('#questionContent').summernote('pasteHTML', tmp_str)
                        } else {
                            $('#questionContent').summernote('pasteHTML', contentsContainer.html())
                        }

                        var contentsContainer11 = $('<div></div>').html($('#questionContent').summernote('code'))
                        var str11 = contentsContainer11[0].innerText

                        $('#question #wordNumInfo').html( Math.max(3000-str11.length,0))
                    }, onImageUpload: function(files) {

                    }
                }
            })
        }
    }

    changeTitle = function () {
        if ($('#title').val() !== '') {
            $('#title').removeClass('error')
        }
    }

    saveBlog = function (obj) {
        if (isUploading) return
        var checkTitle = ($('#timeline #title').val() === undefined || $('#title').val() === '')
        var checkNote = $('#blogContent').summernote('isEmpty')
        if(checkTitle) {
            $('#timeline #title').addClass('error')
            $('#timeline #title').focus()
            return
        }

        var images = $('#timeline .kv-file-content img:visible')
        var file64 = []

        if (images.length === 0 && checkNote) {
            $('#blogContent').summernote('focus')
            showMessage('请输入日志内容或直接上传图片','',2000)
            return
        }

        if (images.length > 0) {
            for (var i in images) {
                var image = images[i]
                if (image.src!== undefined) {
                    file64.push(image.src)
                }
            }
        }

        var content = '', str = ''
        if (!checkNote) {
            content = $('#blogContent').summernote('code')
            var contentsContainer = $('<div></div>').html(content)
            str = contentsContainer[0].innerText
            str = encodeURI(str)
            content = encodeURI(content)
        }
        var range, canShare
        $('#timeline').find('input[type=radio]:visible').each(function (e, obj) {
            if (obj.checked && obj.name.indexOf('range-group') >= 0) {
                range = obj.id.replace('range-','')
            }
            if (obj.checked && obj.name.indexOf('canShare') >= 0) {
                canShare = obj.id.replace('canShare','')
            }
        })
        isUploading = true
        $(obj).addClass('disabled')
        $('#timeline .form-process').fadeIn()
        $.ajax({
            type: 'post',
            data: {
                title: $('#timeline #title').val()
                ,viewRange:range
                ,canShare:canShare
                ,shortContent:str
                ,content:content
                ,images:file64
            },
            url: '/user/blog/add',
            success: function (result) {
                isUploading = false
                $('#timeline .form-process').fadeOut()
                $(obj).removeClass('disabled')
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    $("#blogFiles").fileinput('clear')
                    showMessage('提交成功', 'success', 2000)
                    setTimeout(function() {
                        $('.tooltip').tooltip('hide')
                        $('#blogContent').summernote('reset')
                        $('#timeline #title').val('')
                        $('#timeline #wordNumInfo').html( 5000 )
                    }, 1500)
                }
            }
        })
    }

    deleteBlog = function (id) {
        $.ajax({
            type: 'delete',
            url: '/user/blog/' + id,
            success: function (result) {
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    showMessage('日志删除成功','success',2000)
                    showUserContent('timeline')
                }
            }
        })
    }

    chooseTag = function(id,obj) {
        $('#typeId').val(id)
        $('#chooseTagBtn').html(obj.innerHTML)
        $('#chooseTagBtn').css('color','#555')
    }

    updateBlog = function (obj) {
        if (isUploading) return
        var checkTitle = ($('#timeline #title').val() === undefined || $('#timeline #title').val() === '')
        var checkNote = $('#blogContent').summernote('isEmpty')
        if(checkTitle) {
            $('#timeline #title').addClass('error')
            $('#timeline #title').focus()
            return
        }

        var images = $('#timeline .kv-file-content img:visible')
        var text = $('#timeline #imageDiv').html()
        var file64 = []

        if (images.length === 0 && checkNote && text === '') {
            $('#blogContent').summernote('focus')
            showMessage('请输入日志内容或直接上传图片','',2000)
            return
        }

        if (images.length > 0) {
            for (var i in images) {
                var image = images[i]
                if (image.src!== undefined) {
                    file64.push(image.src)
                }
            }
        }

        var content = '', str = ''
        if (!checkNote) {
            content = $('#blogContent').summernote('code')
            var contentsContainer = $('<div></div>').html(content)
            str = contentsContainer[0].innerText
            str = encodeURI(str)
            content = encodeURI(content)
        }

        isUploading = true
        $('#addBlogForm .form-process').fadeIn();
        setTimeout(500)
        $.ajax({
            type: 'post',
            data: {
                blogId:$('#timeline #blogId').val()
                ,title: $('#timeline #title').val()
                ,viewRange: $('#timeline #viewRange').val()
                ,canShare:$('#timeline #canShare').val()
                ,shortContent:str
                ,content:content
                ,images:file64
                ,imagePaths: $('#timeline #imgPaths').length > 0 ? $('#timeline #imgPaths').val() : ''
                ,deletePaths:$('#timeline #deletePaths').length > 0 ? $('#timeline #deletePaths').val() : ''
            },
            url: '/user/blog/update',
            success: function (result) {
                isUploading = false
                $('#addBlogForm .form-process').fadeOut();
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    if (result.imgPaths && result.imgPaths.length > 0) {
                        $('#timeline #imgPaths').val(result.imgPaths.join(','))
                    }
                    $('#timeline #deletePaths').val('')
                    $('#timeline #uploadinTitle').html('修改成功')
                    showMessage('修改成功', 'success', 2000)
                }
            }
        })
    }

    updateQuestion = function (id, obj) {
        if($('#question .error').length > 0) {
            $('#question .error').focus()
            return
        }
        if (isUploading) return
        var check = 0
        var checkType = ($('#question #typeId').val() === undefined || $('#question #typeId').val() === '')
        var checkNote = $('#questionContent').summernote('isEmpty')
        if(checkType) {
            check = 1
            $('#question #chooseTagBtn').css('color','#d43f3a')
            return
        }
        if(checkNote) {
            check = 1
            $('#question .note-editor.note-frame .note-placeholder').css('color','#d43f3a')
            $('#question .note-editor.note-frame .note-placeholder').show()
            $('#question .note-editor.note-frame').css('borderColor', '#d43f3a')
            $('#questionContent').summernote('focus')
            return
        }

        if (check === 1) return

        var images = $('#question .kv-file-content img:visible')
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
        $(obj).addClass('disabled')
        $(obj).find('.icon-edit').css('display','none')
        $(obj).find('.icon-line-loader').css('display','')
        $(obj).find('.icon-line-loader').addClass('icon-spin')

        var str = $('#questionContent').summernote('code')
        var contentsContainer = $('<div></div>').html(str)

        $.ajax({
            type: 'post',
            data: {
                qid:id
                ,title: $('#question #title').val()
                ,telphone: $('#question #telphone').val()
                ,username:$('#question #username').val()
                ,content:encodeURI(contentsContainer[0].innerText.length > 100 ? contentsContainer[0].innerText.substring(0, 100) : contentsContainer[0].innerText)
                ,html:encodeURI(contentsContainer[0].innerHTML)
                ,type:$('#question #typeId').val()
                ,email:$('#question #email').val()
                ,images:file64
                ,imagePaths: $('#question #imgPaths').length > 0 ? $('#question #imgPaths').val() : ''
                ,deletePaths:$('#question #deletePaths').length > 0 ? $('#question #deletePaths').val() : ''
            },
            url: '/user/question/update',
            success: function (result) {
                isUploading = false
                $(obj).removeClass('disabled')
                $(obj).find('#question .icon-edit').css('display','')
                $(obj).find('#question .icon-line-loader').css('display','none')
                $(obj).find('#question .icon-line-loader').removeClass('icon-spin')
                if (result.error) {
                    showMessage(result.error,'',2000)
                } else {
                    showMessage('修改成功','success',2000)
                    $('#question #deletePaths').val('')
                    if (result.imgPaths && result.imgPaths.length > 0) {
                        $('#question #imgPaths').val(result.imgPaths.join(','))
                    }
                }
            }
        })
    }

    saveQuestion = function (obj) {
        var check = 0
        if($('#question .error').length > 0) {
            $('#question .error').first().focus()
            return
        } else {
            $('#question input[type="text"]:visible').each(function (i,e) {
                if($(e).trigger('keyup').hasClass('error')) {
                    check = 1
                    $(e).focus()
                    return false
                }
            })
            if (check === 1) return
        }
        if (isUploading) return
        var check = 0
        var checkType = ($('#question #typeId').val() === undefined || $('#typeId').val() === '')
        var checkNote = $('#questionContent').summernote('isEmpty')
        if(checkType) {
            check = 1
            $('#question #chooseTagBtn').css('color','#d43f3a')
            return
        }
        if(checkNote) {
            check = 1
            $('#question .note-editor.note-frame .note-placeholder').css('color','#d43f3a')
            $('#question .note-editor.note-frame .note-placeholder').show()
            $('#question .note-editor.note-frame').css('borderColor', '#d43f3a')
            $('#questionContent').summernote('focus')
            return
        }

        if (check === 1) return

        var images = $('#question .kv-file-content img:visible')
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
        $(obj).addClass('disabled')
        $(obj).find('#question .icon-upload').css('display','none')
        $(obj).find('#question .icon-line-loader').css('display','')
        $(obj).find('#question .icon-line-loader').addClass('icon-spin')

        var str = $('#questionContent').summernote('code')
        var contentsContainer = $('<div></div>').html(str)
        $.ajax({
            type: 'post',
            data: {
                title: $('#question #title').val()
                ,telphone: $('#question #telphone').val()
                ,username:$('#question #username').val()
                ,content:encodeURI(contentsContainer[0].innerText.length > 100 ? contentsContainer[0].innerText.substring(0, 100) : contentsContainer[0].innerText)
                ,html:encodeURI(contentsContainer[0].innerHTML)
                ,type:$('#question #typeId').val()
                ,email:$('#question #email').val()
                ,images:file64
            },
            url: '/user/question/add',
            success: function (result) {
                isUploading = false
                $(obj).removeClass('disabled')
                $(obj).find('.icon-upload').css('display','')
                $(obj).find('.icon-line-loader').css('display','none')
                $(obj).find('.icon-line-loader').removeClass('icon-spin')
                if (result.error) {
                    showMessage(result.error,'',2000)
                } else {
                    showMessage('提交成功','success',2000)
                    $("#question #questionFiles").fileinput('clear')
                    $('#question #questionContent').summernote('reset')
                    $('#question #title').val('')
                    $('#question #wordNumInfo').html( 2000 )
                }
            }
        })
    }

    confirmOP = function (id, name, type,value, page, limit) {
        $.ajax({
            type: type,
            url: '/user/'+name+'/'+id+'?value='+encodeURI(value),
            success: function (result) {
                $.magnificPopup.close()
                if (result.error) {
                    showMessage(result.error,'',2000)
                } else {
                    showMessage('操作成功','success', 2000)
                    setTimeout(function () {
                        goBack(name, page, limit)
                    },2000)
                }
            }
        })
    }

    viewDetail = function () {

        var images = $('#timeline .kv-file-content img:visible')
        var images1 =  $('#timeline #imgPaths').length > 0 ? $('#timeline #imgPaths').val() : ''
        var file64 = []

        if (images.length > 0) {
            for (var i in images) {
                var image = images[i]
                if (image.src!== undefined) {
                    file64.push(image.offsetParent.dataset.fileindex)
                }
            }
        } else if (images1 !== ''){
            var tmp = images1.split(',')
            for (var i in tmp) {
                file64.push(i)
            }
        }

        var content = ''
        if (!$('#blogContent').summernote('isEmpty')) {
            content = $('#blogContent').summernote('code')
            content = encodeURI(content)
        }

        if (file64.length === 0 && content === '') {
            showMessage('无可预览内容','',1000)
            return
        }

       if(file64.length > 0) {
           storage['viewIndex'] = file64.join(',')
       }


        window.open('/user/timeline/view?title='+encodeURI($('#timeline #title').val()),'_blank')
    }
})

showUserContent = function (id) {
    $('.main .form-process').fadeIn()
    $('.col_one_fifth div[id*=add]').hide()
    $('.col_one_fifth div[id*=add] button').removeClass('current')
    $('ul li a[href="#'+id+'"]').parents('li').first().addClass('ui-tabs-active')

    $lightboxInlineEl = $('[data-lightbox="inline"]')
    if( $lightboxInlineEl.length > 0 ) {
        $lightboxInlineEl.magnificPopup({
            type: 'inline',
            mainClass: 'mfp-no-margins mfp-fade',
            closeBtnInside: false,
            fixedContentPos: true,
            overflowY: 'scroll'
        });
    }

    $('#'+id).load('/user/'+id,function () {
        $('.main .form-process').fadeOut()
        if (id === 'profile') {
            $('.today').datepicker({
                autoclose: true,
                format: "yyyy-mm-dd",
                todayHighlight: true,
                endDate: "today"
            })
            initCheckBox()
            initUpload('avatar')
        } else if (id === 'timeline') {
            initPage($('#' + id + ' #pagetotal').val(), $('#' + id + ' #pageCurrent').val(), 2, id)
            $('#addBlogDiv').show()
            openDB()
        } else if (id === 'question') {
            initPage($('#' + id + ' #pagetotal').val(), $('#' + id + ' #pageCurrent').val(), 2, id)
            $('#addQuestionDiv').show()
        } else if (id === 'book') {
            initPage($('#' + id + ' #pagetotal').val(), $('#' + id + ' #pageCurrent').val(), 8, id)
            $('#addBookDiv').show()
        } else if (id === 'friend') {
            initPage($('#' + id + ' #pagetotal').val(), $('#' + id + ' #pageCurrent').val(), 8, id)
            $('#addFriendDiv').show()
        } else if (id === 'donate') {
            initPage($('#' + id + ' #pagetotal').val(), $('#' + id + ' #pageCurrent').val(), 8, id)
            $('#addDonateDiv').show()
        }
    })

    initBookUploader = function (){
        if ($("#book #bookUploader").length === 0) return
        if ($("#book #bookUploader").pluploadQueue()) {
            $("#book #bookUploader").pluploadQueue().destroy()
        }

        $("#book #bookUploader").pluploadQueue({
            rename : false,
            dragdrop: true,
            multiple_queues: true,
            filters: {
                max_file_size: '10mb',
                prevent_duplicates: true,
                mime_types: [
                    {title: 'txt', extensions: 'txt'},
                    {title: 'image/*', extensions:'jpg,jpeg,png'}
                ]
            },
            headers: {
                'x-access-token': storage['aesToken']
            },
            multipart: true,
            chunk_size: 0,
            rename: false,
            renameByClick: false,
            autoUpload: false,            // 当选择文件后立即自动进行上传操作
            resize: {
                quality: 50,
                crop: true // crop to exact dimensions
            },
            url: '/template/upload',
            flash_swf_url: 'js/plugins/plupload/js/Moxie.swf',
            silverlight_xap_url: 'js/plugins/plupload/js/Moxie.xap',
            init: {
                Error: function (uploader, errObjecs) {
                    showMessage(errObjecs.message, '', 2000)
                }
            }
        })

        $('#book #bookUploader').pluploadQueue().bind('FilesAdded', FilesAdded)
        $('#book #bookUploader').pluploadQueue().bind('FilesRemoved', FilesRemoved)
        $('#book #bookUploader .plupload_file_status').hide()
        $('#book #bookUploader .plupload_filelist_footer .plupload_file_action').hide()
        $('#book #bookUploader .plupload_buttons .plupload_add').html('<i class="icon-line-file-add" style=""></i><span class="hidden-xs"> 选择</span>')
    }

    FilesAdded = function(uploader, files){
        var total = uploader.total.size
        console.log(total)
        if (total > (1024 * 1024 * 50)) {
            for ( var i = files.length - 1; i >= 0 ; i--) {
                var file = files[i]
                if ((total - file.size) <= (1024 * 1024 * 50)) {
                    files.splice(i)
                    $('#book #bookUploader').pluploadQueue().removeFile(file)
                    break
                } else {
                    $('#book #bookUploader').pluploadQueue().removeFile(file)
                }
            }
            showMessage('单次只可上传50M文件', '', 2000)
        }
        $('#book #bookUploader .plupload_file_status').hide()
        for ( var i = 0; i < files.length ; i++) {
            showImagePreview(files[i])
        }
    }

    FilesRemoved = function (uploader, files) {
        for(var i in files) {
            $('#'+files[i].id).remove()
        }
    }

    showImagePreview = function( file ) {
        var i = Math.floor(Math.log(file.size) / Math.log(1024));
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var out = (file.size / Math.pow(1024, i)).toFixed(2) * 1 + '' + sizes[i];

        var article = $( "<article class=\"portfolio-item pf-uielements\" id='" +file.id+ "'></article>").appendTo($('#portfolio'))
        var item = $( "<div class=\"portfolio-image\"></div>").prependTo(article);
        var overlay = $("<div class=\"portfolio-overlay\"><a href='javascript:void(0)' onclick='delFile("+JSON.stringify(file)+","+ JSON.stringify(file.id) +")' title='删除' class=\"left-icon\"><i class=\"icon-trash2\"></i></a><a href='javascript:void(0)' onclick='viewFiles("+JSON.stringify(file.id)+")' title='查看大图' class=\"right-icon\"><i class=\"icon-zoom-in\"></i></a></div>").appendTo(item)
        var image = $('<img class="preloader2 gallery-item" id="'+file.name+'">').prependTo( item )

        $("<div class='portlet-header portfolio-desc nopadding'><h5 class='file-name'>"+file.name+"</h5><h5 class='file-size'> "+out+"</h5></div>").prependTo(article)

        if (file.type === 'text/plain') {
            var reader = new FileReader();
            reader.onload = function(){
                var contentsContainer = $('<div class="gallery-item" id=\'' +file.name+ '\'></div>').html(this.result)
                image.remove()
                contentsContainer.appendTo(item)
                article.css('width','282px')
                article.addClass('loaded')
            }
            reader.readAsText(file.getNative(),'utf-8')
        } else if (file.type.indexOf('image/') >=0 ) {
            var mpImg = new MegaPixImage(file.getNative())
            mpImg.render(image[0], {quality: 0.4 }, function (h, w) {
                if (h > w) {
                    var tmp = Math.ceil((w / h) * 170)
                    image.css('height','170px')
                    image.css('width',tmp+'px')
                    article.css('width',(tmp+10)+'px')
                } else {
                    var tmp = Math.ceil((w / h) * 170)
                    image.css('height','170px')
                    image.css('width',tmp+'px')
                    article.css('width',(tmp+10)+'px')
                }
                article.addClass('loaded')
            })
        }
    }

    delFile = function (file, obj) {
        $('#'+obj).remove()
        $('#book #bookUploader').pluploadQueue().removeFile(file)
    }

    viewFiles = function (id) {
        var items = []
        var current = 0
        $('#book .gallery-item').each(function (i, e) {
            if(e.src !== '' && e.src !== undefined) {
                items.push({src:e.src,type:'image'})
                if ($(e).parents('article')[0].id === id) {
                    current = i
                }
            } else {
                items.push({src: $('<div class="black-popup"><code style="font-size: 1.5em;font-weight: 500;position: relative;left:20px;">'+e.innerHTML+'</code></div>'),type:'inline'})
                if (e.id === id) {
                    current = i
                }
            }
        })
        $.magnificPopup.open({
            // preloader: false,
            items: items,
            mainClass: 'mfp-no-margins mfp-fade',
            gallery: {
                enabled: true,
                preload:0
            }
        })
        $.magnificPopup.proto.goTo(current)
    }

    showMoreInfo = function (id) {
        $('.main .form-process').show()
        var node = $('.ui-tabs-active.ui-state-active')[0].attributes['aria-controls'].nodeValue
        if (node === 'timeline') {
            openDB()
        }

        $('#'+node).load('/user/'+node+'/'+id+'?current='+$('#' + node + ' #pageCurrent').val(), function () {
            $('.main .form-process').fadeOut()
            if (node === 'timeline') {
                node = 'blog'
                if($('#timeline #imgPaths').val() !== '') {
                    var paths = $('#timeline #imgPaths').val().split(',')
                    for (var i in paths) {
                        addData('images',{key:i, value:paths[i]})
                    }
                }
            } else if (node === 'book') {
                initEditBookView()
                return
            }

            initUpload(node)
            initSummerNote(node)
            initCheckBox()

            SEMICOLON.widget.loadFlexSlider()

            $('#'+node+'Content').summernote('code', $('#contentDiv').html())

        })
    }

    pageList = function (page, id, limit){
        $('#'+id).load('/user/'+id+'?current='+page+'&limit='+limit, function () {
            initPage($('#' + id + ' #pagetotal').val(), $('#' + id + ' #pageCurrent').val(), limit, id)
            $('#gotoTop').trigger('click')
        })
    }

    initEditBookView = function () {
        initBookUploader()
        initCheckBox()
        $( "#book #portfolio" ).sortable({handle:'.portlet-header:not(.nomove)'})
        $( "#book #portfolio" ).disableSelection()

        $lightboxInlineEl = $('[data-lightbox="inline"]')
        if( $lightboxInlineEl.length > 0 ) {
            $lightboxInlineEl.magnificPopup({
                type: 'inline',
                mainClass: 'mfp-no-margins mfp-fade',
                closeBtnInside: false,
                fixedContentPos: true,
                overflowY: 'scroll'
            });
        }

        $("#book #coverFiles").fileinput({
            maxFileCount: 1,
            maxSize:1024*5,
            allowedFileTypes: ["image"],
            browseClass: "btn btn-default",
            removeClass: "btn btn-danger",
            mainClass: "input-group",
            removeIcon: "<i class=\"icon-trash\"></i>",
            language:'zh',
            showRemove: false,
            showCancel:false,
            showUpload: true,
            showDownload: false,
            showZoom: false,
            showDrag:true,
            showPreview:false
        }).on('fileloaded', function (event, file, i, reader) {
            var reader = new FileReader()
            reader.onloadend = function (e) {
                var arrayBuffer = e.target.result
                $('#bookCoverImg').cropper('replace',arrayBuffer)
            }
            reader.readAsDataURL(file)
        })


        $('#book .plupload_file_action').hide()

        $('#bookCoverImg').cropper({
            aspectRatio: 20/31,
            cropBoxResizable:false,
            minContainerWidth:200,
            minContainerHeight:310,
            minCropBoxWidth:200,
            minCropBoxHeight:310,
            viewMode:1,
            crop: function(e) {
            }
        })
    }

    openAddPage = function (obj, id) {
        if($(obj).hasClass('current')) return
        $('.ui-tabs-active').removeClass('ui-tabs-active')
        $(obj).addClass('current')
        $('#'+id).load('/user/' +id+ '/add?current='+$('#'+id+' #pageCurrent').val(), function () {
            if(id === 'timeline') id = 'blog'
            initUpload(id)
            initSummerNote(id)
            SEMICOLON.widget.loadFlexSlider()
            if (id === 'blog') {
                initCheckBox()
                openDB()
            } else if (id === 'book') {
                initEditBookView()
            }
        })
    }

    goBack = function (id, page, limit) {
        if (page === undefined || page === 'undefined') {
            page = 1
        }
        if (limit === undefined) {
            limit = 2
        }
        $('div[id*=add] button').removeClass('current')
        $('ul li a[href="#'+id+'"]').parents('li').first().addClass('ui-tabs-active')
        $('#'+id).load('/user/'+id+'?current='+page+'&limit='+limit, function () {
            initPage($('#' + id + ' #pagetotal').val(), page, limit, id)
            $('#gotoTop').trigger('click')
        })
    }

    resetImageView = function (obj) {
        var w = obj.naturalWidth, h = obj.naturalHeight
        if (h > w) {
            var tmp = Math.ceil((w / h) * 170)
            $(obj).css('height','170px')
            $(obj).css('width',tmp+'px')
            $(obj).parents('article').first().css('width',(tmp+10)+'px')
        } else {
            var tmp = Math.ceil((w / h) * 170)
            $(obj).css('height','170px')
            $(obj).css('width',tmp+'px')
            $(obj).parents('article').first().css('width',(tmp+10)+'px')
        }
        $(obj).parents('article').first().addClass('loaded')
    }
}

initCheckBox = function () {
    $('input').iCheck({
        radioClass: 'iradio_square',
        checkboxClass: 'icheckbox_square',
        increaseArea: '20%' // optional
    })
}
