var common = require('../../utils/common.js');
var publicFun = require('../../utils/public.js');
var wxParse = require('../../wxParse/wxParse.js');
var canvasFun = require('../../utils/canvas-post.js');
var canvas = require('../../utils/canvas.js');
import { toPx } from "../../utils/util"
import http from "../../utils/http"
import http_cps from "../../utils/http_cps"
import { togetherDialogData, togetherDialogJs } from "../../template/together-dialog/together-dialog"

var app = getApp();
let page = 1;
let i = 0;
Page({
    data: {
      canvasImgState:false,
      canvasData:{},
      canvasImg:"",
      selected: true,
      selected1: false,
      scrollTop: {
          scroll_top: 0,
          goTopShow: false
      },
      scrollTopView:"",//值应为某子元素id（id不能以数字开头）。设置哪个方向可滚动，则在哪个方向滚动到该元素，防止设置页面scrollTop带来的页面抖动
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
      currentTab: 0,
      productList: 0,
      payDef: 0, // 支付方式，1积分支付 0 money金额支付
      tab: 'HAO',
      type: 0,
      businessTimeInt: '',
      productListSwichNav: [],
      insideShow: false, //内部价提示控制
      praidx: 0,    //当前评论的下标
      common_list_index: 0, //评论下面的图片的下标
      showBigPic: false,
      substoreList:[],
      oppenShopList:false,
      dialog:{
          dialogHidden:true,
          titleMsg:"海报图保存失败，用户取消或未开启保存到相册权限",
          determineBtnTxt:"去开启"
      },
      total_show: '00',
      hours_show: '00',
      minutes_show: '00',
      seconds_show: '00',
      instant: new Date(),
      isScroll:true,
      comman: '',
      more_show: false,
      memberGrade: 0,   //会员信息: 0:普通用户  1:普通会员   2: VIP会员   3/4: VIP以上会员
      vipRewards: '',   //升级vip收益
      purchaseRewards: '',    //购买收益
      shareRewards: '',    //分享收益
      goodType: "",    //商品类型： 10--普通商品，20--积分商品，30--礼包商品
      bottomHeight: app.globalData.bottomHeight,
      hasLogin: false,
      showPlaybill: false, // 展示生成的海报图片
      shareModalNode: null,   //底部分享弹框节点
      integralShow: false, // 积分提示弹窗显隐
      integralType: '', // 积分弹窗类型， 1为确认兑换 2为兑换成功 3为已兑换完库存不足 4为兑换失败
      isCurEnter: '',
      creatingPost: false,
      ...togetherDialogData
    },
    onLoad: function (e) {
      console.log('app.globalData分享者是------', app.globalData.share_uid, '--------小猪CMS-商品详情的参数------', e);
      var that = this;
      publicFun.onLoad(app, this);// 授权

      let { product_id, share_uid, shareType, room_id, custom_params, store_id, scene, cps_option, cps_type } = e;
      let isCurEnter = scene ? true : (share_uid ? true : false);   //当前页面是否为主入口

      share_uid = share_uid || app.globalData.share_uid || '';
      shareType = shareType || app.globalData.shareType || 1;
      product_id = product_id || app.globalData.cms_product_id || '';
      store_id = store_id || app.globalData.store_id || common.store_id;

      let preview = 0;
      if (room_id && custom_params){   //从直播间的商品跳转过来的  获取分享者的uid
        let _custom_params = JSON.parse(decodeURIComponent(custom_params));
        share_uid = _custom_params.share_uid;
        console.log('custom_params-------', _custom_params, '---share_uid---', share_uid);

      }else if(scene != undefined) {   //扫太阳码进来的
        var _scene = decodeURIComponent(scene);
        console.log("二维码", _scene);
        if (!_scene) return;

        let _split = _scene.split(',');
        store_id = _split[0];
        product_id = _split[1];
        let physical_id = _split[2];
        share_uid = _split[3] || '';
        preview = 1;

        if (physical_id){
          this.setData({ physical_id:physical_id });
          //融合的 type=1为切换门店，否则是查找最近的店铺
          common.post('app.php?c=lbs&a=switch_substore&type=1', {physical_id}, function (result) {
            console.log('扫描门店商品二维码',result);
          }, '');
        }
      }
      wx.setStorageSync("product_id", product_id);
      console.log('小猪CMS商品详情---获取到的分享者是------', app.globalData.share_uid);
      
      app.globalData.share_uid = share_uid || '';
      app.globalData.shareType = shareType || 1;
      app.globalData.cms_product_id = product_id;
      app.globalData.store_id = store_id;

      this.setData({
        product_id: product_id,
        preview: preview,
        isCurEnter,
        comman: wx.getStorageSync('comman')
      });

      //用户通过分享进入，改变分享者的积分任务状态
      if (share_uid&&cps_option&&cps_type) this.babyUserStatusChange(share_uid, cps_option, cps_type);

      //判断是否需要进行新用户权限校验
      let unlogin = wx.getStorageSync('unlogin');
      if ((unlogin || unlogin == '') && share_uid){
        app.initLoginFun(this.checkUserType);    //进入页面登录判断用户是否为注册用户
      }

      //是否展示分享图片
      app.shareWidthPic(that);
      this.goodsReward();    //获取购买或分享商品可获权益接口（积分）
      this.queryGoodType();   //获取商品类型
      
      //拉粉注册分享人id  分享来源1商品 2本店推广；
      // getApp().globalData.share_uid = e.share_uid || '';
      // getApp().globalData.shareType = e.shareType || 1;
    },
    onReady: function (e) {
      var that = this;
      // 获得dialog组件
      let _dialog = this.selectComponent("#shareModal");
      this.setData({ shareModalNode: _dialog });

      let url = '/pages/product/details?product_id=' + that.data.product_id;
      publicFun.setUrl(url);
      common.post('app.php?c=goods&a=index&app=app&store_id=' + app.globalData.store_id + '&id=' + that.data.product_id + '&preview=' + that.data.preview, '', "productData", that, '', true);
      // 获得dialog组件
      that.dialog = that.selectComponent("#shareModal");
      console.log('获得dialog组件2', that.dialog)
      //=========================检测登录授权====================================
      publicFun.checkAuthorize({
          pageData: this.data.productData,
          app: app,
          callbackFunc: '',
      })
      //=========================检测登录授权====================================
      publicFun.height(that);
      wx.getSystemInfo({
          success: function (res) {
              that.setData({
                  imageHeight: res.windowWidth,
                  winWidth: res.windowWidth,
                  winHeight: res.windowHeight
              });
          },
      })
    },
    onShow: function () {
      this.isLogin(1)  //判断用户是否登录
      this.getMemberInfo();    //获取会员信息
      
      this.getLogin()
      //获取用户上次打开小程序距重新获取地理位置
      app.getTimeDifference();
      if (this.data.productData == '') {
          this.onReady(e);
      } else {
        this.setData({
          instant: Date.now()
        })
          publicFun.setUrl('')
      }

      //新手日常任务 好礼页面--  5:浏览商品
      let _op = wx.getStorageSync('optionObj');
      _op = _op ? JSON.parse(_op) : null;
      if (_op && _op.cur && _op.cur == 5) this.babyOnUserFun(_op);
    },
    onHide: function () {
        clearTimeout(this.data.businessTimeInt)
        clearTimeout(this.noticeTimeout1)
        clearTimeout(this.noticeTimeout2)
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
      if (!app.globalData.share_uid && member_grade < 1) this.getClipboardData('invitcode');    //分享进入的 不检测粘贴板 走分享授权流程
    },
    checkUserType(res) {   //判断用户是否为新用户  is_new  1:表示新用户  null或者不存在: 表示注册用户
      let { is_new, unlogin, user } = res;
      let _inw = is_new ? true : false;
      let _isnewStr = wx.getStorageSync('isNewUser');
      let has_phone = (user&&user.phone ? 1 : 0) || wx.getStorageSync('has_phone') || app.globalData.has_phone;
      this.setData({ isNewUser: _inw || (_isnewStr?true:false), _unlogin: unlogin });
  
      if (!has_phone){  //未授权手机号码的 授权之前先刷新登录态
        app.wxloginMethods();
      }
  
      let { share_uid } = app.globalData;
  
      if (!_inw){   //老用户
        if (share_uid && share_uid != user.uid) this.getMemberBasicInfoByUserId('', user.uid);  //分享进入的 当前用户已经是注册用户以上级别 需要判断分享者和被分享者的会员级别
        return;
      }
  
      wx.setStorageSync('isNewUser', true);   //新用户标识
  
      //1、分享进入的，走分享授权流程
      if (!share_uid) return;
      this.getMemberBasicInfoByUserId('isnew');
    },
    getMemberBasicInfoByUserId(isnew, curUserid, reget) {   //通过分享者的uid获取邀请人信息  不需要先登录也可以调用
      const me = this;
      //第一步： 先获取邀请人的会员级别  如果邀请人是普通会员(1)以下级别， 不走授权流程
      http.post('getMemberBasicInfo', { userId: reget ? curUserid : app.globalData.share_uid })
      .then(res => {
        let { memberGrade } = res.data;
        if (!reget && (!memberGrade || memberGrade < 1)) return;  //邀请人是普通用户以下 无邀请码，都不走授权流程
  
        if (reget && memberGrade >= 1) return;  //被邀请人是会员以上的不走授权流程
  
        //第二步：邀请人是普通会员以上 有邀请码，被邀请者只有新用户、普通用户才走授权流程
        if (!isnew && !reget){
          me.getMemberBasicInfoByUserId(isnew, curUserid, 'reget');
          return;
        }
        
        //如果再其他页面跳过授权了， 在这里不再重复了
        let _jumpeAuth = wx.getStorageSync('jumpeAuth');
        console.log('自营商品详情是否为主入口------', this.data.isCurEnter, '--_jumpeAuth---', _jumpeAuth);
        if (_jumpeAuth && !this.data.isCurEnter) return;
        wx.navigateTo({ url: `/pages/shareAuth/shareAuth?from=cms_detail` });
      })
      .catch(res => {
        wx.showToast({ title: res.msg, icon: "none" });
      })
    },
    babyOnUserFun(_op) {   //完成了新手任务： 5:浏览商品
      let { option, type } = _op;
      let params =  { 
        option,
        status: 1,    //1:可领取   2:不翻倍完成任务  3:翻倍完成任务
        type    //NEW:新手任务   DAY:每日任务
      }
      http_cps.get('task_do_task_cps', params, true)
      .then(res => {
        wx.removeStorageSync('optionObj');  //清除缓存
      })
      .catch(res => {
        wx.removeStorageSync('optionObj');  //清除缓存
        wx.showToast({ title: res.msg, icon: 'none' });
      })
    },
    babyUserStatusChange(share_uid, cps_option, cps_type) {   //用户通过分享进入，改变分享者的积分任务状态
      let params = { 
        option: cps_option,
        uid: share_uid,
        type: cps_type
      }
      http_cps.get('task_finish_task_cps', params)
      .then(res => {
        wx.removeStorageSync('optionObj');  //清除缓存
      })
      .catch(res => {
        wx.removeStorageSync('optionObj');  //清除缓存
        wx.showToast({ title: res.msg, icon: 'none' });
      })
    },
    shoppingCatNum: function (result) {
        if (result.err_msg == 1) {
            this.setData({
                shoppingCatNum: true,
            })
        }
    },
    soldOutProduct(){
        let that = this;
      const { BASE_IMG_URL}=that.data;
        // 商品售罄处理
        if (that.data.productData.product.quantity == 0) {
            if(that.data.productData.product.all_physical_quantity * 1 == 0){
                return publicFun.soldOutBox({
                  img_url: `${BASE_IMG_URL}images/soldout_bg.png`,
                    msg: '商品已售罄',
                    btn_txt: '返回首页',
                    url: '/pages/index/index',
                    open_type: 'navigateBack',
                    delta:1
                }, that)
            }
            let apiUrl = 'app.php?c=goods&a=get_physical_list'
            let param = {
                lng:wx.getStorageSync('longitude'),
                lat:wx.getStorageSync('latitude'),
                store_id:common.store_id,
                product_id:that.data.productData.product.product_id
            }
            common.post(apiUrl,param,function (res) {
                console.log('商品的，门店列表');
                let substoreList = res.err_msg
                that.setData({
                    oppenShopList:true,
                    substoreList
                })
            },'')
        }
    },
    closeShopping() {
      publicFun.closeShopping(this)
    },
    productData: function (result) {
      console.log('商品',result)
        var that = this;
        if (result.err_code == 0) {
            //判断购物车数量
            common.post('app.php?c=cart&a=number&store_id=' + app.globalData.store_id, '', "shoppingCatNum", that, '', true);
            if (result.err_msg.activites != undefined && result.err_msg.activites.length > 0) {
                let activites = result.err_msg.activites;
                for (let i = 0; i < activites.length; i++) {
                    var url = activites[i].url;
                    activites[i].path = publicFun.getType(activites[i].url)
                    // console.log(activites[i].path.url)
                }
            }

            let {open_good_show: open_index_show, live_code_title, live_code_description, live_code_logo} = result.err_msg.store_config_show
            let live_code_config = {open_index_show, live_code_title, live_code_description, live_code_logo,product_id: result.err_msg.product.product_id}
          if (result.err_msg.community_user && result.err_msg.community_user.length>5){
            result.err_msg.community_user = result.err_msg.community_user.slice(0,5);
          }
            this.setData({
                productData: result.err_msg,
                live_code_config
            })
          if (this.data.productData.community_activity){
            this.timeShow()
          }
          //限时折扣
          if (this.data.productData.product.limited) {
            this.timeShowLimit()
          }
          //限时折扣
            this.soldOutProduct()
            //活动价格计算
            if (that.data.productData.community_activity){
              let min = '';
              let  max = '';
              let community_activity_prices = Object.values(that.data.productData.community_activity.prices);
              community_activity_prices.sort(function(x,y){
                return x-y;
              });
              for (var i = 0; i < community_activity_prices.length;i++){
                if(i == 0){
                  min = community_activity_prices[i]
                }
                if (i == (community_activity_prices.length-1)) {
                  max = community_activity_prices[i]
                }
              }
              let activity_price = (min==max)? max: min + '~' + max;
              if (!max) {
                activity_price = min
              }
              this.setData({
                activity_price: activity_price
              })
              
            }
            // 商品价格处理
            let product_price = publicFun.productPrice(that.data.productData.product.min_price, that.data.productData.product.max_price);
            // 运费、库存、销量、喜欢数据过万处理 
            let postInfo = publicFun.formateNumber(result.err_msg.product.postage);
            let salesInfo = publicFun.formateNumber(result.err_msg.product.sales);
            let quantityInfo = publicFun.formateNumber(result.err_msg.product.quantity);
            let collectInfo = publicFun.formateNumber(result.err_msg.product.collect);
            this.data.productData.product.postage = postInfo;
            this.data.productData.product.sales = salesInfo;
            this.data.productData.product.quantity = quantityInfo;
            this.data.productData.product.collect = collectInfo;
            // 商品详情控制项
            let config_obj = result.err_msg.store_config_show;
            let config_show = 0;
            if (config_obj.product_info_show * 1 != 0) {
                config_show = 0;
            } else if (config_obj.buy_record_show * 1 != 0) {
                config_show = 1;
            } else if (config_obj.comment_show * 1 != 0) {
                config_show = 2;
            } else if (config_obj.relation_product_show * 1 != 0) {
                config_show = 3;
            }
            this.setData({
                'currentTab': config_show
            })
            //修改头部标题
            publicFun.barTitle(this.data.productData.product.name);
            //模板富文本转化
            let info = this.data.productData.product.info;
            for (var i = 0; i < that.data.productData.discount_arr.length; i++) {
                that.data.productData.discount_arr[i].msg = that.data.productData.discount_arr[i].msg.replace(/<[^>]+>/g, "")
            }
            if (info != '' && info != undefined) {
                wxParse.wxParse('info', 'html', info, that, 5);
            }
            this.data.productData.product.info = info;
            //好评率处理
            let perfect_rate = result.err_msg.comment_data.t3 * 100 / result.err_msg.comment_data.total * 1;
            perfect_rate = perfect_rate.toFixed(2) + '%';
            this.setData({
                'productData': that.data.productData,
                'perfect_rate': perfect_rate,
                'product_price': product_price
            });
            publicFun.postage(that); //邮费计算
            publicFun.credit_arr(that); //特权计算
            //publicFun.business(that, that.data.productData.store.order_notice_time); //订单提醒
            //悬浮提醒
            publicFun.storeNotice(that,result.err_msg.product.product_id,result.err_msg.store.order_notice_open,result.err_msg.store.order_notice_time)

        }
    },
    oppenShopList(){
      this.setData({
          oppenShopList:false
      })
    },
    oppenShopping: function (e) { // 打开规格弹窗
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
        console.log('e')
        var that = this;
        publicFun.shoppingVid(e, that);
    },
    selectDeliverDate: function(e){
        let {index} = e.currentTarget.dataset;
        this.setData({
            "shoppingData.deliver_date_index":index
        })
    },
    payment: function (e) { //下一步,去支付
        var that = this;
        // 积分兑换方式购买
        if (!that.canExchange()) {
          return
        }
        publicFun.payment(that, e,"goodsDetail")
    },
    messageInput: function (e) { //留言内容
        var that = this;
        let index = e.target.dataset.index;
        that.data.shoppingData.shoppingCatData.custom_field_list[index].value = e.detail.value;
        this.setData({
            'shoppingData': that.data.shoppingData
        })
    },

    bindDateChange: function (e) { //选择日期
        var that = this;
        let index = e.target.dataset.index;
        let date = e.detail.value;
        that.data.shoppingData.shoppingCatData.custom_field_list[index].date = date;
        that.setData({
            'shoppingData': that.data.shoppingData
        })
    },
    bindTimeChange: function (e) { //选择时间
        var that = this;
        let index = e.target.dataset.index;
        let time = e.detail.value;
        that.data.shoppingData.shoppingCatData.custom_field_list[index].time = time;
        that.setData({
            'shoppingData': that.data.shoppingData
        })
    },
    addImg: function (e) { //图片上传
        var that = this;
        let index = e.target.dataset.index;
        publicFun.addImgMessage(that, index);
    },
    goTopFun: function (e) { //回到顶部滚动条
        this.setData({
            scrollTopView:"scrollTopView"
        })
    },

    // onPageScroll: function (e) {
    //     var that = this;
    //     // 返回顶部
    //   if (e.detail){
    //     if (e.detail.scrollTop > 300) {
    //       that.data.scrollTop.goTopShow = true;
    //     } else {
    //       that.data.scrollTop.goTopShow = false;
    //     }
    //     that.data.scrollTop.scroll_top = e.detail.scrollTop;
    //     that.setData({
    //       'scrollTop': that.data.scrollTop
    //     })
    //   }
      
        
    // },
    closeShopping: function (e) { //关闭提示框遮罩层
        var that = this;
        publicFun.closeShopping(that);
    },
    swichNav: function (e) {
        var that = this;
        let page = 1;
        let current = e.target.dataset.current;
        if (current == 1) {
            common.post('app.php?c=goods&a=buy_list&store_id=' + app.globalData.store_id + '&product_id=' + that.data.productData.product.product_id, '', recordData, ''); //购买记录
            function recordData(result) {
                if (result.err_code == 0) {
                    that.setData({
                        'recordData': result.err_msg
                    })
                }
            }
        }
        if (current == 2) {
            common.post('app.php?c=comment&app=app&a=comment_list&type=PRODUCT&store_id=' + app.globalData.store_id + '&data_id=' + that.data.productData.product.product_id + '&tab=' + that.data.tab, '', commentData, ''); //购买记录
            function commentData(result) {
                if (result.err_code == 0) {
                    that.setData({
                        'commentData': result.err_msg
                    })
                }
            }
        }
        publicFun.swichNav(e, that); //图文详情切换
    },
    bindDownLoad: function () {
        var that = this;
        if (that.data.currentTab == 1) {
            if (that.data.recordData.next_page == false) {
                console.log('没有更多数据了');
                return
            }
            page++;
            let url = 'app.php?c=goods&a=buy_list&store_id=' + app.globalData.store_id + '&product_id=' + that.data.productData.product.product_id + '&page=' + page
            common.post(url, '', setPushData, '');

            function setPushData(result) {
                let list = that.data.recordData.order_list;
                for (var i = 0; i < result.err_msg.order_list.length; i++) {
                    list.push(result.err_msg.order_list[i]);
                }
                that.setData({
                    'recordData.order_list': list,
                    'recordData.next_page': result.err_msg.next_page
                });
            }

        }
        if (that.data.currentTab == 2) {
            if (that.data.commentData.next_page == false) {
                console.log('没有更多数据了');
                return
            }
            page++;
            let url = 'app.php?c=comment&app=app&a=comment_list&type=PRODUCT&store_id=' + app.globalData.store_id + '&data_id=' + that.data.productData.product.product_id + '&tab=' + that.data.tab + '&page=' + page
            common.post(url, '', setPushData, '');

            function setPushData(result) {
                let list = that.data.commentData.order_list;
                for (var i = 0; i < result.err_msg.comment_list.length; i++) {
                    list.push(result.err_msg.order_list[i]);
                }
                that.setData({
                    'commentData.comment_list': list,
                    'commentData.next_page': result.err_msg.next_page
                });
            }

        }
    },
    // 切换支付方式
    selectPay (e) {
      let index = e.target.dataset.index;
      console.log('eeee', e)
      this.setData({
        payDef: index
      })
    },
    //切换评论的tab
    productListSwichNav: function (e) {
        page = 1;
        var that = this;
        var tab = e.target.dataset.tab;
        if (that.data.productListSwichNav.indexOf(tab) != -1) {
            that.data.productListSwichNav.push(tab)
        }
        i++;
        if(tab == that.data.tab)return false;
        that.setData({
            'tab': tab
        })
        common.post('app.php?c=comment&app=app&a=comment_list&type=PRODUCT&store_id=' + app.globalData.store_id + '&data_id=' + that.data.productData.product.product_id + '&tab=' + that.data.tab, '', commentData, ''); //购买记录
        function commentData(result) {
            if (result.err_code == 0) {
                that.setData({
                    'commentData': result.err_msg
                })
            }
            console.log(that.data);
        }
    },
    productListSwichSubStore(e){
        console.log(e);
        let {physicalid} = e.target.dataset
        let that = this;
        setTimeout(function(){
            let data = {
                physical_id: physicalid
            }
            common.post('app.php?c=lbs&a=switch_substore&type=1', data, function (res) {
                if(res.err_code == 0){
                    wx.redirectTo({
                        url: '/pages/product/details?product_id=' + that.data.productData.product.product_id,
                    })
                }else{
                    console.log(res);
                }
            }, '');
        }, 100)
    },



    scroll: function (event) {
        this.setData({
            scrollTop: event.detail.scrollTop
        });
    },
    collect: function (e) {
        var that = this;
        publicFun.collect(that, e)
    },
    calling: function () { //拨打电话
        let num = this.data.productData.store.tel;
        publicFun.calling(num)
    },
    onShareAppMessage: function () {
      const product = this.data.productData;

      let nickname = product.user.nickname
      let title = nickname ? `【${nickname}】` : '';
      console.log('product', product)
      let imgArr = product.product.images
      let image = imgArr.length > 0? imgArr[0].image: 'cps'
      let goodName = product.product.name
      goodName = goodName? `${goodName}`: ''

      return getApp().shareGetFans(`${title}给你推荐一个好货${goodName}`,'',`/pages/product/details`, 1, image,`&product_id=${this.data.product_id}`)
      
        // return {
        //     title: this.data.productData.product.name,
        //     desc: this.data.productData.product.name + '，物美价廉，购物必选',
        //   path: '/pages/product/details?product_id=' + this.data.product_id + '&store_id=' + app.globalData.store_id + "&share_uid=" + getApp().globalData.my_uid + "&shareType=1",
        //     imageUrl: this.data.productData.product.image
        // }
    },
    toRegister(e) {   //跳转到礼包商城
      console.log('this.data.memberGrade', this.data.memberGrade)
      wx.navigateTo({ url: `/subPages/sub-member/pages/gift-store/gift-store?memberGrade=${this.data.memberGrade}` });
    },
    insideShow: function (e) { //内部价
        var that = this;
        that.setData({
            'insideShow': !that.data.insideShow
        })
    },
    showBigPic: function (e) {// 查看大图
        var that = this;
        let { praidx, index } = e.target.dataset;
        that.setData({
          'praidx': praidx,
          'common_list_index': index,
          'showBigPic': true
        })
    },
    hideBigPic: function () {// 隐藏大图
        var that = this;
        that.setData({
            'showBigPic': false
        })
    },
    hideSoldOutBox: function () { // 关闭售罄弹窗
        publicFun.hideSoldOutBox(this);
        wx.navigateTo({
          url: '/pages/SHOPGOODS/pages/index/shopHomeList',
        })
    },
    formSubmit: function (e) { // 生成下发模板消息所需的formId存于服务器
      console.log('eeeeeeeeeee', e)
        var that = this;
        publicFun.formSubmit({
            e: e,
            that: that
        });
    },
    /*
    *
    **分享对话框 shareModal start
    *
    */

    //显示对话框
    getLogin: function () {
      let that= this,
        _unlogin = true;
      let _value = wx.getStorageSync('unlogin');

      _unlogin = getApp().globalData.unlogin;
      if ((_value !== undefined && _value !== "") || _value === false) {
        _unlogin = _value;
      }

      if (!_unlogin) {
        that.setData({
          hasLogin: true
        })
      }
      console.log('执行了', that.data.hasLogin)
    },
    goIndex() {
      wx.switchTab({
        url: '/pages/index/index'
      })
    },

    //取消事件
    _cancelEvent: function () {
        var that = this;
        console.log('你点击了取消');
        try {
            clearInterval(loopDownloadTimer); // 清除检测downloadFile是否全部执行完的计时器
        } catch (e) {

        }
        // 修改画布执行状态
        if (that.data.canvasData) {
            that.data.canvasData.status = false;
        }
        that.setData({
            canvasData: that.data.canvasData
        })
        wx.hideLoading();
        that.dialog.hideDialog();
        that.setData({
          canvasImgState:false
        })
    },
    //显示对话框
    shareTap: function() {
      var that = this;
      if (!app.isLoginFun(this)) { //判断用户是否登录
          common.setUserInfoFun(this, app);
          return false;
      }
      that.dialog.showDialog();
  },
    //分享好友或群
    _shareGroup: function () {
        var that = this;
        console.log('分享好友或群');
        wx.showShareMenu({
            withShareTicket: true
        })
    },
    // 分享前判断是否登录
    shareLogin() {
      if (!app.isLoginFun(this)) {//判断用户是否登录
        return false;
      }
      return true
    },

    //分享朋友圈
    _shareFriendsCircle: function () {
      console.log('creatingPost', this.data.creatingPost)
        var that = this;
        // if (!app.isLoginFun(this)) {//判断用户是否登录
        //   return false;
        // }
        // 节流
        if (!publicFun.stopClick(that)) return
        // 处理canvas
        wx.showLoading({
          title: '海报生成中...',
          mask: true
        })
        
        console.log('分享朋友圈');
        let ticket = wx.getStorageSync('ticket');

        let data = {
            path: 'pages/product/details',
            id: that.data.productData.product.product_id,
            share_uid: getApp().globalData.my_uid,
            shareType: 1
        }

        if(that.data.creatingPost){
            return false
        }
        that.setData({
          creatingPost: true
        })
        wx.request({
            url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
            header: {
                'Content-Type': 'application/json'
            },
            data: data,
            method: "POST",
            success: function (res) {
                console.log('获取二维码成功')
                if (res.statusCode == 200) {
                    if (res.data.err_code == 0) {
                        that.setData({
                            qrcodePath: res.data.err_msg
                        })
                        that.creatPost();
                        // 处理canvas
                    } else if (res.data.err_code == 1000) {
                      wx.hideLoading();
                      that.setData({
                        creatingPost: false
                      })
                      wx.showModal({
                        title: '温馨提示',
                        content: res.data.err_msg,
                        confirmText: '好哒',
                        confirmColor: app.globalData.navigateBarBgColor,
                        showCancel: false,
                        success: function (res) {
                          that.dialog.hideDialog();
                        }
                      });
                    }
                }
            },
            fail: function (res) {
                wx.hideLoading();
                that.setData({
                  creatingPost: false
                })
            }
        })
    },
    splitStrFun(o) {   //多行文本时发生截取
      let sArr = o._strArr.filter((item, index) => {
        let _w = o.ctx.measureText(item).width*(o.dpr);
        if (o.line == 1){    //第一行时
          if (o.sum < o.max && (o.sum + _w) <= o.max){
            o.sum += _w;
            o._in = index;
            return item;
          }
        }else {     //多行时  留出...的位置
          let pointW = o.ctx.measureText("...").width*(o.dpr);    //获取...的宽度
          if (o.sum < o.max && (o.sum + _w) <= o.max && (o.sum + _w + pointW) <= o.max){
            o.sum += _w;
            o._in = index;
            return item;
          }else {
            console.log(`第二行超出了宽度${o.max}------`, o.sum + _w + pointW);
            if ((o.sum + _w + pointW) > o.max){
              o.isover = true;
            }
          }
        }
        
      })
      return { sArr, sum: o.sum, curIndex: o._in, isover: o.isover };
    },
    /*
    *
    **分享对话框 shareModal end
    *
    */
    // 生成分享海报
    creatPost: function () {
        let that = this;
        // 1 设置画布数据
        let product_name = that.data.productData.product.name;
        let product_price = that.data.productData.product.is_fx && that.data.productData.product.is_fx == '1' && that.data.productData.product.retail_price ? that.data.productData.product.retail_price : that.data.product_price;
        
        let canvasData = { // 画布数据
            canvasId: 'productPost',
            canvasWidth: 560,
            canvasHeight: 980,
            paddingLeft: 0,
            paddingTop: 0,
            bgPath: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/share_cps_bg.png', // 海报背景图


            product_price: product_price*10/1000,   //商品最新价格
            old_price: that.data.productData.product.original_price*10/1000,   //商品划线价格 原价
            // coupon_discount: coupon_discount/100,    //优惠券面额
            // has_coupon,    //商品是否有优惠券
            sales_tip: that.data.productData.product.sales,   //售卖件数
            nickName: that.data.productData.user.nickname, // 用户昵称
            avatarPath: that.data.productData.user.avatar, // 用户头像
            qrcodePath: 'https://' + that.data.qrcodePath.split('://')[1],   // 二维码
            productImage: 'https://' + that.data.productData.product.image.split('://')[1],   // 商品首图

            product_name: product_name, // 活动名称
            product_price: product_price,
            text_qrcode_btm: '长按识别', // 二维码下方文字
            loadFailTapStatus: false, // 下载失败处理函数是否已执行
            // 图片数据
            productImage: 'https://' + that.data.productData.product.image.split('://')[1], // 商品首图
        };
        console.log(that.data.productData.user.nickname)
        let obj = canvas.px2rpx({ w: canvasData.canvasWidth, h: canvasData.canvasHeight, base: that.data.winWidth });
        that.setData({
            canvasData: canvasData,
            canvasPosition: obj
        })
        let task = []
        let filePaths = ['productImage','qrcodePath','avatarPath', 'bgPath']
        for (let j = 0; j < filePaths.length; j++) {
            const filePath = filePaths[j];
            task.push(canvasFun.loadImageFileByUrl(that.data.canvasData[filePath]))
        }
        Promise.all(task).then(resultList => {
          for (let filePathIndex=0; filePathIndex < resultList.length; filePathIndex++) {
            let resultListElement = resultList[filePathIndex];
            that.data.canvasData[filePaths[filePathIndex]] = resultListElement.tempFilePath
          }
          that.setData({ canvasData: that.data.canvasData });
          that.drawCanvas();
          // 保存图片
          setTimeout(function () {
              let w = that.data.canvasData.canvasWidth;
              let h = that.data.canvasData.canvasHeight;
              that.save({
                  id: that.data.canvasData.canvasId,
                  w: w,
                  h: h,
                  targetW: w * 4,
                  targetH: h * 4
              });
          }, 300)
        }).catch(err => {
          console.log('图片转换失败---', err);
          if (that.data.creatingPost) {
            wx.hideLoading()
          }
          that.setData({ creatingPost: false });
          that.setComModalData(true, '温馨提示', '海报生成失败，请重试', '我知道了', '');   //设置警告弹框
        })
    },
    drawCanvas() {   //开始画图
      const me = this;
      let { canvasId, canvasWidth, canvasHeight, product_name, productImage, product_price, old_price, coupon_discount, has_coupon, sales_tip, sourceIcon, source_from, nickName, avatarPath, qrcodePath, bgPath, text_qrcode_btm } = this.data.canvasData;
      let headr = 40;   //头像半径
      let proWidth = 450, proHeight = 450;   //商品宽高
      const ctx = wx.createCanvasContext(canvasId);
  
      //绘制背景图片
      canvas.drawImage({
        ctx: ctx,
        img: bgPath,
        x: 0,
        y: 0,
        w: canvasWidth,
        h: canvasHeight
      })
      //绘制头像  顶部距离30   半径40
      if (avatarPath){
        canvas.circleImg({
          ctx: ctx,
          img: avatarPath,
          r: headr,    //头像半径
          x: canvasWidth/2 - headr,
          y: 30,
          w: headr * 2,
          h: headr * 2
        })
      }
      //绘制昵称  x:字体居中 x为整个宽度一半  y: 顶部30 + 头像80 + 10间隙 + 字体高度24/2 = 132 
      ctx.setFontSize(toPx(22));
      ctx.setFillStyle('#FEFFFF');
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText(nickName, toPx(canvasWidth/2), toPx(132));
      //绘制推荐文字  x:字体居中 x为整个宽度一半  y: 上一步(加文字的另外一半12) 144 + 间隙14 + 字体高度28/2 = 172
      ctx.setFontSize(toPx(20));
      ctx.setFillStyle('#A26121');
      ctx.fillText('推荐您成为闪购会员享受更多返利', toPx(canvasWidth/2), toPx(172));
      //绘制商品图片  y: 上一步172+14(字体另外一半) + 间隙34 = 220
      ctx.save();   //保存之前的内容
      ctx.beginPath();
      ctx.rect(toPx((canvasWidth - proWidth)/2), toPx(220), toPx(proWidth), toPx(proHeight));
      ctx.clip();
      ctx.drawImage(productImage, toPx((canvasWidth - proWidth)/2), toPx(220), toPx(proWidth), toPx(proHeight));
      ctx.restore();
  
      //测试多行省略号展示
      // 嗨吃家酸辣粉6桶整箱正品清真正宗重庆泡面方便面速食红薯粉丝
      // ctx.beginPath();
      // ctx.setFontSize(toPx(32));
      // ctx.setFillStyle('#f00');
      // ctx.setTextAlign('left');
      // ctx.setTextBaseline('top');
      // console.log('一行的块状宽度为----', canvasWidth - 60);    //500rpx
      // console.log('三个点的宽度为----', ctx.measureText('...').width*dpr);    //26rpx
      // console.log('来源的宽度为----', ctx.measureText(source_from).width*dpr);    //96rpx
      // console.log('第一行的文字宽度为----', ctx.measureText('嗨吃家酸辣粉6桶整箱正品清').width*dpr);   //404rpx
      // console.log('第二整行的宽度为----', ctx.measureText('嗨吃家酸辣粉6桶整箱正品清真正宗').width*dpr);    //500rpx 一整行 或者 (30左边距+来源+15间隙+文字宽 = 500rpx)
      // ctx.fillText('嗨吃家酸辣粉6桶整箱正品清', toPx(30 + _sw + 15), toPx(220 + proHeight + 30 + 4 + 4 + 90));
      // ctx.fillText('嗨吃家酸辣粉6桶整箱正品清真正宗', toPx(30), toPx(220 + proHeight + 30 + 4 + 4 + 130));
  
      //绘制商品名称 多行文字 超出19个字显示两行，溢出显示省略号  y:上一步220 + 商品图片高度450 + 间隙30 = 722
      let dpr = app.globalData.dpr || 2;   //当前分辨率比例
      ctx.beginPath();
      ctx.setFontSize(toPx(32));
      ctx.setFillStyle('#f00');
      ctx.setTextAlign('left');
      ctx.setTextBaseline('top');
      let _width = ctx.measureText(product_name).width*dpr;
      let _rowwidth = _width + 15;
      let row_1_Data = "", row_2_Data = "";
      console.log('当前商品名称长度rpx-----', _width);
  
      if (_rowwidth > 500){    //多行省略号
        let _strArr = product_name.split("");
        //截取第一行文字
        row_1_Data = me.splitStrFun({
          ctx: ctx,
          dpr,
          line: 1,
          _strArr,
          max: 500,    //一行宽度500 - 来源_w - 间隙15
          sum: 0,
          _in: 0
        })
        //截取第二行数据
        let _other = _strArr.slice(row_1_Data.curIndex + 1);
        if (_other && _other.length){
          row_2_Data = me.splitStrFun({
            ctx: ctx,
            dpr,
            line: 2,
            _strArr: _other,
            max: 500,
            sum: 0,
            _in: 0
          })
        }
        //截取后拼装商品名称
        product_name = row_1_Data.sArr.join("") + "\n" + row_2_Data.sArr.join("");
        if (row_2_Data && row_2_Data.isover) product_name += "...";
  
        //开始画多行名字
        let o = {
          ctx,
          gap: 10,
          text: product_name,
          x: 30,
          y: 220 + proHeight + 30,
          fontSize: 32
        }
        let textArr = o.text.split('\n');
  
        if (textArr.length > 1) {
          let baseY = o.y;
          for (let i = 0; i < textArr.length; i++) {
            let y = baseY + (o.fontSize + o.gap) * (i);
            //第一行时，需要空出来源source的宽度
            let _obj = { y };
            _obj.x = 30;
            o = Object.assign({}, o, _obj);
            o.text = textArr[i];
            canvas.drawText(o);
          }
        }
  
      }else {
        //绘制价格符号
        canvas.drawText({
          ctx: ctx,
          text: product_name,
          x: 45,    //左边距30 + 来源宽度 + 右边距15
          y: 220 + proHeight + 30,
          fontSize: 32
        })
      }
  
      //绘制价格符号
      ctx.beginPath();
      ctx.setFontSize(toPx(28));
      ctx.setFillStyle('#FF4444');
      ctx.fillText("¥", toPx(30), toPx(826));
      //绘制商品优惠价格
      ctx.beginPath();
      ctx.setFontSize(toPx(46));
      ctx.setFillStyle('#FF4444');
      ctx.fillText(product_price, toPx(58), toPx(813));

      //绘制推荐一个好物，快来抢
      ctx.beginPath();
      ctx.setFontSize(toPx(22));
      ctx.setFillStyle('#999');
      let _sourW = ctx.measureText(source_from).width*dpr;
      ctx.fillText("推荐一个好物，快来抢", toPx(30), toPx(873));

      //绘制闪购Live 自购省钱 分享赚钱
      ctx.beginPath();
      ctx.setFontSize(toPx(22));
      ctx.setFillStyle('#999');
      ctx.fillText('闪购Live 自购省钱 分享赚钱', toPx(30), toPx(913));


      //绘制二维码
      ctx.save();   //保存之前的内容
      ctx.beginPath();
      ctx.rect(toPx(canvasWidth-100-30), toPx(813), toPx(100), toPx(100));
      ctx.clip();
      ctx.drawImage(qrcodePath, toPx(canvasWidth-100-30), toPx(813), toPx(100), toPx(100));
      ctx.restore();
      //绘制二维码提示文字
      ctx.beginPath();
      ctx.setFontSize(toPx(18));
      ctx.setFillStyle('#999');
      ctx.setTextAlign('center');
      ctx.fillText(text_qrcode_btm, toPx(canvasWidth-50-30), toPx(922));
  
      // 最终绘出画布
      ctx.draw(false, () => {
        let o = {
          id: canvasId,
          w: canvasWidth,
          h: canvasHeight,
          targetW: canvasWidth * 4,
          targetH: canvasHeight * 4
        }
        canvas.canvasToTempFilePath(o).then(res => {
          // wx.hideLoading();
          console.log('生成的海报图片路径为-----',  res.tempFilePath);
          if (me.data.shareModalNode.data.isShow) me.data.shareModalNode.hideDialog();   //关闭分享底部弹框
          me.setData({ canvasImg: res.tempFilePath, showPlaybill: true });
          wx.hideLoading();
        })
        .catch(err => {
          console.log('生成海报失败----', err);
          wx.hideLoading();
          me.setComModalData(true, '温馨提示', '海报生成失败，请重试', '我知道了', '');   //设置警告弹框
        })
      })
      
    },


    // 画图 18-04-24 created by cms_ssa
    save: function () {
        let that = this,
          w = that.data.canvasData.canvasWidth,
          h = that.data.canvasData.canvasHeight,
          data= {
            id: that.data.canvasData.canvasId,
            w: w,
            h: h,
            targetW: w * 4,
            targetH: h * 4
          }
        canvas.canvasToTempFilePath(data).then(function (res) {
            // console.log(res);
            that.setData({
              canvasImgState:true,
              showPlaybill: true
            })
            // setTimeout(function() {
            //   wx.hideLoading();
            // }, 2000)
        }, function (err) {
            console.log(err);
        });
    },
    saveImg(res) {
      let that= this
      publicFun.checkAuthOfSaveImageToPhotosAlbum(() => { //第一步： 授权保存到相册权限
        canvas.saveImageToPhotosAlbum({imgSrc: that.data.canvasImg}).then(function (res) {
          // console.log(res);
          wx.showModal({
              title: '存图成功',
              content: '图片成功保存到相册了，去发圈噻~',
              showCancel: false,
              confirmText: '好哒',
              confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
              success: function (res) {
                if (res.confirm) {
                    console.log('用户点击确定');
                    that.dialog.hideDialog();
                    creatingPost = false
                    that.closePlaybillFun()
                }
              }
          })
        }, function (err) {
            console.log(err);
            wx.hideLoading();
            that.setData({ creatingPost: false });
            that.setComModalData(true, '温馨提示', '商品图片下载失败', '我知道了', '');   //设置警告弹框
        });
      })
      
    },
    // 预览照片
    toPreviewFun() {
      let that= this
      wx.previewImage({
          urls:[that.data.canvasImg],
          current:that.data.canvasImg
      })
    },
    // 积分提示弹框开启
    showIntegralPopup (type) {
      console.log('type', type)
      type = type? type: 1
      this.setData({
        integralShow: true,
        integralType: type
      })
    },
    // 关闭积分提示
    hideIntegralPopup () {
      this.setData({
        integralShow: false
      })
      if (this.data.integralType == 4) {
        wx.switchTab({
          url: '/pages/gifttab/gifttab'
        })
      }
    },
    // 判断积分是否足够
    canExchange () {
      let that = this
      if (that.data.payDef == 1) {
        
        console.log('点击了', that.data)
        if (that.data.productData.product.cost_point && that.data.productData.product.cost_point > 0 && that.data.productData.product.cost_point > that.data.points) {
          that.showIntegralPopup(4)
          return false
        }
      }
      return true
    },
    // 确认兑换
    sureExchange(e) {
      let that = this
      console.log('确认兑换')
      that.hideIntegralPopup()
      // common.post('app.php?c=goods&a=index&app=app&store_id=' + app.globalData.store_id + '&id=' + that.data.product_id + '&preview=' + that.data.preview +'&from_point_shop=1', '', "productData", that, '', true);
      publicFun.payment(that, e,"goodsDetail")
    },
    setComModalData(isShowModal=false, title, content, cancelText, sureText) {    //自定义警告弹框内容
      this.setData({ 
        'modalData.isShowModal': isShowModal,
        'modalData.title': title,
        'modalData.content': content,
        'modalData.cancelText': cancelText,
        'modalData.sureText': sureText
      })
    },
    closePlaybillFun() {    //关闭海报
      this.setData({ showPlaybill: false, creatingPost: false });
    },
    toCancle() {   //关闭 警告弹窗
      if (this.data.shareModalNode.data.isShow) this.data.shareModalNode.hideDialog();   //关闭分享底部弹框
      this.setData({ 'modalData.isShowModal': false });
    },
    toMakesure() {   //确认 警告弹窗
      if (this.data.shareModalNode.data.isShow) this.data.shareModalNode.hideDialog();   //关闭分享底部弹框
      this.setData({ 'modalData.isShowModal': false });
    },
    // 视频 图片切换
    selected: function (e) {
        this.setData({
            selected1: false,
            selected: true
        })
    },
    selected1: function (e) {
        this.setData({
            selected: false,
            selected1: true
        })
    },
    officialAccountError(error) {
        console.log('关注公众号组件加载失败，具体原因：' + error.detail.errMsg);
        console.log({error});
        this.setData({
            applet_guide_subscribe: false
        })
    },
    gotoMember(){
      wx.navigateTo({
        url: '/pages/user/vip/vip',
      })
    },
    gotoMemberGift(){
      wx.navigateTo({
        url: "/pages/giftMember/giftuser/user",
      })
    },
    showgroupModal() {
      let data = {
        source: 2,
        product_id: this.data.product_id,

      };
      let group_black_code = '';
      let that = this;
      common.post("app.php?c=live_code&a=get_group_code_id", data, function callBack(res) {
        if (res.err_code == 0) {
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
    timeShow: function () {
      var that = this;
      var endtime = new Date(that.data.productData.community_activity.end_time * 1000); //结束时间
      var today = new Date((new Date().getTime() - new Date(that.data.instant).getTime()) + new Date(that.data.productData.community_activity.now_time * 1000).getTime()); //当前时间

      var delta_T = endtime.getTime() - today.getTime(); //时间间隔
      if (delta_T < 0) {
        //clearInterval(auto);
        //$(".header .Places i").text(0);
        console.log("活动已经结束啦");
        return;
      }
      publicFun.timer = setTimeout(that.timeShow, 1000);
      var total_days = delta_T / (24 * 60 * 60 * 1000), //总天数
        total_show = Math.floor(total_days), //实际显示的天数
        total_hours = (total_days - total_show) * 24,//剩余小时
        hours_show = Math.floor(total_hours), //实际显示的小时数
        total_minutes = (total_hours - hours_show) * 60, //剩余的分钟数
        minutes_show = Math.floor(total_minutes), //实际显示的分钟数
        total_seconds = (total_minutes - minutes_show) * 60, //剩余的分钟数
        seconds_show = Math.floor(total_seconds); //实际显示的秒数
      if (total_show <= 15) {
      }
      if (total_show < 10) {
        total_show = String(total_show);
        total_show = "0" + total_show;
      }
      if (hours_show < 10) {
        hours_show = "0" + hours_show;
      }
      if (minutes_show < 10) {
        minutes_show = "0" + minutes_show;
      }
      if (seconds_show < 10) {
        seconds_show = "0" + seconds_show;
      }
      that.setData({
        total_show: total_show,
        hours_show: hours_show,
        minutes_show: minutes_show,
        seconds_show: seconds_show
      })
    },
  timeShowLimit: function () {
    var that = this;
    var endtime = new Date(that.data.productData.product.limited.end_time* 1000); //结束时间
    var today = new Date(); //当前时间

    var delta_T = endtime.getTime() - today.getTime(); //时间间隔
    if (delta_T < 0) {
      //clearInterval(auto);
      //$(".header .Places i").text(0);
      console.log("活动已经结束啦");
      return;
    }
    publicFun.timer = setTimeout(that.timeShowLimit, 1000);
    var total_days = delta_T / (24 * 60 * 60 * 1000), //总天数
      total_show = Math.floor(total_days), //实际显示的天数
      total_hours = (total_days - total_show) * 24,//剩余小时
      hours_show = Math.floor(total_hours), //实际显示的小时数
      total_minutes = (total_hours - hours_show) * 60, //剩余的分钟数
      minutes_show = Math.floor(total_minutes), //实际显示的分钟数
      total_seconds = (total_minutes - minutes_show) * 60, //剩余的分钟数
      seconds_show = Math.floor(total_seconds); //实际显示的秒数
    if (total_show <= 15) {
    }
    if (total_show < 10) {
      total_show = String(total_show);
      total_show = "0" + total_show;
    }
    if (hours_show < 10) {
      hours_show = "0" + hours_show;
    }
    if (minutes_show < 10) {
      minutes_show = "0" + minutes_show;
    }
    if (seconds_show < 10) {
      seconds_show = "0" + seconds_show;
    }
    that.setData({
      total_show_limit: total_show,
      hours_show_limit: hours_show,
      minutes_show_limit: minutes_show,
      seconds_show_limit: seconds_show
    })
  },
    showbackMoney(){
      this.setData({
        backMoneyStatus:true
      })
    },
    hidebackMoney() {
      this.setData({
        backMoneyStatus: false
      })
    },
    // 显示更多
    showMore: function () {
      let that = this;
      that.setData({
        more_show: !that.data.more_show,
      });
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

  // 进入直播
  issetLive:function(){
    var that = this;
    if (!app.isLoginFun(this)) {//判断用户是否登录
      return false;
    }
    wx.navigateTo({
      url: '/pages/LIVEVIDEO/pages/liveVideo/liveVideoDetail?live_id=' + that.data.productData.live_id + '&isShare=1',
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    })
  },
  // onPageScroll: function (e) {
  //   console.log(e);
  //   var that=this;
  //   if (e.detail.scrollTop>0){
  //     that.setData({
  //       isScroll: false
  //     })
  //   } if (e.detail.scrollTop ==0){
  //     that.setData({
  //       isScroll: true
  //     })
  //   }
  // }

  updateToVip() {   //升级为VIP会员
    if (!getApp().isLoginFun(this)) { //判断用户是否登录
        return false;
    }
    wx.navigateTo({ url: "/subPages/sub-member/pages/gift-store/gift-store" });
  },
  getMemberInfo() {   //获取会员信息: 需要先拿uid
    let unlogin = wx.getStorageSync('unlogin');
    if (unlogin || unlogin === '' || unlogin == 'undefined') return;   //未登录
    
    http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
    .then(res => {
      let { member_grade, points } =  res.data;
      this.setData({ 
        memberGrade: member_grade || 0,
        points: points || 0
      })

      //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
      let _suc = wx.getStorageSync('success_getphone');
      if (_suc) this.successGetPhoneCallback(memberGrade || 0);
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  goodsReward() {    //获取购买或分享商品可获权益
    let { my_uid } = app.globalData;
    http.post('goodsReward', { goodId: this.data.product_id, userId: my_uid ? my_uid : "" })
    .then(res => {
      if (!res.data) return;
      let { purchaseRewards, shareRewards, vipRewards } = res.data;
      this.setData({ vipRewards, purchaseRewards, shareRewards });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  queryGoodType() {   //查询商品类型: 10--普通商品，20--积分商品，30--礼包商品
    let unlogin = wx.getStorageSync('unlogin');
    if (unlogin || unlogin === '' || unlogin == 'undefined') return;   //未登录

    http.post('queryGoodType', { goodId: this.data.product_id })
    .then(res => {
      if (!res.data) return;
      let { goodType } = res.data;
      this.setData({ goodType });
      if (app.globalData.share_uid){   //(之前：是积分商品，如果存在分享者，将商品与分享者绑定关系)， (2020.6.15修改为不做商品限制)
        this.shareRecord();
      }
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  shareRecord() {   //记录分享商品的绑定关系
    let { my_uid, share_uid } = app.globalData;
    http.post('shareRecord', { goodId: this.data.product_id, userId: my_uid, sharerId: share_uid })
    .then(res => {
      console.log('商品与分享者关系绑定成功',  res);
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }

})

