var publicFun = require('../../utils/public.js');
var common = require('../../utils/common.js');
import http from "../../utils/http"

var app = getApp();
Page({
  data: {
    userData: '',
    is_fx: '',
    sid: '',
    SUER_URL: '/pages/USERS',
    //open_drp_pulverize:1 不显示分销管理，0显示,
    invitationCode: ""    //会员版本 -- 当前用户的邀请码
  },
  onLoad: function(e) { // 页面渲染完成
    var that = this;
    app.updateThemeColor().then(function() {
      publicFun.setBarBgColor(app, that); // 设置导航条背景色
      // publicFun.getTabBarFun(that, '/pages/user/index');   //设置当前tabar的序号: 自定义tabar
      that.getMemberBasicInfo();  //会员版本--获取当前用户的邀请码
    })
    publicFun.barTitle('会员主页'); //修改头部标题
    //增加拉粉进度条
    // let data = {
    //   store_id: getApp().globalData.store_id
    // };
    common.post("app.php?c=ucenter&a=share_info", {}, "shareInfoFun", that, '', true)

    // 新授权方式下锁粉新增
    if (e.scene != undefined) { // 预览模式
      var scene = decodeURIComponent(e.scene);
      if (scene) {
        id = scene.split(',')[1];
        preview = 1;
        app.globalData.store_id = scene.split(',')[0];
        app.globalData.share_uid = scene.split(',')[3];
      }
    } else { // 正常模式
      getApp().globalData.share_uid = e.share_uid || app.globalData.share_uid || '';
      getApp().globalData.shareType = e.shareType || 2;
    }
    // 以上新增

    app.isLoginFun(this, 1);//判断用户是否登录
    if(this.data._unlogin){
      return;
    }
    //是否展示分享图片
    app.shareWidthPic(that);
  },
  onReady: function(e) {

  },
  onShow: function(e) {
    var that = this;
    let data = {
      // store_id: app.globalData.store_id
    }
    common.post('app.php?c=my&a=index', data, "userData", that, '', true);
    publicFun.height(that);
    that.setData({
      'is_fx': common.is_fx,
      'sid': common.store_id
    })
  },
  onPullDownRefresh() {
    var that = this;
    // let data = {
    //   store_id: app.globalData.store_id
    // }
    common.post('app.php?c=my&a=index', {}, "userData", that, '', true);
    that.setData({
      'is_fx': common.is_fx,
      'sid': common.store_id
    })
  },
  shareInfoFun(res) {
    let that=this;
      if (res.err_code == 0) {
        //百分比
        let progress = Number(res.err_msg.now_num) * 100 / Number(res.err_msg.num);
        let description = '';
        if (res.err_msg.description){
          description = res.err_msg.description.split("↵");
        }
        that.setData({
          pageData: res.err_msg,
          progress,
          description
        })
      }
    },
  userData: function(result) {
    console.log('shujj',result);
    if (result.err_code == 0) {
      if (!result.err_msg.wxapp_member_content) {
        //会员控制项兼容处理
        result.err_msg.wxapp_member_content = {
          "gouwuche": 1,
          "wodeshoucang": 1,
          "wodeshouhou": 1,
          "huiyuanka": 1,
          "lianxikefu": 1,
          "shouhuodizhi": 1,
          "wodeyuyue": 1,
          "tuiguangbendian": 1,
          "wodepintuan": 1,
          "daiyanguanli": 1
        }
      }

      let {
        open_ucenter_show: open_index_show,
        live_code_title,
        live_code_description,
        live_code_logo
      } = result.err_msg.store_config
      let live_code_config = {
        open_index_show,
        live_code_title,
        live_code_description,
        live_code_logo
      }
      let haveShow = false; //我的邀请人显示
      if (result.err_msg.invite_module.show_inviter!=0){
        haveShow =true
      }
      this.setData({
        haveShow,
        live_code_config,
        userData: result.err_msg,
        show_inviter: result.err_msg.invite_module.show_inviter,
        wxapp_member_content: result.err_msg.wxapp_member_content
      })
      wx.stopPullDownRefresh();
    };
  },
  updateInfo: function() {
    wx.showLoading({
      title: "正在更新资料..",
      mask: true
    })

    var that = this;
    wx.getUserInfo({
      success: ({
        userInfo
      }) => {
        console.log(userInfo)
        let url = 'app.php?c=my&a=refreshUserInfo&nickname=' + userInfo.nickName + '&avatar=' + userInfo.avatarUrl;
        common.post(url, '', (res) => {
          wx.hideLoading();
          if (res.err_code == 0) {
            that.setData({
              'userData.user.nickname': userInfo.nickName,
              'userData.user.avatar': userInfo.avatarUrl
            })
            wx.showToast({
              title: res.err_msg,
              icon: 'success',
              duration: 2000
            })
          } else {
            wx.showToast({
              title: res.err_msg,
              icon: 'none',
              duration: 2000
            })
          }
        }, "");
      }
    })
  },
  orderListGo: function(e) { //我的订单列表
    if (!app.isLoginFun(this)) {//判断用户是否登录
      return false;
    }
    
    let id = e.currentTarget.dataset.status;
    wx.navigateTo({
      url: '/pages/user/order/orderList?currentTab=' + id
    })
  },
  mycollageGo: function(e) { //我的拼团
    wx.navigateTo({
      url: '/pages/USERS/pages/myCollage/myCollageList'
    })
  },
  myCollection: function(e) { //我的收藏
    wx.navigateTo({
      url: '/pages/SHOPGOODS/pages/myCollection/index'
    })
  },
  gotoGroupstatus:function(){
        let gotoUrl = '/pages/groupbuying/applytogroup/applytogroup'
        if (this.data.userData.show_community_group!= 0){
          gotoUrl = '/pages/groupbuying/applyform/applystatus'
        }
      wx.navigateTo({
        url: gotoUrl
      })
  },
  addressGo: function(e) { //我的地址
    wx.navigateTo({
      url: '/pages/address/index'
    })
  },
  myServerGo: function(e) { //我的售后
    console.log(e);
    wx.navigateTo({
      url: '/pages/myServer/index'
    })
  },
  openMemberCard() {
    
    let that = this;
    let kaquan = that.data.userData.wx_card;
    if (!kaquan)return;
    let status = kaquan.card_type
    if (status == 1) {// card_type 1 店铺为绑定公众号，跳转到老的页面

    } else if (status == 2) { // card_type 2 未领取会员卡，去微信开卡
      // wx.navigateToMiniProgram({
      //   appId: "wxeb490c6f9b154ef9", // 固定为此appid，不可改动
      //   extraData: kaquan.cardExt, 
      //   success(e) {
      //     console.log(e);
      //   },
      //   fail(err) {
      //     console.log(err);
      //   },
      //   complete(res) {
      //     console.log(res);
      //   }
      // })
      wx.addCard({
        cardList: [
          {
            cardId: kaquan.card_id,
            cardExt: kaquan.cardExt
          }
        ],
        success(res) {
          console.log(res.cardList) // 卡券添加结果
        }
      })

    } else if (status == 3) {// card_type 3 已领取会员卡。打开卡
      wx.openCard({
        cardList: [{
          cardId: kaquan.card_id,
          code: kaquan.code
        }],
        fail({
          errMsg
        }) {
          wx.showToast({
            title: errMsg,
            icon: "none"
          })
        }
      })
     }

  },
  gotoMyMoney() { //去账户页
    let is_show = this.data.userData.my_account.is_show;
    console.log("is_show", )
    if (is_show == 1 && !this.data.userData.is_gift) {
      wx.navigateTo({
        url: '/pages/user/myMoney/myMoney',
      })
    } else if (this.data.userData.show_gift != 0 && this.data.userData.is_gift !=0){
      wx.navigateTo({
        url: '/pages/user/myMoney/myMoney?giftaccunt=true',
      })
    }
    else {
      wx.showModal({
        title: '提示信息',
        content: this.data.userData.my_account.msg ? this.data.userData.my_account.msg:'您还没有账户哦',
        confirmText: '知道了',
        showCancel: false,
        confirmColor: '#fe6b31',
      })
    }
  },
  goToMyFans() { //去粉丝页 
    let urla = '/pages/user/myFans/myFans';
    if (this.data.userData.is_gift && this.data.userData.show_gift!=0){
      urla = '/pages/user/myFans/myFans?type=1'
    }
    wx.navigateTo({
      url: urla,
    })
  },
  //推广海报
  tuiguangHaiBao() {
    wx.navigateTo({
      url: "/pages/coupons/extension"
    })
  },
  onShareAppMessage: function() {
    return getApp().shareGetFans('', '', '/pages/index/index', 2);
  },
  haveAndNo(){
    this.setData({
      haveShow: !this.data.haveShow
    })
  },
  showgroupModal() {
    let data = {
      source:1,
      product_id:'',

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
  grouperScancode(){
    wx.showLoading({
      title: '加载中',
    });
    wx.navigateTo({
      url: '/pages/SHOPGOODS/pages/user/scancode/camera'
    })
        
    // wx.navigateTo({
    //   url: './scancode/scancode',
    // })
    // wx.scanCode({
    //   success(res) {
    //     console.log('扫码结果',res);
    //     if (res.result){
    //       let orderno = res.result;
    //       wx.navigateTo({
    //         url: './scancode/scancode?orderno=' + orderno,
    //       })
    //       // wx.navigateTo({
    //       //   url: '/pages/groupbuying/ordermanagement/ordermanagement?orderno=' + orderno,
    //       // })
    //     }
    //   }
    // })
  },
  // 赋值邀请码
  copyCode: function (e) {
    let codeTxt = e.currentTarget.dataset.code ? e.currentTarget.dataset.code : '';
    wx.setClipboardData({
      data: codeTxt,
      success(res) {
        wx.getClipboardData({
          success(res) {
            wx.showToast({
              title: '复制成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      }
    })

  },
  //isLogin登录

  isLogin:function(e){
    if (!app.isLoginFun(this)) {//判断用户是否登录
      return false;
    }
  },
  getMemberBasicInfo() {    //会员版本---获取当前用户的邀请码
    let unlogin = wx.getStorageSync('unlogin');
    if (unlogin || unlogin === '' || unlogin == 'undefined') return;   //未登录
    
    http.post('getMemberBasicInfo', { userId: app.globalData.my_uid })
    .then(res => {
      if (!res.data) return;
      let { invitationCode } = res.data;
      this.setData({ invitationCode });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }
})