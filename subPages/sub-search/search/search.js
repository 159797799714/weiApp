import http from "../../../utils/http_cps"

Page({
  data: {
    keywords: "",
    isfocus: true,
    showProducts: false,    //是否搜索了商品
    historyData: [],
    curtab: 0,
    isSortUp: false,    //价格是否升序排序
    isCustomSwitch: true,   //是否搜索优惠券商品 开关
    proListData: null,    //商品列表数据
    page: 1,
    pageSize: 10,
    hasFictitious: 0,    //当前页面数据含有 虚拟支付商品的个数
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
    let { keywords } = options;
    if (keywords){    //获取到了剪切板上面的内容去搜索
      this.setData({ keywords, showProducts: true, isfocus: false });
      this.setStorageHistory();
    }else{
      this.getHistoryData();
    }
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    let { showProducts } = this.data;
    this.setData({ isfocus: showProducts ? false : true });
  },
  onHide: function () {  //监听页面隐藏
    
  },
  onReachBottom: function () {  //上拉加载更多
    let { proListData, page, pageSize, hasFictitious } = this.data;
    let len = proListData.length;
    if ((len + hasFictitious) < pageSize || ((len + hasFictitious) < pageSize && (len + hasFictitious)%pageSize != 0)) return;
    page++;
    this.setData({ page });
    this.getProductListData();
  },
  clearInput() {   //清空输入框
    console.log('商品搜索--点击了清空输入框-------');
    this.setData({ keywords: "", isfocus: false, showProducts: false, proListData: null, curtab: 0, isSortUp: false, isCustomSwitch: true, page: 1 });
  },
  bindKeyInput(e) {   //输入框值变动时触发
    let { key } = e.currentTarget.dataset, { value } = e.detail, { keywords } = this.data;
    this.setData({ [key]: value || keywords });
  },
  bindfocus() {   //输入框获取焦点时
    this.setData({ isfocus: true });
  },
  bindblur() {   //输入框失去焦点时
    this.setData({ isfocus: false });
  },
  bindconfirm() {   //点击完成按钮时触发   将当前搜索内容加入到历史记录中
    this.setData({ isfocus: false });
    this.setStorageHistory();
  },
  setStorageHistory() {    //处理缓存的历史记录
    let { keywords } = this.data;
    if (keywords && keywords.trim()){
      let searchHistory = wx.getStorageSync('searchHistory');
      searchHistory = searchHistory ? JSON.parse(searchHistory) : [];

      //如果历史记录有当前keywords，去掉并将当前的加入到最前面
      let _in = searchHistory.indexOf(keywords);
      if (_in != -1) searchHistory.splice(_in, 1);

      searchHistory.unshift(keywords.trim());
      if (searchHistory.length > 10) searchHistory = searchHistory.slice(0, 10);
      wx.setStorageSync('searchHistory', JSON.stringify(searchHistory));
      this.setData({ historyData: searchHistory });
    }
    
    this.setData({ showProducts: true });
    this.getProductListData('search');
  },
  deleteHistory() {   //清空历史记录
    this.setData({ historyData: [] });
    wx.removeStorageSync('searchHistory');
  },
  getHistoryData() {    //获取历史记录
    let searchHistory = wx.getStorageSync('searchHistory');
    searchHistory = searchHistory ? JSON.parse(searchHistory) : [];
    this.setData({ historyData: searchHistory });
  },
  searchByHistory(e) {   //点击历史记录搜索
    let { key } = e.target.dataset;
    this.setData({ keywords: key, showProducts: true });
    this.setStorageHistory();
  },
  filterProFun(e) {   //点击tab筛选商品
    let { tab } = e.currentTarget.dataset, { isSortUp } = this.data;
    isSortUp = tab == 2 ? !isSortUp : false;   //价格升序/降序
    this.setData({ curtab: tab, isSortUp, page: 1 });
    this.getProductListData('tabs');
  },
  changeCustomSwitch(e) {    //切换展示优惠券 开关
    let { value } = e.detail;
    this.setData({ isCustomSwitch: value, page: 1 });
    this.getProductListData('switch');
  },
  getProductListData(cur) {   //获取搜索到的商品列表数据
    const me = this;
    let { keywords, curtab, isSortUp, isCustomSwitch, page, pageSize } = this.data;
    let params = { 
      with_coupon: isCustomSwitch ? 1 : 0,
      page, 
      page_size: pageSize 
    }
    if (keywords) params.keyword = keywords;

    //销量默认降序排列   价格：点击后价格升序排序，再次点击后降序排序
    //处理sort_type: 0:综合排序   5:按销量升序  6:按销量降序  9:价格升序  10:价格降序
    params.sort_type = curtab == 0 ? curtab : (curtab == 1 ? 6 : (isSortUp ? 9 : 10));

    http.get('goods_search_cps', params, true)
    .then(res => {
      let { goods_list } = res.data;
      if (cur) me.setData({ proListData: null, hasFictitious: 0 });
      
      if (!goods_list || !goods_list.length){
        if (page > 1){   //将页数减1，回到上拉之前的值
          page--;
          me.setData({ page });
          wx.showToast({ title: "没有更多数据了", icon: "none" });
        }else {
          me.setData({ proListData: [], hasFictitious: 0 });
        }
        return;
      }

      let { proListData } = me.data, _fic = 0, filArr = [], newArr = [];
      this.setData({ hasFictitious: 0 });   //开始之前，先初始化虚拟支付数量
      goods_list.forEach((item, index) => {    //过滤虚拟商品  is_show:  0:是虚拟支付商品   1:不是虚拟支付商品
        if (!item.is_show){   //是虚拟支付商品
          _fic++;
        }else  {
          filArr.push(item);
        }
      })
      console.log(`当前第【${page}】页，含有----【${_fic}】个虚拟商品`);

      //当前页全部是虚拟支付商品，就重新请求一次，第二次还是全部的虚拟支付商品，就不再请求了
      if (!filArr.length){   
        if (cur != 'fictitious'){
          page++;
          this.setData({ page, hasFictitious: 0 });
          this.getProductListData('fictitious');
          return;
        }
        this.setData({ page: 1 });
      }

      newArr = proListData ? proListData.concat(filArr) : [].concat(filArr);
      this.setData({ proListData: newArr, hasFictitious: _fic });
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