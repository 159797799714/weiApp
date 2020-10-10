var common = require('../../../utils/common.js');
var publicFun = require('../../../utils/public.js');
var canvasFun = require('../../../utils/canvas-post.js');
var canvas = require('../../../utils/canvas.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vipData: {},//当前页商品、主题数据
    ewmImgUrl: "", //二维码地址；
    shopImge: "", //商品地址；
    avaTarUrl: '', //头像本地地址
    commimgUrl: common.Url,
    canvasIds: 'lafenCanvas',
    imgUrl: common.Url,
    haibaoCanvas: false,
    winWidth: 0,
    lafenImgurl: "",
    base_img_url:'https://s.404.cn/applet/',
    showback:false,
    nextPage:true,
    listpage: 1,
    isOver: false,
    base_img_url: 'https://s.404.cn/applet/'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.showback)
    if (options.showback == 0){
      this.setData({
        showback: true
      })
    }
    
    var that = this;
    publicFun.setBarBgColor(app, that);
    wx.getSystemInfo({
      success: function (res) {
        //获取手机型号
        let nav_top = res.model.indexOf('iPhone X')>=0?105:61;
        console.log(res.windowWidth,res)
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight,
          nav_top
        });
      }
    });

    // 新授权方式下锁粉新增
    if (options.scene != undefined) { // 预览模式
      var scene = decodeURIComponent(options.scene);
      if (scene) {
        app.globalData.store_id = scene.split(',')[0];
        app.globalData.share_uid = scene.split(',')[3];
      }
    } else { // 正常模式
      getApp().globalData.share_uid = options.share_uid || app.globalData.share_uid || '';
      getApp().globalData.shareType = options.shareType || 2;
    }
    // 以上新增

    //是否展示分享图片
    app.shareWidthPic(that);
    this.getList(1, 1);//获取列表，page,type
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 获取会员数据
    common.post('app.php?c=my&a=gift_member', '', "userData", this);

    app.isLoginFun(this, 1);//判断用户是否登录
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#312f30'
    })
    // var s = setTimeout(function () {

    //   clearTimeout(s);
    // }, 100)
  },
  userData: function (result) {
    if (result.err_code == 0) {
      let defatult_size=70;
      if (result.err_msg.my_account){
        const { balance, store_income, unbalance } = result.err_msg.my_account;
        
        if (balance && store_income && unbalance){
          if (store_income.length >= 10 || balance.length >= 10 || unbalance.length >= 10) {
            defatult_size = 32
          }
          else if (store_income.length >= 9 || balance.length >= 9 || unbalance.length >= 9) {
            defatult_size = 40
          }
          else if (store_income.length >= 7 || balance.length >= 7 || unbalance.length>=7){
            defatult_size=46
          }
          else if (store_income.length >= 5 || balance.length >= 5 || unbalance.length >= 5) {
            defatult_size = 52
          }
        }
      }
      this.setData({
        defatult_size,
        userData: result.err_msg,
        "userData.chooseproducts": (result.err_msg.products && result.err_msg.products.length>0) ? result.err_msg.products[0] :[]
      })
    }
    // this.makeProductCanvas();
  },
  //【ID1000132】
  // 小程序淘优卖 优化 - 会员权益页面新人专享商品限制4个放开 - 公版功能 用户需求
  getList(page, type) {//type=1 下拉刷新 2分页加载
    var that = this;
    let data = {
      keyword: '',
      sort: 0,
      from: 1,
      page,
      
    };
    common.post("app.php?c=goods&a=get_products_by_new_employee", data, callback, "");
    var that = this;
    function callback(result) {
      console.log(result);
      if (result.err_code == 0) {
        let product_list = that.data.product_list || [];
        if (type == 1) {
          product_list = result.err_msg.product_list;
        } else {
          product_list = product_list.concat(result.err_msg.product_list);
        }
        that.setData({
          product_list,
          nextPage: result.err_msg.next_page,
          pageCount: result.err_msg.count,
          storeDetails: result.err_msg.store,
          show_type: result.err_msg.show_type
        })
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      } else {
        console.log(result);
      }
    }
  },


  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.getList(1, 1)
    this.setData({
      listpage: 1,
      isOver: false
    })
  },
  onReachBottom: function () {
    if (this.data.nextPage == true) {
      let listpage = this.data.listpage + 1;
      this.getList(listpage, 2);
      this.setData({
        listpage,
      })
    } else {
      this.setData({
        isOver: true,
      })
    }
  },
  /**
   * 用户点击右上角分享
   */

