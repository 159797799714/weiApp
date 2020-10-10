var common = require('../../../utils/common.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    noticeContent:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
      this.getNoticeContent(options.noticeId);
    
    
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
  getNoticeContent(id){
    let url = 'app.php?c=gift_fx&a=get_notice';
    if (!id) {
      url = 'app.php?c=gift_fx&a=get_rule';
    }
    let params = {
      id:id
    }
    let that = this;
    common.post(url,params,function(res){
      console.log('通告',res)
      if(res.err_code == 0){
        let content = res.err_msg.content ? res.err_msg.content:'';
        let titles = '';
        if (res.err_msg.gift_title){
          titles = res.err_msg.gift_title;
        }
        if(!id){
          titles = '规则说明';
          content = '<p>' + res.err_msg.rule_show+'<p>'
          content = content.replace(/\<p/g, '<p style="width:100%;height:auto;font-size:14px;line-height:20px;"');
        }
        that.setData({
          noticeContent: content.replace(/\<img/g,'<img style="width:100%;height:auto;display:block;margin 0 auto;"')
        })
        wx.setNavigationBarColor({
          frontColor: '#000000',
          backgroundColor: '#ffffff',
        })
        
        wx.setNavigationBarTitle({
          title: titles,
        })
      }
        
    },'')
  }
})