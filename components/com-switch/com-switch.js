Component({
  data: {
    
  },
  properties: {
    className: {
      type: String,
      value: ''
    },
    width: {
      type: String,
      value: '68'
    },
    height: {
      type: String,
      value: '38'
    },
    ischecked: {
      type: Boolean,
      value: false
    },
    color: {
      type: String,
      value: '#FF4444'
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    onChange: function onChange(e) {
      let { ischecked, disabled } = this.properties;
      if (disabled) return;   //禁止切换
      this.triggerEvent('onChange', { value: !ischecked });
    }
  }
});