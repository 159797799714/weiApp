// pages/LIVEVIDEO//pages/liveVideo/liveVideoList.js
var app = getApp();
var _url = app.globalData.SUB_PACKAGE_BACK;
var common = require(_url + '../../utils/common.js');
var publicFun = require(_url + '../../utils/public.js');
let page = 1;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoListFail: 0,//0有直播，1000没有直播
    no_more: false,
    topicVal:'',//搜索框的值
    tabName: [{
      "tagname": "关注"
    }, {
      "tagname": "精选"
    }, {
      "tagname": "小程序直播"
    }],//Tab名字
    tabIndex: 1,//默认进来是精选
    tabFixed: false,//Tab是否固定
    tagid:'',//Tab对应得id
    tabFiexd: 'view1',//Tab固定的位置
    appointIndex:'',//预约的index
    videoListData: '',//列表数据
    isShade: true,//是否显示内容的遮罩
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    page = 1;
    publicFun.setBarBgColor(app, that); // 设置导航条背景色     
    publicFun.height(that);
    app.isLoginFun(that, 1);//判断用户是否登录
    that.tabFun();
  },
  // 原生直播列表数据
  videoListFun: function () {
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_live_list',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        tagid: that.data.tagid,
        keys: that.data.topicVal,
        page: 1
      };
    common.post(url, data, 'videoListData', that,'videoListFail')
  },
  videoListData: function (res) {
    let that = this;
    that.setData({
      videoListData: res.err_msg,
      isShade: false
    });
  },
  videoListFail: function (res) {
    var that = this;
    that.setData({
      videoListFail: res.err_code
    });
  },
  // 小程序官方直播列表数据
  officialListFun:function(){
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_appletlive_list',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        keys: that.data.topicVal,
        page: 1
      };
    common.post(url, data, 'officialListData', that)
  },
  officialListData: function (res){
    let that = this;
    if (that.data.onlyAppletLive.only_applet_live) {
      that.setData({
        tabIndex: 2
      })
    }
    that.setData({
      videoListData: res.err_msg,
      officialListData: res.err_msg,
      isShade: false
    });    
  },
  // 关注列表
  followListFun:function(){
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_my_subscribe_list',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        keys: that.data.topicVal,
        page: 1
      };
    common.post(url, data, 'followListData', that)
  },
  followListData:function(res){
    let that = this;
    that.setData({
      videoListData: res.err_msg,
      isShade: false
    });
  },

  // tab数据
  tabFun:function(){
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_livetags',
      data = {
        store_id: app.globalData.store_id || common.store_id
      };
    common.post(url, data, 'tabData', that)
  },
  tabData:function(res){
    let that = this;
    that.setData({
      onlyAppletLive: res.err_msg
    });
    
    if (res.err_msg.only_applet_live) {//仅官方
      that.setData({
        tabName: res.err_msg.livetags
      });
      that.officialListFun();
    } else if (res.err_msg.unable_applet_live){//仅原生
      var tabName = [{
        "tagname": "关注"
      }, {
        "tagname": "精选"
      }];
      var tabName = tabName.concat(res.err_msg.livetags);
      that.setData({
        tabName: tabName
      });
      that.videoListFun();
    }else{//都有
      var tabName = that.data.tabName.concat(res.err_msg.livetags);
      that.setData({
        tabName: tabName
      });
      that.videoListFun();
    }
  },
  // tab切换
  tabSelect:function(e){
    let that = this;
    page = 1;
    let tabIndex = e.currentTarget.dataset.tabinx;
    that.setData({
      tabIndex: tabIndex,
      isShade: true
    });
    if (tabIndex == 0){
      // that.setData({
      //   videoListData: that.data.followListData
      // });
      that.followListFun();
    }else if (tabIndex == 1){
      that.setData({
        tagid: ''
      });
      that.videoListFun();
    } else if (tabIndex == 2 && !that.data.onlyAppletLive.unable_applet_live){
      // that.setData({
      //   videoListData: that.data.officialListData
      // });
      that.officialListFun();
    } else {
      let tabId = e.currentTarget.dataset.tabid;
      that.setData({
        tagid: tabId
      });
      that.videoListFun();
    }
  },
  onPageScroll:function(e){
    let that = this;
    if (e.scrollTop >= 57){
      that.setData({
        tabFixed: true
      });
    }
    if (e.scrollTop == 0 || e.scrollTop == 51 || e.scrollTop == 52 || e.scrollTop == 53 || e.scrollTop == 54 || e.scrollTop == 55 || e.scrollTop == 56){
      that.setData({
        tabFixed: false
      });
    }
  },
  // 页面左右滑动
  bindchange:function(e){
    let that = this;
    page = 1;
    let tabIndex = e.detail.current;
    this.setData({
      tabIndex: tabIndex,
      tabFiexd: 'view' + tabIndex,
      isShade: true
    });
    if (tabIndex == 0) {
      // that.setData({
      //   videoListData: that.data.followListData
      // });
      that.followListFun();
    } else if (tabIndex == 1) {
      that.setData({
        tagid: ''
      });
      that.videoListFun();
    } else if (tabIndex == 2 && !that.data.onlyAppletLive.unable_applet_live) {
      // that.setData({
      //   videoListData: that.data.officialListData
      // });
      that.officialListFun();
    }else{
      let tabId = that.data.tabName[tabIndex].id;
      that.setData({
        tagid: tabId
      });
      that.videoListFun();
    }
  },
  // 预约
  appointClick:function(e){
    let that = this;
    let tabIndex = that.data.tabIndex;
    let appointIndex = e.currentTarget.dataset.liveindex;
    let advanceTotal = e.currentTarget.dataset.advancetotal*1 + 1;
    that.setData({
      appointIndex: appointIndex,
      advanceTotal: advanceTotal
    });
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
    if (that.data.videoListData.list[appointIndex].is_advance == 0) {
      wx.requestSubscribeMessage({
        tmplIds: that.data.videoListData.subscribe_template_id,
        success(res) {
          console.log(res);
          if (res[that.data.videoListData.subscribe_template_id] == "accept") { //点击确定授权
            publicFun.warning('预约成功', that);
            if (tabIndex == 2 && !that.data.onlyAppletLive.unable_applet_live) {
              let roomId = e.currentTarget.dataset.roomid;
              that.officialFollowFun(roomId);
            } else {
              let liveId = e.currentTarget.dataset.liveid;
              that.appointFun(liveId);
            }
          } else { //点击取消授权
            publicFun.warning('预约失败', that);
          }
        }
      })
    } else if (that.data.videoListData.list[appointIndex].is_advance == 1) {
      publicFun.warning('已预约', that);
    } else {
      publicFun.warning('已发送', that);
    }    
  },
  
  appointed:function(){
    let that = this;
    publicFun.warning('直播结束无法预约', that);
  },
  // 原生预约函数
  appointFun: function (liveId) {
    let that = this;
    let url = 'app.php?c=tencent_live&a=addPrepareTips',
      data = {
        live_id: liveId,
        cfrom: 0,
        openid: wx.getStorageSync('openId')
      };
    common.post(url, data, 'appointData', that)
  },
  appointData: function (res) {
    var that = this;
    let appointIndex = that.data.appointIndex;
    let isAdvance = 'videoListData.list[' + appointIndex + '].is_advance';
    let advanceTotal = 'videoListData.list[' + appointIndex + '].advance_total';
    that.setData({
      [isAdvance]: 1,
      [advanceTotal]: that.data.advanceTotal
    });
  },
  // 小程序官方直播预约函数
  officialFollowFun: function (roomId, liveIndex){
    let that = this;
    let url = 'app.php?c=tencent_live&a=addAppletLiveTips',
      data = {
        roomid: roomId,
        cfrom: 0,
        openid: wx.getStorageSync('openId')
      };
    common.post(url, data, 'officialFollowData', that, '', true)
  },
  officialFollowData: function (res) {
    let that = this;
    let appointIndex = that.data.appointIndex;
    let isAdvance = 'videoListData.list[' + appointIndex + '].is_advance';
    let advanceTotal = 'videoListData.list[' + appointIndex + '].advance_total';
    that.setData({
      [isAdvance]: 1,
      [advanceTotal]: that.data.advanceTotal
    });
  },
  // 跳转详情
  goLiveDetail: function (e) {
    let that = this;
    let tabIndex = that.data.tabIndex;
    let liveId = e.currentTarget.dataset.liveid;
    let imgsrc = e.currentTarget.dataset.imgsrc;
    let status = e.currentTarget.dataset.status;
    let liveIndex = e.currentTarget.dataset.liveindex;
    that.setData({
      liveId: liveId
    })
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
    if (tabIndex == 2 && !that.data.onlyAppletLive.unable_applet_live){
      console.log(that.data.officialListData.list[liveIndex].page_url);
      wx.navigateTo({
        url: that.data.officialListData.list[liveIndex].page_url,
      })
    }else{
      wx.navigateTo({
        url: '/pages/LIVEVIDEO/pages/liveVideo/liveVideoDetail?isShare=1&live_id=' + liveId + "&imgsrc=" + imgsrc + "&status=" + status,
      })
    }
  },
  // 搜索
  // 监听输入框
  wxSearchInput: function (e) {
    let that = this;
    that.setData({
      topicVal: e.detail.value
    });
  },
  searchBtn:function(){
    let that = this;
    page = 1;
    that.onPullDownRefresh();
  },
  // 回车
  wxSearchFn: function () {
    let that = this;
    page = 1;
    that.onPullDownRefresh();
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作onPullDownRefresh
   */
  onPullDownRefresh: function () {
    let that = this;
    page = 1;
    // 显示顶部刷新图标  
    wx.showNavigationBarLoading();
    let tabIndex = that.data.tabIndex;
    if (tabIndex == 0){
      that.followListFun();
    } else if (tabIndex == 1){
      that.videoListFun();
    } else if (tabIndex == 2 && !that.data.onlyAppletLive.unable_applet_live){
      that.officialListFun();
    }else{
      let tabId = that.data.tabName[tabIndex].id;
      that.setData({
        tagid: tabId
      });
      that.videoListFun();
    }
    // 数据请求成功后，关闭刷新
    wx.stopPullDownRefresh({
      success(res) {
        console.log('刷新成功');
        // 隐藏导航栏加载框  
        wx.hideNavigationBarLoading();
        // 停止下拉动作  
        wx.stopPullDownRefresh();
      }
    });      
  },
  /**
   * 页面上拉触底事件的处理函数onReachBottom
   */
  onReachBottom: function () {
    var that = this;
    let tabIndex = that.data.tabIndex;
    if (tabIndex == 0) {
      let url = 'app.php?c=tencent_live&a=get_my_subscribe_list';
      that.listPushData(++page, that, url);
    } else if (tabIndex == 1) {
      let url = 'app.php?c=tencent_live&a=get_live_list';
      that.listPushData(++page, that, url);
    } else if (tabIndex == 2 && !that.data.onlyAppletLive.unable_applet_live) {
      let url = 'app.php?c=tencent_live&a=get_appletlive_list';
      that.listPushData(++page, that, url);
    } else {
      let url = 'app.php?c=tencent_live&a=get_live_list';
      that.listPushData(++page, that, url, tabIndex);
    }
  },
  // 上拉加载方法(分页)
  listPushData: function (page, that, url, tabIndex) {
    //订单相关页面下拉加载
    if (that.data.videoListData.next_page == false) {      
      return
    }
    wx.showToast({
      title: "加载中..",
      icon: "loading"
    });
    let data = {
      store_id: app.globalData.store_id || common.store_id,
      keys: that.data.topicVal,
      page: page
    };
    if (tabIndex != 0 && tabIndex != 1 && tabIndex != 2){
      data.tagid = that.data.tagid
    }
    common.post(url, data, function (result){
      //添加数据
      var list = that.data.videoListData.list;
      for (var i = 0; i < result.err_msg.list.length; i++) {
        list.push(result.err_msg.list[i]);
      }
      that.setData({
        'videoListData.list': list,
        'videoListData.next_page': result.err_msg.next_page
      });
      if (result.err_msg.next_page == false){
        that.setData({
          no_more: true
        });
      }
    }, '');    
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this;
    page = 1;
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})