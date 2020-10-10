import http from "../../utils/http"

const app = getApp();
Page({
  data: {
    isClick: false
  },
  onLoad: function (options) {   //页面加载完成
    
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示

  },
  onHide: function () {  //监听页面隐藏
    
  },
  clickPhoneFun() {
    let { isClick } = this.data;
    if (isClick) return;
    this.setData({ isClick: true });
  },
  bindgetphonenumber(e) {   //获取手机号码   授权完成后 返回上一个页面
    app.getPhoneNumber(e, this, (res) => {
      this.setData({ isClick: false });
      if (res == 'error') return;   //拒绝授权或者授权失败

      wx.setStorageSync('success_getphone', true);
      this.bindMerchantFun();
    })
  },
  bindMerchantFun() {
    //从充电小程序过来的--->没有手机号码的用户，查询-->普通用户以下自动注册
    let _userinfo = wx.getStorageSync('userinfo');
    if (_userinfo) _userinfo = JSON.parse(_userinfo);
    
    let _mid = getApp().globalData.mid || '', { uid, is_open } = _userinfo;
    if (!_mid || !is_open){
      wx.navigateBack();
      return;
    }
    
    http.post('getMemberInfo', { userId: uid }, true)
    .then(res => {
      let { memberGrade } = res.data;
      if (memberGrade < 1){
        console.log('手机授权----充电用户-----', _mid, '----当前级别----', memberGrade, '----自动注册----');
        this.toRegisterFun(_userinfo);
      }
    })
    .catch(res => {
      wx.navigateBack();
    })
  },
  toRegisterFun(userinfo) {   //注册会员 或 接受TA的邀请
    let { my_uid, phoneNum } = getApp().globalData;
    let _phoneNumber = wx.getStorageSync('phoneNumber');

    let params = {
      userId: my_uid || userinfo.uid,
      memberPhone: _phoneNumber || phoneNum || userinfo.phone,
      nickName: userinfo.nickName || "",
      headImg: userinfo.avatarUrl || "",
      parentMember: userinfo.agent_vip    //代理商逻辑：充电用户暂时挂载小柱名下  后台配置userinfoagent_vip
    }
    http.post('registerMember', params, true)
    .then(res => {
      console.log('代理商下级用户自动注册------成功------');
      wx.navigateBack();
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
      console.log('代理商下级用户自动注册------失败------');
      wx.navigateBack();
    })
  }

})