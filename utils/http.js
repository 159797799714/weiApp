import common from "./common"
import API from "./api"

const http = (url, params, isLoading, method, callback) => {
  let ticket = wx.getStorageSync('ticket') || "";
  let contentType = "application/x-www-form-urlencoded";
  url = common.Url + url + '&store_id=' + common.store_id + '&request_from=wxapp&wx_type=' + common.types + '&wxapp_ticket=' + ticket;
  
  if (method == 'POST'){
    contentType = 'application/json;charset=UTF-8';
    params = JSON.stringify(params);
  }

  if (isLoading){
    wx.showLoading({ title: '加载中...', mask: true });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      header: {
        'Content-Type': contentType
      },
      data: params,
      success: function (res) {
        if (isLoading) wx.hideLoading();
        let { code } = res.data;

        if (code == 401){   //token过期  设置unlogin
          wx.setStorageSync('unlogin', true);
          callback&&callback(1);
          return;
        }

        code == 0 ? resolve(res.data) : reject(res.data);
      },
      fail: function (res) {
        if (isLoading) wx.hideLoading();
        reject(res.data);
      }
    })
  })
}

const post = (url, params={}, isLoading = false, callback) => {
  return http(API[url], params, isLoading, 'POST', callback);
}

const get = (url, params={}, isLoading = false, callback) => {
  return http(API[url], params, isLoading, 'GET', callback);
}

module.exports = { post, get }