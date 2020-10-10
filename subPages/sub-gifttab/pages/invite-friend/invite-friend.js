import publicFun from "../../../../utils/public"
import common from "../../../../utils/common"
import canvas from "../../../../utils/canvas"
import canvasFun from "../../../../utils/canvas-post"
import {
    toPx
} from "../../../../utils/util"
import http_cps from "../../../../utils/http_cps"
import http from "../../../../utils/http"
import {
    togetherDialogData,
    togetherDialogJs
} from "../../../../template/together-dialog/together-dialog"

const app = getApp();
Page({
    data: {
        tabsData: {
            activeTab: 0,
            tabs: ["每日好货", "邀请素材"]
        },
        momentsList: null,
        page: 1,
        pageSize: 10,
        showCommonModa: false, //进度弹框
        totalNum: [], //当前下载图片数组
        curNum: 0, //当前下载图片数量
        warningData: { //警告弹框
            isShowModal: false,
            type: "",
            title: "",
            content: "",
            cancelText: "",
            confirmText: ""
        },
        qrcodePath: "", //小程序二维码地址
        canvasData: null, //canvas绘图的数据
        canvasPosition: null, //canvas尺寸的数据
        canvasImg: "", //生成的最终海报路径
        qrcodeCanvasImg: "", //生成的用于展示的 临时二维码路径
        isClickQrcode: '', //当前展示的类型：  普通海报 / 高清二维码
        showPlaybill: false, //关闭海报展示框
        userData: {}, //用户信息
        isSecClick: false, //防止二次点击
        ...togetherDialogData,
        shareInfo: {}, //邀请好友的信息
        shareList: [], //邀请好友的信息
    },
    onLoad: function (options) { //页面加载完成
        publicFun.onLoad(app, this); // 授权

        // this.getListData();
        this.getShareData()
    },
    onReady: function () { //页面初次渲染完成

    },
    onShow: function () { //监听页面显示
        this.isLogin(1) //判断用户是否登录

        //判断手机号码是否需要授权 授权前需要刷新登录态
        let _has_phone = this.data._has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
        if (!_has_phone) app.wxloginMethods() //新用户手机授权之前先刷新登录态

        this.getIncomeData();
    },
    onHide: function () { //监听页面隐藏

    },
    onPullDownRefresh() { //下拉刷新
        this.setData({
            page: 1,
        });
        this.getIncomeData('refresh');
        // this.getListData('refresh');
        this.getShareData('refresh')
    },
    onReachBottom() { //上拉加载更多
        let {
            shareList,
            page,
            pageSize
        } = this.data;
        let len = shareList.length;
        if (len < pageSize || len % pageSize != 0) return;
        page++;
        this.setData({
            page
        });
        // this.getListData();
        this.getShareData()
    },
    ...togetherDialogJs,
    getShareData(type) {
        let me = this
        let {
            page,
            pageSize
        } = this.data
        let params = {
            page,
            page_size: pageSize,
        }
        let isloading = type || page > 1 ? true : false; //下拉刷新 和 加载更多的时候展示Loading
        http_cps.get('charge_share_points', params, isloading, '', this.noAuthCallback).then(res => {
            this.setData({
                shareInfo: res.data.count
            })
            if (type) {
                this.setData({
                    shareList: []
                })
                if (type == 'refresh') wx.stopPullDownRefresh();
            }
            if (!res.data || !res.data.list.length) {
                if (page > 1) { //将页数减1，回到上拉之前的值
                    page--;
                    me.setData({
                        page
                    });
                    wx.showToast({
                        title: "没有更多数据了",
                        icon: "none"
                    });
                } else {
                    me.setData({
                        shareList: []
                    });
                }
                return;
            }
            let newArr = [],
                {
                    shareList
                } = me.data
            newArr = shareList ? shareList.concat(res.data.list) : [].concat(res.data.list);
            me.setData({
                shareList: newArr
            });
        })
    },
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

    noAuthCallback() { //token过期：401处理
        this.isLogin(1); //先检查是否登录
        this.setData({
            // momentsList: []
            shareList: []
        });
    },
    getIncomeData(refresh) { //获取用户信息
        http_cps.get('balance_info_cps', {}, false, "", this.isLogin)
            .then(res => {
                if (refresh) wx.stopPullDownRefresh();

                //从手机授权成功页面跳转来的, 执行下一步操作  兼容老用户： 会员以上级别
                if (!refresh) {
                    let _suc = wx.getStorageSync('success_getphone');
                    if (_suc) this.successGetPhoneCallback(res.data.member_grade);
                }

                this.setData({
                    userData: res.data
                });
                this.getMemberInfo(res.data.uid);
            })
            .catch(res => {
                if (refresh) wx.stopPullDownRefresh();
                wx.showToast({
                    title: res.msg,
                    icon: 'none'
                })
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
    setComModalData(isShowModal = false, title, content, type, cancelText, confirmText) { //自定义警告弹框内容
        this.setData({
            'warningData.isShowModal': isShowModal,
            'warningData.type': type,
            'warningData.title': title,
            'warningData.content': content,
            'warningData.cancelText': cancelText,
            'warningData.confirmText': confirmText
        })
    },
    prewImgFun(e) { //图片预览
        let {
            index,
            i,
            url,
            type,
            meterial
        } = e.currentTarget.dataset;
        let {
            momentsList,
            tabsData
        } = this.data;

        //点击邀请素材的海波背景图时，直接生成海报
        if (tabsData.activeTab == 1) {
            this.downloadFun('', type, meterial);
            return;
        }

        //url: 表示生成的海报或者小程序码路径
        let current = url ? url : momentsList[index].images[i];
        let urls = url ? [url] : momentsList[index].images;
        wx.previewImage({
            current,
            urls
        }); //展示大图
    },
    copyFun(e) { //复制文案
        let {
            content
        } = e.currentTarget.dataset;
        wx.setClipboardData({
            data: content,
            success(res) {
                wx.getClipboardData({
                    success(res) {
                        wx.showToast({
                            title: '复制成功',
                            icon: 'success'
                        });
                    }
                })
            }
        })
    },
    downloadFun(e, curtype, curmeterial) { //下载素材
        let type = "",
            meterial = [],
            {
                isSecClick,
                tabsData
            } = this.data;
        type = curtype ? curtype : e.currentTarget.dataset.type;
        meterial = curmeterial ? curmeterial : e.currentTarget.dataset.meterial;

        if (isSecClick) return;
        this.setData({
            isSecClick: true
        }); //设置是否二次点击

        if (!meterial.length) { //每日好货：  没有任何可以保存的图片
            this.setData({
                isSecClick: false
            }); //设置是否二次点击
            this.setComModalData(true, '温馨提示', '当前没有可下载的素材', '', '好的', ''); //设置警告弹框
            return;
        }

        //第一步： 授权保存到相册权限
        wx.showLoading({
            mask: true
        });
        publicFun.checkAuthOfSaveImageToPhotosAlbum(() => {
            wx.hideLoading();
            this.setData({
                totalNum: meterial,
                curNum: 0
            });

            if (tabsData.activeTab == 0) { //每日好货： 只是保存图片
                this.setData({
                    showCommonModa: true
                });
                this.saveImgByOrder();
                return;
            }

            //邀请素材 海报/二维码制作
            let {
                qrcodePath
            } = this.data;
            this.setData({
                isClickQrcode: type
            }); //保存当前生成的类型： 海报 / 高清二维码

            //下载高清二维码
            if (type == 'qrcode') {
                wx.showLoading({
                    title: '小程序码生成中',
                    mask: true
                });
                qrcodePath ? this.changeQrcodeToLocal() : this.getMiniQrcode('showqrcode'); //邀请素材： 需要先获取小程序太阳码
                return;
            }
            //制作海报
            qrcodePath ? this.creatCanvasData('qrexist') : this.getMiniQrcode(); //邀请素材： 需要先获取小程序太阳码
        })
    },
    changeQrcodeToLocal() { //将获取的二维码路径转换成临时路径 用于展示高清二维码
        const me = this;
        let {
            qrcodePath
        } = this.data;
        let task = [canvasFun.loadImageFileByUrl(qrcodePath)];
        Promise.all(task).then(res => {
            wx.hideLoading();
            console.log('333333');
            let _npath = res[0].tempFilePath;
            me.setData({
                isClickQrcode: 'qrcode',
                qrcodeCanvasImg: _npath,
                showPlaybill: true
            });
        }).catch(err => {
            console.log('图片转换失败---', err);
            wx.hideLoading();
            me.setComModalData(true, '温馨提示', '小程序二维码生成失败', '', '我知道了', ''); //设置警告弹框
        })
    },
    getMiniQrcode(showqrcode) { //生成小程序太阳码 方法
        const me = this;
        let data = {
            path: 'pages/index/index',
            id: '',
            width: 840, //太阳码的宽度
            share_uid: app.globalData.my_uid,
            shareType: 1
        }
        wx.showLoading({
            title: showqrcode ? '小程序码生成中' : '海报生成中',
            mask: true
        });

        let ticket = wx.getStorageSync('ticket');
        wx.request({
            url: common.Url + '/app.php?c=qrcode&a=share_ewm' + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket,
            header: {
                'Content-Type': 'application/json'
            },
            data: data,
            method: "POST",
            success: function (res) {
                if (res.statusCode != 200 || !res.data || res.data.err_code != 0) {
                    wx.hideLoading();
                    me.setComModalData(true, '温馨提示', '小程序二维码生成失败', '', '我知道了', ''); //设置警告弹框
                    return;
                }

                me.setData({
                    qrcodePath: res.data.err_msg
                });
                showqrcode ? me.changeQrcodeToLocal() : me

                    .creatCanvasData();
            },
            fail: function (res) {
                wx.hideLoading();
                me.setComModalData(true, '温馨提示', '小程序二维码生成失败', '', '我知道了', ''); //设置警告弹框
            }
        })
    },
    saveImgByOrder(nextImg) { //按顺序保存图片
        let {
            totalNum,
            curNum
        } = this.data;

        if (curNum >= totalNum.length && totalNum.length != 0) { //取消下载之后 curNum=totalNum.length=0
            this.setData({
                showCommonModa: false,
                curNum: 0,
                totalNum: []
            })
            this.setComModalData(true, '', '图片已保存到手机相册，快去给大家晒一下吧', 'success', '好的', ''); //设置警告弹框
            return;
        }

        if (nextImg) { //前面一张图片保存失败了，继续保存下一张
            curNum = nextImg;
            this.setData({
                curNum
            });
        }

        //第二步： 将图片路径转换成临时路径
        publicFun.getImageInfoFun(totalNum[curNum], (res) => {
            res ? this.savePhoto(res.path) : this.errShowFun() //前面一张图片保存失败了，继续保存下一张
        })
    },
    savePhoto(filePath) { //第三步： 保存图片到相册
        const me = this;
        let {
            curNum
        } = this.data;
        wx.saveImageToPhotosAlbum({
            filePath,
            success(res) {
                me.setData({
                    curNum: ++curNum
                });
                me.saveImgByOrder();
            },
            fail(res) {
                console.log('保存到相册失败', res);
                me.errShowFun() //前面一张图片保存失败了，继续保存下一张
            }
        })
    },
    errShowFun() { //前面一张图片保存失败了，继续保存下一张
        const me = this;
        let {
            curNum
        } = me.data;
        this.setComModalData(true, '保存失败', `第【${curNum+1}】张图，保存到相册失败~`, 'error', '取消', '继续'); //设置警告弹框
    },
    cancleFun() { //取消下载
        this.setData({
            showCommonModa: false,
            curNum: 0,
            totalNum: [],
            isSecClick: false
        });
    },
    warningCancle() { //警告弹框  取消按钮
        let {
            type
        } = this.data.warningData;
        this.setData({
            'warningData.isShowModal': false,
            isSecClick: false
        });

        if (type == 'error') {
            this.setData({
                showCommonModa: false,
                curNum: 0,
                totalNum: []
            }); //点击了取消按钮，不再保存图片
        }
    },
    toMakesure() { //警告弹框  确定按钮
        let {
            type
        } = this.data.warningData;
        this.setData({
            'warningData.isShowModal': false
        });

        if (type == 'error') {
            let {
                curNum
            } = this.data;
            this.saveImgByOrder(curNum + 1);
        }
    },
    creatCanvasData(qrexist) { //准备画布数据
        const me = this;

        if (qrexist) wx.showLoading({
            title: '海报生成中',
            mask: true
        }); //小程序二维码已经存在，直接制作海报

        let {
            nickname,
            invitation_code
        } = this.data.userData, {
            // totalNum,
            qrcodePath
        } = this.data;
        let _userinfo = wx.getStorageSync('userinfo');
        if (_userinfo) _userinfo = JSON.parse(_userinfo);

        let canvasData = {
            canvasId: 'myCanvas',
            canvasWidth: 520,
            canvasHeight: 925,
            // canvasWidth: 500,
            // canvasHeight: 545,
            // bgPath: totalNum[0], // 海报背景图
            bgPath: 'https://frontend-mam.oss-cn-hangzhou.aliyuncs.com/live/playbill-img.png', // 海报背景图
            text_qrcode_btm: '长按识别二维码', // 二维码下方文字
            nickName: nickname || "", // 用户昵称
            avatarPath: _userinfo ? _userinfo.wx_local_avatar : "", // 用户头像  wx_local_avatar:转换成了自己的服务器域名
            qrcodePath: qrcodePath ? 'https://' + qrcodePath.split('://')[1] : "", // 二维码
            invitation_code: invitation_code //邀请码
        }

        let obj = canvas.px2rpx({
            w: canvasData.canvasWidth,
            h: canvasData.canvasHeight
        });
        this.setData({
            canvasData,
            canvasPosition: obj,
        });

        let task = [],
            filePaths = ['qrcodePath', 'avatarPath', 'bgPath'];
        for (let i = 0; i < filePaths.length; i++) {
            let filePath = filePaths[i];
            task.push(canvasFun.loadImageFileByUrl(canvasData[filePath]));
        }
        Promise.all(task).then(res => {
            for (let i = 0; i < res.length; i++) {
                let resItem = res[i];
                canvasData[filePaths[i]] = resItem.tempFilePath
            }
            me.setData({
                canvasData
            });
            me.drawCanvas();
        }).catch(err => {
            console.log('图片转换失败---', err);
            wx.hideLoading();
            me.setComModalData(true, '温馨提示', '海报生成失败，请重试', '', '我知道了', ''); //设置警告弹框
        })
    },
    drawCanvas() { //开始画图
        const me = this;
        let {
            canvasId,
            canvasWidth,
            canvasHeight,
            bgPath,
            nickName,
            avatarPath,
            invitation_code,
            qrcodePath,
            text_qrcode_btm
        } = this.data.canvasData;
        let headr = 30; //头像半径
        const ctx = wx.createCanvasContext(canvasId);

        // 绘制白色圆角背景 及 背景图片
        canvas.roundRect({
            ctx: ctx,
            x: 0,
            y: 0,
            w: canvasWidth,
            h: canvasHeight,
            r: 8
        });
        ctx.clip();
        ctx.drawImage(bgPath, 0, 0, toPx(canvasWidth), toPx(778));
        // ctx.drawImage(bgPath, 0, 0, toPx(canvasWidth), toPx(400));
        ctx.restore();

        //绘制用户头像
        if (avatarPath) {
            canvas.circleImg({
                ctx: ctx,
                img: avatarPath,
                r: headr, //头像半径
                x: 30,
                y: 778 + 20,
                // y: 400 + 20,
                w: headr * 2,
                h: headr * 2
            })
        }
        //绘制昵称  x:字体居中 x为整个宽度一半  y: 顶部30 + 头像80 + 10间隙 + 字体高度24/2 = 132 
        ctx.beginPath();
        ctx.setFontSize(toPx(20));
        ctx.setFillStyle('#333333');
        ctx.setTextBaseline('top');
        ctx.setTextAlign('left');
        ctx.setTextBaseline('top');
        ctx.fillText(nickName, toPx(115), toPx(798));
        // ctx.fillText(nickName, toPx(115), toPx(420));
        //绘制邀请提示语
        ctx.beginPath();
        ctx.setFontSize(toPx(16));
        ctx.setFillStyle('#999999');
        ctx.fillText('邀你一起加入闪购Live', toPx(115), toPx(826));
        // ctx.fillText('邀你一起加入闪购Live', toPx(115), toPx(448));
        // ctx.fillText('购物省钱 推广赚钱', toPx(115), toPx(470));
        ctx.fillText('购物省钱 推广赚钱', toPx(115), toPx(848));
        //绘制邀请码
        if (invitation_code) {
            ctx.beginPath();
            ctx.setFontSize(toPx(18));
            ctx.setFillStyle('#DDA53D');
            ctx.fillText('邀请码：' + invitation_code, toPx(115), toPx(878));
            // ctx.fillText('邀请码：' + invitation_code, toPx(115), toPx(500));
        }
        //绘制二维码提示语
        ctx.beginPath();
        ctx.setFontSize(toPx(12));
        ctx.setFillStyle('#999999');
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(text_qrcode_btm, toPx(canvasWidth - 73), toPx(896));
        // ctx.fillText(text_qrcode_btm, toPx(canvasWidth - 73), toPx(518));
        //绘制二维码
        canvas.circleImg({
            ctx: ctx,
            img: qrcodePath,
            r: 43, //头像半径
            x: canvasWidth - 116,
            y: 795,
            // y: 417,
            w: 86,
            h: 86
        })

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
                    console.log('生成的海报图片路径为-----', res.tempFilePath);
                    me.setData({
                        canvasImg: res.tempFilePath,
                        showPlaybill: true,
                        isClickQrcode: ''
                    });
                })
                .catch(err => {
                    console.log('生成海报失败----', err);
                    wx.hideLoading();
                    me.setComModalData(true, '温馨提示', '海报生成失败，请重试', '', '我知道了', ''); //设置警告弹框
                })
        })
    },
    tosaveFun(e) { //保存海报到相册
        let {
            close
        } = e.currentTarget.dataset
        if (close) {
            this.setData({
                showPlaybill: false
            });
            return
        }
        const me = this;
        let {
            canvasImg,
            qrcodeCanvasImg,
            isClickQrcode
        } = me.data;
        canvas.saveImageToPhotosAlbum({
                imgSrc: isClickQrcode == 'qrcode' ? qrcodeCanvasImg : canvasImg
            }).then(res => {
                me.setComModalData(true, '', '图片已保存到手机相册，快去给大家晒一下吧', 'success', '好的', ''); //设置警告弹框
                me.setData({
                    showPlaybill: false
                });
            })
            .catch(err => {
                console.log('保存到相册失败----', err);
                me.setComModalData(true, '温馨提示', '保存到相册失败，请重试', '', '我知道了', ''); //设置警告弹框
            })
    },
    closePlaybillFun() { //关闭海报
        this.setData({
            showPlaybill: false,
            isSecClick: false
        });
    },
    preventTouchMove() { //阻止蒙层下面的页面滚动
    },
    onShareAppMessage: function () { //用户点击右上角分享
        let {
            nickname
        } = this.data.userData;
        let title = nickname ? `【${nickname}】` : '';
        return app.shareGetFans(`${title}邀请你一起0.01元秒好货，限时限量秒杀不等人，速速进入！`, '限时限量 0.01元秒杀', `/pages/index/index`, 1, 'seckill');
    },
    goShare(e) {
        let {
            type
        } = e.currentTarget.dataset
        switch (type) {
            case "1": //1.分享小程序

                break;
            case "2": //2.分享邀请海报 
                this.getMiniQrcode()
                break;
            case "3": // 3.面对面扫码
                this.getMiniQrcode('showqrcode')
                break;

            default:
                break;
        }
    }
})