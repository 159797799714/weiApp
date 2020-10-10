import http from "../../utils/http"

// 弹框的公共data
const togetherDialogData = {
  commonModalData: {
    showCommonModa: false,
    type: 1,     //1: 首页合作弹框  2:普通弹框(上面图片，下面文字按钮)  3:邀请码填写弹框  4:识别到邀请码弹框  5:受邀成功弹框
    title: "",
    content: "",
    bgImg: "",
    btnText: "",
    showCloseIcon: true,
    invitcode: "",   //邀请码
    invitcodeArr: new Array(6),   //截取后的邀请码 用于展示 
    invitfocus: false,     //邀请码输入框获取焦点
    invitationId: "",     //邀请人id
    invitationName: "",    //邀请人昵称
    avatar: "",    //邀请人头像
    inc_points: ""    //猛犸充电用户近期新增积分
  },
  isClick: false     //防止二次点击
}

// 弹框的公共js
const togetherDialogJs = {
  getClipboardData(invitcode) {   //获取剪切板内容， 弹出搜索弹窗
    const me = this;
    wx.getClipboardData({
      success (res){
        console.log('当前剪切板内容-----', res.data);
        if (invitcode){   //新用户检测邀请码  大写字母+数字 规则
          let splitCode = res.data.replace(/[0-9A-Z]{6}/g, "@@##code##@@");
          let _index = splitCode.indexOf('@@##code##@@');
          let _code = _index != -1 ? res.data.slice(_index, _index+6) : '';
  
          if (_code && /^[0-9A-Z]{6}$/g.test(_code)){   //展示邀请码弹框  再次校验是否符合 大写字母+数字 规则
            me.setData({ 'commonModalData.invitcode': _code });
            me.checkInvitationInfo()
          }else {
            me.setData({
              'commonModalData.showCommonModa': true,
              'commonModalData.type': 3,
              'commonModalData.invitfocus': true
            });
          }
          return;
        }
  
        //搜索商品弹框
        if (!res.data.trim()) return;
        //设置邀请码弹框
        me.setData({
          'commonModalData.showCommonModa': true,
          'commonModalData.type': 2,
          'commonModalData.title': "是否想找以下商品",
          'commonModalData.content': res.data,
          'commonModalData.bgImg': "https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/search_bg.png",
          'commonModalData.btnText': "搜索商品"
        })
      }
    })
  },
  checkInvitationInfo(inputRegister) {   //获取邀请人信息  需要先登录
    const me = this;
    let { invitcode } = this.data.commonModalData;
    let isloading = inputRegister ? true : false;
    http.post('checkInvitationInfo', { userId: getApp().globalData.my_uid, invitationCode: invitcode.toUpperCase() }, isloading)
    .then(res => {
      let { invitationId, invitationName, avatar } = res.data;
      me.setData({
        'commonModalData.invitationId': invitationId,
        'commonModalData.invitationName': invitationName,
        'commonModalData.avatar': avatar
      })
      if (inputRegister){   //手动输入邀请码时请求的
        me.toRegisterFun();
        return;
      }
      me.setData({
        'commonModalData.showCommonModa': true,
        'commonModalData.type': 4
      })
    })
    .catch(res => {   //邀请码无效或者其他问题，让用户手动填写
      if (inputRegister) wx.showToast({ title: res.msg, icon: "none" });   //手动输入邀请码时请求的
      me.setData({
        'commonModalData.showCommonModa': true,
        'commonModalData.type': 3,
        'commonModalData.invitfocus': true,
        'commonModalData.invitcode': '',
        'commonModalData.invitcodeArr': me.setInvitCodeFun('')
      })
    })
  },
  toRegisterFun(merchantCallBack) {   //注册会员 或 接受TA的邀请   merchantCallBack:登录时publick.js中的回调
    const me = this;
    let { my_uid, phoneNum } = getApp().globalData;
    let { invitationId } = this.data.commonModalData;
    let _phoneNumber = wx.getStorageSync('phoneNumber');
    let userinfo = wx.getStorageSync('userinfo');
    if (userinfo) userinfo = JSON.parse(userinfo);

    let params = {
      userId: my_uid,
      memberPhone: _phoneNumber || phoneNum || userinfo.phone,
      nickName: userinfo.nickName || "",
      headImg: userinfo.avatarUrl || "",
      parentMember: merchantCallBack ? userinfo.agent_vip : invitationId    //代理商逻辑：充电用户暂时挂载小柱名下
    }
    http.post('registerMember', params, true)
    .then(res => {
      if (!merchantCallBack){
        me.setData({ 
          isClick: false,
          'commonModalData.showCommonModa': true,
          'commonModalData.type': 5,
          'commonModalData.invitcode': '',
          'commonModalData.invitcodeArr': me.setInvitCodeFun('')
        })
      }else {
        merchantCallBack && merchantCallBack();
      }
      me.completeFun('register_success');
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
      if (merchantCallBack){
        merchantCallBack && merchantCallBack();
        return;
      }
      me.setData({ 
        isClick: false,
        'commonModalData.showCommonModa': true,
        'commonModalData.type': 3,
        'commonModalData.invitcode': '',
        'commonModalData.invitcodeArr': me.setInvitCodeFun('')
      })
    })
  },
  reInputCodeFun() {   //TA不是我的邀请人
    this.setData({ 
      'commonModalData.showCommonModa': true,
      'commonModalData.type': 3,
      'commonModalData.invitfocus': true,
      'commonModalData.invitcode': "",
      'commonModalData.invitcodeArr': this.setInvitCodeFun('')
    })
  },
  acceptCodeFun() {   //接受TA的邀请 / 进行注册
    let { isClick } = this.data;
    if (isClick) return;
    this.setData({ isClick: true });
    this.toRegisterFun();
  },
  toManageModal(e) {    //点击弹框按钮   搜索商品
    let { key } = e.currentTarget.dataset;
    this.setData({ 'commonModalData.showCommonModa': false });
    //判断用户是否登录 没有就弹登录弹框
    if (key == "button"){
      if (!this.isLogin()) return;   //校验是否登录
    }
    if (key == 'invsuccess') {    //受邀成功时的弹窗
      return;
    }
    let { content } = this.data.commonModalData;
    wx.navigateTo({ url: `/subPages/sub-search/search/search?keywords=${content}` });
  },
  toCancleTogether(e) {   //关闭首页合作/商品搜索 弹框
    let { key } = e.currentTarget.dataset;
    //设置邀请码弹框
    this.setData({ 'commonModalData.showCommonModa': false });
    if (key == 'unlogin'){    //授权昵称头像
      console.log('首页授权弹框---点击了昵称头像授权按钮--------');
      wx.showLoading({ title: '正在登录', mask: true });
      return;
    }
    if (key == "icon") return;
    if (!this.isLogin()) return;   //校验是否登录
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
    let { key } = e.currentTarget.dataset, { value } = e.detail;
    if (key == 'invitcode'){   //邀请码
      //设置邀请码弹框
      value = value.replace(/[^0-9A-Za-z]/g, "")   //只能输入数字及大小写字母
      this.setData({ 
        'commonModalData.invitcode': value,
        'commonModalData.invitcodeArr': this.setInvitCodeFun(value)
      })
      if (value.length == 6){    //输完6个邀请码之后 就检查当前邀请码是否存在
        setTimeout(() => {
          this.checkInvitationInfo('inputRegister');
        }, 500)
      }
      return;
    }
    this.setData({ [key]: value });
  }, 
  bindfocus(e) {   //邀请码弹框 获取焦点
    this.setData({ 'commonModalData.invitfocus': true });
  },
  bindblur(e) {   //邀请码弹框 失去焦点
    this.setData({ 'commonModalData.invitfocus': false });
  },
  jumpFun() {  //跳过验证码输入
    this.setData({ 'commonModalData.showCommonModa': false });
    this.completeFun('jumpFun');
  },
  completeFun(type) {    //方法执行完毕的回调函数

  }
}


module.exports = { togetherDialogData, togetherDialogJs };
