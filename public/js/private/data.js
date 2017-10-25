var queryParam = {},
    checkSurnames = {},
    checkAreas = [],
    refTables = [],
    hasFiles = [],
    map,
    cluster,
    tileLayer,
    tileLayer1,
    markers = []

jQuery(window).load(function(){
    $('.daterange1').daterangepicker({
        "showDropdowns": true,
        "buttonClasses": "button button-rounded button-mini nomargin",
        "applyClass": "button-color",
        "cancelClass": "button-light",
        "autoUpdateInput": false,
        "locale": {
            "format": "YYYY-MM-DD",
            "separator": " - ",
            "applyLabel": "确定",
            "cancelLabel": "取消",
            "fromLabel": "从",
            "toLabel": "到",
            "customRangeLabel": "普通",
            "weekLabel": "星期",
            "daysOfWeek": [
                "日",
                "一",
                "二",
                "三",
                "四",
                "五",
                "六"
            ],
            "monthNames": [
                "一月",
                "二月",
                "三月",
                "四月",
                "五月",
                "六月",
                "七月",
                "八月",
                "九月",
                "十月",
                "十一月",
                "十二月"
            ],
            "firstDay": 1
        },
        "linkedCalendars": false,
        "endDate": new Date()
    }, function(start, end, label) {
        console.log("New date range selected: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD') + ' (predefined range: ' + label + ')");
    })

    $('.daterange1').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + '-' + picker.endDate.format('YYYY-MM-DD'));
    });

    $('.daterange1').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });

    $('#dataContent').css('height','500px')

    $('.promo').on( "mouseleave", function (e) {
        console.log('aaaaa')
        hideDropMenu()
    })

    $('table[id*=tableList]').each(function (e,obj) {
        showTableDetail(obj.id.replace('tableList',''))
    })

    $('h5[id*=file_]').each(function (e,obj) {
        var key = obj.id.replace('file_', '')
        $(obj).load(key)
    })

    $('div[id*=refPost_]').each(function (e,obj) {
        var tablename = obj.id.replace('refPost_', '')
        var refTable = $('#'+tablename+'_refTable').val()
        var refField = $('#'+tablename+'_refField').val()
        var mainField = $('#'+tablename+'_mainField').val()
        var showField = $('#'+tablename+'_showField').val()
        $(obj).load('/data/refPageData?tablename=' + tablename + '&refField=' + refField + '&value=' + mainField+'&showField='+showField)
    })

    $('div[id*=page_]').each(function (e,obj) {
        var tablename = obj.id.replace('page_','')
        queryParam = getSearchQuery(tablename)
        $(obj).load('/data/pageData?tablename='+tablename+'&key='+JSON.stringify(queryParam), function () {

            var showField = $('#'+tablename+'_showField').val().split(',')
            var refTable = $('#'+tablename+'_refTable').val()
            var refField = $('#'+tablename+'_refField').val()
            var mainField = $('#'+tablename+'_mainField').val()
            var tableId = $('#' + tablename + '_tableId').val()
            var notId = $('#' + tablename + '_key').val()

            tableOptions.url = '/data/refList'
            tableOptions.columns = initRefField(showField,tablename, tableId)
            tableOptions.search = false
            tableOptions.searchText = ''
            tableOptions.detailView = false
            tableOptions.fixedColumns = false
            tableOptions.showRefresh = false
            tableOptions.showColumns = false
            tableOptions.showHeader = false
            tableOptions.queryParams = function (param) {
                var query = {
                    page: param.offset
                    , limit: param.limit
                    , key: {}
                    , sort: {}
                    , tableName: refTable
                    , refField: refField
                    , value: mainField
                    , showField: showField
                    , notId: notId
                }
                if (param.sort !== undefined) {
                    query.sort[param.sort] = param.order
                } else {
                    query.sort['_id'] = 'asc'
                }
                return query
            }
            $("#pageTable"+tablename).bootstrapTable(tableOptions)
        })
    })

    $('.togglett').click(function(e){
        if(e.target.className.indexOf('checkbox-style') >= 0) {
            return true
        }
        if ($(this).toggleClass('toggleta').next('.togglecc').css('display') !== 'block') {
            $(this).parents('.togglec').find('.toggleta').removeClass('toggleta')
            $(this).parents('.togglec').find('.togglecc:visible').slideToggle(200)
            $(this).addClass('toggleta')
            // filterBy(this.id,'1')
        } else {
            $(this).removeClass('toggleta')
            // filterBy(this.id,'0')
        }

        if ($(this).next('.togglecc').length !== 0) {
            $(this).next('.togglecc').slideToggle(300);
        }

        return true;
    })

    $(window).resize(function () {
        try {
            // alert('1111')
        } catch (e){

        }
    })
})

