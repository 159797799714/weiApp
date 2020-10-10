// pages/seckill/index.js
var common = require('../../utils/common.js');
var publicFun = require('../../utils/public.js');
var wxParse = require('../../wxParse/wxParse.js');
var canvasFun = require('../../utils/canvas-post.js');
var canvas = require('../../utils/canvas.js');

import { toPx } from "../../utils/util"
import http_cps from "../../utils/http_cps"
import http from "../../utils/http"
import { togetherDialogData, togetherDialogJs } from "../../template/together-dialog/together-dialog"
var app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        imgUrls: [],
        indicatorDots: true,
        swiperCurrent: 1,
        autoplay: true,
        interval: 5000,
        duration: 500,
        maskShow: false,
        resultShow: false,
        teamShow: false,
        id: 249, //248,
        banners: [],
        proInfo: '',
        instant: new Date(),
        c_endTime: '', // 可以下单的时间
        isSecKill: false,
        currenttime: '',
        leftCode: '<<',
        rightCode: '>>',
        shoppingCatButton: '', // 底部按钮文案
        buttonColor: 'redBtn', // 底部按钮颜色
        payType: 0, // 底部按钮绑定事件====》0: 无  gopay:立即购买  payNow：支付  goPayCommon：原价购买，走普通订单
        show_seckill_price: '0',
        show_origin_price: '0',
        itemWindowShow: false,
        shareModalNode: null,   //底部分享弹框节点
        bottomHeight: app.globalData.bottomHeight,
        canvasImg: '', // 生成的海报图片路径
        showPlaybill: false, // 展示生成的海报图片
        kcNum: '',
        num1: 1,
        skuPriceData_sub: [],
        shoppingData: {
            shoppingShow: false,
            shoppingCatData: '',
            deliver_date_index: 0,
            specList: [{
                'vid': 1
            }, {
                'vid': 1
            }, {
                'vid': 1
            }],
            value: '',
            sku_id: '',
            shoppingNum: 1,
            date: '2016-09-01',
            time: '12:00',
        },
        total_show: '00',
        hours_show: '00',
        minutes_show: '00',
        seconds_show: '00',
        userData: {},
        integralShow: false,
        integralType: '',
        is_original_price: 0, // 1使用原价购买 0秒杀购买
        isCurEnter: '',
        ...togetherDialogData
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(e) {
        var that = this;
        publicFun.height(that);

        console.log('app.globalData分享者是------', app.globalData.share_uid, '--------秒杀--商品详情的参数------', e);
        let { id, share_uid, shareType, store_id, scene, uid, cps_option, cps_type } = e;
        let isCurEnter = scene ? true : (share_uid ? true : false);   //当前页面是否为主入口

        share_uid = share_uid || app.globalData.share_uid || '';
        shareType = shareType || app.globalData.shareType || 2;
        store_id = store_id || app.globalData.store_id || '';
        id = id || app.globalData.seckill_detail_id || '';

        let preview = 0;
        if (scene != undefined) { // 预览模式
            var _scene = decodeURIComponent(scene);
            if (!_scene) return;

            let arr = _scene.split(',');
            id = arr[1];
            preview = 1;
            if (!uid && "undefined" != typeof arr[2]) {
                uid = arr[2];
            }
            store_id = arr[0];
            share_uid = arr[3];
        }
        app.globalData.share_uid = share_uid || '';
        app.globalData.shareType = shareType || 2;
        app.globalData.store_id = store_id || '';
        app.globalData.seckill_detail_id = id;

        var bgcolor = app.globalData.navigateBarBgColor;
        that.setData({
            id: id,
            preview: preview,
            uid: uid || '',
            bgcolor,
            isCurEnter
        })

        publicFun.onLoad(app, this);  //授权弹框提前注册

        //用户通过分享进入，改变分享者的积分任务状态
        if (share_uid&&cps_option&&cps_type) this.babyUserStatusChange(share_uid, cps_option, cps_type);

        //判断是否需要进行新用户权限校验
        let unlogin = wx.getStorageSync('unlogin')
        if ((unlogin || unlogin == '') && share_uid){
            app.initLoginFun(this.checkUserType);    //进入页面登录判断用户是否为注册用户
        }

        // 获得dialog组件
        that.dialog = that.selectComponent("#shareModal");
        wx.getSystemInfo({
            success: function(res) {
                that.setData({
                    winWidth: res.windowWidth,
                    winHeight: res.windowHeight
                });
            },
        });
        //拉粉注册分享人id  分享来源1商品 2本店推广；
        // getApp().globalData.share_uid = e.share_uid || '';
        // getApp().globalData.shareType = e.shareType || 2;

        //是否展示分享图片
        app.shareWidthPic(that);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
      var that = this;
      // 获得dialog组件
      let _dialog = this.selectComponent("#shareModal");
      this.setData({ shareModalNode: _dialog });// 获得dialog组件
      that.dialog = that.selectComponent("#shareModal");
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        this.isLogin(1)  //判断用户是否登录
        clearTimeout(publicFun.timer);
        this.getIncomeData();
        this.getDetails();

        //新手日常任务 好礼页面--  5:浏览商品
        let _op = wx.getStorageSync('optionObj');
        _op = _op ? JSON.parse(_op) : null;
        if (_op && _op.cur && _op.cur == 5) this.babyOnUserFun(_op);
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {
        clearTimeout(publicFun.timer);
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {
        var that = this;
        var f = that.data.allInfo.seckill_user.seckill_user_id;
        // let title = that.data.seckillInfo.name ? that.data.seckillInfo.name : '秒杀活动';
        var image = '';
        if (that.data.imgUrls && that.data.imgUrls[0]) {
            image = that.data.imgUrls[0];
        }
        console.log('onShareAppMessage的image', image)

        let { nickname } = this.data.userData;
        let title = nickname ? `【${nickname}】` : '';
        let goodName = this.data.proInfo.name? `${this.data.proInfo.name}`: ''
        console.log('秒杀详情分享-----nickname', nickname, '-----title----', title);
        return getApp().shareGetFans(`${title}邀请你超值秒杀${goodName}`, '', '/pages/seckill/index', 1, image, `&id=${that.data.id}&uid=${f}`);
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
            console.log('秒杀商品详情是否为主入口------', this.data.isCurEnter, '--_jumpeAuth---', _jumpeAuth);
            if (_jumpeAuth && !this.data.isCurEnter) return;
            wx.navigateTo({ url: `/pages/shareAuth/shareAuth?from=seckill_detail` });
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
    getIncomeData() {   //获取用户信息
        http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
        .then(res => {
          let { member_grade, uid } = res.data;
          this.setData({ userData: res.data || {} });
    
          //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
          let _suc = wx.getStorageSync('success_getphone');
          if (_suc) this.successGetPhoneCallback(member_grade);
    
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
    getDetails: function() {
        var that = this;
        var data = {
            seckill_id: that.data.id,
            uid: that.data.uid
        };
        common.post('app.php?c=seckill&a=seckill', data, 'getDetailsCallBack', that)
        //=========================检测登录授权====================================
        publicFun.checkAuthorize({
            pageData: that.data.allInfo,
            app: app,
            callbackFunc: '',
        })
        //=========================检测登录授权====================================
    },
    swiperChange (e) {
      this.setData({
        swiperCurrent: e.detail.current + 1
      })
    },
    goIndex () {
      wx.switchTab({
        url: '/pages/index/index'
      })
    },
    shareRecord() {   //记录分享商品的绑定关系
        let { my_uid, share_uid } = app.globalData;
        http.post('shareRecord', { goodId: this.data.seckillInfo.product_id, seckill_id: this.data.id, userId: my_uid, sharerId: share_uid })
        .then(res => {
          console.log('商品与分享者关系绑定成功',  res);
        })
        .catch(res => {
          wx.showToast({ title: res.msg, icon: "none" });
        })
    },
    getDetailsCallBack: function(res) {
        var that = this;
        // 轮播图转化处理
        that.data.imgUrls = [];
        for (var i in res.err_msg.product_imgs) {
            that.data.imgUrls.push(res.err_msg.product_imgs[i].image)
        }
        // 价格显示处理
        that.data.show_seckill_price = res.err_msg.seckillInfo.seckill_price * 1 > 10000 ? (res.err_msg.seckillInfo.seckill_price * 1 / 10000).toFixed(2) + '万' : res.err_msg.seckillInfo.seckill_price;
        that.data.show_origin_price = res.err_msg.productInfo.price * 1 > 10000 ? (res.err_msg.productInfo.price * 1 / 10000).toFixed(2) + '万' : res.err_msg.productInfo.price;

        // 处理亲友团时间
        if (res.err_msg.shareUser && res.err_msg.shareUser.length > 0) {
            for (var i = 0; i < res.err_msg.shareUser.length; i++) {
                res.err_msg.shareUser[i].addtime_str = publicFun.setDate(res.err_msg.shareUser[i].add_time)
            }
        }

        that.setData({
            originTotal: that.data.show_seckill_price,
            instant: new Date(),
            imgUrls: that.data.imgUrls,
            order_info: res.err_msg.order_info,
            proInfo: res.err_msg.productInfo,
            seckillInfo: res.err_msg.seckillInfo,
            kcNum: res.err_msg.seckillInfo.quantity,
            allInfo: res.err_msg,
            skuList: res.err_msg.sku_list,
            propertyList: res.err_msg.property_list ? res.err_msg.property_list : [],
            c_endTime: res.err_msg.my_start * 1000,
            currenttime: res.err_msg.currenttime * 1000,
            show_seckill_price: that.data.show_seckill_price,
            show_origin_price: that.data.show_origin_price
        })
        console.log("[[[[[[[[[[[[[[[[[[[[[-------------------------", res, res.err_msg.seckillInfo.sku_id)
        publicFun.barTitle(that.data.seckillInfo.name); //修改头部标题

        if (app.globalData.share_uid){   //如果存在分享者，将商品与分享者绑定关系
            that.shareRecord();
        }

        // 富文本处理
        var guizeHtml = that.data.seckillInfo.description ? that.data.seckillInfo.description : "暂无活动说明";
        var infoHtml = that.data.proInfo.info;
        wxParse.wxParse('infoHtml', 'html', infoHtml, that, 0);
        wxParse.wxParse('guizeHtml', 'html', guizeHtml, that, 0);

        // 处理购买按钮
        if (that.data.allInfo.Auditing_status * 1 >= 1) {
            if (that.data.allInfo.is_start == 1) {
                that.data.shoppingCatButton = '活动未开始';
                that.data.buttonColor = 'grayBtn';
                that.data.payType = '';
            }
            if (that.data.allInfo.is_start == 3) {
                that.data.shoppingCatButton = '活动已关闭';
                that.data.buttonColor = 'grayBtn';
                that.data.payType = '';
            }
            if (that.data.allInfo.is_start == 2) { // 活动已结束或活动进行中，用户已秒杀付款成功
                that.data.shoppingCatButton = '原价购买';
                that.data.is_original_price = 1
                that.data.buttonColor = '';
                that.data.payType = 'goPayCommon';
            }
            if (that.data.allInfo.is_start == 4) {
                if (that.data.allInfo.is_seckilled == 1 && that.data.order_info.status * 1 < 2) { // 参加过秒杀 但属于 临时订单或未付款
                    // that.data.shoppingCatButton = '支付';
                    // that.data.buttonColor = '';
                    // that.data.payType = 'payNow';
                    that.data.shoppingCatButton = '原价购买';
                    that.data.is_original_price = 1
                    that.data.buttonColor = '';
                    that.data.payType = 'goPayCommon';
                }
                if (that.data.allInfo.is_seckilled == 1 && that.data.order_info.status * 1 >= 2) { // 参加过秒杀 并 支付成功
                    that.data.shoppingCatButton = '原价购买';
                    that.data.is_original_price = 1
                    that.data.buttonColor = '';
                    that.data.payType = 'goPayCommon';
                }
                if (that.data.allInfo.is_seckilled != 1 && that.data.allInfo.quantity * 1 > 0) { // 未参加过秒杀 且 商品有库存
                    that.data.shoppingCatButton = '秒杀购买';
                    that.data.buttonColor = '';
                    that.data.payType = 'gopay';
                }
                if (that.data.allInfo.is_seckilled != 1 && that.data.allInfo.quantity * 1 == 0) { // 未参加过秒杀 且 商品无库存
                    that.data.shoppingCatButton = '商品已售罄';
                    that.data.buttonColor = 'grayBtn';
                    that.data.payType = '';
                }
            }
        } else {
            that.data.shoppingCatButton = '活动未审核';
            that.data.buttonColor = 'grayBtn';
            that.data.payType = 'gopay';
        }
        that.setData({
            shoppingCatButton: that.data.shoppingCatButton,
            buttonColor: that.data.buttonColor,
            payType: that.data.payType,
        })
        //设置初始属性
        that.setDefaultAttr(that.data.propertyList);


        // 处理秒杀计时器
        if (that.data.allInfo.is_start == 1) { // 活动未开始
            that.setData({
                c_endTime: res.err_msg.my_start * 1000
            })
            that.timeShow();
        } else if (that.data.allInfo.is_start == 4) { // 活动已开始
            that.setData({
                isSecKill: true,
                c_endTime: res.err_msg.seckillInfo.end_time * 1000,
            })
            that.timeShow();
        }
        // 有规格则默认选中第一个
        if (res.err_msg.property_list && res.err_msg.property_list.length > 0) {
          let arr = res.err_msg.property_list
          arr.forEach((item, id) => {
            console.log(item)
            that.setMyAttr({
              target: {
                dataset: {
                  id: id,
                  vid: item.values[0].vid,
                  pid: item.pid,
                  name: item.values[0].value
                }
              }
            })
          })
          
        }
    },
    timeShow: function() {
        var that = this;
        var endtime = new Date(that.data.c_endTime); //结束时间
        that.setData({
            currenttime: that.data.currenttime + 1000
        })
        var today = new Date(that.data.currenttime); //当前时间
        // console.log(today)

        var delta_T = endtime.getTime() - today.getTime(); //时间间隔
        // console.log('delta_T = ==== ', delta_T)
        if (delta_T < 0) {
            that.setData({
                total_show: '00',
                hours_show: '00',
                minutes_show: '00',
                seconds_show: '00'
            })
            clearTimeout(publicFun.timer);
            if (that.data.allInfo.is_start === 1) {
                that.getDetails()
            }
            if (that.data.allInfo.is_start === 4) {
                that.getDetails()
            }
            return;
        }
        publicFun.timer = setTimeout(that.timeShow, 1000);
        var total_days = delta_T / (24 * 60 * 60 * 1000), //总天数
            total_show = Math.floor(total_days), //实际显示的天数
            total_hours = (total_days - total_show) * 24, //剩余小时
            hours_show = Math.floor(total_hours), //实际显示的小时数
            total_minutes = (total_hours - hours_show) * 60, //剩余的分钟数
            minutes_show = Math.floor(total_minutes), //实际显示的分钟数
            total_seconds = (total_minutes - minutes_show) * 60, //剩余的分钟数
            seconds_show = Math.round(total_seconds); //实际显示的秒数
        if (seconds_show == 60) seconds_show = 59;

        if (total_show <= 15) {}
        if (total_show < 10) {
            total_show = String(total_show);
            total_show = "0" + total_show;
        }
        if (hours_show < 10) {
            hours_show = "0" + hours_show;
        }
        if (minutes_show < 10) {
            minutes_show = "0" + minutes_show;
        }
        if (seconds_show < 10) {
            seconds_show = "0" + seconds_show;
        }

        that.setData({
            total_show: total_show,
            hours_show: hours_show,
            minutes_show: minutes_show,
            seconds_show: seconds_show
        })
    },
    compareTime: function(t) {
        var that = this;
        var today = new Date((new Date().getTime() - new Date(that.data.instant).getTime()) + new Date(that.data.allInfo.currenttime * 1000).getTime()); //当前时间
        var targetTime = new Date(t * 1000); //结束时间
        if (today.getTime() < targetTime.getTime()) {
            return true
        } else {
            return false
        }
    },
    // 秒杀下单
    gopay: function() {
        var that = this;
        let data = {};
        data.product_id = that.data.seckillInfo.product_id;
        data.is_add_cart = 0; //是否加入购物车
        data.send_other = 0;
        data.sku_id = that.data.shoppingData.sku_id;
        data.custom = [];
        data.quantity = 1;
        data.storeId = that.data.seckillInfo.store_id;
        data.activityId = that.data.seckillInfo.pigcms_id;
        data.type = 50;
        data.seckill_id = that.data.id;
        data.is_original_price = that.data.is_original_price

        console.log(that.data.propertyList.length, "===www===", that.data, that.data.shoppingData, that.data.shoppingData.sku_id, "that.data.shoppingData.sku_idthat.data.shoppingData.sku_idthat.data.shoppingData.sku_id")

        // 判斷是否是多規格
        if (that.data.shoppingData.sku_id ) {
            if ((that.data.shoppingData.name) && (that.data.shoppingData.name.length == that.data.propertyList.length)) {
                common.post('app.php?c=seckill&a=save_order', data, "getOrder", that);
            } else {
                return wx.showToast({
                    title: "请选择商品规格",
                    icon: "none"
                });
            }
        } else {
            common.post('app.php?c=seckill&a=save_order', data, "getOrder", that);
        }




    },

    getOrder: function(res) {
        var that = this;
        wx.navigateTo({
            url: '/pages/payment/index?order_no=' + res.err_msg,
        })
    },
    // 秒杀支付
    payNow: function() {
        var that = this;
        clearTimeout(publicFun.timer);
        wx.navigateTo({
            url: '/pages/payment/index?order_no=' + that.data.allInfo.order_info.order_no
        })
    },
    // 原价购买
    goPayCommon: function() {
        var that = this;
        let data = {};
        data = {
            quantity: 1,
            sku_id: that.data.seckillInfo.sku_id,
            send_other: 0,
            is_add_cart: 0,
            type: 0,
            custom: [],
            product_id: that.data.seckillInfo.product_id,
            is_original_price: that.data.is_original_price
        };
        publicFun.warning('订单处理中，请稍后...', that);
        common.post('app.php?c=order&a=add', data, payment, '');

        function payment(result) { //去支付
            if (result.err_code == 1010) {
                publicFun.promptMsg(result.err_msg.msg_txt, '知道了', '', right);

                function right() {
                    wx.redirectTo({
                        url: '/pages/user/order/index?order=' + result.err_msg
                    })
                }
            }
            if (result.err_code == 0) {
                var order_no = result.err_msg;
                publicFun.paymentGo(order_no)
            }
        };
    },

    shareClick: function() {
        wx.showShareMenu({
            withShareTicket: true
        })
    },
    maskClick: function() {
        var that = this;
        that.setData({
            maskShow: false,
            teamShow: false
        })
    },
    checkTeamAll: function() {
        var that = this;
        that.setData({
            teamShow: true,
            maskShow: true
        });
    },

    //点击查看大图
    previewImage: function(e) {
        var current = e.target.dataset.src;
        wx.previewImage({
            current: current, // 当前显示图片的http链接
            urls: this.data.imgUrls // 需要预览的图片http链接列表
        })
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },
    
    // 积分提示弹框开启
    showIntegralPopup (type) {
      console.log('type', type)
      type = type? type: 1
      this.setData({
        integralShow: true,
        integralType: type
      })
    },
    // 关闭积分提示
    hideIntegralPopup () {
      this.setData({
        integralShow: false
      })
      if (this.data.integralType == 4) {
        wx.switchTab({
          url: '/pages/gifttab/gifttab'
        })
      }
    },
    // 确认兑换
    sureExchange(e) {
      let that = this
      console.log('确认兑换', e)
      that.hideIntegralPopup()
      let bindType = e.target.dataset.bindtap
      publicFun.formSubmit({
          e: e,
          that: that,
          callBack: that[bindType]
      })
    },
    // 判断积分是否足够
    canExchange () {
      let that = this
      if (that.data.shoppingCatButton == '秒杀购买') {
        
        console.log('点击了', that.data.userData)
        if (that.data.seckillInfo.need_point && that.data.seckillInfo.need_point > 0 && that.data.seckillInfo.need_point > that.data.userData.points) {
          that.showIntegralPopup(4)
          return false
        }
        // if (that.data.seckillInfo.need_point && that.data.seckillInfo.need_point > 0 && that.data.seckillInfo.need_point < that.data.userData.points) {
        //   that.showIntegralPopup(1)
        //   return false
        // }
      }
      return true
    },
    formSubmit: function(e) { // 生成下发模板消息所需的formId存于服务器
        var that = this;
        if (!app.isLoginFun(this)) { //判断用户是否登录
            common.setUserInfoFun(this, app);
            return false;
        }
        if (!that.canExchange()) {
          return
        }
        // console.log(e.detail.target.dataset.bindtap);
        let bindType = e.detail.target.dataset.bindtap
        publicFun.formSubmit({
            e: e,
            that: that,
            callBack: that[bindType]
        })
    },
    /*
     *
     **分享对话框 shareModal start
     *
     */

    //显示对话框
    shareTap: function() {
        var that = this;
        if (!app.isLoginFun(this)) { //判断用户是否登录
            common.setUserInfoFun(this, app);
            return false;
        }
        that.dialog.showDialog();
    },

    //取消事件
    _cancelEvent: function() {
        var that = this;
        console.log('你点击了取消');
        try {
            clearInterval(loopDownloadTimer); // 清除检测downloadFile是否全部执行完的计时器
        } catch (e) {

        }
        // 修改画布执行状态
        if (that.data.canvasData) {
            that.data.canvasData.status = false;
        }
        that.setData({
            canvasData: that.data.canvasData
        })
        wx.hideLoading();
        that.dialog.hideDialog();
    },
    //分享好友或群
    _shareGroup: function() {
        var that = this;
        console.log('点击了分享好友或群');
        wx.showShareMenu({
            withShareTicket: true
        })
    },
    //分享朋友圈
    _shareFriendsCircle: function() {
        var that = this;
        // 节流
        if (!publicFun.stopClick(that)) return

        console.log('点击了分享朋友圈');
        let ticket = wx.getStorageSync('ticket');
        console.log("=======拼团-ticket", ticket)
        let data = {
            path: 'pages/seckill/index',
            id: that.data.id,
            uid: that.data.allInfo.seckill_user.seckill_user_id,
            share_uid: getApp().globalData.my_uid,
            shareType: 1
        }
        // wx.showLoading({
        //   title: '正在准备颜料...',
        //   mask: true
        // })
        wx.request({
            url: common.Url + 'app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
            header: {
                'Content-Type': 'application/json'
            },
            data: data,
            method: "POST",
            success: function(res) {
                console.log('获取二维码成功')
                console.log(res)
                if (res.statusCode == 200) {
                    if (res.data.err_code == 0) {
                        that.setData({
                            qrcodePath: res.data.err_msg
                        })
                        // 处理canvas
                        wx.showLoading({
                            title: '海报生成中...',
                            mask: true
                        })
                        that.creatPost();
                        // 处理canvas
                    } else {
                      wx.showToast({
                        title: '二维码获取失败',
                        icon: 'none'
                      })
                    }
                }
            },
            fail: function(res) {
              that.setComModalData(true, '温馨提示', '二维码获取失败，请重试', '我知道了', '');   //设置警告弹框
            }
        })

    },
    /*
     *
     **分享对话框 shareModal end
     *
     */
    setComModalData(isShowModal=false, title, content, cancelText, sureText) {    //自定义警告弹框内容
      this.setData({ 
        'modalData.isShowModal': isShowModal,
        'modalData.title': title,
        'modalData.content': content,
        'modalData.cancelText': cancelText,
        'modalData.sureText': sureText
      })
    },
    // 生成分享海报
    creatPost: function() {
        var that = this;
        // 1 设置画布数据
        let product_name = that.data.allInfo.productInfo.name
        let is_advance = that.data.allInfo.is_start == 1 && that.data.seckillInfo.preset_time > 0
        let BASE_IMG_URL = that.data.BASE_IMG_URL
        let priceWord = ''
        let price = that.data.seckillInfo.seckill_price * 1 / 1
        let need_point = that.data.seckillInfo.need_point
        if (price * 1 > 0) {
          priceWord = canvasFun.formatPrice(price)
          if (need_point * 1 > 0) {
            priceWord = priceWord + '+' + need_point + '积分'
          }
        } else if (need_point * 1 > 0){
          priceWord = need_point + '积分'
        }

        let canvasData = { // 画布数据
          canvasId: 'seckillPost',
          canvasWidth: 560,
          canvasHeight: 980,
          paddingLeft: 0,
          paddingTop: 0,
          bgPath: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/share_cps_bg.png', // 海报背景
          product_price: priceWord, //商品最新价格
          sales_tip: that.data.allInfo.sales_volume,   //售卖件数
          nickName: that.data.allInfo.userinfo.nickname, // 用户昵称
          product_name: product_name, // 活动名称
          text_qrcode_btm: '长按识别', // 二维码下方文字
          loadFailTapStatus: false, // 下载失败处理函数是否已执行
          // 图片数据
          avatarPath: that.data.allInfo.userinfo.avatar, // 用户头像
          qrcodePath: that.data.qrcodePath, // 二维码
          productImage: 'https://' + that.data.allInfo.product_imgs[0].image.split('://')[1], // 商品首图
        }
        console.log('is_advance ==== ', is_advance)
        let obj = canvas.px2rpx({
            w: canvasData.canvasWidth,
            h: canvasData.canvasHeight,
            base: that.data.winWidth
        });
        that.setData({
            canvasData: canvasData,
            canvasPosition: obj
        })
        let task = []
        let filePaths = ['productImage','qrcodePath','avatarPath', 'bgPath']
        for (let j = 0; j < filePaths.length; j++) {
            const filePath = filePaths[j];
            task.push(canvasFun.loadImageFileByUrl(that.data.canvasData[filePath]))
        }
        Promise.all(task).then(resultList => {
          for (let filePathIndex=0; filePathIndex < resultList.length; filePathIndex++) {
            let resultListElement = resultList[filePathIndex];
            that.data.canvasData[filePaths[filePathIndex]] = resultListElement.tempFilePath
          }
          that.setData({ canvasData: that.data.canvasData });
          that.drawCanvas();
          // 保存图片
          setTimeout(function () {
              let w = that.data.canvasData.canvasWidth;
              let h = that.data.canvasData.canvasHeight;
              that.save({
                  id: that.data.canvasData.canvasId,
                  w: w,
                  h: h,
                  targetW: w * 4,
                  targetH: h * 4
              });
          }, 300)
        }).catch(err => {
          console.log('图片转换失败---', err);
          wx.hideLoading();
          that.setData({ creatingPost: false });
          that.setComModalData(true, '温馨提示', '海报生成失败，请重试', '我知道了', '');   //设置警告弹框
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
      const ctx = wx.createCanvasContext(canvasId);
      console.log('product_price', product_price)
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
      ctx.fillText('推荐您成为闪购会员享受更多返利', toPx(canvasWidth/2), toPx(172));
      //绘制商品图片  y: 上一步172+14(字体另外一半) + 间隙34 = 220
      ctx.save();   //保存之前的内容
      ctx.beginPath();
      ctx.rect(toPx((canvasWidth - proWidth)/2), toPx(220), toPx(proWidth), toPx(proHeight));
      ctx.clip();
      ctx.drawImage(productImage, toPx((canvasWidth - proWidth)/2), toPx(220), toPx(proWidth), toPx(proHeight));
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
      let _rowwidth = _width + 15;
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
          max: 500,    //一行宽度500 - 来源_w - 间隙15
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
        console.log('row1_Data.sArr', row_1_Data.sArr, 'row2_Data.sArr', row_2_Data.sArr)
        //截取后拼装商品名称
        product_name = row_1_Data.sArr.join("") + "\n"
        if (row_2_Data.sArr) {
          product_name = row_1_Data.sArr.join("") + "\n" + row_2_Data.sArr.join("");
        }
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
            _obj.x = 30;
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
          x: 45,    //左边距30 + 来源宽度 + 右边距15
          y: 220 + proHeight + 30,
          fontSize: 32
        })
      }
  
      
      if (me.data.show_seckill_price && me.data.show_seckill_price > 0) {
        // //绘制价格符号
        ctx.beginPath();
        ctx.setFontSize(toPx(28));
        ctx.setFillStyle('#FF4444');
        ctx.fillText("¥", toPx(30), toPx(826));  

        //绘制商品优惠价格
        ctx.beginPath();
        ctx.setFontSize(toPx(46));
        ctx.setFillStyle('#FF4444');
        ctx.fillText(product_price, toPx(58), toPx(813));
      } else {
        //绘制积分
        ctx.beginPath();
        ctx.setFontSize(toPx(46));
        ctx.setFillStyle('#FF4444');
        ctx.fillText(product_price, toPx(30), toPx(813));
      }

      //绘制推荐一个好物，快来抢
      ctx.beginPath();
      ctx.setFontSize(toPx(22));
      ctx.setFillStyle('#999');
      let _sourW = ctx.measureText(source_from).width*dpr;
      ctx.fillText("推荐一个好物，快来抢", toPx(30), toPx(873));

      //绘制闪购Live 自购省钱 分享赚钱
      ctx.beginPath();
      ctx.setFontSize(toPx(22));
      ctx.setFillStyle('#999');
      ctx.fillText('闪购Live 自购省钱 分享赚钱', toPx(30), toPx(913));


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
        canvas.canvasToTempFilePath(o).then(res => {
          wx.hideLoading();
          console.log('生成的海报图片路径为-----',  res.tempFilePath);
          if (me.data.shareModalNode.data.isShow && me.data.shareModalNode) me.data.shareModalNode.hideDialog();   //关闭分享底部弹框
          me.setData({ canvasImg: res.tempFilePath, showPlaybill: true });
        })
        .catch(err => {
          console.log('生成海报失败----', err);
          wx.hideLoading();
          me.setComModalData(true, '温馨提示', '海报生成失败，请重试', '我知道了', '');   //设置警告弹框
        })
      })
      
    },
    
    // 画图 18-04-24 created by cms_ssa
    save (o) {
        let that = this;
        canvas.canvasToTempFilePath(o).then(function(res) {
            console.log('res.tempFilePath',res.tempFilePath);
            wx.hideLoading();
            o.imgSrc = res.tempFilePath;
            that.dialog.hideDialog();
            that.setData({
              showPlaybill: true
            })
            // canvas.saveImageToPhotosAlbum(o).then(function(res) {
            //     // console.log(res);
            //     wx.showModal({
            //         title: '存图成功',
            //         content: '图片成功保存到相册了，去发圈噻~',
            //         showCancel: false,
            //         confirmText: '好哒',
            //         confirmColor: '#72B9C3',
            //         success: function(res) {
            //             if (res.confirm) {
            //                 console.log('用户点击确定');
            //                 that.dialog.hideDialog();
            //                 wx.previewImage({
            //                     urls: [o.imgSrc],
            //                     current: o.imgSrc
            //                 })
            //             }
            //         }
            //     })
            // }, function(err) {
            //     console.log(err);
            // });
        }, function(err) {
            console.log(err);
        });
    },
    // 预览照片
    toPreviewFun() {
      let that= this
      wx.previewImage({
          urls:[that.data.canvasImg],
          current:that.data.canvasImg
      })
    },
    // 保存图片
    saveImg() {
      let that= this
      publicFun.checkAuthOfSaveImageToPhotosAlbum(() => { //第一步： 授权保存到相册权限
        canvas.saveImageToPhotosAlbum({imgSrc: that.data.canvasImg}).then(function (res) {
          // console.log(res);
          wx.showModal({
              title: '存图成功',
              content: '图片成功保存到相册了，去发圈噻~',
              showCancel: false,
              confirmText: '好哒',
              confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
              success: function (res) {
                if (res.confirm) {
                  console.log('用户点击确定');
                    that.setData({
                      showPlaybill: false
                    })
                }
              }
          })
        }, function (err) {
            console.log(err);
            wx.hideLoading();
            that.setData({
              showPlaybill: false
            })
            wx.showToast({
              icon: 'none',
              title: '取消保存'
            })
        });
      })
      
    },
    closePlaybillFun() {    //关闭海报
      this.setData({ showPlaybill: false });
    },
    officialAccountError(error) {
        console.log('关注公众号组件加载失败，具体原因：' + error.detail.errMsg);
        console.log({
            error
        });
        this.setData({
            applet_guide_subscribe: false
        })
    },
    oppenCat(e) {
        let that = this;
        // console.log(e.currentTarget.dataset.bindtap,e)
        console.log(e)
        if (e.currentTarget.dataset.bindtap == "payNow") {
            that.payNow()
        } else {
            that.setData({
                itemWindowShow: true
            })
        }


    },
    //遮罩点击
    maskClick: function() {
        var that = this;
        that.setData({
            maskShow: false,
            itemWindowShow: false
        })
    },

    //设置初始默认属性
    setDefaultAttr: function(v) {
        var that = this;
        console.log(that.data);

        that.setData({
            'shoppingData.specList[0].vid': '',
            'shoppingData.value[0]': '',
            'shoppingData.specList[1].vid': '',
            'shoppingData.value[1]': '',
            'shoppingData.specList[2].vid': '',
            'shoppingData.value[2]': ''
        });
        // 单规格 默认选中处理
        let single_sku_single_value = false;
        let isAttr = true;
        let sku_id = '';
        if (that.data.skuList) {
            if (that.data.skuList.length == 1) {
                sku_id = that.data.skuList[0].sku_id;
                single_sku_single_value = true;
            }
        } else {
            isAttr = false;
        }
        that.setData({
            'shoppingData.sku_id': sku_id,
            'seckillInfo.sku_id': sku_id,

            'shoppingData.single_sku_single_value': single_sku_single_value,
            isAttr: isAttr
        });


        that.setAttrText();
        that.setData({
            propertyList: v
        })
    },
    //设置属性文字描述
    setAttrText: function() {
        var that = this;
        // var text = '', attrId = '', that = this;
        // for (var d of v) {
        //     for (var c of d.values) {
        //         if (c.flag == true) {
        //             text += c.value + ' ';
        //             attrId += d.pid + ':' + c.vid;
        //         }
        //     }
        // }

        // that.setData({
        //     attrId: attrId,
        //     attrText: text == '' ? '请选择规格' : text
        // })
        // console.log(attrId)
        // for (let i = 0; i < that.data.skuList.length; i++) {
        //     if (attrId == that.data.skuList[i].properties+',') {
        //         that.setData({
        //             currentSkuPrice: that.data.skuList[i].price,
        //             originTotal: (that.data.num * that.data.skuList[i].price).toFixed(2)
        //         })
        //     }
        // }

        let valueDate = '';
        let valueNmae = '';
        let pre_buyer_count = that.data.seckillInfo.pre_buyer_count * 1;
        let skuPriceData = that.data.skuList; //商品规格列表
        let quantity = (that.data.seckillInfo.presale_amount - pre_buyer_count) * 1; //商品库存数量
        // let shoppingNum = that.data.num * 1; //输入框数量
        let shoppingNum = 1;

        if ((skuPriceData == '' || skuPriceData == undefined) && shoppingNum > quantity) { //商品无规格时判断商品库存
            that.setData({
                num: quantity
            });
            wx.showToast({
                title: '超出库存！',
                icon: 'none',
                duration: 2000
            })
            return;
        }

        for (let i in that.data.shoppingData.value) { //添加规格列表
            if (that.data.shoppingData.value[i]) {
                valueDate += that.data.shoppingData.value[i] + ';';
                valueNmae += that.data.shoppingData.name[i] + ',';
            }
        }
        valueDate = valueDate.substring(0, valueDate.length - 1);
        valueNmae = valueNmae.substring(0, valueNmae.length - 1);
        for (let i in skuPriceData) { //判断规格产品的库存以及价格
            if (skuPriceData[i].properties.includes(valueDate)) {
                if (skuPriceData[i].quantity == 0) {
                    wx.showToast({
                        title: '超出库存！',
                        icon: 'none',
                        duration: 2000
                    })
                    return;
                }

                that.setData({
                    currentSkuPrice: skuPriceData[i].price,
                    originTotal: (shoppingNum * skuPriceData[i].price).toFixed(2),
                    attrText: valueNmae == '' ? '请选择规格' : valueNmae,
                    'shoppingData.sku_id': skuPriceData[i].sku_id
                });
                if (quantity < skuPriceData[i].quantity) {
                    if (quantity < shoppingNum) {
                        that.setData({
                            num: quantity,
                            originTotal: (quantity * skuPriceData[i].price).toFixed(2)
                        });
                        wx.showToast({
                            title: '超出库存！',
                            icon: 'none',
                            duration: 2000
                        })
                        return;
                    }
                } else {
                    if (skuPriceData[i].quantity < shoppingNum) {
                        that.setData({
                            num: skuPriceData[i].quantity,
                            originTotal: (skuPriceData[i].quantity * skuPriceData[i].price).toFixed(2)
                        });
                        wx.showToast({
                            title: '超出库存！',
                            icon: 'none',
                            duration: 2000
                        })
                        return;
                    }
                }

            }
        }
    },
    //自己手动设置属性

    setMyAttr: function(e) {
        console.log("手动选择了规格e",  e.target.dataset)

        var that = this;
        console.log(that.data.skuList, e, "ssssssssssssssss")
        let id = e.target.dataset.id;
        let vid = e.target.dataset.vid;
        let pid = e.target.dataset.pid;
        let name = e.target.dataset.name;
        if (that.data.shoppingData.specList[id].vid === vid) {
          console.log('return false')
            return false;
        } else {
            let sku_id;
            let kcNum;
            if (that.data.skuList) {
                let skuPriceData_sub = that.data.skuList.filter(function(item) { //获取所有能与当前规格组合的商品规格列表
                    return item.properties.indexOf(`${pid}:${vid}`) > -1
                });
                let sku = that.data.skuList.find(item => item.properties.includes(`${pid}:${vid}`))
                console.log(sku, "skuiiiiiiiiiii", skuPriceData_sub, pid, vid)
                if (sku) {
                    sku_id = sku.sku_id;
                    kcNum = sku.quantity
                } else {
                    return wx.showToast({
                        title: '该规格无库存',
                        icon: 'none',
                        duration: 2000
                    })
                }
            }
            id = id * 1;

            that.setData({
                [`shoppingData.specList[${id}].vid`]: vid,
                [`shoppingData.value[${id}]`]: pid + ':' + vid,
                [`shoppingData.name[${id}]`]: name,
                'shoppingData.sku_id': sku_id,
                'seckillInfo.sku_id': sku_id,
                kcNum: kcNum
            })
        }
        that.setAttrText(that);
    },
    //检查属性是否未填写完整
    checkAttr: function() {
        var that = this;
        var v = that.data.propertyList;
        var text = '';
        var l = that.data.propertyList.length;

        for (var d of v) {
            for (var c of d.values) {
                var n = 0;
                if (c.flag == true) {
                    n++
                }
                if (n == 0) {
                    text += d.name
                }
            }
        }
        if (text != '') {
            wx.showToast({
                title: text + '属性未选择',
                icon: 'success',
                duration: 2000
            })
            return false
        }
    },
    showItemWindow: function() {
        var that = this;
        console.log(that.data);
        if (that.data.shoppingData.sku_id != '' && (that.data.skuList != '' && that.data.skuList != undefined)) {
            that.setData({
                maskShow: true,
                itemWindowShow: true
            })
            that.setAttrText(that);
        } else {
            that.setData({
                maskShow: true,
                itemWindowShow: true,
                'shoppingData.specList[0].vid': '',
                'shoppingData.value[0]': '',
                'shoppingData.specList[1].vid': '',
                'shoppingData.value[1]': '',
                'shoppingData.specList[2].vid': '',
                'shoppingData.value[2]': ''
            })
        }
    },
    // shoppingVid: function(e) { //选择商品规格
    //   var that = this;
    //   publicFun.shoppingVid(e, that);
    // },

    addNum: function() {
        wx.showModal({
            title: '提示',
            content: '秒杀商品限购一件',
            success(res) {
                if (res.confirm) {
                    console.log('用户点击确定')
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        })

    },


})
