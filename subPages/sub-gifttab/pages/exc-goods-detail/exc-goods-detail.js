// import fake from '../../../../utils/fake_data'
import publicFun from "../../../../utils/public";
import http_cps from "../../../../utils/http_cps";
import {
    formatDateCps
} from "../../../../utils/util"
const app = getApp();
Page({
    data: {
        isShowModal: false,
        items: [{
                name: '积分兑换',
                value: 1
            },
            {
                name: '余额兑换',
                value: 2
            },
        ],
        excDetail: {},
        type: "point", //兑换方式 point积分 money余额
        excStatus: 4, //1:兑换失败,2:兑换成功,3:商品已兑完,4:是否兑换
        excValue: 1, // 兑换方式
        id: null,
        isload: false   //确认兑换，防止二次点击
    },
    onLoad: function (options) {
        // 生命周期函数--监听页面加载
        // let id = options.exc_id
        // this.getExcDetail(id)
        // this.getUserBalance()
        this.setData({
            id: options.exc_id
        })
        publicFun.onLoad(app, this);  //授权弹框提前注册
    },
    onReady: function () {
        // 生命周期函数--监听页面初次渲染完成

    },
    onShow: function () {
        this.isLogin(1)  //判断用户是否登录
        //从手机授权成功页面跳转来的, 执行下一步操作
        let _suc = wx.getStorageSync('success_getphone');
        if (_suc) this.successGetPhoneCallback();

        //判断手机号码是否需要授权 授权前需要刷新登录态
        let _has_phone = this.data._has_phone || wx.getStorageSync('has_phone') || app.globalData.has_phone;
        if (!_has_phone) app.wxloginMethods()   //新用户手机授权之前先刷新登录态

        // 生命周期函数--监听页面显示
        let {
            id
        } = this.data
        this.getExcDetail(id)
        this.getUserBalance()
        this.setData({
            isShowModal: false
        })
    },
    onHide: function () {
        // 生命周期函数--监听页面隐藏

    },
    onUnload: function () {
        // 生命周期函数--监听页面卸载

    },
    isLogin(type) {   //判断用户是否登录
        if (!type || typeof type != 'number'){
          return app.isLoginFun(this);
        }
        app.isLoginFun(this, type);//判断用户是否登录
    },
    toGetPhonenumAuth() {    //去到手机授权页面
        wx.navigateTo({ url: "/pages/getPhoneNumPage/getPhoneNumPage" });
    },
    successGetPhoneCallback(e) {   //获取手机号码获取成后执行的操作
        wx.removeStorageSync('success_getphone');
    },
    onClosePopup() { //关闭popup弹框
        this.setData({
            isshowPopup: false
        });
    },
    getUserBalance() {
        http_cps.get('balance_info_cps', {})
            .then(res => {
                this.setData({
                    points: res.data.points,
                    balance: res.data.balance
                });
            })
    },
    // 商品详情信息
    getExcDetail(id) {
        http_cps.get('point_goods_id_cps', {}, false, `/${id}`).then(res => {
            this.setData({
                excDetail: res.data
            })
        })
    },

    // 切换支付方式
    selectWay(e) {
        this.setData({
            type: e.currentTarget.dataset.type
        })
    },
    // 兑换判断
    judgeExc() {

        let {
            points,
            balance,
            type
        } = this.data
        balance = Number(balance)
        let {
            stock,
            exchange_amount,
            exchange_points
        } = this.data.excDetail
        // 商品已兑完
        if (!stock) {
            this.setData({
                isShowModal: true,
                excStatus: 3,
            })
            return
        }

        //   余额不足或积分不足
        if ((type == "point" && points < exchange_points) || (type == "money" && balance < exchange_amount)) {
            this.setData({
                isShowModal: true,
                excStatus: 1,
            })
            return
        }

        // 确认是否兑换
        this.setData({
            isShowModal: true,
            excStatus: 4,
        })
    },
    cancelExc() {
        // 取消兑换,关闭弹窗
        let {
            excStatus
        } = this.data
        this.setData({
            isShowModal: false
        })
        if (excStatus == 2) {
            wx.redirectTo({
                url: '/subPages/sub-gifttab/pages/exchange-record/exchange-record'
            })
        }
    },

    // 判断是否成功
    confirmExc() {
        let {
            type,
            id
        } = this.data.excDetail
        let payType = this.data.type
        // 判断是否为虚拟商品
        if (type == 1) {
            let { isload } = this.data;
            if (isload) return;
            this.setData({ isload: true });

            // 直接调用兑换成功接口并返回首页
            http_cps.get('point_exchange_goods_cps', {
                type: payType,
                goods_id: id
            }).then(res => {
                // 跳转回首页
                // wx.redirectTo({
                //     url: '/pages/gifttab/gifttab',
                // })
                this.setData({
                    isShowModal: true,
                    excStatus: 2,
                    isload: false
                })

            }).catch(err => {
                wx.showToast({
                    title: err.msg,
                    icon: 'none'
                })
                this.setData({
                    isShowModal: false,
                    isload: false
                })

            })
        } else {
            // 跳转到收货地址页面
            wx.navigateTo({
                url: `/subPages/sub-gifttab/pages/exc-goods-address/exc-goods-address?id=${id}&type=${payType}`,
            })
        }
    }

})