// function addMarker(point,name, tablename, showDetail, title){
//     var myIcon = new BMap.Icon("../img/map.png", new BMap.Size(46,46));
//     var marker = new BMap.Marker(point,{icon:myIcon});
//
//     var sContent =
//         "<h4 style='margin:0 0 5px 0;padding:0.2em 0'>" + name + "</h4>"
//     var infoWindow = new BMap.InfoWindow(sContent);
//     marker.addEventListener("mouseover",function(e) {
//         this.openInfoWindow(infoWindow)
//     })
//
//     marker.addEventListener("click", function(){
//         var param = {
//             tablename: tablename,
//             simplePlace: name,
//             showDetail: showDetail,
//             title: title
//         }
//         var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
//         encrypted = encrypted.toString()
//
//         window.location.href = '/data/mapList?param=' + encrypted
//     });
//
//     return marker
// }

function showHighSearch(id) {
    $('#highSearchView_'+id).slideToggle("slow")

    if($('#fa_' + id)[0].style.transform === '') {
        $('#fa_'+id).css('transform', 'translateY(12px) rotateZ(180deg)')
    } else {
        $('#fa_'+id).css('transform', '')
    }
}

function showNameSearch(tablename,id, obj) {
    $(".dropdown-menu:not(.name):visible").hide(200)
    $('#ul_' + id+':hidden').slideToggle(500)
    if ($(obj).val() !== '' ) {
        $('ul[id*=ul_'+tablename+'_] p').each(function (e, sub) {
            if (sub.innerText.indexOf($(obj).val().toUpperCase()) >= 0) {
                if (sub.className.indexOf('sub_name') > 0) {
                    var key = $(sub).closest('div')[0].id.replace(tablename + '_name_','')
                    showSubName(tablename, key,$(sub).parents().find('.'+key).addClass('current'))
                    $(sub).closest('div').find('.name_list').removeClass('current')
                    $(sub).addClass('current')
                } else {
                    showSubName(tablename, sub.innerText,sub)
                }
                return false
            }
        })
    } else {
        $('div.name:visible').hide(200)
        $('.name_list').removeClass('current')
    }
}

function showSubName(tablename, name,obj) {
    $("div.name:visible").hide(100)
    $("#" +tablename+ "_name_" + name).fadeToggle(300)
    $('.name_list').removeClass('current')
    $(obj).addClass('current')
}

function showLocationSearch(id, obj) {
    $(".dropdown-menu:not(.area):visible").hide(200)
    $('#ul_' + id+':hidden').slideToggle(500)
    if ($(obj).val() !== '' ) {
        $('ul.area p').each(function (e, sub) {
            if (sub.innerText.indexOf($(obj).val()) >= 0 || sub.getAttribute('pinyin').indexOf($(obj).val()) >= 0) {
                if (sub.className.indexOf('sub_city') > 0) {
                    var key = $(sub).closest('div')[0].id.replace('city_','')
                    showCounty(sub.id.replace('city_',''),sub,'2',key)
                } else if (sub.className.indexOf('sub_county') > 0) {
                    var key = $(sub).closest('div')[0].id.replace('county_','')
                    var parent = $(sub).closest('div').parents().first()[0].id.replace('city_','')
                    chooseLocation(sub.id.replace('county_',''),key, sub, parent,'0')
                } else {
                    showCity(sub.id.replace('location_',''),sub,'2')
                }
                return false
            }
        })
    } else {
        $('div.area').hide(200)
        $('.name_list').removeClass('current')
    }
    var current = $('p[id*=location_].current')
    if(current.length !== 0) {
        var top = current.position().top
        var offY = current.closest('div').scrollTop()
        // console.log(top,offY)
        if (top > 200 || top < 0) {
            current.closest('div').scrollTop(offY + (top - 200))
        }
    } else {
        current.closest('div').scrollTop(0)
    }
}

function showCity(name,obj,type) {
    if (type === '1') {
        $('#location_'+name).closest('ul').prev().val(obj.innerText)
    } else {
        $('.name_list').removeClass('current')
        $(obj).addClass('current')

        $('div[id*=city_]:not(#city_'+name+'):visible').hide()
        $("#city_" + name+':hidden').toggle()
    }
}

function chooseName(tablename, name,key,obj) {
    var val = name.substring(0, name.indexOf('('))
    $('#' +tablename+ '_name_'+key).prev().closest('ul').prev().val(val)
    $('.name').removeClass('current')
    $(obj).addClass('current')
}

