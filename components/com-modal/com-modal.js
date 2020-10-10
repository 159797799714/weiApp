Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  data: {
    show: false
  },
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    className: {
      type: String,
      value: ""
    },
    width: {
      type: String,
      value: 560
    },
    background: {
      type: String,
      value: ""
    },
    padding: {
      type: String,
      value: "30rpx"
    },
    radius: {
      type: String,
      value: 4
    },
    topImageSize: {
      type: String,
      value: "md"
    },
    showClosebtn: {
      type: Boolean,
      value: false
    },
    closeType: {
      type: String,
      value: '0'
    },
    isMaskClose: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    onModalClose: function onModalClose(e) {   //点击x按钮关闭弹框
      let { close } = e.currentTarget.dataset;
      this.setData({ show: close ? false : true });
    },
    ammodeFun: function onModalClose() {

    },
    preventTouchMove() {   //阻止蒙层下面的页面滚动
    },
  }
})