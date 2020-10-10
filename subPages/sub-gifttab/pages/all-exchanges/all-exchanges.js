// import fake from "../../../../utils/fake_data";
import http_cps from "../../../../utils/http_cps";
Page({
    data: {
        excDataList: null,
        type: 1,
        ids: "",
        page: 1,
        pageSize: 20,
        banners: [],
        bannerIndex: 0, //页面banner
    },
    onLoad: function (options) { //页面加载完成

        if (options.ids) {
            let {
                ids,
                title
            } = options
            this.setData({
                ids,
            })
            wx.setNavigationBarTitle({
                title,

            })
        } else {
            let {
                type,
            } = options
            wx.setNavigationBarTitle({
                title: type == 1 ? "积分兑好礼" : "人气周边"
            })
            this.setData({
                type,
                banners: JSON.parse(decodeURIComponent(options.banners))
            })
        }

        this.getExcList()
    },
    onReady: function () { //页面初次渲染完成

    },
    onShow: function () { //监听页面显示
    },
    onHide: function () { //监听页面隐藏

    },
    onPullDownRefresh() { //下拉刷新
        this.setData({
            page: 1,
        });
        this.getExcList('refresh');
    },
    onReachBottom() { //上拉加载更多
        let {
            excDataList,
            page,
            pageSize
        } = this.data;
        let len = excDataList.length;
        if (len < pageSize || len % pageSize != 0) return;
        page++;
        this.setData({
            page
        });
        this.getExcList();
    },
    swiperChange(e) { //轮播图swiper切换时触发
        let {
            current
        } = e.detail;
        let {
            type
        } = e.currentTarget.dataset;
        // if (type == 'activeTab') type = 'tabsData.activeTab';
        this.setData({
            [type]: current
        });
    },
    getExcList(cur) {
        let {
            page,
            pageSize,
            type,
            ids
        } = this.data
        let params = {
            page,
            type,
            page_size: pageSize,
            ids
        }
        if (!params.ids) {
            delete params.ids
        } else {
            delete params.type
        } //如果ids为空就删除此参数
        let isLoading = page > 1 ? true : false
        http_cps.get('point_goods_cps', params, isLoading).then(res => {
            let newList = res.data
            if (cur == 'refresh') {
                wx.stopPullDownRefresh();
                this.setData({
                    excDataList: []
                });
            }
            if (!newList || !newList.length) {
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
                        excDataList: []
                    });
                }
                return;
            }
            let {
                excDataList
            } = this.data, newArr = [];
            newArr = excDataList ? excDataList.concat(newList) : [].concat(newList);
            this.setData({
                excDataList: newArr
            });

        }).catch(res => {
            wx.showToast({
                title: res.msg,
                icon: 'none'
            });
        })
    }
})