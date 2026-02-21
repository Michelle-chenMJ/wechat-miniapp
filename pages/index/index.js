// index.js - 首页
Page({
  data: {
    todayDate: '',
    todayChecked: false,
    consecutiveDays: 0,
    maxDays: 0,
    totalDays: 0,
    weeklyHours: 0,
    currentMonth: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    currentYear: 0,
    currentMonthNum: 0,
    selectedType: '全部',
    types: ['全部']
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    this.initData();
  },

  // 初始化数据
  initData() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    this.setData({
      todayDate: `${year}年${month}月${day}日`,
      currentYear: year,
      currentMonthNum: month,
      currentMonth: `${year}年${month}月`
    });

    this.loadCheckInData();
    this.generateCalendar(year, month);
  },

  // 加载打卡数据
  loadCheckInData() {
    const records = wx.getStorageSync('checkInRecords') || [];
    const today = this.formatDate(new Date());

    // 自动提取所有打卡类型
    const allTypes = [...new Set(records.map(r => r.type))];
    const types = ['全部', ...allTypes];

    // 根据选择的类型筛选记录
    const filteredRecords = this.data.selectedType === '全部'
      ? records
      : records.filter(r => r.type === this.data.selectedType);

    // 检查今天是否已打卡
    const todayChecked = records.some(record => record.date === today);

    // 计算统计数据
    const stats = this.calculateStats(filteredRecords);
    const weeklyHours = this.calculateWeeklyHours(filteredRecords);

    this.setData({
      types,
      todayChecked,
      consecutiveDays: stats.consecutive,
      maxDays: stats.max,
      totalDays: stats.total,
      weeklyHours
    });
  },

  // 选择类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedType: type
    });
    this.loadCheckInData();
  },

  // 计算统计数据
  calculateStats(records) {
    if (records.length === 0) {
      return { consecutive: 0, max: 0, total: 0 };
    }

    // 获取所有打卡日期（去重）
    const uniqueDates = [...new Set(records.map(r => r.date))].sort();
    const today = this.formatDate(new Date());

    let consecutive = 0;
    let max = 0;
    let current = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current++;
      } else {
        if (current > max) max = current;
        current = 1;
      }
    }

    if (current > max) max = current;
    consecutive = uniqueDates[uniqueDates.length - 1] === today ? current : 0;

    return { consecutive, max, total: uniqueDates.length };
  },

  // 计算本周总时长（小时）
  calculateWeeklyHours(records) {
    if (records.length === 0) {
      return 0;
    }

    // 获取本周的开始和结束日期（周一到周日）
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0是周日，1是周一
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 计算到周一的偏移

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // 筛选本周的记录并累加时长
    let totalMinutes = 0;
    records.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= monday && recordDate <= sunday) {
        totalMinutes += record.duration || 0;
      }
    });

    // 转换为小时，保留一位小数
    return (totalMinutes / 60).toFixed(1);
  },

  // 生成日历
  generateCalendar(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const records = wx.getStorageSync('checkInRecords') || [];
    const checkedDates = records.map(r => r.date);
    const today = this.formatDate(new Date());

    const calendarDays = [];

    // 填充空白
    for (let i = 0; i < startWeekday; i++) {
      calendarDays.push({ day: '', checked: false, isToday: false });
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarDays.push({
        day,
        checked: checkedDates.includes(dateStr),
        isToday: dateStr === today
      });
    }

    this.setData({ calendarDays });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 上一月
  prevMonth() {
    let { currentYear, currentMonthNum } = this.data;
    currentMonthNum--;
    if (currentMonthNum < 1) {
      currentMonthNum = 12;
      currentYear--;
    }
    this.setData({
      currentYear,
      currentMonthNum,
      currentMonth: `${currentYear}年${currentMonthNum}月`
    });
    this.generateCalendar(currentYear, currentMonthNum);
  },

  // 下一月
  nextMonth() {
    let { currentYear, currentMonthNum } = this.data;
    currentMonthNum++;
    if (currentMonthNum > 12) {
      currentMonthNum = 1;
      currentYear++;
    }
    this.setData({
      currentYear,
      currentMonthNum,
      currentMonth: `${currentYear}年${currentMonthNum}月`
    });
    this.generateCalendar(currentYear, currentMonthNum);
  },

  // 跳转到打卡页面
  goToCheckin() {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    });
  },

  // 清空数据
  clearData() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有打卡数据吗？此操作不可恢复。',
      confirmText: '确定清空',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('checkInRecords', []);
          this.initData();
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 管理类型
  manageTypes() {
    const records = wx.getStorageSync('checkInRecords') || [];
    const allTypes = [...new Set(records.map(r => r.type))];

    if (allTypes.length === 0) {
      wx.showToast({
        title: '暂无打卡类型',
        icon: 'none'
      });
      return;
    }

    // 计算每个类型的打卡次数
    const typeCounts = {};
    records.forEach(r => {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    const typeList = allTypes.map(type => `${type} (${typeCounts[type]}次)`);

    wx.showActionSheet({
      itemList: typeList,
      success: (res) => {
        const selectedType = allTypes[res.tapIndex];
        this.showTypeOptions(selectedType);
      }
    });
  },

  // 显示类型操作选项
  showTypeOptions(type) {
    wx.showActionSheet({
      itemList: ['重命名', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.renameType(type);
        } else if (res.tapIndex === 1) {
          this.deleteType(type);
        }
      }
    });
  },

  // 重命名类型
  renameType(oldType) {
    wx.showModal({
      title: '重命名类型',
      content: `当前类型：${oldType}`,
      editable: true,
      placeholderText: '输入新名称',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const newType = res.content.trim();
          const records = wx.getStorageSync('checkInRecords') || [];

          records.forEach(record => {
            if (record.type === oldType) {
              record.type = newType;
            }
          });

          wx.setStorageSync('checkInRecords', records);
          this.loadCheckInData();
          wx.showToast({
            title: '重命名成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除类型
  deleteType(type) {
    const records = wx.getStorageSync('checkInRecords') || [];
    const count = records.filter(r => r.type === type).length;

    wx.showModal({
      title: '确认删除',
      content: `删除"${type}"将同时删除${count}条打卡记录，此操作不可恢复。`,
      confirmText: '确定删除',
      confirmColor: '#FF3B30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const newRecords = records.filter(r => r.type !== type);
          wx.setStorageSync('checkInRecords', newRecords);
          this.initData();
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
})
