import http from "../../utils/http"

let giftPage = {

  getGiftListData(me, refresh) {   //获取礼包商品列表数据
    let { merchantId, page, pageSize } = me.data;
    
    http.post('getGiftLists', { merchantId, page, pageSize })
    .then(res => {
      if (refresh){   //下拉刷新
        me.setData({ giftListData: [] });
        wx.stopPullDownRefresh();
      }

      if (!res.data || !res.data.records || !res.data.records.length){
        if (page > 1) {
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }
        return;
      }

      let { giftListData } = me.data;
      giftListData = giftListData.concat(res.data.records);
      me.setData({ giftListData });

    })
    .catch(res => {
      if (refresh) wx.stopPullDownRefresh();   //下拉刷新
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }

}


module.exports = giftPage