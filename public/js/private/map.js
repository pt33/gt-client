var stories = ['katrina','sochi']
var storyPage = 0
jQuery(document).ready(function(){
    var storymap = new VCO.StoryMap('map_karina', '../js/plugins/map/katrina.json');
    window.onresize = function(event) {
        storymap.updateDisplay();
    }
})

function changeMapStory(type) {
    var tmp = storyPage
    if (type === 'next') {
        storyPage = storyPage + 1
        if (storyPage >= stories.length) {
            storyPage = 0
        }
        $('#' + stories[storyPage])[0].attributes['data-animate'].value = 'slideInLeft'
        $('#' + stories[storyPage]).removeClass('slideInRight')
        $('#' + stories[storyPage]).removeClass('slideInLeft')
        $('#' + stories[storyPage]).removeClass('animated')

        $('#' + stories[storyPage]).addClass('slideInLeft')
        $('#' + stories[storyPage]).addClass('animated')

    } else if (type === 'prev') {
        storyPage = storyPage - 1
        if (storyPage < 0) {
            storyPage = stories.length - 1
        }
        $('#' + stories[storyPage])[0].attributes['data-animate'].value = 'slideInRight'
        $('#' + stories[storyPage]).removeClass('slideInLeft')
        $('#' + stories[storyPage]).removeClass('animated')
        $('#' + stories[storyPage]).removeClass('slideInRight')

        $('#' + stories[storyPage]).addClass('slideInRight')
        $('#' + stories[storyPage]).addClass('animated')

    }
    try {
        if ($('#map_'+stories[storyPage])[0].innerHTML === '') {
            var storymap = new VCO.StoryMap('map_'+stories[storyPage], '../js/plugins/map/'+ stories[storyPage]+'.json');
            window.onresize = function(event) {
                storymap.updateDisplay();
            }
        }
    } catch (e) {

    }
    $('#'+stories[storyPage]).show()
    $('#'+stories[tmp]).hide()
}

function showLocation(data, title) {

    var param = {
        tablename: 'table1',
        lat: data.lat,
        lng: data.lon,
        showDetail: true,
        title: title,
        navTitle: $('#navTitle').val()
    }
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()

    window.location.href = '/data/locationList?param=' + encrypted
}

function changeColor(obj) {
    $(obj).css('color', '#eec749')
    $(obj).css('text-decoration', 'underline')
    $(obj).css('cursor', 'pointer')
}

function resetColor(obj) {
    $(obj).css('color', '#fff')
    $(obj).css('text-decoration', 'none')
    $(obj).css('cursor', 'auto')
}
