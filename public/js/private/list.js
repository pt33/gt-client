function getListQueryParam(param) {
    var searchText = this.searchText.split('|')

    var tmp = {}
    tmp[searchText[1]] = searchText[0].toString()

    var query = {
        page: param.offset
        , limit: param.limit
        , key: tmp
        , tableId: searchText[2]
        , tablename: searchText[3]
        , sort: {}
    }
    if (param.sort !== undefined) {
        query.sort[param.sort] = param.order
    } else {
        query.sort['_id'] = 'asc'
    }
    // queryLimit = param.limit
    return query
}

function setListFormatter(value, row, index) {
    var ary = this.order.split('|')
    var tableName = ary[1]
    var tableId = ary[0]
    var title = ary[2]

    var a = []
    a.push('<a href="javascript:void(0)" class="social-icon si-borderless si-buffer" data-toggle="tooltip" data-placement="top" title="查看明细" onclick="showDetailView(\'' + tableName + '\',\'' + tableId + '\',\'' + row._id.toString() + '\',\'' +  title + '\')">')
    a.push('<i class="icon-hand-up"></i><i class="icon-hand-up"></i></a>')

    return a.join('')
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

function getLocationListQueryParam(param) {
    var searchText = this.searchText.split('|')

    var tmp = {}
    tmp[searchText[1]] = JSON.parse(searchText[0])

    var query = {
        page: param.offset
        , limit: param.limit
        , key: tmp
        , tableId: searchText[2]
        , tablename: searchText[3]
        , sort: {}
    }
    if (param.sort !== undefined) {
        query.sort[param.sort] = param.order
    } else {
        query.sort['_id'] = 'asc'
    }
    // queryLimit = param.limit
    return query
}

function getMoreListQueryParam(param) {
    var searchText = this.searchText.split('|')

    var tmp = {}
    tmp[searchText[1]] = searchText[0]

    var query = {
        page: param.offset
        , limit: param.limit
        , key: tmp
        , tableId: searchText[2]
        , tablename: searchText[3]
        , sort: {}
    }
    if (param.sort !== undefined) {
        query.sort[param.sort] = param.order
    } else {
        query.sort['_id'] = 'asc'
    }
    // queryLimit = param.limit
    return query
}
