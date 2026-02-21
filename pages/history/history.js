// history.js - 历史记录页
Page({
  data: {
    records: [],
    totalDays: 0,
    consecutiveDays: 0,
    totalMinutes: 0,
    achievements: []
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  // 加载记录
  loadRecords() {
    const records = wx.getStorageSync('checkInRecords') || [];

    // 按日期倒序排列
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 计算统计数据
    const totalDays = records.length;
    const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
    const consecutiveDays = this.calculateConsecutiveDays(records);

    // 计算成就
    const achievements = this.getAchievements(consecutiveDays);

    this.setData({
      records,
      totalDays,
      totalMinutes,
      consecutiveDays,
      achievements
    });
  },

  // 计算连续天数
  calculateConsecutiveDays(records) {
    if (records.length === 0) return 0;

    const dates = records.map(r => r.date).sort();
    const today = this.formatDate(new Date());

    // 如果今天没打卡，连续天数为0
    if (dates[dates.length - 1] !== today) {
      return 0;
    }

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

  // 获取成就
  getAchievements(consecutiveDays) {
    const achievements = [];

    if (consecutiveDays >= 3) {
      achievements.push('😊 连续3天');
    }
    if (consecutiveDays >= 7) {
      achievements.push('🌺 坚持一周');
    }
    if (consecutiveDays >= 15) {
      achievements.push('🏅 半月达人');
    }
    if (consecutiveDays >= 30) {
      achievements.push('🎖️ 月度冠军');
    }

    return achievements;
  },

  // 查看详情
  viewDetail(e) {
    const record = e.currentTarget.dataset.record;

    // 显示详情弹窗
    let content = `类型：${record.type}\n`;
    content += `时长：${record.duration}分钟\n`;
    content += `内容：${record.content}\n`;
    if (record.teacherComment) {
      content += `老师评价：${record.teacherComment}`;
    }

    wx.showModal({
      title: record.date,
      content: content,
      showCancel: false,
      confirmText: '知道了'
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
