var common = require('../../utils/common.js');
var publicFun = require('../../utils/public.js');
var wxParse = require('../../wxParse/wxParse.js');
var app = getApp();
var start = new Date(); //用户访问时间
let it_timeout = null;//js截流定时器
let page = 1;//商品分页
let mode_index = -1;//最后一个模板索引
let cur_nav_index = 0;//当前模板选中商品分组索引
function BdmapEncryptToMapabc(bd_lat, bd_lon) {
  var point = new Object();
  var x_pi = 3.14159265358979324 * 3000.0 / 180.0;
  var x = new Number(bd_lon - 0.0065);
  var y = new Number(bd_lat - 0.006);
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  var Mars_lon = z * Math.cos(theta);
  var Mars_lat = z * Math.sin(theta);
  point.lng = Mars_lon;
  point.lat = Mars_lat;
  return point;
}
/**
 * 微页面也要支持活动模块
 */
Page({
  data: {
    scrollTop: {
      scroll_top: 0,
      goTop_show: false
    },
    shoppingData: {
      shoppingShow: false,
      shoppingCatData: '',
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
    },
    searchWrapObj: {},
    currentTab: 0,
    productList: [],
    //自定义设置导航信息数据
    set_para: {
      multiple_num: 4,//默认显示滑块数量
      nav_check_id: 0,//导航选中id
      nav_to_menutop: 500,//初始菜单距离页面顶部距离
      need_fixed: false,//wxcss菜单吸顶
    },
    is_show_nav: false,//是否计算显示导航

    groupWindowsShow: false,
    next_page: true,//商品分组是否还能继续翻页
    load_txt: '',//数据加载过程提示
    mode_tyle: '',//最后有一个展示模板
    make_fiex: false,//商品分组标题吸顶
    // default_index:0,//默认商品分组初次数据索引
    nowGrouperData: {},
    scrollHeights:0,
    playIndex: null,//用于记录当前播放的视频的索引值
  },

  onLoad: function (e) {
    var that = this;
    publicFun.setBarBgColor(app, that);// 设置导航条背景色
    publicFun.height(that);
    var page_id = '';
    var preview = 0;

    if (e.scene != undefined) { // 预览模式
      var scene = decodeURIComponent(e.scene);
      if (scene) {
        page_id = scene.split(',')[1];
        preview = 1;
        app.globalData.store_id = scene.split(',')[0];
        app.globalData.share_uid = scene.split(',')[3];
      }
    } else { // 正常模式
      page_id = e.page_id;
      //拉粉注册分享人id  分享来源1商品 2本店推广；
      getApp().globalData.share_uid = e.share_uid || app.globalData.share_uid || '';
      getApp().globalData.shareType = e.shareType || 2;
    }
    if (e.page_type){
      that.setData({
        page_type: e.page_type
      })
    }
    if (page_id){
      that.setData({
        page_id: page_id
      })
    }
    that.setData({
      preview: preview,
      scrollHeights: that.data.scrollHeight - 68,
    })

    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth
        });
      }
    });

    let get_check_id = e.check_id;
    if (get_check_id) {
      // let _url = target.dataset.url;
      let check_id = 'set_para.nav_check_id';
      // let check_url = 'set_para._url';
      this.setData({
        [check_id]: get_check_id,
        // [check_url]: _url
      });
    }


    //是否展示分享图片
    app.shareWidthPic(that);
    that.pageData();
  },
  pageData:function(){
    let that = this;
    common.post('app.php?c=store&a=page&page_id=' + that.data.page_id + '&preview=' + that.data.preview + '&page_type=' + that.data.page_type, '', "shopHomeData", that);
  },
  onReady: function () {
    var that = this;
    let url = '/pages/index/index';
    publicFun.setUrl(url);
    publicFun.height(that);
  },
  onShow: function () {
    var that = this;
    if (this.data.shopHomeData != '') {
      publicFun.setUrl('')
    }

    page=1;    
    app.isLoginFun(that, 1); // 判断用户是否登录

    publicFun.checkAuthorize({
      pageData: this.data.shopHomeData,
      app: app,
      callbackFunc: callbackFunc,
    })
    function callbackFunc() { // 分销商刷新接口
      common.post('app.php?c=store&a=page&page_id=' + that.data.page_id + '&preview=' + that.data.preview, '', "shopHomeData", that);
    }
    //=========================检测登录授权====================================
  },
  onHide: function () {
    clearTimeout(this.data.businessTimeInt)
  },
  shoppingCatNum: function (result) {
    if (result.err_msg == 1) {
      this.setData({
        shoppingCatNum: true,
      })
    }
  },
  addNavCheck: function (e) {
    let target = e.currentTarget;
    let id = target.dataset.id;
    //获取导航对应跳转地址
    let _url = target.dataset.url;
    let check_id = 'set_para.nav_check_id';
    let check_url = 'set_para._url';
    this.setData({
      [check_id]: id,
      [check_url]: _url
    });
    console.log(2, _url)
    wx.navigateTo({
      url: `${_url}&check_id=${id}`,
    })
  },

  //商品导航tab切换
  groupListSwichNav: function (e) {
    var that = this;
    publicFun.productListSwichNav(e, that);
    that.setData({
      toView: 'product'
    });
    let dataset = e.currentTarget.dataset;
    // console.log("eee", e.currentTarget.dataset)
    mode_index = dataset.t_index;//当前点击商品分组所在index模板索引
    let groupId = dataset.groupid;//组件id
    // console.log("groupId+++++++", groupId)
    //是最后一个模板且是商品分组
    // if (mode_index == this.data.last_mode_id){
    cur_nav_index = dataset.curindex;//当前分组导航索引
    page = 0;//重置分页页码
    //重置翻页
    that.setData({
      next_page: true
    });
    wx.showLoading({
      title: '加载中...',
    })
    this.loadGoodsGroup(groupId, mode_index, that);

    // }

  },
  shopHomeData: function (result) {
    var that = this
    if (result.err_code == 0) {
      common.post('app.php?c=cart&a=number', '', "shoppingCatNum", that); //判断购物车数量
      let shopHomeData = result.err_msg
      if (result.err_msg.store.store_id) {
        this.setData({
          newStoreId: result.err_msg.store.store_id
        })
      }
      //publicFun.business(that, that.data.shopHomeData.store.order_notice_time); //订单提醒
      //publicFun.textScroll(that); //公告文字
      let custom_field_list = shopHomeData.custom_field_list;
      const activities_modules = ['presale_module', 'bargain_module', 'tuan_module', 'seckill_module']
      for (var i in custom_field_list) {
        if (custom_field_list[i].field_type == 'rich_text') { //模板富文本转化
          let rich_text = custom_field_list[i].content;
          if (rich_text != '' && rich_text != undefined) {
            rich_text = rich_text.replace(/&nbsp;/g, '\xa0');
            rich_text = wxParse.wxParse('rich_text', 'html', rich_text, that, 5);
          }

          custom_field_list[i].content = rich_text;
        }
        if (custom_field_list[i].field_type == 'image_ad') { //图片广告
          for (var j = 0; j < custom_field_list[i].content.nav_list.length; j++) {
            custom_field_list[i].content.nav_list[j].type = publicFun.getType(custom_field_list[i].content.nav_list[j].url).type;
            custom_field_list[i].content.nav_list[j].url = publicFun.getType(custom_field_list[i].content.nav_list[j].url).url;
            custom_field_list[i].content.max_height = parseInt(custom_field_list[i].content.max_height)
            //获取图片宽高的缓存，以免在onShow生命周期里面,image的bindLoad回调不执行，获取不到图片的真时宽高,导致的变形
            let imageSize = publicFun.getImageSize({
              src: custom_field_list[i].content.nav_list[j].image
            })
            if (imageSize) {
              custom_field_list[i].content.nav_list[j].width = imageSize.w;
              custom_field_list[i].content.nav_list[j].height = imageSize.h;
              if (!custom_field_list[i].content.swiperHeight) {
                custom_field_list[i].content.swiperHeight = 0
              }
              if (custom_field_list[i].content.swiperHeight < imageSize.h) {
                custom_field_list[i].content.swiperHeight = imageSize.h
              }
            }
          }
          custom_field_list[i].content.dpr = app.globalData.dpr;
        }
        if (custom_field_list[i].field_type == 'image_ad2') { //图片广告
          for (let j = 0; j < custom_field_list[i].content.nav_list.length; j++) {
            custom_field_list[i].content.nav_list[j].type = publicFun.getType(custom_field_list[i].content.nav_list[j].url).type;
            custom_field_list[i].content.nav_list[j].url = publicFun.getType(custom_field_list[i].content.nav_list[j].url).url;
            //获取图片宽高的缓存，以免在onShow生命周期里面,image的bindLoad回调不执行，获取不到图片的真时宽高,导致的变形
          }
        }
        if (custom_field_list[i].field_type == 'cube') { //魔方
          for (let j = 0; j < custom_field_list[i].content.length; j++) {
            custom_field_list[i].content[j].type = publicFun.getType(custom_field_list[i].content[j].url).type;
            custom_field_list[i].content[j].url = publicFun.getType(custom_field_list[i].content[j].url).url;
          }
        }
        if (custom_field_list[i].field_type == 'image_nav') { //图片导航
          for (var j = 0; j < custom_field_list[i].content.length; j++) {
            custom_field_list[i].content[j].type = publicFun.getType(custom_field_list[i].content[j].url).type
            custom_field_list[i].content[j].url = publicFun.getType(custom_field_list[i].content[j].url).url;
          }
        }
        if (custom_field_list[i].field_type == 'article') {
          that.data.article_id = i;
          that.setData({
            article_id: i
          })
        }
        if (custom_field_list[i].field_type == 'search') { // 获取搜索框offset.top值
          if (custom_field_list[i].is_top == 1) {
            setTimeout(function () {
              wx.createSelectorQuery().select('.editProductSearchPa').boundingClientRect(function (res) {
                console.log(res)
                if (res) {
                  that.setData({
                    searchWrapTopValue: res.top
                  })
                }
              }).exec();
            }, 100)
          }
        }
        if (custom_field_list[i].field_type == 'goods_group2') {
          //商品分组，每个模块对应的activetab应该区别改变
          let { productList } = that.data
          productList[i] = 0;//初始化每个activeTab为第0个
          that.setData({ productList })
        }

        if (custom_field_list[i].field_type == 'goods_group4') {
          //商品分组，每个模块对应的activetab应该区别改变
          let {
            productList
          } = that.data
          productList[i] = 0; //初始化每个activeTab为第0个
          that.setData({
            productList
          })
          //数组最后一个组件
          if (i == custom_field_list.length - 1) {
            that.setData({ last_index: i })
          } else {
            that.setData({ last_index: -1 })
          }
          //初始nav-bar距菜单顶部距离
          let st = setTimeout(() => {
            var query = wx.createSelectorQuery()
            query.select('.fiex-top-my').boundingClientRect()
            query.exec((res) => {
              if (res[0]) {
                this.setData({
                  menu_top: res[0].top,
                })
              }
              clearTimeout(st);
            })
          }, 500)

        }
        if (custom_field_list[i].field_type === 'cube') {
          //计算魔方的最大相对高度,防止魔方不满4行出现页面空白
          let maxHeight = custom_field_list[i].content.reduce((prev, next) => {
            return next.rowspan * 1 + next.y * 1 > prev ? next.rowspan * 1 + next.y * 1 : prev
          }, 0)
          custom_field_list[i].maxHeight = maxHeight * 750 / 4
        }
        //导航数据
        if (custom_field_list[i].field_type == 'content_nav') {//导航数据
          // let nav_data = JSON.stringify(custom_field_list[i].content);
          // wx.setStorage({
          //   key: 'nav_data',
          //   data: nav_data,
          // })
          //导航

          let data = custom_field_list[i].content;
          console.log("11=>", data);
          let num = data.nav.length;
          const DEFAULT_NUM = 4;//默认显示滑块数量
          num = num <= DEFAULT_NUM ? num : DEFAULT_NUM;
          console.log("11-num=>", num);
          let set_default_num = 'set_para.multiple_num';
          //获取导航对应跳转地址
          var arr_temp = data.nav;
          for (var j in arr_temp) {
            arr_temp[j].url = publicFun.getType(arr_temp[j].url).url;
          }
          // console.log(55, arr_temp)
          data.nav = arr_temp;
          let _url = arr_temp[0].url;
          console.log(77, data)
          console.log(88, custom_field_list[i].content)

          let check_url = 'set_para._url';
          that.setData({
            [set_default_num]: num,
            [check_url]: _url,
            nav_data: data,
            is_show_nav: true

          })
        }
        if (activities_modules.includes(custom_field_list[i].field_type) && custom_field_list[i].activities) {
          for (let activity of custom_field_list[i].activities) {
            let statusClass = "activity-end";//未开始和已结束的class都是这个（灰色）
            let { start_time, end_time } = activity
            start_time = start_time * 1000
            end_time = end_time * 1000
            let currentDate = Date.now()
            if (start_time < currentDate && end_time > currentDate) {
              statusClass = ""
            }
            activity.statusClass = statusClass
          }
        }

      }

      that.data.searchWrapObj.bgcolor = shopHomeData.bgcolor;
      that.setData({
        'shopHomeData': shopHomeData,
        'searchWrapObj': that.data.searchWrapObj,
      });
      publicFun.barTitle(shopHomeData.title || shopHomeData.store.name, that);

    }
  },
  oppenShopping: function (e) { //加入购物车
    var that = this
    publicFun.oppenShopping(e, that);
  },
  plus: function () { //加
    var that = this;
    publicFun.plus(that);
  },
  reduce: function () { //减
    var that = this;
    publicFun.reduce(that);
  },
  shoppingBlur: function (e) { //输入框
    var that = this;
    publicFun.shoppingBlur(e, that)
  },
  shoppingVid: function (e) { //选择商品规格
    var that = this;
    publicFun.shoppingVid(e, that);
  },
  messageInput: function (e) { //留言内容
    var that = this;
    let index = e.target.dataset.index;
    that.data.shoppingData.shoppingCatData.reservation_custom_fields[index].value = e.detail.value;
    this.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  /**
   * 主页活动组件轮播图改变事件监听函数
   * @param e
   */
  onActivitySwiperChange(e) {
    let { current } = e.detail;
    let { t_index } = e.currentTarget.dataset
    this.setData({
      [`shopHomeData.custom_field_list[${t_index}].config.current_indicate_index`]: current
    })
  },
  bindDateChange: function (e) { //选择日期
    var that = this;
    let index = e.target.dataset.index;
    let date = e.detail.value;
    that.data.shoppingData.shoppingCatData.reservation_custom_fields[index].date = date;
    that.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  bindTimeChange: function (e) { //选择时间
    var that = this;
    let index = e.target.dataset.index;
    let time = e.detail.value;
    that.data.shoppingData.shoppingCatData.reservation_custom_fields[index].time = time;
    that.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  payment: function (e) { //下一步,去支付
    var that = this;
    publicFun.payment(that, e)
  },
  goTopFun: function (e) { //回到顶部滚动条
    // var that = this;
    // publicFun.goTopFun(e, that)
    wx.pageScrollTo({
      scrollTop: 0
    })
  },
  closeShopping: function (e) { //关闭提示框遮罩层
    var that = this;
    publicFun.closeShopping(that);
  },
  swichNav: function (e) {
    var that = this;
    publicFun.swichNav(e, that);
  },
  productListSwichNav: function (e) {
    var that = this;
    publicFun.productListSwichNav(e, that);
  },
  wxSearchFn: function (e) {
    var that = this;
    var page = 'page';
    publicFun.wxSearchFn(that, e, page);
  },
  wxSearchInput: function (e) {
    var that = this;
    publicFun.wxSearchInput(that, e)
  },

  collect: function (e) { //收藏动态
    var that = this;
    publicFun.shopcollect(that, e);

  },
  collectShop: function (e) { //收藏店铺
    var that = this;
    publicFun.collectShop(that, e);

  },
  mapData: function (e) {
    var that = this;
    publicFun.mapData(that, e);

  },
  imageLoad: function (e) { //设置图片广告图片宽高
    var that = this
    publicFun.imageLoad(e, that);
  },
  onShareAppMessage: function () {
    let that = this;
    if (that.data.shopHomeData.share_data.title){
      return getApp().shareGetFans(this.data.shopHomeData.share_data.title, ' ', '/pages/index_xiaozhu/page', 2, this.data.shopHomeData.share_data.image, `&page_id=${that.data.page_id}`);
    }else{
      return getApp().shareGetFans(this.data.shopHomeData.store.name, '', '/pages/index_xiaozhu/page', 2, '', `&page_id=${that.data.page_id}`);
    }
    
    // return {
    //     title: this.data.shopHomeData.store.name,
    //     desc: '没有就写这里发现一个好店铺，速度围观',
    //   path: '/pages/index_xiaozhu/page?page_id=' + that.data.page_id  + "&share_uid=" + getApp().globalData.my_uid + "&shareType=2"
    // }
  },
  onPageScroll: function (e) {
    var that = this;
    // 返回顶部
    if (e.scrollTop > 300) {
      that.data.scrollTop.goTopShow = true;
    } else {
      that.data.scrollTop.goTopShow = false;
    }
    // 搜索框置顶处理
    if (e.scrollTop >= that.data.searchWrapTopValue) {
      that.data.searchWrapObj.className = ' fixedTop ';
    } else {
      that.data.searchWrapObj.className = ' '
    }
    that.setData({
      'searchWrapObj': that.data.searchWrapObj,
      'scrollTop': that.data.scrollTop
    })
  },
  formSubmit: function (e) { // 生成下发模板消息所需的formId存于服务器
    var that = this;
    publicFun.formSubmit({
      e: e,
      that: that
    });
  },
  /**
   * 活动结束时候的回调
   * @param options 1:未开始，灰色，3:已结束:灰色,宽度：100rpx
   */
  _onActivityStatusChange: function (options) {
    let { detail: { status, activityId, customFieldIndex } } = options
    let activityIndex = this.data.shopHomeData.custom_field_list[customFieldIndex].activities.findIndex(item => item.pigcms_id == activityId)
    if (status === 1) {
      this.setData({
        [`shopHomeData.custom_field_list[${customFieldIndex}].activities[${activityIndex}].statusClass`]: "activity-unstart"
      })
    } else if (status === 2) {
      this.setData({
        [`shopHomeData.custom_field_list[${customFieldIndex}].activities[${activityIndex}].statusClass`]: ""
      })
    }
    else if (status === 3) {
      this.setData({
        [`shopHomeData.custom_field_list[${customFieldIndex}].activities[${activityIndex}].statusClass`]: "activity-end"
      })
    }
  },
  // 店铺电话
  callTel: function (e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.tel,
      success: function () {
      },
      fail: function () {
        wx.showToast({
          title: '拨号失败！',
          icon: 'fail',
          duration: 2000
        })
      }
    })
  },
  goAdress: function (e) {
    var longitudeInfo = e.currentTarget.dataset.longitude;
    var latitudeInfo = e.currentTarget.dataset.latitude;
    let { lng, lat } = BdmapEncryptToMapabc(latitudeInfo, longitudeInfo);
    wx.getLocation({//获取当前经纬度
      type: 'wgs84', //返回可以用于wx.openLocation的经纬度，官方提示bug: iOS 6.3.30 type 参数不生效，只会返回 wgs84 类型的坐标信息
      success: function (res) {
        wx.openLocation({//​使用微信内置地图查看位置。
          latitude: lat,//要去的纬度-地址
          longitude: lng,//要去的经度-地址
          name: e.currentTarget.dataset.storename,
          address: e.currentTarget.dataset.province + e.currentTarget.dataset.city + e.currentTarget.dataset.area + e.currentTarget.dataset.address
        })
      }
    });
  },
  swiperChange: function (e) {
    let { current } = e.detail
    let { bannerIndex } = e.currentTarget.dataset
    let custom_field_list = this.data.shopHomeData.custom_field_list
    let currentBanner = custom_field_list[bannerIndex]
    currentBanner.content.current_indicator_index = current
    this.setData({
      'shopHomeData.custom_field_list': custom_field_list
    })
  },
  //上拉加载
  onReachBottom() {
    this.loadGoodsGroup();
  },
  //加载商品组件
  loadGoodsGroup(groupId, mode_index, that) {
    // console.log("mode_index", mode_index, mode_index == null, mode_index?'yes':'no')
    that = that ? that : this;
    let store_id = that.data.newStoreId; //店铺id
    let group_list = that.data.shopHomeData.custom_field_list; //所有商品分组
    let page_id = that.data.page_id
    let filed_type = '';
    if (mode_index != null) {
      filed_type = group_list ? group_list[mode_index].field_type : ''; //单击商品分组类型
    } else {
      filed_type = group_list ? group_list[group_list.length - 1].field_type : ''; //最后一个商品分组类型
    }
    let last_file_type = group_list ? group_list[group_list.length - 1].field_type : ''; //最后一个商品分组类型
    let group_id = -1; //商品分组id
    that.setData({
      mode_tyle: group_list[group_list.length - 1].field_type
    })
    if (filed_type != "goods_group4") return; //如果页面最后一个组件或者单击标题不是商品分组，则不请求数据
    let last_mode_id = group_list.length - 1; //最后一个模板索引
    let size = 0; //商品展示类型
    // let default_index = that.data.default_index ? that.data.default_index : 0;//数据分组加载索引
    mode_index = mode_index != null ? mode_index : last_mode_id;
    if (group_list[mode_index].content) {
      let last_group_list = [];
      if (mode_index != null) {
        last_group_list = group_list[mode_index].content; //最后一组商品分组里的分组商品集合
      } else {
        last_group_list = group_list[group_list.length - 1].content; //最后一组商品分组里的分组商品集合
      }
      if (last_group_list.goods_group_list) {
        let list = []
        list = last_group_list.goods_group_list;
        group_id = groupId ? groupId : list[cur_nav_index].group_id; //第一个商品组id;
        // console.log("77777777", last_group_list);
        size = last_group_list.size ? last_group_list.size : 0; //商品展示类型赋值

        //分组数据请求
        if (mode_index == last_mode_id && page >= 1 && size == 5) {
          that.setData({
            mode_tyle: '滑动模式'
          })
          return; //横向滑动模式下不加载
        }
        if (!that.data.next_page) return; //如果不能翻页，则返回
        // console.log("没有更多数据了")
        that.setData({
          load_txt: (size == 5) ? '' : '加载中...', //加载状态提示
          mode_tyle: last_file_type, //最后一组模板类型
          size,
          last_mode_id
        })
        page++;
        //【bug51479】【商品分组3 分页】切换分组，在切换回来，商品展示重复->（阻止切换列表项时同事触发上拉，导致数据还没之前多次请求）
        that.setData({
          next_page: false
        })
        let url = `app.php?c=goods&a=get_goods_by_group&store_id=${store_id}&group_type=${filed_type}&group_id=${group_id}&page=${page}&from=1&page_id=${page_id}`
        common.post(url, '', getGoodsData, '');
        //分页返回数据
        function getGoodsData(result) {
          wx.hideLoading();
          if (result.err_code == 0) {

            let next_page = result.err_msg.next_page ? result.err_msg.next_page : false; //是否可以继续翻页
            let get_data = result.err_msg.product_list ? result.err_msg.product_list : []; //商品数据
            list.forEach((val, index) => {

              if (val.group_id == group_id) {
                if (page == 1) {
                  val.product_list = [];

                }
                if (!val.product_list) {
                  val.product_list = [];
                }
                val.product_list = val.product_list.concat(get_data);
              }
            });
            that.setData({
              'shopHomeData.custom_field_list': group_list, //得到数据
              next_page: next_page //是否翻页
            })
            if (!next_page) {
              that.setData({
                load_txt: (size == 5) ? '' : '没有更多数据了' //加载状态提示
              })
            }

          } else {
            that.setData({
              load_txt: '没有更多数据了' //加载状态提示
            })
          }
        }
      }
    }

  },
  showNewgiftvip() {
    wx.navigateTo({
      url: "/pages/giftMember/giftVip/vip",
    })
  },
  goGroupList: function (e) {
    const {
      fieldid,
      name
    } = e.currentTarget.dataset;
    if (!fieldid) {
      wx.showToast({
        title: '没有获取到更多分组信息',
        icon: 'none'
      })
      return;
    }
    let _data = {};

    wx.navigateTo({
      url: `/pages/CLIST/pages/group/groupList?field_id=${fieldid}&name=${name}`,
    })
  },
  //吸顶菜单
  onPageScroll: function (e) {
    //如果最后一个组件不是goods_group4返回
    let arr_field_list = this.data.shopHomeData ? this.data.shopHomeData.custom_field_list : [];
    arr_field_list[arr_field_list.length - 1].field_type
    if (arr_field_list && arr_field_list[arr_field_list.length - 1].field_type == 'goods_group4') {
      let menu_top = this.data.menu_top;
      let make_fiex = false;
      if (e.scrollTop > menu_top) {
        make_fiex = true;
      } else {
        make_fiex = false;
      }
      this.setData({ make_fiex })
    }
  },
   //商品分组页面跳转
  goGroupList: function(e) {
    // console.log("eeeeeee",e)
    const {
      fieldid,
      name
    } = e.currentTarget.dataset;
    console.log("eeeeeee", fieldid, name);
    if (!fieldid) {
      wx.showToast({
        title: '没有获取到更多分组信息',
        icon: 'none'
      })
      return;
    }
    let _data = {};

    wx.navigateTo({
      url: `/pages/CLIST/pages/group/groupList?field_id=${fieldid}&name=${name}`,
    })
  },
  // /积分商品分组页面跳转
  goGroupListp: function (e) {
    // console.log("eeeeeee",e)
    let that=this
    // if (!app.isLoginFun(that)) {//判断用户是否登录
    //   common.setUserInfoFun(that, app);
    //   return false;
    // }
   // 判断用户是否登录
    const {
      fieldid,
      name
    } = e.currentTarget.dataset;
    console.log("eeeeeee", fieldid, name);
    if (!fieldid) {
      wx.showToast({
        title: '没有获取到更多分组信息',
        icon: 'none'
      })
      return;
    }
    let _data = {};

    wx.navigateTo({
      url: `/pages/POINT/pages/group/groupList?field_id=${fieldid}&name=${name}`,
    })
  },
  // 一键复制
  copyBtn: function(e) {
    var that = this;
    wx.setClipboardData({
      data: that.data.shopHomeData.store.name + ',' + that.data.shopHomeData.store.physical_title,
      success: function(res) {
        wx.getClipboardData({
          success(res) {
            console.log(res.data)
          }
        })
        wx.showToast({
          title: '复制成功',
        });
      }
    });
  },

  //手动拉取登录验证
  userLogin: function() {
    app.isLoginFun(this);
  },
  // 视频暂停
  videoPlay: function (e) {
    publicFun.videoPlay(this, e);
  },

  goDetails:function(e){
    let that=this
    const {
      product_id
    } = e.currentTarget.dataset;
    console.log(e, product_id, "product_idproduct_idproduct_id")
    if (!app.isLoginFun(that)) {//判断用户是否登录
      common.setUserInfoFun(that, app);
      return false;
    }
   
    let url = '/pages/POINT/pages/product/details?product_id=' + product_id 
    wx.navigateTo({
      url: url  
       })
  },
  //商品分组标签跳转
  goGroupListT: function (e) {
    // console.log("eeeeeee",e)
    const {
      groupid,
      name
    } = e.currentTarget.dataset;
    console.log("eeeeeee", groupid, name);
    if (!groupid) {
      wx.showToast({
        title: '没有获取到更多分组信息',
        icon: 'none'
      })
      return;
    }
    let _data = {};

    wx.navigateTo({
      url: `/pages/CLIST/pages/group/groupTips?groupid=${groupid}&name=${name}`,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          console.log(data)
        },
        someEvent: function (data) {
          console.log(data)
        }

      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: 'test' })
      }
    })
  },
})