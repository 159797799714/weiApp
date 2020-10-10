import publicFun from "../../../../utils/public"
import http from "../../../../utils/http"

const app = getApp();
Page({
  data: {
    tabsData: {
      activeTab: 0,
      tabs: ['有效专属VIP', '历史专属VIP']
    },
    listHeight: 0,
    recordData: [{ listData: [], curtab: 0 },{ listData: [], curtab: 1 }],
    page_0: 1,
    page_1: 1,
    pageSize: 10,
    isFirstReq: false,   //只有第一次切换tab时请求数据
    unReachBottom: false  //判断是否需要上拉加载更多
  },
  onLoad: function (options) {   //页面加载完成
    publicFun.setBarBgColor(app, this);// 设置导航条背景色
    this.getVipRecordData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    
  },
  onHide: function () {  //监听页面隐藏

  },
  onPullDownRefresh: function () {   // 监听用户下拉动作
    this.setData({ page_0: 1, page_1: 1, 'tabsData.activeTab': 0, isFirstReq: false });
    this.getVipRecordData('refresh');
  },
  onReachBottom() {   //触底上拉加载更多
    let { unReachBottom } = this.data;
    if (!unReachBottom){   //切换tab时不触发上拉加载更多
      let { recordData, page_0, page_1, pageSize } = this.data, { activeTab } = this.data.tabsData;
      let len = recordData[activeTab].listData.length;
      if (len < pageSize || len%pageSize != 0) return;
      let page = activeTab == 0 ? ++page_0 : ++page_1;
      let _n = `page_${activeTab}`;
      this.setData({ [_n]: page });
      this.getVipRecordData();
    }else {
      this.setData({ unReachBottom: false });
    }
  },
  swiperChange(e) {    //swiper切换时触发
    let { current } = e.detail;
    let { type } = e.currentTarget.dataset;
    if (type == 'activeTab') type = 'tabsData.activeTab';
    this.setData({ [type]: current });

    if (type == "tabsData.activeTab"){
      //只有在第一次切换到历史记录时 或者 数据为空时请求
      this.setData({ unReachBottom: true });    //切换tab时，不允许触发上拉加载更多方法
      let { isFirstReq } = this.data, { activeTab } = this.data.tabsData;
      if (!isFirstReq && activeTab == 1){
        this.setData({ isFirstReq: true });
        this.getVipRecordData();
      }else {
        this.setListHeight();
      }
    }
  },
  tabChange(e) {   //切换tab
    let { index } = e.currentTarget.dataset;
    this.setData({ 'tabsData.activeTab': index });
  },
  getVipRecordData(refresh) {   //获取专属VIP记录
    const me = this;
    let { pageSize } = this.data, { activeTab } = this.data.tabsData;
    let params = {
      userId: app.globalData.my_uid,
      vipFlag: activeTab,
      page: this.data[`page_${activeTab}`],   //取对应的page
      pageSize
    }
    
    http.post('getVipRecord', params)
    .then(res => {
      let { recordData } = me.data;
      if (refresh){   //下拉刷新
        recordData.forEach((item, index) => {   //清空数据列表
          item.listData = [];
        })
        me.setData({ recordData });
        wx.stopPullDownRefresh();
      }

      if (!res.data || !res.data.records || !res.data.records.length){
        if (me.data[`page_${activeTab}`] > 1) {   //将页数减1，回到上拉之前的值
          let { page_0, page_1 } = me.data;
          let page = activeTab == 0 ? --page_0 : --page_1;
          let _n = `page_${activeTab}`;
          me.setData({ [_n]: page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }
        me.setListHeight();
        return;
      }

      let _pd = `recordData[${activeTab}].listData`, newArr = [];
      newArr = recordData[activeTab].listData.concat(res.data.records);
      me.setData({ [_pd]: newArr });
      me.setListHeight();

    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //下拉刷新
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  setListHeight() {   //获取列表高度，设置swiper高度
    const me = this;
    let { activeTab } = this.data.tabsData, _id = `#datas_${activeTab}`;
    wx.createSelectorQuery().select(_id).fields({ size: true, scrollOffset: true })
    .exec((res) => {
      me.setData({ listHeight: res[0].height });
    })
  }

})