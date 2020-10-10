import http from "../../../utils/http_cps"

Page({
  data: {
    id: "",
    from: "",
    bannerImg: "",
    proListData: null,
    page: 1,
    pageSize: 10,
    sourceIcon: {
      "拼多多": {
        icon: "iconpinduoduo",
        color: "#F40009"
      },
      "京东": {
        icon: "iconjingdong",
        color: "#DD2727"
      }
    }
  },
  onLoad: function (options) {   //页面加载完成
    let { id, from } = options;
    console.log(`------是从【${from}】跳转过来的------id是----${id}`);
    if (id) this.setData({ id, from });
    from == 'banner' ? this.bannerGetListData() : this.channelGetListData();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示

  },
  onHide: function () {  //监听页面隐藏
    
  },
  onPullDownRefresh() {   //下拉刷新
    let { from } = this.data;
    if (from == 'banner'){
      this.bannerGetListData('refresh')
    }else {
      this.setData({ page: 1 });
      this.channelGetListData('refresh')
    }
  },
  onReachBottom: function () {  //上拉加载更多
    let { proListData, page, pageSize, from } = this.data;
    if (from == 'banner') return;   //从轮播图进来的时候，没有分页，所以不加载更多

    let len = proListData.length;
    if (len < pageSize || len%pageSize != 0) return;
    page++;
    this.setData({ page });
    this.channelGetListData();
  },
  bannerGetListData(refresh) {  //从轮播图进来的  获取搜索到的商品列表数据
    let { id } = this.data;
    http.get('theme_goods_cps', { banner_id: id })
    .then(res => {
      if (refresh) wx.stopPullDownRefresh();  //下拉刷新时
      let { theme, goods } = res.data;
      this.setData({ bannerImg: theme.image_url, proListData: goods || [] });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  channelGetListData(refresh) {  //从频道进来的  获取搜索到的商品列表数据
    const me = this;
    let { id, page, pageSize } = this.data;
    let params = {
      page,
      page_size: pageSize
    }
    let isloading = refresh || page > 1 ? true : false;   //下拉刷新 和 加载更多的时候展示Loading
    http.get('channel_goods_cps', params, isloading, `/${id}`)
    .then(res => {
      if (refresh){   //下拉刷新时
        wx.stopPullDownRefresh();
        this.setData({ proListData: [] });
      }

      let { goodsList } = res.data;
      if (!goodsList || !goodsList.length){
        if (page > 1){   //将页数减1，回到上拉之前的值
          page--;
          me.setData({ page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }else {
          me.setData({ proListData: [] });
        }
        return;
      }

      let { proListData } = me.data, newArr = [];
      newArr = proListData ? proListData.concat(goodsList) : [].concat(goodsList);
      this.setData({ proListData: newArr });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  toProductDetail(e){   //去到商品详情页面
    let { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/productCpsDetail/productCpsDetail?goods_id=${id}` });
  }

})