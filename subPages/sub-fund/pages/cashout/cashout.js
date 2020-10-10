import http from "../../../../utils/http_cps"

Page({
  data: {
    totlaMoney: 0,
    has_cashed_today: 0,   //今日是否已经提现过次数  0:未提  1:已提1次
    balance: "",
    isFocus: false,
    countsMax: 10,
    unAllowed: true,
    isShowModal: false
  },
  onLoad: function (options) {   //页面加载完成
    this.getCashoutTotal();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示

  },
  onHide: function () {  //监听页面隐藏
    
  },
  bindfocus() {    //输入框获取焦点
    this.setData({ isFocus: true });
  },
  bindblur() {   //输入框失去焦点时
    this.setData({ isFocus: false });
  },
  bindKeyInput(e) {   //输入框值变动时触发
    let { key } = e.currentTarget.dataset, { value } = e.detail;
    
    let countsMax = 10;
    if (key == 'balance'){   //通过长度限制小数位数为2位, 找到.的第一个下标为0， 如果全是整数返回-1， +3就等于2  3表示: .和2位小数的长度
      let _max = (value + '').indexOf('.') + 3;
      if (_max != 2){
        countsMax = _max    //有小数，长度为： 整数+.+小数
      }
    }
    console.log('提现金额总长度为----', countsMax);
    this.setData({ [key]: value, countsMax });
    this.checkInput();
  },
  checkInput() {   //输入框校验
    let { balance, totlaMoney } = this.data;
    this.setData({ unAllowed: !balance || balance < 1 || balance > totlaMoney ? true : false });
  },
  cashoutAll() {   //提现所有
    let { totlaMoney } = this.data;
    this.setData({ balance: totlaMoney });
    this.checkInput();
  },
  getCashoutTotal() {   //获取可提现金额
    http.get('balance_info_cps', {})
    .then(res => {
      let { balance, has_cashed_today } = res.data;
      this.setData({ totlaMoney: balance/100 || 0, has_cashed_today });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  saveFun() {    //立即提现
    let { balance } = this.data;
    http.get('withdraw_cps', { money: balance*100 })
    .then(res => {
      let { balance } = res.data;
      this.setData({ totlaMoney: balance/100 || 0, isShowModal: true });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  toMakesure() {   //弹窗确定按钮
    this.setData({ isShowModal: false });
  }

})