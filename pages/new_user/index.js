// pages/newuser_product/index.js
//新人专享商品列表
var common = require('../../utils/common.js');
var publicFun = require('../../utils/public.js');
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    listpage:1,
    isOver:false,
    base_img_url: 'https://s.404.cn/applet/'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //publicFun.setBarBgColor(app, this); // 设置导航条背景色
    var that = this;
    this.getList(1,1);//获取列表，page,type
  },

  onReady: function() {

  },

  onShow: function() {
    
  },

  onHide: function() {

  },

  onUnload: function() {

  },
  onPullDownRefresh: function() {
    wx.showNavigationBarLoading();
    this.getList(1,1)
    this.setData({
      listpage:1,
      isOver: false
    })
  },
  onReachBottom: function() {
    if (this.data.nextPage==true){
      let listpage = this.data.listpage+1;
      this.getList(listpage,2);
      this.setData({
        listpage,
      })
    }else{
      this.setData({
        isOver :true,
      })
    }
  },
  getList(page,type) {//type=1 下拉刷新 2分页加载
    var that = this;
    let data = {
      keyword: '',
      sort: 0,
      page,
    };
    common.post("app.php?c=goods&a=get_products_by_new_employee", data, callback, "");
    var that = this;
    function callback(result) {
      console.log(result);
      if (result.err_code == 0) {
        let product_list = that.data.product_list||[];
        if(type ==1){
          product_list = result.err_msg.product_list;
        }else{
          product_list = product_list.concat(result.err_msg.product_list);
        }
        that.setData({
          product_list,
          nextPage: result.err_msg.next_page,
          pageCount: result.err_msg.count,
          storeDetails: result.err_msg.store,
          show_type: result.err_msg.show_type
        })
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      } else {
        console.log(result);
      }
    }
  },
  gotoDetails(e){//去商品详情
    console.log(e);
    wx.navigateTo({
      url: '/pages/product/details?product_id=' + e.currentTarget.dataset.id
    })
  },
  goback() {
    wx.navigateBack({ delata: 1 })
  },
})