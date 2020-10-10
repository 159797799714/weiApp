function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

var debounce = function (func, wait, immediate) {
  // immediate默认为false
  var timeout, args, context, timestamp, result;
  var later = function () {
    // 当wait指定的时间间隔期间多次调用_.debounce返回的函数，则会不断更新timestamp的值，导致last < wait && last >= 0一直为true，从而不断启动新的计时器延时执行func
    var last = _.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function () {
    context = this;
    args = arguments;
    timestamp = _.now();
    // 第一次调用该方法时，且immediate为true，则调用func函数
    var callNow = immediate && !timeout;
    // 在wait指定的时间间隔内首次调用该方法，则启动计时器定时调用func函数
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

/**
 * px转rpx
 * @param {*number} arg1 传入px数值
 */
function toRpx(px) {
  // let { screenWidth } = wx.getSystemInfoSync();
  // let factor = screenWidth / 750;
  // return px ?( px / factor) : 0;

  let dpr = getApp().globalData.dpr || 2;
  return px ? (px * dpr) : 0;
}


/**
 * rpx转px
 * @param {*number} arg1 传入rpx数值
 */
function toPx(rpx) {
  // let { screenWidth } = wx.getSystemInfoSync();
  // let factor = screenWidth / 750;
  // return rpx ? (rpx * factor) : 0;

  let dpr = getApp().globalData.dpr || 2;
  return rpx ? (rpx / dpr) : 0;
}

/**
 * 数字格式化
 * @param {*val} //传入的数字
 * @param {keepPoint} 保留几位小数
 * @param {*returnStatus} // 是否只返回单位 0 默认状态数字+单位 1 格式化后的数字 2 格式化后的单位
 */
function handleNum(val, keepPoint, returnStatus) {
  switch (returnStatus) {
    case 0:
      if (val < 10000 && val > 0) return val;
      if (val >= 10000 && val < 100000000) {
        return ((val / 10000).toFixed(keepPoint) - 0) + "万";
      }
      if (val >= 100000000) {
        return ((val / 100000000).toFixed(keepPoint) - 0) + "亿";
      }
      break;
    case 1:
      if (val < 10000 && val > 0) return val;
      if (val >= 10000 && val < 100000000) {
        return ((val / 10000).toFixed(keepPoint) - 0);
      }
      if (val >= 100000000) {
        return ((val / 100000000).toFixed(keepPoint) - 0);
      }
      break;
    case 2:
      if (val < 10000 && val > 0 || val === '0') return "";
      if (val >= 10000 && val < 100000000) {
        return "万";
      }
      if (val >= 100000000) {
        return "亿";
      }
      break;
    default:
      break;
  }
}
/**
 * 分割小数点前后的数字
 * @param num 处理数据
 * @param decimal 处理数据保留小数点后几位
 */
function formatDecimal(num, decimal) {
  num = num.toString()
  let index = num.indexOf('.')
  if (index !== -1) {
    num = num.substring(0, decimal + index + 1)
  } else {
    num = num.substring(0)
  }
  return parseFloat(num).toFixed(decimal)
}
/**
 * 分割小数点前后的数字
 * @param val 处理数据
 * @param keepPoint 处理数据保留小数点后几位
 * @param selectVal 截取小数点前0,截取小数点后1
 * @param isMaxlength 是否返回数字位数 0不需要,1需要
 * 
 */
function divideNum(val, keepPoint = 0, selectVal = 0, isMaxlength = 0) {
  if (val < 10000 && val >= 0) return isMaxlength ? ('' + val).length : +val
  if (val >= 10000 && val < 100000000) {
    // var decimals = (val / 10000).toFixed(keepPoint)
    // var decimals = (val / 10000) + ''
    // decimals = decimals.substring(0, decimals.lastIndexOf('.') + keepPoint + 1)
    // var a = val / 10000
    // var decimals = (parseInt(a * 100) / 100).toFixed(2);
    var decimals = formatDecimal(val / 10000, keepPoint)
    console.log('decimals', decimals);
  }
  if (val >= 100000000) {
    // var decimals = (val / 100000000).toFixed(keepPoint)
    // var decimals = (val / 100000000) + ''
    // decimals = decimals.substring(0, decimals.lastIndexOf('.') + keepPoint + 1)
    // var a = val / 100000000
    // var decimals = (parseInt(a * 100) / 100).toFixed(2);
    var decimals = formatDecimal(val / 100000000, keepPoint)
  }
  var arr = decimals.split('.')
  return isMaxlength ? arr[selectVal].length : arr[selectVal]
}


/**
 * @export
 * @param {any} money 分
 * @param {any} num 几位小数
 * @param {any} bool 是否启用fixed四舍五入处理
 * @returns
 */
export function money(money, num, bool) {
  num = num || 0
  money = parseInt(money)

  money = money > 100 ? (parseInt(money) * 1000000 / 100000000) : parseInt(money) * 1000000 / 100000000

  return !bool ? parseFloat(money) : parseFloat(money).toFixed(num)
}


/**
 * 特殊字符的数字展示--通过iconfont图标拼接
 * @export
 * @param {any} num 金额数字
 * @return iconfont图标
 * 
 */
function returnMoneyImg(num) {
  let arr = (num).toString().split('');
  const imgArr = {
    0: 'icon-num-0',
    1: 'icon-num-1',
    2: 'icon-num-2',
    3: 'icon-num-3',
    4: 'icon-num-4',
    5: 'icon-num-5',
    6: 'icon-num-6',
    7: 'icon-num-7',
    8: 'icon-num-8',
    9: 'icon-num-9',
    10: 'icon-num-dot',
    11: 'icon-num-com'
  }

  let imgMoney = [];
  arr.map(item => {
    if (item == '.') {
      imgMoney.push(imgArr[10])
    } else if (item == ',') {
      imgMoney.push(imgArr[11])
    } else {
      imgMoney.push(imgArr[item])
    }
  })

  return imgMoney;
}

module.exports = {
  formatTime: formatTime,
  debounce: debounce,
  toRpx: toRpx,
  toPx: toPx,
  handleNum: handleNum,
  divideNum: divideNum,
  returnMoneyImg: returnMoneyImg,
  money: money
}