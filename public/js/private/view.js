var bound
jQuery(window).load(function(){
    yepnope({
        test : Modernizr.csstransforms3d,
        yep: ['/js/plugins/turnjs/lib/turn.js'],
        nope: ['/js/plugins/turnjs/lib/turn.html4.min.js'],
        both: ['/js/plugins/turnjs/lib/scissor.js','/js/plugins/turnjs/lib/zoom.js','/js/plugins/turnjs/css/double-page.css'],
        complete: loadApp
    });

    function loadApp() {

        var flipbook = $('.flipbook');

        $(document).keydown(function(e){

            var previous = 37, next = 39, esc = 27;

            switch (e.keyCode) {
                case previous:

                    $('.flipbook').turn('previous');

                    break;
                case next:

                    $('.flipbook').turn('next');

                    break;
                case esc:

                    $('.flipbook-viewport').zoom('zoomOut');
                    // e.preventDefault();

                    break;
            }

        });

        $('.flipbook').turn({
            elevation: 50,
            gradients: true,
            duration: 1000,
            acceleration: true,
            height: 500,
            width: 500,
            autoCenter: true,
            directions: 'ltr',
            pages: Number($('#file-length').val()),
            when: {
                turning: function (event, page, view) {
                    disableControls(page);
                    $('img .lazyload').css('height', bound.height+'px')
                },
                pressed: function (event, page, view) {
                    // $('img .lazyload').css('height', bound.height+'px')
                },
                turned: function (event, page, view) {
                    $('#pic_list ul li').removeClass('current');
                    $('#pic_list .page-' + view[0]).parent().addClass('current');

                }
            }
        })

        if (Number($('#file-h').val()) < Number($('#file-w').val())) {

            $('.flipbook .double').scissor();
        }

        $('.flipbook-viewport').zoom({
            flipbook: $('.flipbook'),

            max: function () {

                // console.log($('.flipbook').width(), largeMagazineWidth()/$('.flipbook').width())
                return largeMagazineWidth() / $('.flipbook').width();

            },

            when: {

                swipeLeft: function () {

                    $(this).zoom('flipbook').turn('next');

                },

                swipeRight: function () {

                    $(this).zoom('flipbook').turn('previous');

                },

                resize: function (event, scale, page, pageElement) {

                    var img = pageElement.find('img');

                    img.css({width: '100%', height: '100%'});

                },

                zoomIn: function () {

                    $('#pic_list').hide();
                    $('.made').hide();
                    $('.flipbook').removeClass('animated').addClass('zoom-in');
                    $('.zoom-icon').removeClass('zoom-icon-in').addClass('zoom-icon-out');

                    // setTimeout(function () {
                    //     resizeViewport();
                    // }, 0);

                    if (!window.escTip && !$.isTouch) {
                        escTip = true;

                        $('<div />', {'class': 'exit-message'}).html('<div>按Esc退出全屏</div>').appendTo($('body')).delay(2000).animate({opacity: 0}, 500, function () {
                            $(this).remove();
                        });
                    }
                },

                zoomOut: function () {

                    $('.exit-message').hide();
                    $('#pic_list').fadeIn();
                    $('.made').fadeIn();
                    $('.zoom-icon').removeClass('zoom-icon-out').addClass('zoom-icon-in');

                    setTimeout(function () {
                        $('.flipbook').addClass('animated').removeClass('zoom-in');
                        resizeViewport();
                    }, 0);

                }
            }
        });

        // Zoom event

        if ($.isTouch)
            $('.flipbook-viewport').bind('zoom.doubleTap', zoomTo);
        else
            $('.flipbook-viewport').bind('zoom.tap', zoomTo);

        $(window).resize(function () {
            // console.log('bbb')
            resizeViewport();
        }).bind('orientationchange', function () {
            resizeViewport();
        });


        $('.next-button').bind($.mouseEvents.over, function () {

            $(this).addClass('next-button-hover');

        }).bind($.mouseEvents.out, function () {

            $(this).removeClass('next-button-hover');

        }).bind($.mouseEvents.down, function () {

            $(this).addClass('next-button-down');

        }).bind($.mouseEvents.up, function () {

            $(this).removeClass('next-button-down');

        }).click(function () {

            $('.flipbook').turn('next');

        });

        // Events for the next button

        $('.previous-button').bind($.mouseEvents.over, function () {

            $(this).addClass('previous-button-hover');

        }).bind($.mouseEvents.out, function () {

            $(this).removeClass('previous-button-hover');

        }).bind($.mouseEvents.down, function () {

            $(this).addClass('previous-button-down');

        }).bind($.mouseEvents.up, function () {

            $(this).removeClass('previous-button-down');

        }).click(function () {

            $('.flipbook').turn('previous');

        });

        $('.zoom-icon').bind('mouseover', function () {

            if ($(this).hasClass('zoom-icon-in'))
                $(this).addClass('zoom-icon-in-hover');

            if ($(this).hasClass('zoom-icon-out'))
                $(this).addClass('zoom-icon-out-hover');

        }).bind('mouseout', function () {

            if ($(this).hasClass('zoom-icon-in'))
                $(this).removeClass('zoom-icon-in-hover');

            if ($(this).hasClass('zoom-icon-out'))
                $(this).removeClass('zoom-icon-out-hover');

        }).bind('click', function () {

            if ($(this).hasClass('zoom-icon-in'))
                $('.flipbook-viewport').zoom('zoomIn');
            else if ($(this).hasClass('zoom-icon-out'))
                $('.flipbook-viewport').zoom('zoomOut');

        });

        resizeViewport();

        $('.flipbook').addClass('animated');

        $('#pic_list').click(function(event) {

            var target = event.target.className

            var page = target.substring(target.indexOf('page-')+5)

            $('.flipbook').turn('page', page);
        });

        $('#pic_list li').bind($.mouseEvents.over, function() {

            $(this).addClass('thumb-hover');

        }).bind($.mouseEvents.out, function() {

            $(this).removeClass('thumb-hover');

        });
    }

    $(".lazyload").lazyload({
        effect: "fadeIn",
        threshold: 200,
        placeholder : "../img/loader.gif"
    });
})

