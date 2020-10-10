import APIHOST from './LOCK'
import API from "./api"

const http = (url, params, isLoading, method, query, callback) => {
  url = APIHOST + url;
  let contentType = "application/x-www-form-urlencoded";
  let token = wx.getStorageSync('token_cps') || "";
  
  if (method == 'POST'){
    contentType = 'application/json;charset=UTF-8';
    params = JSON.stringify(params);
  }

  if (query){  //参数以  xxxx/:xxx 形式跟在路径后面
    url += query;
  }

  if (isLoading){
    wx.showLoading({ title: '加载中...', mask: true });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      header: {
        'Content-Type': contentType,
        Authorization: `Bearer ${token}`
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

const post = (url, params={}, isLoading = false, query, callback) => {
  return http(API[url], params, isLoading, 'POST', query, callback);
}

const get = (url, params={}, isLoading = false, query, callback) => {
  return http(API[url], params, isLoading, 'GET', query, callback);
}

module.exports = { post, get }