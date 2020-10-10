const API = {
  sendSMS: 'proxy.php?c=route&a=sendSMS', //获取手机验证码
  checkInvitationInfo: 'proxy.php?c=route&a=agentMember_checkInvitationInfo', //验证邀请信息 根据邀请码获取邀请人信息
  registerMember: 'proxy.php?c=route&a=agentMember_registerMember', //会员注册
  goodsReward: 'proxy.php?c=route&a=agent_api_goods_reward', //商品详情页返回购买或分享商品可获权益接口
  queryGoodType: 'proxy.php?c=route&a=agent_api_goods_queryGoodType', //查询商品类型
  shareRecord: 'proxy.php?c=route&a=agent_api_good_shareRecord', //记录分享商品的绑定关系

  //会员相关
  getMemberBasicInfo: 'proxy.php?c=route&a=agentMember_getMemberBasicInfo', //获取当前用户的邀请码
  getMemberInfo: 'proxy.php?c=route&a=agentMember_getMemberInfo', //获取会员信息接口
  getMemberRewards: 'proxy.php?c=route&a=agentMember_getMemberRewards', //会员权益界面
  getGiftLists: 'proxy.php?c=route&a=agent_api_goods_getGiftLists', //当前礼包商品接口

  //vip(积分)相关
  getVipRecord: 'proxy.php?c=route&a=agentMember_getVipRecord', //专属vip记录
  selectPointStatistics: 'proxy.php?c=route&a=pigcmsPiontsRecord_selectPointStatistics', //积分统计明细
  queryPointsRecordBySource: 'proxy.php?c=route&a=pigcmsPiontsRecord_queryPointsRecordBySource', //历史记录明细
  queryPointsApplyList: 'proxy.php?c=route&a=pigcmsPiontsApply_queryPointsApplyList', //申请中兑换记录
  applyPointsExchange: 'proxy.php?c=route&a=pigcmsPiontsApply_applyPointsExchange', //积分兑换申请
  getBanks: 'proxy.php?c=route&a=getBanks', //获取发卡银行列表

  //直播相关
  liveList: 'proxy.php?c=route&a=liveList', //直播/回放/未开播列表
  updateLive: 'proxy.php?c=route&a=updateLive', //更新直播数据

  //cps版本相关接口
  get_token: 'get_token', //获取token
  cats_cps: 'cats', //获取首页类目
  banners_cps: 'banners', //获取首页 banner接口
  channels_cps: 'channels', //获取首页频道列表
  channel_detail_cps: 'channel_detail', //获取首页频道小程序推广跳转链接
  channel_goods_cps: 'channel_goods', //获取根据首页频道获取商品列表
  theme_goods_cps: 'theme/goods', //根据首页banner获取商品列表
  goods_search_cps: 'goods/search', //获取商品筛选列表
  goods_detail_cps: 'goods/detail', //获取商品详情信息
  goods_url_cps: 'goods/url', //获取商品小程序推广链接
  balance_info_cps: 'user/balance/info', //获取用户账户信息
  withdraw_cps: 'user/withdraw', //用户提现
  cashflow_cps: 'user/cashflow', //用户提现记录
  img_download_cps: 'img/download', //代理下载远程图片 通过wx.downloadFile将网络图片转换成本地图片
  orders_list_cps: 'orders', //获取订单列表
  orders_detail_cps: 'order', //获取订单详情
  orders_read_count: 'orders/read_count', //获取未读订单统计
  share_media_cps: 'share/media', //分享素材列表
  gift_index_cps: 'gift/index', //获取积分任务首页数据
  do_sign_cps: 'sign/do_sign', //进行签到操作
  do_task_cps: 'task/do_task', //完成新手任务接口
  point_orders_cps: 'point/orders', //兑换订单列表
  point_change_index_cps: 'point/change_index', //兑换首页商品
  point_goods_cps: 'point/goods', //兑换产品列表
  point_goods_id_cps: 'point/goods', //兑换产品详情
  point_exchange_goods_cps: 'point/exchange_goods', //兑换产品
  task_do_task_cps: 'task/do_task', //任务助手  改变任务状态
  task_finish_task_cps: 'task/finish_task', //cps-积分模块任务标识完成接口  改变分享者的任务状态
  notice_cps: '/notice', //公告获取接口
  sign_double_cps: "/sign/sign_double", //进行签到领取额外奖励
  charge_points: 'charge_points', //猛犸充电积分列表
  charge_share_points: 'charge_share_points', //邀请好友获取积分列表
  invite_points_inc: 'invite_points_inc', //用户分享最近新增积分
  charge_points_inc: "charge_points_inc", //猛犸充电用户最近新增积分
  history_points_inc: "history_points_inc", //猛犸充电用户最近新增积分
}

module.exports = API;