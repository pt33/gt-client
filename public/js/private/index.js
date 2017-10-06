jQuery(window).load(function(){
    // var swiperParent = new Swiper('.swiper-parent',{
    //     paginationClickable: false,
    //     slidesPerView: 4,
    //     grabCursor: true,
    //     prevButton: '#slider-arrow-left',
    //     nextButton: '#slider-arrow-right'
    // })
    //
    // var swiperNested1 = new Swiper('.swiper-nested-1',{
    //     direction: 'vertical',
    //     paginationClickable: false,
    //     slidesPerView: 3,
    //     prevButton: '#sw1-arrow-top',
    //     nextButton: '#sw1-arrow-bottom'
    // })
    //
    // var swiperNested2 = new Swiper('.swiper-nested-2',{
    //     direction: 'vertical',
    //     paginationClickable: false,
    //     slidesPerView: 2,
    //     prevButton: '#sw2-arrow-top',
    //     nextButton: '#sw2-arrow-bottom'
    // })
    //
    // var swiperNested3 = new Swiper('.swiper-nested-3',{
    //     direction: 'vertical',
    //     paginationClickable: false,
    //     slidesPerView: 2,
    //     prevButton: '#sw3-arrow-top',
    //     nextButton: '#sw3-arrow-bottom'
    // })

    var tpj=jQuery;
    tpj.noConflict();

    tpj(document).ready(function() {

        var apiRevoSlider = tpj('.tp-banner').show().revolution(
        {
            sliderType:"standard",
            jsFileLocation:"/rs-plugin/js/",
            sliderLayout:"fullwidth",
            dottedOverlay:"none",
            disableProgressBar:"on",
            delay:16000,
            startwidth:1140,
            startheight:700,
            hideThumbs:200,

            thumbWidth:100,
            thumbHeight:50,
            thumbAmount:5,

            navigation: {
                keyboardNavigation:"off",
                keyboard_direction: "horizontal",
                mouseScrollNavigation:"off",
                onHoverStop:"off",
                touch:{
                    touchenabled:"on",
                    swipe_threshold: 75,
                    swipe_min_touches: 1,
                    swipe_direction: "horizontal",
                    drag_block_vertical: false
                },
                arrows: {
                    style: "hermes",
                    enable: true,
                    hide_onmobile: false,
                    hide_onleave: false,
                    tmp: '<div class="tp-arr-allwrapper">	<div class="tp-arr-imgholder"></div>	<div class="tp-arr-titleholder">{{title}}</div>	</div>',
                    left: {
                        h_align: "left",
                        v_align: "center",
                        h_offset: 10,
                        v_offset: 0
                    },
                    right: {
                        h_align: "right",
                        v_align: "center",
                        h_offset: 10,
                        v_offset: 0
                    }
                }
            },

            touchenabled:"on",
            onHoverStop:"on",

            swipe_velocity: 0.7,
            swipe_min_touches: 1,
            swipe_max_touches: 1,
            drag_block_vertical: false,

            parallax:"mouse",
            parallaxBgFreeze:"on",
            parallaxLevels:[7,4,3,2,5,4,3,2,1,0],

            keyboardNavigation:"off",

            navigationHAlign:"center",
            navigationVAlign:"bottom",
            navigationHOffset:0,
            navigationVOffset:20,

            soloArrowLeftHalign:"left",
            soloArrowLeftValign:"center",
            soloArrowLeftHOffset:20,
            soloArrowLeftVOffset:0,

            soloArrowRightHalign:"right",
            soloArrowRightValign:"center",
            soloArrowRightHOffset:20,
            soloArrowRightVOffset:0,

            shadow:0,
            fullWidth:"on",
            fullScreen:"off",

            spinner:"off",

            stopLoop:"off",
            stopAfterLoops:0,
            stopAtSlide:0,

            shuffle:"off",

            autoHeight:"off",
            forceFullWidth:"off",
            hideTimerBar:"off",


            hideThumbsOnMobile:"off",
            hideNavDelayOnMobile:1500,
            hideBulletsOnMobile:"off",
            hideArrowsOnMobile:"off",
            hideThumbsUnderResolution:0,

            hideSliderAtLimit:0,
            hideCaptionAtLimit:0,
            hideAllCaptionAtLilmit:0,
            startWithSlide:0,
        })

        apiRevoSlider.bind("revolution.slide.onloaded",function (e) {
            setTimeout( function(){ SEMICOLON.slider.sliderParallaxDimensions(); }, 200 );
        })

        apiRevoSlider.bind("revolution.slide.onchange",function (e,data) {
            SEMICOLON.slider.revolutionSliderMenu();
        })
    })
})

function doCallback(fn, refTable, value, mode,field) {

    var args = {
        tablename: refTable,
        field: field,
        key: value,
        mode: mode
    }

    if(typeof(eval(fn)) === 'function')
    {
        var s = eval(fn+"("+JSON.stringify(args)+")")
    }
}

function viewMoreList(tablename, field,key,mode) {

}

function indexBookDetail(args) {
    // alert(args)
    if(args.field === '_id') {

    }

    var param = {
        tablename: args.tablename,
        key:args.key
    }

    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()
    window.location.href = '/data/index/detail?param=' + encrypted
}

function indexNameDetail(args) {
    alert(args)
}

function indexBookList(args) {
    var param = {
        tablename: args.tablename,
        field:args.field,
        key:args.key,
        showDetail: true
    }
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()
    if (args.mode === 'name') {
        window.location.href = '/moreList?param=' + encrypted
    } else if (args.mode === 'book') {
        window.location.href = '/moreList?param=' + encrypted
    } else if (args.mode === 'image') {

    } else if (args.mode === 'txt') {

    }
}
