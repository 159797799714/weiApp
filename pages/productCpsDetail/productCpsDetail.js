import publicFun from "../../utils/public"
import common from "../../utils/common"
import canvas from "../../utils/canvas"
import canvasFun from "../../utils/canvas-post"
import http_cps from "../../utils/http_cps"
import http from "../../utils/http"
import APIHOST from "../../utils/LOCK"
import API from "../../utils/api"
import { toPx } from "../../utils/util"
import { togetherDialogData, togetherDialogJs } from "../../template/together-dialog/together-dialog"

const app = getApp();
Page({
  data: {
    bannerIndex: 0,   //当前轮播图下标
    goods_id: "",
    bannerList: null,    //页面banner
    detailData: null,    //商品详情对象
    miniAppInfo: {},    //要跳转的目标小程序
    shareModalNode: null,   //底部分享弹框节点
    creatingPost: false,    //生成海报 防止二次点击
    qrcodePath: "",       //获取的商品详情页面二维码地址
    canvasData: null,     //canvas绘图的数据
    canvasPosition: null,   //canvas尺寸的数据
    canvasImg: "",     //生成的最终海报路径
    showPlaybill: false,
    modalData: {
      isShowModal: false,
      title: "温馨提示",
      content: "",
      cancelText: "取消",
      sureText: "确定"
    },
    productImageForCanvas: "",    //用做海报的商品图片
    memberGrade: 0,   //会员信息: 0:普通用户  1:普通会员   2: VIP会员   3/4: VIP以上会员
    sourceIcon: {
      "拼多多": {
        icon: "iconpinduoduo",
        color: "#F40009"
      },
      "京东": {
        icon: "iconjingdong",
        color: "#DD2727"
      }
    },
    haspro: true,   //是否有库存
    isCurEnter: '',
    ...togetherDialogData
  },
  onLoad: function (options) {   //页面加载完成
    console.log('app.globalData分享者是------', app.globalData.share_uid, '--------商品详情的参数------', options);
    let { goods_id, share_uid, shareType, scene, room_id, custom_params, cps_option, cps_type } = options;
    let isCurEnter = scene ? true : (share_uid ? true : false);   //当前页面是否为主入口

    share_uid = share_uid || app.globalData.share_uid || '';
    shareType = shareType || app.globalData.shareType || 2;
    goods_id = goods_id || app.globalData.cps_goods_id || '';
    
    if (room_id && custom_params){   //从直播间的商品跳转过来的  获取分享者的uid
      let _custom_params = JSON.parse(decodeURIComponent(custom_params));
      share_uid = _custom_params.share_uid;
      console.log('custom_params-------', _custom_params, '---share_uid---', share_uid);

    }else if (scene && scene != 'wxapp'){    // 首页扫码进入判断
      let _scene = decodeURIComponent(scene);
      console.log("扫码的二维码参数----------", _scene);
      if (!_scene) return;

      //扫码分享记录
      let scene_arr = _scene.split(',');
      goods_id = scene_arr[1];
      share_uid = scene_arr[3] || ''; // 分享人uid
      shareType = 2;
    }
    //拉粉注册分享人id  分享来源1商品 2本店推广；
    app.globalData.share_uid = share_uid || '';
    app.globalData.shareType = shareType || 2;
    app.globalData.cps_goods_id = goods_id;
    this.setData({ goods_id, isCurEnter });

    publicFun.onLoad(app, this);  //授权弹框提前注册

    //用户通过分享进入，改变分享者的积分任务状态
    if (share_uid&&cps_option&&cps_type) this.babyUserStatusChange(share_uid, cps_option, cps_type);

    //判断是否需要进行新用户权限校验
    let unlogin = wx.getStorageSync('unlogin')
    if ((unlogin || unlogin == '') && share_uid){
      app.initLoginFun(this.checkUserType);    //进入页面登录判断用户是否为注册用户
    }

    this.getDetailData();

  },
  onReady: function () {  //页面初次渲染完成
    // 获得dialog组件
    let _dialog = this.selectComponent("#shareModal");
    this.setData({ shareModalNode: _dialog });
    console.log('获得dialog组件2', this._dialog);
  },
  onShow: function () {  //监听页面显示
    this.isLogin(1)  //判断用户是否登录

    this.getIncomeData();
    this.getMiniappData();

    //新手日常任务 好礼页面--  5:浏览商品
    let _op = wx.getStorageSync('optionObj');
    _op = _op ? JSON.parse(_op) : null;
    if (_op && _op.cur && _op.cur == 5) this.babyOnUserFun(_op);
  },
  onHide: function () {  //监听页面隐藏
    
  },
  onShareAppMessage: function () {   //分享到朋友圈
    let { goods_id, goods_name, coupon_price, source_from } = this.data.detailData, { bannerList } = this.data;
    return app.shareGetFans(`【${source_from}】超低价${coupon_price/100}元，${goods_name}`, '', '/pages/productCpsDetail/productCpsDetail', 1, bannerList[0],`&goods_id=${goods_id}`);
  },
  ...togetherDialogJs,
  isLogin(type) {   //判断用户是否登录
    if (!type || typeof type != 'number'){
      return app.isLoginFun(this);
    }
    app.isLoginFun(this, type);//判断用户是否登录
  },
  toGetPhonenumAuth() {    //去到手机授权页面
    wx.navigateTo({ url: "/pages/getPhoneNumPage/getPhoneNumPage" });
  },
  successGetPhoneCallback(member_grade) {   //获取手机号码获取成后执行的操作
    wx.removeStorageSync('success_getphone');
    if (!app.globalData.share_uid && member_grade < 1) this.getClipboardData('invitcode');    //分享进入的 不检测粘贴板 走分享授权流程
  },
  checkUserType(res) {   //判断用户是否为新用户  is_new  1:表示新用户  null或者不存在: 表示注册用户
    let { is_new, unlogin, user } = res;
    let _inw = is_new ? true : false;
    let _isnewStr = wx.getStorageSync('isNewUser');
    let has_phone = (user&&user.phone ? 1 : 0) || wx.getStorageSync('has_phone') || app.globalData.has_phone;
    this.setData({ isNewUser: _inw || (_isnewStr?true:false), _unlogin: unlogin });

    if (!has_phone){  //未授权手机号码的 授权之前先刷新登录态
      app.wxloginMethods();
    }

    let { share_uid } = app.globalData;

    if (!_inw){   //老用户
      if (share_uid && share_uid != user.uid) this.getMemberBasicInfoByUserId('', user.uid);  //分享进入的 当前用户已经是注册用户以上级别 需要判断分析者和被分享者的会员级别
      return;
    }

    wx.setStorageSync('isNewUser', true);   //新用户标识

    //1、分享进入的，走分享授权流程
    if (!share_uid) return;
    this.getMemberBasicInfoByUserId('isnew');
  },
  getMemberBasicInfoByUserId(isnew, curUserid, reget) {   //通过分享者的uid获取邀请人信息  不需要先登录也可以调用
    const me = this;
    //第一步： 先获取邀请人的会员级别  如果邀请人是普通会员(1)以下级别， 不走授权流程
    http.post('getMemberBasicInfo', { userId: reget ? curUserid : app.globalData.share_uid })
    .then(res => {
      let { memberGrade } = res.data;
      if (!reget && (!memberGrade || memberGrade < 1)) return;  //邀请人是普通用户以下 无邀请码，都不走授权流程

      if (reget && memberGrade >= 1) return;  //被邀请人是会员以上的不走授权流程

      //第二步：邀请人是普通会员以上 有邀请码，被邀请者只有新用户、普通用户才走授权流程
      if (!isnew && !reget){
        me.getMemberBasicInfoByUserId(isnew, curUserid, 'reget');
        return;
      }

      //如果再其他页面跳过授权了， 在这里不再重复了
      let _jumpeAuth = wx.getStorageSync('jumpeAuth');
      console.log('cps商品详情是否为主入口------', this.data.isCurEnter, '--_jumpeAuth---', _jumpeAuth);
      if (_jumpeAuth && !this.data.isCurEnter) return;
      wx.navigateTo({ url: `/pages/shareAuth/shareAuth?from=detail` });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  babyOnUserFun(_op) {   //完成了新手任务： 5:浏览商品
    let { option, type } = _op;
    let params =  { 
      option,
      status: 1,    //1:可领取   2:不翻倍完成任务  3:翻倍完成任务
      type    //NEW:新手任务   DAY:每日任务
    }
    http_cps.get('task_do_task_cps', params, true)
    .then(res => {
      wx.removeStorageSync('optionObj');  //清除缓存
    })
    .catch(res => {
      wx.removeStorageSync('optionObj');  //清除缓存
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  babyUserStatusChange(share_uid, cps_option, cps_type) {   //用户通过分享进入，改变分享者的积分任务状态
    let params = { 
      option: cps_option,
      uid: share_uid,
      type: cps_type
    }
    http_cps.get('task_finish_task_cps', params)
    .then(res => {
      wx.removeStorageSync('optionObj');  //清除缓存
    })
    .catch(res => {
      wx.removeStorageSync('optionObj');  //清除缓存
      wx.showToast({ title: res.msg, icon: 'none' });
    })
  },
  swiperChange(e) {    //swiper切换时触发
    let { current } = e.detail;
    let { type } = e.currentTarget.dataset;
    this.setData({ [type]: current });
  },
  showBigImageFun(e) {   //查看轮播图大图
    let { index } = e.currentTarget.dataset, { bannerList } = this.data;
    wx.previewImage({
      current: bannerList[index],   // 当前显示图片的http链接
      urls: bannerList 
    })
  },
  getIncomeData() {   //获取用户信息
    http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
    .then(res => {
      let { member_grade, uid } = res.data;

      //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
      let _suc = wx.getStorageSync('success_getphone');
      if (_suc) this.successGetPhoneCallback(member_grade);

      this.setData({ memberGrade: member_grade });
      this.getMemberInfo(uid);
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' })
    })
  },
  getMemberInfo(uid) {   //小猪版版获取会员信息: 主要作用是判断token是否过期  可能出现小猪过期， cps没有过期的现象
    http.post('getMemberInfo', { userId: uid }, false, this.isLogin)
    .then(res => {
      console.log('小猪版会员信息---', res.data);
    })
    .catch(res => {
      console.log('小猪版会员信息---报错了---', res);
    })
  },
  getDetailData() {   //获取商品详情
    let { goods_id } = this.data;
    http_cps.get('goods_detail_cps', {}, false, `/${goods_id}`)
    .then(res => {
      if (!res.data){   //商品没有库存了
        this.setData({ haspro: false, detailData: null });
        return;
      }
      
      let { goods_gallery_urls, has_coupon, coupon_discount, return_amount } = res.data;

      //立即购买可省 xx 元
      let cutdown_amount = "";
      if (has_coupon && coupon_discount) cutdown_amount = +coupon_discount;
      if (return_amount) cutdown_amount = cutdown_amount + (+return_amount);
      res.data.cutdown_amount = cutdown_amount;

      this.setData({ detailData: res.data, bannerList: goods_gallery_urls || [] });

      if (app.globalData.share_uid){   //如果存在分享者，将商品与分享者绑定关系
        this.shareRecord();
      }
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' })
    })
  },
  shareRecord() {   //记录分享商品的绑定关系
    let { my_uid, share_uid } = app.globalData;
    http.post('shareRecord', { goodId: this.data.detailData.goods_id, userId: my_uid, sharerId: share_uid })
    .then(res => {
      console.log('商品与分享者关系绑定成功',  res);
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: "none" });
    })
  },
  getMiniappData() {   //获取当前商品跳转的小程序信息
    let { goods_id } = this.data;
    http_cps.get('goods_url_cps', { goods_id })
    .then(res => {
      this.setData({ miniAppInfo: res.data });
    })
    .catch(res => {
      wx.showToast({ title: res.msg, icon: 'none' })
    })
  },
  setComModalData(isShowModal=false, title, content, cancelText, sureText) {    //自定义警告弹框内容
    this.setData({ 
      'modalData.isShowModal': isShowModal,
      'modalData.title': title,
      'modalData.content': content,
      'modalData.cancelText': cancelText,
      'modalData.sureText': sureText
    })
  },
  toMiniappBuy() {    //立即购买   跳转到对应的小程序
    if (!this.isLogin()) return;   //校验是否登录
    let { app_id, page_path } = this.data.miniAppInfo;
    if (!app_id || !page_path){
      wx.showToast({ title: "没有可以跳转的小程序", icon: "none" });
      return;
    }
    wx.navigateToMiniProgram({
      appId: app_id,
      path: page_path,
      fail(err) {
        console.log('小程序跳转失败----', err)
      }
    })
  },
  imgDownloadFun() {    //将轮播图第一张图片存到自己的服务器，供海报使用
    const me = this;
    let { bannerList } = this.data;
    let token = wx.getStorageSync('token_cps') || "";
    let url = `${APIHOST}${API.img_download_cps}?url=${bannerList[0]}`;
    wx.downloadFile({
      url,
      header: { Authorization: `Bearer ${token}` },
      success(res) {
        if (res.statusCode == 401){   //401处理
          wx.hideLoading();
          me.setData({ creatingPost: false });
          wx.setStorageSync('unlogin', true);
          me.isLogin(1);//判断用户是否登录
          me.setComModalData(true, '温馨提示', '商品图片下载失败', '我知道了', '');   //设置警告弹框
          return;
        }
        me.setData({ productImageForCanvas: res.tempFilePath || "" });
        me.creatPost();
      },
      fail(err) {
        console.log('商品图片下载失败---------', err);
        wx.hideLoading();
        me.setData({ creatingPost: false });
        me.setComModalData(true, '温馨提示', '商品图片下载失败', '我知道了', '');   //设置警告弹框
      }
    })
  },
  cancelEvent: function () {   //取消分享/海报
    this.data.shareModalNode.hideDialog();
  },
  shareGroup: function () {    //分享好友或群
    if (!this.isLogin()) return;   //校验是否登录
    this.data.shareModalNode.showDialog();
  },
  makePlaybillFun() {    //点击生成海报
    const me = this;
    let ticket = wx.getStorageSync('ticket'), { detailData } = this.data;
    if (!this.isLogin() || !detailData || !detailData.goods_id) return;   //校验是否登录
    let data = {
        path: 'pages/productCpsDetail/productCpsDetail',
        id: detailData.goods_id,
        share_uid: app.globalData.my_uid,
        shareType: 1
    }
    
    if (this.data.creatingPost) return;
    this.setData({ creatingPost: true });
    wx.showLoading({ title: '海报生成中', mask: true });

    wx.request({
      url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
      header: { 'Content-Type': 'application/json' },
      data: data,
      method: "POST",
      success: function (res) {
        if (res.statusCode != 200 || !res.data || res.data.err_code != 0){
          wx.hideLoading();
          me.setData({ creatingPost: false });
          me.setComModalData(true, '温馨提示', '商品详情二维码生成失败', '我知道了', '');   //设置警告弹框
          return;
        }

        me.setData({ qrcodePath: res.data.err_msg });
        me.imgDownloadFun();    //将轮播图第一张图片下载到我们自己服务器上
      },
      fail: function (res) {
        wx.hideLoading();
        me.setData({ creatingPost: false });
        me.setComModalData(true, '温馨提示', '商品详情二维码生成失败', '我知道了', '');   //设置警告弹框
      }
    })
  },
  creatPost() {   //画图前的数据准备
    const me = this;
    //准备画布数据
    let { goods_name, coupon_price, min_group_price, coupon_discount, has_coupon, sales_tip, source_from } = this.data.detailData, 
        { qrcodePath, productImageForCanvas } = this.data;
    let _userinfo = wx.getStorageSync('userinfo');
    if (_userinfo) _userinfo = JSON.parse(_userinfo);
    console.log('当前的头像------', _userinfo.wx_local_avatar);

    let canvasData = {
      canvasId: 'productPost',
      canvasWidth: 560,
      canvasHeight: 980,
      paddingLeft: 0,
      paddingTop: 0,
      bgPath: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/share_cps_bg.png', // 海报背景图
      sourceIcon: {
        "拼多多": "../../images/cps/icon_pinduoduo.png",
        "京东": "../../images/cps/icon_jingdong.png"
      },
      source_from,    //商品来源： 京东、拼多多等
      product_name: goods_name, // 商品名称
      product_price: coupon_price/100,   //商品最新价格
      old_price: min_group_price/100,   //商品划线价格 原价
      coupon_discount: coupon_discount/100,    //优惠券面额
      has_coupon,    //商品是否有优惠券
      sales_tip,   //售卖件数
      text_qrcode_btm: '长按识别', // 二维码下方文字
      nickName: _userinfo ? _userinfo.nickName : "", // 用户昵称
      avatarPath: _userinfo ? _userinfo.wx_local_avatar : "", // 用户头像
      qrcodePath: qrcodePath ? 'https://' + qrcodePath.split('://')[1] : "",   // 二维码
      productImage: productImageForCanvas,   // 商品首图
    }

    let obj = canvas.px2rpx({ w: canvasData.canvasWidth, h: canvasData.canvasHeight });
    this.setData({ canvasData, canvasPosition: obj });

    let task = [], filePaths = ['qrcodePath','avatarPath', 'bgPath'];
    for (let j=0; j < filePaths.length; j++) {
      let filePath = filePaths[j];
      task.push(canvasFun.loadImageFileByUrl(canvasData[filePath]));
    }
    Promise.all(task).then(resultList => {
      for (let filePathIndex=0; filePathIndex < resultList.length; filePathIndex++) {
        let resultListElement = resultList[filePathIndex];
        canvasData[filePaths[filePathIndex]] = resultListElement.tempFilePath
      }
      me.setData({ canvasData });
      me.drawCanvas();
    }).catch(err => {
      console.log('图片转换失败---', err);
      wx.hideLoading();
      me.setData({ creatingPost: false });
      me.setComModalData(true, '温馨提示', '海报生成失败，请重试', '我知道了', '');   //设置警告弹框
    })
  },
  splitStrFun(o) {   //多行文本时发生截取
    let sArr = o._strArr.filter((item, index) => {
      let _w = o.ctx.measureText(item).width*(o.dpr);
      if (o.line == 1){    //第一行时
        if (o.sum < o.max && (o.sum + _w) <= o.max){
          o.sum += _w;
          o._in = index;
          return item;
        }
      }else {     //多行时  留出...的位置
        let pointW = o.ctx.measureText("...").width*(o.dpr);    //获取...的宽度
        if (o.sum < o.max && (o.sum + _w) <= o.max && (o.sum + _w + pointW) <= o.max){
          o.sum += _w;
          o._in = index;
          return item;
        }else {
          console.log(`第二行超出了宽度${o.max}------`, o.sum + _w + pointW);
          if ((o.sum + _w + pointW) > o.max){
            o.isover = true;
          }
        }
      }
      
    })
    return { sArr, sum: o.sum, curIndex: o._in, isover: o.isover };
  },
  drawCanvas() {   //开始画图
    const me = this;
    let { canvasId, canvasWidth, canvasHeight, product_name, productImage, product_price, old_price, coupon_discount, has_coupon, sales_tip, sourceIcon, source_from, nickName, avatarPath, qrcodePath, bgPath, text_qrcode_btm } = this.data.canvasData;
    let headr = 40;   //头像半径
    let proWidth = 450, proHeight = 450;   //商品宽高
    let sourceIconWidth = 34;  //来源icon的宽度
    const ctx = wx.createCanvasContext(canvasId);

    //绘制背景图片
    canvas.drawImage({
      ctx: ctx,
      img: bgPath,
      x: 0,
      y: 0,
      w: canvasWidth,
      h: canvasHeight
    })
    //绘制头像  顶部距离30   半径40
    if (avatarPath){
      canvas.circleImg({
        ctx: ctx,
        img: avatarPath,
        r: headr,    //头像半径
        x: canvasWidth/2 - headr,
        y: 30,
        w: headr * 2,
        h: headr * 2
      })
    }
    //绘制昵称  x:字体居中 x为整个宽度一半  y: 顶部30 + 头像80 + 10间隙 + 字体高度24/2 = 132 
    ctx.setFontSize(toPx(22));
    ctx.setFillStyle('#FEFFFF');
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText(nickName, toPx(canvasWidth/2), toPx(132));
    //绘制推荐文字  x:字体居中 x为整个宽度一半  y: 上一步(加文字的另外一半12) 144 + 间隙14 + 字体高度28/2 = 172
    ctx.setFontSize(toPx(20));
    ctx.setFillStyle('#A26121');
    ctx.fillText(`推荐您享受${source_from}购物内购优惠`, toPx(canvasWidth/2), toPx(172));
    //绘制商品图片  y: 上一步172+14(字体另外一半) + 间隙34 = 220
    ctx.save();   //保存之前的内容
    ctx.beginPath();
    ctx.rect(toPx((canvasWidth - proWidth)/2), toPx(220), toPx(proWidth), toPx(proHeight));
    ctx.clip();
    ctx.drawImage(productImage, toPx((canvasWidth - proWidth)/2), toPx(220), toPx(proWidth), toPx(proHeight));
    ctx.restore();
    //绘制商品来源(京东/拼多多)   y:上一步220 + 商品图片高度450 + 间隙30 = 722
    // canvas.roundRect({
    //   ctx: ctx,
    //   x: 30,
    //   y: 220 + proHeight + 30 + 4,
    //   w: _sw,
    //   h: 30,    //高度为30
    //   r: 6,
    //   bg: "#FF4444"
    // })
    // //6:文字左右padding: 6rpx   4:文字上下padding: 4rpx
    // ctx.setFontSize(toPx(20));
    // ctx.setFillStyle('#fff');
    // ctx.setTextAlign('left');
    // ctx.setTextBaseline('top');
    // ctx.fillText(source_from, toPx(30 + 6), toPx(220 + proHeight + 30 + 4 + 4));

    //绘制商品来源icon   y:上一步220 + 商品图片高度450 + 间隙30 = 722
    ctx.beginPath();
    ctx.save();   //保存之前的内容
    ctx.beginPath();
    ctx.rect(toPx(30), toPx(220 + proHeight + 30), toPx(sourceIconWidth), toPx(sourceIconWidth));
    ctx.clip();
    ctx.drawImage(sourceIcon[source_from], toPx(30), toPx(220 + proHeight + 30), toPx(sourceIconWidth), toPx(sourceIconWidth));
    ctx.restore();

    //测试多行省略号展示
    // 嗨吃家酸辣粉6桶整箱正品清真正宗重庆泡面方便面速食红薯粉丝
    // ctx.beginPath();
    // ctx.setFontSize(toPx(32));
    // ctx.setFillStyle('#f00');
    // ctx.setTextAlign('left');
    // ctx.setTextBaseline('top');
    // console.log('一行的块状宽度为----', canvasWidth - 60);    //500rpx
    // console.log('三个点的宽度为----', ctx.measureText('...').width*dpr);    //26rpx
    // console.log('来源的宽度为----', ctx.measureText(source_from).width*dpr);    //96rpx
    // console.log('第一行的文字宽度为----', ctx.measureText('嗨吃家酸辣粉6桶整箱正品清').width*dpr);   //404rpx
    // console.log('第二整行的宽度为----', ctx.measureText('嗨吃家酸辣粉6桶整箱正品清真正宗').width*dpr);    //500rpx 一整行 或者 (30左边距+来源+15间隙+文字宽 = 500rpx)
    // ctx.fillText('嗨吃家酸辣粉6桶整箱正品清', toPx(30 + _sw + 15), toPx(220 + proHeight + 30 + 4 + 4 + 90));
    // ctx.fillText('嗨吃家酸辣粉6桶整箱正品清真正宗', toPx(30), toPx(220 + proHeight + 30 + 4 + 4 + 130));

    //绘制商品名称 多行文字 超出19个字显示两行，溢出显示省略号  y:上一步220 + 商品图片高度450 + 间隙30 = 722
    let dpr = app.globalData.dpr || 2;   //当前分辨率比例
    ctx.beginPath();
    ctx.setFontSize(toPx(32));
    ctx.setFillStyle('#f00');
    ctx.setTextAlign('left');
    ctx.setTextBaseline('top');
    let _width = ctx.measureText(product_name).width*dpr;
    let _rowwidth = _width + sourceIconWidth + 15;
    let row_1_Data = "", row_2_Data = "";
    console.log('当前商品名称长度rpx-----', _width);

    if (_rowwidth > 500){    //多行省略号
      let _strArr = product_name.split("");
      //截取第一行文字
      row_1_Data = me.splitStrFun({
        ctx: ctx,
        dpr,
        line: 1,
        _strArr,
        max: 500 - sourceIconWidth - 15,    //一行宽度500 - 来源_w - 间隙15
        sum: 0,
        _in: 0
      })
      //截取第二行数据
      let _other = _strArr.slice(row_1_Data.curIndex + 1);
      if (_other && _other.length){
        row_2_Data = me.splitStrFun({
          ctx: ctx,
          dpr,
          line: 2,
          _strArr: _other,
          max: 500,
          sum: 0,
          _in: 0
        })
      }
      //截取后拼装商品名称
      product_name = row_1_Data.sArr.join("") + "\n" + row_2_Data.sArr.join("");
      if (row_2_Data && row_2_Data.isover) product_name += "...";

      //开始画多行名字
      let o = {
        ctx,
        gap: 10,
        text: product_name,
        x: 30,
        y: 220 + proHeight + 30,
        fontSize: 32
      }
      let textArr = o.text.split('\n');

      if (textArr.length > 1) {
        let baseY = o.y;
        for (let i = 0; i < textArr.length; i++) {
          let y = baseY + (o.fontSize + o.gap) * (i);
          //第一行时，需要空出来源source的宽度
          let _obj = { y };
          _obj.x = i == 0 ? (30 + sourceIconWidth + 15) : 30;
          o = Object.assign({}, o, _obj);
          o.text = textArr[i];
          canvas.drawText(o);
        }
      }

    }else {
      //绘制价格符号
      canvas.drawText({
        ctx: ctx,
        text: product_name,
        x: 30 + sourceIconWidth + 15,    //左边距30 + 来源宽度 + 右边距15
        y: 220 + proHeight + 30,
        fontSize: 32
      })
    }

    //绘制价格符号
    ctx.beginPath();
    ctx.setFontSize(toPx(28));
    ctx.setFillStyle('#FF4444');
    ctx.fillText("¥", toPx(30), toPx(826));
    //绘制商品优惠价格
    ctx.beginPath();
    ctx.setFontSize(toPx(46));
    ctx.setFillStyle('#FF4444');
    ctx.fillText(product_price, toPx(58), toPx(813));
    //绘制来源
    ctx.beginPath();
    ctx.setFontSize(toPx(22));
    ctx.setFillStyle('#999');
    ctx.fillText(source_from, toPx(30), toPx(873));
    //绘制价格符号
    ctx.beginPath();
    ctx.setFontSize(toPx(22));
    ctx.setFillStyle('#999');
    let _sourW = ctx.measureText(source_from).width*dpr;
    ctx.fillText("¥", toPx(30 + _sourW + 5), toPx(873));
    //绘制划线价格  ￥符号宽度66  5:间隙
    ctx.beginPath();
    ctx.setFontSize(toPx(22));
    ctx.setFillStyle('#999');
    let _oldW = ctx.measureText(old_price + "").width*dpr;
    ctx.fillText(old_price, toPx(30 + _sourW + 5 + 16), toPx(873));
    //绘制划线
    ctx.beginPath();
    ctx.setLineWidth(1);
    ctx.setStrokeStyle('#999');
    ctx.moveTo(toPx(30 + _sourW + 5), toPx(885));
    ctx.lineTo(toPx(30 + _sourW + 5 + 16 + _oldW), toPx(885));
    ctx.stroke();
    //绘制优惠券
    ctx.beginPath();
    if (has_coupon && coupon_discount){   //有优惠券，并且面额不为0
      ctx.setFontSize(toPx(22));
      ctx.setFillStyle('#FF811A');
      ctx.fillText('优惠券￥' + coupon_discount, toPx(30 + _sourW + 5 + 16 + _oldW + 14), toPx(873));
    }
    //绘制已售件数
    ctx.beginPath();
    ctx.setFontSize(toPx(22));
    ctx.setFillStyle('#999');
    ctx.fillText('已拼' + sales_tip + '件', toPx(30), toPx(913));
    //绘制二维码
    ctx.save();   //保存之前的内容
    ctx.beginPath();
    ctx.rect(toPx(canvasWidth-100-30), toPx(813), toPx(100), toPx(100));
    ctx.clip();
    ctx.drawImage(qrcodePath, toPx(canvasWidth-100-30), toPx(813), toPx(100), toPx(100));
    ctx.restore();
    //绘制二维码提示文字
    ctx.beginPath();
    ctx.setFontSize(toPx(18));
    ctx.setFillStyle('#999');
    ctx.setTextAlign('center');
    ctx.fillText(text_qrcode_btm, toPx(canvasWidth-50-30), toPx(922));

    // 最终绘出画布
    ctx.draw(false, () => {
      let o = {
        id: canvasId,
        w: canvasWidth,
        h: canvasHeight,
        targetW: canvasWidth * 4,
        targetH: canvasHeight * 4
      }
      setTimeout(() => {
        canvas.canvasToTempFilePath(o).then(res => {
          wx.hideLoading();
          console.log('生成的海报图片路径为-----',  res.tempFilePath);
          if (me.data.shareModalNode.data.isShow) me.data.shareModalNode.hideDialog();   //关闭分享底部弹框
          me.setData({ canvasImg: res.tempFilePath, showPlaybill: true });
        })
        .catch(err => {
          console.log('生成海报失败----', err);
          wx.hideLoading();
          me.setComModalData(true, '温馨提示', '海报生成失败，请重试', '我知道了', '');   //设置警告弹框
        })
      }, 300)
    })
    
  },
  tosaveFun() {    //保存海报到相册
    const me = this;
    publicFun.checkAuthOfSaveImageToPhotosAlbum(() => {  //第一步： 授权保存到相册权限
      let { canvasImg } = me.data;
      canvas.saveImageToPhotosAlbum({ imgSrc: canvasImg }).then(res => {
        me.setComModalData(true, '', '图片已保存到手机相册，快去给大家们晒一下吧', '好的', '');   //设置警告弹框
        me.setData({ showPlaybill: false, creatingPost: false });
      })
      .catch(err => {
        console.log('保存到相册失败----', err);
        me.setComModalData(true, '温馨提示', '保存到相册失败，请重试', '我知道了', '');   //设置警告弹框
      })
    })
  },
  toPreviewFun() {    //预览海报长按分享  全屏展示
    let { canvasImg } = this.data;
    wx.previewImage({
      current: canvasImg,
      urls: [canvasImg]
    })
  },
  preventTouchMove() {   //阻止蒙层下面的页面滚动
  },
  closePlaybillFun() {    //关闭海报
    this.setData({ showPlaybill: false, creatingPost: false });
  },
  toCancle() {   //关闭 警告弹窗
    if (this.data.shareModalNode.data.isShow) this.data.shareModalNode.hideDialog();   //关闭分享底部弹框
    this.setData({ 'modalData.isShowModal': false });
  },
  toMakesure() {   //确认 警告弹窗
    if (this.data.shareModalNode.data.isShow) this.data.shareModalNode.hideDialog();   //关闭分享底部弹框
    this.setData({ 'modalData.isShowModal': false });
  }

})
