import http from "../../../../utils/http"

const app = getApp();
Page({
  data: {
    temp: "",
    tabsData: {
      activeTab: 0,
      tabs: ['购物返佣', '活动奖励', '新增粉丝']
    },
    pointsDetail: null,
    curdate: "",
    listHeight: 0,
    detailData: [{ listData: [], curtab: 0 },{ listData: [], curtab: 1 },{ listData: [], curtab: 2 }],
    page_0: 1,
    page_1: 1,
    page_2: 1, 
    pageSize: 10,
    isFirstReq_0: true,     //用来判断是否是第一次切换tab 第一个tab
    isFirstReq_1: false,    //用来判断是否是第一次切换tab 第二个tab
    isFirstReq_2: false,    //用来判断是否是第一次切换tab 第三个tab
    unReachBottom: false  //判断是否需要上拉加载更多
  },
  onLoad: function (options) {   //页面加载完成
    //设置时间选择器的截止时间为当前月份
    let _d = new Date();
    let _t = `${_d.getFullYear()}-${(_d.getMonth()+1).toString().length == 1 ? '0' : ''}${_d.getMonth() + 1}`;
    this.setData({ temp: _t, curdate: _t });
    this.getPointsRecordData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    this.getPointStatistics();
  },
  onHide: function () {  //监听页面隐藏

  },
  onPullDownRefresh: function () {   // 监听用户下拉动作
    this.setData({ page_0: 1, page_1: 1, page_2: 1, 'tabsData.activeTab': 0, isFirstReq_0: true, isFirstReq_1: false, isFirstReq_2: false });
    this.getPointStatistics();
    this.getPointsRecordData('refresh');
  },
  onReachBottom() {   //触底上拉加载更多
    let { unReachBottom } = this.data;
    if (!unReachBottom){   //切换tab时不触发上拉加载更多
      let { detailData, page_0, page_1, page_2, pageSize } = this.data, { activeTab } = this.data.tabsData;
      let len = detailData[activeTab].listData.length;
      if (len < pageSize || len%pageSize != 0) return;
      let page = activeTab == 0 ? ++page_0 : (activeTab == 1 ? ++page_1 : ++page_2);
      let _n = `page_${activeTab}`;
      this.setData({ [_n]: page });
      this.getPointsRecordData();
    }else {
      this.setData({ unReachBottom: false });
    }
  },
  getPointStatistics() {  //获取积分统计明细数据
    http.post('selectPointStatistics', { userId: app.globalData.my_uid })
    .then(res => {
      if (!res.data) return;
      this.setData({ pointsDetail: res.data });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  toConvertFun(e) {   //去兑换
    wx.navigateTo({ url: `/subPages/sub-fund/pages/cashout/cashout` });
  },
  toApplyingFun() {    //查看申请中的积分
    wx.navigateTo({ url: `/subPages/sub-integral/pages/applying/applying` });
  },
  tabChange(e) {   //切换tab
    let { index } = e.currentTarget.dataset;
    this.setData({ 'tabsData.activeTab': index });
  },
  swiperChange(e) {    //swiper切换时触发
    let { current } = e.detail;
    let { type } = e.currentTarget.dataset;
    if (type == 'activeTab') type = 'tabsData.activeTab';
    this.setData({ [type]: current });

    if (type == "tabsData.activeTab"){
      this.setData({ unReachBottom: true });    //切换tab时，不允许触发上拉加载更多方法
      // 列表swiper切换的时  只有刚进入时切换到 第二个tab和第三个tab 时才请求请求数据
      let { isFirstReq_0, isFirstReq_1, isFirstReq_2 } = this.data, { activeTab } = this.data.tabsData;
      if ((activeTab == 0 && !isFirstReq_0) || (activeTab == 1 && !isFirstReq_1) || (activeTab == 2 && !isFirstReq_2)){
        let _n = `isFirstReq_${activeTab}`
        this.setData({ [_n]: true });
        this.getPointsRecordData();
      }else {
        this.setListHeight();
      }
    }
  },
  bindDateChange: function(e) {   //选择日期
    this.setData({ curdate: e.detail.value, page_0: 1, page_1: 1, page_2: 1, isFirstReq_0: false, isFirstReq_1: false, isFirstReq_2: false });

    let { activeTab } = this.data.tabsData;
    let _n = `isFirstReq_${activeTab}`;
    this.setData({ [_n]: true });
    this.getPointsRecordData('time');
  },
  getPointsRecordData(refresh) {  //获取历史明细列表数据
    const me = this;
    let { curdate, pageSize } = this.data, { activeTab } = this.data.tabsData;
    let params = {
      userId: app.globalData.my_uid,
      settleDate: curdate.replace(/\-/g, ""),
      sourceType: (+activeTab) + 1,    //1:购物返佣  2:活动奖励   3:新增粉丝
      page: this.data[`page_${activeTab}`],   //取对应的page
      pageSize
    }

    http.post('queryPointsRecordBySource', params)
    .then(res => {
      let { detailData } = me.data;
      if (refresh){   //下拉刷新
        detailData.forEach((item, index) => {   //清空数据列表
          item.listData = [];
        })
        me.setData({ detailData });
        if (refresh == 'refresh') wx.stopPullDownRefresh();
      }

      if (!res.data || !res.data.records || !res.data.records.length){
        if (me.data[`page_${activeTab}`] > 1){   //将页数减1，回到上拉之前的值
          let { page_0, page_1, page_2 } = me.data;
          let page = activeTab == 0 ? --page_0 : (activeTab == 1 ? --page_1 : --page_2);
          let _n = `page_${activeTab}`;
          me.setData({ [_n]: page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }
        me.setListHeight();
        return;
      }

      //判断是否是自己购买的
      let { records } = res.data;
      records.forEach((item, index) => {
        item.isme = false;
        if (app.globalData.my_uid && item.memberId == app.globalData.my_uid){
          item.isme = true;
        }
      })

      let _pd = `detailData[${activeTab}].listData`, newArr = [];
      newArr = detailData[activeTab].listData.concat(records);
      me.setData({ [_pd]: newArr });
      me.setListHeight();
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  setListHeight() {   //计算列表的高度
    const me = this;
    let { activeTab } = this.data.tabsData, _id = `#datas_${activeTab}`;
    wx.createSelectorQuery().select(_id).fields({ size: true, scrollOffset: true })
    .exec((res) => {
      me.setData({ listHeight: res[0].height });
    })
  }

})