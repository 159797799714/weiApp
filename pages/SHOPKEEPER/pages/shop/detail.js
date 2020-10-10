// pages/SHOPKEEPER//pages/shop/detail.js
var _url = '../../';
var common = require(_url + '../../utils/common.js');
var publicFun = require(_url + '../../utils/public.js');
var wxParse = require(_url + '../../wxParse/wxParse.js');
var canvasFun = require(_url + '../../utils/canvas-post.js');
var canvas = require(_url + '../../utils/canvas.js');
var app = getApp();
let creatingPost = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    _barTitle: '掌柜说',
    showDetail:false,
    screenWidth: 0,
    screenHeight: 0,
    imgwidth: 0,//默认初始图片宽度
    imgheight: 0,//默认初始图片高度
    sx: 0,//海报商品图裁剪x轴坐标
    sy: 0,//海报商品图裁剪y轴坐标
    sw: 0,//海报商品图裁剪宽
    sh: 0,//海报商品图裁剪高
    butshow: false,//海报图预览显示
    myimgsrc: '',//海报图图片路径
    closeModal:false,//关闭保存成功弹窗
    status_type: 'details',//'details=>详情页，list=>列表页'
    show_type: 1,//整屏展示， 一屏2列瀑布流展示=>1、整屏，2、瀑布流
    remand_goods:[],
    userinfo: { name: "", avatar: "" },
    moreData: 0,//跟多
    society_id:'',
    dialog: {
      dialogHidden: true,
      titleMsg: "海报图保存失败，用户取消或未开启保存到相册权限",
      determineBtnTxt: "去开启"
    },
    canvasImgState: false,//海报
    canvasData: {},
    saveImgBtnHidden: true,//是否显示保存/授权相册按钮
    richtex:'',//富文本图片处理
    qrCodeUrlArr: [],    //下载素材时保存二维码路径的数组
    showPercent: false,
    totalNum: 0,   //总的可下载图片数量
    curNum: 0    //当前下载图片数量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("分享参数",options);
    let that = this;
    publicFun.setBarBgColor(app, that); //修改头部颜色
    publicFun.setNavSize(that); // 通过获取系统信息计算导航栏高度
    app.isLoginFun(that, 1);//判断用户是否登录
    if (options.society_id){      
      that.setData({
        society_id: options.society_id
      })
    }
    if (options.store_id){
      app.globalData.store_id = options.store_id
    }

    // 扫码进入判断
    if (options.scene != undefined && options.scene != 'wxapp') {
      var scene = decodeURIComponent(options.scene);
      console.log("详情页二维码", scene);
      if (scene) {
        var scene_arr = scene.split(',');
        // 扫查看职工二维码查看员工信息
        app.globalData.store_id = scene_arr[0]
        var society_id = scene_arr[1];
        this.setData({
          society_id: society_id
        });
      };
    }

    
    that.detailData();
    that.getHeight();
    // that.shopNameData();
    // that.configData();
  },

  // 掌柜说详情数据
  detailData:function(){
    let that = this;
    let url = 'app.php?c=society&a=society_detail',
      data = {
        society_id: that.data.society_id
      };
    common.post(url, data, 'detailFun', that,'detailFunFali', true)
  },
  detailFun:function(res){
    let that = this;
    console.log('详情数据',res);
    let _goodsLen = res.err_msg.info[0].goods_list.length;
    let filesLen = res.err_msg.info[0].files.length;

    that.setData({
      detailCode: res.err_code,
      lists: res.err_msg.info,
      remand_goods: res.err_msg.info[0].goods_list,
      shopName: res.err_msg.info[0].store_name,
      'userinfo.name': res.err_msg.info[0].fbname,
      'userinfo.avatar': res.err_msg.info[0].fbtximg,
      totalNum: _goodsLen + filesLen
    });
    let richtex = that.data.lists[0].content.replace(/\<img/g, '<img class="richimg"');
    that.setData({
      richtex: richtex
    });    
  },
  detailFunFali:function(){
    let that = this;
    that.setData({
      detailCode: res.err_code
    });
  },
  // 社区配置
  configData: function () {
    let that = this;
    let url = 'app.php?c=society&a=get_config',
      data = {
        store_id: app.globalData.store_id || common.store_id
      };
    common.post(url, data, function (res) {
      console.log(res);
      that.setData({
        // show_type: res.err_msg.show_type,
        show_set: res.err_msg,
        showDetail: true
      })
    }, '')
  },
  // 点赞
  clickHeart: function (e) {
    console.log(e);
    let id = e.currentTarget.dataset.id;
    let idxs = e.currentTarget.dataset.idxs;
    let that = this;
    let nowpages = getCurrentPages(); //获取上一个页面信息栈(a页面)
    let prevPage = nowpages[nowpages.length - 2]; //给上一页面的tel赋值
    let url1 = 'app.php?c=society&a=society_like',//点赞
      url2 = 'app.php?c=society&a=cancle_like',//取消赞
      data = {
        society_id: id
      };
    // 点击震动
    // wx.vibrateShort({
    //   success: function () {
    //     console.log('点击震动');
    //   }
    // });
    let changeLike = 'lists[' + idxs + '].liked',
      changeNum = 'lists[' + idxs + '].like_num';
    if (that.data.lists[idxs].liked == 0) {
      // liked：0，当前未点赞，调用点赞接口
      common.post(url1, data, function (res) {
        that.setData({
          [changeLike]: 1,
          [changeNum]: res.err_dom.split('').splice(4).join('')
        });
        if (prevPage) {
          prevPage.setData({
            isLike: 1,
            isClickLike: 1,
            nowLikeNum: res.err_dom.split('').splice(4).join('')
          });
        }        
      }, '');
      console.log(that.data.lists);
    } else {
      // liked：1，当前已点赞，调用取消点赞接口
      common.post(url2, data, function (res) {
        that.setData({
          [changeLike]: 0,
          [changeNum]: res.err_dom.split('').splice(4).join('')
        });
        if (prevPage) {
          prevPage.setData({
            isLike: 0,
            isClickLike: 1,
            nowLikeNum: res.err_dom.split('').splice(4).join('')
          });
        }        
      }, '');
      console.log(that.data.lists);
    }
    // 调用列表接口，返回点击后的liked
    // that.shopData();
  },
  // 分享数据接口
  shareData:function(){
    let that = this;
    let url = 'app.php?c=society&a=share_callback',
      shareNum = 'lists[' + 0 + '].share_num',
      data = {
        society_id: that.data.society_id
      };
    common.post(url, data, function (res) {
      console.log(res);
      that.setData({
        [shareNum]: res.err_dom.split('').splice(4).join('')
      })
    }, '')
    console.log(that.data.lists)
  },
  // 店铺名称接口
  shopNameData:function(){
    let that = this;
    let url = 'app.php?c=store&a=index',
      data = {
        store_id: app.globalData.store_id || common.store_id
      };
    common.post(url, data, function (res) {
      console.log(res);
      that.setData({
        shopName: res.err_msg.store.name
      })
    }, '')
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    let that = this;
    //=========================检测登录授权====================================
    wx.getSystemInfo({//获取设备信息
      success: function (res) {
        that.setData({
          imageHeight: res.windowWidth,
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      },
    });
    // 获得dialog组件
    setTimeout(function(){
      that.dialog = that.selectComponent("#shareModal");
      console.log(that.dialog)
    },1000);
  },
  // 海报
  //显示对话框
  shareTap: function () {
    this.dialog.showDialog();
  },
  //取消事件
  _cancelEvent: function () {
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
    that.setData({
      canvasImgState: false
    })
  },
  //分享好友或群
  _shareGroup: function () {
    var that = this;
    console.log('分享好友或群');
    wx.showShareMenu({
      withShareTicket: true
    });
    that.shareData();
  },
  //分享朋友圈（分享海报图）
  _shareFriendsCircle: function () {
    var that = this;
    console.log('分享朋友圈');
    let ticket = wx.getStorageSync('ticket');
    let data = {
      path: 'pages/SHOPKEEPER/pages/shop/detail',
      id: that.data.society_id,
      store_id: app.globalData.store_id || common.store_id
    }
    creatingPost = true
    wx.showLoading({
      title: '正在生成中...',
      mask: true
    })
    // that.creatPost();
    wx.request({
      url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
      header: {
        'Content-Type': 'application/json'
      },
      data: data,
      method: "POST",
      success: function (res) {
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
            creatingPost = false
            wx.showModal({
              title: '温馨提示',
              content: res.data.err_msg,
              confirmText: '好哒',
              confirmColor: app.globalData.navigateBarBgColor,
              showCancel: false,
              success: function (res) {
                that.dialog.hideDialog();
              }
            });
          }
        }
      },
      fail: function (res) {
        wx.hideLoading();
        creatingPost = false
      }
    })
  },
  /*
    *
    **分享对话框 shareModal end
    *
    */
  // 生成分享海报
  creatPost: function () {
    let that = this;
    // 过滤富文本标签
    let str = that.data.lists[0].content;
    // let reg = RegExp("<[^>]+>", "g");
    // let product_content = str.replace(reg, '');
    str = str.split('&nbsp;').join('');
    str = str.split('&#39;').join("'");
    str = str.replace(/(\n)/g, "");
    str = str.replace(/(\t)/g, "");
    str = str.replace(/(\r)/g, "");
    str = str.replace(/<\/?[^>]*>/g, "");
    str = str.replace(/\s*/g, "");
    let product_content = str;
    // 1 设置画布数据
    var windowHeight = wx.getSystemInfoSync().windowHeight
    var windowWidth = wx.getSystemInfoSync().windowWidth
    
    console.log(windowHeight, windowWidth, 750 * Number(windowHeight)/Number(windowWidth) ,"windowWidthwindowWidth------")
  
    let canvasData = { // 画布数据
      status: true,
      canvasW: windowWidth,
      canvasH: windowHeight,
      canvasId: 'productPost',
      // canvasWidth: 670,
      // canvasHeight: 720,
      canvasWidth: 750,
      canvasHeight: 750 * 1.6,
      whProportion: 1.28,
      paddingLeft: 40,
      paddingTop: 30,
      radius: 10,
      bg_color: '#ffffff',// 画图填充背景色（不设置默认会生成透明背景的图片）
      product_content: product_content, // 活动内容
      shopName: that.data.shopName,
      text_qrcode_btm: '长按识别小程序码 即可查看~', // 二维码下方文字
      loadFailTapStatus: false, // 下载失败处理函数是否已执行
      // 图片数据
      qrcodePath: 'https://' + that.data.qrcodePath.split('://')[1], // 二维码
      // qrcodePath: that.data.lists[0].files[0].thumb, // 二维码
      // productImage: 'https://' + that.data.lists.files[0].thumb.split('://')[1], // 商品首图
      productImage: that.data.lists[0].files[0].thumb || 'https://' + that.data.qrcodePath.split('://')[1], // 商品首图
    };
    let obj = canvas.px2rpx({ w: canvasData.canvasWidth, h: canvasData.canvasHeight, base: that.data.winWidth });
    that.setData({
      canvasData: canvasData,
      canvasPosition: obj
    })
    let task = []
    let filePaths = ['productImage', 'qrcodePath']
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
      })
      that.getImageMes();
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
      console.log(err);
      creatingPost = false
    })
  },
  getImageMes:function(){
    let that = this;
    var sx, sy, sw, sh, imgH=510;
    // var sx =  0,  sw = 510,  imgW = 510;
    // var sy = 0, sh = 510 * that.data.canvasData.whProportion, imgH = 510 * that.data.canvasData.whProportion;
    wx.getImageInfo({
      src: that.data.canvasData.productImage,
      success(res) {
        var imgw = res.width,
          imgh = res.height, 
          whProportion = that.data.canvasData.whProportion;
        console.log(imgw,"--------------");
        console.log(imgh, "--------------");
        console.log(that.data.canvasData.whProportion, "--------------");
        
        // if (imgw < imgH * whProportion && imgh < imgH * whProportion) {
        //   console.log(1);
        //   sx = (imgw - imgH)/2;
        //   sy = 0;
        //   sw = (imgw * imgH) / imgh;
        //   sh = imgH * whProportion
        // } else if (imgw < imgH && imgh > imgH * whProportion) {
        //   console.log(2);
        //   sx = 0;
        //   sy = (imgh - imgH * whProportion) / 2;
        //   sw = imgH;
        //   sh = imgH * whProportion
        // } else if (imgw > imgH && imgh < imgH * whProportion) {
        //   console.log(3);
        //   sx = (imgw - imgH) / 2;
        //   sy = 0;
        //   sw = imgH;
        //   sh = imgH * whProportion
        // } else if (imgw > imgH && imgh > imgH * whProportion) {
        //   console.log(4);
        //   sx = (imgw - imgH) / 2;
        //   sy = (imgh - imgH * whProportion) / 2;
        //   sw = imgH;
        //   sh = imgH * whProportion
        // }
      //如果图宽大于高&&图宽小于高*whProportion
        if ((imgh * whProportion > imgw)&&imgw > imgh ) {
          console.log(11);
          sx = 0;
          sy = 0;
          sw = imgh / whProportion;
          sh = imgh
        //如果图宽小于高&&图高大于*whProportion宽
        } else if (imgw < imgh && (imgh < imgw * whProportion)){
          console.log(22);
          sx = 0;
          sy = 0;
          sw = imgw;
          sh = imgw * whProportion
          //如果图宽大于高*whProportion
        } else if (imgw > imgh * whProportion){
          console.log(33);
          sx = (imgw - imgh / whProportion ) / 2;
          sy = 0;
          sw = imgh / whProportion;
          sh = imgh
          //如果图高大于*whProportion宽
        } else if (imgh > imgw * whProportion ){
          console.log(44);
          sx = 0;
          sy = (imgh - imgw * whProportion) / 2;
          sw = imgw;
          sh = imgw * whProportion
          //正方形
        }else{
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
  // 画图海报
  drawCanvas: function () {
    let that = this;
    let w = that.data.canvasData.canvasWidth;
    let h = that.data.canvasData.canvasHeight;
    let left = that.data.canvasData.paddingLeft;
    let top = that.data.canvasData.paddingTop;
    // 内部商品图片偏移量
    let innerLeft = 40;
    // 内部商品图片高度
    let imgH = w - (innerLeft) * 2;
    // 头像半径
    let head_r = 53;
    // 二维码半径
    let qrode_r = 70;
    let positionY = 0;

    var sx = that.data.sx,
      sy = that.data.sy,
      sw = that.data.sw,
      sh = that.data.sh;
    console.log(sx, "*************", sy, "*************", sw, "*************", sh)
    // 生成画笔
    // 获取图片信息    
    const ctx = wx.createCanvasContext(that.data.canvasData.canvasId);
    // 绘制白色圆角背景
    canvas.roundRect({
      ctx: ctx,
      x: 0,
      y: 0,
      w: w ,
      h: h ,
      r: 20,
      blur: 20,
      shadow: 'rgba(180,180,180,.4)'
    });
    
    // 绘制商品图片
    positionY =  40;
   
    canvas.roundImg({
      ctx: ctx,
      x: innerLeft,
      sx: sx,
      y: positionY,
      sy: sy,
      img: that.data.canvasData.productImage,
      w: imgH,
      sw: sw,
      h: imgH *that.data.canvasData.whProportion,
      sh: sh,
      r: 20,
      blur: 14,
      shadow: 'rgba(180,180,180,.4)',
      // 是否显示蒙层
      cover: false,
      // 蒙层高度
      coverH: 140
    });
    let product_name_text = that.data.canvasData.product_content;
    // 绘制中间容器,商品内容,超出19个字显示两行，多两行，显示省略号

  //获取字符串长度，中文是两个字符串
    function getStrleng(str) {
      let myLen =1
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 0 && str.charCodeAt(i) < 128) //字符编码，128以内的是数字，英文字符，已经英文的符号等
          myLen++;
        else
          myLen += 2;
        
      }
      return myLen;
    }
  //截取一般
    function _sub(str, len, start) {
      var num = 0;
      for (let i=0  ; i < str.length; i++) {
        var a = str.charAt(i);
        if (/^[\u4e00-\u9fa5]+$/i.test(a)) {
          num += 2;
        } else {
          num += 1;
        }
        if (num == len) {
          return str.substring(start, i + 1);
        }
        if (num > len) {
          return str.substring(start, i);
        }
      }
    }

    if (getStrleng(product_name_text) > 17) {
      if (getStrleng(product_name_text) >34) {
        let start = _sub(product_name_text, 34, 0).length
        console.log(_sub(product_name_text, 34, 0), start, "staetstaetstaet", _sub(product_name_text, 68, start) )
        product_name_text = _sub(product_name_text, 34, 0) + '\n' + _sub(product_name_text, 68, start) + "...";
        // product_name_text = product_name_text.slice(0, 17) + '\n' + product_name_text.slice(17, 34) + '\n' + product_name_text.slice(34, 50) + "...";
      // } else if (product_name_text.length > 34 && product_name_text.length < 51){
      //   product_name_text = product_name_text.slice(0, 17) + '\n' + product_name_text.slice(17, 34) + '\n' + product_name_text.slice(34, product_name_text.length);
      }else{
        let len = product_name_text.length
        let start = _sub(product_name_text, 34, 0).length
        product_name_text = _sub(product_name_text, 34, 0) + '\n' + _sub(product_name_text, len, start )
      }
      canvas.drawMultiText({
        ctx,
        gap: 15,
        text: product_name_text,
        x: left + innerLeft,
        y: positionY + imgH * that.data.canvasData.whProportion + 24,
        fontSize: 30
      })
    } else {
      canvas.drawText({
        ctx: ctx,
        text: product_name_text,
        x: left + innerLeft,
        y: positionY + imgH * that.data.canvasData.whProportion + 24,
        fontSize: 30
      });
    }
    
    // 绘制二维码
    positionY = positionY + imgH * that.data.canvasData.whProportion + 24;
    canvas.drawImage({
      ctx: ctx,
      img: that.data.canvasData.qrcodePath,
      x:  innerLeft + 50,
      y: positionY + 110,
      w: qrode_r * 2,
      h: qrode_r * 2
    });

    // 绘制二维码右侧文字
    canvas.drawMultiText({
      ctx: ctx,
      text: '长按小程序码查看详情\n分享自[' + that.data.canvasData.shopName +']',
      x: innerLeft + qrode_r * 2 + 80,
      y: positionY + qrode_r + 110,
      fontSize: 25,
      baseline: 'middle',
      gap: 15,
      color: '#919398'
    });

    // 最终绘出画布
    ctx.draw();
  },
  // 画图 18-04-24 created by cms_ssa
  save: function (o) {
    let that = this;
    // 把当前画布指定区域的内容导出生成指定大小的图片
    canvas.canvasToTempFilePath(o).then(function (res) {
      wx.hideLoading();
      o.imgSrc = res.tempFilePath;
      that.setData({
        canvasImg: res.tempFilePath,
        canvasImgState: true,
        myimgsrc: o.imgSrc,
        butshow: true
      })
      that.dialog.hideDialog();  
      
    }, function (err) {
      console.log(err);
    });
  },
  // 海报点击关闭
  closeCanvas: function () {
    let that = this;
    that.setData({
      butshow: false
    });
  },
  // 海报点击保存
  saveCanvas: function () {
    let that = this;
    wx.showLoading({
      title: '正在保存中...',
      mask: true
    });
    wx.getSetting({
      success(res) {
        console.log('666', res)
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.hideLoading();
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() {//这里是用户同意授权后的回调
              console.log('用户同意授权')
              that.savaImageToPhoto();
            },
            fail() {//这里是用户拒绝授权后的回调
              console.log('用户拒绝授权');
              that.setData({
                saveImgBtnHidden: false
              })
            }
          })
        } else {//用户已经授权过了
          console.log('用户已经授权过了')
          that.savaImageToPhoto();
        }
      }
    })    
  },
  // 用户取消授权重新授权
  handleSetting: function (e) {
    let that = this;
    // 对用户的设置进行判断，如果没有授权，即使用户返回到保存页面，显示的也是“去授权”按钮；同意授权之后才显示保存按钮
    if (!e.detail.authSetting['scope.writePhotosAlbum']) {
      wx.showModal({
        title: '警告',
        content: '若不打开授权，则无法将图片保存在相册中！',
        confirmColor: app.globalData.navigateBarBgColor,
        showCancel: false
      })
      that.setData({
        saveImgBtnHidden: false,
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '您已授权，赶紧将图片保存在相册中吧！',
        confirmColor: app.globalData.navigateBarBgColor,
        showCancel: false
      })
      that.setData({
        saveImgBtnHidden: true
      })
    }
  },
  // 保存到相册
  savaImageToPhoto: function () {
    let that = this;
    // saveImageToPhotosAlbum图片保存到本地相册
    wx.saveImageToPhotosAlbum({
      filePath: that.data.myimgsrc,
      success: function () {
        console.log('保存成功');
        wx.hideLoading();
        that.setData({
          butshow: false,
          closeModal: true
        });
        //保存成功分享数据加一
        that.shareData();
      },
      fail: function () {
        console.log('用户取消保存');
        wx.hideLoading();
      }
    });
  },
  // 关闭保存成功
  closeModaled: function (e) {//关闭弹窗
    this.setData({
      closeModal: false
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this; 
    let nowpages = getCurrentPages(); //获取上一个页面信息栈(a页面)
    let prevPage = nowpages[nowpages.length - 2]; //给上一页面的tel赋值
    if(prevPage){
      prevPage.setData({
        isClickLike: 0,
      });
    }    
    //=========================检测登录授权====================================
    let wx_ticket = wx.getStorageSync('ticket');
    if (wx_ticket) {
      if (this.data.cardData != '') {
        publicFun.setUrl('')
      }

    } else {
      var config_data = publicFun.getCurrentPages();
      app.getUserInfo({
        pageThat: that,
        refreshConfig: config_data,
        callback: '',
      });
    }
    // publicFun.checkAuthorize({ // (此种方式此页无法调用授权)
    //     pageData: this.data.cardData,
    //     app: app,
    //     callbackFunc: '',
    // })
    //=========================检测登录授权====================================
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
  // 相关推荐跳转商品详情页
  goDetailed: function (e) {
    let that = this;
    let product_id = e.currentTarget.dataset.pid;
    console.log(product_id)
    wx.navigateTo({
      url: '/pages/product/details?product_id=' + product_id,
    })
  },
  // 获取元素的高
  getHeight: function () {
    let that = this;
    setTimeout(function () {
      var query = wx.createSelectorQuery();
      query.select('.soft-content').boundingClientRect();
      query.exec(function (rect) {
        if (rect[0] === null) return;
        var marginBM=[];
        marginBM.push(rect[0].height / 26);
        that.setData({
          marginBM: marginBM
        });
      });
    }, 500)
  },
  // 点击展开显示更多
  showMore: function (e) {
    let that = this;
    console.log(that.data.moreData)
    let idxs = e.currentTarget.dataset.idxs;
    let toggleVal = that.data.moreData
    if (that.data.moreData == idxs) {
      that.setData({
        moreData: 0
      })
    } else {
      that.setData({
        moreData: idxs
      })
    }
  },
  imageLoad: function (e) {//图片自适应
    console.log("eeeeeeeeeeeeeeee", e)
    var _this = this;
    var _width = e.detail.width,    //获取图片真实宽度
      _height = e.detail.height,
      ratio = _width / _height;   //图片的真实宽高比例
    var viewWidth = _width > 670 ? 670 : _width,           //设置图片显示宽度，
      viewHeight = viewWidth > 670 ? (670 / ratio) : _height;    //计算的高度值   
    this.setData({
      imgwidth: viewWidth,
      imgheight: viewHeight
    })
  },
  // 图片预览
  previewPic: function (e) {
    console.log("eeeeeeee", e, e.currentTarget.dataset.src)
    let _current = e.currentTarget.dataset.src;
    let _urls = e.currentTarget.dataset.urls;
    let arr_urls = [];
    for (var i in _urls) {
      arr_urls.push(_urls[i].thumb);
    }
    console.log("_urls=", arr_urls)
    wx.previewImage({
      current: _current, // 当前显示图片的http链接
      urls: arr_urls// 需要预览的图片http链接列表
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    let that = this;
    const product = that.data.lists[0];
    // 过滤富文本标签
    let str = that.data.lists[0].content;
    // let reg = RegExp("<[^>]+>", "g");
    // let product_content = str.replace(reg, '');
    str = str.split('&nbsp;').join('');
    str = str.split('&#39;').join("'");
    str = str.replace(/(\n)/g, "");
    str = str.replace(/(\t)/g, "");
    str = str.replace(/(\r)/g, "");
    str = str.replace(/<\/?[^>]*>/g, "");
    str = str.replace(/\s*/g, "");
    let product_content = str;
    if (product_content.length > 30) {
      product_content = product_content.slice(0,31) + "...";    
    }
    if (options.from === 'button') {
      that.dialog.hideDialog();
    }
    return getApp().shareGetFans(product_content, ` `, `/pages/SHOPKEEPER/pages/shop/detail`, 1, product.files[0].thumb, `&society_id=${that.data.society_id}`);
    
  },
  //高斯模糊背景
  gaussBlur(imgData) {
    var pixes = imgData.data;
    var width = imgData.width;
    var height = imgData.height;
    var gaussMatrix = [],
      gaussSum = 0,
      x, y,
      r, g, b, a,
      i, j, k, len;

    var radius = 10;
    var sigma = 5;

    a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
    b = -1 / (2 * sigma * sigma);
    //生成高斯矩阵
    for (i = 0, x = -radius; x <= radius; x++ , i++) {
      g = a * Math.exp(b * x * x);
      gaussMatrix[i] = g;
      gaussSum += g;
    }
    //归一化, 保证高斯矩阵的值在[0,1]之间
    for (i = 0, len = gaussMatrix.length; i < len; i++) {
      gaussMatrix[i] /= gaussSum;
    }
    //x 方向一维高斯运算
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        r = g = b = a = 0;
        gaussSum = 0;
        for (j = -radius; j <= radius; j++) {
          k = x + j;
          if (k >= 0 && k < width) { //确保 k 没超出 x 的范围
            //r,g,b,a 四个一组
            i = (y * width + k) * 4;
            r += pixes[i] * gaussMatrix[j + radius];
            g += pixes[i + 1] * gaussMatrix[j + radius];
            b += pixes[i + 2] * gaussMatrix[j + radius];
            // a += pixes[i + 3] * gaussMatrix[j];
            gaussSum += gaussMatrix[j + radius];
          }
        }
        i = (y * width + x) * 4;
        // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
        // console.log(gaussSum)
        pixes[i] = r / gaussSum;
        pixes[i + 1] = g / gaussSum;
        pixes[i + 2] = b / gaussSum;
        // pixes[i + 3] = a ;
      }
    }
    //y 方向一维高斯运算
    for (x = 0; x < width; x++) {
      for (y = 0; y < height; y++) {
        r = g = b = a = 0;
        gaussSum = 0;
        for (j = -radius; j <= radius; j++) {
          k = y + j;
          if (k >= 0 && k < height) { //确保 k 没超出 y 的范围
            i = (k * width + x) * 4;
            r += pixes[i] * gaussMatrix[j + radius];
            g += pixes[i + 1] * gaussMatrix[j + radius];
            b += pixes[i + 2] * gaussMatrix[j + radius];
            // a += pixes[i + 3] * gaussMatrix[j];
            gaussSum += gaussMatrix[j + radius];
          }
        }
        i = (y * width + x) * 4;
        pixes[i] = r / gaussSum;
        pixes[i + 1] = g / gaussSum;
        pixes[i + 2] = b / gaussSum;
      }
    }
    return imgData;
  },
  downloadImgFun() {   //点击下载素材  type: 1图片  2视频
    publicFun.checkAuthOfSaveImageToPhotosAlbum(() => {  //第一步： 授权保存到相册权限
      //第二步： 复制到剪贴板
      let { lists } =  this.data;
      wx.setClipboardData({
        data: (lists && lists[0].content) || "",
        success (res) {
        }
      })

      //第三步： 获取海报二维码
      this.promiseAllData(); 
    })
  },
  promiseAllData() {   //处理多个请求: 获取二维码
    const me = this;
    let { remand_goods } = me.data;
    if (remand_goods && remand_goods.length){
      wx.showLoading({ title: '正在准备颜料...', mask: true});
      let promiseArray = []
      remand_goods.forEach((item, index) => {
        let params = {
          path: 'pages/product/details',
          id: item.product_id,
          share_uid: getApp().globalData.my_uid,
          shareType: 1
        }
        promiseArray.push(me.getDetailQrCode(params));
      })
      
      Promise.all(promiseArray.map((promiseItem, index) => {
        return promiseItem.catch((err) => {    //拦截错误回调
          return err
        })
      }))
      .then((res) => {
        let qArr = [], errmsg = "";
        res.forEach((item, index) => {
          let { err_code, err_msg } = item.data;
          if (err_code == 0) {
            qArr.push(err_msg);
          }else if (err_code == 1000) {
            qArr.push('');
            errmsg = err_msg;
          }
        })
        me.setData({ qrCodeUrlArr: qArr });

        if (errmsg){
          wx.showModal({
            title: '温馨提示',
            content: errmsg,
            confirmText: '好哒',
            confirmColor: app.globalData.navigateBarBgColor,
            showCancel: false,
            success: function (res) {
              me.saveImgByOrder();   //第四步： 按顺序开始保存图片
            }
          });
        }else {
          me.saveImgByOrder();   //第四步： 按顺序开始保存图片
        }

      })
      .catch((res) => {
        console.log(res);
      })

    }else {    //没有推荐海报，直接保存普通图片
      me.saveImgByOrder();   //第四步： 按顺序开始保存图片/视频  type: 1图片  2视频
    }
  },
  getDetailQrCode: function (data) {    //获取相关推荐海报的 详情路径二维码
    var that = this;
    let ticket = wx.getStorageSync('ticket');
    return new Promise((resolve, reject) => {
      wx.request({
        url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
        header: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: "POST",
        success: function (res) {
          console.log('获取二维码成功')
          wx.hideLoading();
          if (res.statusCode == 200) {
            resolve(res);
          }
        },
        fail: function (res) {
          wx.hideLoading();
          reject(res);
        }
      })
    })
  },
  saveImgByOrder(nextImg) {   //第四步： 按顺序保存图片/视频 -->  先保存普通图片，然后视频，然后绘制海报
    const me = this;
    let { lists, remand_goods, curNum, qrCodeUrlArr } = this.data;
    let _arr = lists[0].files;
    
    if (!_arr.length && !remand_goods.length){  //没有任何可以保存的图片
      wx.showModal({
        title: '温馨提示',
        content: '没有需要下载的素材',
        confirmText: '好哒',
        confirmColor: app.globalData.navigateBarBgColor,
        showCancel: false,
        success: function (res) {
          
        }
      });
      return;
    }

    me.setData({ showPercent: true });

    if (nextImg) {    //前面一张图片保存失败了，继续保存下一张
      curNum = nextImg;
      me.setData({ curNum });
    }

    if (_arr.length && curNum < _arr.length){  //先保存普通图片/视频   1图片 2视频
      if (_arr[curNum].type == 1){
        publicFun.getImageInfoFun(_arr[curNum].file_path, (res) => {
          if (res){
            me.savePhoto(res.path);
          }else {
            me.errShowFun()  //前面一张图片保存失败了，继续保存下一张
          }
        })
      }else {
        wx.downloadFile({   //视频路径转为临时路径
          url: _arr[curNum].file_path,
          success: function (res) {
            console.info("下载一个视频成功", res);
            let { tempFilePath } = res;
            me.savePhoto(tempFilePath, 'video');
          },
          fail: function (e) {
            console.info("下载一个视频失败", e);
            me.errShowFun('video')  //前面一张图片保存失败了，继续保存下一张
          }
        })
      }
    }else if (_arr.length && remand_goods.length && curNum < (_arr.length + remand_goods.length)){   //普通图片和推荐海报同时存在
      me.creatPostDetail(remand_goods[curNum - _arr.length], qrCodeUrlArr[curNum - _arr.length]);
    }else if (!_arr.length && remand_goods.length && curNum < remand_goods.length){   //没有图片普片，只有推荐海报
      me.creatPostDetail(remand_goods[curNum], qrCodeUrlArr[curNum]);
    }else {   //全部保存完毕，初始化数据
      this.setData({ showPercent: false, curNum: 0 });
      wx.showModal({
        title: '下载成功',
        content: '文案已复制,图片/视频已保存到相册~',
        showCancel: false,
        confirmText: '好哒',
        confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
        success: function (res) {
          
        }
      })
    }
  },
  savePhoto(filePath, video) {   //保存图片/视频到相册的方法
    const me = this;
    let { totalNum, curNum } = me.data;

    let saveOption = {
      filePath,
      success(res) { 
        wx.createSelectorQuery().in(me)
        .select('#percentBar')
        .fields({ node: true, size: true })
        .exec(function (res) {
          let w = res[0].width / 2;   //获取canvas的宽度的一半，用于圆心x坐标
          let h = res[0].height / 2;  //获取canvas的高度的一半，用于圆心y坐标
          
          let _p = (curNum + 1)/totalNum*100;
          let time = 1000 / _p;    //单个百分比需要的执行时间
          me.setData({ curNum: ++curNum });
          me.selectComponent("#percentBar").canvasTap((curNum-1)/totalNum*100, _p, time, w, h);
          console.log('curNum---', me.data.curNum, '_p-----', _p, );
        })
      },
      fail(res) {
        console.log('保存到相册失败', res);
        me.errShowFun(video)  //前面一张图片保存失败了，继续保存下一张
      }
    }

    if (!video){
      wx.saveImageToPhotosAlbum(saveOption)   //保存图片打相册
    }else {
      wx.saveVideoToPhotosAlbum(saveOption)  //保存视频到相册
    }
  },
  onPercentSuccess() {   //进度条已经绘制完成: 继续绘制下一步
    this.saveImgByOrder();
  },
  errShowFun(video) {   //前面一张图片保存失败了，继续保存下一张
    const me = this;
    let { curNum } = me.data;
    wx.showModal({
      title: '保存失败',
      content: `第【${curNum+1}】${video?'个视频':'张图'}，保存到相册失败~`,
      confirmText: '继续',
      cancelText: '取消',
      confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
      success: function (res) {
        if (res.confirm){
          me.saveImgByOrder(curNum + 1);
          return;
        }
        me.setData({ showPercent: false, curNum: 0 });  //点击了取消按钮，不再保存图片
      }
    })
  },
  creatPostDetail: function (productData, qrPath) {   // 生成相关推荐海报图： 产品详情海报图
    let that = this;

    let product_name = productData.name;
    let product_price = productData.price;
    
    let canvasData = { // 画布数据
        status: true,
        canvasId: 'productPost',
        // canvasWidth: 500,
        // canvasHeight: 680,
        // paddingLeft: that.data.winWidth * 0.15,
        // paddingTop: that.data.winWidth * 0.15,
        canvasWidth: 750,
        canvasHeight: 960 + 290,
        paddingLeft: 0,
        paddingTop: 0,
        radius: 10,
        bg_color: '#ffffff',// 画图填充背景色（不设置默认会生成透明背景的图片）
        bgPath: '../../../../images/shop_post_bg.png', // 海报背景图
        whiteBg: '../../../../images/white_bg.png',
        heartPath: '../../../../images/heart.png', // 爱心图标
        product_name: product_name, // 活动名称
        product_price: product_price,
        text_qrcode_btm: '长按识别小程序码 即可查看~', // 二维码下方文字
        loadFailTapStatus: false, // 下载失败处理函数是否已执行
        // 图片数据
        avatarPath: that.data.lists[0].wx_local_avatar, // 用户头像
        qrcodePath: qrPath ? 'https://' + qrPath.split('://')[1] : productData.image, // 二维码
        productImage: productData.image   // 商品首图
    };
    let obj = canvas.px2rpx({ w: canvasData.canvasWidth, h: canvasData.canvasHeight, base: that.data.winWidth });
    that.setData({
        canvasData: canvasData,
        canvasPosition: obj
    })
    let task = []
    let filePaths = ['productImage','qrcodePath','avatarPath']
    for (let j = 0; j < filePaths.length; j++) {
        const filePath = filePaths[j];
        task.push(canvasFun.loadImageFileByUrl(that.data.canvasData[filePath]))
    }

    Promise.all(task).then(resultList=>{
        for (let filePathIndex = 0; filePathIndex < resultList.length; filePathIndex++) {
            let resultListElement = resultList[filePathIndex];
            that.data.canvasData[filePaths[filePathIndex]] = resultListElement.tempFilePath
        }
        that.setData({
          canvasData: that.data.canvasData
        })
        that.drawCanvasDetial();
    }).catch(err => {
        console.log(err);
    })
},
drawCanvasDetial: function () {   //画产品海报
    let that = this;
    let w = that.data.canvasData.canvasWidth;
    let h = that.data.canvasData.canvasHeight;
    let left = that.data.canvasData.paddingLeft;
    let top = that.data.canvasData.paddingTop;
    // 内部商品图片偏移量
    let innerLeft = 60;
    // 内部商品图片高度
    let imgH = w - (left + innerLeft) * 2;
    // 头像半径
    let head_r = 53;
    // 二维码半径
    let qrode_r = 80;
    let positionY = 0;
    // 生成画笔
    const ctx = wx.createCanvasContext(that.data.canvasData.canvasId);

    // 绘制白色圆角背景
    canvas.roundRect({
        ctx: ctx,
        x: left,
        y: top,
        w: w - left * 2,
        h: h - top * 2,
        r: 0,
        blur: 20,
        shadow: 'rgba(180,180,180,.4)'
    });

    // 绘制头像
    positionY = top + 47;
    canvas.circleImg({
        ctx: ctx,
        img: that.data.canvasData.avatarPath,
        r: head_r,
        x: left + 68,
        y: positionY,
        w: head_r * 2,
        h: head_r * 2
    });

    // 绘制头像右侧多行文字
    canvas.drawMultiText({
        ctx: ctx,
        text: '我看上了这款商品\n帮我看看咋样啊~\n比心~     ~',
        x: left + head_r * 2 + 113,
        y: top + 41,
        fontSize: 30,
        gap: 12
    });

    ctx.font = '30px PingFang-SC-Bold'
    let textW = ctx.measureText('比心~ ').width;
    canvas.drawImage({
        ctx: ctx,
        img: that.data.canvasData.heartPath,
        x: left + head_r * 2 + 113 + textW,
        y: top + 41 + (30 + 12) * 2,
        w: 30,
        h: 30
    });

    // 绘制中间容器
    positionY = positionY + head_r * 2 + 39;
    canvas.roundImg({
        ctx: ctx,
        x: left + innerLeft,
        y: positionY,
        img: that.data.canvasData.productImage,
        w: imgH,
        h: imgH,
        r: 14,
        blur: 14,
        shadow: 'rgba(180,180,180,.4)',
        // 是否显示蒙层
        cover: false,
        // 蒙层高度
        coverH: 140
    });

    let product_name_text = that.data.canvasData.product_name;
    // 绘制中间容器,商品名称,超出19个字显示两行，多两行，显示省略号
    if(product_name_text.length > 20){
        if(product_name_text.length > 40){
            product_name_text =product_name_text.slice(0,20)+'\n'+ product_name_text.slice(20,39)+"...";
        }else{
            product_name_text =product_name_text.slice(0,20)+'\n'+ product_name_text.slice(20,product_name_text.length);
        }
        canvas.drawMultiText({
            ctx,
            gap:5,
            text: product_name_text,
            x: left + innerLeft,
            y: positionY + imgH + 5,
            fontSize: 30
        })
    }else{
        canvas.drawText({
            ctx: ctx,
            text: product_name_text,
            x: left + innerLeft,
            y: positionY + imgH + 22,
            fontSize: 30
        });
    }

    // 绘制中间容器,商品价格
    // 右对齐的文字是以x的距离右对齐
    canvas.drawText({
        ctx: ctx,
        text: '¥' + that.data.canvasData.product_price,
        x: left + innerLeft,
        y: positionY + imgH + 100,
        fontSize: 50,
        color: '#b4282d',
        align: 'left'
    });

    console.log("====");
    console.log(that.data.canvasData.qrcodePath);

    //绘制分割线
    canvas.roundBorderRect({
        ctx,x:left + innerLeft, y:positionY + imgH + 190, h:0.1, w:imgH, r:0,border:"#eeeeee"
    })

    // 绘制二维码
    positionY = positionY + 466 + 24;
    canvas.drawImage({
        ctx: ctx,
        img: that.data.canvasData.qrcodePath,
        x: left + innerLeft + 10,
        y: positionY + 370,
        w: qrode_r * 2,
        h: qrode_r * 2
    });

    // 绘制二维码右侧文字
    canvas.drawText({
        ctx: ctx,
        text: '长按识别小程序码 即可查看~',
        x: left + innerLeft + qrode_r * 2 + 41,
        y: positionY + qrode_r + 375,
        fontSize: 30,
        baseline: 'middle',
        color: '#030000'
    });

    // 最终绘出画布
    ctx.draw(false, () => {
      let w = that.data.canvasData.canvasWidth;
      let h = that.data.canvasData.canvasHeight;
      that.saveDetail({
          id: that.data.canvasData.canvasId,
          w: w,
          h: h,
          targetW: w * 4,
          targetH: h * 4
      });
    });
},
saveDetail: function (o) {   // 生成产品详情海报
    const me = this;
    let { totalNum, curNum } = this.data;
    
    canvas.canvasToTempFilePath(o).then(function (res) {
        o.imgSrc = res.tempFilePath;
        canvas.saveImageToPhotosAlbum(o).then(function (res) {
          wx.createSelectorQuery().in(me)
          .select('#percentBar')
          .fields({ node: true, size: true })
          .exec(function (res) {
            let w = res[0].width / 2;   //获取canvas的宽度的一半，用于圆心x坐标
            let h = res[0].height / 2;  //获取canvas的高度的一半，用于圆心y坐标
            
            let _p = (curNum + 1)/totalNum*100;
            let time = 1000 / _p;    //单个百分比需要的执行时间
            me.setData({ curNum: ++curNum });
            me.selectComponent("#percentBar").canvasTap((curNum-1)/totalNum*100, _p, time, w, h);
            console.log('海报--curNum---', me.data.curNum, '_p-----', _p, );
          })
        }, function (err) {
          console.log('海报保存到相册失败---', err);
          wx.showModal({
            title: '存图失败',
            content: `第【${curNum+1}】张图，保存到相册失败~`,
            confirmText: '继续',
            cancelText: '取消',
            confirmColor: app.globalData.navigateBarBgColor ? app.globalData.navigateBarBgColor : '#72B9C3',
            success: function (res) {
              if (res.confirm){
                me.saveImgByOrder(curNum + 1);
                return;
              }
              me.setData({ showPercent: false, curNum: 0 });  //点击了取消按钮，不再保存图片
            }
          })
        });
    }, function (err) {
      console.log(err);
    });
  },
  touchmove() {   //弹框时阻止页面滑动
  }
})