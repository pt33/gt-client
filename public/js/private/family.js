jQuery(window).load(function() {

    var isUploading = false
    var filesize = 0

    $($('.custom-filter li a')[0]).trigger('click')

    saveCover = function () {
        if ($('#coverFiles')[0].files.length === 0) {
            $('#errorMsg').html('请选择要上传的图片')
            $('.errormsg').show()
            setTimeout(function () {
                $('.errormsg').fadeOut()
            }, 1500)
            return false
        }
        var dataUrl = $('#bookCoverImg').cropper('getCroppedCanvas').toDataURL('image/jpeg', 0.6)
        $('#bookCover').attr('src', dataUrl)
        $('#bookCover').show()
        $('.coverLightbox i').fadeOut()
        $('.coverLightbox span').fadeOut()
        $.magnificPopup.close()
    }

    resetCover = function () {
        $('#bookCoverImg').cropper('destroy')
        $('#bookCoverImg').attr('src', '')
        $("#coverFiles").fileinput('clear')

        $('#bookCover').attr('src', '')
        $('#bookCover').fadeOut()
        $('.coverLightbox i').fadeIn()
        $('.coverLightbox span').fadeIn()
        $('#bookCoverImg').cropper({
            aspectRatio: 20 / 31,
            cropBoxResizable: false,
            minContainerWidth: 200,
            minContainerHeight: 310,
            minCropBoxWidth: 200,
            minCropBoxHeight: 310,
            viewMode: 1,
        })
    }

    saveBook = function () {
        if (isUploading) return
        var check = 0
        if ($('.error').length > 0) {
            return
        } else {
            $('input[type="text"]:visible').each(function (i, e) {
                if ($(e).trigger('keyup').hasClass('error')) {
                    check = 1
                    $(e).focus()
                    return false
                }
            })
        }
        if (check === 1) return

        if ($('#bookUploader').pluploadQueue().files.length === 0 && $('article .gallery-item').length === 0) {
            showMessage('请选择要上传的家谱文件', '', 2000)
            return
        }

        var range, canShare
        $('#book').find('input[type=radio]:visible').each(function (e, obj) {
            if (obj.checked && obj.name.indexOf('range-group') >= 0) {
                range = obj.id.replace('range-', '')
            }
            if (obj.checked && obj.name.indexOf('canShare') >= 0) {
                canShare = obj.id.replace('canShare', '')
            }
        })

        var files = []
        $('article .gallery-item').each(function (i, e) {
            var name = $(e).parents('article').first().find('div.portlet-header .file-name')[0].outerText
            var size = $(e).parents('article').first().find('div.portlet-header .file-size')[0].outerText
            if (e.src !== '' && e.src !== undefined) {
                files.push({type: 'image', src: e.src, name: name, size: size})
            } else {
                files.push({type: 'text', src: e.outerText, name: name, size: size})
            }
        })

        isUploading = true
        $('.form-process').fadeIn()

        $.ajax({
            type: 'post',
            data: {
                name: $('#bookname').val(),
                cover: $('#bookCover').attr('src') !== undefined ? $('#bookCover').attr('src') : '',
                id: $('#bookId').val(),
                viewRange: range,
                canShare: canShare,
                files: files
            },
            url: '/user/book/save',
            success: function (result) {
                isUploading = false
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    showMessage('家谱提交成功', 'success', 2000)
                    setTimeout(function () {
                        $('.form-process').fadeOut()

                        if ($('#bookId').val() === '' || $('#bookId').val() === undefined) {
                            $('#bookname').val('')
                            $('#bookId').val('')
                            $('article').remove('')
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
                    if (result) {
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

    initUpload = function (node) {
        $('#' + node + 'Files').fileinput({
            maxFileCount: 5,
            maxFileSize: 1024 * 3,
            allowedFileTypes: ["image"],
            browseClass: "btn btn-default",
            removeClass: "btn btn-danger",
            mainClass: "input-group",
            removeIcon: "<i class=\"icon-trash\"></i>",
            defaultPreviewContent: $('#imgPaths').length > 0 && $('#imgPaths').val() !== '' ? $('#imageDiv').html() : '',
            language: 'zh',
            showRemove: true,
            showCancel: false,
            showUpload: true,
            showDownload: false,
            showZoom: false,
            showDrag: true,
            showPreview: true
        }).on('filecleared', function (e, params) {
            if ($('#' + node + ' #imageDiv').length > 0) {
                $('#' + node + ' #imageDiv').html('')
                $('#' + node + ' #deletePaths').val($('#imgPaths').val())
                $('#' + node + ' #imgPaths').val('')
            }
            if (node === 'blog') {
                clearObjectStore('images')
            }
        }).on('fileloaded', function (event, file, i, reader) {
            var key = i.substring(i.length - 1)
            var mpImg = new MegaPixImage(file)
            mpImg.render($('#' + i + ' img')[0], {quality: 0.4}, function (e) {
                if (node === 'blog') {
                    addData('images', {key: key, value: $('#' + i + ' img')[0].src})
                }
            })
        })
    }

    initSummerNote = function (node) {
        $('#' + node + 'Content').summernote({
            lang: 'zh-CN',
            placeholder: '请输入日志的详细内容,最多5000个字...',
            minHeight: 200,
            maxHeight: 600,
            maximumImageFileSize: 1024 * 1024 * 3,
            focus: false,
            autoLink: false,
            dialogsFade: true,
            dialogsInBody: true,
            height: 253,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'italic', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['height', ['height']],
                ['insert', ['picture']],
                ['view', ['fullscreen']]
            ],
            disableDragAndDrop: true,
            isSkipPaddingBlankHTML: true,
            callbacks: {
                onChange: function (contents, $editable) {
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
                    if (txt.trim() === '') {
                        $('.note-editor.note-frame .note-placeholder').show()
                    } else {
                        $('.note-editor.note-frame').css('borderColor', '#ddd')
                    }
                    $('#wordNumInfo').html(Math.max(5000 - txt.length, 0))
                    addData('contents', {key: 'blogContent', value: encodeURI($('#blogContent').summernote('code'))})
                },
                onInsertImagesOrCallback: function (contents) {

                }, onKeydown: function (e) {

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
                onPaste: function (e) {
                    var tmp = $('#blogContent').summernote('code')
                    var contentsContainer1 = $('<div></div>').html(tmp)
                    var h1 = contentsContainer1[0].innerText.length

                    var types = e.originalEvent.clipboardData.types
                    var content = ''
                    for (var i in types) {
                        if (types[i] === 'text/html') {
                            content = e.originalEvent.clipboardData.getData('text/html')
                            break;
                        } else if (types[i] === 'text/plain') {
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
                        showMessage('超出最大输入范围', '', 1000)
                    }
                }, onImageUpload: function (files) {
                    if ((files.length + filesize) > 10) {
                        showMessage('最多上传10张图片', '', 2000)
                        return false
                    }
                    $.each(files, function (idx, file) {
                        var filename = file.name;
                        if (file.size > 1024 * 1024 * 3) {
                            showMessage('单张图片大小不能超过3MB', '', 2000)
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
    }

    changeTitle = function () {
        if ($('#title').val() !== '') {
            $('#title').removeClass('error')
        }
    }

    saveBlog = function (obj) {
        if (isUploading) return
        var checkTitle = ($('#title').val() === undefined || $('#title').val() === '')
        var checkNote = $('#blogContent').summernote('isEmpty')
        if (checkTitle) {
            $('#title').addClass('error')
            $('#title').focus()
            return
        }

        var images = $('.kv-file-content img:visible')
        var file64 = []

        if (images.length === 0 && checkNote) {
            $('#blogContent').summernote('focus')
            showMessage('请输入日志内容或直接上传图片', '', 2000)
            return
        }

        if (images.length > 0) {
            for (var i in images) {
                var image = images[i]
                if (image.src !== undefined) {
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
        $('#posts').find('input[type=radio]:visible').each(function (e, obj) {
            if (obj.checked && obj.name.indexOf('range-group') >= 0) {
                range = obj.id.replace('range-', '')
            }
            if (obj.checked && obj.name.indexOf('canShare') >= 0) {
                canShare = obj.id.replace('canShare', '')
            }
        })
        isUploading = true
        $('.form-process').fadeIn()
        $.ajax({
            type: 'post',
            data: {
                title: $('#title').val()
                , viewRange: range
                , canShare: canShare
                , shortContent: str
                , content: content
                , images: file64
            },
            url: '/user/blog/add',
            success: function (result) {
                isUploading = false
                $('.form-process').fadeOut()
                if (result.error) {
                    showMessage(result.error, '', 2000)
                } else {
                    $("#blogFiles").fileinput('clear')
                    showMessage('提交成功', 'success', 2000)
                    setTimeout(function () {
                        $('.tooltip').tooltip('hide')
                        $('#blogContent').summernote('reset')
                        $('#title').val('')
                        $('#wordNumInfo').html(5000)
                    }, 1500)
                }
            }
        })
    }

    viewDetail = function () {

        var images = $('.kv-file-content img:visible')
        var images1 = $('#imgPaths').length > 0 ? $('#imgPaths').val() : ''
        var file64 = []

        if (images.length > 0) {
            for (var i in images) {
                var image = images[i]
                if (image.src !== undefined) {
                    file64.push(image.offsetParent.dataset.fileindex)
                }
            }
        } else if (images1 !== '') {
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
            showMessage('无可预览内容', '', 1000)
            return
        }

        if (file64.length > 0) {
            storage['viewIndex'] = file64.join(',')
        }


        window.open('/family/blog/view?title=' + encodeURI($('#title').val()), '_blank')
    }

    initBookUploader = function () {
        if ($("#bookUploader").length === 0) return
        if ($("#bookUploader").pluploadQueue()) {
            $("#bookUploader").pluploadQueue().destroy()
        }

        $("#bookUploader").pluploadQueue({
            rename: false,
            dragdrop: true,
            multiple_queues: true,
            filters: {
                max_file_size: '10mb',
                prevent_duplicates: true,
                mime_types: [
                    {title: 'txt', extensions: 'txt'},
                    {title: 'image/*', extensions: 'jpg,jpeg,png'}
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

        $('#bookUploader').pluploadQueue().bind('FilesAdded', FilesAdded)
        $('#bookUploader').pluploadQueue().bind('FilesRemoved', FilesRemoved)
        $('#bookUploader .plupload_file_status').hide()
        $('#bookUploader .plupload_filelist_footer .plupload_file_action').hide()
        $('#bookUploader .plupload_buttons .plupload_add').html('<i class="icon-line-file-add" style=""></i><span class="hidden-xs"> 选择</span>')
    }

    FilesAdded = function (uploader, files) {
        var total = uploader.total.size
        console.log(total)
        if (total > (1024 * 1024 * 50)) {
            for (var i = files.length - 1; i >= 0; i--) {
                var file = files[i]
                if ((total - file.size) <= (1024 * 1024 * 50)) {
                    files.splice(i)
                    $('#bookUploader').pluploadQueue().removeFile(file)
                    break
                } else {
                    $('#bookUploader').pluploadQueue().removeFile(file)
                }
            }
            showMessage('单次只可上传50M文件', '', 2000)
        }
        $('#bookUploader .plupload_file_status').hide()
        for (var i = 0; i < files.length; i++) {
            showImagePreview(files[i])
        }
    }

    FilesRemoved = function (uploader, files) {
        for (var i in files) {
            $('#' + files[i].id).remove()
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
        $('#' + obj).remove()
        $('#bookUploader').pluploadQueue().removeFile(file)
    }

    viewFiles = function (id) {
        var items = []
        var current = 0
        $('.gallery-item').each(function (i, e) {
            if (e.src !== '' && e.src !== undefined) {
                items.push({src: e.src, type: 'image'})
                if ($(e).parents('article')[0].id === id) {
                    current = i
                }
            } else {
                items.push({
                    src: $('<div class="black-popup"><code style="font-size: 1.5em;font-weight: 500;position: relative;left:20px;">' + e.innerHTML + '</code></div>'),
                    type: 'inline'
                })
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
                preload: 0
            }
        })
        $.magnificPopup.proto.goTo(current)
    }

    showMoreInfo = function (id) {
        $('.form-process').show()

        var node = $('.custom-filter li.current')[0].className.split(' ')[0]

        var url = encodeURI('/family?node=' + node + '&current=' + $('#pageCurrent').val())

        var param = {
            current: $('#pageCurrent').val(),
            url: url,
            title: '家族日志'
        }

        var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
        encrypted = encrypted.toString()

        window.location.href = '/family/' + node + '/' + id + '?param=' + encrypted
    }

    pageList = function (page, id, limit) {
        $('#posts').load('/family/' + id + '?current=' + page + '&limit=' + limit, function () {
            initPage($('#pagetotal').val(), $('#pageCurrent').val(), limit, id)
            $('#gotoTop').trigger('click')
        })
    }

    initEditBookView = function () {
        initBookUploader()
        initCheckBox()
        $("#portfolio").sortable({handle: '.portlet-header:not(.nomove)'})
        $("#portfolio").disableSelection()

        $lightboxInlineEl = $('[data-lightbox="inline"]')
        if ($lightboxInlineEl.length > 0) {
            $lightboxInlineEl.magnificPopup({
                type: 'inline',
                mainClass: 'mfp-no-margins mfp-fade',
                closeBtnInside: false,
                fixedContentPos: true,
                overflowY: 'scroll'
            });
        }

        $("#family #coverFiles").fileinput({
            maxFileCount: 1,
            maxSize: 1024 * 5,
            allowedFileTypes: ["image"],
            browseClass: "btn btn-default",
            removeClass: "btn btn-danger",
            mainClass: "input-group",
            removeIcon: "<i class=\"icon-trash\"></i>",
            language: 'zh',
            showRemove: false,
            showCancel: false,
            showUpload: true,
            showDownload: false,
            showZoom: false,
            showDrag: true,
            showPreview: false
        }).on('fileloaded', function (event, file, i, reader) {
            var reader = new FileReader()
            reader.onloadend = function (e) {
                var arrayBuffer = e.target.result
                $('#bookCoverImg').cropper('replace', arrayBuffer)
            }
            reader.readAsDataURL(file)
        })


        $('.plupload_file_action').hide()

        $('#bookCoverImg').cropper({
            aspectRatio: 20 / 31,
            cropBoxResizable: false,
            minContainerWidth: 200,
            minContainerHeight: 310,
            minCropBoxWidth: 200,
            minCropBoxHeight: 310,
            viewMode: 1,
            crop: function (e) {
            }
        })
    }

    openAddPage = function (obj, id) {
        if ($(obj).hasClass('current')) return

        $('.custom-filter li.current').removeClass('current')

        $(obj).addClass('current')
        $('#posts').load('/family/' + id + '/add?current=' + $('#' + id + ' #pageCurrent').val(), function () {
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
        $('.custom-filter li.current').removeClass('current')
        $('#posts').load('/family/' + id + '?current=' + page + '&limit=' + limit, function () {
            initPage($('#pagetotal').val(), page, limit, id)
            $('#gotoTop').trigger('click')
            $('.custom-filter li.' + id).addClass('current')
        })
    }

    resetImageView = function (obj) {
        var w = obj.naturalWidth, h = obj.naturalHeight
        if (h > w) {
            var tmp = Math.ceil((w / h) * 170)
            $(obj).css('height', '170px')
            $(obj).css('width', tmp + 'px')
            $(obj).parents('article').first().css('width', (tmp + 10) + 'px')
        } else {
            var tmp = Math.ceil((w / h) * 170)
            $(obj).css('height', '170px')
            $(obj).css('width', tmp + 'px')
            $(obj).parents('article').first().css('width', (tmp + 10) + 'px')
        }
        $(obj).parents('article').first().addClass('loaded')
    }


    initCheckBox = function () {
        $('input').iCheck({
            radioClass: 'iradio_square',
            checkboxClass: 'icheckbox_square',
            increaseArea: '20%' // optional
        })
    }

    collectionBlog = function (id, obj) {
        var type = $(obj).find('i.icon-star3').length
        $.ajax({
            type: type === 0 ? 'put' : 'delete',
            url: '/family/blog/collection/' + id,
            success: function (result) {
                if (result.error) {
                    showMessage(result.error, '', 1000)
                } else {
                    if (type === 0) {
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

    likeBlog = function (id, obj) {
        $.ajax({
            type: 'put',
            url: '/family/blog/like/' + id,
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

showFamilyContent = function (id, opendb,obj, limit, a,b,c,d) {
    $('.form-process').fadeIn()
    $('div[id*=add]').hide()
    $('div[id*=add] button').removeClass('current')
    $('.custom-filter li.current').removeClass('current')
    $(obj).closest('li').addClass('current')

    $('#posts').load('/family/' + id, function () {
        $('.form-process').fadeOut()
        initPage($('#pagetotal').val(), $('#pageCurrent').val(), limit, id)
        $('#add' + id + 'Div').show()
        if (opendb) {
            openDB()
        }
    })
}

initSlider = function() {
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

changeMenu = function (node, current) {
    $($('.custom-filter li.'+node+' a')[0]).trigger('click',[current])
}


addComment = function () {
    if ($('#reply').val() === '') {
        $('#reply').addClass('error')
        return
    }

    $('.form-process').fadeIn()

    $.ajax({
        type: 'post',
        data: {
            content: $('#reply').val(),
            bid: $('#qid').val()
        },
        url: '/family/blog/comment',
        success: function (result) {
            $('.form-process').fadeOut()
            if (result.error) {
                showMessage(result.error, '', 2000)
            } else {
                showMessage('评论提交成功', 'success', 2000)
                $('.form-process').fadeOut()
                $('#reply').val('')
                $('#commentNum').html(result)
                $('#commentlist').load('/family/blog/comment/'+ $('#qid').val())

            }
        }
    })
}

