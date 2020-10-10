// pages/LIVEVIDEO//pages/liveVideo/liveVideoDetail.js
var app = getApp();
var _url = app.globalData.SUB_PACKAGE_BACK;
var common = require(_url + '../../utils/common.js');
var publicFun = require(_url + '../../utils/public.js');
var log = require(_url + '../../utils/log.js');
var canvasFun = require(_url + '../../utils/canvas-post.js');
var canvas = require(_url + '../../utils/canvas.js');
let page = 1;
var downTime, animateTime, couponTime
// 点赞动画参数
const queue = {};
let timer = 0;
let likeCtx = null;
// const imgURL = "https://s.404.cn/applet/images/qudao/dianzan1/"
const imgURL = "../image/"
const image1 = imgURL + "icon1.png";
const image2 = imgURL + "icon2.png";
const image3 = imgURL + "icon3.png";
const image4 = imgURL + "icon4.png";
const image5 = imgURL + "icon5.png";
const image6 = imgURL + "icon6.png";
// 即时通讯插件
import TIM from '../../miniprogram_npm/tim-wx-sdk/index.js';
import COS from "../../miniprogram_npm/cos-wx-sdk-v5/index.js";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    codenum: 3, //3s倒计时
    live_id: '', //直播id
    statusBegin: true, //开始直播黑屏
    couponPopup: false, //优惠券领取弹窗
    coverImg: "",
    liveVideoData: {
      couponShow: false, //优惠券
      goodsListShow: false, //商品列表
      shoppingShow: false, //商品规格
      cutoff_status: 2, // 0异常断流    1 正常断流  2正常  3恢复断流
    },
    canvasShow: true, //点赞画板
    barrageArr: [],
    goodsData: [], //商品列表
    inputInfo: '跟主播聊点什么...',
    inputBottom: '', //输入框距离底部的高度
    nameColor: ['rgb(132,218,246)', 'rgb(236,187,80)', 'rgb(184,213,159)', 'rgb(251,207,174)'], //弹幕发布者名称颜色
    videoContext: '', //直播组件
    loginFail: false, //登录失败
    statusTips: 0, //关注/购买/进入/分享提示信息状态，默认0 3：关注，1：进入，4：分享，2：购买
    isFollow: 0, //是否关注0:未关注，1:已关注
    tip: {}, //关注/购买/进入/分享提示信息
    tipReally: false, //是否显示购买真数据
    shoppingData: '', //分享页商品列表规格弹窗
    no_more: false, //底部显示无商品
    dialog: {
      dialogHidden: true,
      titleMsg: "海报图保存失败，用户取消或未开启保存到相册权限",
      determineBtnTxt: "去开启"
    },
    timeDownVal: {}, //倒计时
    isClearScreen: false, //是否清屏 false：否，true：是
    screenBtnShow: true, //清屏按钮显示与否
    sx: 0,//海报商品图裁剪x轴坐标
    sy: 0,//海报商品图裁剪y轴坐标
    sw: 0,//海报商品图裁剪宽
    sh: 0,//海报商品图裁剪高
    couponActive: false,//关注/限时（活动）优惠券弹窗
    couponType: 3,//优惠券类型0:关注优惠券，1：限时优惠券
    couponStatus: 3,//优惠券的状态 0：未关注，1：已关注并领取
    couponTime: 3,//限时优惠券 0：未领取，1：领取成功，2领取失败
    couponNum: 3,//限时优惠券倒计时数字
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    page = 1;
    console.log('直播id', options)
    publicFun.setBarBgColor(app, that); // 设置导航条背景色
    publicFun.height(that);
    app.isLoginFun(that); //判断用户是否登录
    console.log(getApp().globalData, "getApp().globalData.loginDatagetApp().globalData.loginDatagetApp().globalData.loginData")
    console.log('是否未登录', that.data._unlogin, app.isLoginFun(that));
    // 是否登录
    if (!app.isLoginFun(that)) {
      that.setData({
        _unlogin: true
      })
    };
    // 其他页面进入
    if (options.live_id) {
      that.setData({
        live_id: options.live_id
      });
      if (options.isShare == 1) {
        that.setData({
          isScene: false
        })
      } else {
        that.setData({
          isScene: true
        })
      }
    }
    if (options.store_id != undefined && options.store_id != '') {
      app.globalData.store_id = options.store_id;
    } 
    // 小程序白屏问题
    if (options.imgsrc) {
      console.log(options.imgsrc, "optionsoptionsoptions")
      that.setData({
        coverImg: options.imgsrc
      });
    }
    if (options.status) {
      console.log(options.status, "optionsoptionsoptions")
      that.setData({
        optionsStatus: options.status
      });
    }
    // 扫码进入判断
    if (options.scene != undefined && options.scene != 'wxapp') {
      var scene = decodeURIComponent(options.scene);
      console.log("二维码", scene);
      if (scene) {
        var scene_arr = scene.split(',');
        if (scene_arr.length == 2) {
          // 扫后台码进入直播间
          app.globalData.store_id = scene_arr[0]
          var live_id = scene_arr[1];
          this.setData({
            live_id: live_id,
            isScene: true
          });
        } else if (scene_arr.length > 2) { //扫分享码进来的
          app.globalData.store_id = scene_arr[0];
          app.globalData.share_uid = scene_arr[3];
          var live_id = scene_arr[1];
          this.setData({
            live_id: live_id,
            isScene: true
          });
        }
      };
    }
    that.comingLive();
    that.liveVideoFun();
    that.liveVideoFunInfo();
    that.goodsFun();
    that.couponFun();
    that.livingGoodsFun();
  },
  // 直播详情数据
  liveVideoFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_live',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        live_id: that.data.live_id
      };
    common.post(url, data, 'liveVideoData', that, '', true)
  },
  // 直播详情数据
  liveVideoFunInfo: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_live_info',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        live_id: that.data.live_id
      };
    common.post(url, data, 'liveVideoDataInfo', that, '', true)
  },
  liveVideoData: function(res) {
    var that = this;
    console.log(res,"getlive-------------")
    that.setData({
      status: res.err_msg.status,
      liveVideoDataimg: res.err_msg,
      liveVideoData: Object.assign(that.data.liveVideoData, res.err_msg)
    });
    // 直播中
    if (res.err_code == 0 && res.err_msg.status == 1) {
      // 调用点赞动画
      that.likeClick();      
    }
    // 直播未开始
    if (res.err_code == 0 && res.err_msg.status == 0) {
      // 倒计时
      that.timeDown(downTime); //进来就执行一遍防止1s时间的空白
      downTime = setInterval(function() {
        that.timeDown(downTime);
      }, 1000);
    }
  },
  liveVideoDataInfo: function(res) {
    var that = this;
    console.log(res, "getliveinfo-------------")
    that.setData({
      status: res.err_msg.status,
      liveVideoDataInfo: res.err_msg,
      liveVideoData: Object.assign(that.data.liveVideoData, res.err_msg)
    });
    // 直播中
    if (res.err_code == 0 && res.err_msg.status == 1) {
      if (that.data.liveVideoData.subscribe == 0){
        // 直播中，未关注的用户，1min后开启关注领券弹窗
        that.rightAbout();
      }      
      // 关注/进入/分享/购买 进入动画
      if (res.err_msg.initdata.length > 0) {
        that.tipFun();
      }
    }
  },
  // 登录IM
  comingLive: function() {
    let that = this;
    common.post('app.php?c=tencent_live&a=getTxImAppid', '', function(res) {
      // 创建 SDK 实例
      let tim = TIM.create({
        SDKAppID: res.err_msg.tx_im_appid
      });
      that.setData({
        tim: tim
      })
      // 设置 SDK 日志输出级别为 release 级别
      tim.setLogLevel(1);
      // 注册 COS SDK 插件
      tim.registerPlugin({
        'cos-js-sdk': COS
      });
      // 登录相关信息(用户登录 IM SDK 才能正常收发消息)
      let promise = tim.login({
        userID: res.err_msg.identifier,
        userSig: res.err_msg.sign
      });
      let openId = wx.getStorageSync('openId');
      promise.then(function(imResponse) {
        console.log('登录成功', imResponse.data);
        log.info('用户openID', openId, '登录成功', imResponse.data);
        that.setData({
          loginFail: false
        })
      }).catch(function(imError) {
        // publicFun.warning('登录失败', that);
        console.log('失败', 'login error:', imError);
        log.info('用户openID', openId, '登录失败', imError);
        that.setData({
          loginFail: true
        })
      });
      // 监听事件
      tim.on(TIM.EVENT.MESSAGE_RECEIVED, function(event) {
        if (event.data) {
          let reciver_msg = event.data;
          console.log(reciver_msg)
          console.log(typeof reciver_msg[0]._elements[0])
          for (var i in reciver_msg) {
            let imResponse = reciver_msg[i];
            let userName = that.analysisName(imResponse, 'recived');
            let _context = that.analysisContent(imResponse, 'recived');
            console.log("***userName***", userName, "***content***", _context);
            if (typeof(_context) == 'object') {
              if (_context.type == 'like_num') { //点赞数
                that.setData({
                  'liveVideoData.like_num': _context.like_num
                })
              } else if (_context.type == 'view_num') { //观看人数
                that.setData({
                  'liveVideoData.view_num': _context.view_num
                })
              } else if (_context.type == 'live_subscribe') { //关注主播
                that.setData({
                  'tip.followName': _context.nickname,
                  statusTips: 3,
                  tipReally: true
                });
                that.tipAnimate();
                that.clearAnimate(3);
              } else if (_context.type == 'live_share') { //分享直播间
                that.setData({
                  'tip.shareName': _context.nickname,
                  statusTips: 4,
                  tipReally: true
                });
                that.tipAnimate();
                that.clearAnimate(4);
              } else if (_context.type == 'live_tips') { //购买和进入
                if (_context.isreal == 1) { //真数据
                  let isbuy = _context.buy.isbuy;
                  let iscomin = _context.comin.iscomin;
                  if (isbuy == 1 && iscomin == 0) { //仅购买
                    that.setData({
                      'tip.buyName': _context.user[0].nickname,
                      'tip.buyProduct': _context.buy.product,
                      statusTips: 2,
                      tipReally: true
                    });
                    that.tipAnimate();
                    that.clearAnimate(2);
                  } else if (iscomin == 1 && isbuy == 0) { //仅进入
                    that.setData({
                      'tip.joinName': _context.user[0].nickname,
                      statusTips: 1,
                      tipReally: true
                    });
                    that.tipAnimate();
                    that.clearAnimate(1);
                  } else { //购买和进入都有取购买
                    that.setData({
                      'tip.buyName': _context.user[0].nickname,
                      'tip.buyProduct': _context.buy.product,
                      statusTips: 2,
                      tipReally: true
                    });
                    that.tipAnimate();
                    that.clearAnimate(2);
                  }
                } else {
                  let initdata = []
                  that.setData({
                    'liveVideoData.initdata': initdata.concat(_context),
                    tipReally: false,
                    statusTips: 0
                  });
                  that.tipFun();
                }
              } else if (_context.type == 'product') { //商品列表数
                that.setData({
                  'goodsData.list': that.data.goodsData.list.concat(_context)
                });
                that.goodsFun();
              } else if (_context.type == 'teach_product') { //正在讲解商品
                that.setData({
                  'liveVideoData.is_take': true,
                  'liveVideoData.teach_product': _context
                });
                that.goodsFun();
              } else if (_context.type == 'live_status') { //流中断
                console.log(_context.type, _context.status, " _context.msg _context.msg")
                //status//是否异常断流
                if (_context.status == 1) {
                  that.setData({
                    'liveVideoData.status': 2
                  })
                  that.livingGoodsFun()
                } else {
                  that.setData({
                    'liveVideoData.cutoff_status': _context.status
                  })
                  if (_context.status == 0) {
                    // that.setData({
                    //   'liveVideoData.tips_text': "主播暂时离开一会，请耐心等待！\n更多惊喜即将登场~"
                    // })
                  } else if (_context.status == 3) {
                    // //恢复断流时卡屏重新调直播接口
                    // that.liveVideoFun();
                    // that.liveVideoFunInfo()
                    // that.bindResume()
                    that.bindPlay()
                    that.setData({
                      'liveVideoData.cutoff_status': 2
                    })
                  }
                }
              } else if (_context.type == 'sync_product_price') { //秒杀商品/商品改价
                that.setData({
                  'liveVideoData.seckill_product': that.data.liveVideoData.seckill_product.concat(_context)
                })
                that.goodsFun();
              } else if (_context.type == 'live_open_start') {//未开播界面开播直接进入直播间
                that.setData({
                  'liveVideoData.status': 1,
                  live_id: _context.live_id,
                  optionsStatus: 1
                });
                that.liveVideoFun();
                that.liveVideoFunInfo();
                that.goodsFun();
                that.couponFun();
                that.livingGoodsFun();
                that.bindPlay();
              } else if (_context.type == 'live_starttime_change'){//后台调整开播时间
                that.setData({
                  'liveVideoDataInfo.start_time': _context.new_start_time
                });
                clearInterval(downTime);
                that.timeDown(downTime); //进来就执行一遍防止1s时间的空白
                downTime = setInterval(function () {
                  that.timeDown(downTime);
                }, 1000);
              } else if (_context.type == 'grant_limit_product' && that.data.liveVideoData.status == 1){//限时优惠券的推送
                that.setData({
                  couponActive: true,
                  couponType: 1,//1：限时优惠券
                  couponTime: 0,//未领取
                  limitCoupon: _context,
                  live_id: _context.live_id,
                  limit_coupon_id: _context.id
                });
                var couponNum = that.data.couponNum;
                var couponNumTime = setInterval(function () {
                  --couponNum;
                  if (couponNum >= 0) {
                    that.setData({
                      couponNum: couponNum
                    });
                  } else {
                    clearInterval(couponNumTime);
                  }
                }, 1000);
              }
            } else {
              // 弹幕消息
              var objMsg = {};
              objMsg.name = userName;
              objMsg.content = _context;
              if (userName != '@TIM#SYSTEM') {
                that.data.barrageArr.push(objMsg);
              }
              that.setData({
                barrageArr: that.data.barrageArr
              });
              that.pageScrollToBottom();
              console.log(that.data.barrageArr)
            }
          }
        }
      });
    }, '')
  },
  // 关注/进入/分享/购买 动画
  tipAnimate: function() {
    let that = this;
    let tipanimation = wx.createAnimation({
      duration: 500,
      transformOrigin: '50% 50% 0',
      timingFunction: 'linear'
    })
    tipanimation.translateX(0).step()
    that.setData({
      tipanimation: tipanimation.export()
    });
    if (that.data.tipReally == false) {
      that.setData({
        statusTips: 0
      });
      let comingBuy = that.data.liveVideoData.initdata[0];
      let comingBuyIndex = Math.floor(Math.random() * comingBuy.user.length);
      let comingBuyName = comingBuy.user[comingBuyIndex].nickname;
      let buyNum = comingBuy.buy.xfrequency;
      let cominNum = comingBuy.comin.xfrequency;
      var statusTipsing = 0;
      if (buyNum && buyNum * 1 > 0 && cominNum && cominNum * 1 > 0) {
        let random = Math.random();
        let buyGdp = buyNum / (buyNum * 1 + cominNum * 1);
        let cominGdp = cominNum / (buyNum * 1 + cominNum * 1);
        // console.log(buyGdp, cominGdp, random);
        if (random >= 0 && random < buyGdp) {
          statusTipsing = 2
        } else {
          statusTipsing = 1
        }
      } else if (buyNum && buyNum * 1 > 0 && cominNum && cominNum == 0) {
        statusTipsing = 2
      } else if (buyNum && buyNum * 1 == 0 && cominNum && cominNum * 1 > 0) {
        statusTipsing = 1
      } else if (buyNum && buyNum * 1 > 0 && !cominNum) {
        statusTipsing = 2
      } else if (!buyNum && cominNum && cominNum * 1 > 0) {
        statusTipsing = 1
      } else if (buyNum && buyNum * 1 == 0 && !cominNum) {
        statusTipsing = 0
      } else if (!buyNum && cominNum && cominNum * 1 == 0) {
        statusTipsing = 0
      } else {
        statusTipsing = 0
      }
      that.setData({
        statusTips: statusTipsing,
        'tip.buyName': comingBuyName || '',
        'tip.buyProduct': comingBuy.buy.product || '',
        'tip.joinName': comingBuyName || ''
      });
    } else {
      that.setData({
        statusTips: that.data.statusTips
      });
    }
    setTimeout(function() {
      tipanimation.translateX(300).step()
      that.setData({
        tipanimation: tipanimation.export(),
        tipReally: false
      });
    }, 10);
  },
  // 关注/进入/分享/购买 动画调用
  tipFun: function() {
    let that = this;
    let comingBuy = that.data.liveVideoData.initdata[0];
    var comingNum = 0;
    if (comingBuy.buy.xfrequency && comingBuy.comin.xfrequency) {
      comingNum = comingBuy.buy.xfrequency * 1 + comingBuy.comin.xfrequency * 1;
    } else if (comingBuy.buy.xfrequency && !comingBuy.comin.xfrequency) {
      comingNum = comingBuy.buy.xfrequency * 1;
    } else if (!comingBuy.buy.xfrequency && comingBuy.comin.xfrequency) {
      comingNum = comingBuy.comin.xfrequency * 1;
    }
    if (comingNum >= 40) {
      comingNum = 40
    }
    if (comingNum > 0) {
      clearInterval(animateTime);
      console.log('进入次数', comingNum)
      animateTime = setInterval(function() {
        that.tipAnimate();
      }, 60 * 1000 / comingNum);
    }
  },
  // 清除动画
  clearAnimate: function(animateStatus) {
    let that = this;
    var clearAnimateTime = setTimeout(function() {
      if (that.data.statusTips == animateStatus) {
        that.setData({
          statusTips: 0
        });
      }
      clearTimeout(clearAnimateTime);
    }, 2000);
  },
  // 关注
  followClick: function() {
    let that = this;
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
    console.log(that.data.liveVideoData, "--------------------------")
    if (that.data.liveVideoData.subscribe_template_id && that.data.liveVideoData.subscribe_template_id.length > 0) {
      if (that.data.liveVideoData.subscribe == 0) {
        that.setData({
          isFollow: 1
        });
        // 点击关注授权模板消息
        wx.requestSubscribeMessage({
          tmplIds: that.data.liveVideoData.subscribe_template_id,
          success(res) {
            console.log(res);
            if (res[that.data.liveVideoData.subscribe_template_id] == "accept") { //点击确定授权
              that.followFun();
            } else { //点击取消授权
              publicFun.warning('预约失败', that);
            }
          }
        })
      } else {
        that.setData({
          isFollow: 0
        });
        that.followFun();
      }
    } else {
      if (that.data.liveVideoData.subscribe == 0) {
        that.setData({
          isFollow: 1
        });
        that.followFun();
      } else {
        that.setData({
          isFollow: 0
        });
        that.followFun();
      }
    }
  },
  // 关注函数
  followFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=subscribe',
      data = {
        live_id: that.data.live_id,
        anchor_id: that.data.liveVideoData.anchor_id,
        status: that.data.isFollow,
        phone: that.data.phoneNumber
      };
    common.post(url, data, 'followData', that, '', true)
  },
  followData: function(res) {
    let that = this;
    console.log(res);
    if (that.data.liveVideoData.subscribe == 0) {
      that.setData({
        'liveVideoData.subscribe': 1
      });
      if (that.data.liveVideoData.status == 1){
        // 正在直播中调用关注优惠券
        that.aboutCouponFun();
        clearInterval(couponTime);
      }      
      publicFun.warning('关注成功', that);
    } else {
      that.setData({
        'liveVideoData.subscribe': 0
      });
      publicFun.warning('已取消关注', that);
    }
  },
  // 关注优惠券的立即使用与立即关注按钮
  rightUsrAbout:function(){
    let that = this;
    if (that.data.couponStatus == 0){//未关注（立即关注）
      that.setData({
        couponActive: false
      });
      that.followClick();//点击关注
    } else if (that.data.couponStatus == 1) {//已关注并领取(立即使用)
      that.setData({
        couponActive: false
      });
      that.goodsListShow();//显示全部商品
    }
  },
  // 直播中，未关注的用户，1min后开启关注领券弹窗
  rightAbout:function(){
    let that = this;
    if (that.data.liveVideoData.status == 1 && that.data.liveVideoData.subscribe == 0){
      var comingTime = 0;
      couponTime = setInterval(function () {
        ++ comingTime;
        if (comingTime >= 60){
          // 正在直播中调用关注优惠券
          that.aboutCouponFun();
          clearInterval(couponTime);
        }
      }, 1000);
    }
  },
  // 关注优惠券函数
  aboutCouponFun:function(){
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_subscribe_coupon',
      data = {
        live_id: that.data.live_id
      };
    common.post(url, data, 'aboutCouponData', that, '', true)
  },
  aboutCouponData:function(res){
    let that = this;
    that.setData({
      aboutCouponData: res.err_msg.list
    });
    if (that.data.liveVideoData.status == 1 && that.data.aboutCouponData.length != 0) {//直播间关注成功后弹领取关注优惠券
      if (that.data.aboutCouponData.receive_status == 2) {
        that.setData({
          couponActive: true,
          couponType: 0,
          couponStatus: 1
        })
      } else if (that.data.aboutCouponData.receive_status == 0){
        that.setData({
          couponActive: true,
          couponType: 0,
          couponStatus: 0
        });
      }
    }
  },
  // 打开限时优惠券
  openTimeCoupon:function(){
    let that = this;
    that.setData({
      couponActive: true,
      couponType: 1//1：限时优惠券
    });
    that.receiveCoupons();
  },
  // 限时优惠券的按钮
  rightUserClose: function(){
    let that = this;
    if (that.data.couponTime == 1) {//领取成功（立即使用）
      that.setData({
        couponActive: false
      });
      that.goodsListShow();//显示全部商品
    } else if (that.data.couponTime == 2) {//领取失败(关闭)
      that.setData({
        couponActive: false
      });
    }
  },
  // 分享页商品
  livingGoodsFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=getLiveProducts',
      data = {
        live_id: that.data.live_id,
        page: 1
      };
    common.post(url, data, 'livingGoods', that, '', true)
  },
  livingGoods: function(res) {
    var that = this;
    that.setData({
      livingGoods: res.err_msg
    });
    if (res.err_msg.next_page == 0) {
      that.setData({
        no_more: true
      });
    }
  },
  // 商品数据
  goodsFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_goods_list',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        live_id: that.data.live_id
      };
    common.post(url, data, 'goodsData', that, '', true)
  },
  goodsData: function(res) {
    var that = this;
    that.setData({
      goodsData: res.err_msg
    });
  },
  // 商品的按钮点击显示商品列表
  goodsListShow: function(e) {
    let that = this;
    if (e){
      var goodsLength = e.currentTarget.dataset.goodslength;
    }else{
      var goodsLength = that.data.goodsData.list.length;
    }
    that.setData({
      couponPopup: false
    })
    if (goodsLength == 0) {
      publicFun.warning('暂无商品', that);
    } else {
      that.setData({
        'liveVideoData.goodsListShow': true,
        screenBtnShow: false,
        canvasShow: false
      });
    }
  },
  // 关闭商品列表
  goodsListClose: function() {
    let that = this;
    that.setData({
      'liveVideoData.goodsListShow': false,
      screenBtnShow: true,
      canvasShow: true
    });
  },
  // 点击弹出商品规格
  openShop: function(e) {
    var that = this;
    that.setData({
      'liveVideoData.goodsListShow': false,
      screenBtnShow: false,
      canvasShow: false
    });
    publicFun.oppenShopping(e, that);
  },
  // 入购物车
  addCartBtn: function(e) {
    var that = this;
    that.setData({
      'liveVideoData.shoppingShow': false,
      screenBtnShow: true
    });
    publicFun.oppenShopping(e, that);
  },
  // 立即购买
  payment: function(e) {
    var that = this;
    that.setData({
      'liveVideoData.shoppingShow': false,
      screenBtnShow: true
    });
    publicFun.payment(that, e)
  },
  plus: function() { //加
    var that = this;
    publicFun.plus(that);
  },
  reduce: function() { //减
    var that = this;
    publicFun.reduce(that);
  },
  // 点击聚焦商品数量输入框
  shoppingFocus: function() {
    var that = this;
    that.setData({
      shoppingInputFocus: true
    });
  },
  //关闭购物车规格选择框遮罩层
  closeShopping: function(e) {
    var that = this;
    that.setData({
      'liveVideoData.shoppingShow': false,
      'shoppingData.shoppingShow': false,
      screenBtnShow: true,
      canvasShow: true
    });
  },
  shoppingBlur: function(e) { //输入框失去焦点
    var that = this;
    publicFun.shoppingBlur(e, that)
  },
  shoppingFocus: function(e) { //输入框聚焦
    let that = this;
    that.setData({
      'shoppingData.shoppingNum': e.detail.value
    })
  },
  shoppingChange: function(e) { //输入框输入
    let that = this;
    that.setData({
      'shoppingData.shoppingNum': e.detail.value
    })
  },
  shoppingVid: function(e) { //选择商品规格
    var that = this;
    publicFun.shoppingVid(e, that);
  },
  selectDeliverDate: function(e) {
    let {
      index
    } = e.currentTarget.dataset;
    this.setData({
      "shoppingData.deliver_date_index": index
    })
  },
  messageInput: function(e) { //留言内容
    var that = this;
    let index = e.target.dataset.index;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].value = e.detail.value;
    this.setData({
      'shoppingData': that.data.shoppingData
    })
  },

  bindDateChange: function(e) { //选择日期
    var that = this;
    let index = e.target.dataset.index;
    let date = e.detail.value;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].date = date;
    that.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  bindTimeChange: function(e) { //选择时间
    var that = this;
    let index = e.target.dataset.index;
    let time = e.detail.value;
    that.data.shoppingData.shoppingCatData.custom_field_list[index].time = time;
    that.setData({
      'shoppingData': that.data.shoppingData
    })
  },
  addImg: function(e) { //图片上传
    var that = this;
    let index = e.target.dataset.index;
    publicFun.addImgMessage(that, index);
  },

  // 分享页加入购物车
  oppenShopping: function(e) {
    var that = this;
    publicFun.oppenShopping(e, that);
  },
  // 优惠券数据
  couponFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=get_coupon_list',
      data = {
        store_id: app.globalData.store_id || common.store_id,
        live_id: that.data.live_id
      };
    common.post(url, data, 'couponData', that, '', true)
  },
  couponData: function(res) {
    var that = this;
    that.setData({
      couponData: res.err_msg
    });
  },
  // 优惠券的按钮点击
  couponList: function() {
    let that = this;
    that.setData({
      'liveVideoData.couponShow': true,
      screenBtnShow: false,
      canvasShow: false,
      couponPopup: false
    });
  },
  //关闭优惠券提示框遮罩层
  closeCoupon: function(e) {
    var that = this;
    that.setData({
      'liveVideoData.couponShow': false,
      screenBtnShow: true,
      canvasShow: true
    });
  },
  // 领取优惠券
  receiveCoupons: function(e) {
    var that = this;
    if (!app.isLoginFun(this)) { //判断用户是否登录
      return false;
    }
    var coupon_id;
    if (that.data.limit_coupon_id){
      coupon_id = that.data.limit_coupon_id
    }else{
      let index = e.currentTarget.dataset.index;
      coupon_id = that.data.couponData.list[index].id;
    }
    
    let data = {
      coupon_id: coupon_id,
      live_id: that.data.live_id
    }
    common.post('app.php?c=coupon&a=collect', data, coupontsData, '');
    function coupontsData(result) {
      if (result.err_code == 0) {
        that.setData({
          screenBtnShow: false
        });
        //新的领取弹窗
        that.closeCoupon();
        if (that.data.limit_coupon_id){
          // 限时优惠券领取成功
          that.setData({
            couponTime: 1//领取成功
          })
        }else{
          that.data.couponData.list[index].number++;
          that.setData({
            couponData: that.data.couponData,
            index: index,
            couponPopup: true
          })
        }        
        let codenum = 3;
        let interTime = setInterval(function() {
          if (codenum > 0) {
            that.setData({
              codenum: codenum--
            });
          } else {
            clearInterval(interTime);
            that.couponPopupClose()
          }
        }, 1000)
      }else{
        // 限时优惠券领取失败
        if (that.data.limit_coupon_id) {
          that.setData({
            couponTime: 2//领取失败
          })
        }
      }
    }
  },
  // 新的领取弹窗关闭
  couponPopupClose: function() {
    let that = this
    that.setData({
      couponPopup: false
    })
  },
  // 关闭 -- 关注/限时(活动)优惠券
  couponActiveClose: function(){
    let that = this
    that.setData({
      couponActive: false
    });
  },
  // 清屏
  clearScreen: function() {
    console.log(666)
    let that = this;
    let isClearScreen = !that.data.isClearScreen
    that.setData({
      isClearScreen: isClearScreen
    });
    let clearanimation = wx.createAnimation({
      duration: 500,
      transformOrigin: '50% 50% 0',
      timingFunction: 'ease'
    });
    if (isClearScreen) {
      clearanimation.opacity(0.2).translateX(400).step()
      that.setData({
        clearanimation: clearanimation.export()
      });
    } else {
      clearanimation.opacity(1).translateX(0).step()
      that.setData({
        clearanimation: clearanimation.export()
      });
    }
  },

  // 点击输入框调取键盘
  tapInput: function() {
    let that = this;
    if (!app.isLoginFun(this)) { //判断用户是否登录
      return false;
    }
    that.setData({
      inputFocus: true,
      inputInfo: that.data.inputInfo == '跟主播聊点什么...' ? '' : that.data.inputInfo,
      isClearInput: false
    });
  },
  // 聚焦事件
  focusInput: function(e) {
    let that = this;
    console.log('键盘高度', e.detail.height);
    that.setData({
      inputBottom: e.detail.height
    });
  },
  // 失去焦点事件
  blurInput: function(e) {
    let that = this;
    if (that.data.isClearInput == false) {
      that.setData({
        inputInfo: e.detail.value || '跟主播聊点什么...',
        inputBottom: ''
      });
    } else {
      that.setData({
        inputInfo: '跟主播聊点什么...',
        inputBottom: ''
      });
    }
  },
  // 输入框输入事件
  inputChange: function(e) {
    let that = this;
    that.setData({
      inputInfo: e.detail.value
    });
  },
  // 监听键盘事件
  sendInput: function(e) {
    let that = this;
    console.log('点击发送', e.detail.value);
    that.setData({
      inputInfo: '',
      isClearInput: true
    });
    let _val = e.detail.value;
    that.sendMsg(_val);
  },
  sendInputBtn: function() {
    let that = this;
    console.log('按钮点击发送', that.data.inputInfo);
    let _val = that.data.inputInfo;
    that.setData({
      inputInfo: '',
      isClearInput: true
    });
    that.sendMsg(_val);
  },
  // 弹幕聊天信息发送
  sendMsg: function(_val) {
    let that = this;
    let tim = that.data.tim;
    var _val = _val.trim();
    if (_val != "") {
      let message = tim.createTextMessage({
        to: that.data.liveVideoData.group_id,
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
          text: _val
        }
      });
      // 2. 发送消息
      let promise = tim.sendMessage(message);
      promise.then(function(imResponse) {
        // 发送成功
        console.log("imResponse发送成功", imResponse);
        let userName = that.analysisName(imResponse);
        let _context = that.analysisContent(imResponse);
        console.log("***userName***", userName, "***content***", _context);
        var objMsg = {};
        objMsg.name = userName;
        objMsg.content = _context;
        that.data.barrageArr.push(objMsg);
        that.setData({
          barrageArr: that.data.barrageArr
        });
        that.pageScrollToBottom();
      }).catch(function(imError) {
        // 发送失败
        console.log('sendMessage error:', imError);
        publicFun.warning(imError.name + ':' + imError.message, that);
      });
    }
  },
  // 获取随机颜色
  getRandomColor: function() {
    const rgb = []
    for (let i = 0; i < 3; ++i) {
      let color = Math.floor(Math.random() * 256).toString(16)
      color = color.length == 1 ? '0' + color : color
      rgb.push(color)
    }
    return '#' + rgb.join('')
  },
  pageScrollToBottom: function() {
    let that = this;
    wx.createSelectorQuery().selectAll('.chat-list').boundingClientRect(function(res) {
      // 使页面滚动到底部
      console.log(res);
      let top = 0;
      res.forEach((rect) => {
        top = top + rect.height
      })
      console.log(top)
      if (top > 145) {
        top = top - 145;
        that.setData({
          scrollTop: top
        })
      }
    }).exec();
  },
  // 解析返回用户名
  analysisName: function(data, type) {
    if (data && !type) {
      var _from = data.data.message.from;
      if (_from) {
        var ind = _from.lastIndexOf("_");
        if (ind > 0) {
          _from = _from.substr(0, ind)
        }
      }
      return _from;
    } else if (data && type == 'recived') {
      var _from = data.from;
      if (_from) {
        var ind = _from.lastIndexOf("_");
        if (ind > 0) {
          _from = _from.substr(0, ind)
        }
      }
      return _from;
    }
  },
  // 解析返回消息
  analysisContent: function(imResponse, type) {
    if (!type && imResponse.data.message && imResponse.data.message.elements) {
      let elements = imResponse.data.message.elements[0];
      if (elements) {
        let content = elements.content ? elements.content.text : '';
        return content;
      }
    } else if (type == 'recived' && imResponse.elements) {
      let elements = imResponse.elements[0];
      if (elements) {
        let content = elements.content ? elements.content.text : '';
        if (content == undefined || content == 'undefined' || content == '') {
          content = elements.content ? (elements.content.data ? elements.content.data : '') : '';
          if (content && content.length > 0) {
            content = JSON.parse(content)
          }
        }
        return content;
      }
    }
  },
  // 点赞
  clickHeart: function() {
    let that = this;
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
    that.likeClick();
    let isLoding = true;
    let url = 'app.php?c=tencent_live&a=set_like',
      data = {
        live_id: that.data.live_id
      };
    common.post(url, data, 'clickHeartData', that, '', isLoding)
  },
  clickHeartData: function(res) {
    var that = this;
    that.setData({
      clickHeartData: res.err_msg
      // 'liveVideoData.like_num': ++that.data.liveVideoData.like_num
    });
  },
  // 点赞动画
  likeClick() {
    const anmationData = {
      id: new Date().getTime(),
      timer: 0,
      opacity: 0,
      pathData: this.generatePathData(),
      image: [image1, image2, image3, image4, image5, image6],
      imageIndex: Math.floor(Math.random() * (4 - 0 + 1)) + 0,
      factor: {
        speed: 0.01, // 运动速度，值越小越慢
        t: 0 //  贝塞尔函数系数
      }
    };
    if (Object.keys(queue).length > 0) {
      queue[anmationData.id] = anmationData;
    } else {
      queue[anmationData.id] = anmationData;
      this.bubbleAnimate();
    }
  },
  getRandom(min, max) {
    return Math.random() * (max - min) + min;
  },

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  generatePathData() {
    const p0 = {
      x: 40,
      y: 400
    };
    const p1 = {
      x: this.getRandom(20, 30),
      y: this.getRandom(200, 300)
    };
    const p2 = {
      x: this.getRandom(0, 80),
      y: this.getRandom(100, 200)
    };
    const p3 = {
      x: this.getRandom(0, 80),
      y: this.getRandom(0, 50)
    };
    return [p0, p1, p2, p3];
  },

  updatePath(data, factor) {
    const p0 = data[0]; // 三阶贝塞尔曲线起点坐标值
    const p1 = data[1]; // 三阶贝塞尔曲线第一个控制点坐标值
    const p2 = data[2]; // 三阶贝塞尔曲线第二个控制点坐标值
    const p3 = data[3]; // 三阶贝塞尔曲线终点坐标值

    const t = factor.t;

    /*计算多项式系数*/
    const cx1 = 3 * (p1.x - p0.x);
    const bx1 = 3 * (p2.x - p1.x) - cx1;
    const ax1 = p3.x - p0.x - cx1 - bx1;

    const cy1 = 3 * (p1.y - p0.y);
    const by1 = 3 * (p2.y - p1.y) - cy1;
    const ay1 = p3.y - p0.y - cy1 - by1;

    /*计算xt yt的值 */
    const x = ax1 * (t * t * t) + bx1 * (t * t) + cx1 * t + p0.x;
    const y = ay1 * (t * t * t) + by1 * (t * t) + cy1 * t + p0.y;
    return {
      x,
      y
    };
  },
  bubbleAnimate() {
    var anmationData;
    Object.keys(queue).forEach(key => {
      anmationData = queue[+key];
      const {
        x,
        y
      } = this.updatePath(
        anmationData.pathData,
        anmationData.factor
      );
      const speed = anmationData.factor.speed;
      anmationData.factor.t += speed;
      likeCtx.drawImage(anmationData.image[anmationData.imageIndex], x, y, 30, 30);
    });
    likeCtx.draw();
    if (anmationData.factor.t > 1) {
      delete queue[anmationData.id];
      clearTimeout(timer);
      anmationData = {
        id: new Date().getTime(),
        timer: 0,
        opacity: 0,
        pathData: this.generatePathData(),
        image: [image1, image2, image3, image4, image5],
        imageIndex: Math.floor(Math.random() * (4 - 0 + 1)) + 0,
        factor: {
          speed: 0.01, // 运动速度，值越小越慢
          t: 0 //  贝塞尔函数系数
        }
      };
      queue[anmationData.id] = anmationData;
      this.bubbleAnimate();
      anmationData.factor.t = 0;
    } else {
      timer = setTimeout(() => {
        this.bubbleAnimate();
      }, 20);
    }
  },

  // 播放状态变化事件
  statechange(e) {
    let that = this;
    console.log('live-player code:--------------------------', e.detail.code)
    if (e.detail.code == 2004) {
      that.setData({
        'statusBegin': false
      })
    }
    if (e.detail.code == -2301) {
      that.setData({
        'liveVideoData.cutoff_status': 0
      })
    }
    return e.detail.code
  },
  error(e) {
    let that = this;
    console.error('live-player error:', e.detail.errMsg)
    publicFun.warning(e.detail.errMsg, that);
  },
  bindPlay() {
    this.ctx.play({
      success: res => {
        console.log('play success')
      },
      fail: res => {
        console.log('play fail')
      }
    })
  },
  bindPause() {
    this.ctx.pause({
      success: res => {
        console.log('pause success')
      },
      fail: res => {
        console.log('pause fail')
      }
    })
  },
  bindStop() {
    this.ctx.stop({
      success: res => {
        console.log('stop success')
      },
      fail: res => {
        console.log('stop fail')
      }
    })
  },
  bindResume() {
    this.ctx.resume({
      success: res => {
        console.log('resume success')
      },
      fail: res => {
        console.log('resume fail')
      }
    })
  },
  bindMute() {
    this.ctx.mute({
      success: res => {
        console.log('mute success')
      },
      fail: res => {
        console.log('mute fail')
      }
    })
  },
  // 获取手机号
  getPhoneNumber(e) {
    let that = this;
    // 检查登录态是否过期
    wx.checkSession({
      success(res) {
        app.getPhoneNumber(e, that, that.data.code);
      },
      fail(err) {
        // session_key 已经失效，需要重新执行登录流程
        wx.login({
          success: res => {
            that.data.code = res.code;
            wx.setStorageSync('str_login', JSON.stringify(res));
            app.getPhoneNumber(e, that, res.code);
          }
        });
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    let that = this;
    this.ctx = wx.createLivePlayerContext('player');
    likeCtx = wx.createCanvasContext("bubble", this);
    // 获取菜单按钮的信息(单位px)；
    var data = wx.getMenuButtonBoundingClientRect();
    that.setData({
      boundHeight: data.height,
      boundtop: data.top
    });
    // 加载分享组件 
    setTimeout(function() {
      that.dialog = that.selectComponent("#shareModal");
      console.log('分享组件', that.dialog)
    }, 1000);
  },
  // 倒计时
  timeDown: function(downTime) {
    let that = this;
    let nowTime = Math.round(new Date().getTime() / 1000).toString();
    let start_time = that.data.liveVideoDataInfo.start_time;
    var t = (start_time - nowTime);
    if (t >= 0) { //防止倒计时到0后继续倒计时变为负数了
      let str = Math.floor(t / 86400) + '天' + Math.floor(t % 86400 / 3600) + '时' + Math.floor(t % 86400 % 3600 / 60) + '分' + t % 60 + '秒';
      that.setData({
        isShowDownTime: true,
        'timeDownVal.day': Math.floor(t / 86400),
        'timeDownVal.time': Math.floor(t / 3600),
        'timeDownVal.minute': Math.floor(t % 86400 % 3600 / 60),
        'timeDownVal.second': t % 60
      });
    } else {
      that.setData({
        isShowDownTime: false,
        'timeDownVal.day': 0,
        'timeDownVal.time': 0,
        'timeDownVal.minute': 0,
        'timeDownVal.second': 0
      });
      clearInterval(downTime);
    }
  },
  // 点击预约
  appointClick: function() {
    let that = this;
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
    if (that.data.liveVideoData.is_preparetips == 0) {
      wx.requestSubscribeMessage({
        tmplIds: that.data.liveVideoData.subscribe_template_id,
        success(res) {
          console.log(res);
          if (res[that.data.liveVideoData.subscribe_template_id] == "accept") { //点击确定授权
            publicFun.warning('预约成功', that);
            that.appointFun();
          } else { //点击取消授权
            publicFun.warning('预约失败', that);
          }
        }
      })
    } else if (that.data.liveVideoData.is_preparetips == 1) {
      publicFun.warning('已预约', that);
    } else {
      publicFun.warning('已发送', that);
    }
  },
  appointFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=addPrepareTips',
      data = {
        live_id: that.data.live_id,
        cfrom: 0,
        openid: wx.getStorageSync('openId')
      };
    common.post(url, data, 'appointData', that)
  },
  appointData: function(res) {
    var that = this;
    that.setData({
      shareNumData: res.err_msg,
      'liveVideoData.is_preparetips': 1
    });
  },
  // 分享
  //显示对话框
  shareTap: function() {
    let that = this;
  
    
    // that.dialog.showDialog();
    that.setData({
      isShowShare: true,
      isShow: true, canvasShow: false
    })
  },
  //取消事件
  _cancelEvent: function() {
    var that = this;
    that.hideDialog();
  },
  //分享好友或群
  _shareGroup: function() {
    var that = this;
    wx.showShareMenu({
      withShareTicket: true
    });
  },
  shareFriendUnlogin:function(){
    let that = this;
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
  },
  //分享朋友圈（分享海报图）
  _shareFriendsCircle: function() {
    var that = this;
    if (!app.isLoginFun(that)) {//判断用户是否登录
      return false;
    }
    console.log('分享朋友圈');
    let ticket = wx.getStorageSync('ticket');
    let data = {
      path: 'pages/LIVEVIDEO/pages/liveVideo/liveVideoDetail',
      id: that.data.live_id,
      uid: 0,
      share_uid: getApp().globalData.my_uid,
      shareType: 'get_live'
    }
    wx.showLoading({
      title: '正在生成中...',
      mask: true
    })
    wx.request({
      url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
      header: {
        'Content-Type': 'application/json'
      },
      data: data,
      method: "POST",
      success: function(res) {
        console.log('获取二维码成功')
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
          } else if (res.data.err_code == 1000) {
            console.log('未发布，暂不支持分享');
            wx.hideLoading();
            wx.showModal({
              title: '温馨提示',
              content: res.data.err_msg,
              confirmText: '好哒',
              confirmColor: app.globalData.navigateBarBgColor,
              showCancel: false,
              success: function(res) {
                that.hideDialog();
              }
            });
          }
        }
      },
      fail: function(res) {
        wx.hideLoading();
      }
    })
  },
  // 生成分享海报
  creatPost: function() {
    let that = this;
    // 1 设置画布数据
    let liveVideoData = that.data.liveVideoData;
    let liveVideoDataimg = that.data.liveVideoDataimg;
    let canvasData = { // 画布数据
      canvasId: 'productPost',
      canvasWidth: 750,
      canvasHeight: 1270,
      paddingLeft: 0,
      paddingTop: 20,
      whProportion: 1.2,
      nickname: liveVideoData.nickname, //主播名称
      shopName: liveVideoData.store_name, // 店铺名称
      liveName: liveVideoData.title, //直播名称
      liveDes: liveVideoData.description, //直播描述
      text_qrcode_btm: '长按二维码进入直播', // 二维码下方文字
      // 图片数据
      userAvatar: liveVideoDataimg.avatar, //主播头像
      store_logo: liveVideoDataimg.store_logo, //店铺logo
      qrcodePath: 'https://' + that.data.qrcodePath.split('://')[1], // 二维码
      coverImage: liveVideoDataimg.cover_img, // 背景图
      start_time: "直播时间：" + liveVideoData.start_time //直播开始时间
    };
    let obj = canvas.px2rpx({
      w: canvasData.canvasWidth,
      h: canvasData.canvasHeight
    });
    that.setData({
      canvasData: canvasData,
      canvasPosition: obj
    })
    let task = []
    let filePaths = ['coverImage', 'qrcodePath', 'store_logo', 'userAvatar']
    for (let j = 0; j < filePaths.length; j++) {
      const filePath = filePaths[j];
      task.push(canvasFun.loadImageFileByUrl(that.data.canvasData[filePath]))
    }

    Promise.all(task).then(resultList => {
      for (let filePathIndex = 0; filePathIndex < resultList.length; filePathIndex++) {
        let resultListElement = resultList[filePathIndex];
        that.data.canvasData[filePaths[filePathIndex]] = resultListElement.tempFilePath
      }
      that.setData({
        canvasData: that.data.canvasData
      });
      // that.drawCanvas();
      that.getImageMes();
      setTimeout(function() {
        let w = that.data.canvasData.canvasWidth;
        let h = that.data.canvasData.canvasHeight;
        that.save({
          id: that.data.canvasData.canvasId,
          w: w,
          h: h
        });
      }, 300)
    }).catch(err => {
      console.log(err);
    })
  },
  // 画图海报
  drawCanvas: function() {
    let that = this;
    let w = that.data.canvasData.canvasWidth;
    let h = that.data.canvasData.canvasHeight;
    let left = that.data.canvasData.paddingLeft;
    let top = that.data.canvasData.paddingTop;
    // 内部偏移量
    let innerLeft = 30;
    // 内部商品图片高度
    let imgH = w * 1.2;
    // 头像半径
    let head_r = 50;
    // 店铺logo半径
    let shop_r = 25;
    // 二维码半径
    let qrode_r = 80;
    let positionY = 0;

    let liveName = that.data.canvasData.liveName;
    let liveDes = that.data.canvasData.liveDes;
    let shopName = that.data.canvasData.shopName;
    let text_qrcode_btm = that.data.canvasData.text_qrcode_btm;
    let start_time = that.data.canvasData.start_time;
    // 生成画笔
    const ctx = wx.createCanvasContext(that.data.canvasData.canvasId);
    // 绘制白色圆角背景
    canvas.roundRect({
      ctx: ctx,
      x: left,
      y: top,
      w: w,
      h: h,
      r: 20,
      blur: 20,
      shadow: 'rgba(180,180,180,.4)'
    });
    
    // 绘制背景图
    // canvas.roundImg({
    //   ctx: ctx,
    //   x: left,
    //   y: top,
    //   img: that.data.canvasData.coverImage,
    //   w: w,
    //   h: imgH,
    //   r: 20,
    //   blur: 14,
    //   shadow: 'rgba(180,180,180,.4)',
    //   // 是否显示蒙层
    //   cover: false,
    //   // 蒙层高度
    //   coverH: 140
    // });

    // that.getImageMes()
    var sx = that.data.sx,
      sy = that.data.sy,
      sw = that.data.sw,
      sh = that.data.sh;
    console.log(sx, "*************", sy, "*************", sw, "*************", sh)
    canvas.roundImg({
      ctx: ctx,
      x: left,
      sx: sx,
      y: top,
      sy: sy,
      img: that.data.canvasData.coverImage,
      w: w,
      sw: sw,
      h: imgH,
      sh: sh,
      r: 20,
      blur: 14,
      shadow: 'rgba(180,180,180,.4)',
      // 是否显示蒙层
      cover: false,
      // 蒙层高度
      coverH: 140
    });
    //绘制黑色半透明背景层x0, y0, r0, x1, y1, r1
    canvas.blackBgRect({
      ctx: ctx,
      x: left,
      y: top,
      w: w,
      h: imgH,
      r: 20,
      blur: 14,
    })

    
    // 绘制头像
    positionY = top + 50;
    canvas.circleImg({
      ctx: ctx,
      img: that.data.canvasData.userAvatar,
      r: head_r,
      x: left + 45,
      y: positionY,
      w: head_r * 2,
      h: head_r * 2
    });

    // 绘制主播名字
    canvas.drawText({
      ctx: ctx,
      text: that.data.canvasData.nickname,
      x: left + head_r * 2 + 75,
      y: positionY + head_r - 20,
      fontSize: 40,
      color: '#fff'
    });
    // 判断是否有描述
    var botHeight = imgH - 60
    if (liveDes.length>0){
      botHeight = imgH - 60
    }else{
      botHeight = imgH
    }
    // 绘制直播名称
    if (liveName.length > 20) {
      liveName = liveName.slice(0, 20) + "...";
      canvas.drawText({
        ctx: ctx,
        text: liveName,
        x: left + innerLeft,
        y: botHeight - 80,
        fontSize: 40,
        color: '#fff'
      });
    } else {
      canvas.drawText({
        ctx: ctx,
        text: liveName,
        x: left + innerLeft,
        y: botHeight - 90,
        fontSize: 40,
        color: '#fff'
      });
    }
    // 绘制直播时间
    canvas.drawText({
      ctx: ctx,
      text: start_time,
      x: left + innerLeft,
      y: botHeight - 40,
      fontSize: 30,
      color: '#fff'
    });

    // 绘制直播描述
    if (liveDes.length > 23) {
      if (liveDes.length < 46) {
        liveDes = liveDes.slice(0, 23) + '\n' + liveDes.slice(23, liveDes.length);
      } else {
        liveDes = liveDes.slice(0, 23) + '\n' + liveDes.slice(23, 45) + "...";
      }
      canvas.drawMultiText({
        ctx,
        gap: 15,
        text: liveDes,
        x: left + innerLeft,
        y: botHeight,
        fontSize: 30,
        color: '#fff'
      })
    } else {
      canvas.drawText({
        ctx: ctx,
        text: liveDes,
        x: left + innerLeft,
        y: botHeight,
        fontSize: 30,
        color: '#fff'
      });
    }
  
    // 绘制店铺名称    
    if (shopName.length > 15) {
      // 绘制店铺logo
      canvas.circleImg({
        ctx: ctx,
        img: that.data.canvasData.store_logo,
        r: shop_r,
        x: w / 2 - 300 - shop_r-10,
        y: imgH + 40,
        w: shop_r * 2,
        h: shop_r * 2
      });

      shopName = shopName.slice(0, 15) + '\n' + shopName.slice(20, 29) + "...";
      canvas.drawText({
        ctx: ctx,
        text: shopName,
        x: w / 2 - 300 + shop_r,
        y: imgH + 48,
        fontSize: 40
      });      
    } else {
      let name_r = shopName.length*40/2
      // 绘制店铺logo
      canvas.circleImg({
        ctx: ctx,
        img: that.data.canvasData.store_logo,
        r: shop_r,
        x: w / 2 - name_r - shop_r-10,
        y: imgH + 40,
        w: shop_r * 2,
        h: shop_r * 2
      });

      canvas.drawText({
        ctx: ctx,
        text: shopName,
        x: w / 2 - name_r + shop_r ,
        y: imgH + 48,
        fontSize: 40
      });
    }
    // 绘制二维码
    canvas.drawImage({
      ctx: ctx,
      img: that.data.canvasData.qrcodePath,
      x: (w - qrode_r * 2) / 2,
      y: imgH + shop_r * 2 + 60,
      w: qrode_r * 2,
      h: qrode_r * 2
    });

    // 绘制二维码下面文字
    canvas.drawText({
      ctx: ctx,
      text: text_qrcode_btm,
      x: w / 2 - 130,
      y: imgH + shop_r * 2 + qrode_r * 2 + 100,
      fontSize: 30,
      baseline: 'middle',
      color: '#030000'
    });

    // 最终绘出画布
    ctx.draw();
  },

  // 保存到相册
  save: function(o) {
    let that = this;
    // 把当前画布指定区域的内容导出生成指定大小的图片
    canvas.canvasToTempFilePath(o).then(function(res) {
      // console.log(res);
      wx.hideLoading();
      o.imgSrc = res.tempFilePath;
      that.setData({
        canvasImg: res.tempFilePath
      })
      // saveImageToPhotosAlbum图片保存到本地相册
      canvas.saveImageToPhotosAlbum(o).then(function(res) {
        // 统计分享次数
        that.shareNumFun();
        // console.log(res);
        wx.showModal({
          title: '存图成功',
          content: '图片成功保存到相册了，去发圈噻~',
          showCancel: false,
          confirmText: '好哒',
          confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
          success: function(res) {
            if (res.confirm) {
              console.log('用户点击确定');
              if (that.data.isShowShare) {
                that.hideDialog();
              }
              wx.previewImage({
                urls: [o.imgSrc],
                current: o.imgSrc
              })
            }
          }
        })
      }, function(err) {
        console.log(err);
        wx.hideLoading();
        that.setData({
          'dialog.dialogHidden': false
        })
      });
    }, function(err) {
      console.log(err);
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 保持屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    let that = this;
    wx.setKeepScreenOn({
      keepScreenOn: false,
    });
    clearInterval(downTime);
    clearInterval(animateTime);
    clearInterval(couponTime);
    let tim = that.data.tim;
    console.log(tim)
    tim.off(TIM.EVENT.MESSAGE_RECEIVED, function(event) {
      console.log('页面监听卸载', event)
    });
    let promise = tim.logout();
    promise.then(function(imResponse) {
      console.log(imResponse.data); // 登出成功
    }).catch(function(imError) {
      console.warn('logout error:', imError);
    });
    if (that.data.liveVideoData.status == 1) {
      that.quitGroup()
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=getLiveProducts';
    that.listPushData(++page, that, url);
  },
  // 上拉加载方法(分页)
  listPushData: function(page, that, url) {
    //订单相关页面下拉加载
    if (that.data.livingGoods.next_page == 0) {
      return
    }
    wx.showToast({
      title: "加载中..",
      icon: "loading"
    });
    let data = {
      live_id: that.data.live_id,
      page: page
    };
    common.post(url, data, function(result) {
      //添加数据
      var list = that.data.livingGoods.products;
      for (var i = 0; i < result.err_msg.products.length; i++) {
        list.push(result.err_msg.products[i]);
      }
      that.setData({
        'livingGoods.products': list,
        'livingGoods.next_page': result.err_msg.next_page
      });
      if (result.err_msg.next_page == 0) {
        that.setData({
          no_more: true
        });
      }
    }, '');
  },

  // 分享次数统计
  shareNumFun: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=liveShareCount',
      data = {
        live_id: that.data.live_id
      };
    common.post(url, data, 'shareNumData', that)
  },
  shareNumData: function(res) {
    var that = this;
    that.setData({
      shareNumData: res.err_msg
    });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    let that = this;
    if (!app.isLoginFun(this)) { //判断用户是否登录
      return false;
    }
    console.log('转发');
    that.shareNumFun();
    let liveVideoData = that.data.liveVideoData;
    return getApp().shareGetFans(liveVideoData.title, ` `, `pages/LIVEVIDEO/pages/liveVideo/liveVideoDetail`, 1, liveVideoData.cover_img, `&live_id=${that.data.live_id}`);
  },
  // 去商品回放页面
  goRecordvideo: function(e) {
    let that = this;
    wx.navigateTo({
      url: `/pages/LIVEVIDEO/pages/liveVideo/goodsPlayback?product=${e.currentTarget.dataset.product}&live_id=${that.data.live_id}&filesrc=${e.currentTarget.dataset.filesrc}`
    })
  },
  //退出直播间
  // app.php ? c = tencent_live#a=quit_group
  quitGroup: function() {
    let that = this;
    let url = 'app.php?c=tencent_live&a=quit_group',
      data = {
        live_id: that.data.live_id
      };
    common.post(url, data, 'quitGroupdata', that)
  },
  quitGroupdata: function(res) {
    console.log(res, "退出直播间")
  },
  getImageMes: function () {
    let that = this;
    var sx, sy, sw, sh, imgH = 510;
    // var sx =  0,  sw = 510,  imgW = 510;
    // var sy = 0, sh = 510 * that.data.canvasData.whProportion, imgH = 510 * that.data.canvasData.whProportion;
    wx.getImageInfo({
      src: that.data.canvasData.coverImage,
      success(res) {
        var imgw = res.width,
          imgh = res.height,
          whProportion = that.data.canvasData.whProportion;
        console.log(imgw, "--------------");
        console.log(imgh, "--------------");
        console.log(that.data.canvasData.whProportion, "--------------");
        //如果图宽大于高&&图宽小于高*whProportion
        if ((imgh * whProportion > imgw) && imgw > imgh) {
          console.log(11);
          sx = 0;
          sy = 0;
          sw = imgh / whProportion;
          sh = imgh
          //如果图宽小于高&&图高大于*whProportion宽
        } else if (imgw < imgh && (imgh < imgw * whProportion)) {
          console.log(22);
          sx = 0;
          sy = 0;
          sw = imgw;
          sh = imgw * whProportion
          //如果图宽大于高*whProportion
        } else if (imgw > imgh * whProportion) {
          console.log(33);
          sx = (imgw - imgh / whProportion) / 2;
          sy = 0;
          sw = imgh / whProportion;
          sh = imgh
          //如果图高大于*whProportion宽
        } else if (imgh > imgw * whProportion) {
          console.log(44);
          sx = 0;
          sy = (imgh - imgw * whProportion) / 2;
          sw = imgw;
          sh = imgw * whProportion
          //正方形
        } else {
          sx = 0;
          sy = 0;
          sw = imgw;
          sh = imgw * whProportion
        }
        that.setData({
          sx: sx,
          sy: sy,
          sw: sw,
          sh: sh
        });
        that.drawCanvas();
      }
    })
  },

  hideDialog() {
    let that = this;
    // that.setData({
    //     cls: 'bottom-modal-hide'
    // })
    // time = setTimeout(function () {
    that.setData({
      isShow: !that.data.isShow,
      canvasShow:true
    })
    // }, 300);
  },
  //展示弹框
  showDialog() {
    this.setData({
      isShow: !this.data.isShow,
      cls: 'bottom-modal-show'
    })
  },
})