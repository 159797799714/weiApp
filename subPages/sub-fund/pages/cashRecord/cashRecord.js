import http from "../../../../utils/http_cps"

Page({
  data: {
    listData: null,    //组装后用于渲染的数组
    requestListData: [],   //从接口获取到的原始数据
    page: 1, 
    pageSize: 10,
    statusObj: {
      0: "发放失败",    //后台审核不通过
      1: "发放中",
      2: "已到账",
      3: "发放失败"
    },
    isshowPopup: false
  },
  onLoad: function (options) {   //页面加载完成
    this.getListData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示

  },
  onHide: function () {  //监听页面隐藏
    
  },
  onPullDownRefresh() {   //下拉刷新
    this.setData({ page: 1 });
    this.getListData('refresh');
  },
  onReachBottom() {   //上拉加载更多
    let { requestListData, page, pageSize } = this.data;
    let len = requestListData.length;
    if (len < pageSize || len%pageSize != 0) return;
    page++;
    this.setData({ page });
    this.getListData();
  },
  getListData(refresh) {   //获取列表数据
    const me = this;
    let { page, pageSize } = this.data;
    let isloading = refresh || page > 1 ? true : false;
    http.get('cashflow_cps', { page, page_size: pageSize }, isloading)
    .then(res => {
      if (refresh){   //下拉刷新
        me.setData({ listData: [], requestListData: [] });
        wx.stopPullDownRefresh();
      }

      if (!res.data || !res.data.length){
        if (page > 1){   //将页数减1，回到上拉之前的值
          page--;
          me.setData({ page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }else {
          me.setData({ listData: [], requestListData: [] });
        }
        return;
      }

      //定义一个空对象，先组装数据结构： {{ month: "xxxx", list: [] }}
      let obj = {};
      res.data.forEach(item => {
        let { createtime, cash, month_str } = item;
        item.createtime = wx.$moment(createtime*1000).format("LTS");   //后台返回时间到秒
        item.cash = cash/100;

        if (!obj[month_str]){
          let _o = { month_str, list: [item] };
          obj[month_str] = _o;
        }else {
          obj[month_str].list.push(item);
        }
      })
      console.log('组装的对象obj------', obj, '最终数组------', Object.values(obj));

      let newArr = [], _rqarr = [], { listData, requestListData } = me.data;
      _rqarr = requestListData.concat(res.data);
      newArr = listData ? listData.concat(Object.values(obj)) : [].concat(Object.values(obj));
      me.setData({ listData: newArr, requestListData: _rqarr });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  failTipFun() {   //查看发放失败提示
    this.setData({ isshowPopup: true });
  },
  onClosePopup() {   //关闭popup弹框
    this.setData({ isshowPopup: false });
  }

})