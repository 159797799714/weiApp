import publicFun from "../../utils/public"
import common from "../../utils/common"
import http from "../../utils/http"
let livePlayer = requirePlugin('live-player-plugin')

const app = getApp();
Page({
  data: {
    bannerIndex: 0,
    bannerList: [],
    tabsData: {
      activeTab: 0,
      tabs: ['直播中', '回放']
    },
    listHeight: 0,
    playerData: [{ listData: [], curtab: 0 },{ listData: [], curtab: 1 }],
    page_0: 1, 
    page_1: 1,
    pageSize: 20,   //因为是一排两个，所以定为20条
    isFirstReq: false,    //用来判断是否是第一次切换tab
    unReachBottom: false,  //判断是否需要上拉加载更多
    timer: null,
    hasNewLive: false   //有新的直播中数据
  },
  onLoad: function (options) {   //页面加载完成
    console.log('直播间的-options------', options);
    let { share_uid } = options;    //获取分享者的uid
    if (share_uid){
      app.globalData.share_uid = share_uid;
    }

    const me = this;
    app.updateThemeColor().then(function() {
      publicFun.setBarBgColor(app, me); // 设置导航条背景色
      // publicFun.getTabBarFun(me, '/pages/livetab/livetab');   //设置当前tabar的序号: 自定义tabar
    })
    app.isLoginFun(this, 1); //判断用户是否登录
    
    this.getLiveListData();   //获取直播列表数据
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    let { timer } = this.data;
    if (timer){
      clearTimeout(timer);
      this.setData({ timer: null });
    }

    this.getBannerList();   //获取轮播图数据
  },
  onHide: function () {  //监听页面隐藏
    
  },
  onShareAppMessage: function () {  //用户点击右上角分享
    return app.shareGetFans('推荐一个主播给你，快来一起看！', ' ', `/pages/livetab/livetab`, 1, '');
  },
  onPullDownRefresh: function () {  // 监听用户下拉动作
    this.setData({ page_0: 1, page_1: 1, 'tabsData.activeTab': 0, isFirstReq: false, hasNewLive: false });
    this.getLiveListData('refresh');
    this.getBannerList();   //获取轮播图数据
  },
  onReachBottom() {   //上拉加载更多
    let { unReachBottom } = this.data;
    if (!unReachBottom){   //切换tab时不触发上拉加载更多
      let { playerData, page_0, page_1, pageSize } = this.data, { activeTab } = this.data.tabsData;
      let len = playerData[activeTab].listData.length;
      if (len < pageSize || len%pageSize != 0) return;
      let page = activeTab == 0 ? ++page_0 : ++page_1;
      let _n = `page_${activeTab}`;
      this.setData({ [_n]: page });
      this.getLiveListData();
    }else {
      this.setData({ unReachBottom: false });
    }
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
      let { isFirstReq } = this.data, { activeTab } = this.data.tabsData;
      if (!isFirstReq && activeTab == 1){   //直播列表swiper切换的时  只有刚进入时切换到 回放 时才请求请求数据
        this.setData({ isFirstReq: true });
        this.getLiveListData();
      }else {
        this.setListHeight();
      }
    }
  },
  getBannerList(updata) {   //获取轮播图数据： 未开播：102
    http.post('liveList', { liveStatus: 102, storeId: common.store_id })
    .then(res => {
      if (!res.data || !res.data.length){
        this.setData({ bannerList: [{ anchorImg: "https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/banner_min.png" }] });
        return
      }
      this.setData({ bannerList: res.data });
      this.getLiveStatus();   //轮询直播状态
    })
    .catch(res => {
      this.setData({ bannerList: [{ anchorImg: "https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/banner_min.png" }] });
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  getLiveStatus() {    //轮询获取最新的直播状态   // 101: 直播中, 102: 未开始, 103: 已结束, 104: 禁播, 105: 暂停中, 106: 异常，107：已过期 
    const me = this;
    let { bannerList, timer } = this.data;
    if (!bannerList.length || (bannerList.length == 1 && !bannerList[0].roomId)){
      if (timer){
        clearTimeout(timer);
        this.setData({ timer: null });
      }
      return;
    }

    bannerList.forEach((item, index) => {
      livePlayer.getLiveStatus({ room_id: item.roomId })
      .then(res => {
        console.log('房间---' + item + '----get live status-------', res)

        let { liveStatus } = res;
        if (liveStatus != 102){   //当前直播已经不是未开播状态，更新数据
          me.updateLive();
        }

        timer = setTimeout(() => {
          me.getLiveStatus();
        }, 60000)
        me.setData({ timer });
      })
      .catch(err => {
        console.log('房间---' + item + '----get live status', err)
      })
    })
  },
  updateLive() {   //更新直播数据
    const me = this;
    http.post('updateLive', { storeId: common.store_id })
    .then(res => {
      me.setData({ hasNewLive: true });
      me.getBannerList('updata');
    })
    .catch(res => {
      me.setData({ hasNewLive: false });
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  applyFun(e) {   //预约直播
    let { roomid } = e.currentTarget.dataset;
    if (this.data._unlogin || !roomid) return;   //没有登录

    let share_uid = app.globalData.my_uid;
    console.log('预约直播roomid-----', roomid, '------当前分享uid----', share_uid);

    let customParams = encodeURIComponent(JSON.stringify({ path: 'pages/livetab/livetab', share_uid }))
    wx.navigateTo({
      url: `plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=${roomid}&custom_params=${customParams}`
    })
  },
  getLiveListData(refresh) {   //获取直播/回放数据
    const me = this;
    let { pageSize } = this.data, { activeTab } = this.data.tabsData;
    let params = {
      storeId: common.store_id,
      liveStatus: activeTab == 0 ? 101 : 103,    //101:直播中   103:已结束
      page: this.data[`page_${activeTab}`],   //取对应的page
      pageSize
    }
    http.post('liveList', params)
    .then(res => {
      let { playerData } = me.data;
      if (refresh){   //下拉刷新
        playerData.forEach((item, index) => {   //清空数据列表
          item.listData = [];
        })
        me.setData({ playerData });
        wx.stopPullDownRefresh();
      }

      if (!res.data || !res.data.length){
        if (me.data[`page_${activeTab}`] > 1){   //将页数减1，回到上拉之前的值
          let { page_0, page_1 } = me.data;
          let page = activeTab == 0 ? --page_0 : --page_1;
          let _n = `page_${activeTab}`;
          me.setData({ [_n]: page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }
        me.setListHeight();
        return;
      }

      let _pd = `playerData[${activeTab}].listData`, newArr = [];
      newArr = playerData[activeTab].listData.concat(res.data);
      me.setData({ [_pd]: newArr });
      me.setListHeight();
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
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
  },
  toRoomFun(e) {   //去到直播间
    if (this.data._unlogin) return;   //没有登录

    let { roomid } = e.currentTarget.dataset;
    let share_uid = app.globalData.my_uid;
    console.log('当前直播roomid-----', roomid, '------当前分享uid----', share_uid);

    let customParams = encodeURIComponent(JSON.stringify({ path: 'pages/livetab/livetab', share_uid }))
    wx.navigateTo({
      url: `plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=${roomid}&custom_params=${customParams}`
    })
  },
  isLogin:function(e){
    if (!app.isLoginFun(this)) {   //判断用户是否登录
      return false;
    }
  }

})