function chooseLocation(name,key,obj,parent,type) {

    if(type === '1') {
        $('#county_'+key).prev().closest('ul').prev().val(obj.innerText)
    } else {
        $('div[id*=city_]:not(#city_'+parent+'):visible').hide()
        $('div[id*=county_]:not(#county_'+key+'):visible').hide()
        $("#city_" + parent+':hidden').toggle()
        $("#county_" + key+':hidden').toggle()
        $('.name_list').removeClass('current')
        $(obj).addClass('current')
        $("#city_" + key).addClass('current')
        $("#location_" + parent).addClass('current')
    }
}

function showCounty(name, obj,type, key) {

    if (type === '1') {
        $('#city_'+ key).prev().closest('ul').prev().val(obj.innerText)
    } else {
        $('.name_list').removeClass('current')
        $(obj).addClass('current')
        $("#location_" + key).addClass('current')
        $('div[id*=city_]:not(#city_'+key+'):visible').hide()
        $('div[id*=county_]:not(#county_'+name+'):visible').hide()

        $("#city_" + key+':hidden').toggle()
        $("#county_" + name+':hidden').toggle()
    }
}

function getSearchQuery(tablename) {
    var param = {}
    $('#promo_'+tablename).find('input[id*=table]').each(function (e,o) {
        var field = o.id.split('_')[1]
        if ($(o).val() !== '' && $(o).val() !== undefined) {
            if (o.className.indexOf('daterange1') > 0) {
                var sday = $(o).val().split('-')[0]
                sday = moment().utc( sday + ' 00:00', "YYYY-MM-DD HH:mm")
                var eday = $(o).val().split('-')[1]
                eday = moment().utc( eday + ' 00:00', "YYYY-MM-DD HH:mm")
                console.log(sday, eday)
            } else if (o.className.indexOf('inputarea') > 0) {
                param.simplePlace = {$regex: $(o).val()}
            } else {
                param[field] = {$regex: $(o).val()}
            }
        }
    })
    return param
}

function dataSearch(id,tablename) {
    queryParam = {}
    queryParam = getSearchQuery(tablename)
    $("#tableList"+tablename).bootstrapTable('refresh',{pageNumber:1,silent:false,query:{key:queryParam},url:'/data/subList'})
}

function showTableDetail(name) {
    $.ajax({
        url: '/data/getField?tablename=' + name,
        success:function (result) {
            if (result.error) {
                showMessage(result.error,'')
            } else {
                queryParam = {}
                loadDataList(result.info.fields, result.info._id.toString(), name, result.info.showDetail)
            }
        }
    })
}

function loadDataList (data, tableId, tableName,showDetail) {
    tableOptions.url = '/data/subList'
    tableOptions.columns = initTableField(data, showDetail,tableName, tableId)
    tableOptions.search = false
    tableOptions.detailView = false
    tableOptions.toolbarAlign = 'left'
    tableOptions.buttonsAlign = 'left'
    tableOptions.fixedColumns = false
    tableOptions.fixedNumber = 1
    tableOptions.queryParams = function (param) {
        var query = {
            page: param.offset
            , limit: param.limit
            , key: queryParam
            , sort: {}
            , tableName: tableName
            , tableId: tableId
        }
        if (param.sort !== undefined) {
            query.sort[param.sort] = param.order
        } else {
            query.sort['_id'] = 'asc'
        }
        queryLimit = param.limit
        return query
    }
    $("#tableList"+tableName).bootstrapTable(tableOptions)
}

function initRefField(data,tableName, tableId) {
    var fields = []
    refTables = []
    hasFiles = []
    for(var i=0;i<data.length;i++) {
        var e = data[i]
        fields.push({
            field:e,
            sortable:false,
            visible:true
        })
    }
    fields.push({
        field: "",
        title: "查看明细",
        formatter:function (value, row, index) {
            var a = []
            a.push('<a href="javascript:void(0)" class="social-icon si-borderless si-buffer" data-toggle="tooltip" data-placement="top" title="查看明细" onclick="showDetailView(\'' + tableName + '\',\'' +tableId+ '\',\'' +row._id.toString()+ '\',\'列表查看\')">')
            a.push('<i class="icon-hand-up"></i><i class="icon-hand-up"></i></a>')
            return a.join('')
        }
    })

    return fields
}

