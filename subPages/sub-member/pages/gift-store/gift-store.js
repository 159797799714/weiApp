import publicFun from "../../../../utils/public"
import common from "../../../../utils/common"
import giftPage from "../../../../template/gift-list/gift-list"

const app = getApp();
Page({
  data: {
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
      memberGrade: ''
    }
  },
  onLoad: function (options) {   //页面加载完成
    // publicFun.setBarBgColor(app, this);// 设置导航条背景色
    let memberGrade= options?options.memberGrade: ''
    console.log('传过来的memberGrade', memberGrade)
    this.setData({memberGrade })
    if(memberGrade > 1) {
      publicFun.barTitle('会员续期', this)
    }
    publicFun.onLoad(app, this);  //授权弹框提前注册
    
    //获取礼包商品列表
    let { token } = wx.getExtConfigSync();   //获取第三方平台自定义数据
    this.setData({ merchantId: app.globalData.store_id ? app.globalData.store_id : token });
    giftPage.getGiftListData(this);
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    this.isLogin(1);
    common.post('app.php?c=cart&a=number', '', "shoppingCatNum", this); //判断购物车数量
  },
  onHide: function () {  //监听页面隐藏

  },
  onPullDownRefresh: function () {   // 监听用户下拉动作
    this.setData({ page: 1 });
    giftPage.getGiftListData(this, 'refresh');
  },
  onReachBottom() {   //触底上拉加载更多
    let { giftListData, page, pageSize } = this.data;
    let len = giftListData.length;
    if (len < pageSize || len%pageSize != 0) return;
    page++;
    this.setData({ page });
    giftPage.getGiftListData(this);
  },
  isLogin(type) {   //判断用户是否登录
    if (!type || typeof type != 'number'){
      return app.isLoginFun(this);
    }
    app.isLoginFun(this, type);//判断用户是否登录
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
  },
  goDetail(e) {
    let { id } = e.currentTarget.dataset;
    console.log('id', id)
    wx.navigateTo({
      url: '/pages/product/details?product_id=' + id
    })
  }

})