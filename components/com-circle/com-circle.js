Component({
  data: {
    factor: ""
  },
  properties: {
    id: {
      type: String,
      value: "canvasId"
    },
    className: {
      type: String,
      value: ""
    },
    width: {
      type: String,
      value: 300
    },
    height: {
      type: String,
      value: 300
    },
    percent: {
      type: Number,
      value: 0
    },
    current: {
      type: Number,
      value: 0
    },
    total: {
      type: Number,
      value: 0
    },
    animTime: {
      type: Number,
      value: 1000
    },
    cicleWidth: {
      type: Number,
      value: 16
    },
    color: {
      type: String,
      value: "#ff5000"
    },
    cicleColor: {
      type: String,
      value: "#eee"
    },
    lineCap: {
      type: String,
      value: "butt"
    },
    fontSize: {    //传过来的是rpx
      type: Number,
      value: 60
    },
    fontColor: {    //字体颜色
      type: String,
      value: "#ffffff"
    }
  },
  ready() {
    const sysInfo = wx.getSystemInfoSync();
    const screenWidth = sysInfo.screenWidth;
    this.setData({ factor: screenWidth / 750 })   // 获取比例

    this.init();
  },
  methods: {
    init() {   //初始化
      const me = this;
      let { id, percent, animTime } = this.properties;
      let time = animTime / percent;    //单个百分比需要的执行时间

      wx.createSelectorQuery().in(this)
      .select('#' + id)
      .fields({ node: true, size: true })
      .exec(function (res) {
        let w = res[0].width / 2;   //获取canvas的宽度的一半，用于圆心x坐标
        let h = res[0].height / 2;  //获取canvas的高度的一半，用于圆心y坐标
        me.canvasTap(0, percent, time, w, h);
      })
    },
    canvasTap(start, end, time, w, h) {   //动画效果实现  start:起始百分比  end:结束百分比  w,h:圆心横纵坐标
      start++;
      this.run(start, end, w, h);
      if (start <= end){
        setTimeout(() => {
          this.canvasTap(start, end, time, w, h);
        }, time)
      }else {
        if (end != 0){
          this.triggerEvent('onPercentSuccess');  //绘制完成，通知父页面
        }
      }
    },
    run(start, end, w, h) {   //绘制圆形进度条方法
      let { id, cicleWidth, color, cicleColor, lineCap, fontSize, fontColor, current, total } = this.properties;
      const cx = wx.createCanvasContext(id, this);   //this: 表示在这个自定义组件下查找拥有 canvas-id 的 canvas 
      
      //先话圆环的背景
      cx.arc(w, h, w - (cicleWidth/2), -0.5 * Math.PI, 2 * Math.PI); //每个间隔绘制的弧度
      cx.setStrokeStyle(cicleColor);
      cx.setLineWidth(`${cicleWidth}`);
      cx.setLineCap("butt");
      cx.stroke();

      //画进度条
      let num = (2 * Math.PI / 100 * start) - 0.5 * Math.PI;
      cx.beginPath();
      cx.arc(w, h, w - (cicleWidth/2), -0.5 * Math.PI, num); //每个间隔绘制的弧度
      cx.setStrokeStyle(end == 0 ? '#fff' : color);
      cx.setLineWidth(`${cicleWidth}`);
      cx.setLineCap(lineCap);
      cx.stroke();
      cx.beginPath();
      cx.setFontSize(this.toPx(fontSize)); //注意不要加引号
      cx.setFillStyle(fontColor);
      cx.setTextAlign("center");
      cx.setTextBaseline("middle");
      cx.fillText((!total ? start + "%" : current + "/" + total), w, h);

      cx.draw();
    },
    toPx(rpx) { // 将页面传过来的rpx转px
      return rpx * this.data.factor;
    }
  }
})
