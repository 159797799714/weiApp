// pages/user/membersDetails/membersDetails.js
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
    lafenImgurl: "",
    base_img_url:'https://s.404.cn/applet/',
    BASE_IMG_URL:'https://s.404.cn/applet/',
    // 设计会员
    activeIndex:null,
    chooseproductId:'',
    userData:{},
    physical_id: '',
    goodsData:'',//选择商品后，获取选择的商品的数据
    code: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    
    wx.getSystemInfo({
      success: function (res) {
        //获取手机型号
        let nav_top = res.model.indexOf('iPhone X')>=0?105:61;
        that.setData({
          winWidth: res.windowWidth,
          nav_top
        });
      }
    });
    app.getIphoneNum(this);//获取用户是否需要拉取手机号
    //是否展示分享图片
    app.shareWidthPic(that);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 获取会员数据
    common.post('app.php?c=gift_fx&a=apply', '', "vipData", this);
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
  vipData: function (result) {
    console.log(result)
    if(result.err_code == 0){
      this.setData({
        applyVipData: result.err_msg,
      })
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
  //展示分享界面

  //展示分享界面
  showShareOperation() {
    this.setData({
      lafenWindowsState: false,
      showOpertaion: true
    })
  },
  //询问保存
  saveHaobao() {
    wx.showShareMenu({
      withShareTicket: true
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
    let name = this.data.applyVipData.nickname;
    let productname = this.data.goodsData.name;
    let original_price = this.data.goodsData.original_price;
    let price = this.data.goodsData.price;
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
    context.fillStyle = "#000";
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
    context.fillText(name, 200 * bili, 810 * bili);
    //商品名称
    context.setFontSize(30 * bili);
    context.setFillStyle('#333');
    if (productname.length >8) { //商品名字长度兼容
      let productname_a = productname.slice(0, 8) + "...";
      context.fillText(productname_a, 80 * bili, 890 * bili);
    } else {
      context.fillText(productname, 80 * bili, 890 * bili);
    }

    //绘制金额；
    context.setFillStyle('#f62049');
    context.fillText("￥", 80 * bili, 950 * bili);
    context.setFontSize(30 * bili);
    context.fillText(price, 104 * bili, 950 * bili);
    if (original_price != 0) { //没有划线价不显示；
      //原始金额
      context.setFontSize(24 * bili);
      context.setFillStyle('#ccc');
      // context.fillText("￥", (context.measureText(price).width + 180) * bili, 950 * bili);
      context.fillText(("￥"+original_price), (context.measureText(price).width + 200) * bili, 950 * bili);
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
    context.fillStyle = "#FF0000";
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
            wx.hideLoading();
          },
          fail: fail => {
            console.log(fail);
            wx.hideLoading();
            wx.showModal({
              title: '提示信息',
              content: "海报生成失败，请重试...",
              confirmText: '知道了',
              showCancel: false,
              confirmColor: '#fe6b31',
              success: (result) => {
                // this.setData({
                //   haibaoCanvas: false
                // })
              }
            })
          }
        })
      }, 1000)
    })
  },
  // -----------------------------------------------------------------------------
  showShareOperation() {
    this.setData({
      lafenWindowsState: false,
      showOpertaion: true
    })
  },
  //询问保存
  saveHaobao() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  // 海报生成
  showCanvasWind() {
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
      path: `pages/product/details`,
      id: that.data.chooseproductId,
      share_uid: getApp().globalData.my_uid,
      shareType:2
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
          console.log('ewmurl', url);
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log('ewm', res);
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
          let url = that.data.applyVipData.avatar;
          console.log('avaurl', url);
          if (url.indexOf("https") == -1) {
            url = that.data.commimgUrl + "upload/" + url;
          }
          console.log('avaurl', url);
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log('icon', res);
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
          let url = that.data.goodsData.image;
          wx.downloadFile({
            url: url,
            success: (res) => {
              if (res.statusCode === 200) {
                console.log('product', res);
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
  // =============================================================================
  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function () {
  //   var that = this;
  //   this.setData({
  //     haibaoCanvas: false
  //   })
  //   let product_id = that.data.chooseproductId;
  //   console.log("product_id========", product_id)
    // return {
    //   desc: '这里发现一个好店铺，速度围观，点击进入',
    //   path: '/pages/product/details?product_id=' + getApp().globalData.store_id + "&share_uid=" + getApp().globalData.my_uid + "&shareType=2"
    // }
  // },
  //展示分享界面
  showShareOperation() {
    this.setData({
      lafenWindowsState: false,
      showOpertaion: true
    })
  },
  closeCanvas() {
    this.setData({
      haibaoCanvas: false,
      showOpertaion:false
    })
  },
  //返回
  goback() {
    wx.navigateBack()
  },
  goToPage(e){
    // console.log(e)
    let url=e.currentTarget.dataset.url;
    wx.navigateTo({
      url: `${url}`,
    })
  },
  showCalc(){
    let url = 'app.php?c=gift_fx&a=get_counter';
    let that = this;
    common.post(url,'',function(res){
      that.setData({
        calcImg: res.err_msg.counter_img
      })
      console.log('jisunqi',res)
    },'')
    this.setData({
      calcStatus:true
    })
  },
  closecalc() {
    this.setData({
      calcStatus: false
    })
  },
  chooseProduct(e){
    let that = this;
    that.setData({
      activeIndex: e.currentTarget.dataset.index,
      chooseproductId: e.currentTarget.dataset.product.product_id,
      "userData.chooseproducts": e.currentTarget.dataset.product
    });
    let data={
      product_id: that.data.chooseproductId
    }
    common.post('app.php?c=gift_fx&a=getShareGoodsImage', data, function(res){
      that.setData({
        goodsData: res.err_msg
      });
    }, '');
  },
  openMember(){
    if (!this.data.chooseproductId){
      let that = this;
       publicFun.warning('请选择一件会员商品吧', that);
       return;
    }
    if (this.data.applyVipData.is_member == 1){
      this.showShareOperation();
    }else{
      wx.navigateTo({
        url: '/pages/product/details?product_id=' + this.data.chooseproductId,
      })
    }
   
  },
  onShareAppMessage: function () {
    var that = this;
    this.setData({
      haibaoCanvas: false
    })
    let product_id = that.data.chooseproductId;

    if (!product_id){
      return getApp().shareGetFans(this.data.applyVipData.applet_info.nick_name, '', '/pages/index/index', 2);
    }else{
      return getApp().shareGetFans(this.data.applyVipData.applet_info.nick_name, '', '/pages/product/details', 2, '', `&product_id=${product_id}`);

    }

    // return {
    //   title: this.data.applyVipData.applet_info.nick_name,
    //   path: '/pages/product/details?product_id=' + product_id + '&share_uid=' + getApp().globalData.my_uid + '&shareType=2'
    // }
    
  },
  gotobottom(){
    wx.createSelectorQuery().select('#gift-vip').boundingClientRect(function (rect) {
      // 使页面滚动到底部
      wx.pageScrollTo({
        scrollTop: rect.bottom
      })
    }).exec()
  },
  //获取手机号
  getPhoneNumber(e){
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
  }
})