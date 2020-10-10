import { money, returnMoneyImg } from '../../utils/util'

Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  data: {
    numImg: []
  },
  properties: {
    classStr: {
      type: String,
      value: ""
    },
    num: {  //分
      type: Number,
      value: 0.01
    },
    sym: {   // 单位符号
      type: String,
      value: '¥'
    },
    tailNum: {
      type: Number,
      value: 0
    },
    isTailInt: {   //是否没有小数的返回整数
      type: Boolean,
      value: false
    },
    unit: {
      type: String,
      value: '元'
    },
    color: {
      type: String,
      value: '#ffffff'
    },
    fontSize: {
      type: String,
      value: '34'
    },
    pointFontSize: {
      type: String,
      value: '6'
    }
  },
  ready() {
    this.handleMoney();
  },
  methods: {
    handleMoney() {
      let { num, unit, tailNum, isTailInt } = this.properties;
      let m = unit == '元' ? num : money(num, 2);
      let moneyStr = ''
      let numImg = []
      let mStr = (m).toString()

      if (isTailInt) {
        if (mStr.indexOf('.') > -1) {
          moneyStr = tailNum == 0 ? m : (m).toFixed(tailNum)
          numImg = returnMoneyImg(moneyStr)
        } else {
          numImg = returnMoneyImg(m)
        }
      } else {
        moneyStr = tailNum == 0 ? m : (m).toFixed(tailNum)
        numImg = returnMoneyImg(moneyStr)
      }

      this.setData({
        numImg
      })
    }
  }
})