window._bd_share_config=
    {
        "common":
            {
                "bdSnsKey":{}
                ,"bdText":$('#shareText').val()
                ,"bdUrl":$('#shortUrl').val()
                ,"bdSign":'normal'
                ,"bdMini":"3"
                ,"bdMiniList":["qzone","tsina","bdysc","weixin","renren","tqq","bdxc","kaixin001","tqf","tieba","douban","bdhome","sqq","thx","ibaidu","meilishuo","mogujie","diandian","huaban","duitang","hx","fx","youdao","sdo","qingbiji","people","xinhua","mail","isohu","yaolan","wealink","ty","h163","evernotecn"]
                ,"bdStyle":"0"
                ,"bdSize":"16"
                ,"bdCustomStyle":"/css/share.css"
                ,"bdPopupOffsetLeft":-100
                ,"bdPopupOffsetTop":290
                ,"onBeforeClick":function (cmd, config) {
                console.log(cmd, config)
            }
                ,"onAfterClick":function (cmd, config) {
                $.ajax({
                    type: 'put',
                    url: '/family/blog/share/' + $('#qid').val() + '?source=' + cmd,
                    success: function (result) {
                        if (result.error || result.ignore) {
                            return
                        } else {
                            $('.bds_more').find('span').html(result)
                        }
                    }
                })
            }
            }
        ,"share":{}
    }
with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
