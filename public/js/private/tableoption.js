var tableOptions = {
    method: 'get',                      //请求方式（*）
    striped: false,                      //是否显示行间隔色
    cache: true,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
    pagination: true,                   //是否显示分页（*）
    sortable: true,                     //是否启用排序
    sidePagination: "server",           //分页方式：client客户端分页，server服务端分页（*）
    pageNumber: 1,                       //初始化加载第一页，默认第一页
    pageSize: 10,                       //每页的记录行数（*）
    pageList: [5, 10, 25, 50, 100],     //可供选择的每页的行数（*）
    search: false,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
    searchTimeOut: 120,
    strictSearch: true,
    showColumns: false,                  //是否显示所有的列
    showRefresh: false,                  //是否显示刷新按钮
    minimumCountColumns: 2,             //最少允许的列数
    clickToSelect: false,                //是否启用点击选中行
    iconSize:20,
    uniqueId: "_id",                     //每一行的唯一标识，一般为主键列
    queryParams: function (param) {
        let query = {
            page: param.offset
            , limit: param.limit
            , key: param.search || ''
            , sort: {}
        }
        if (param.sort !== undefined) {
            query.sort[param.sort] = param.order
        } else {
            query.sort['_id'] = 'asc'
        }
        return query
    },
    onLoadSuccess: function (aa, bb, cc) {
        if (aa.error) {
            alert(aa.error)
            //showMessage(aa.error, '')
        }
    }
    ,onLoadError: function (error) {
        showMessage(error.message, '')
    }
}
