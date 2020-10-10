import publicFun from "../../utils/public"
import http from "../../utils/http"

const app = getApp();
Page({
  data: {
    showtype: '',   //是否手动输入邀请码   1:手动输入   2:展示邀请人
    invitcode: "",    //邀请码
    invitationId: "",   //邀请人id
    invitfocus: false,
    nickName: '',    //邀请人用户昵称
    headImg: '',      //邀请人用户头像
    invitcodeArr: new Array(6),   //截取后的邀请码 用于展示 
    from: '',    //从首页 / cps商品详情 / 小猪CMS商品详情 页面进来的
    isReq: false
  },
  onLoad: function (options) {   //页面加载完成
    console.log('分享授权页----分享者uid-----', app.globalData.share_uid);
    let { from, goods_id, share_uid, shareType } = options;

    share_uid = share_uid || app.globalData.share_uid || '';
    shareType = shareType || app.globalData.shareType || 2;
    goods_id = goods_id || app.globalData.cps_goods_id || '';
    from = from || app.globalData.cps_from || ''

    app.globalData.cps_from = from;
    app.globalData.cps_goods_id = goods_id;

    this.setData({ from, invitationId: app.globalData.share_uid || share_uid });   //邀请人id

    publicFun.onLoad(app, this);  //授权弹框提前注册
    app.wxloginMethods()   //新用户手机授权之前先刷新登录态

    this.getMemberBasicInfo();
  },
  onReady: function () {  //页面初次渲染完成

  },
  onShow: function () {  //监听页面显示
    this.isLogin(1);   //检测是否登录
    wx.removeStorageSync('jumpeAuth');   //清除跳过授权标识
    
    //从手机授权成功页面跳转来的, 执行下一步操作
    let _suc = wx.getStorageSync('success_getphone');
    if (_suc) this.successGetPhoneCallback();
  },
  onHide: function () {  //监听页面隐藏
    
  },
  isLogin(type) {   //判断用户是否登录
    if (!type || typeof type != 'number'){
      return app.isLoginFun(this);
    }
    app.isLoginFun(this, type);//判断用户是否登录
  },
  toGetPhonenumAuth() {    //去到手机授权页面
    let { isReq, _has_phone, showtype, invitcode } = this.data;
    if (isReq) return;

    if (showtype == 1){
      let msg = !invitcode ? '请输入邀请码' : (invitcode.length != 6 ? '邀请码不正确' : '');
      if (msg) wx.showToast({ title: msg, icon: "none" });
      return;
    }

    _has_phone = _has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
    if (_has_phone){   //有手机号码
      this.toRegisterFun();
      return;
    }
      
    wx.navigateTo({ url: "/pages/getPhoneNumPage/getPhoneNumPage" });
  },
  successGetPhoneCallback(e) {   //获取手机号码获取成后执行的操作
    wx.removeStorageSync('success_getphone');
    let _change_invitcode = wx.getStorageSync('change_invitcode');
    if (_change_invitcode){   //点击换个邀请码，登录-->授权手机号码后，不自动注册，切换到换邀请码弹窗
      wx.removeStorageSync('change_invitcode');
      return
    }

    if (this.data.showtype != 2) return;

    this.setData({ isReq: true });
    this.toRegisterFun();    //注册
  },
  setInvitCodeFun(value) {    //处理输入的邀请码的方法
    let invitcodeArr = [];
    for (var i=0; i<6; i++){
      var code = value.substr(i, 1);
      invitcodeArr.push(code || "");
    }
    return invitcodeArr;
  },
  bindKeyInput(e) {   //填写邀请码输入框值变动
    let { value } = e.detail;
    value = value.replace(/[^0-9A-Za-z]/g, "")   //只能输入数字及大小写字母
    this.setData({ 
      invitcode: value,
      invitcodeArr: this.setInvitCodeFun(value)
    })
    if (value.length == 6){    //输完6个邀请码之后 就检查当前邀请码是否存在
      let _change_invitcode = wx.getStorageSync('change_invitcode');
      if (_change_invitcode) wx.removeStorageSync('change_invitcode');   //点击换个邀请码，登录-->授权手机号码后，不自动注册，切换到换邀请码弹窗

      setTimeout(() => {
        this.checkInvitationInfo();
      }, 500)
    }
  }, 
  bindfocus(e) {   //邀请码弹框 获取焦点
    this.setData({ invitfocus: true });
  },
  bindblur(e) {   //邀请码弹框 失去焦点
    this.setData({ invitfocus: false });
  },
  getMemberBasicInfo() {    //通过分享者的uid获取邀请人信息  不需要先登录也可以调用
    http.post('getMemberBasicInfo', { userId: app.globalData.share_uid })
    .then(res => {
      let { invitationCode, nickName, headImg } = res.data;
      this.setData({ showtype: 2, invitcode: invitationCode, nickName, headImg });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  checkInvitationInfo() {   //获取邀请人信息
    let { invitcode } = this.data;
    http.post('checkInvitationInfo', { userId: app.globalData.share_uid, invitationCode: invitcode }, true)
    .then(res => {
      let { invitationId, invitationName, avatar } = res.data;
      this.setData({
        showtype: 2,
        invitationId,
        nickName: invitationName,
        headImg: avatar
      })
    })
    .catch(res => {   //邀请码无效或者其他问题，让用户手动填写
      wx.showToast({ title: res.msg, icon: "none" });
      this.setData({ showtype: 1, invitcode: '', invitcodeArr: new Array(6), invitfocus: true });
    })
  },
  toRegisterFun() {   //注册会员 或 接受TA的邀请
    let { invitationId } = this.data;
    let { my_uid, phoneNum } = app.globalData;
    let _phoneNumber = wx.getStorageSync('phoneNumber');
    let userinfo = wx.getStorageSync('userinfo');
    if (userinfo) userinfo = JSON.parse(userinfo);

    let params = {
      userId: my_uid,
      memberPhone: _phoneNumber || phoneNum || userinfo.phone,
      nickName: userinfo.nickName || "",
      headImg: userinfo.avatarUrl || "",
      parentMember: invitationId
    }
    http.post('registerMember', params, true)
    .then(res => {
      wx.showToast({ title: res.msg, icon: "none" });
      this.setData({ isReq: false });
      this.toback('register');
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
      this.setData({ isReq: false });
      this.toback('register');
    })
  },
  changecodeFun() {   //想换个邀请码
    wx.setStorageSync('change_invitcode', true);   //点击了换个邀请码
    if (!this.isLogin()) return;   //校验是否登录
    let { showtype, isReq } = this.data;
    if (isReq) return;
    
    if (showtype == 2 || showtype == '') showtype = 1;
    this.setData({ 
      showtype, 
      invitcode: '', 
      invitationId: '',
      invitcodeArr: new Array(6), 
      invitfocus: true,
      nickName: '',
      headImg: '',
    })
  },
  toback(register) {   //跳过此步，直接登录   首页 / 商品详情（cms商品详情、cps商品详情、秒杀商品详情）
    let { from, isReq } = this.data;
    if (isReq) return;
    wx.setStorageSync('jumpeAuth', true);   //给个标识，在其他页面就不再弹授权弹框了

    if (from == 'detail' || from == 'cms_detail' || from == 'seckill_detail'){
      let _url = from == 'cms_detail' ? '/pages/product/details' : (from == 'detail' ? '/pages/productCpsDetail/productCpsDetail' : '/pages/seckill/index');
      wx.redirectTo({ url: _url });
    }else {
      wx.switchTab({ url: "/pages/index/index" });
    }
  }

})