var common = require('../../../utils/common.js');
var publicFun = require('../../../utils/public.js');
var app = getApp();
Page({
    data: {
        currentTab: 0,
        dialog: {
            dialogHidden: true,
            titleMsg: "为了您的正常使用，请在设置页允许小程序使用您的通讯地址",
            determineBtnTxt: "去开启",
            openType: "openSetting"
        },
    },
    onLoad: function(e) {
        var that = this;
        console.log(e)
        if (e.order_no != '' && e.order_no != undefined) {
            that.setData({
                order_no: e.order_no,
                address: e.address,
                paymentPostage: e.paymentPostage
            })
        }
    },
    onReady: function() {
      
        var that = this;
        publicFun.height(that);
    },
    onShow: function() {
        var that = this;
        common.post('app.php?c=address&a=all', '', "addressData", that);
    },
    addressEditGO: function(e) { //添加编辑地址
        var that = this;
        let addid = e.target.dataset.addid;
        if (that.data.order_no) {
            wx.navigateTo({
              url: '/pages/user/address/addressEdit?addid=' + addid + '&order_no=' + that.data.order_no + '&address=' + that.data.address + '&paymentPostage=' + that.data.paymentPostage
            })
        } else {
            wx.navigateTo({ url: '/pages/user/address/addressEdit?addid=' + addid })
        }
    },
    defaultAddress: function(e) { //修改默认地址
        var that = this;
        if (that.data.order_no) {
            publicFun.defaultAddress(e, that, '', 'back1');
        } else {
            publicFun.defaultAddress(e, that);
        }
    },
    delAddress: function(e) { //删除地址
        var that = this;
        publicFun.delAddress(e, that);
    },
    addressData: function(result) {
        var that = this;
        let orderData = {
            order_no: that.data.order_no,
            address: that.data.address
        }
        if (result.err_code == 0) {
            result.err_msg = result.err_msg ? result.err_msg : '';
            this.setData({
                addressData: result.err_msg,
                orderData: orderData
            })
        }
    },
    chooseWXAddress: function () { // 一键使用微信收货地址
        var that = this;
        publicFun.chooseWXAddress({
            that: that,
            go: '',
            callback: callback
        });
        function callback(obj) {
            if (that.data.order_no) {
                let address_id = obj.address_id ? obj.address_id : 0;
                publicFun.defaultAddress(0, that, address_id, '');
                wx.navigateBack({
                    delta: 1
                })
            } else {
                common.post('app.php?c=address&a=all', '', "addressData", that);
            }
        }
    },
    useThisAddress: function (e) { // 选择当前地址
        var that = this;
        that.defaultAddress(e);
    }
})
