// checkin.js - 打卡详情页
Page({
  data: {
    types: ['练琴', '运动', '跳舞', '其他'],
    selectedType: '',
    customType: '',
    images: [],
    duration: '',
    content: '',
    reflection: '',
    suggestions: [],
    showSuggestions: false
  },

  onLoad() {
    const records = wx.getStorageSync('checkInRecords') || [];
    const allTypes = [...new Set(records.map(r => r.type))];
    this.setData({ allHistoryTypes: allTypes });
  },

  // 选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedType: type,
      customType: type === '其他' ? this.data.customType : ''
    });
  },

  // 输入自定义类型
  onCustomTypeInput(e) {
    const input = e.detail.value;
    const allTypes = this.data.allHistoryTypes || [];

    if (input.trim()) {
      const suggestions = allTypes.filter(type => type.includes(input));
      this.setData({
        customType: input,
        selectedType: '',
        suggestions,
        showSuggestions: suggestions.length > 0
      });
    } else {
      this.setData({
        customType: input,
        selectedType: '',
        suggestions: [],
        showSuggestions: false
      });
    }
  },

  // 选择建议
  selectSuggestion(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      customType: type,
      selectedType: '',
      showSuggestions: false
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...this.data.images, ...tempFiles]
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 输入时长
  onDurationInput(e) {
    this.setData({
      duration: e.detail.value
    });
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 输入心得体会
  onReflectionInput(e) {
    this.setData({
      reflection: e.detail.value
    });
  },

  // 提交打卡
  submitCheckin() {
    const { selectedType, customType, images, duration, content, reflection } = this.data;

    // 确定最终类型
    const finalType = customType.trim() || selectedType;

    // 验证必填项
    if (!finalType) {
      wx.showToast({
        title: '请选择或输入打卡类型',
        icon: 'none'
      });
      return;
    }

    if (!duration || duration <= 0) {
      wx.showToast({
        title: '请输入有效的时长',
        icon: 'none'
      });
      return;
    }

    // 保存打卡记录
    const today = this.formatDate(new Date());
    const records = wx.getStorageSync('checkInRecords') || [];

    const newRecord = {
      id: Date.now().toString(),
      date: today,
      type: finalType,
      duration: parseInt(duration),
      content: content.trim(),
      media: images,
      reflection: reflection.trim(),
      timestamp: Date.now()
    };

    records.push(newRecord);
    wx.setStorageSync('checkInRecords', records);

    // 检查是否达到里程碑
    this.checkAchievements(records);

    // 返回首页
    wx.showToast({
      title: '打卡成功！',
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 2000);
      }
    });
  },

  // 检查成就
  checkAchievements(records) {
    const consecutive = this.calculateConsecutiveDays(records);

    if (consecutive === 3) {
      this.showAchievement('😊', '太棒了！连续3天打卡，继续加油！');
    } else if (consecutive === 7) {
      this.showAchievement('🌺', '坚持一周啦！你真棒！');
    } else if (consecutive === 15) {
      this.showAchievement('🏅', '半个月的坚持，你已经超越了90%的人！');
    }
  },

  // 计算连续天数
  calculateConsecutiveDays(records) {
    if (records.length === 0) return 0;

    const dates = records.map(r => r.date).sort();
    let consecutive = 1;

    for (let i = dates.length - 1; i > 0; i--) {
      const current = new Date(dates[i]);
      const previous = new Date(dates[i - 1]);
      const diffDays = Math.floor((current - previous) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  },

  // 显示成就弹窗
  showAchievement(emoji, message) {
    wx.showModal({
      title: emoji,
      content: message,
      showCancel: false,
      confirmText: '继续努力'
    });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
})
