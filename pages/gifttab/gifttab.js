import http from "../../utils/http";
import http_cps from "../../utils/http_cps";
import publicFun from "../../utils/public";
import {
  divideNum
} from "../../utils/util"
import {
  togetherDialogData,
  togetherDialogJs
} from "../../template/together-dialog/together-dialog"

const app = getApp();

//视频广告
let videoAd = null;
// //视频广告拉取状态
// let videoAdPushStatus = false;

Page({
  data: {
    isShowModal: false,
    isShowEvery: false, //展示每日签到弹窗
    isShowInv: false, //邀请好友的成功弹窗
    signInfo: null,
    newTaskInfo: {},
    dayTaskInfo: {},
    around: [], //人气周边
    charge: [], //充电红包
    bannerIndex: 0, //页面banner
    banners: [], //首页banner列表
    type: 1, //任务类型 1 签到任务 2新手任务和日常任务
    signNum: 0, //已签到天数
    rewardPoints: 20, //奖励积分
    rewardDouble: 2, //奖励翻倍数
    options: 1, //任务号
    isReward: 0, //是否触发额外奖励
    videoUrl: "", //新手视频链接
    optionObj: {}, //任务的可领取情况
    userData: null,
    balance: '0', //初始余额
    points: 0, //初始积分
    ...togetherDialogData,
    // firstPoBa: null,
    // secondPoBa: null,
    firstPo: null,
    secondPo: null,
    canSign: false, //签到按钮是否可以签到
    inc_num: 0, //邀请好友的人数
    inc_points: 0, //邀请好友的积分
  },
  onLoad: function (options) {
    //页面加载完成
    publicFun.onLoad(app, this); // 授权

    // 创建激励式广告实例
    this.createVideo()
  },

  onReady: function () {
    //页面初次渲染完成
  },
  onShow: function () { //监听页面显示
    this.isLogin(1);

    //判断手机号码是否需要授权 授权前需要刷新登录态
    let _has_phone = this.data._has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
    if (!_has_phone) app.wxloginMethods() //新用户手机授权之前先刷新登录态

    this.getTaskInfo(1);
    this.getUserBalance();
    this.getFirstExclist(1, 12);
    this.getOptionDone(); //任务可领取情况
    this.autoInvWindow() //积分弹窗判断
  },
  onHide: function () {
    //监听页面隐藏
  },
  onPullDownRefresh() { //下拉刷新
    this.setData({
      'tabsData.activeTab': 0
    });
    this.getTaskInfo(1, 'refresh');
    this.getUserBalance('refresh');
    this.getFirstExclist(1, 8);
    this.getOptionDone()
  },
  swiperChange(e) { //轮播图swiper切换时触发
    let {
      current
    } = e.detail;
    let {
      type
    } = e.currentTarget.dataset;
    // if (type == 'activeTab') type = 'tabsData.activeTab';
    this.setData({
      [type]: current
    });
  },
  autoSignCon() {
    let {
      canSign
    } = this.data
    if (canSign) {
      this.autoSign()
      this.setData({
        isShowEvery: true
      })
    }
  },
  autoSign(flag) { //自动签到判断
    // 筛选出每日签到列表中的可签到天数
    let {
      signInfo,
    } = this.data
    let arr1 = signInfo.rules
    let onlyObj1 = arr1.find(v => v.status == 1)
    // 调用签到接口
    if (Object.prototype.toString.call(onlyObj1) === "[object Object]") {
      if (flag) {
        this.setData({
          canSign: true
        })
        return
      }
      this.setData({
        option: onlyObj1.option,
        rewardPoints: onlyObj1.reward_points,
        isReward: 0,
        signNum: signInfo.sign_num + 1,

      })
      this.getDoSign('isShowEvery')
    } else {
      // 提示今日已经签到过了无法打开签到弹窗了,弹框置灰
      if (flag) {
        this.setData({
          canSign: false
        })
      }
    }
  },
  // 邀请好友成功后,进入页面直接弹窗直接弹出弹窗
  autoInvWindow() {
    http_cps.get("invite_points_inc").then(res => {
      let {
        inc_num,
        inc_points
      } = res.data
      if (inc_points) { //如果有积分则弹出邀请好友的弹窗
        this.setData({
          isShowInv: true,
          inc_num,
          inc_points
        })
      }
    })
  },
  /**
   * 判断用户进入小程序的路径
   */
  miniProRoute() {
    let {
      newTaskInfo
    } = this.data
    // 判断新手任务需不需要添加小程序
    // let arr2 = Object.values(newTaskInfo.rules)
    let arr2 = newTaskInfo.rules
    let obj = arr2.find(v => v.option == 3)
    let optionStatus = obj.status
    if (!optionStatus) {
      // 判断用户进入小程序的路径
      let e = wx.getLaunchOptionsSync()
      let {
        scene
      } = e
      if (scene == 1001 || scene == 1089) { //从我的小程序进来
        http_cps.get("do_task_cps", {
          option: 3,
          status: 1,
          type: "NEW"
        }).then(res => {
          this.getTaskInfo()
        }).catch(err => {
          wx.showToast({
            title: err.msg,
            icon: 'none'
          })
        })
      }
    }

  },
  //  激励视频
  createVideo() {
    let that = this
    if (wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-d009f16b902fd7d7'
      })
      videoAd.onLoad(() => {
        //设置广告拉取成功
        // videoAdPushStatus = true;
      })
      videoAd.onError((err) => {
        wx.showToast({
          title: '获取积分异常,请稍后重试',
          icon: 'none'
        })

      })
      videoAd.onClose((res) => {
        if (res && res.isEnded || res === undefined) {
          //正常播放结束,可以下发奖励
          that.addUserCredits();
        } else {
          //不下发奖励
          wx.showToast({
            title: '广告播放完成后,才可获得奖励哦',
            icon: 'none'
          })
        }
      })
    }
  },
  //显示广告
  bindAddCredits() {
    this.showVideoAd();
  },
  //视频广告
  showVideoAd() {
    let that = this;
    videoAd.load()
      .then(() => {
        //重置视频广告拉取状态
        // videoAdPushStatus = false;
        videoAd.show();
      })
      .catch(err => {
        console.log(err);
        wx.showToast({
          title: '加载异常,请稍后重试...',
          icon: 'none'
        })
      });
  },
  addUserCredits() { //奖励翻倍
    let {
      type,
      option
    } = this.data
    if (type == 1) { //新手任务
      this.getSignDouble()

    } else { //日常/新手
      // 调用翻倍视频的接口
      this.getTaskSign(option < 5 ? "NEW" : "DAY", 3, true)
    }

  },
  onShareAppMessage() { //用户点击右上角分享
    let {
      nickname,
      invitation_code
    } = this.data.userData;
    let title = nickname ? `【${nickname}】` : '';
    return app.shareGetFans(`${title}推荐您享受京东拼多多专属优惠，分享还能赚佣金！`, '', `/pages/index/index`, 1, 'cps');
  },
  ...togetherDialogJs,
  isLogin(type) { //判断用户是否登录
    if (!type || typeof type != 'number') {
      return app.isLoginFun(this);
    }
    app.isLoginFun(this, type); //判断用户是否登录
  },
  toGetPhonenumAuth() { //去到手机授权页面
    wx.navigateTo({
      url: "/pages/getPhoneNumPage/getPhoneNumPage"
    });
  },
  successGetPhoneCallback(member_grade) { //获取手机号码获取成后执行的操作
    wx.removeStorageSync('success_getphone');
    if (!app.globalData.share_uid && member_grade < 1) this.getClipboardData('invitcode'); //分享进入的 不检测粘贴板
  },
  // 获取任务信息
  getTaskInfo(flag, refresh) {
    http_cps.get("gift_index_cps", {}).then(res => {
        if (refresh) wx.stopPullDownRefresh();
        this.setData({
          signInfo: res.data.sign_info,
          newTaskInfo: res.data.new_task_info,
          dayTaskInfo: res.data.day_task_info
        });
        if (flag) {
          this.autoSign(1) //自动签到判断
          this.jumpOtherMini() //导量跳转的判断
          this.miniProRoute() //用户进入小程序的判断
        }
      })
      .catch(res => {
        if (refresh) wx.stopPullDownRefresh();
        wx.showToast({
          title: res.msg,
          icon: 'none'
        });
      })
  },
  // 获取首页兑换产品
  getFirstExclist(page, pageSize) {
    let params = {
      page,
      page_size: pageSize
    }
    http_cps.get("point_change_index_cps", params).then(res => {
      this.setData({
        around: res.data.around,
        charge: res.data.charge,
        banners: res.data.banners
      });
    });
  },
  // 封装数字滚动的函数
  numScroll(val, idObj) {
    let odometer = this.selectComponent('#' + idObj.odometer),
      _firstPo = this.selectComponent('#' + idObj.firstPo),
      _secondPo = this.selectComponent('#' + idObj.secondPo)
    odometer.setValue(0);
    _firstPo.setValue(0)
    _secondPo.setValue(0)
    if (val < 10000) {
      // odometer.setValue(0);
      this.setData({
        secondPo: null
      })
      setTimeout(() => {
        odometer.update(val);
      }, 10);
    } else {
      let firstPo = divideNum(val, idObj.keepPoint, 0)
      let secondPo = divideNum(val, idObj.keepPoint, 1)
      // _firstPo.setValue(0)
      // _secondPo.setValue(0)
      this.setData({
        secondPo: secondPo.indexOf(0) === 0 ? true : null
      })
      setTimeout(() => {
        _firstPo.update(firstPo);
        _secondPo.update(secondPo);
      }, 10);
    }
  },
  // 获取用户积分和余额
  getUserBalance(refresh) {
    http_cps.get("balance_info_cps", {}).then(res => {
        if (refresh) wx.stopPullDownRefresh();

        //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
        if (!refresh) {
          let _suc = wx.getStorageSync('success_getphone');
          if (_suc) this.successGetPhoneCallback(res.data.member_grade);
        }
        let {
          points
        } = res.data
        // let points = 27800
        this.setData({
          userData: res.data,
          points
        });
        this.getMemberInfo(res.data.uid);
        //---------积分的效果-----------------------
        this.numScroll(points, {
          odometer: 'odometer',
          firstPo: 'firstPo',
          secondPo: 'secondPo',
          keepPoint: 1
        })

      })
      .catch(res => {
        if (refresh) wx.stopPullDownRefresh();
        wx.showToast({
          title: res.msg,
          icon: 'none'
        });
      })
  },
  getMemberInfo(uid) { //小猪版版获取会员信息: 主要作用是判断token是否过期  可能出现小猪过期， cps没有过期的现象
    http.post('getMemberInfo', {
        userId: uid
      }, false, this.isLogin)
      .then(res => {
        console.log('小猪版会员信息---', res.data);
      })
      .catch(res => {
        console.log('小猪版会员信息---报错了---', res);
      })
  },
  getSignDouble() { //签到任务翻倍接口
    let {
      option,
      rewardPoints,
      rewardDouble
    } = this.data
    let params = {
      option
    }
    http_cps.get("sign_double_cps", params).then(res => {
      this.setData({
        isShowModal: true,
        rewardPoints: rewardPoints * (rewardDouble - 1),
        rewardDouble: 1
      });
      // 调用一次七日任务的接口，刷新七日签到状态
      this.getTaskInfo();
      // this.getUserBalance(); //刷新积分的状态
    }).catch(err => {
      wx.showToast({
        title: err.msg,
        icon: "none"
      });
    });
  },
  // 签到任务接口
  getDoSign(isEvery) {
    let {
      option,
      isReward
    } = this.data;
    let params = {
      option,
      is_reward: isReward
    };
    http_cps
      .get("do_sign_cps", params, true)
      .then(res => {
        //  如果签到成功且无其他奖励
        if (!isEvery) {
          this.setData({
            isShowModal: true
          });
        }
        // else {
        //   this.setData({
        //     isShowEvery: true
        //   });
        // }

        // 调用一次七日任务的接口，刷新七日签到状态
        this.getTaskInfo();
        // this.getUserBalance(); //刷新积分的状态
      })
      .catch(err => {
        wx.showToast({
          title: err.msg,
          icon: "none"
        });
      });
  },
  // 任务接口
  getTaskSign(type, status, noToast) {
    let {
      option,
      rewardPoints,
      rewardDouble
    } = this.data;
    let params = {
      option,
      status,
      type
    };
    http_cps
      .get("do_task_cps", params, true)
      .then(res => {
        //  如果签到成功且无其他奖励
        this.setData({
          isShowModal: true
        });
        if (noToast) {
          this.setData({
            rewardPoints: rewardPoints * (rewardDouble - 1),
            rewardDouble: 1
          })
        }
        // 调用一次七日任务的接口，刷新七日签到状态
        this.getTaskInfo();
        // this.getTaskInfo(1);
        // if (!noToast) this.getUserBalance()
      })
      .catch(err => {
        wx.showToast({
          title: err.msg,
          icon: "none"
        });
      });
  },

  toRecord() {
    //跳转到兑换记录页面
    if (!this.isLogin()) return;
    wx.navigateTo({
      url: "/subPages/sub-gifttab/pages/exchange-record/exchange-record"
    });
  },
  goExcList(e) {
    //跳转到兑换产品列表页面
    let {
      ids,
      title,
      type
    } = e.currentTarget.dataset;
    let {
      banners
    } = this.data
    // let {
    //   charge,
    //   around
    // } = this.data
    if (!type) { //看指定的商品列表
      wx.navigateTo({
        url: "/subPages/sub-gifttab/pages/all-exchanges/all-exchanges??type=" +
          ids +
          "&title=" +
          title
      });

    } else {
      // if ((type == 1 && !charge.length) || (type == 2 && !around.length)) {
      //   wx.showToast({
      //     title: "暂无数据",
      //     icon: "none"
      //   })
      //   return
      // }
      wx.navigateTo({
        url: "/subPages/sub-gifttab/pages/all-exchanges/all-exchanges?type=" +
          type + "&banners=" + encodeURIComponent(JSON.stringify(banners))
      });
    }
  },
  goChaList() { //跳转到充电积分记录页
    wx.navigateTo({
      url: "/subPages/sub-gifttab/pages/charge-record/charge-record"
    });
  },
  gotoSign(e) { //七日任务签到
    //去签到
    let {
      item
    } = e.currentTarget.dataset;
    let {
      status, //0不可签到 1 可签到 2 已签到待翻倍 3 已签到完成 
      option,
      reward_double,
      reward_points,
      type
    } = item;
    this.setData({
      option,
      rewardDouble: reward_double,
      rewardPoints: reward_points,
      type
    })
    // 首先判断能否签到
    if (status == 3) return
    if (!status) {
      //不能签到
      wx.showToast({
        title: "只能当日签到",
        icon: "none"
      });
      return;
    } else {
      // 判断此时是签到
      if (status == 1) {
        //可签到
        this.setData({
          signNum: this.data.signNum + 1,
          isReward: 0,
        });
        this.getDoSign()
      } else {
        // 已签到待翻倍
        // 激励式视频的入口
        this.gotoDouble()
      }
    }
  },
  gotoDouble(e) {
    //去翻倍的函数
    // 激励式视频的入口
    // 调用 type/option
    this.bindAddCredits()
  },
  showSign(e) {
    let {
      item,
      curtype
    } = e.currentTarget.dataset
    this._showSign(item, curtype)
  },
  _showSign(item, curtype) {
    let {
      status, //0 待完成任务 1 待领取奖励 2 已领取待翻倍 3 已领取全部奖励
      option,
      reward_double,
      reward_points,
      type,
      video_url,
      appid
    } = item;
    this.setData({
      option,
      rewardPoints: reward_points,
      rewardDouble: reward_double,
      videoUrl: video_url,
      type
    })
    switch (status) {
      case 0:
        this.taskHandle(option, curtype, video_url, appid);
        break;
      case 1:
        // 新手任务不翻倍
        if (option < 5) {
          // 调用新手任务接口
          this.getTaskSign("NEW", 2)
        } else {
          // 调用日常任务接口
          this.getTaskSign("DAY", 2)
        }

        break;
      case 2:
        return
        break;
      case 3:
        return
        break;
      default:
        break;
    }
  },
  hideSign() {
    this.setData({
      isShowModal: false
    });
    this.getUserBalance()
  },
  hideSign1() {
    this.setData({
      isShowEvery: false
    });
    this.getTaskInfo(1, 'refresh');
    this.getUserBalance()
  },
  hideSign2() {
    this.setData({
      isShowInv: false
    });
    this.getUserBalance()
  },
  // 各种任务操作
  taskHandle(option, type, videoUrl, appId) {
    switch (option) {
      case 1: //观看新手教程
        wx.navigateTo({
          url: "/subPages/sub-gifttab/pages/watch-video/watch-video?option=" + option + "&videoUrl=" + videoUrl
        });
        break;
      case 2: //查看购物佣金
        // 跳转到我的页面
        wx.setStorageSync('optionObj', JSON.stringify({
          cur: 2,
          option,
          type
        }));
        wx.switchTab({
          url: "/pages/my/my"
        });
        break;
      case 3: //添加到我的小程序
        // 跳转到小程序的教程页面
        // wx.navigateTo({
        //   url: "/subPages/sub-gifttab/pages/add-mini-guide/add-mini-guide?option=" + option + "&videoUrl=" + videoUrl
        // });
        return
        break;
      case 4: //填写邀请码
        this.toolFun();
        break;
      case 5: //日常  浏览商品
        wx.setStorageSync('optionObj', JSON.stringify({
          cur: 5,
          option,
          type
        }));
        wx.switchTab({
          url: '/pages/index/index'
        });
        break;
      case 6: // 分享商品给好友
        wx.setStorageSync('optionObj', JSON.stringify({
          cur: 6,
          option,
          type
        }));
        wx.switchTab({
          url: '/pages/index/index',
        });
        break;
      case 7: //邀请好友,直接拉起微信分享
        // wx.switchTab({
        //   url: '/pages/index/index',
        // });
        break;
      case 8: //购买商品
        wx.switchTab({
          url: '/pages/index/index',
        });
        break;

      case 9: //导量
        // 跳转到另一个小程序
        this.getOtherMiniApps(appId)
        break;

      default:
        break;
    }
  },
  toolFun() { //填写邀请码
    this.setData({
      'commonModalData.showCommonModa': true,
      'commonModalData.type': 3,
      'commonModalData.invitfocus': true,
      'commonModalData.invitcode': '',
      'commonModalData.invitcodeArr': new Array(6)
    })
  },
  getOtherMiniApps(appid) { //获取频道要跳转的对应的小程序信息
    wx.navigateToMiniProgram({
      appId: appid,
      fail(err) {
        console.log('小程序跳转失败----', err)
      },
      success(res) {
        // 打开成功
        console.log("跳过去了");
        let time = new Date().getTime()
        wx.setStorageSync("nowTime", time)
        console.log("跳过去的时间", wx.getStorageSync('nowTime'));
      }
    })
  },
  jumpOtherMini() {
    let e = wx.getLaunchOptionsSync()
    let {
      scene
    } = e
    // 是否跳到其他小程序了
    let comeTime = new Date().getTime()
    console.log("回来的时间", comeTime);
    let cacheTime = wx.getStorageSync('nowTime') || ""
    console.log("存储的时间", cacheTime);
    let obj = this.data.dayTaskInfo.rules.find(v => v.option == 9)
    let optionStatus = obj.status
    console.log("回来的场景值", scene);
    if (!optionStatus && cacheTime && new Date(comeTime).toDateString() === new Date(cacheTime).toDateString()) { //如果有缓存判断是否是当天且相差30秒
      if (comeTime - cacheTime >= 30000) {
        //  发起请求
        http_cps.get('do_task_cps', {
          option: 9,
          status: 1,
          type: "DAY"
        }, true).then(res => {
          // wx.showModal({
          //   title: '提示',
          //   content: '导量任务已完成,可获得积分哦',
          //   confirmText: '我知道了',
          //   showCancel: false,
          //   success: (result) => {
          //     wx.removeStorageSync('nowTime')
          //     wx.removeStorageSync('hasTip')
          //     this.getTaskInfo();
          //     // this.getUserBalance()
          //   }
          // })
          wx.removeStorageSync('nowTime')
          wx.removeStorageSync('hasTip')
          this.getTaskInfo();
        })
      } else {
        let hasTip = wx.getStorageSync('hasTip') || false
        if (!hasTip) {
          wx.setStorageSync('hasTip', true)
          wx.showModal({
            title: '提示',
            content: '请试玩30秒',
            confirmText: '我知道了',
            showCancel: false
          })
        }

      }
    } else {
      wx.removeStorageSync('nowTime')
      wx.removeStorageSync('hasTip')
    }
  },
  getOptionDone() { //  新手视频是否看完
    let optionObj = wx.getStorageSync("optionObj");
    optionObj = optionObj ? JSON.parse(optionObj) : {};
    this.setData({
      optionObj
    });
    return optionObj;
  },
  gotoInv() { //跳转至邀请好友页面
    wx.navigateTo({
      url: '/subPages/sub-gifttab/pages/invite-friend/invite-friend'
    })
  }
});