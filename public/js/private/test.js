jQuery(document).ready(function(){


    var images = openDBByFetch('images',storage['viewIndex'], $('#callBackTest'))

    openDBByFetch('contents',null, $('#callBackTest'))

    // var inFormOrLink
    // $('a').on('click', function() { inFormOrLink = true; })
    // $('form').on('submit', function() { inFormOrLink = true; })
    //
    // $(window).on("beforeunload", function() {
    //
    //     return inFormOrLink ? "Do you really want to close?" : null
    // })

    viewFiles = function (id) {
        var items = []
        $('.gallery-item').each(function (i, e) {
            if(e.src !== '' && e.src !== undefined) {
                items.push({src:e.src,type:'image'})
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
        $.magnificPopup.proto.goTo(Number(id)+1)
    }
})

$('#callBackTest').on('click', function(event, param1, param2) {

    if(param2 === 'image') {
        if (param1.length > 1) {
            $('.imageline').fadeIn()
            $('.entry-image.multi').fadeIn()
            var str = []
            for (var i in param1) {
                str.push('<div class="slide"><a href="javascript:void(0);" onclick="viewFiles('+i+')">')
                str.push('<img class="image_fade gallery-item" src="'+ param1[i] +'" alt="图片查看">')
                str.push('</a></div>')
            }

            $('.entry-image.multi .slider-wrap').html(str.join(''))

            setTimeout(function () {
                SEMICOLON.initialize.lazyLoad()
                SEMICOLON.widget.loadFlexSlider()
            }, 200)
        } else if (param1.length === 1) {
            $('.imageline').fadeIn()
            $('.entry-image.single').fadeIn()
            var str = []
                str.push('<a href="javascript:void(0);" onclick="viewFiles(0)">')
                str.push('<img class="image_fade gallery-item" src="'+ param1[0] +'" alt="图片查看">')
                str.push('</a>')
            $('.entry-image.single').html(str.join(''))

            setTimeout(function () {
                SEMICOLON.initialize.lazyLoad()
            }, 200)
        }
    } else if (param2 === 'content'){
        if (param1.length > 0) {

            $('.contentline').fadeIn()

            $('.entry-content').fadeIn()
            $('.entry-content').html(decodeURI(param1[0]))
        }
    }
})
