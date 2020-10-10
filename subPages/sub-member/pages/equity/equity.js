import publicFun from "../../../../utils/public"
import http from "../../../../utils/http"

const app = getApp();
Page({
  data: {
    member: "",    //当前会员等级: 0:普通用户   1:普通会员   2:VIP会员   3/4:更高级别会员
    roleName: "",   //当前会员级别名称
    ownlist: [{
      id: 1,
      image: "https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/own_1.png",
      info: "免费推广素材"
    },{
      id: 2,
      image: "https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/own_2.png",
      info: "直播间推广收益"
    },{
      id: 3,
      image: "https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/own_3.png",
      info: "免费培训"
    }],
    equityDatas: {
      shoppingRewards: [0, 0, 0],
      shareRewards: [0, 0, 0],
      giftRewards: [0, 0, 0]
    }
  },
  onLoad: function (options) {   //页面加载完成
    let { member, roleName } = options;
    console.log('member--',member, '----roleName-----', roleName);
    this.setData({ member, roleName });

    publicFun.setBarBgColor(app, this);// 设置导航条背景色
    this.getMemberRewards();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    
  },
  onHide: function () {  //监听页面隐藏

  },
  onPullDownRefresh: function () {   // 监听用户下拉动作
    this.getMemberRewards('refresh');
  },
  getMemberRewards(refresh) {   //获取会员权益页面
    let { token } = wx.getExtConfigSync();   //获取第三方平台自定义数据
    http.post('getMemberRewards', { merchantId: app.globalData.store_id ? app.globalData.store_id : token })
    .then(res => {
      if (!res.data) return;    //普通用户 返回null

      let { shoppingRewards, shareRewards, giftRewards } = res.data;
      this.setData({
        'equityDatas.shoppingRewards': shoppingRewards && shoppingRewards.length ? shoppingRewards : [0, 0, 0],
        'equityDatas.shareRewards': shareRewards && shareRewards.length ? shareRewards : [0, 0, 0],
        'equityDatas.giftRewards': giftRewards && giftRewards.length ? giftRewards : [0, 0, 0]
      })
      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }

})