
// let LOCK = "test";   //测试环境

let LOCK = "prod";    //正式环境


let APIHOST = '' 
if (LOCK === 'test') {  // 测试环境
  APIHOST = 'https://test-shop-cps.mambike.com/api.php/apis/'
}

if (LOCK === 'prod') {   // 正式环境
  APIHOST = 'https://shop-cps.mambike.com/api.php/apis/'
}

module.exports = APIHOST;
