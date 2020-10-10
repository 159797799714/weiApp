import http_cps from "../../../../utils/http_cps";
Page({
    data: {
        tabsData: {
            activeTab: 0,
            tabs: ['全部', '待发货', '已发货', '已完成']
        },
        showInstruction: false,
        recList: null,
        page: 1,
        pageSize: 10,
        status: 0
    },
    onLoad: function (options) { //页面加载完成
        this.getOrderRecord()
    },
    onReady: function () { //页面初次渲染完成

    },
    onShow: function () { //监听页面显示
    },
    onHide: function () { //监听页面隐藏

    },
    onPullDownRefresh() {    //下拉刷新
        this.setData({ page: 1, 'tabsData.activeTab': 0 });
        this.getOrderRecord('refresh');
      },
    onReachBottom() { //上拉加载更多
        let {
            recList,
            page,
            pageSize
        } = this.data;
        let len = recList.length;
        if (len < pageSize || len % pageSize != 0) return;
        page++;
        this.setData({
            page
        });
        this.getOrderRecord();
    },
    // 获取兑换订单列表
    getOrderRecord(cur) {
        let {
            page,
            pageSize,
            status
        } = this.data
        let params = {
            page,
            status,
            page_size: pageSize
        };
        let isLoading = page > 1 || cur ? true : false
        http_cps.get('point_orders_cps', params, isLoading).then(res => {
            let newRecList = res.data
            if (cur == 'refresh') wx.stopPullDownRefresh();
            if (cur == 'tabs' || cur == 'refresh') this.setData({
                recList: []
            });

            if (!newRecList || !newRecList.length) {
                if (page > 1) { //将页数减1，回到上拉之前的值
                    page--;
                    this.setData({
                        page
                    });
                    wx.showToast({
                        title: "没有更多数据了",
                        icon: "none"
                    });
                } else {
                    this.setData({
                        recList: []
                    });
                }
                return;
            }

            newRecList.forEach(item => {
                item.createtime = wx.$moment(item.createtime*1000).format('L');
            })

            let {
                recList
            } = this.data, newArr = [];
            newArr = recList ? recList.concat(newRecList) : [].concat(newRecList);
            this.setData({
                recList: newArr
            });
        }).catch(res => {
            if (cur == 'refresh') wx.stopPullDownRefresh();
            wx.showToast({
                title: res.msg,
                icon: 'none'
            });
        })
    },
    tabChange(e) { //切换tab
        let {
            index
        } = e.currentTarget.dataset;
        this.setData({
            'tabsData.activeTab': index,
            status: index,
            page: 1,
        });
        this.getOrderRecord('tabs');
    },
    toProDetail(e){ //点击进入商品详情
        let {item} = e.currentTarget.dataset
        wx.navigateTo({
            url: '/subPages/sub-gifttab/pages/exc-goods-detail/exc-goods-detail?exc_id='+item.goods_id,
        })
    }

})