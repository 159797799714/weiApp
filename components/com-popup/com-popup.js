Component({
  data: {
    
  },
  properties: {
    className: {
      type: String,
      value: ''
    },
    show: {
      type: Boolean,
      value: false
    },
    position: {
      type: String,
      value: 'bottom'
    },
    mask: {
      type: Boolean,
      value: true
    },
    animation: {
      type: Boolean,
      value: true
    },
    disableScroll: {
      type: Boolean,
      value: true
    }
  },
  methods: {
    onMaskTap: function onMaskTap() {
      var { animation } = this.properties;
      if (animation) {
        this.triggerEvent('onClose');
      } else {
        setTimeout(() => {
          this.triggerEvent('onClose');
        }, 200);
      }
    }
  }
});