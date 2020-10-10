// pages/setpassword/index.js
let publicFun = require('../../utils/Tpublic.js');
let common = require('../../utils/common')
let app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        currentPw: "",
        pwShow: false,
        pwShowName: "明文",
        focus: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        publicFun.setBarBgColor(app);// 设置导航条背景色

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        wx.setNavigationBarTitle({
            title: "设置支付密码"
        })
    },

    inputPassword(e) {
        let {value: currentPw} = e.detail;
        this.setData({
            currentPw
        })
    },

    savePassword() {
        wx.showToast({
            title: "正在保存...",
            icon: "loading"
        })
        common.post('app.php?c=my&a=set_user_cash_pay_pwd',{
            member_id:common.member_id,
            password: this.data.currentPw
        },res=>{
          if(res.err_code == 0){
              wx.showToast({
                  title:res.err_msg,
                  icon:"success"
              })
              setTimeout(function () {
                  wx.navigateBack()
              },1000)
          }
        },'')
    },

    focusInput() {
        this.setData({
            focus: true
        })
    },

    toggleShowPassword() {
        let pwShowName = this.data.pwShowName === "密文" ? "明文" : "密文";
        this.setData({
            pwShow: !this.data.pwShow,
            pwShowName
        })
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
})