function gotoFilePage(index, dir, id, row) {
    if (dir !== '' && id !== '') {
        var num = 0
        $('input').each(function (i, e) {
            if (e.id === id) {
                $(e).parents('nav').find('ul li').removeClass('current')
                $(e).parents('nav').find('ul li.sfHover').addClass('current')
                return false
            }
            if (e.id !== id && i < (Number(row) - 1)) {
                num += Number(e.value)
            }
        })

        $('img .lazyload').css('height', bound.height+'px')

        if (index !== '' ){
            num = num + Number(index)
        }

        $('.flipbook').turn('page', num + 1);

        $('#pic_list').scrollTo('#pic_page-'+ Math.max((num - 4), 0), 2000, {axis:'x'})
    }
}

function disableControls(page) {
    if (page==1)
        $('.previous-button').hide();
    else
        $('.previous-button').show();

    if (page==$('.flipbook').turn('pages'))
        $('.next-button').hide();
    else
        $('.next-button').show();
}

function zoomTo(event) {

    setTimeout(function() {
        if ($('.flipbook-viewport').data().regionClicked) {
            $('.flipbook-viewport').data().regionClicked = false;
        } else {
            if ($('.flipbook-viewport').zoom('value')==1) {
                $('.flipbook-viewport').zoom('zoomIn', event);
            } else {
                $('.flipbook-viewport').zoom('zoomOut');
            }
        }
    }, 1);
}








    // var magazineOffset = $('.flipbook').offset(),
    //     boundH = height - magazineOffset.top - $('.flipbook').height(),
    //     marginTop = (boundH - $('.thumbnails > div').height()) / 2;
    //
    // if (marginTop<0) {
    //     $('.thumbnails').css({height:1});
    // } else {
    //     $('.thumbnails').css({height: boundH});
    //     $('.thumbnails > div').css({marginTop: marginTop});
    // }
    //
    // if (magazineOffset.top<$('.made').height())
    //     $('.made').hide();
    // else
    //     $('.made').show();

    // $('#turnContainer').css('margin-left', -bound.width/4 + 'px')


function calculateBound(d) {

    bound = {width: d.width, height: d.height};

    if (bound.width>d.boundWidth || bound.height>d.boundHeight) {

        var rel = bound.width/bound.height;

        if (d.boundWidth/rel>d.boundHeight && d.boundHeight*rel<=d.boundWidth) {

            bound.width = Math.round(d.boundHeight*rel);
            bound.height = d.boundHeight;

        } else {

            bound.width = d.boundWidth;
            bound.height = Math.round(d.boundWidth/rel);

        }
    }

   // return bound;
}

function isChrome() {

    return navigator.userAgent.indexOf('Chrome')!=-1;

}


function largeMagazineWidth() {
    return 2214;
}

function resizeViewport() {

    // var width = $(window).width()
    var height = $(window).height()
    var width = $('#pic_list')[0].clientWidth
       // options = $('.flipbook').turn('options');

    var w = Number($('#file-w').val())
    var h = Number($('#file-h').val())
    var head = $('#header-wrap')[0].clientHeight === 100 ? 100 : 0

    var tmp_h, tmp_w

    var ratio = w / h
    if (h > w) {
        tmp_h = h > height ? (height - 200) : (h - 200)
        tmp_w = Math.round(ratio * tmp_h)
        if ((tmp_w * 2 + 100) > width) {
            tmp_w = (width - 100) / 2
            tmp_h = Math.round(tmp_w / ratio)
        }
    } else {
        tmp_w = w > width ? (width - 100) : (w - 100)
        tmp_h = Math.round(tmp_w / ratio)
    }

    var main_h = height - tmp_h - 130 - head
    // console.log('cccc0',new Date())

    $('.flipbook').removeClass('animated');

    // console.log('cccc1',new Date())

    $('.flipbook-viewport').css({
        width: width,
        height: tmp_h + main_h
    }).zoom('resize');

    // console.log('cccc2',new Date())
    if ($('.flipbook').turn('zoom')==1) {
        calculateBound({
            width: tmp_h > tmp_w ? tmp_w * 2 : tmp_w,
            height: tmp_h,
            boundWidth: tmp_h > tmp_w ? tmp_w * 2 : tmp_w,
            boundHeight: tmp_h
        });

        if (bound.width % 2 !== 0)
            bound.width -= 1;

        if (bound.width != $('.flipbook').width() || bound.height != $('.flipbook').height()) {

            $('.flipbook').turn('size', bound.width, bound.height);

            if ($('.flipbook').turn('page') == 1)
                $('.flipbook').turn('peel', 'br');

            $('.next-button').css({
                height: bound.height,
                backgroundPosition: '-25px ' + (bound.height / 2 - 32 / 2) + 'px'
            });
            $('.previous-button').css({
                height: bound.height,
                backgroundPosition: '-6px ' + (bound.height / 2 - 32 / 2) + 'px'
            });
        }
    }

    $('.flipbook').css({top: ((tmp_h + main_h) - bound.height) / 2, left: (width - bound.width) / 2});

    $('.flipbook-viewport').animate({
        opacity:1
    },1000)
    $('#pic_list ul').animate({
        opacity:1
    },1000)
    // $('.flipbook-viewport').show('slow')
    // }
}
