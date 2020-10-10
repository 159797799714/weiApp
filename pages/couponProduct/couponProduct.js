import publicFun from "../../utils/public"
import http from "../../utils/http"
import http_cps from "../../utils/http_cps"
import { togetherDialogData, togetherDialogJs } from "../../template/together-dialog/together-dialog"

const app = getApp();
Page({
  data: {
    tabsData: {
      activeTab: 0,
      tabs: []
    },
    catsList: null,   //获取到的类目数组
    scrollLeft: 0,  //设置类目tab的横向滚动位置
    bannerIndex: 0,
    bannerList: [],    //页面banner
    channelList: [],   //频道数据
    innerBannerList: [],
    proListData: null,   //商品列表数组
    page: 1,
    pageSize: 10,
    hasFictitious: 0,    //当前页面数据含有 虚拟支付商品的个数
    sourceIcon: {
      "拼多多": {
        icon: "iconpinduoduo",
        color: "#F40009"
      },
      "京东": {
        icon: "iconjingdong",
        color: "#DD2727"
      }
    },
    userData: {},
    ...togetherDialogData
  },
  onLoad: function (options) {   //页面加载完成
    publicFun.onLoad(app, this);  //授权弹框提前注册
    this.getTabs();
    this.getBanners();
    this.getChannelList();
    this.getProductData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    this.isLogin(1);

    //判断手机号码是否需要授权 授权前需要刷新登录态
    let _has_phone = this.data._has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
    if (!_has_phone) app.wxloginMethods()   //新用户手机授权之前先刷新登录态

    this.getIncomeData();
  },
  onHide: function () {  //监听页面隐藏
    
  },
  onShareAppMessage: function () {  //用户点击右上角分享
    let { nickname } = this.data.userData;
    let title = nickname ? `【${nickname}】` : '';
    console.log('首页分享-----nickname', nickname, '-----title----', title);
    return app.shareGetFans(`${title}推荐您享受京东拼多多专属优惠，分享还能赚佣金！`, ' ', `/pages/index/index`, 1, 'cps');
  },
  onPullDownRefresh() {    //下拉刷新
    this.setData({ page: 1, 'tabsData.activeTab': 0, scrollLeft: 0, hasFictitious: 0 });
    this.getTabs();
    this.getBanners();
    this.getChannelList();
    this.getIncomeData('refresh');
    this.getProductData('refresh');
  },
  onReachBottom() {   //上拉加载更多
    let { proListData, page, pageSize, hasFictitious } = this.data;
    let len = proListData.length;
    if ((len + hasFictitious) < pageSize || ((len + hasFictitious) < pageSize && (len + hasFictitious)%pageSize != 0)) return;
    page++;
    this.setData({ page });
    this.getProductData();
  },
  ...togetherDialogJs,
  isLogin(type) {   //判断用户是否登录
    if (!type || typeof type != 'number'){
      return app.isLoginFun(this);
    }
    app.isLoginFun(this, type);//判断用户是否登录
  },
  toGetPhonenumAuth() {    //去到手机授权页面
    wx.navigateTo({ url: "/pages/getPhoneNumPage/getPhoneNumPage" });
  },
  successGetPhoneCallback(member_grade) {   //获取手机号码获取成后执行的操作
    wx.removeStorageSync('success_getphone');
    if (!app.globalData.share_uid && member_grade < 1) this.getClipboardData('invitcode');    //分享进入的 不检测粘贴板
  },
  getIncomeData(refresh) {   //获取用户信息
    const me = this;
    http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
    .then(res => {
      if (refresh) wx.stopPullDownRefresh();
      me.setData({ userData: res.data || {} });

      let { member_grade, uid } = res.data;
      me.resetProductFun(member_grade);  //会员级别有变动  返现金额变动，重新获取列表数据

      //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
      if (!refresh){
        let _suc = wx.getStorageSync('success_getphone');
        if (_suc) me.successGetPhoneCallback(member_grade);
      }
      this.getMemberInfo(uid);
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();
      wx.showToast({ title: res.msg, icon: 'none' })
    })
  },
  getMemberInfo(uid) {   //小猪版版获取会员信息: 主要作用是判断token是否过期  可能出现小猪过期， cps没有过期的现象
    http.post('getMemberInfo', { userId: uid }, false, this.isLogin)
    .then(res => {
      console.log('小猪版会员信息---', res.data);
    })
    .catch(res => {
      console.log('小猪版会员信息---报错了---', res);
    })
  },
  resetProductFun(member_grade) {   //会员级别有变动  返现金额变动，重新获取列表数据
    let _mem = wx.getStorageSync('member_grade');
    if ((_mem || +_mem === 0) && _mem != member_grade){
      this.setData({ page: 1, proListData: null });
      wx.pageScrollTo({ scrollTop: 0 });    //回到顶部
      this.getProductData();
    }
    wx.setStorageSync('member_grade', member_grade);
  },
  toSearchFun() {   //去到搜索页面
    if (!this.isLogin()) return;   //校验是否登录
    wx.navigateTo({ url: "/subPages/sub-search/search/search" });
  },
  tabChange(e) {   //切换类目tab
    let { index } = e.currentTarget.dataset;

    //当前tab居中显示 48px为tab的宽度(96rpx)
    let _sf = e.currentTarget.offsetLeft - Math.floor(48*(this.data.tabsData.tabs.length/2) / 2);
    this.setData({ 'tabsData.activeTab': index, scrollLeft: _sf, page: 1 });
    this.getProductData('tabs');
  },
  swiperChange(e) {    //轮播图swiper切换时触发
    let { current } = e.detail;
    let { type } = e.currentTarget.dataset;
    if (type == 'activeTab') type = 'tabsData.activeTab';
    this.setData({ [type]: current });
  },
  getTabs() {   //获取类目tabs
    http_cps.get('cats_cps', {})
    .then(res => {
      let _narr = res.data.reduce((arr, current) => {
        arr.push(current.custom_name);
        return arr;
      }, [])
      this.setData({ 'tabsData.tabs': ["精选"].concat(_narr) || ["精选"], catsList: res.data });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  getProductData(cur) {   //获取商品列表数据
    const me = this;
    let { catsList, page, pageSize } = this.data, { activeTab } = this.data.tabsData;
    let params = { page, page_size: pageSize };
    if (activeTab) params.cat_ids = catsList[activeTab-1].id;

    let isloading = cur || page  > 1 ? true : false;
    http_cps.get('goods_search_cps', params, isloading)
    .then(res => {
      let { goods_list } = res.data;
      if (cur == 'refresh') wx.stopPullDownRefresh();
      if (cur == 'tabs' || cur == 'refresh') me.setData({ proListData: null, hasFictitious: 0 });
      
      if (!goods_list || !goods_list.length){
        if (page > 1){   //将页数减1，回到上拉之前的值
          page--;
          me.setData({ page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }else {
          me.setData({ proListData: [], hasFictitious: 0 });
        }
        return;
      }

      let { proListData } = me.data, _fic = 0, filArr = [], newArr = [];
      this.setData({ hasFictitious: 0 });   //开始之前，先初始化虚拟支付数量
      goods_list.forEach((item, index) => {    //过滤虚拟商品  is_show:  0:是虚拟支付商品   1:不是虚拟支付商品
        if (!item.is_show){   //是虚拟支付商品
          _fic++;
        }else 
        filArr.push(item);
      })
      console.log(`当前第【${page}】页，含有----【${_fic}】个虚拟商品`);

      //当前页全部是虚拟支付商品，就重新请求一次，第二次还是全部的虚拟支付商品，就不再请求了
      if (!filArr.length){   
        if (cur != 'fictitious'){
          page++;
          this.setData({ page, hasFictitious: 0 });
          this.getProductData('fictitious');
          return;
        }
        this.setData({ page: 1 });
      }

      newArr = proListData ? proListData.concat(filArr) : [].concat(filArr);
      this.setData({ proListData: newArr, hasFictitious: _fic });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  getBanners() {   //获取banner数据
    http_cps.get('banners_cps', {})
    .then(res => {
      //根据top_switch区分顶部banner和页面内banner:  1:顶部轮播   0:页面中轮播
      let _topBanner = [], _inner = [];
      res.data.forEach((item, index) => {
        item.top_switch == 1 ? _topBanner.push(item) : _inner.push(item);
      })
      this.setData({ bannerList: _topBanner, innerBannerList: _inner });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  getChannelList() {   //获取频道数据
    http_cps.get('channels_cps', {})
    .then(res => {
      this.setData({ channelList: res.data || [] });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  toBannerDetail(e) {   //点击banner 跳转到商品列表页面
    if (!this.isLogin()) return;   //校验是否登录
    let { id, from } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/subPages/sub-search/prolist/prolist?from=${from}&id=${id}` });
  },
  tochannelDetail(e) {   //点击频道 对应的商品列表页面/小程序
    if (!this.isLogin()) return;   //校验是否登录
    let { id, type, from } = e.currentTarget.dataset;
    if (type == 1){
      wx.navigateTo({ url: `/subPages/sub-search/prolist/prolist?from=${from}&id=${id}` });
    }else {
      this.getOtherMiniApps(id);
    }
  },
  getOtherMiniApps(id) {    //获取频道要跳转的对应的小程序信息
    http_cps.get('channel_detail_cps', {}, true, `/${id}`, this.isLogin)
    .then(res => {
      let { app_id, page_path } = res.data;
      wx.navigateToMiniProgram({
        appId: app_id,
        path: page_path,
        fail(err) {
          console.log('小程序跳转失败----', err)
        }
      })
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  toProductDetail(e){   //去到商品详情页面
    if (!this.isLogin()) return;   //校验是否登录
    let { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/productCpsDetail/productCpsDetail?goods_id=${id}` });
  }
  
})
