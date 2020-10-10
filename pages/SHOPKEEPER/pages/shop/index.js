// pages/SHOPKEEPER//pages/shop/index.js
var _url='../../';
var common = require(_url+'../../utils/common.js');
var publicFun = require(_url+'../../utils/public.js');
var app=getApp();
let page = 2;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    _barTitle:'掌柜说',
    screenWidth: 0,
    screenHeight: 0,
    imgwidth: 0,
    imgheight: 0,
    status_type: 'list',//'details=>详情页，list=>列表页'
    show_type: 0,//整屏展示， 一屏2列瀑布流展示=>1、整屏，2、瀑布流
    show_lay:0,//1显示懒加载 0不显示
    moreData:0,
    defaultImg:'../../../../images/no-people.png',//懒加载默认图片
    imgList:[],//存放每个图片是否显示
    imgHight:[],//元素的总高度
    itemHeight:0,//每个列表的高
    no_more:false,//底部的提示信息
    isLoading:false,//上拉到底加载圈
    scrollHeight: 0,
    page:2,
    isChat:false,//是否显示联系客服
    isUpFile: true,//是否显示上传按钮
    nowLikeNum: '',//详情页带过来的点赞数
    isLike: '',//详情页带过来的是否点赞
    isClickLike: '',//详情页带过来的是否点击过点赞事件
    listidx:'',//列表的索引
    topicVal:'',//搜索框的input值
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    app.updateThemeColor().then(function() {
      publicFun.setBarBgColor(app, that);// 设置导航条背景色
      // publicFun.getTabBarFun(that, 'pages/SHOPKEEPER/pages/shop/index');   //设置当前tabar的序号: 自定义tabar
    })
    publicFun.setNavSize(that) // 通过获取系统信息计算导航栏高度
    app.isLoginFun(that, 1);//判断用户是否登录
    // that.shopNameData();
    publicFun.height(that);
    that.configData();
    that.shopData();
    that.getHeight();
    if (that.data.show_lay) {
      that.getRect();
    };
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this;
    if (that.data.isClickLike==1){
      let listidx = that.data.listidx;
      let preNum = 'lists[' + listidx + '].like_num',
        changeLike = 'lists[' + listidx + '].liked';
      that.setData({
        [changeLike]: that.data.isLike,
        [preNum]: that.data.nowLikeNum
      })
    }
    //=========================检测登录授权====================================
    let wx_ticket = wx.getStorageSync('ticket');
    if (wx_ticket) {
      if (this.data.cardData != '') {
        publicFun.setUrl('')
      }

    } else {
      var config_data = publicFun.getCurrentPages();
      app.getUserInfo({
        pageThat: that,
        refreshConfig: config_data,
        callback: '',
      });
    }
    // publicFun.checkAuthorize({ // (此种方式此页无法调用授权)
    //     pageData: this.data.cardData,
    //     app: app,
    //     callbackFunc: '',
    // })
    //=========================检测登录授权====================================
  },

  // 掌柜说数据
  shopData:function(){
    let that = this;
    let url = 'app.php?c=society&a=society_list',
    data={
      page:1,
      pagesize:10,
      keyword: that.data.topicVal,
      order: 'desc'
    };
    common.post(url, data, 'shopFun', that, '', true)
  },
  shopFun:function(res){
    let that = this;
    console.log(res);
    that.setData({
      lists: res.err_msg.list,
      headPhoto: res.err_msg.userinfo.avatar,
      imgList:[]
    });
    if (that.data.show_lay){
      for (let i = 0; i < res.err_msg.list.length; i++) {
        that.data.imgList.push(false);
      }
    }
  },
  // 社区配置
  configData:function(){
    let that = this;
    let url = 'app.php?c=society&a=get_config',
      data = {
        store_id: app.globalData.store_id || common.store_id
      };
    common.post(url, data, function (res) {
      console.log(res);
      that.setData({
        _barTitle: res.err_msg.title,
        show_type: res.err_msg.show_type,
        show_set: res.err_msg
      })
    }, '')
  },
  // 点赞
  clickHeart:function(e){
    console.log(e);
    let id = e.currentTarget.dataset.id;
    let idxs = e.currentTarget.dataset.idxs;
    let that = this;
    let url1 = 'app.php?c=society&a=society_like',//点赞
        url2 = 'app.php?c=society&a=cancle_like',//取消赞
    data={
      society_id: id
    };
    // 点击震动
    // wx.vibrateShort({
    //   success: function () {
    //     console.log('点击震动');
    //   }
    // });
    let changeLike = 'lists[' + idxs + '].liked',
      changeNum = 'lists[' + idxs + '].like_num';
    if (that.data.lists[idxs].liked == 0){
      // liked：0，当前未点赞，调用点赞接口
      common.post(url1, data, function (res) {
        that.setData({
          [changeLike]: 1,
          [changeNum]: res.err_dom.split('').splice(4).join('')
        })
      }, '');
      console.log(that.data.lists);
    }else{
      // liked：1，当前已点赞，调用取消点赞接口
      common.post(url2, data, function (res) {
        that.setData({
          [changeLike]: 0,
          [changeNum]: res.err_dom.split('').splice(4).join('')
        })
      }, '');
      
      console.log(that.data.lists);
    }
  },
  // 头像接口
  shopNameData: function () {
    let that = this;
    let url = 'app.php?c=store&a=index',
      data = {
        store_id: app.globalData.store_id || common.store_id
      };
    common.post(url, data, function (res) {
      console.log(res);
      that.setData({
        headPhoto: res.err_msg
      })
    }, '')
  },
  // 搜索
  // 监听输入框
  wxSearchInput:function(e){
    let that = this;
    that.setData({
      topicVal: e.detail.value
    });
  },
  searchBtn:function(){
    let that = this;
    that.shopData();
    that.setData({
      page: 2
    });
  },
  // 回车
  wxSearchFn:function(){
    let that = this;
    that.shopData();
    that.setData({
      page: 2
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    let that = this;
    //=========================检测登录授权====================================
    wx.getSystemInfo({//获取设备信息
      success: function (res) {
        that.setData({
          imageHeight: res.windowWidth,
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      },
    });
    that.getHeight();
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
   * 页面相关事件处理函数--监听用户下拉动作onPullDownRefresh
   */
  onPullDownRefresh: function () {
    let that = this;
    page = 2;
    // 显示顶部刷新图标  
    wx.showNavigationBarLoading();
    that.shopData();
    that.configData();
    that.getHeight();
    if (that.data.show_lay) {
      that.getRect();
    }

    // 数据请求成功后，关闭刷新
    wx.stopPullDownRefresh({
      success(res) {
        console.log('刷新成功');
      }
    });
    // 隐藏导航栏加载框  
    // wx.hideNavigationBarLoading();
    // 停止下拉动作  
    // wx.stopPullDownRefresh();
  },
  /**
   * 页面上拉触底事件的处理函数onReachBottom
   */
  onReachBottom:function(){
    var that = this;
    that.setData({
      isLoading: true
    })
    let url = 'app.php?c=society&a=society_list&order=desc' + '&pagesize=' + 10 + '&page=' + that.data.page + '&keyword=' + that.data.topicVal;
    that.orderPushData(that.data.page++, that, url);
  },
  // 上拉加载方法(分页)
  orderPushData: function (page, that, url) {
    //订单相关页面下拉加载
    if (page > that.data.total_page) {
      that.setData({
        no_more: true,
        isLoading: false
      });
      return;
    }
    // wx.showToast({
    //   title: "加载中..",
    //   icon: "loading"
    // });
    common.post(url, '', setPushData, '');
    function setPushData(result) {
      //添加数据
      var list = that.data.lists;
      for (var i = 0; i < result.err_msg.list.length; i++) {
        if (that.data.show_lay){
          that.data.imgList.push(false);
        }        
        list.push(result.err_msg.list[i]);
      }
      that.setData({
        lists: list,
        total_page: result.err_msg.total_page
      });
      // wx.hideToast();
      that.getHeight();
      if (that.data.show_lay) {
        setTimeout(function(){
          that.getRect();
        },500);
      }  
    }
  },
  // 跳转到内容详情页
  goDetail: function(e){
    let that = this;
    let society_id = e.currentTarget.dataset.id;
    let listidx = e.currentTarget.dataset.idx;
    that.setData({
      listidx: listidx
    })
    wx.navigateTo({
      url: './detail?society_id=' + society_id,
    })
  },
  // 获取每个列表的高
  getRect:function(){
    let that = this;
    setTimeout(function () {
      var query = wx.createSelectorQuery();
      query.selectAll('.msg-list').boundingClientRect();
      query.exec(function (rect) {
        if (rect[0] === null) return;
        let itemHeight = [],
        imgHight = [];
        for(let i=0;i<rect[0].length;i++){
          itemHeight.push(rect[0][i].height);
          that.init(rect[0][i].height, imgHight, i);
        }      
        
        that.setData({
          itemHeight: itemHeight
        })
      });
    }, 500);
  },
  init: function (itemHeight, imgHight,i){
    let that = this;
    if (imgHight.length==0){
      imgHight.push(itemHeight)
    }else{
      imgHight.push(imgHight[imgHight.length - 1] + itemHeight)
    } 
    if (imgHight[i] >= that.data.winHeight && imgHight[i] <= that.data.winHeight * 2){
      for (let j = 0; j < i+1; j++) {
        that.data.imgList[j] = true;
      }
    } 
    that.setData({
      imgList: that.data.imgList,
      imgHight: imgHight
    });
  },
  // 监听页面滚动(onPageScroll)
  scroll:function(e){
    let that = this;
    if (that.data.show_lay) {
      for (var i = 0; i < that.data.imgHight.length; i++) {
        if (that.data.imgHight[i] < e.detail.scrollTop + that.data.winHeight) {
          if (that.data.imgList[i] === false) {
            that.data.imgList[i] = true;
          }
          that.setData({
            imgList: that.data.imgList
          });
        }
      }
    }    
  },
  // 获取内容元素的高
  getHeight:function(){
    let that = this;
    if (that.data.show_type == 1){
      setTimeout(function () {
        var query = wx.createSelectorQuery();
        query.selectAll('.soft-content').boundingClientRect();
        query.exec(function (rect) {
          if (rect[0] === null) return;
          var marginBM = [];
          for (var i in that.data.lists) {
            marginBM.push(rect[0][i].height / 26)
          }
          that.setData({
            marginBM: marginBM
          });
        });
      }, 500)  
    }    
  },
  // 点击展开显示更多
  showMore:function(e){
    let that = this;
    console.log(that.data.moreData)
    let idxs = e.currentTarget.dataset.idxs;
    let toggleVal = that.data.moreData
    if (that.data.moreData == idxs){
      that.setData({
        moreData: 0
      })
    }else{
      that.setData({
        moreData: idxs
      })
    }
  },
  imageLoad: function (e) {//图片自适应
    var _this = this;
    var _width = e.detail.width,    //获取图片真实宽度
      _height = e.detail.height,
      ratio = _width / _height;   //图片的真实宽高比例
      var viewWidth = _width > 670 ? 670 : 500,           //设置图片显示宽度，
        viewHeight = viewWidth > 670 ? (670 / ratio) : _height;    //计算的高度值   
    this.setData({
      imgwidth: viewWidth,
      imgheight: viewHeight
    })
  },
  onShareAppMessage: function () {
    const product = this.data.show_set;
    return getApp().shareGetFans(product.share_title, ` `, `/pages/SHOPKEEPER/pages/shop/index`, 1, product.share_img)
  },
})