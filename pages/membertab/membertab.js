import publicFun from "../../utils/public"
import common from "../../utils/common"
import http from "../../utils/http"
import http_cps from "../../utils/http_cps"
import giftPage from "../../template/gift-list/gift-list"
import { togetherDialogData, togetherDialogJs } from "../../template/together-dialog/together-dialog"

const app = getApp();
Page({
  data: {
    memberInfos: { 
      memberGrade: 0,
      exclusiveVip: 0,
      requireVip: 10
    },   //0:普通用户  1:普通会员  2:VIP  3/4: 更高级别
    giftListData: [],
    merchantId: "",
    page: 1,
    pageSize: 10,
    shoppingData: {
      shoppingShow: false,
      shoppingCatData: '',
      deliver_date_index:0,
      specList: [{
        'vid': 1
      }, {
        'vid': 1
      }, {
        'vid': 1
      }],
      value: '',
      sku_id: '',
      shoppingNum: 1,
      date: '2016-09-01',
      time: '12:00',
    },
    isLoad: false,

    navList: [{
      name: '礼包商城'
    }, {
      name: '会员权益'
    }],
    navDef: 0,
    left: 0,
    discountList: [{
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/discount1.png',
      name: '蓝月亮洗衣液家庭装',
      oldPrice: '109.9',
      newPrice: '59.9',
      discountPrice: '50'
    }, {
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/discount2.png',
      name: '心相印茶语抽纸',
      oldPrice: '56.9',
      newPrice: '24.9',
      discountPrice: '32'
    }, {
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/discount3.png',
      name: '洁丽雅4条男士内裤',
      oldPrice: '78.8',
      newPrice: '38.8',
      discountPrice: '40'
    }, {
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/discount4.png',
      name: '南极人四件套加厚',
      oldPrice: '59.9',
      newPrice: '34.9',
      discountPrice: '25'
    }, {
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/discount5.png',
      name: '志高三明治早餐机',
      oldPrice: '99.2',
      newPrice: '57.2',
      discountPrice: '42'
    }],
    freeWork: [{
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/m_item1.png',
      name: '免费推广素材'
    }, {
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/m_item2.png',
      name: '专属邀请码'
    }, {
      imgUrl: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/member/m_item3.png',
      name: '海量经验培训'
    }],
    oneRowVipList:[{
      name: '超级权益',
      info: 'VIP专享'
    }, {
      name: '普通会员',
      info: '最高返现奖励'
    }, {
      name: 'VIP会员',
      info: '最高返现奖励'
    }],
    twoRowList: [{
      name: '购物奖励',
      scale: ''
    }],
    scaleList:[{
      name: '购物奖励',
      array: [0,0]
    }, {
      name: '分享赚钱',
      array: [0,0]
    }, {
      name: '推广奖励',
      array: [0,0]
    }],
    deramList: [
      '愿景一：帮助大众无成本创业，让生活更美好',
      '愿景二：帮助消费者买到物美价廉的好商品',
      '愿景三：帮助优质商家将好商品传递给消费者'
    ],
    ...togetherDialogData
  },
  onLoad: function (options) {   //页面加载完成
    publicFun.onLoad(app, this);// 授权
    //获取礼包商品列表
    let { token } = wx.getExtConfigSync();   //获取第三方平台自定义数据
    this.setData({ merchantId: common.store_id ? common.store_id : token });
    this.getGiftList(this);
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    this.isLogin(1);

    //判断手机号码是否需要授权 授权前需要刷新登录态
    let _has_phone = this.data._has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
    if (!_has_phone) app.wxloginMethods()   //新用户手机授权之前先刷新登录态
    
    this.getIncomeData();
    common.post('app.php?c=cart&a=number', '', "shoppingCatNum", this, '', true); //判断购物车数量
    this.setNavSlipeLeft(this.data.navDef)
  },
  onHide: function () {  //监听页面隐藏

  },
  onPullDownRefresh: function () {   // 监听用户下拉动作
    this.setData({ page: 1 });
    this.getGiftList(this, 'refresh')
    this.getIncomeData('refresh');
  },
  onReachBottom() {   //触底上拉加载更多
    if(this.data.navDef > 0) {
      return
    }
    let { giftListData, page, pageSize } = this.data;
    let len = giftListData.length;
    if (len < pageSize || len%pageSize != 0) return;
    page++;
    this.setData({ page });
    this.getGiftList(this)
  },
  onShareAppMessage: function () {  //用户点击右上角分享
    let { nickName } = this.data.memberInfos;
    let title = nickName ? `【${nickName}】` : '';
    return app.shareGetFans(`${title}推荐您享受京东拼多多专属优惠，分享还能赚佣金！`, ' ', `/pages/index/index`, 1, 'cps');
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
  setNavSlipeLeft(index) {
    index = index * 2 + 1
    var num= (50 / this.data.navList.length).toFixed(3)
    var left= index * Number(num) - Number(7.34) + '%'
    this.setData({
      left: left
    })
    console.log('left', left)
  },
  getIncomeData(refresh) {   //获取用户信息
    http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
    .then(res => {
      if (refresh) wx.stopPullDownRefresh();
      let { member_grade, nickname, role_name,  } = res.data;
      res.data.memberGrade = member_grade || 0;
      res.data.roleName = role_name || '';
      res.data.nickName = nickname || '';

      // res.data['memberGrade'] = '2'
      console.log('then的修改后res.data.memberGrade', res.data.memberGrade)
      console.log('then的请求回来的res.data', res.data)
      res.data.exclusiveVip= 0
      res.data.requireVip= 10

      //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
      if (!refresh){
        let _suc = wx.getStorageSync('success_getphone');
        if (_suc) this.successGetPhoneCallback(res.data.member_grade);
      }
      
      this.setData({ memberInfos: res.data, isLoad: true });
      this.getMemberInfo(res.data.uid);
    })
    .catch(res => {
      this.setData({ isLoad: true });
      if (refresh) wx.stopPullDownRefresh();
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  getMemberInfo(uid) {   //小猪版版获取会员信息: 主要作用是判断token是否过期  可能出现小猪过期， cps没有过期的现象
    http.post('getMemberInfo', { userId: uid }, false, this.isLogin)
    .then(res => {
      console.log('小猪版会员信息---', res.data);
      let {exclusiveVip, requireVip,settlementPoints, expirationTime} = res.data
      console.log(exclusiveVip,requireVip)
      this.setData({ 
        "memberInfos.exclusiveVip": exclusiveVip,
        "memberInfos.requireVip": requireVip,
        "memberInfos.settlementPoints": settlementPoints,
        "memberInfos.expirationTime": expirationTime? expirationTime.replace(/-/g, '.'): ''
      });
    })
    .catch(res => {
      console.log('小猪版会员信息---报错了---', res);
    })
  },
  goViprecord() {
    wx.navigateTo({
      url: '/subPages/sub-member/pages/vip-record/vip-record'
    })
  },
  getGiftList(e, refresh) {   // 获取礼品商品列表
    if(this.data.navDef !== 0) return
    giftPage.getGiftListData(e, refresh);
  },
  goDetail(e) {
    let { id } = e.currentTarget.dataset;
    console.log('id', id)
    wx.navigateTo({
      url: '/pages/product/details?product_id=' + id
    })
  },
  
  getMemberRewards(refresh) {   //获取会员权益页面
    let { token } = wx.getExtConfigSync();   //获取第三方平台自定义数据
    http.post('getMemberRewards', { merchantId: common.store_id ? common.store_id : token })
    .then(res => {
      if (!res.data) return;    //普通用户 返回null

      let { shoppingRewards, shareRewards, giftRewards } = res.data;
      shoppingRewards= shoppingRewards && shoppingRewards.length ? shoppingRewards : [0, 0],
      shareRewards= shareRewards && shareRewards.length ? shareRewards : [0, 0],
      giftRewards= giftRewards && giftRewards.length ? giftRewards : [0, 0]
      shoppingRewards.shift()
      shareRewards.shift()
      giftRewards.shift()

      let arr= this.data.scaleList
      arr[0].array= shoppingRewards
      arr[1].array= shareRewards
      arr[2].array= giftRewards
      this.setData({
        scaleList: arr
      })
      console.log(this.data.scaleList)

      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  // 切换tab
  slectNav(e) {
    let that= this
    let { index } = e.target.dataset;
    console.log('点击了', index)
    this.setData({
      navDef: index
    })
    this.setNavSlipeLeft(index)
    switch(index) {
      case 1:
        that.getMemberRewards()
        break
    }
  },
  toRegister(e) {   //跳转到礼包商品页面
    wx.navigateTo({ url: `/subPages/sub-member/pages/gift-store/gift-store?memberGrade=${this.data.memberInfos.memberGrade}` });
  },
  copyCode(e) {   //复制到剪切板
    if (!getApp().isLoginFun(this)) { //判断用户是否登录
      return false;
    }

    let { cope } = e.currentTarget.dataset;
    wx.setClipboardData({
      data: cope,
      success (res) {
        
      }
    })
  },
  // toEquityFun(e) {   //查看会员权益
  //   let { memberGrade, roleName } = this.data.memberInfos;
  //   wx.navigateTo({ url: `/subPages/sub-member/pages/equity/equity?member=${memberGrade}&roleName=${roleName}` });
  // },
  toVipRecord() {
    if (!getApp().isLoginFun(this)) { //判断用户是否登录
      return false;
    }
    wx.navigateTo({ url: `/subPages/sub-member/pages/vip-record/vip-record` });
  },
  toIntegralDetail() {
    if (!getApp().isLoginFun(this)) { //判断用户是否登录
      return false;
    }
    wx.navigateTo({ url: `/subPages/sub-integral/pages/integral-detail/integral-detail` });
  },
  formSubmit: function (e) { // 添加购物车之前 生成下发模板消息所需的formId存于服务器
    publicFun.formSubmit({ e: e, that: this });
  },
  oppenShopping: function (e) {  //加入购物车
    publicFun.oppenShopping(e, this);
  },
  shoppingVid: function (e) { //加入购车弹窗 选择商品规格
    var that = this;
    publicFun.shoppingVid(e, that);
  },
  payment: function (e) { //加入购车弹窗 下一步,去支付
    var that = this;
    publicFun.payment(that, e,"goodsDetail")
  },
  plus: function () { //加入购车弹窗  加
    var that = this;
    publicFun.plus(that);
  },
  reduce: function () { //加入购车弹窗  减
    var that = this;
    publicFun.reduce(that);
  },
  shoppingBlur: function (e) { //加入购车弹窗  输入框
    var that = this;
    publicFun.shoppingBlur(e, that)
  },
  selectDeliverDate: function(e){
    let {index} = e.currentTarget.dataset;
    this.setData({
      "shoppingData.deliver_date_index":index
    })
  },
  messageInput: function (e) { //加入购车弹窗  留言内容
    var that = this;
    let index = e.target.dataset.index;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].value = e.detail.value;
    this.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  closeShopping: function (e) { //加入购物车 关闭提示框遮罩层
    var that = this;
    publicFun.closeShopping(that);
  },
  shoppingCatNum: function (result) {   //获取当前购物车的数量
    this.setData({ shoppingCatNum: result.err_msg == 1 ? true : false });
  }

})