// ----------------------------------------------
  showCanvasWind() { //生成海报
    //该店铺未设置拉粉商品
    if (!this.data.userData.chooseproducts.name && !this.data.userData.chooseproducts.price) {
      wx.showModal({
        title: '抱歉',
        content: '该店铺尚未设置粉丝任务哟~',
        confirmText: '知道了',
        showCancel: false,
        confirmColor: '#fe6b31',
      })
      return false;
    }
    setTimeout(() => {
      wx.showLoading({
        title: '海报生成中...',
      })
    }, 1000)
    this.getEwmCode();
  },
  getEwmCode() { //获取二维码 
    var that = this;
    let data = {
      path: "pages/index/index",
      id: this.data.physical_id,
      uid: getApp().globalData.my_uid,
      share_uid: getApp().globalData.my_uid,
      shareType: 2
    }
    wx.request({
      url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + wx.getStorageSync('ticket'),
      header: {
        'Content-Type': 'application/json'
      },
      data: data,
      method: "POST",
      success: function (res) {
        console.log('获取二维码成功', res);
        if (res.err_msg == "失败") {
          wx.hideLoading();
          that.setData({
            lafenWindowsState: false
          })
          return false
        }
        //异步下载图片资源
        let ewmImgUrlDownLoad = '';
        let avaTarUrlDownLoad = '';
        let shopImgeDownLoad = '';
        ewmImgUrlDownLoad = new Promise((resolve, reject) => { //下载二维码
          let url = res.data.err_msg;
          console.log('ewmurl',url);
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log('ewm',res);
                that.setData({
                  ewmImgUrl: res.tempFilePath
                })
                resolve();
              }
            },
            fail: res => {
              console.log("下载失败", url);
              wx.hideLoading();
              reject();
            }
          })
        })

        avaTarUrlDownLoad = new Promise((resolve, reject) => { //下载头像
          let url = that.data.userData.avatar;
          if (url.indexOf("https") == -1) {
            url = that.data.commimgUrl + "upload/" + url;
          }
          console.log('avaurl', url);
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log('icon',res);
                that.setData({
                  avaTarUrl: res.tempFilePath
                })
                resolve();
              }
            },
            fail: res => {
              console.log("下载失败", url);
              wx.hideLoading();
              reject();
            }
          })
        })

        shopImgeDownLoad = new Promise((resolve, reject) => { //下载商品
          let url = that.data.userData.chooseproducts.image;
          console.log('shopurl', url);
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log('product',res);
                that.setData({
                  shopImge: res.tempFilePath
                })
                resolve();
              }
            },
            fail: res => {
              console.log("下载失败", url);
              wx.hideLoading();
              reject();
            }
          })
        })

        let qCodeStatus = Promise.all([ewmImgUrlDownLoad, avaTarUrlDownLoad, shopImgeDownLoad]);
        qCodeStatus.then(() => {
          that.makeCanvas();
          setTimeout(function () {
            let w = that.data.canvasWidth;
            let h = that.data.canvasHeight;
            that.save({
              id: that.data.canvasIds,
              w: w,
              h: h,
              targetW: w * 4,
              targetH: h * 4
            });
          }, 300)
        }).catch((error) => {
          console.log(error);
          wx.hideLoading();
          wx.showModal({
            title: '提示信息',
            content: "海报生成失败，请重试...",
            confirmText: '知道了',
            showCancel: false,
            confirmColor: '#fe6b31',
            success: (result) => {
              wx.hideLoading();
              that.setData({
                haibaoCanvas: false,
              })
            }
          })
        })
      },
      fail: function (res) {
        console.log('获取二维码fail', res);
        wx.hideLoading();
        wx.showModal({
          title: '提示信息',
          content: "海报生成失败，请重试...",
          confirmText: '知道了',
          showCancel: false,
          confirmColor: '#fe6b31',
          success: (result) => {
            that.setData({
              haibaoCanvas: false,
            })
          }
        })
      }
    })
  },
  //展示分享界面
  showShareOperation(e) {
    this.setData({
      "userData.chooseproducts": e.currentTarget.dataset.products,
      lafenWindowsState: false,
      showOpertaion: true
    })
  },
  draw2(ctx, x, y, width, height, radius, color, type) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x, y);
    ctx[type + 'Style'] = color || params.color;
    ctx.closePath();
    ctx[type]();
  },
  drawcommon(ctx, x, y, width, height, radius, color, type, num) {
    let radiusBottom = radius;
    let radiusTop = radius;
    ctx.beginPath();
    if (num == 2) {
      radiusBottom = 0;
    }
    ctx.moveTo(x, y + radiusBottom);
    ctx.lineTo(x, y + height - radiusBottom);
    ctx.quadraticCurveTo(x, y + height, x + radiusBottom, y + height);
    ctx.lineTo(x + width - radiusBottom, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radiusBottom);
    if (num == 1) {
      radiusTop = 0;
    }
    ctx.lineTo(x + width, y + radiusTop);
    ctx.quadraticCurveTo(x + width, y, x + width - radiusTop, y);
    ctx.lineTo(x + radiusTop, y);
    ctx.quadraticCurveTo(x, y, x, y + radiusTop);
    ctx[type + 'Style'] = color || params.color;
    ctx.closePath();
    ctx[type]();
  },
  makeCanvas() {

    let that = this;
    let name = this.data.userData.nickname;
    let productname = this.data.userData.chooseproducts.name;
    let original_price = this.data.userData.chooseproducts.original_price;
    let price = this.data.userData.chooseproducts.price;
    let canvasWidth = this.data.winWidth;
    let bili = canvasWidth / 635;
    let canvasHeight = 1100 * bili;
    this.setData({
      canvasWidth,
      canvasHeight
    })
    const context = wx.createCanvasContext('lafenCanvas');
    context.clearRect(0, 0, 635 * bili, 1100 * bili);
    context.save();
    context.beginPath();
    //绘制商品图片展示
    that.drawcommon(context, 40 * bili, 200 * bili, 555 * bili, 520 * bili, 8 * bili, "black", "fill", 2);
    context.clip();
    context.drawImage(this.data.shopImge, 40 * bili, 200 * bili, 555 * bili, 520 * bili);
    context.restore();
    context.closePath();
    context.save();
    // 绘制文字盒子
    that.drawcommon(context, 40 * bili, 720 * bili, 555 * bili, 285 * bili, 8 * bili, "white", "fill", 1);
    context.save();
    //头像绘制
    context.beginPath();
    context.fillStyle ="#ffffff";
    context.arc(120 * bili, 795 * bili, 40 * bili, 0, Math.PI * 2, false);
    context.fill();
    context.clip(); //画好了圆 剪切  原始画布中剪切任意形状和尺寸。
    context.drawImage(this.data.avaTarUrl, 80 * bili, 755 * bili, 80 * bili, 80 * bili);
    context.restore();
    context.closePath();
    context.save();
    // 昵称
    context.setFontSize(30 * bili);
    context.fillStyle = "#333";
    context.fillText(name, 200* bili, 810 * bili);
    //商品名称
    context.setFontSize(30 * bili);
    context.setFillStyle('#333');
    if (productname.length > 8) { //商品名字长度兼容
      let productname_a = productname.slice(0, 8) + "...";
      context.fillText(productname_a, 80 * bili, 890 * bili);
    } else {
      context.fillText(productname, 80 * bili, 890 * bili);
    }

    //绘制金额；
    context.setFillStyle('#f62049');
    context.fillText("￥", 80 * bili, 950 * bili);
    context.setFontSize(40 * bili);
    context.fillText(price, 104 * bili, 950 * bili);
    if (original_price !=0) { //没有划线价不显示；
      //原始金额
      context.setFontSize(24 * bili);
      context.setFillStyle('#ccc');
      context.fillText("￥", (context.measureText(price).width + 160) * bili, 950 * bili);
      context.fillText(original_price, (context.measureText(price).width + 182) * bili, 950 * bili);
      //横线
      context.moveTo((context.measureText(price).width) * bili, 912 * bili);
      context.lineTo((context.measureText(original_price).width + 10) * bili, 912 * bili);
      context.lineWidth = 1;
      context.strokeStyle = "#000";
      context.stroke();
      
    }

    //绘制二维码
    context.beginPath();
    context.moveTo(487 * bili, 948 * bili);
    context.fillStyle = "#ffffff";
    context.arc(490 * bili, 846 * bili, 68 * bili, 0, Math.PI * 2, false);
    context.fill();
    context.clip(); //画好了圆 剪切  原始画布中剪切任意形状和尺寸。
    context.drawImage(this.data.ewmImgUrl, 422 * bili, 778 * bili, 136 * bili, 136 * bili);
    context.restore();
    context.save();
    context.setFillStyle('#afafaf');
    context.setFontSize(24 * bili);
    context.fillText("扫码进入详情", 410 * bili, 960 * bili);
    context.closePath();
    
    context.draw({
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      canvasId: 'lafenCanvas',
    }, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          width: this.data.canvasWidth,
          height: this.data.canvasHeight,
          canvasId: 'lafenCanvas',
          fileType: 'png',
          quality: 1.0,
          success: res => {
            let data = res.tempFilePath;
            this.setData({
              lafenImgurl: res.tempFilePath
            })
            wx.hideLoading();
          },
          fail: fail => {
            wx.hideLoading();
            wx.showModal({
              title: '提示信息',
              content: "海报生成失败，请重试...",
              confirmText: '知道了',
              showCancel: false,
              confirmColor: '#fe6b31',
              success: (result) => {
                this.setData({
                  haibaoCanvas: false
                })
              }
            })
          }
        })
      }, 1000)
    })
  },
  save: function (o) {
    let that = this;
    canvas.canvasToTempFilePath(o).then(function (res) {
      wx.hideLoading();
      o.imgSrc = res.tempFilePath;
      that.setData({
        canvasImg: res.tempFilePath,
        canvasImgState: true,
      })
      canvas.saveImageToPhotosAlbum(o).then(function (res) {
        wx.showModal({
          title: '存图成功',
          content: '图片成功保存到相册了，去发圈噻~',
          showCancel: false,
          confirmText: '好哒',
          confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
          success: function (res) {
            if (res.confirm) {
              console.log('用户点击确定');
              wx.previewImage({
                urls: [o.imgSrc],
                current: o.imgSrc
              })
            }
          }
        })
      }, function (err) {
        console.log('错误', err);
        wx.hideLoading();
        // that.setData({ 'dialog.dialogHidden': false })
        that.setData({
          showOpertaion: false
        })
      });
    }, function (err) {
      console.log(err);
    });
  },
  // ---------------------------------------------
  //展示分享界面
  closeCanvas() {
    this.setData({
      haibaoCanvas: false,
      showOpertaion:false
    })
  },
  //返回
  goback() {
    var backpage = getCurrentPages()[1];
    console.log('backpage---------', backpage)
    wx.navigateBack();
    // wx.navigateBack({ delata: 1 })
  },
  goToPage(e){
    // console.log(e)
    let url=e.currentTarget.dataset.url;
    wx.navigateTo({
      url: `${url}`,
    })
  },
  //悬浮展示
  touchStart(e) {
    this.setData({
      isTouch: true
    })
    let query = wx.createSelectorQuery();
    query.select('#homePage').boundingClientRect(rect => {
      console.log(rect);
      this.setData({
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top,
        isDown: true
      })
    }).exec();
  },
  touchMove(e) {
    if (this.data.isDown == false) {
      return;
    }
    this.setData({
      isTouch: true
    })
    var L = e.changedTouches[0].clientX - this.data.x;
    var T = e.changedTouches[0].clientY - this.data.y;
    let query = wx.createSelectorQuery();
    if (L < 10) {
      L = 0;
    } else if (L > this.data.winWidth - 100) {
      L = this.data.winWidth - 100;
    }

    if (T < 10) {
      T = 0;
    } else if (T > this.data.winHeight - 100) {
      T = this.data.winHeight - 100;
    }
    this.setData({
      Style: 'left:' + L + 'px;top:' + T + 'px;right:unset;bottom:unset;'
    })
  },
  touchEnd(e) {
    let Style = this.data.Style;
    this.setData({
      isDown: false
    })

  },
  showNewgiftvip(){
    wx.navigateTo({
      url: "/pages/giftMember/giftVip/vip",
    })
  },
  gotowhere(){
    switch (this.data.userData.set_info.jump_page*1){
      case 0:
        wx.navigateTo({
          url: '/pages/giftMember/giftuser/coupons',
        })
      break;
      case 1:
        wx.navigateTo({
          url: '/pages/new_user/index',
        })
        break;
    }
  },
  onShareAppMessage: function () {
    return getApp().shareGetFans(this.data.userData.applet_info.nick_name, '', '/pages/index/index', 2, '', `&id=${this.data.physical_id}`);
    // return {
    //   title: this.data.userData.applet_info.nick_name,
    //   desc: '',
    //   path: `/pages/index/index?id=${this.data.physical_id}&share_uid=${getApp().globalData.my_uid}&shareType=2`
    // }
  },
  // 赋值邀请码
  copyCode:function(e){
    let codeTxt = e.currentTarget.dataset.code ? e.currentTarget.dataset.code:'';
    wx.setClipboardData({
      data: codeTxt,
      success(res) {
        wx.getClipboardData({
          success(res) {
            wx.showToast({
              title: '复制成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      }
    })

  },
  //isLogin登录

  isLogin: function (e) {
    if (!app.isLoginFun(this)) {//判断用户是否登录
      return false;
    }
  }
})