function initTableField(data, showDetail,tableName, tableId) {
    var fields = []
    refTables = []
    hasFiles = []
    for(var i=0;i<data.length;i++) {
        var e = data[i]
        fields.push({
            field:e.name,
            title:e.title,
            sortable:e.needSort,
            visible:e.needShow && !e.hasFile && e.refTable === '',
            width:100
        })
        if (e.hasFile) {
            hasFiles.push({field:e.name})
        }
        if (e.refTable !== '' && e.refTable !== undefined) {
            refTables.push({refTable: e.refTable,refField:e.refField,field:e.name})
        }
    }
    if(showDetail) {
        fields.push({
            field: "",
            width:100,
            title: "查看明细",
            formatter:function (value, row, index) {
                var a = []
                a.push('<a href="javascript:void(0)" class="social-icon si-borderless si-buffer" data-toggle="tooltip" data-placement="top" title="查看明细" onclick="showDetailView(\'' + tableName + '\',\'' +tableId+ '\',\'' +row._id.toString()+ '\',\'列表查看\')">')
                a.push('<i class="icon-hand-up"></i><i class="icon-hand-up"></i></a>')
                return a.join('')
            }
        })
    }
    return fields
}

function hideDropMenu() {

    $("ul.name:visible").slideToggle(400)
    $("ul.area:visible").slideToggle(400)

    $('div.name').hide(200)
    $('div.area').hide(200)
    $('.name_list').removeClass('current')
}

function showGroupNameList(surname, tablename, obj) {
    $(obj).parents('.sidebar-widgets-wrap').find('.current').removeClass('current')
    $(obj).addClass('current')

    var param = getSearchQuery(tablename)
    param.surname = surname
    $("#namegroup"+tablename).bootstrapTable('refresh',{pageNumber:1,silent:false,query:{key:param},url:'/data/subList'})
}

function getQueryParam(param) {

    if (this.groupByField !== '' && queryParam[this.groupByField] === undefined) {
        queryParam[this.groupByField] = {$exists: true, $ne:''}
    }

    var query = {
        page: param.offset
        , limit: param.limit
        , key: JSON.stringify(queryParam)
        , sort: {}
    }
    if (param.sort !== undefined) {
        query.sort[param.sort] = param.order
    } else {
        if (this.groupByField !== '') {
            query.sort[this.groupByField] = 'asc'
        } else {
            query.sort['_id'] = 'asc'
        }
    }
    queryLimit = param.limit
    return query
}

// function filterBy(id,type) {
//     var ary = id.split('_')
//     queryParam = {}
//     queryParam = getSearchQuery()
//     queryParam[ary[2]] = {$exists: true, $ne:''}
//
//     if (type === '1') {
//         queryParam.pinyin = ary[1]
//     }
//
//     $("#namegroup"+ary[0]).bootstrapTable('refresh',{pageNumber:1,silent:false,query:{key:JSON.stringify(queryParam)},url:'/data/subList/'+ary[0]+'/'+ary[2]})
// }

function surnameChoose(field, tablename) {
    var ary = getCheckNames(field)
    queryParam[field] = {$exists: true, $ne:'', $in:ary}
    $("#namegroup"+tablename).bootstrapTable('refresh',{pageNumber:1,silent:false,query:{key:JSON.stringify(queryParam)},url:'/data/subList/'+tablename+'/'+field})
}

function pinyinChoose(obj, field, tablename) {
    $(obj).parents('.toggle').find('.togglec input[type=checkbox]').each(function (e, sub) {
        sub.checked = obj.checked
    })
    surnameChoose(field,tablename)
}

function chooseAll(obj, field, tablename) {
    $('#groupdiv' + field).find('input[type=checkbox]').each(function (e,sub) {
        sub.checked = obj.checked
    })
    surnameChoose(field,tablename)
}

function areaChoose(obj, field, tablename, showDetail, title) {
    $(obj).parents('.toggle').find('.togglec input[type=checkbox]').each(function (e, sub) {
        sub.checked = obj.checked
    })
    reloadMapPoint(obj, field, tablename, showDetail, title)
}

function cityChoose(obj, field, tablename, showDetail, title) {
    $(obj).parents('.togglett').next('.togglecc').find('input[type=checkbox]').each(function (e, sub) {
        sub.checked = obj.checked
    })
    reloadMapPoint(obj, field, tablename, showDetail, title)
}

function countyChoose(obj, field, tablename, showDetail, title) {
    $(obj).parents('.togglett').next('.togglecc').find('input[type=checkbox]').each(function (e, sub) {
        sub.checked = obj.checked
    })

    reloadMapPoint(obj, field, tablename, showDetail, title)
}

function chooseAllArea(obj, field, tablename, value) {

    $('#groupdiv' + field).find('input[type=checkbox]').each(function (e,sub) {
        sub.checked = obj.checked
    })
    reloadMapPoint(obj, field, tablename, value)
}

