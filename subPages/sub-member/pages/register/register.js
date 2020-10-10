import publicFun from "../../../../utils/public"
import http from "../../../../utils/http"

const app = getApp();
Page({
  data: {
    phoneNumber: "",
    checkCode: "",
    inviteCode: "",
    checkCodeName: "获取验证码",
    timer: null,
    counts: 60,
    showModal: false,
    modalData: {},   //邀请人弹框信息
    isBtn: false
  },
  onLoad: function (options) {   //页面加载完成
    publicFun.setBarBgColor(app, this);// 设置导航条背景色
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    
  },
  onHide: function () {  //监听页面隐藏

  },
  bindinput(e) {
    let { value } = e.detail, { type } = e.target.dataset;
    this.setData({ [type]: value });
  },
  // 获取手机号
  getPhoneNumber: function(e) {
    app.getPhoneNumber(e, this);
  },
  getCodeFun() {    //获取验证码
    const me = this;
    let { phoneNumber } = this.data;
    if (!phoneNumber){
      wx.showToast({ title: '请输入手机号码', icon: "none" });
      return;
    }
    http.post('sendSMS', { phone: phoneNumber })
    .then(res => {
      wx.showToast({ title: '验证码获取成功', icon: "none" });
      me.autotimer();
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  autotimer() {   //调用获取验证码的接口
    let { counts, timer } = this.data;
    clearTimeout(timer);
    if (counts <= 0){
      this.setData({ counts: 60, timer: null, checkCodeName: "获取验证码" });
      return;
    }
    counts--;
    let _t = setTimeout(() => {
      this.autotimer();
    }, 1000)
    this.setData({ counts, timer: _t, checkCodeName: `重新获取${counts}s` });
  },
  checkFun(type) {   //校验方法
    let errOjb = {
      phoneEmpty: "请输入手机号",
      phoneErr: "手机号格式不正确",
      checkCodeEmpty: "请输入验证码",
      inviteCodeEmpty: "请输入邀请码",
    }
    return errOjb[type];
  },
  saveFun() {   //提交注册
    let { phoneNumber, checkCode, inviteCode, isBtn } = this.data, msg = "";

    if (!phoneNumber) msg = this.checkFun('phoneEmpty');
    if (!msg && phoneNumber && phoneNumber.length != 11) msg = this.checkFun('phoneErr');
    if (!msg && !checkCode) msg = this.checkFun('checkCodeEmpty');
    if (!msg && !inviteCode) msg = this.checkFun('inviteCodeEmpty');

    if (msg){
      wx.showToast({ title: msg, icon: "none" });
      return;
    }

    if (isBtn) return;
    this.setData({ isBtn: true });

    //获取邀请人信息
    http.post('checkInvitationInfo', { userId: app.globalData.my_uid, invitationCode: inviteCode })
    .then(res => {
      if (!res.data){
        wx.showToast({ title: '邀请人信息获取失败', icon: "none" });
        this.setData({ isBtn: false });
        return;
      }
      this.setData({ modalData: res.data, isBtn: false, showModal: true });
    })
    .catch(res => {
      this.setData({ isBtn: false });
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  toRegisterFun() {   //确定注册
    let { isBtn } = this.data;
    if (isBtn) return;
    this.setData({ isBtn: true });

    //获取邀请人信息
    let { modalData, phoneNumber, checkCode } = this.data;
    let userinfo = wx.getStorageSync('userinfo');
    if (userinfo) userinfo = JSON.parse(userinfo);
    let params = {
      userId: app.globalData.my_uid,
      memberPhone: phoneNumber,
      nickName: userinfo.nickName || "",
      headImg: userinfo.avatarUrl || "",
      parentMember: modalData.invitationId,
      phoneCode: checkCode
    }
    http.post('registerMember', params)
    .then(res => {
      if (!res.data){
        wx.showToast({ title: '升级失败', icon: "none" });
        this.setData({ isBtn: false });
        return;
      }
      setTimeout(() => {
        wx.showToast({ title: '升级成功', icon: "none" });
        this.setData({ showModal: false, isBtn: false });
        wx.redirectTo({ url: '/pages/membertab/membertab' });  //回到会员页面
      }, 500)
    })
    .catch(res => {
      this.setData({ isBtn: false });
      wx.showToast({ title: res.msg, icon: "none" });
    })
  }

})