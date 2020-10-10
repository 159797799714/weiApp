import http_cps from "../../../../utils/http_cps";
Page({
  data: {
    src: "",
    isEnd: false,
    backType: 1, //0顶部返回,1手机物理返回
    option: 1, //任务号
  },
  onLoad(e) {
    let {
      option,
      videoUrl
    } = e
    this.setData({
      option,
      src: videoUrl
    })
  },
  onReady(res) {
    this.videoContext = wx.createVideoContext("myVideo");
  },

  onHide() {},
  onUnload: function () {
    // 页面销毁时执行
    if (this.data.backType) {
      let {
        isEnd
      } = this.data
      wx.showToast({
        title: isEnd ? '视频已看完,可获得积分哦' : '视频未看完，还不能获得积分哦',
        icon: 'none'
      })
    }
  },
  goback() {
    let {
      isEnd
    } = this.data
    this.setData({
      backType: 0
    })

    //  返回的提示弹框
    if (!isEnd) {
      let that = this
      wx.showModal({
        title: "提示",
        content: "视频未看完，还不能获得积分哦",
        confirmText: "继续观看",
        confirmColor: "#576B95",
        cancelText: "退出观看",
        cancelColor: "#000000",
        success(res) {
          if (res.cancel) {
            // 返回上一页
            that.setData({
              backType: 0
            })
            wx.navigateBack();

          } else if (res.confirm) {
            that.setData({
              backType: 1
            })
          }
        }
      });
    } else {
      wx.navigateBack();
    }

  },
  timeUpdate(e) {
    // 播放进度变化时触发
    let {
      currentTime
    } = e.detail;
    //获取上一次的时间
    let lastTime = wx.getStorageSync("lastTime") || 0;
    //转化为整数 现在的时间
    let time = parseInt(currentTime);
    //保存现在的时间
    wx.setStorageSync("lastTime", time);
    //相差3秒
    if (time - parseInt(lastTime) > 3) {
      //跳转到上次的进度
      this.videoContext.seek(parseInt(lastTime));
    }
  },
  endHandle() {
    //结束时操作,，将传递已看完的标识
    this.setData({
      isEnd: true
    })
    // let optionObj = wx.getStorageSync("optionObj") || {};
    // wx.setStorageSync("optionObj", {
    //   ...optionObj,
    //   1: true
    // });
    // 将状态变为可领取
    let {
      option
    } = this.data
    http_cps.get('do_task_cps', {
      option,
      status: 1,
      type: "NEW"
    }, true).then(res => {
      wx.showModal({
        title: '提示',
        content: '视频已看完,可获得积分哦',
        confirmText: '我知道了',
        showCancel: false,
        success: (result) => {
          if (result.confirm) {
            wx.navigateBack();
          }

        }
      })
    })
  },
  onShareAppMessage() {
    return {
      title: "video",
      path: "page/component/pages/video/video"
    };
  },

  videoErrorCallback(e) {
    console.log("视频错误信息:");
    console.log(e.detail.errMsg);
  },

});