function reloadMapPoint(obj, field, tablename, showDetail, title) {

    var bounds_array = []
    var markerIcon = new L.icon({iconUrl: '../img/marker.png', iconSize: [30]})

    cluster.clearLayers()

    $('#groupdiv'+field).find('input[id*=location_]').each(function (j, o) {
        var tmp = o.id.split('_')
        if(o.value !== '' && $('#checkbox' + tmp[1] +  '-' + tmp[2])[0].checked) {
            var p = o.value.split(',')

            var marker = L.marker(new L.LatLng(Number(p[1]),Number(p[0])), {
                icon: markerIcon,
                title: tmp[2]
            });

            var html = "<p style='color: #333;font-size:16px;margin:0px;font-weight: 500;font-family:Source Han Sans CN,Tahoma,Verdana,STHeiTi,simsun,sans-serif;' title='点击查看附近数据' onmouseover='changeColor(this)' href='javascript:(void);' onmouseout='resetColor(this)' onclick='showLocation(" + JSON.stringify([Number(p[1]),Number(p[0])])  + "," + JSON.stringify(tmp[2]) + "," + JSON.stringify(title) + ")'>" + tmp[2] + "</p>";
            marker.bindPopup(html,{closeButton:false});
            cluster.addLayer(marker);
            marker.on('click', function(e) {
                marker.openPopup();
            })
            bounds_array.push([Number(p[1]), Number(p[0])])
        }
    })
    if (bounds_array.length > 0) {
        map.fitBounds(bounds_array, {padding:[5,5]})
    } else {
        map.setView(new L.LatLng(108.699,37.516), 4)
    }
}

function responseHandler(res) {
    checkSurnames = {}
    $.each(res.group, function (i, group) {
        checkSurnames[group._id] = group._id
        $.each(group.surname, function (i, surname) {
            checkSurnames[surname] = surname
        })
    })
    initCheckParam(this.groupByField)
    return res;
}

function initCheckParam(tablename) {
    var allCheck = true
    $('#groupdiv' + tablename).find("input[type=checkbox]:not('#checkbox-"+tablename+"')").each(function (e,obj) {
        var key = obj.id.replace('checkbox-','')
        obj.checked = checkSurnames[key] ? true : false
        if(!obj.checked) {
            allCheck = false
        }
    })

    $('#checkbox-'+tablename)[0].checked = allCheck
}

function getCheckNames(tablename) {
    var ary = []
    $('#groupdiv' + tablename).find('input[type=checkbox]:checked').each(function (e,obj) {
        ary.push(obj.id.replace('checkbox-',''))
    })
    return ary
}

function showDetailView(tablename,tableId,key,title) {
    var param = {
        tablename: tablename,
        tableId:tableId,
        key:key,
        title:title
    }

    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()
    window.location.href = '/data/showDetail?param=' + encrypted
}

function getRefQueryParam(param) {
    var ary = this.searchText.split('|')
    var refTable = ary[0]
    var refField = ary[1]
    var value = ary[2]
    var notId = ary[3]
    var columns = this.columns[0]
    var showFields = []
    for (var i in columns) {
        showFields.push(columns[i].field)
    }
    var query = {
        page: param.offset
        , limit: 10
        , key: {refTable:refTable,value:value,refField:refField,showFields:showFields,notId:notId}
        , sort: {_id:1}
    }

    queryLimit = param.limit
    return query
}

function showFileDetail( tablename,tableId,key) {
   // window.location.href = '/data/showFiles?param='+JSON.stringify(hasFiles)+'&tablename='+tablename+'$tableId='+tableId+'&key='+key
}

function setRefFormatter(value, row, index) {
    var ary = this.title.split('|')
    var tableName = ary[0]
    var tableId = ''
    var title = ary[4]

    var a = []
        a.push('<a href="javascript:void(0)" class="social-icon si-borderless si-buffer" data-toggle="tooltip" data-placement="top" title="查看明细" onclick="showDetailView(\'' + tableName + '\',\'' + tableId + '\',\'' + row._id.toString() + '\',\'' +  title + '\')">')
        a.push('<i class="icon-hand-up"></i><i class="icon-hand-up"></i></a>')

    return a.join('')
}

function setListFormatter(value, row, index) {
    console.log('aaa')
}

function viewFileDetail(refTable, refField, value) {
    var param = {
        refTable: refTable,
        refField:refField,
        value:value
    }

    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()
    window.location.href = '/data/showFile?param=' + encrypted
}

