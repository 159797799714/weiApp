var publicFun = require('../../../../utils/public.js');
var common = require('../../../../utils/common.js');
import http_cps from "../../../../utils/http_cps"
Page({
    data: {
        isShowModal: false, //弹窗的显示与隐藏
        consignee: "", //收件人
        phone: "", //手机号
        postCode: "", //邮编
        address: "", //地区
        addrDetail: "", //详细地址
        region: [],
        customItem: '全部',
        goodsId: null,
        type: "point",
        curName: "",
    },
    onLoad: function (options) {
        // 生命周期函数--监听页面加载
        let {
            id,
            type
        } = options
        this.setData({
            type,
            goodsId: id
        })
    },
    onReady: function () {
        // 生命周期函数--监听页面初次渲染完成

    },
    onShow: function () {
        // 生命周期函数--监听页面显示
        var that = this;
        common.post('app.php?c=address&a=all', '', "addressData", that);
    },
    onHide: function () {
        // 生命周期函数--监听页面隐藏

    },
    onUnload: function () {
        // 生命周期函数--监听页面卸载

    },
    // 获得当前地址和电话的回调
    addressData: function (res) {
        console.log(res);
        let msg = res.err_msg
        if (res.err_code == 0 && msg.length) {
            // 将电话号码和地址渲染上去
            let _msg = msg[0]
            let phone = _msg.tel
            let region = [_msg.province_txt, _msg.city_txt, _msg.area_txt]
            let addrDetail = _msg.address + _msg.address_detail
            this.setData({
                phone,
                region,
                addrDetail
            })
        }
    },
    verifyInfo(name, value) {
        switch (name) {
            case "consignee":
                if (!value.trim()) {
                    wx.showToast({
                        title: '请填写收货人姓名',
                        icon: "none"
                    })
                    return false
                }
                return true
                break;
            case "phone":
                let res = '!/^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/';
                if (value.trim() == '' || value.trim() == undefined) {
                    wx.showToast({
                        title: '请填写手机号',
                        icon: "none"
                    })
                    return false;
                }
                if (!(value.trim()).match(/\d{11}/)) {
                    wx.showToast({
                        title: '请填写合法手机号',
                        icon: "none"
                    })
                    return false;
                }
                return true
                break;
            case "addrDetail":
                if (!value.trim()) {
                    wx.showToast({
                        title: '请填写详细地址',
                        icon: "none"
                    })
                    return false
                }
                return true
                break;
            case "postCode":
                if (!value.trim() || value.trim().length < 6) {
                    wx.showToast({
                        title: '请填写邮编',
                        icon: "none"
                    })
                    return false
                }
                return true
                break;
            case "region":
                if (!value.length) {
                    wx.showToast({
                        title: '请选择所在地区',
                        icon: "none"
                    })
                    return false
                }
                return true
                break;

            default:
                break;
        }
    },
    // hideDelete(e) { //填写信息 失去焦点时
    //     this.setData({
    //         curName: ''
    //     })
    // },
    writeInfo(e) {
        let {
            name
        } = e.currentTarget.dataset //属性名
        let {
            value
        } = e.detail
        this.setData({
            [name]: value,
        })
    },
    showDelete(e) { //展示叉 获得焦点时
        let {
            name
        } = e.currentTarget.dataset
        let {
            value
        } = e.detail
        this.setData({
            [name]: value,
            curName: name
        })
    },

    deleteAll(e) { //删除所有
        let {
            name
        } = e.currentTarget.dataset
        this.setData({
            [name]: '',
        })
    },
    bindRegionChange: function (e) {
        this.setData({
            region: e.detail.value
        })
    },
    submitInfo() {
        this.setData({
            curName: ''
        })
        // 循环判断是否出现
        let {
            consignee,
            phone,
            postCode,
            address,
            addrDetail,
            region,
            goodsId,
            type
        } = this.data
        let newList = JSON.parse(JSON.stringify({
            consignee,
            phone,
            postCode,
            addrDetail,
            region,
        }))
        let arr = Object.keys(newList)
        for (let i = 0; i < arr.length; i++) {
            let key = arr[i];
            if (!this.verifyInfo(key, newList[key])) return
        }
        address = region.join("") + addrDetail
        let params = {
            consignee,
            phone,
            post_code: postCode,
            address,
            goods_id: goodsId,
            type
        }
        http_cps.get('point_exchange_goods_cps', params, true).then(res => {
            this.setData({
                isShowModal: true
            })

        }).catch(err => {
            wx.showToast({
                title: err.msg,
                icon: 'none'
            })
        })

    },
    backExc() { //点击我知道了跳转到兑换记录页面
        wx.redirectTo({
            // url: '/subPages/sub-gifttab/pages/exc-goods-detail/exc-goods-detail?exc_id='+this.data.goodsId,
            url: '/subPages/sub-gifttab/pages/exchange-record/exchange-record'
        })
    }

})