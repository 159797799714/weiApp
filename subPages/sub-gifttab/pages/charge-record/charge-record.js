import http_cps from "../../../../utils/http_cps"
// import moment from "../../../../utils/moment.min"
Page({
    data: {
        page: 1,
        pageSize: 15,
        chargeList: [],
        oldList: []
    },
    onLoad: function (options) {
        //Do some initialize when page load.
        // console.log(wx.$moment(1599726805000).format("YYYY年MM月"));
        this.getChargeList()
    },
    onReady: function () {
        //Do some when page ready.

    },
    onShow: function () {
        //Do some when page show.

    },
    onHide: function () {
        //Do some when page hide.

    },
    onUnload: function () {
        //Do some when page unload.

    },
    onPullDownRefresh: function () {
        //Do some when page pull down.
        this.setData({
            page: 1,
        });
        this.getChargeList('refresh')
    },
    onReachBottom() { //上拉加载更多
        let {
            oldList,
            page,
            pageSize
        } = this.data;
        let len = oldList.length;
        if (len < pageSize || len % pageSize != 0) return;
        page++;
        this.setData({
            page
        });
        // this.getListData();
        this.getChargeList()
    },
    // 时间戳传换成'YYYY-MM'的格式
    excTime(t) {
        return wx.$moment(t * 1000).format("YYYY-MM")
    },
    getChargeList(type) {
        let me = this
        let {
            page,
            pageSize
        } = this.data
        let params = {
            page,
            page_size: pageSize,
        }
        let isloading = type || page > 1 ? true : false; //下拉刷新 和 加载更多的时候展
        http_cps.get('charge_points', params, isloading).then(res => {
            if (type) {
                this.setData({
                    chargeList: [],
                    oldList: []
                })
                if (type == 'refresh') wx.stopPullDownRefresh();
            }
            if (!res.data || !res.data.length) {
                if (page > 1) { //将页数减1，回到上拉之前的值
                    page--;
                    me.setData({
                        page
                    });
                    wx.showToast({
                        title: "没有更多数据了",
                        icon: "none"
                    });
                } else {
                    me.setData({
                        chargeList: []
                    });
                }
                return;
            }
            let newArr = [],
                _list = res.data
            _list.forEach((item, i) => {
                let index = -1;
                let isExists = newArr.some((newItem, j) => {
                    if (me.excTime(item.createtime) == me.excTime(newItem.createtime)) {
                        index = j;
                        return true;
                    }
                })
                if (!isExists) {
                    newArr.push({
                        createtime: item.createtime,
                        // timeDay: item.timeDay,
                        // timeMonth: item.timeMonth,
                        subList: [item]
                    })
                } else {
                    newArr[index].subList.push(item);
                }
            })
            let {
                chargeList
            } = me.data
            if (page == 1) {
                me.setData({
                    chargeList: newArr
                })
            } else {
                for (let i in newArr) {
                    if (me.excTime(newArr[i].createtime) == me.excTime(chargeList[chargeList.length - 1].createtime)) {
                        chargeList[chargeList.length - 1].subList = chargeList[chargeList.length - 1].subList.concat(newArr[i].subList);
                    } else {
                        chargeList.push(newArr[i]); //数组追加
                    }
                }
                me.setData({
                    chargeList
                })
            }

            // 原生的数组
            let oldArr = [],
                {
                    oldList
                } = me.data
            oldArr = oldList ? oldList.concat(res.data) : [].concat(res.data);
            me.setData({
                oldList: oldArr
            });
        })
    }
})