function initMap(groupname,field) {
    setTimeout(function () {
        $('#map_'+groupname).css('height', $('#groupdiv' + field)[0].clientHeight + 'px')

        // test('map_'+groupname)

        L.mapbox.accessToken = 'pk.eyJ1IjoicHQwMTA2IiwiYSI6ImNqNzQyNHB4YjBzazQyeW51aDliOW9sYTAifQ.4-b27hNcoz9kab3wn0O9CQ'

        map = L.map('map_'+groupname, {
            zoomControl: false,
            doubleClickZoom: true,
            maxBounds: L.latLngBounds(L.latLng(3.086385,70.644154), L.latLng(54.9776, 139.5703125))
        }).setView([32.866601,105.564924], 3.9);

        new L.Control.ZoomBar({position: 'topright'}).addTo(map);

        // // var imageURL = "http://t0.tianditu.cn/vec_w/wmts?" +
        //     "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles" +
        //     "&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";
        //
        // var imageURL1 = "http://t0.tianditu.cn/cta_c/wmts?" +
        //     "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles" +
        //     "&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

        var styleLayer = L.mapbox.styleLayer(
            'mapbox://styles/pt0106/cj74pffvc3qdc2rpgphuj7ju3',{
                zoomOffset: -1,
                minZoom: 3.9,
                maxZoom: 22,
                attribution: '© <a href="">国家图书馆</a>'
            }).addTo(map)

        cluster = new L.MarkerClusterGroup();
        var bounds_array = []
        var markerIcon = new L.icon({iconUrl: '../img/history.svg'
            ,iconSize: [50,35]})
        var ary = groupname.split('_')
        $('#groupdiv'+field).find('input[id*=location_]').each(function (j, o) {
            var tmp = o.id.split('_')
            if(o.value !== '') {
                var p = o.value.split(',')

                var marker = L.marker(new L.LatLng(Number(p[1]),Number(p[0])), {
                    icon: markerIcon,
                    title: tmp[2],
                });

                var html = "<p style='color: #333;font-size:16px;margin:0px;font-weight: 500;font-family:Source Han Sans CN,Tahoma,Verdana,STHeiTi,simsun,sans-serif;' title='点击查看附近数据' onmouseover='changeColor(this)' href='javascript:(void);' onmouseout='resetColor(this)' onclick='showLocation(" + JSON.stringify([Number(p[1]),Number(p[0])])  + "," + JSON.stringify(tmp[2]) + "," + JSON.stringify(ary[3]) + ")'>" + tmp[2] + "</p>";
                marker.bindPopup(html,{closeButton:false});
                cluster.addLayer(marker);
                marker.on('click', function(e) {
                    marker.openPopup();
                })
                bounds_array.push([Number(p[1]), Number(p[0])])
            }
        })
        map.addLayer(cluster)

        map.fitBounds(bounds_array, {padding:[5,5]})
    },100)
}

function showSubView(obj, id) {
    $('#page-menu-wrap').find('li.current').removeClass('current')
    $(obj).closest('li').addClass('current')

    $('#dataContent').children('div:visible').hide()
    $('#'+id).show()
    hideDropMenu()
}

function clearParam() {
    $('.promo').find('input[id*=table]').each(function (e,o) {
        if ($(o).val() !== '' && $(o).val() !== undefined) {
            $(o).val('')
        }
    })
}

function getPageQueryParam(param) {
    console.log(param)
}

function changeColor(obj) {
    $(obj).css('color', '#8d7035')
    $(obj).css('text-decoration', 'underline')
    $(obj).css('cursor', 'pointer')
}

function resetColor(obj) {
    $(obj).css('color', '#333')
    $(obj).css('text-decoration', 'none')
    $(obj).css('cursor', 'auto')
}

function showLocation(data, title, navTitle) {

    var param = {
        tablename: 'table1',
        lat: data[0],
        lng: data[1],
        showDetail: true,
        title: title,
        navTitle: navTitle
    }
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(param), '_SALT_G(T#*)')
    encrypted = encrypted.toString()

    window.location.href = '/data/mapList?param=' + encrypted
}

