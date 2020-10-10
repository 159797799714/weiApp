var app = getApp();
Page({
  data: {
    currentTab: '',
    currentTabShop: '',
    cfrom: '',
    type: '',    // reply为退款， pay为购买支付
    alertInfo: '',
    memberGrade: 0,
    vipWord: ''
  },

  
  onLoad: function(e) { // 页面渲染完成
    // wx.setNavigationBarColor({
    //   frontColor: '#333333',
    //   backgroundColor: '#ffffff'
    // });
    

    console.log('onLoad接收到,  e', e)

    // 申请退款成功
    if(e.type == 'replySuccess') {
      wx.setNavigationBarTitle({
        title: '申请退款'
      });
      this.setData({
        type: 'reply'
      })
      return
    }
    // 购买自营商品支付成功
    if(e.type== 'paySuccess') {
      wx.setNavigationBarTitle({
        title: '支付成功'
      });
      console.log('xxxxxxxxxxx')


      this.setData({
        type: 'pay',
        vipWord: e.memberGrade < 2? '开通': '续期',
        currentTab: e.currentTab? e.currentTab: 'all',
        currentTabShop: e.currentTabShop? e.currentTabShop: '',
        cfrom: e.cfrom? e.cfrom: ''
      })  
    }

  },
  onShow(){

    let that=this;
  },
  onlaunch: function (e) {
    var that=this;
  },
  lookOrder() {
    let currentTab= this.data.currentTab,
      currentTabShop= this.data.currentTabShop,
      cfrom= this.data.cfrom;
    wx.redirectTo({
      url: '/pages/user/order/orderList?currentTab=all&currentTabShop=' + currentTabShop + '&cfrom=' + cfrom
    });
  }
  
})
