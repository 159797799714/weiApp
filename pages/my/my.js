import publicFun from "../../utils/public"
import http_cps from "../../utils/http_cps"
import http from "../../utils/http"
import { togetherDialogData, togetherDialogJs } from "../../template/together-dialog/together-dialog"

const app = getApp();
Page({
  data: {
    userData: null,
    orderRead: {},
    isModialog: false,     //好礼页面-展示查看佣金弹框
    iconData: {
      0: "iconputonghuiyuan",
      1: "iconputonghuiyuan-2",
      2: "iconhuiyuan",
      3: "iconhehuoren",
      4: "iconlianhechuangshiren"
    },
    ...togetherDialogData,
    optionObj: null    //新手/每日任务  缓存对象
  },
  onLoad: function (options) {   //页面加载完成
    publicFun.onLoad(app, this);// 授权
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    this.isLogin(1)  //判断用户是否登录
    //判断手机号码是否需要授权 授权前需要刷新登录态
    let _has_phone = this.data._has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
    if (!_has_phone) app.wxloginMethods()   //新用户手机授权之前先刷新登录态

    this.getIncomeData();
    this.getOrdersReadCount();

    //判断是否展示 好礼页面--2:查看佣金弹框   4:填写邀请码
    let _op = wx.getStorageSync('optionObj');
    _op = _op ? JSON.parse(_op) : null;
    this.setData({ optionObj: _op });
    if (_op && _op.cur && _op.cur == 2) this.setData({ isModialog: true });
  },
  onHide: function () {  //监听页面隐藏
    
  },
  onShareAppMessage: function () {  //用户点击右上角分享
    let { nickname } = this.data.userData;
    let title = nickname ? `【${nickname}】` : '';
    return app.shareGetFans(`${title}推荐您享受京东拼多多专属优惠，分享还能赚佣金！`, ' ', `/pages/index/index`, 1, 'cps');
  },
  onPullDownRefresh: function () {  // 监听用户下拉动作
    this.getIncomeData('refresh');
    this.getOrdersReadCount('refresh');
  },
  ...togetherDialogJs,
  completeFun(type) {    //执行完毕的回调  together-dialog.js中的方法
    if (type == 'register_success'){    //注册成功时回调  重新获取用户最新信息
      this.getIncomeData();
      this.getOrdersReadCount();
      return;
    }
  },
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
    http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
    .then(res => {
      if (refresh) wx.stopPullDownRefresh();

      //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
      if (!refresh){
        let _suc = wx.getStorageSync('success_getphone');
        if (_suc) this.successGetPhoneCallback(res.data.member_grade);
      }
      
      this.setData({ userData: res.data || {} });
      this.getMemberInfo(res.data.uid);
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();
      this.setData({ userData: {} });
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
  getOrdersReadCount(refresh) {   //获取未读订单统计
    http_cps.get('orders_read_count', {})
    .then(res => {
      if (refresh) wx.stopPullDownRefresh();
      this.setData({ orderRead: res.data });
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();
      wx.showToast({ title: res.msg, icon: 'none' })
    })
  },
  copyCode: function (e) {
    let { invitation_code } = this.data.userData;
    if (!invitation_code){
      wx.showToast({ title: "没有邀请码可以复制", icon: "none" })
      return;
    }
    wx.setClipboardData({
      data: invitation_code,
      success(res) {
        wx.getClipboardData({
          success(res) {
            wx.showToast({ title: '复制成功', icon: 'success' });
          }
        })
      }
    })
  },
  toNavigatePage(e) {    //跳转到提现页面
    if (!this.isLogin()) return;   //校验是否登录
    let { url } = e.currentTarget.dataset;
    wx.navigateTo({ url });
  },
  toCashbackPage(e) {    //返利订单列表
    if (!this.isLogin()) return;   //校验是否登录
    let { tab } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/subPages/sub-order/pages/order-list/order-list?activeTab=${tab}` });
  },
  orderListGo: function(e) {   //优选订单列表
    if (!this.isLogin()) return;   //校验是否登录
    let { status } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/user/order/orderList?currentTab=${status}` });
  },
  toolFun(e) {   //填写邀请码
    this.setData({
      'commonModalData.showCommonModa': true,
      'commonModalData.type': 3,
      'commonModalData.invitfocus': true,
      'commonModalData.invitcode': '',
      'commonModalData.invitcodeArr': new Array(6)
    })
  },
  preventTouchMove() {   //阻止默认行为
  },
  babyOnUserFun(e) {   //完成了新手任务： 2:查看购物佣金   4:填写邀请码
    let { option, type } = this.data.optionObj;
    let params =  { 
      option,
      status: 1,    //1:可领取   2:不翻倍完成任务  3:翻倍完成任务
      type    //NEW:新手任务   DAY:每日任务
    }
    http_cps.get('task_do_task_cps', params, true)
    .then(res => {
      this.setData({ isModialog: false });
      wx.removeStorageSync('optionObj');  //清除缓存
    })
    .catch(res => {
      this.setData({ isModialog: false });
      wx.removeStorageSync('optionObj');  //清除缓存
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  // 跳转到地址管理
  editAddress() {
    wx.navigateTo({
      url: '/pages/user/address/index'
    })
  }

})