function test(key) {
    var bikeIcon = L.icon({
        iconUrl: '../map/marker.png',
        iconSize: [25, 39],
        iconAnchor: [12, 39],
        shadowUrl: null
    });

    var config = {
        tileUrl : 'http://{s}.tiles.mapbox.com/v3/openplans.map-g4j0dszr/{z}/{x}/{y}.png',
        overlayTileUrl : 'http://{s}.tiles.mapbox.com/v3/intertwine.nyc_bike_overlay/{z}/{x}/{y}.png',
        tileAttrib : 'Routing powered by <a href="http://opentripplanner.org/">OpenTripPlanner</a>, Map tiles &copy; Development Seed and OpenStreetMap ',
        initLatLng : new L.LatLng(40.719298,-73.999743), // NYC
        initZoom : 13,
        minZoom : 13,
        maxZoom : 17
    };

    var map = L.map(key, {minZoom: config.minZoom, maxZoom: config.maxZoom}),
        routeLines = [
            L.polyline([[40.68510, -73.94136],[40.68576, -73.94149],[40.68649, -73.94165],[40.68722, -73.94178],[40.68795, -73.94193],[40.68869, -73.94207],[40.68942, -73.94223],[40.69016, -73.94236],[40.69089, -73.94251],[40.69162, -73.94266],[40.69234, -73.94281],[40.69309, -73.94295],[40.69337, -73.94301],[40.69382, -73.94310],[40.69455, -73.94324],[40.69527, -73.94339],[40.69603, -73.94353],[40.69822, -73.94394],[40.69897, -73.94409],[40.69968, -73.94424],[40.70042, -73.94438],[40.70053, -73.94440],[40.70109, -73.94501],[40.70165, -73.94564],[40.70221, -73.94627],[40.70277, -73.94690],[40.70335, -73.94753],[40.70388, -73.94814],[40.70407, -73.94779],[40.70436, -73.94781],[40.70544, -73.94798],[40.70685, -73.94819],[40.70759, -73.94830],[40.70830, -73.94842],[40.70901, -73.94854],[40.70879, -73.95076],[40.70914, -73.95083],[40.70971, -73.95236],[40.71026, -73.95385],[40.71059, -73.95473],[40.71055, -73.95509],[40.71058, -73.95551],[40.71065, -73.95625],[40.71065, -73.95647],[40.71051, -73.95709],[40.71044, -73.95736],[40.71035, -73.95833],[40.71032, -73.95875],[40.71078, -73.95994],[40.71103, -73.96058],[40.71047, -73.96094],[40.71041, -73.96113],[40.71061, -73.96176],[40.71115, -73.96354],[40.71162, -73.96508],[40.71217, -73.96703],[40.71215, -73.96730],[40.71549, -73.97831],[40.71544, -73.97834],[40.71757, -73.98535],[40.71770, -73.98579],[40.71783, -73.98572],[40.71908, -73.98507],[40.71933, -73.98591],[40.71958, -73.98675],[40.71983, -73.98754],[40.72007, -73.98835],[40.72030, -73.98911],[40.72046, -73.98962],[40.72052, -73.98985],[40.72076, -73.99063],[40.72102, -73.99150],[40.72115, -73.99195],[40.72124, -73.99224],[40.72139, -73.99273],[40.72161, -73.99346],[40.72234, -73.99320],[40.72238, -73.99332],[40.72272, -73.99416],[40.72303, -73.99490],[40.72336, -73.99570],[40.72368, -73.99647],[40.72388, -73.99695],[40.72423, -73.99779],[40.72462, -73.99858],[40.72500, -73.99934],[40.72538, -74.00010],[40.72576, -74.00089],[40.72611, -74.00159],[40.72649, -74.00236],[40.72687, -74.00312],[40.72690, -74.00321],[40.72694, -74.00327],[40.72695, -74.00337],[40.72695, -74.00344],[40.72766, -74.00316],[40.72831, -74.00308],[40.72838, -74.00309],[40.72871, -74.00330],[40.72934, -74.00365],[40.72987, -74.00397],[40.73044, -74.00430],[40.73071, -74.00446],[40.73100, -74.00462],[40.73154, -74.00493],[40.73135, -74.00553],[40.73162, -74.00570],[40.73158, -74.00578],[40.73163, -74.00632]]),
            L.polyline([[40.73271, -73.99818],[40.73261, -73.99828],[40.73221, -73.99861],[40.73192, -73.99849],[40.73118, -73.99819],[40.73096, -73.99773],[40.73093, -73.99775],[40.73088, -73.99776],[40.73078, -73.99774],[40.73071, -73.99766],[40.73049, -73.99788],[40.73028, -73.99749],[40.72987, -73.99667],[40.72955, -73.99655],[40.72918, -73.99582],[40.72881, -73.99506],[40.72840, -73.99425],[40.72815, -73.99372],[40.72786, -73.99314],[40.72711, -73.99161],[40.72705, -73.99148],[40.72618, -73.98942],[40.72558, -73.98987],[40.72518, -73.99016],[40.72491, -73.99034],[40.72426, -73.99082],[40.72402, -73.99103],[40.72365, -73.99101],[40.72240, -73.99164],[40.72218, -73.99091],[40.72191, -73.99004],[40.72167, -73.98924],[40.72161, -73.98903],[40.72146, -73.98852],[40.72123, -73.98776],[40.72097, -73.98695],[40.72074, -73.98615],[40.72048, -73.98531],[40.71933, -73.98591],[40.71808, -73.98655],[40.71797, -73.98660],[40.71770, -73.98579],[40.71757, -73.98535],[40.71544, -73.97834],[40.71538, -73.97837],[40.71203, -73.96735],[40.71186, -73.96721],[40.71125, -73.96529],[40.71092, -73.96426],[40.71074, -73.96366],[40.71121, -73.96337],[40.71190, -73.96294],[40.71244, -73.96446],[40.71307, -73.96408],[40.71382, -73.96360],[40.71445, -73.96320],[40.71510, -73.96278],[40.71558, -73.96229],[40.71593, -73.96191],[40.71638, -73.96142],[40.71697, -73.96079],[40.71752, -73.96019],[40.71808, -73.95960],[40.71862, -73.95900],[40.71904, -73.95856]]),
            L.polyline([[40.72022, -74.00005],[40.72043, -73.99986],[40.72142, -73.99904],[40.72265, -73.99798],[40.72388, -73.99695],[40.72466, -73.99631],[40.72520, -73.99584],[40.72508, -73.99533],[40.72585, -73.99471],[40.72593, -73.99464],[40.72601, -73.99458],[40.72626, -73.99440],[40.72664, -73.99412],[40.72728, -73.99364],[40.72786, -73.99314],[40.72988, -73.99141],[40.72979, -73.99074],[40.72974, -73.99036],[40.72955, -73.98991],[40.72988, -73.98966],[40.72990, -73.98891],[40.72999, -73.98736],[40.72977, -73.98682],[40.72878, -73.98443],[40.72937, -73.98400],[40.73001, -73.98353],[40.73064, -73.98306],[40.73135, -73.98255],[40.73202, -73.98206],[40.73221, -73.98192],[40.73265, -73.98160],[40.73325, -73.98115],[40.73382, -73.98073],[40.73406, -73.98056],[40.73442, -73.98030],[40.73498, -73.97990],[40.73558, -73.97943],[40.73619, -73.97899],[40.73687, -73.97851],[40.73755, -73.97805],[40.73816, -73.97760],[40.73879, -73.97715],[40.73941, -73.97670],[40.74002, -73.97625],[40.74013, -73.97616],[40.74064, -73.97581],[40.74127, -73.97534],[40.74145, -73.97521],[40.74217, -73.97467],[40.74309, -73.97402],[40.74378, -73.97351],[40.74445, -73.97303],[40.74506, -73.97257],[40.74568, -73.97212],[40.74629, -73.97167],[40.74692, -73.97122],[40.74751, -73.97073],[40.74783, -73.97049],[40.74865, -73.96990],[40.75200, -73.96746],[40.75283, -73.96690],[40.75312, -73.96669],[40.75324, -73.96661],[40.75334, -73.96654],[40.75387, -73.96615],[40.75450, -73.96569],[40.75513, -73.96524],[40.75575, -73.96478],[40.75638, -73.96432],[40.75700, -73.96387],[40.75763, -73.96341],[40.75831, -73.96292],[40.75898, -73.96243],[40.75961, -73.96197],[40.76023, -73.96152],[40.76023, -73.96163],[40.76071, -73.96278],[40.76068, -73.96280],[40.76061, -73.96276],[40.76017, -73.96168],[40.75956, -73.96033],[40.75797, -73.95673],[40.75521, -73.95040],[40.75353, -73.94654],[40.75148, -73.94183],[40.75105, -73.94082],[40.75106, -73.94068],[40.75108, -73.94075]])
        ],
        markers = [];

    map.addLayer(new L.TileLayer(config.tileUrl, {attribution: config.tileAttrib}));
    map.addLayer(new L.TileLayer(config.overlayTileUrl));
    map.setView(config.initLatLng, config.initZoom);

    $.each(routeLines, function(i, routeLine) {
        var marker = L.animatedMarker(routeLine.getLatLngs(), {
            icon: bikeIcon,
            autoStart: false,
            onEnd: function() {
                $(this._shadow).fadeOut();
                $(this._icon).fadeOut(3000, function(){
                    map.removeLayer(this);
                });
            }
        });

        map.addLayer(marker);
        markers.push(marker);
    });
    $.each(markers, function(i, marker) {
        marker.start();
    });
}
