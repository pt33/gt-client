jQuery(window).load(function(){
    var $validate = $("#loginForm").validate({
        rules: {
            username: {
                required: true
            },
            password: {
                required: true
            }
        },
        messages: {
            name: {
                required: '用户名不能为空'
            },
            password: {
                required: '密码不能为空'
            }
        }
    })

    signIn = function () {
        var $valid = $("#loginForm").valid()
        if(!$valid) {
            $validate.focusInvalid()
            return
        }
        $('.form-process').fadeIn()
        $.ajax({
            type: 'post',
            data: {username: $('#username').val(), password: $('#password').val()},
            url: '/signIn',
            success: function (result) {
                $('.form-process').fadeOut()
                if (result.error) {
                    $('#errorMsg').html(result.error)
                    $('.errormsg').show()
                    setTimeout(function() {
                        $('.errormsg').fadeOut()
                    }, 1500)
                    return false
                } else {
                    var user = JSON.parse(result.user)
                    storage['token'] = result.token
                    storage['userId'] = user._id.toString()
                    storage['username'] = $('#username').val()
                    var encrypted = CryptoJS.AES.encrypt(storage['token'], '_SALT_G(T#*)')
                    encrypted = encrypted.toString()
                    storage['aesToken'] = encrypted

                    var exp = new Date()
                    exp.setTime(exp.getTime() - 1)
                    var cval=getCookie('token')
                    if(cval!=null)
                        document.cookie= "token="+cval+";expires="+exp.toGMTString()

//                     var Days = 30
                    exp = new Date()
                    exp.setTime(exp.getTime() + 24*60*60*1000)
                    document.cookie = "token="+ encrypted + ";expires=" + exp.toGMTString()

                    showMessage('登录成功','success',1000)
                    setTimeout(function() {
                        window.location.href = '/user'
                    }, 1000)
                }
            }
        })
    }
})

