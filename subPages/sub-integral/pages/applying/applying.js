import publicFun from "../../../../utils/public"
import http from "../../../../utils/http"

const app = getApp();
Page({
  data: {
    listData: [],
    page: 1, 
    pageSize: 10,
    convertType: {
      1: "支付宝",
      2: "银行卡"
    }
  },
  onLoad: function (options) {   //页面加载完成
    publicFun.setBarBgColor(app, this);// 设置导航条背景色
    this.getApplyingList();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    
  },
  onHide: function () {  //监听页面隐藏

  },
  onPullDownRefresh: function () {   // 监听用户下拉动作
    this.setData({ page: 1 });
    this.getApplyingList('refresh');
  },
  onReachBottom() {   //触底上拉加载更多
    let { listData, page, pageSize } = this.data;
    let len = listData.length;
    if (len < pageSize || len%pageSize != 0) return;
    page++;
    this.setData({ page });
    this.getApplyingList();
  },
  getApplyingList(refresh) {    //获取申请中列表数据
    const me = this;
    let { page, pageSize } = this.data;  
    http.post('queryPointsApplyList', { userId: app.globalData.my_uid, page, pageSize })
    .then(res => {
      if (refresh) {
        me.setData({ listData: [] });
        wx.stopPullDownRefresh();
      }
      if (!res.data || !res.data.records || !res.data.records.length){
        if (page > 1){
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }
        return;
      }

      let { listData } = me.data;
      me.setData({ listData: listData.concat(res.data.records) });
    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //停止下拉刷新
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }

})