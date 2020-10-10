//app.js
//wangmu 2017-02-08
var common = require('utils/common.js');
var publicFun = require('utils/public.js');
import moment from "./utils/moment.min"
var callbackObj = null;
var pageThat = null;
var refreshConfig = null;

var extConfig = wx.getExtConfigSync();
if (wx.getExtConfig) {
  wx.getExtConfig({
    success: function (res) {
      extConfig = res.extConfig;
    }
  })
}
/*  blackTheme:#000000,
    redTheme:#FA0029,
    orangeTheme:#FF5C1C,
    blueTheme:#0098F8,
    pinkDarkTheme:#FF007C,
    purpleTheme:#7948FD,
    brownTheme:#B7A392*/
extConfig.themeColor = extConfig.themeColor ? extConfig.themeColor : '#FF5C1C';
extConfig.navigatorBarType = extConfig.navigatorBarType ? extConfig.navigatorBarType : 0;

let dpr = 1;
let systemInfo = wx.getSystemInfo({
  success: function (res) {
    // 此处不用res里面本来就有的dpr返回值,安卓手机不准确
    // dpr = res.pixelRatio;
    dpr = 750 / res.windowWidth;
  },
});

App({
  setAddres() {
    return new Promise((resolve, reject) => {
      // 定位
      var latitude = wx.getStorageSync('latitude');
      var longitude = wx.getStorageSync('longitude');
      if (latitude == undefined || latitude == '') {
        wx.getLocation({
          type: 'wgs84',
          success: function (res) {
            latitude = res.latitude;
            longitude = res.longitude;
            wx.setStorage({
              key: "latitude",
              data: latitude
            });
            wx.setStorage({
              key: "longitude",
              data: longitude
            })
            setTimeout(() => {
              resolve(res);
            }, 30);
          },
          fail: function (err) {
            reject();
          }
        })
      } else {
        resolve({
          latitude,
          longitude
        });
      }
    });
  },

  getUserInfo: function (param) {
    callbackObj = param.callback ? param.callback : null;
    refreshConfig = param.refreshConfig ? param.refreshConfig : null;
    pageThat = param.pageThat ? param.pageThat : null;
    var theApp = this;
    theApp.globalData.storge = {
      callbackObj,
      refreshConfig,
      pageThat
    };
    //var users   = JSON.parse(this.globalData.userInfo);
    if (theApp.globalData.userInfo) {
      typeof callbackObj == "function" && callbackObj(this.globalData.userInfo)
    } else {


      if (getApp().globalData.initLoginStatus === false) { //首次登录没执行前，不重复调用微信登录
        return;
      }

      // 新增
      let _unlogin = true;
      let _value = wx.getStorageSync('unlogin');
      if ((_value !== undefined && _value !== "") || _value === false) {
        _unlogin = _value;
      } else {
        _unlogin = getApp().globalData.unlogin;
      }


      wx.checkSession({
        success() {
          //session_key 未过期，并且在本生命周期一直有效
          if (pageThat && (_unlogin == true)) { //判断用户是否登录
            //登录code过期
            //重新登录

            wx.login({
              success: function (responce) {
                if (responce) {
                  theApp.globalData.login = responce;
                  let str_login = JSON.stringify(responce);
                  console.log("~~~~~success-app.js->login=", str_login)
                  wx.setStorageSync('str_login', str_login);
                  if (pageThat) {
                    pageThat.userCall = function (res) {
                      publicFun.userCall(res, getApp(), pageThat)
                    }
                  }

                }
              }
            });
          }

        },
        fail() {
          // session_key 已经失效，需要重新执行登录流程
          //重新登录
          wx.login({
            success: function (responce) {
              if (responce) {

                theApp.globalData.login = responce;
                let str_login = JSON.stringify(responce);
                console.log("~~~~~fail-app.js->login=", str_login)
                wx.setStorageSync('str_login', str_login);
                if (pageThat) {
                  pageThat.userCall = function (res) {
                    publicFun.userCall(res, getApp(), pageThat)
                  }
                }
              }
            }
          });
        }
      });
      // 以上新增

    }

    //登陆跳转到之前页面
    function refresh_page(refreshConfig) {
      var params = '';
      if (refreshConfig.param) {
        params = '?';
        for (var i in refreshConfig.param) {
          if (i == 'equals') continue
          params += i + '=' + refreshConfig.param[i] + '&';
        }
      }
      wx.reLaunch({
        url: '/' + refreshConfig.url + params
      })
      /*
      if (refreshConfig.pageType == 'page') {
          wx.navigateTo({
              url: '/' + refreshConfig.url + params,
          })
      } else if (refreshConfig.pageType == 'tab') {
          wx.switchTab({
              url: '/' + refreshConfig.url + params,
          })
      }*/
    }

    function openSetting() {
      const {
        wxapp_ticket
      } = getApp().globalData;
      wx.showModal({
        title: '警告',
        content: '拒绝授权，则无法使用本小程序，请手动退出!请确认授权进入小程序!',
        showCancel: true,
        cancelText: '不授权',
        confirmText: '授权',
        success: function (res) {
          if (res.confirm) {
            wx.openSetting({
              success: function (data) {
                if (data) {
                  if (!data.authSetting["scope.userInfo"] || !data.authSetting["scope.userLocation"]) {
                    wx.login({
                      success: function (result) {
                        wx.setStorageSync('str_login', JSON.stringify(result));
                        wx.getUserInfo({
                          withCredentials: true,
                          success: function (res) {
                            var ticket = wxapp_ticket || wx.getStorageSync('ticket');
                            let data = {
                              code: result.code,
                              encryptedData: res.encryptedData,
                              iv: res.iv,
                              wxapp_ticket: ticket,
                            };
                            console.log("~~~~~~_1_app.js store_login");
                            common.post('app.php?c=wxapp&a=store_login&from=openSetting', data, setUserInfo, '');

                            function setUserInfo(result) {
                              console.log("app.js拒绝授权后再次拉起返回参数：", result)
                              try {
                                wx.setStorageSync('ticket', result.err_msg.wxapp_ticket)
                                getApp().globalData.wxapp_ticket = result.err_msg.wxapp_ticket;
                              } catch (e) {}
                              that.globalData.userInfo = result.err_msg.user
                              typeof callbackObj == "function" && callbackObj(that.globalData.userInfo)
                              // 分销商刷新页面
                              //common.post('app.php?c=store&a=index&store_id=' + that.globalData.store_id, '', 'shopHomeData', pageThat);
                              refresh_page(refreshConfig);
                            }
                          },

                          fail: function () {
                            openSetting();
                          }
                        });
                      }
                    })

                  }
                }
              },
              fail: function () {}
            });
          } else {
            openSetting();
          }
        }
      })

    }
  },

  //获取用户上次打开小程序距这次的时间差

  getTimeDifference: function () {
    try {
      //上一次打开时间
      let lastTime = wx.getStorageSync('savaTime') ? wx.getStorageSync('savaTime') : 0;
      //当前时间
      let currentTime = new Date().getTime();
      let distanceTime = currentTime - lastTime;
      //距上次打开页面时间小时间隔
      var disTime = Math.abs(distanceTime) / (1000 * 60 * 60);
      //超过半个小时，重新获取地理位置
      if (disTime > 0.5) {
        publicFun.getLocation()
      }
      // console.log("时间差=============", disTime*60+'分钟')
      wx.setStorageSync('savaTime', currentTime)
    } catch (e) {}
  },
  //分享是否添加图片分享
  shareWidthPic: function (that) {
    common.post(`app.php?c=user&a=get_share_img`, ``, sharePicFun, '');

    function sharePicFun(result) {
      if (result.err_code == 0) {
        //show_share_img=>是否展示背景图
        //share_img=>背景图地址
        app.globalData.show_share_img = result.err_msg.show_share_img;
        app.globalData.share_img = result.err_msg.share_img

        if (that) {
          that.setData({
            show_share_img: result.err_msg.show_share_img,
            share_img: result.err_msg.share_img
          })
        }
      }
    }
  },
  //分享锁粉
  shareGetFans: function (title, desc, path, shareType, imageUrl, other, leader_id) {
    const {
      show_share_img,
      share_img
    } = app.globalData;
    let url = `${path}?store_id=${app.globalData.store_id}&share_uid=${app.globalData.my_uid}&leader_id=${leader_id}&shareType=${shareType}`;
    if (other) {
      url += other;
    }

    //cps版本： 积分任务：分享商品/小程序给好友  需要带上任务号和任务类型
    let _op = wx.getStorageSync('optionObj');
    _op = _op ? JSON.parse(_op) : null;
    if (_op && _op.cur && _op.cur == 6) {
      let {
        option,
        type
      } = _op;
      url += `&cps_option=${option}&cps_type=${type}`;
    }

    //秒杀页面和cps商品页面 有专属分享图
    imageUrl = imageUrl=='cps'||imageUrl=='seckill' ? `https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/share_seckill.png?ver=1` : imageUrl;

    console.log("分享链接：", url)
    return {
      title: title,
      desc: desc || '这里发现一个好店铺，速度围观，点击进入',
      path: url,
      imageUrl: show_share_img == 1 ? (share_img) : (imageUrl || '')
    }
  },

  //请求用户手机号接口
  getIphoneNum: function (that) {
    common.post(`app.php?c=user&a=judge_user_has_phone`, ``, phoneNumData, '');

    function phoneNumData(result) {
      if (result.err_code == 0) {
        let {
          get_user_phone,
          has_phone
        } = result.err_msg;
        app.globalData.get_user_phone = get_user_phone; //是否强制获取手机号（0否)
        app.globalData.has_phone = has_phone //是否有手机号
        wx.setStorageSync('has_phone', has_phone);
        console.log("请求手机号=", app.globalData.has_phone)
        app.updatePhone(that);
      }
    }
  },
  //更新获取手机号
  updatePhone: function (that) {
    if (that) {
      //获取用户手机号
      if (app.globalData.has_phone != undefined) {
        that.setData({
          has_phone: app.globalData.has_phone
        })
        console.log("app.globalData.has_phone,", app.globalData.has_phone)
      }
      if (app.globalData.get_user_phone != undefined) {
        that.setData({
          get_user_phone: app.globalData.get_user_phone
        })
      }
    }
  },
  //解析手机号
  analysisPhoneNum: function (e, that, callback) {
    let {
      encryptedData,
      iv
    } = e.detail;
    let _str_login = wx.getStorageSync('str_login'); //获取最新code
    _str_login = _str_login ? JSON.parse(_str_login) : {};

    let data = {
      encryptedData: encryptedData,
      iv: iv,
      code: _str_login.code
    }
    common.post(`app.php?c=wxapp&a=get_wx_phone`, data, phoneNumData, '', errCallBack);

    function phoneNumData(result) { //成功获取用户手机号
      if (result.err_code != 0) return;
      let {
        phoneNumber
      } = result.err_msg;
      console.log("phoneNumber--------", phoneNumber)
      app.globalData.phoneNum = phoneNumber;
      app.globalData.has_phone = 1;
      wx.setStorageSync('has_phone', 1);
      that.setData({
        phoneNumber,
        _has_phone: 1
      });
      wx.removeStorageSync('isNewUser'); //已经不是新用户了
      wx.setStorageSync('phoneNumber', phoneNumber);
      callback && callback(result); //成功的回调函数

      app.updatePhone(that); //更新手机号
      app.savaPhoneNumber(phoneNumber);
    }
    function errCallBack() {
      callback && callback('error'); //失败的回调函数
    }
  },
  //保存用户手机号
  savaPhoneNumber: function (phoneNo) {
    let data = {
      phone: phoneNo
    }
    common.post(`app.php?c=user&a=save_user_phone`, data, savaPhoneNumberFun, '');

    function savaPhoneNumberFun(result) {}

  },
  //获取用户手机号
  getPhoneNumber: function (e, that, callback) {
    console.log("手机号获取：", e)
    that.setData({
      showgetPhone: false
    }); //关闭公共手机授权弹框
    if (e.detail.errMsg.indexOf("ok") < 0) { //拒绝手机号授权
      that.setData({
        no_user_phone: true
      });
      callback && callback('error'); //失败的回调函数
      return;
    }
    app.analysisPhoneNum(e, that, callback);
  },
  wxloginMethods(callback) { //刷新登录态的公共方法  
    wx.login({
      success(res) {
        if (res.code) {
          wx.setStorageSync('str_login', JSON.stringify(res));
          callback && callback();
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },
  globalData: {
    my_uid: 0, //用户id
    root_store_id: '',
    store_id: '',
    userInfo: null, //用户信息
    navigateBarBgColor: extConfig.themeColor, //顶部导航条背景色
    navigatorBarType: extConfig.navigatorBarType, //0 普通版 1 素雅版
    switch_store: false, //是否切换过门店
    dpr: dpr,
    storge: {
      callbackObj: null,
      refreshConfig: null,
      pageThat: null
    },
    login: {},
    store_nav_list: [],
    BASE_IMG_URL: 'https://s.404.cn/applet/', //图片访问地址
    get_user_phone: 0, //是否强制获取手机号（0否)
    has_phone: 0, //是否有手机号
    code: '', //用户登录code
    SUB_PACKAGE_BACK: '../../',
    SUB_PACKAGE_USER_URL: '/pages/USERS',
    unlogin: true,
    openId: '',
    fresh_count: 0, //刷新次数,
    wxapp_ticket: '', //ticket存储
    canIUse: true, //当前版本是否支持控件
    initLoginStatus: true, //第一次登录授权
    bottomHeight: '0px', // 底部需要上推的高度
  },
  updateThemeColor: function () {
    let that = this
    //每个生命周期获取去一次导航配置
    return new Promise((resolve, reject) => {
      if (app.globalData.get_theme_color === true) {
        resolve({
          ...app.globalData,
          themeColor: app.globalData.navigateBarBgColor
        })

      } else {
        common.post('app.php?c=wxapp&a=get_theme_color', '', res => {
          if (res.err_code === 0) {
            let app = getApp();
            let ext_config = res.err_msg.ext_config
            app.globalData.my_uid = res.err_msg.uid
            app.globalData.navigateBarBgColor = ext_config.themeColor
            app.globalData.navigatorBarType = ext_config.navigatorBarType
            app.globalData.store_nav_list = ext_config.store_nav_list || [] //自定义导航信息会存在没有配置的情况，会报错
            app.globalData.applet_guide_subscribe = ext_config.applet_guide_subscribe
            //每个生命周期获取去一次导航配置
            app.globalData.get_theme_color = true
            publicFun.setBarBgColor(app)
            resolve(ext_config)
            //淘有卖登录配置是否开启
            app.globalData.tym_open = ext_config.tym_open
            if (app.globalData.tym_open) {
              that.getModalType()
            }
          } else {
            reject(res.err_msg)
          }
        }, '')
      }
    })
  },
  //判断用户是游客身份
  isLoginFun: function (that, type) {
    let _unlogin = true,
      _has_phone = 0;
    const {
      canIUse
    } = getApp().globalData;
    let _value = wx.getStorageSync('unlogin');
    let canuser = canIUse || wx.getStorageSync('canIUse');
    let _phnum = wx.getStorageSync('has_phone');

    if ((_value !== undefined && _value !== "") || _value === false) {
      _unlogin = _value;
    } else {
      _unlogin = getApp().globalData.unlogin;
    }

    _has_phone = _phnum || getApp().globalData.has_phone;
    //isLoginFun方法页面载入就调用了，当前无按钮触发未获取到登录模式，需要判断getApp().globalData.loginData是否有值在给页面modalTyepe赋值
    if (getApp().globalData.loginData) {
      that.setData({
        modalTyepe: getApp().globalData.loginData,
        tym_open: getApp().globalData.tym_open,
        btntext: '获取验证码',
        coden: 'getCode'
      })
    }
    if (type && that) {
      that.setData({
        _unlogin,
        canIUse: canuser,
        _has_phone
      })
    } else {
      if (_unlogin == false) {
        // that.setData({
        //   showLoginModal: false
        // })
        return true;
      } else {
        // that.setData({
        //   showLoginModal: true
        // })
        return false;
      }
      if (getApp().globalData.loginData) {
        that.setData({
          modalTyepe: getApp().globalData.loginData,
          btntext: '获取验证码',
          coden: 'getCode'
        })
      }
    }
  },
  getModalType: function () {
    wx.login({
      success(res) {
        if (res.code) {
          wx.setStorageSync('str_login', JSON.stringify(res));
          //发起网络请求
          common.post('app.php?c=wxapp&a=get_login_config&code=' + res.code, '', res => {
            if (res.err_code == 0) {
              let loginData = res.err_msg
              getApp().globalData.loginData = loginData
            }

          }, '')
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }

    })
  },
  // 获取设备顶部导航高度，缓存底部需要兼容高度
  onShow() {
    console.log('app的onshow')
    let that = this
    wx.getSystemInfo({
      success(res) {
        console.log(res.safeArea.top)
        let topHeight = res.safeArea.top
        let bottomHeight = topHeight > 20 ? topHeight - 20 + 'px' : '0px'
        that.globalData.bottomHeight = bottomHeight
      }
    })
  },
  onLaunch: function (e) {
    // this.getModalType();
    let canIUser = this.checkCanUse('button.open-type.getUserInfo');
    this.globalData.canIUse = canIUser;
    wx.setStorageSync('canIUse', canIUser);

    //设置moment时间转换
    moment.locale('en', {
      longDateFormat: {
        L: "YYYY-MM-DD",
        LT: "YYYY-MM-DD HH:mm",
        LTS: "YYYY-MM-DD HH:mm:ss",
      }
    });
    wx.$moment = moment;

    /**
     * 用户初次进来登录
     */
    // this.initLoginFun();
    this.upDataVesion(); //强制更新版本信息
  },

  /**
   * 判断用户手机是否可以使用此组件
   */
  checkCanUse: function (param) {
    var status = wx.canIUse(param);
    return status;
  },
  /**
   * 初次进来登录* */
  initLoginFun: function (callback) {
    // 新增
    let _unlogin = true;
    let _value = wx.getStorageSync('unlogin');
    if ((_value !== undefined && _value !== "") || _value === false) {
      _unlogin = _value;
    } else {
      _unlogin = this.globalData.unlogin;
    }
    let that = this;

    //已登录，不进行下面校验
    if (_unlogin == false) {
      //cps_版本 回调函数
      let userinfo = wx.getStorageSync('userinfo');
      if (userinfo) userinfo = JSON.parse(userinfo);
      callback && callback({
        unlogin: _unlogin,
        user: userinfo
      })
      return;
    }
    this.globalData.initLoginStatus = false; //初次登录状态判断
    wx.checkSession({
      success() {
        //session_key 未过期，并且在本生命周期一直有效
        if (_unlogin == true) { //判断用户是否登录
          //登录code过期
          //重新登录
          that.loginMethod(callback);
        }
      },
      fail() {
        // session_key 已经失效，需要重新执行登录流程
        //重新登录
        that.loginMethod(callback);
      }
    });
    // 以上新增
  },
  loginMethod: function (callback) {
    let that = this;
    wx.login({
      success: function (responce) {
        if (responce.code) {
          const {
            code
          } = responce;
          let data = {
            code: encodeURI(code),
            codes: encodeURI(code)
          };
          wx.setStorageSync('str_login', JSON.stringify(responce));
          console.log("~~~~~_2_app.js store_login", responce);
          var _sout = setTimeout(function () {
            getApp().globalData.initLoginStatus = true; //首次用户登录
            clearTimeout(_sout);
          }, 5000)
          common.post('app.php?c=wxapp&a=store_login&from=loginMethod', data, (result) => {
            console.log("初始登录返回参数：", result)
            var _sout = setTimeout(function () {
              getApp().globalData.initLoginStatus = true; //首次用户登录
              clearTimeout(_sout);
            }, 2000)
            if (result.err_msg.user) {
              const {
                uid,
                phone
              } = result.err_msg.user;
              that.globalData.my_uid = uid;

              //cps版本： 查看用户是否授权手机号码
              let _setph = phone ? 1 : 0;
              app.globalData.has_phone = _setph;
              wx.setStorageSync('has_phone', _setph);

              if (result.err_msg.wxapp_ticket) {
                wx.setStorageSync('ticket', result.err_msg.wxapp_ticket)
                getApp().globalData.wxapp_ticket = result.err_msg.wxapp_ticket;
              }
              if (result.err_msg.unlogin) {
                app.globalData.unlogin = result.err_msg.unlogin;
                wx.setStorageSync('unlogin', result.err_msg.unlogin)
              }

              callback && callback(result.err_msg) //cps_版本 回调函数
            }
            //锁粉
            publicFun.addFans();
          }, '');

        }
      }
    });
  },
  upDataVesion: function () {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log(res.hasUpdate)
    })

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    });

  }

});
let app = getApp();
app.updateThemeColor();