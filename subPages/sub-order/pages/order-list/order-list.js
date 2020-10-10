import http from "../../../../utils/http_cps"

Page({
  data: {
    tabsData: {
      activeTab: 0,
      tabs: ['全部', '待返现', '已返现', '已失效']
    },
    listData: null,
    statusObj: {
      1: "已下单",
      2: "已返现",
      3: "已失效"
    },
    cashbackObj: {
      1: "待返现：",
      2: "已返现：",
      3: "订单失效"
    },
    page: 1, 
    pageSize: 20,
    showInstruction: false,
    sourceIcon: {
      "拼多多": {
        icon: "iconpinduoduo",
        color: "#F40009"
      },
      "京东": {
        icon: "iconjingdong",
        color: "#DD2727"
      }
    }
  },
  onLoad: function (options) {   //页面加载完成
    let { activeTab } = options;
    if (activeTab) this.setData({ 'tabsData.activeTab': activeTab });
    this.getOrderData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    let _int = wx.getStorageSync('instruction');
    this.setData({ showInstruction: _int ? false : true});
  },
  onHide: function () {  //监听页面隐藏
    
  },
  onPullDownRefresh() {   //下拉刷新
    this.setData({ page: 1, 'tabsData.activeTab': 0 });
    this.getOrderData('refresh');
  },
  onReachBottom() {   //上拉加载更多
    let { listData, page, pageSize } = this.data;
    let len = listData.length;
    if (len < pageSize || len%pageSize != 0) return;
    page++;
    this.setData({ page });
    this.getOrderData();
  },
  tabChange(e) {   //切换tab
    let { index } = e.currentTarget.dataset;
    this.setData({ 'tabsData.activeTab': index, page: 1 });
    this.getOrderData('tab');
  },
  getOrderData(type) {   //获取订单列表数据
    const me = this;
    let { page, pageSize } = this.data, { activeTab } = this.data.tabsData;
    let params = {
      page,
      page_size: pageSize,
      status: activeTab
    }
    let isloading = type || page > 1 ? true : false;   //下拉刷新 和 加载更多的时候展示Loading
    http.get('orders_list_cps', params, isloading)
    .then(res => {
      if (type){   //下拉刷新/切换tab
        me.setData({ listData: [] });
        if (type == 'refresh') wx.stopPullDownRefresh();
      }

      if (!res.data || !res.data.length){
        if (page > 1){   //将页数减1，回到上拉之前的值
          page--;
          me.setData({ page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }else {
          me.setData({ listData: [] });
        }
        return;
      }

      res.data.forEach(item => {
        let { createtime, return_cash } = item;
        item.createtime = wx.$moment(createtime*1000).format("L");
        item.return_cash = return_cash/100;
      })

      let newArr = [], { listData } = me.data;
      newArr = listData ? listData.concat(res.data) : [].concat(res.data);
      me.setData({ listData: newArr });
    })
    .catch(res => {
      if (type == 'refresh') wx.stopPullDownRefresh();
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  toCashoutInstruction() {   //查看返现提现说明
    wx.navigateTo({ 
      url: `/subPages/sub-order/pages/instruction/instruction`,
      success() {
        wx.setStorageSync('instruction', true);
      }
    });
  },
  toDetail(e) {   //查看订单详情
    let { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/subPages/sub-order/pages/order-detail/order-detail?id=${id}` });
  },
  toHomeFun() {
    wx.switchTab({ url: '/pages/index/index'});
  }

})