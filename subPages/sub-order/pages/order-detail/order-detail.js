import http from "../../../../utils/http_cps"

Page({
  data: {
    id: "",
    orderDetail: null,
    statusObj: {
      1: "已下单",
      2: "已返现",
      3: "已失效"
    },
    stepDec: {
      0: "订单成团",
      1: "订单支付成功",
      2: "买家已下单"
    }
  },
  onLoad: function (options) {   //页面加载完成
    let { id } = options;
    this.setData({ id });
    this.getDetailData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示

  },
  onHide: function () {  //监听页面隐藏
    
  },
  getDetailData() {
    const me = this;
    let { id } = this.data;
    http.get('orders_detail_cps', {}, false, `/${id}`)
    .then(res => {
      res.data.createtime = wx.$moment(res.data.createtime*1000).format("LT");

      //组装订单追踪的数组  失效订单(status:3)不展示订单追踪
      let { createtime, status } = res.data, orderSteps = [{ step: 0, times: createtime }];   //每个订单都会有第一步： 买家已下单
      if (status >= 1 && status != 3){
        orderSteps.push({ step: 1, times: createtime });
      }
      if (status == 2){
        orderSteps.push({ step: 2, times: createtime });
      }
      res.data.orderSteps = orderSteps;
      me.setData({ orderDetail: res.data });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  toProductDetail(e){   //去到商品详情页面
    let { id } = e.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({ url: `/pages/productCpsDetail/productCpsDetail?goods_id=${id}` });
  }

})