// detail.js
var common = require('../../utils/common.js');
var publicFun = require('../../utils/public.js');
var app = getApp();
var page1 = 1; // 佣金明细接口页
var page2 = 1; // 提现记录接口页
Page({

  /**
   * 页面的初始数据
   */
    data: {
        currentTab: 0,   //当前标签
        scrollTop: 0,
        scrollHeight: 0,
        brokerageData: '', //佣金明细数据
        brokerage_next_page: false,
        recordData: '',   //提现记录数据
        record_next_page: false,
        artMsgShow: false, //是否显示为空提示
        artMsg: '您还没有相关佣金', // 为空时信息提示
    },
    /**
    * 生命周期函数--监听页面加载
    */
    onLoad: function (options) {
        var that = this;
        publicFun.setBarBgColor(app, that);// 设置导航条背景色
        publicFun.barTitle('本店佣金统计');
        publicFun.height(that); 

      if (options.currentTab) {
          this.setData({
            currentTab: 1
          })
        } 
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        var that = this;
        let url = 'app.php?c=drp_ucenter&a=profit_list';
        common.post(url, '', "getBrokerage", that);

        let url1 = 'app.php?c=drp_ucenter&a=withdrawal_list&page=' + 1;
        common.post(url1, '', "getRecord", that);
    },
    
    //切换标签
    switchNav: function (e) {
        var that = this;
        page1 = 1;
        page2 = 1;
        let current = e.target.dataset.current;
        if (current == that.data.currentTab) {
            return
        }
        if (current == 0) {
            let url = 'app.php?c=drp_ucenter&a=profit_list&page=' + page1;
            common.post(url, '', "getBrokerage", that);
        }
        if (current == 1) {
            let url = 'app.php?c=drp_ucenter&a=withdrawal_list&page=' + page2;
            common.post(url, '', "getRecord", that);
        }
        publicFun.swichNav(e, that);
    },

    //init发起佣金明细接口请求
    getBrokerage: function (res) {
        var that = this;
        
        if (res.err_code == 0) {
            if (res.err_msg.financial_record_list.length > 0) {
                that.data.artMsgShow = false;
                let list = res.err_msg.financial_record_list;
                for (let i = 0; i < list.length; i++) {
                    list[i].add_time = publicFun.dataCode(list[i].add_time*1000, 'year');
                }
                res.err_msg.financial_record_list = list;
            } else {
                that.data.artMsgShow = true;
                that.data.artMsg = "您还没有相关佣金";
            }
            that.setData({
                brokerageData: res.err_msg,
                brokerage_next_page: res.err_msg.next_page,
                artMsgShow: that.data.artMsgShow,
                artMsg: that.data.artMsg
            })
        }

    },

    //init发起提现记录接口请求
    getRecord: function (res) {
        var that = this;
        if (res.err_code == 0) {
            if (res.err_msg.store_withdrawal_list.length > 0) {
                that.data.artMsgShow = false;
            } else {
                that.data.artMsgShow = true;
                that.data.artMsg = "暂无提现记录";
            }
            that.setData({
                recordData: res.err_msg,
                record_next_page: res.err_msg.next_page,
                artMsgShow: that.data.artMsgShow,
                artMsg: that.data.artMsg
            })
        }
    },

    //滚动触发到底部
    bindDownLoad: function () {
        console.log('bindDownLoad')
        var that = this;
        if (that.data.currentTab == 0) {
            if (that.data.brokerage_next_page) {
                page1++;
                let url = 'app.php?c=drp_ucenter&a=profit_list&page=' + page1;
                // common.post(url, '', "getBrokerage", that);
                this.brokeragePushData(page1, that, url)
            }
        }
        if (that.data.currentTab == 1) {
            if (that.data.record_next_page) {
                page2++;
                let url = 'app.php?c=drp_ucenter&a=withdrawal_list&page=' + page2;
                // common.post(url, '', "getRecord", that);
                this.recordPushData(page2, that, url)
            }
        }
    },

    //页面上滑到底部追加数据---佣金明细
    brokeragePushData: function (page, that, url) {
        // console.log(url)
        // console.log(that.data)
        common.post(url, '', setPushData, '');

        function setPushData(result) { //添加数据
            let list = result.err_msg.financial_record_list;
            for (let i = 0; i < list.length; i++) {
                list[i].add_time = publicFun.dataCode(list[i].add_time * 1000, 'year');
            }
            result.err_msg.financial_record_list = list;
            that.data.brokerageData.financial_record_list = that.data.brokerageData.financial_record_list.concat(result.err_msg.financial_record_list);
            that.setData({
                'brokerageData.financial_record_list': that.data.brokerageData.financial_record_list,
                'brokerage_next_page': result.err_msg.next_page
            });
            console.log(that.data.brokerageData.financial_record_list)
        }
    },
    //页面上滑到底部追加数据---提现记录
    recordPushData: function (page, that, url) {
        if (that.data.recordData.next_page == false) {
            return
        }
        common.post(url, '', setPushData, '');

        function setPushData(result) { //添加数据
            that.data.recordData.store_withdrawal_list = that.data.recordData.store_withdrawal_list.concat(result.err_msg.store_withdrawal_list)
            that.setData({
                'recordData.store_withdrawal_list': that.data.recordData.store_withdrawal_list,
                'record_next_page': result.err_msg.next_page
            });
        }
    },

    //滚动函数
    scroll: function (event) {
        this.setData({
            scrollTop: event.detail.scrollTop
        });
    },




   

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

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