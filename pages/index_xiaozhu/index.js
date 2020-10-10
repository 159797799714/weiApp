var common = require('../../utils/common.js');
var publicFun = require('../../utils/public.js');
var wxParse = require('../../wxParse/wxParse.js');
var area = require('../../utils/area.js');
var app = getApp();
var canvasFun = require('../../utils/canvas-post.js');
var canvas = require('../../utils/canvas.js');
var start = new Date(); //用户访问时间
let it_timeout = null; //js截流定时器
let page = 1; //商品分页
let mode_index = -1; //最后一个模板索引
let cur_nav_index = 0; //当前模板选中商品分组索引
/**
 * 百度的坐标系转换成腾讯的坐标系
 * @param bd_lat
 * @param bd_lon
 * @returns {Object}
 * @constructor
 */
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
Page({
  data: {
    groupmodalStatus: false,
    isDown: false,
    lafenImgurl: '', //海报图；链接
    ewmImgUrl: "", //二维码地址；
    shopImge: "", //商品地址；
    avaTarUrl: '', //头像本地地址
    commimgUrl: common.Url,
    haibaoCanvas: false, //海报
    lafenWindowsState: false, //拉粉弹窗
    scrollTop: {
      scroll_top: 0,
      goTopShow: false, // 返回顶部
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
    searchWrapObj: {}, // 搜索框相关
    currentTab: 0,
    productList: [],
    winWidth: 0,
    store_id: '',
    physical_id: '',
    callNumber: '',
    //自定义设置导航信息数据
    set_para: {
      multiple_num: 4, //默认显示滑块数量
      nav_check_id: 0, //导航选中id
      nav_to_menutop: 500, //初始菜单距离页面顶部距离
      need_fixed: false, //wxcss菜单吸顶
    },
    is_show_nav: false, //是否计算显示导航
    canvasIds: 'lafenCanvas',
    dialog: {
      dialogHidden: true,
      titleMsg: "海报图保存失败，用户取消或未开启保存到相册权限",
      determineBtnTxt: "去开启"
    },
    groupWindowsShow: false,
    next_page: true, //商品分组是否还能继续翻页
    load_txt: '', //数据加载过程提示
    mode_tyle: '', //最后有一个展示模板
    make_fiex: false, //商品分组标题吸顶
    // default_index:0,//默认商品分组初次数据索引
    nowGrouperData: {},
    groupbuyData: '',
    playformType:'',//平台类型
    code:'',
    isShowContactAni: false,   //是否展示客服伸缩动画
    isFirstAni: true
  },

  onLoad: function(e) {
    var that = this;
    console.log('当前分享者是------', app.globalData.share_uid, '--------商品详情的参数------', e);
    let { room_id, custom_params } = e;
    if (room_id && custom_params){   //从直播间的商品跳转过来的  获取分享者的uid
      let _custom_params = JSON.parse(decodeURIComponent(custom_params));
      let { share_uid } = _custom_params;
      console.log('custom_params-------', _custom_params, '---share_uid---', share_uid);
      app.globalData.share_uid = share_uid;
    }

    if (e.distance) {
      this.setData({
        distance: e.distance
      })
    }
    // console.log('app.globalData.navigateBarBgColor === ', app.globalData.navigateBarBgColor)
    app.updateThemeColor().then(function() {
      publicFun.setBarBgColor(app, that); // 设置导航条背景色
      // publicFun.getTabBarFun(that, 'pages/index/index');   //设置当前tabar的序号: 自定义tabar
    })


    var that = this;
    if (e.store_id != undefined && e.store_id != '') {
      app.globalData.store_id = e.store_id;
    } else if ((e.store_id == undefined || e.store_id == '') && app.globalData.store_id == '') {
      app.globalData.store_id = common.store_id;
    }

    let share_uid = e.share_uid || app.globalData.share_uid || '';
    let shareType = e.shareType || 2;

    if (e.scene != undefined && e.scene != 'wxapp') { // 首页扫码进入判断
      var scene = decodeURIComponent(e.scene);
      console.log("二维码", scene);
      if (scene) {
        var scene_arr = scene.split(',');
        app.globalData.store_id = scene_arr[0];
        var physical_id = scene_arr[1];
        //扫码分享记录
        share_uid = scene_arr[3] || ''; // 分享人uid
        shareType = 2;

        if (physical_id) {
          this.setData({
            physical_id: physical_id
          })
          common.post('app.php?c=lbs&a=switch_substore&type=1', {
            physical_id
          }, function(result) {
            console.log('扫描门店二维码', result);
            if (result.err_code == 0) {
              setTimeout(function() {
                that.setData({
                  'shopHomeData.store.physical_title': result.err_msg.name
                })
              }, 2000)
            }
          }, '');
        };
      };
    }
    //拉粉注册分享人id  分享来源1商品 2本店推广；
    getApp().globalData.share_uid = share_uid || '';
    getApp().globalData.shareType = shareType || 2;
    // console.log("分享人share_uid", share_uid);
    this.setData({
      share_uid,
    })

    //店铺id赋值
    this.setData({
      store_id: app.globalData.store_id
    })

    //判断是否展示客服收缩动画
    if (!app.globalData.showContactAni){
      app.globalData.showContactAni = true;
      this.setData({ isShowContactAni: true, isFirstAni: true });
    }else {
      this.setData({ isShowContactAni: false, isFirstAni: false });
    }

    app.getIphoneNum(this); //获取用户是否需要拉取手机号
    //是否展示分享图片
    app.shareWidthPic(that);

    publicFun.setNavSize(this) // 通过获取系统信息计算导航栏高度
  },
  onPullDownRefresh() {
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    page = 1;
    common.post('app.php?c=store&a=index&store_id=' + app.globalData.store_id, '', "shopHomeData", this);
    //setTimeout(wx.stopPullDownRefresh, 300)
  },
  onReady: function() {
    var that = this;

    publicFun.height(that);
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight,
        });
      }
    });


    clearTimeout(publicFun.timer);
    wx.showLoading({
      title: '加载中',
      mask: true,
    })

    common.post('app.php?c=store&a=index&store_id=' + app.globalData.store_id, '', "shopHomeData", that);


    app.isLoginFun(that, 1); // 判断用户是否登录
    var search = setInterval(function() {
      if (that.data.shopHomeData != undefined) {
        let custom_field_list = that.data.shopHomeData.custom_field_list;
        clearInterval(search)
        for (var i in custom_field_list) {
          if (custom_field_list[i].field_type == 'search') { // 获取搜索框offset.top值
            if (custom_field_list[i].is_top == 1) {
              wx.createSelectorQuery().select('.editProductSearchPa').boundingClientRect(function(res) {
                if (res) {
                  that.data.searchWrapObj.offTop = res.top;
                  that.data.searchWrapObj.bgcolor = that.data.shopHomeData.bgcolor;
                  that.setData({
                    'searchWrapObj': that.data.searchWrapObj,
                  });
                  // console.log(that.data.searchWrapObj)
                }
              }).exec();
            }
          }

        }
      }
    }, 500)
    this.dialog = that.selectComponent("#shareModalw");
    
  },
  onShow: function() {
    //获取用户上次打开小程序距这次的时间差,超过30分钟，重新获取地理位置
    app.getTimeDifference();
    // this.savaCurrentTime();
    //加载首页数据
    var that = this;
    //=========================检测登录授权====================================
    const { wxapp_ticket } = app.globalData;
    let wx_ticket = wxapp_ticket || wx.getStorageSync('ticket');
    if (wx_ticket) {
      if (this.data.shopHomeData != '') {
        publicFun.setUrl('')
      }

    } else {
      var config_data = publicFun.getCurrentPages();
      app.getUserInfo({
        pageThat: that,
        refreshConfig: config_data,
        callback: callbackFunc,
      });
    }

    // publicFun.checkAuthorize({ // (首页无法此种方式调用授权，原因未知)
    //     pageData: this.data.shopHomeData,
    //     app: app,
    //     callbackFunc: callbackFunc,
    // })

    function callbackFunc() { // 分销商刷新接口
      common.post('app.php?c=store&a=index&store_id=' + app.globalData.store_id, '', "shopHomeData", that);
    }
    //=========================检测登录授权====================================

    //用户uid
    this.setData({
      my_uid: getApp().globalData.my_uid
    })
    // 
    // that.getLeaderlistStatus();
    let _unlogin = wx.getStorageSync('unlogin') || getApp().globalData.unlogin;
    if (_unlogin != undefined) {
      if (_unlogin) {
        if (wx.getStorageSync('shopName')) {
          let shopName = wx.getStorageSync('shopName')
          that.setData({
            _unlogin: _unlogin,
            shopName: shopName
          })
        }

      }
    }
  },
  onHide: function() {
    clearTimeout(this.data.businessTimeInt);
    clearInterval(this.data.textScrollInterval);
    clearTimeout(this.noticeTimeout1)
    clearTimeout(this.noticeTimeout2)

    var end = new Date(); //用户离开时间
    var duration = end.getTime() - start.getTime();
    duration = duration / 1000; //单位秒
    const { wxapp_ticket } = app.globalData;
    var wx_ticket = wxapp_ticket || wx.getStorageSync('ticket');
    let that = this;
    wx.request({
      url: common.Url + "wap/visit.php" + '?request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + wx_ticket,
      data: {
        'visit_id': (that.data.shopHomeData ? that.data.shopHomeData.visit_id : 0) || 0,
        'duration': duration
      },
      header: {
        'Content-Type': 'application/json'
      },
      method: "POST"
    });

  },
  addNavCheck: function(e) {
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
  shoppingCatNum: function(result) {
    if (result.err_msg == 1) {
      this.setData({
        shoppingCatNum: true,
      })
    }
  },
  shopHomeData: function(result) {
    // console.log('首页数据',result)    
    var that = this;
    if (result.err_code == 20000 || result.err_code == 10000) {
      that.onShow();
    }
    if (result.err_code == 0) {
      if (result.err_msg.store.store_id) {
        this.setData({
          newStoreId: result.err_msg.store.store_id
        })
      }
      wx.setStorageSync('orderlisttap', result.err_msg.show_index_img);
      // 后台切换门店
      if (app.globalData.userInfo !== null && app.globalData.switch_store === false && this.data.physical_id === '') {
        let data = {
          physical_id: result.err_msg.store.physical_id
        }
        common.post('app.php?c=lbs&a=switch_substore', data, shopHomeData, '');

        function shopHomeData(result) {
          if (result.err_code == 0) {
            app.globalData.switch_store = true;
            console.log('门店切换成功: ' + data.physical_id)
          }
        }
      }

      common.post('app.php?c=cart&a=number', '', "shoppingCatNum", that); //判断购物车数量
      // this.setData({
      //   shopHomeData: result.err_msg,
      // })
      let shopHomeData = result.err_msg;
      //获取当前门店数量
      let store_count = result.err_msg.store.physical_count;
      try {
        wx.setStorageSync('store_count', store_count)
      } catch (e) {}

      let custom_field_list = shopHomeData.custom_field_list;
      that.setData({
        last_mode_id: custom_field_list.length - 1
      })
      // last_mode_id: i//最后一个模板id
      // console.log("***", custom_field_list.length)
      const activities_modules = ['presale_module', 'bargain_module', 'tuan_module', 'seckill_module']
      for (var i in custom_field_list) {
        if (custom_field_list[i].field_type == 'rich_text') { //模板富文本转化
          let rich_text = custom_field_list[i].content;
          if (rich_text != '' && rich_text != undefined) {
            rich_text = wxParse.wxParse(`shopHomeData.custom_field_list[${i}].content`, 'html', rich_text, that, 5);
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
        if (custom_field_list[i].field_type == 'goods_group2') {
          //商品分组，每个模块对应的activetab应该区别改变
          let {
            productList
          } = that.data
          productList[i] = 0; //初始化每个activeTab为第0个
          that.setData({
            productList
          })
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
            that.setData({
              last_index: i
            })
          } else {
            that.setData({
              last_index: -1
            })
          }
          //初始nav-bar距菜单顶部距离
          let st = setTimeout(() => {
            var query = wx.createSelectorQuery()
            query.select('.fiex-top-my').boundingClientRect()
            query.exec((res) => {
              if (res[0]) {
                // console.log('restop=========', res[0].top)
                this.setData({
                  menu_top: res[0].top,
                })
              }
              clearTimeout(st);
            })
          }, 500)

          // console.log("****", custom_field_list[i].content)
        }

        if (custom_field_list[i].field_type === 'cube') {
          //计算魔方的最大相对高度,防止魔方不满4行出现页面空白
          let maxHeight = custom_field_list[i].content.reduce((prev, next) => {
            return next.rowspan * 1 + next.y * 1 > prev ? next.rowspan * 1 + next.y * 1 : prev
          }, 0)
          custom_field_list[i].maxHeight = maxHeight * 750 / 4
        }
        //导航数据
        if (custom_field_list[i].field_type == 'content_nav') { //导航数据
          // let nav_data = JSON.stringify(custom_field_list[i].content);
          // wx.setStorage({
          //   key: 'nav_data',
          //   data: nav_data,
          // })
          //导航

          let data = custom_field_list[i].content;
          console.log("11=>", data);
          let num = data.nav.length;
          const DEFAULT_NUM = 4; //默认显示滑块数量
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
        // 活动组件，标记活动状态
        if (activities_modules.includes(custom_field_list[i].field_type) && custom_field_list[i].activities) {
          for (let activity of custom_field_list[i].activities) {
            let statusClass = "activity-end"; //未开始和已结束的class都是这个（灰色）
            let {
              start_time,
              end_time
            } = activity
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

      let {
        open_index_show,
        live_code_title,
        live_code_description,
        live_code_logo
      } = shopHomeData.store
      let live_code_config = {
        open_index_show,
        live_code_title,
        live_code_description,
        live_code_logo
      }
      wx.showLoading({
        title: '加载中',
        mask: true,
      })
      this.setData({
        live_code_config,
        shopHomeData: shopHomeData
      })
      publicFun.barTitle(that.data.shopHomeData.title || that.data.shopHomeData.store.name, that);

      if (that.data.shopHomeData.store.physical_title == '') {
        var url = 'app.php?c=lbs&a=switch_substore'

        var location = {
          "location": wx.getStorageSync("latitude") + "," + wx.getStorageSync("longitude")
        };
        common.post(url, location, 'getStoreCB', that)
      }else{
        //【ID1001217】用户登录后，更新门店信息
        var _url ='app.php?c=lbs&a=set_physical'
        common.post(_url, {}, 'upDataStore', that)
      }
      
      //若当前店铺已打烊，则跳向切换门店页面
      const { wxapp_ticket } = app.globalData;
      let wx_ticket = wxapp_ticket || wx.getStorageSync('ticket');
      if (that.data.shopHomeData.closing != undefined && that.data.shopHomeData.closing == '已打烊' && wx_ticket != '') {
        publicFun.text({
          title: '打烊提示',
          content: '当前店铺已打烊，点击跳转切换门店',
          footer: '知道了'
        }, that)
      }

      publicFun.storeNotice(that, null, shopHomeData.store.order_notice_open, shopHomeData.store.order_notice_time)


      this.setData({
        lafenWindowsState: false,
      })
      //首页团购展示

      wx.setStorageSync('comman', that.data.shopHomeData.show_head_type * 1);
      if (that.data.shopHomeData.show_head_type * 1 == 1) {
        let groupbuyUrl = "app.php?c=store&a=get_lead_config";
        common.post(groupbuyUrl, '', "showGroupbuy", that);
      }
      //首页分享弹窗开启；
      if (shopHomeData.open_dialog && shopHomeData.open_dialog == 1) { //弹
        let url = "app.php?c=goods&a=sharing_guidance";
        let sdata = {
          store_id: shopHomeData.store.store_id,
          share_uid: this.data.share_uid,
          pop_type: 1
        };
        common.post(url, sdata, "showWindows", that);
      } else { //不弹
        this.setData({
          lafenWindowsState: false,
        })
      }
    };
    wx.stopPullDownRefresh();
    that.getLeaderlistStatus();
    wx.hideLoading();
  },
  // 获取位置
  getLocation: function() {
    var that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function(res) {
        console.log("经纬度===", res)
        let url = 'app.php?c=store&a=get_adress'
        let data = {
          lat: res.latitude,
          lng: res.longitude,
        }
        common.post(url, data,"getLocationFun",that)
      },
      fail: function(res) {
        publicFun.warning('定位失败，请稍后重试', that);
      }
    })
  },
  getLocationFun(res) {
    console.log('转义位置', res);
    let that=this;
    if (res.err_code == 0) {
      that.setData({
        positionName: res.err_msg
      });
    }
  },


  //获取团长信息及其是否有团长
  getLeaderlistStatus() {
    let that = this;
    let leader_id = wx.getStorageSync('leader_id');
    let url = 'app.php?c=store&a=get_leader_info',
      params = {
        lat: '',
        lng: '',
        leader_id: leader_id
      };
    common.post(url, params,"getLeaderDataFun", that)
  },
  getLeaderDataFun(res) {
    let that=this;
    wx.setStorageSync("open_community_group", res.err_msg.open_community_group)
    if (res.err_code == 0 && res.err_msg.open_community_group == 1) {
  
      console.log('团长列表', res)
      that.setData({
        playformType: res.err_msg.open_community_group
      })
      if (res.err_msg.status == 1 && res.err_msg.leader_list.length <= 0 && !res.err_msg.now_leader) { //如果我是在申请团长中审核未通过，没有当前团长也没有团长列表
        wx.navigateTo({
          url: '/pages/groupbuying/applyform/applystatus'
        })
        return;
      }
      if (res.err_msg.status != 1 && (!res.err_msg.now_leader || res.err_msg.now_leader.length == 0)) { //我没有选择团长的情况去团长选择页面
        wx.navigateTo({
          url: '/pages/SHOPGOODS/pages/groupbuying/community'
        })
        return
      }
      if (res.err_msg.buy_list.length > 5) {
        res.err_msg.buy_list = res.err_msg.community_user.slice(0, 5);
      }
      wx.setStorageSync('physical_id', res.err_msg.now_leader.physical_id);
      that.setData({
        "nowGrouperData.leader": res.err_msg.now_leader,
        "nowGrouperData.buy_list": res.err_msg.buy_list,
        // playformType: res.err_msg.open_community_group
      })

    }
  },
  //获取当前团长信息
  getNowleader() {
    let physical_id = wx.getStorageSync('physical_id');
    let url = 'app.php?c=store&a=get_current_community_info',
      params = {
        physical_id: physical_id,
        limit: 5,
        page: 1
      };
    common.post(url, params, function(res) {
      if (res.err_code == 0) {
        console.log('当前团长', res)
        if (result.err_msg.community_user.length > 5) {
          result.err_msg.community_user = result.err_msg.community_user.slice(0, 5);
        }
        that.setData({
          nowGrouperData: res.err_msg
        })
      }
    }, '')
  },
  showGroupbuy: function(res) {
    console.log('团购展示信息', res)
    if (res.err_code == 0) {
      this.setData({
        groupbuyData: res.err_msg
      })
      if (res.err_msg.community_first_show == 1) {
        this.setData({
          groupWindowsShow: true,
          groupbuyData: res.err_msg
        })
      }

    }
  },
  showWindows: function(res) { //弹窗数据
    console.log(this);
    if (res.err_code == 0) {
      let userImages = res.err_msg.logo;
      if (userImages.indexOf('http') > -1) {
        userImages = userImages
      } else {
        userImages = this.data.commimgUrl + 'upload/' + userImages;
      }

      this.setData({ //弹窗数据
        userImages, //弹窗头像
        windowsData: res.err_msg,
        lafenWindowsState: true //开启拉粉弹窗
      })


    }
  },
  hideTexBox: function() { // 关闭文本弹窗
    let that=this
    publicFun.hideTexBox(this);
    console.log(that.data.playformType,"that.data.get_leader_infothat.data.get_leader_info")
    if (that.data.playformType==1){
      wx.navigateTo({
        url: '/pages/SHOPGOODS/pages/groupbuying/community',
      })
    }else{
      wx.navigateTo({
        url: '/pages/SHOPGOODS/pages/index/shopHomeList',
      })
    }
   
  },


  getStoreCB: function(res) {
    var that = this
    if (res.err_msg != undefined) {
      that.data.shopHomeData.store.physical_title = res.err_msg.name
      that.data.shopHomeData.store.physical_id = res.err_msg.pigcms_id
      that.setData({
        'shopHomeData': that.data.shopHomeData,
      });
    }
  },
  oppenShopping: function(e) { //加入购物车
    var that = this
    publicFun.oppenShopping(e, that);
  },
  addImg: function(e) { //图片上传
    var that = this;
    let index = e.target.dataset.index;
    publicFun.addImgMessage(that, index);
  },
  plus: function() { //加
    var that = this;
    publicFun.plus(that);
  },
  reduce: function() { //减
    var that = this;
    publicFun.reduce(that);
  },
  shoppingBlur: function(e) { //输入框
    var that = this;
    publicFun.shoppingBlur(e, that)
  },
  shoppingVid: function(e) { //选择商品规格
    var that = this;
    publicFun.shoppingVid(e, that);
  },
  messageInput: function(e) { //留言内容
    var that = this;
    let index = e.target.dataset.index;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].value = e.detail.value;
    this.setData({
      'shoppingData': that.data.shoppingData
    })
  },

  /**
   * 主页活动组件轮播图改变事件监听函数
   * @param e
   */
  onActivitySwiperChange(e) {
    let {
      current
    } = e.detail;
    let {
      t_index
    } = e.currentTarget.dataset
    this.setData({
      [`shopHomeData.custom_field_list[${t_index}].config.current_indicate_index`]: current
    })
  },
  bindDateChange: function(e) { //选择日期
    var that = this;
    let index = e.target.dataset.index;
    let date = e.detail.value;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].date = date;
    that.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  bindTimeChange: function(e) { //选择时间
    var that = this;
    let index = e.target.dataset.index;
    let time = e.detail.value;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].time = time;
    that.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  payment: function(e) { //下一步,去支付
    var that = this;
    publicFun.payment(that, e)
  },
  goTopFun: function(e) { //回到顶部滚动条
    // var that = this;
    // publicFun.goTopFun(e, that)
    wx.pageScrollTo({
      scrollTop: 0
    })
  },
  closeShopping: function(e) { //关闭提示框遮罩层
    var that = this;
    publicFun.closeShopping(that);
  },
  swichNav: function(e) {
    var that = this;
    publicFun.swichNav(e, that);
  },
  productListSwichNav: function(e) {
    var that = this;
    publicFun.productListSwichNav(e, that);
    that.setData({
      toView: 'product'
    });
  },
  //商品导航tab切换
  groupListSwichNav: function(e) {
    var that = this;
    publicFun.productListSwichNav(e, that);
    that.setData({
      toView: 'product'
    });
    let dataset = e.currentTarget.dataset;
    // console.log("eee", e.currentTarget.dataset)
    mode_index = dataset.t_index; //当前点击商品分组所在index模板索引
    let groupId = dataset.groupid; //组件id
    // console.log("groupId+++++++", groupId)
    //是最后一个模板且是商品分组
    // if (mode_index == this.data.last_mode_id){
    cur_nav_index = dataset.curindex; //当前分组导航索引
    page = 0; //重置分页页码
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
  wxSearchFn: function(e) {
    var that = this;
    var page = 'page';
    publicFun.wxSearchFn(that, e, page);
  },
  wxSearchInput: function(e) {
    var that = this;
    publicFun.wxSearchInput(that, e)
  },

  collect: function(e) { //收藏动态
    var that = this;
    publicFun.shopcollect(that, e);

  },
  collectShop: function(e) { //收藏店铺
    var that = this;
    publicFun.collectShop(that, e);

  },
  mapData: function(e) {
    var that = this;
    publicFun.mapData(that, e);

  },
  imageLoad: function(e) { //设置图片广告图片宽高
    var that = this
    publicFun.imageLoad(e, that);
  },
  onShareAppMessage: function(e) {
    var that = this;
    if (e.target && e.target.dataset.leader_id){
      let leader_id = e.target.dataset.leader_id;
      wx.setStorageSync('leader_id', leader_id);
    }
    this.setData({
      haibaoCanvas: false,
      showSearch: false
    })
    var my_uid = this.data.my_uid;
    console.log("分享我的uid-----------", my_uid);
    return getApp().shareGetFans(that.data.groupbuyData.share_title, '', '/pages/index/index', 2);
    // return {
    //   title: this.data.shopHomeData.store.name,
    //   desc: '这里发现一个好店铺，速度围观，点击进入',
    //   path: '/pages/index/index?store_id=' + getApp().globalData.store_id + "&share_uid=" + getApp().globalData.my_uid+"&shareType=2"
    // }
  },
  onPageScroll: function(e) {
    var that = this;

    // 返回顶部
    if (e.scrollTop > 500) {
      that.data.scrollTop.goTopShow = true;
    } else {
      that.data.scrollTop.goTopShow = false;
    }

    // 搜索框置顶
    if (e.scrollTop > that.data.searchWrapObj.offTop) {
      that.data.searchWrapObj.className = 'fixedTop';
    } else {
      that.data.searchWrapObj.className = '';
    }
    // console.log('e.scrollTop ===== ', e.scrollTop)
    // console.log('that.data.searchWrapObj.offTop ======== ', that.data.searchWrapObj.offTop)

    that.setData({
      'searchWrapObj': that.data.searchWrapObj,
      'scrollTop': that.data.scrollTop
    })
    // console.log(that.data.searchWrapObj)

    // 导航
    if (!this.data.is_show_nav) return;
    if (this.data.nav_data.line != 1) return;
    if (it_timeout) {
      clearTimeout(it_timeout);
    }

    it_timeout = setTimeout(() => {
      let nav_to_menutop = this.data.set_para.nav_to_menutop;
      let page_scroll = e.scrollTop;
      let need_fixed = 'set_para.need_fixed';
      if ((page_scroll - nav_to_menutop) < 0) {

        this.setData({
          [need_fixed]: false
        })
        return;
      } else {
        this.setData({
          [need_fixed]: true
        })
        // console.log(`distance:${page_scroll - nav_to_menutop}`)
      }
    }, 10)
  },
  formSubmit: function(e) { // 生成下发模板消息所需的formId存于服务器
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
  _onActivityStatusChange: function(options) {
    let {
      detail: {
        status,
        activityId,
        customFieldIndex
      }
    } = options
    let activityIndex = this.data.shopHomeData.custom_field_list[customFieldIndex].activities.findIndex(item => item.pigcms_id == activityId)
    let statusClasses = ['activity-unstart', '', 'activity-end']
    let keyName = `shopHomeData.custom_field_list[${customFieldIndex}].activities[${activityIndex}].statusClass`
    this.setData({
      [keyName]: statusClasses[status - 1]
    })
  },
  // 店铺电话
  callTel: function(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.tel,
      success: function() {},
      fail: function() {
        wx.showToast({
          title: '拨号失败！',
          icon: 'none',
          duration: 2000
        });
      }
    })
  },
  goAdress: function(e) {
    var longitudeInfo = e.currentTarget.dataset.longitude;
    var latitudeInfo = e.currentTarget.dataset.latitude;
    let {
      lng,
      lat
    } = BdmapEncryptToMapabc(latitudeInfo, longitudeInfo);
    wx.getLocation({ //获取当前经纬度
      type: 'wgs84', //返回可以用于wx.openLocation的经纬度，官方提示bug: iOS 6.3.30 type 参数不生效，只会返回 wgs84 类型的坐标信息
      success: function(res) {
        wx.openLocation({ //​使用微信内置地图查看位置。
          latitude: lat, //要去的纬度-地址
          longitude: lng, //要去的经度-地址
          name: e.currentTarget.dataset.storename,
          address: e.currentTarget.dataset.province + e.currentTarget.dataset.city + e.currentTarget.dataset.area + e.currentTarget.dataset.address
        })
      }
    });
  },
  officialAccountError(error) {
    console.log('关注公众号组件加载失败，具体原因：' + error.detail.errMsg);
    console.log({
      error
    });
    this.setData({
      applet_guide_subscribe: false
    })
  },
  swiperChange: function(e) {
    let {
      current
    } = e.detail
    let {
      bannerIndex
    } = e.currentTarget.dataset
    this.setData({
      [`shopHomeData.custom_field_list[${bannerIndex}].content.current_indicator_index`]: current
    })
  },
  //关闭拉粉弹窗
  closeLafenWindows() {
    this.setData({
      lafenWindowsState: false,
      showSearch: false
    })
  },
  //展示分享界面
  showShareOperation() {
    this.setData({
      lafenWindowsState: false,
      showOpertaion: true
    })
  },
  //询问保存
  saveHaobao() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  // 海报生成
  showCanvasWind(e) {
    console.log(e);
    this.setData({
      showSearch: false
    })
    setTimeout(() => {
      wx.showLoading({
        title: '海报生成中...',
      })
    }, 1000)
    var that = this;
    let data = {
      store_id: getApp().globalData.store_id,
      leader_id: e.currentTarget.dataset.leader_id
    }
    //获取海报详情
    if (that.data.playformType == 0){
      common.post("app.php?c=ucenter&a=get_share_info", data, callBack, "");
    }else{
      common.post("app.php?c=community_leader&a=get_share_info", data, callBack, "");
    }   

    function callBack(res) {
      console.log(res);
      if (res.err_code == 0) {
        that.setData({
          haibaoData: res.err_msg
        })
        that.getEwmCode();
      } else {
        console.log(res);
      }
    }

    // this.setData({
    //   haibaoCanvas: true
    // })
  },
  save: function(o) {
    let that = this;
    canvas.canvasToTempFilePath(o).then(function(res) {
      wx.hideLoading();
      o.imgSrc = res.tempFilePath;
      that.setData({
        canvasImg: res.tempFilePath,
        canvasImgState: true,
      })
      canvas.saveImageToPhotosAlbum(o).then(function(res) {
        wx.showModal({
          title: '存图成功',
          content: '图片成功保存到相册了，去发圈噻~',
          showCancel: false,
          confirmText: '好哒',
          confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
          success: function(res) {
            if (res.confirm) {
              console.log('用户点击确定');
              wx.previewImage({
                urls: [o.imgSrc],
                current: o.imgSrc
              })
            }
          }
        })
      }, function(err) {
        console.log('错误', err);
        wx.hideLoading();
        // that.setData({ 'dialog.dialogHidden': false })
        that.setData({
          showOpertaion: false
        })
      });
    }, function(err) {
      console.log(err);
    });
  },
  getEwmCode() { //获取二维码 
    var that = this;
    let data = {
      path: "pages/index/index",
      id: this.data.physical_id,
      uid: getApp().globalData.my_uid,
      share_uid: getApp().globalData.my_uid,
      shareType: 2
    }
    const { wxapp_ticket } = app.globalData;
    let ticket = wxapp_ticket || wx.getStorageSync('ticket');
    wx.request({
      url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
      header: {
        'Content-Type': 'application/json'
      },
      data: data,
      method: "POST",
      success: function(res) {
        console.log('获取二维码成功', res);
        if (res.err_msg == "失败") {
          wx.hideLoading();
          that.setData({
            lafenWindowsState: false
          })
          return false
        }
        //异步下载图片资源
        let ewmImgUrlDownLoad = '';
        let avaTarUrlDownLoad = '';
        let shopImgeDownLoad = '';
        ewmImgUrlDownLoad = new Promise((resolve, reject) => { //下载二维码
          let url = res.data.err_msg
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log(res);
                that.setData({
                  ewmImgUrl: res.tempFilePath
                })
                resolve();
              }
            },
            fail: res => {
              console.log("下载失败", url);
              wx.hideLoading();
              reject();
            }
          })
        })

        avaTarUrlDownLoad = new Promise((resolve, reject) => { //下载头像
          let url = that.data.haibaoData.avatar;
          if (url.indexOf("https") == -1) {
            url = that.data.commimgUrl + "upload/" + url;
          }
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log(res);
                that.setData({
                  avaTarUrl: res.tempFilePath
                })
                resolve();
              }
            },
            fail: res => {
              console.log("下载失败", url);
              wx.hideLoading();
              reject();
            }
          })
        })

        shopImgeDownLoad = new Promise((resolve, reject) => { //下载商品
          let url = that.data.haibaoData.image;
          console.log(url);
          if (url.indexOf("https") == -1) {
            url = that.data.commimgUrl + "upload/" + url;
          }
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log(res);
                that.setData({
                  shopImge: res.tempFilePath
                })
                resolve();
              }
            },
            fail: res => {
              console.log("下载失败", url);
              wx.hideLoading();
              reject();
            }
          })
        })

        let qCodeStatus = Promise.all([ewmImgUrlDownLoad, avaTarUrlDownLoad, shopImgeDownLoad]);
        qCodeStatus.then(() => {
          that.makeCanvas();
          setTimeout(function() {
            let w = that.data.canvasWidth;
            let h = that.data.canvasHeight;
            that.save({
              id: that.data.canvasIds,
              w: w,
              h: h,
              targetW: w * 4,
              targetH: h * 4
            });
          }, 300)
        }).catch((error) => {
          console.log(error);
          wx.hideLoading();
          wx.showModal({
            title: '提示信息',
            content: "海报生成失败，请重试...",
            confirmText: '知道了',
            showCancel: false,
            confirmColor: '#fe6b31',
            success: (result) => {
              wx.hideLoading();
              that.setData({
                haibaoCanvas: false,
              })
            }
          })
        })
      },
      fail: function(res) {
        console.log('获取二维码fail', res);
        wx.hideLoading();
        wx.showModal({
          title: '提示信息',
          content: "海报生成失败，请重试...",
          confirmText: '知道了',
          showCancel: false,
          confirmColor: '#fe6b31',
          success: (result) => {
            that.setData({
              haibaoCanvas: false,
            })
          }
        })
      }
    })
  },
  draw2(ctx, x, y, width, height, radius, color, type) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x, y);
    ctx[type + 'Style'] = color || params.color;
    ctx.closePath();
    ctx[type]();
  },
  drawcommon(ctx, x, y, width, height, radius, color, type, num) {
    let radiusBottom = radius;
    let radiusTop = radius;
    ctx.beginPath();
    if (num == 2) {
      radiusBottom = 0;
    }
    ctx.moveTo(x, y + radiusBottom);
    ctx.lineTo(x, y + height - radiusBottom);
    ctx.quadraticCurveTo(x, y + height, x + radiusBottom, y + height);
    ctx.lineTo(x + width - radiusBottom, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radiusBottom);
    if (num == 1) {
      radiusTop = 0;
    }
    ctx.lineTo(x + width, y + radiusTop);
    ctx.quadraticCurveTo(x + width, y, x + width - radiusTop, y);
    ctx.lineTo(x + radiusTop, y);
    ctx.quadraticCurveTo(x, y, x, y + radiusTop);
    ctx[type + 'Style'] = color || params.color;
    ctx.closePath();
    ctx[type]();
  },
  makeCanvas() {
    let that = this;
    let haibaoData = this.data.haibaoData;
    let title = haibaoData.nickname;
    // if (haibaoData.is_member == 0){
    //   title = "邀请" + haibaoData.num + "粉享" + haibaoData.degree_name;
    // }
    let name = haibaoData.name;
    let original_price = haibaoData.original_price ? haibaoData.original_price : 0;
    let price = haibaoData.price;
    let ratio_money = haibaoData.ratio_money; //赚多少；
    //canva绘制背景图要用本地图片
    let lafenBg = '/images/lafenbg.png';
    let canvasWidth = this.data.winWidth;
    let bili = canvasWidth / 635;
    let canvasHeight = 1100 * bili;
    this.setData({
      canvasWidth,
      canvasHeight
    })
    const context = wx.createCanvasContext('lafenCanvas');
    context.clearRect(0, 0, 635 * bili, 1100 * bili);
    //绘制背景
    context.drawImage(lafenBg, 0, 0, 635 * bili, 1100 * bili);

    context.save();

    context.beginPath();
    //先画个圆，前两个参数确定了圆心 （x,y） 坐标  第三个参数是圆的半径  四参数是绘图方向  默认是false，即顺时针
    context.arc(85 * bili, 100 * bili, 45 * bili, 0, Math.PI * 2, false);
    context.clip(); //画好了圆 剪切  原始画布中剪切任意形状和尺寸。
    context.drawImage(this.data.avaTarUrl, 40 * bili, 55 * bili, 90 * bili, 90 * bili);
    context.restore();
    context.closePath();
    context.save();
    // 谈话框
    // that.draw2(context, 140 * bili, 100 * bili, 460 * bili, 72 * bili, 36 * bili, "white", "fill");
    // 设置文字颜色
    context.setFontSize(30 * bili);
    context.fillStyle = "#fff";
    //显示标题
    context.fillText(title, 140 * bili, 120 * bili);
    context.setFontSize(28 * bili);
    context.fillStyle = "#000";
    // context.fillText("HI~ 我送你一个新人福利！", 180 * bili, 150 * bili);

    //绘制商品
    that.drawcommon(context, 40 * bili, 200 * bili, 560 * bili, 460 * bili, 8 * bili, "black", "fill", 2);
    context.clip();
    context.drawImage(this.data.shopImge, 40 * bili, 200 * bili, 560 * bili, 460 * bili);
    context.restore();
    context.closePath();
    context.save();
    // 绘制谈话框
    // 绘制文字盒子
    that.drawcommon(context, 40 * bili, 640 * bili, 560 * bili, 200 * bili, 8 * bili, "white", "fill", 1);
    context.save();

    //商品名称
    context.setFontSize(30 * bili);
    context.setFillStyle('#333');
    if (name.length > 16) { //商品名字长度兼容
      let name_a = name.slice(0, 16) + "...";
      // let name_a = name;
      // let name_b = name.slice(9, 17) + "...";
      context.fillText(name_a, 60 * bili, 710 * bili);
    } else {
      context.fillText(name, 60 * bili, 710 * bili);
    }

    //绘制金额；
    context.setFillStyle('#f62049');
    context.fillText("￥", 60 * bili, 770 * bili);
    context.setFontSize(40 * bili);
    context.fillText(price, 84 * bili, 770 * bili);
    if (price.length < 8) { //适配
      // context.drawImage('/images/price.png', (context.measureText(price).width + 160) * bili, 742 * bili, 121 * bili, 30 * bili);
      context.setFillStyle('#ffffff');
      context.setFontSize(18 * bili);
      // context.fillText("赚" + ratio_money, (context.measureText(price).width + 220) * bili, 765 * bili);
      // context.fillText("新人专享价", (context.measureText(price).width + 220) * bili, 765 * bili);
    }
    if (original_price != 0) { //没有划线价不显示；
      //原始金额
      context.setFontSize(24 * bili);
      context.setFillStyle('#e1e1e1');
      context.fillText("￥", 60 * bili, 810 * bili);
      context.fillText(original_price, 90 * bili, 810 * bili);
      //横线
      context.moveTo(60 * bili, 802 * bili);
      context.lineTo(164 * bili, 802 * bili);
      context.lineWidth = 1;
      context.strokeStyle = "#e1e1e1";
      context.stroke();
    }


    context.save();
    context.setFillStyle('#fff');
    context.setFontSize(24 * bili);
    context.fillText("长按扫码购买", 250 * bili, 1060 * bili);
    context.closePath();
    //绘制二维码
    context.moveTo(317 * bili, 948 * bili);
    context.beginPath();
    context.arc(320 * bili, 947 * bili, 68 * bili, 0, Math.PI * 2, false);
    context.clip(); //画好了圆 剪切  原始画布中剪切任意形状和尺寸。
    context.drawImage(this.data.ewmImgUrl, 252 * bili, 880 * bili, 136 * bili, 136 * bili);
    context.restore();
    context.draw({
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      canvasId: 'lafenCanvas',
    }, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          width: this.data.canvasWidth,
          height: this.data.canvasHeight,
          canvasId: 'lafenCanvas',
          fileType: 'png',
          quality: 1.0,
          success: res => {
            let data = res.tempFilePath;
            wx.hideLoading();
          },
          fail: fail => {
            console.log(fail);
            wx.hideLoading();
            wx.showModal({
              title: '提示信息',
              content: "海报生成失败，请重试...",
              confirmText: '知道了',
              showCancel: false,
              confirmColor: '#fe6b31',
              success: (result) => {
                // this.setData({
                //   haibaoCanvas: false
                // })
              }
            })
          }
        })
      }, 1000)
    })
  },
  gotoNewPeople() {
    this.setData({
      lafenWindowsState: false,
    })
    wx.navigateTo({ //去新人列表
      url: '/pages/new_user/index',
    })
  },
  closeCanvas() {
    this.setData({
      showOpertaion: false,
      haibaoCanvas: false,
      showSearch: false
    })
  },
  xFshowWindows() { //点击悬浮打开  is_skip 0打开 1打开海报
    var that = this;
    if (this.data.shopHomeData.is_skip == 0) {
      // this.setData({
      //   lafenWindowsState:true
      // })
      let url = "app.php?c=goods&a=sharing_guidance";
      let sdata = {
        store_id: this.data.shopHomeData.store.store_id,
        share_uid: this.data.share_uid,
        pop_type: 0,
      };
      common.post(url, sdata, "showWindows", that);
    }else if (this.data.shopHomeData.is_skip == 1) {

      this.showShareOperation();
    }
  },
  touchStart(e) {
    console.log(e);
    this.setData({
      isTouch: true
    })
    let query = wx.createSelectorQuery();
    query.select('#homePage').boundingClientRect(rect => {
      console.log(rect);
      this.setData({
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top,
        isDown: true
      })
    }).exec();
  },
  touchMove(e) {
    if (this.data.isDown == false) {
      return;
    }
    this.setData({
      isTouch: true
    })
    var L = e.changedTouches[0].clientX - this.data.x;
    var T = e.changedTouches[0].clientY - this.data.y;
    let query = wx.createSelectorQuery();
    if (L < 10) {
      L = 0;
    } else if (L > this.data.winWidth - 100) {
      L = this.data.winWidth - 100;
    }

    if (T < 10) {
      T = 0;
    } else if (T > this.data.winHeight - 100) {
      T = this.data.winHeight - 100;
    }
    this.setData({
      Style: 'left:' + L + 'px;top:' + T + 'px;right:unset;bottom:unset;'
    })
  },
  touchEnd(e) {
    let Style = this.data.Style;
    this.setData({
      isDown: false,
      showSearch: '隐藏input'
    })

  },
  showgroupModal() {
    let data = {
      source: 0,
      product_id: '',

    };
    let group_black_code = '';
    let that = this;

    common.post("app.php?c=live_code&a=get_group_code_id", data, function callBack(res) {
      if (res.err_code == 0) {
        console.log('客服交流', res)
        group_black_code = res.err_msg;
        let group_title = res.err_dom;
        that.setData({
          groupmodalStatus: true,
          group_black_code: group_black_code,
          group_title: group_title
        })
      }
    }, "")
  },
  hidegroupModal() {
    this.setData({
      groupmodalStatus: false
    })
  },
  goinGroupnew() {
    console.log(11111);
  },
  closeGroupWindows() {
    this.setData({
      groupWindowsShow: false
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
        let url = `app.php?c=goods&a=get_goods_by_group&store_id=${store_id}&group_type=${filed_type}&group_id=${group_id}&page=${page}`
        // console.log("url***>", url)
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
  //吸顶菜单
  onPageScroll: function(e) {

    //如果最后一个组件不是goods_group4返回
    let arr_field_list = this.data.shopHomeData ? this.data.shopHomeData.custom_field_list : [];
    arr_field_list[arr_field_list.length - 1].field_type
    if (arr_field_list && arr_field_list[arr_field_list.length - 1].field_type == 'goods_group4') {
      let menu_top = this.data.menu_top;
      let make_fiex = false;
      // console.log(`e.scrollTop====${e.scrollTop}==========menu_top=${menu_top}`)
      if (e.scrollTop > menu_top) {
        make_fiex = true;
      } else {
        make_fiex = false;
      }
      this.setData({
        make_fiex
      })
    }
  },
  //获取手机号
  getPhoneNumber(e) {
    let that = this;
    // 检查登录态是否过期
    wx.checkSession({
      success(res) {
        app.getPhoneNumber(e, that, that.data.code);
      },
      fail(err) {
        // session_key 已经失效，需要重新执行登录流程
        wx.login({
          success: res => {
            that.data.code = res.code;
            wx.setStorageSync('str_login', JSON.stringify(res));
            app.getPhoneNumber(e, that, res.code);
          }
        })
      }
    })
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
  //【ID1001217】更新门店信息
  upDataStore:function(result){
    if (result.err_code===0){
      const { name, pigcms_id } = result.err_msg;
      this.setData({
        'shopHomeData.store.physical_title': name,
        'shopHomeData.store.physical_id': pigcms_id
      })
    }
  },
  //isLogin登录

  isLogin: function (e) {
    if (!app.isLoginFun(this)) {//判断用户是否登录
      return false;
    }
  },
  oppeMap: function (e) {
    console.log(e)
    let latitude = parseFloat(e.currentTarget.dataset.lat)
    let longitude = parseFloat(e.currentTarget.dataset.long)

    wx.openLocation({
      latitude,
      longitude,
      scale: 18
    })
  },
  // 扫码购
  ad_scan:function(){
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.scanCode({
      success(res) {
        console.log('扫码结果', res);
        if (res.result) {
          that.setData({
            scanVal: res.result
          });
          that.scanSuccess();
          wx.hideLoading();
        }
      },
      fail(res) {
        wx.hideLoading();
        return publicFun.warning('扫码失败', that);
      }
    })
  },
  // 扫码成功
  scanSuccess: function () {
    let that = this;
    let data = {
      store_id: app.globalData.store_id || common.store_id,
      code: that.data.scanVal
    };
    common.post('app.php?c=store&a=discern_qrcode', data, function (res) {
      wx.navigateTo({
        url: '/pages/SHOPGOODS/pages/shoppingCat/scanBuy',
      })
    }, '');
  },
})