import publicFun from "../../../../utils/public"
import http from "../../../../utils/http"

const app = getApp();
Page({
  data: {
    points: 320,
    method: 0,
    methodsList: ["支付宝", "银行卡"],
    aliypayAccount: "",
    bankNum: "",
    bankOffer: "",
    bankAddress: "",
    curbank: "",
    bankList: [],
    counts: "",
    isSave: false,
    countsMax: 10
  },
  onLoad: function (options) {   //页面加载完成
    let { points } = options;
    this.setData({ points: points || 0 })
    publicFun.setBarBgColor(app, this);// 设置导航条背景色
    this.getBanks();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    
  },
  onHide: function () {  //监听页面隐藏

  },
  getBanks() {   //获取发卡银行列表
    const me = this;
    http.post('getBanks', {})
    .then(res => {
      me.setData({ bankList: [] });
      if (!res.data || !res.data.length) return;
      let _list = res.data.reduce((_newArr, item) => {
        _newArr.push(item.name);
        return _newArr;
      }, [])
      this.setData({ bankList: _list });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  initData() {    //初始化数据
    this.setData({
      aliypayAccount: "",
      bankNum: "",
      bankOffer: "",
      bankAddress: "",
      curbank: ""
    })
  },
  bindDateChange(e) {   //选择picker
    let { value } = e.detail;
    let { type } = e.currentTarget.dataset;
    this.setData({ [type]: value });
    if (type == 'method') this.initData();    //切换选择方式时需要初始化数据
  },
  bindKeyInput(e) {   //输入框值变动时触发
    let { key } = e.currentTarget.dataset, { value } = e.detail;
    
    let countsMax = 10;
    if (key == 'counts'){   //通过长度限制小数位数为2位, 找到.的第一个下标为0， 如果全是整数返回-1， +3就等于2  3表示: .和2位小数的长度
      let _max = (value + '').indexOf('.') + 3;
      if (_max != 2){
        countsMax = _max    //有小数，长度为： 整数+.+小数
      }
    }
    console.log('提现积分总长度为----', countsMax);
    this.setData({ [key]: value, countsMax });
  },
  checkFun(type) {   //校验方法
    let { points } = this.data;
    let errOjb = {
      aliypayAccount: "请输入支付宝账号",
      bankNum: "请输入银行卡号",
      bankOffer: "请输入持卡人姓名",
      bankAddress: "请输入开户行",
      curbank: "请选择发卡银行",
      counts: "兑换数量不能为空",
      countsMax: `最多只能兑换${points}积分`
    }
    return errOjb[type];
  },
  saveFun() {  //立即兑换
    let { method, aliypayAccount, bankNum, bankOffer, bankAddress, bankList, curbank, counts, points, isSave } =  this.data, msg = "";
    if (method == 0){  //支付宝方式
      if (!aliypayAccount) msg = this.checkFun('aliypayAccount');
    }
    if (method == 1){  //银行卡方式
      if (!bankNum) msg = this.checkFun('bankNum');
      if (!msg && !bankOffer) msg = this.checkFun('bankOffer');
      if (!msg && !bankAddress) msg = this.checkFun('bankAddress');
      if (!msg && !curbank) msg = this.checkFun('curbank');
    }
    if (!msg && !counts && (counts+'') != '0') msg = this.checkFun('counts');
    if (!msg && counts && +counts > +points) msg = this.checkFun('countsMax');

    if (msg){
      wx.showToast({ title: msg, icon: "none" });
      return;
    }

    if (isSave) return;
    this.setData({ isSave: true });

    let params = {
      userId: app.globalData.my_uid,
      pointsValue: +counts,
      applyType: +method + 1,   //1:支付宝   2:银行卡
      account: method == 0 ? aliypayAccount : bankNum
    }
    if (method == 1){   //银行卡
      params.userName = bankOffer,
      params.bankName = bankList[curbank],
      params.bankAddress = bankAddress
    }

    http.post('applyPointsExchange', params)
    .then(res => {
      this.setData({ isSave: false });
      if (!res.data){
        wx.showToast({ title: "积分兑换失败", icon: "none" });
        return;
      }
      wx.showToast({ title: "积分兑换成功", icon: "none" });
      let timers = setTimeout(() => {
        if (timers) clearTimeout(timers);
        wx.navigateTo({ url: `/subPages/sub-integral/pages/integral-detail/integral-detail` });
      }, 1000)
    })
    .catch(res => {
      this.setData({ isSave: false });
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }

})