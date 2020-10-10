// import http_cps from "../../../../utils/http_cps";
// var wxParse = require('../../../../wxParse/wxParse.js');
Page({
    data: {
        // msg: ""
        src: "",
        option: 1, //任务号
    },
    onLoad: function (e) {
        // 生命周期函数--监听页面加载
        // this.getMsg(1)
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
    onShow: function () {
        // 生命周期函数--监听页面显示

    },

    videoErrorCallback(e) {
        console.log("视频错误信息:");
        console.log(e.detail.errMsg);
    },

    // 调用图文详情接口
    // getMsg(type) {
    //     http_cps.get("notice_cps", {}, false, `/${type}`).then(res => {
    //         var content = res.data.content
    //         this.setData({
    //             msg: content
    //         })
    //         wxParse.wxParse('content', 'html', content, this, 10);
    //          本地缓存是否观看过新手指南
    //          wx.setStorageSync("hasBrowse", true)
    //     })
    // }
})