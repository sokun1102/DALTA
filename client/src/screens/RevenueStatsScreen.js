import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import { Svg, Rect, Circle, Path, Text as SvgText, G } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken, orderAPI } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 250;
const BAR_CHART_HEIGHT = 200;
const PIE_CHART_SIZE = 200;

export default function RevenueStatsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'start' or 'end'
  const [tempDate, setTempDate] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      checkUserRole();
      fetchStats();
    }, [])
  );

  useEffect(() => {
    // Chỉ fetch lại khi dates thay đổi sau lần đầu load
    if (stats !== null) {
      fetchStats();
    }
  }, [startDate, endDate]);

  const checkUserRole = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        if (userData.role !== "admin") {
          Alert.alert("Không có quyền", "Chỉ admin mới có thể xem thống kê doanh thu");
          navigation.goBack();
        }
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      navigation.goBack();
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Unauthorized");
      }

      setAuthToken(token);
      const response = await orderAPI.getRevenueStats(startDate || null, endDate || null);

      if (response.data && response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
      Alert.alert("Lỗi", "Không thể tải thống kê doanh thu");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openDatePicker = (type) => {
    setDatePickerType(type);
    if (type === "start") {
      setTempDate(startDate || formatDateForInput(new Date().toISOString()));
    } else {
      setTempDate(endDate || formatDateForInput(new Date().toISOString()));
    }
    setDatePickerVisible(true);
  };

  const validateDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleDateConfirm = () => {
    if (!validateDate(tempDate)) {
      Alert.alert("Lỗi", "Vui lòng nhập ngày theo định dạng YYYY-MM-DD (ví dụ: 2024-01-15)");
      return;
    }

    // Kiểm tra nếu chọn endDate phải sau startDate
    if (datePickerType === "end" && startDate && tempDate < startDate) {
      Alert.alert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    // Kiểm tra nếu chọn startDate phải trước endDate
    if (datePickerType === "start" && endDate && tempDate > endDate) {
      Alert.alert("Lỗi", "Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }

    if (datePickerType === "start") {
      setStartDate(tempDate);
    } else {
      setEndDate(tempDate);
    }
    setDatePickerVisible(false);
    setDatePickerType(null);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    // Stats sẽ được fetch lại tự động khi startDate/endDate thay đổi
  };

  const handleApplyFilter = () => {
    fetchStats();
  };

  // Render Bar Chart cho doanh thu theo tháng
  const renderMonthlyBarChart = (monthlyStats) => {
    if (!monthlyStats || monthlyStats.length === 0) return null;

    // Tính max revenue với padding 10%
    const maxRevenue = Math.max(
      ...monthlyStats.map(stat => Math.max(stat.successfulRevenue || 0, stat.failedRevenue || 0))
    );
    const maxRevenueWithPadding = maxRevenue * 1.1 || 1000000; // Add 10% padding
    
    const leftPadding = 50;
    const rightPadding = 20;
    const topPadding = 20;
    const bottomPadding = 40;
    const chartAreaWidth = CHART_WIDTH - leftPadding - rightPadding;
    const chartAreaHeight = BAR_CHART_HEIGHT - topPadding - bottomPadding;
    
    const barGroupWidth = chartAreaWidth / monthlyStats.length;
    const barWidth = (barGroupWidth * 0.7) / 2; // 70% of group width, divided by 2 for two bars
    const barGap = barGroupWidth * 0.1; // 10% gap between bars
    const groupGap = barGroupWidth * 0.2; // 20% gap between groups

    // Format currency for display
    const formatShortCurrency = (value) => {
      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}T`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    };

    return (
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={BAR_CHART_HEIGHT}>
          {/* Background grid */}
          <Rect
            x={leftPadding}
            y={topPadding}
            width={chartAreaWidth}
            height={chartAreaHeight}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="1"
          />

          {/* Y-axis grid lines and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const value = maxRevenueWithPadding * ratio;
            const y = topPadding + chartAreaHeight - (chartAreaHeight * ratio);
            return (
              <G key={idx}>
                {/* Grid line */}
                <Path
                  d={`M ${leftPadding} ${y} L ${CHART_WIDTH - rightPadding} ${y}`}
                  stroke="#2a2a2a"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.5"
                />
                {/* Y-axis label */}
                <SvgText
                  x={leftPadding - 8}
                  y={y + 4}
                  fontSize="11"
                  fill="#9ca3af"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {formatShortCurrency(value)}
                </SvgText>
              </G>
            );
          })}

          {/* Bars with gradients */}
          {monthlyStats.map((stat, index) => {
            const groupX = leftPadding + (index * barGroupWidth) + groupGap / 2;
            const successfulHeight = maxRevenueWithPadding > 0 
              ? Math.max((stat.successfulRevenue / maxRevenueWithPadding) * chartAreaHeight, 2)
              : 0;
            const failedHeight = maxRevenueWithPadding > 0 
              ? Math.max((stat.failedRevenue / maxRevenueWithPadding) * chartAreaHeight, 2)
              : 0;
            
            const successfulY = topPadding + chartAreaHeight - successfulHeight;
            const failedY = topPadding + chartAreaHeight - failedHeight;
            
            const successfulBarX = groupX;
            const failedBarX = groupX + barWidth + barGap;

            return (
              <G key={index}>
                {/* Successful Revenue Bar with gradient effect */}
                <Rect
                  x={successfulBarX}
                  y={successfulY}
                  width={barWidth}
                  height={successfulHeight}
                  fill="#10b981"
                  rx="6"
                  opacity="0.9"
                />
                {/* Gradient overlay for successful */}
                <Rect
                  x={successfulBarX}
                  y={successfulY}
                  width={barWidth}
                  height={Math.min(successfulHeight * 0.3, 20)}
                  fill="#34d399"
                  rx="6"
                  opacity="0.6"
                />
                
                {/* Failed Revenue Bar with gradient effect */}
                <Rect
                  x={failedBarX}
                  y={failedY}
                  width={barWidth}
                  height={failedHeight}
                  fill="#ef4444"
                  rx="6"
                  opacity="0.9"
                />
                {/* Gradient overlay for failed */}
                <Rect
                  x={failedBarX}
                  y={failedY}
                  width={barWidth}
                  height={Math.min(failedHeight * 0.3, 20)}
                  fill="#f87171"
                  rx="6"
                  opacity="0.6"
                />

                {/* Value labels on top of bars */}
                {successfulHeight > 15 && (
                  <SvgText
                    x={successfulBarX + barWidth / 2}
                    y={successfulY - 5}
                    fontSize="9"
                    fill="#10b981"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {formatShortCurrency(stat.successfulRevenue)}
                  </SvgText>
                )}
                {failedHeight > 15 && (
                  <SvgText
                    x={failedBarX + barWidth / 2}
                    y={failedY - 5}
                    fontSize="9"
                    fill="#ef4444"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {formatShortCurrency(stat.failedRevenue)}
                  </SvgText>
                )}

                {/* Month Label */}
                <SvgText
                  x={groupX + barGroupWidth / 2 - groupGap / 2}
                  y={BAR_CHART_HEIGHT - 15}
                  fontSize="11"
                  fill="#fff"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {stat._id.month}/{stat._id.year.toString().slice(-2)}
                </SvgText>
              </G>
            );
          })}

          {/* X-axis line */}
          <Path
            d={`M ${leftPadding} ${topPadding + chartAreaHeight} L ${CHART_WIDTH - rightPadding} ${topPadding + chartAreaHeight}`}
            stroke="#3a3a3a"
            strokeWidth="2"
          />
        </Svg>
        
        {/* Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#10b981" }]} />
            <Text style={styles.legendText}>Thành công</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#ef4444" }]} />
            <Text style={styles.legendText}>Hủy/Boom</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Pie Chart cho phân bổ trạng thái
  const renderStatusPieChart = (statusStats) => {
    if (!statusStats || statusStats.length === 0) return null;

    const total = statusStats.reduce((sum, stat) => sum + stat.count, 0);
    if (total === 0) return null;

    // Professional color palette
    const colors = {
      'delivered': '#10b981',
      'processing': '#3b82f6',
      'shipped': '#f59e0b',
      'pending': '#8b5cf6',
      'cancelled': '#ef4444'
    };

    const centerX = PIE_CHART_SIZE / 2;
    const centerY = PIE_CHART_SIZE / 2;
    const radius = 75;
    const innerRadius = 0; // For donut chart, set to > 0

    let currentAngle = -90; // Start from top
    const paths = [];
    const labels = [];

    statusStats.forEach((stat, index) => {
      const percentage = (stat.count / total) * 100;
      const angle = (stat.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Skip very small slices
      if (angle < 1) {
        currentAngle = endAngle;
        return;
      }

      // Calculate path for pie slice
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const startX = centerX + radius * Math.cos(startAngleRad);
      const startY = centerY + radius * Math.sin(startAngleRad);
      const endX = centerX + radius * Math.cos(endAngleRad);
      const endY = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Create path for pie slice
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        "Z"
      ].join(" ");

      const color = colors[stat._id] || ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][index % 5];

      paths.push({
        path: pathData,
        color: color,
        label: getStatusText(stat._id),
        percentage: percentage.toFixed(1),
        count: stat.count,
        startAngle: startAngle,
        endAngle: endAngle
      });

      // Label position - only show if slice is large enough
      if (angle > 10) {
        const labelAngle = (startAngle + endAngle) / 2;
        const labelRadius = radius * 0.65;
        const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
        const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);

        labels.push({
          x: labelX,
          y: labelY,
          text: `${percentage.toFixed(0)}%`,
          angle: labelAngle
        });
      }

      currentAngle = endAngle;
    });

    return (
      <View style={styles.pieChartWrapper}>
        <Svg width={PIE_CHART_SIZE} height={PIE_CHART_SIZE}>
          {/* Background circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius + 3}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="3"
            opacity="0.5"
          />
          
          {/* Pie slices */}
          {paths.map((item, index) => {
            // Calculate highlight path (top portion of slice)
            const midAngle = (item.startAngle + item.endAngle) / 2;
            const midAngleRad = (midAngle * Math.PI) / 180;
            const highlightRadius = radius * 0.3;
            const highlightStartAngle = item.startAngle;
            const highlightEndAngle = item.endAngle;
            
            const highlightStartX = centerX + highlightRadius * Math.cos((highlightStartAngle * Math.PI) / 180);
            const highlightStartY = centerY + highlightRadius * Math.sin((highlightStartAngle * Math.PI) / 180);
            const highlightEndX = centerX + highlightRadius * Math.cos((highlightEndAngle * Math.PI) / 180);
            const highlightEndY = centerY + highlightRadius * Math.sin((highlightEndAngle * Math.PI) / 180);
            
            const highlightLargeArc = (item.endAngle - item.startAngle) > 180 ? 1 : 0;
            
            const highlightPath = [
              `M ${centerX} ${centerY}`,
              `L ${highlightStartX} ${highlightStartY}`,
              `A ${highlightRadius} ${highlightRadius} 0 ${highlightLargeArc} 1 ${highlightEndX} ${highlightEndY}`,
              "Z"
            ].join(" ");

            return (
              <G key={index}>
                {/* Main slice */}
                <Path
                  d={item.path}
                  fill={item.color}
                  stroke="#000"
                  strokeWidth="2"
                />
                {/* Highlight effect on top portion */}
                {item.endAngle - item.startAngle > 5 && (
                  <Path
                    d={highlightPath}
                    fill="rgba(255, 255, 255, 0.25)"
                    stroke="none"
                  />
                )}
              </G>
            );
          })}
          
          {/* Center circle for donut effect */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.45}
            fill="#0a0a0a"
            stroke="#2a2a2a"
            strokeWidth="3"
          />
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.4}
            fill="#1a1a1a"
            stroke="none"
          />
          
          {/* Center text */}
          <SvgText
            x={centerX}
            y={centerY - 6}
            fontSize="20"
            fill="#fff"
            fontWeight="900"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {total}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 14}
            fontSize="12"
            fill="#9ca3af"
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            Tổng đơn
          </SvgText>
          
          {/* Percentage labels */}
          {labels.map((label, index) => (
            <G key={`label-${index}`}>
              {/* Background circle for text */}
              <Circle
                cx={label.x}
                cy={label.y}
                r="20"
                fill="rgba(0, 0, 0, 0.8)"
                stroke="#2a2a2a"
                strokeWidth="2"
              />
              <SvgText
                x={label.x}
                y={label.y + 5}
                fontSize="12"
                fill="#fff"
                fontWeight="900"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label.text}
              </SvgText>
            </G>
          ))}
        </Svg>
        
        {/* Legend */}
        <View style={styles.pieChartLegend}>
          {paths.map((item, index) => (
            <View key={index} style={styles.pieLegendItem}>
              <View style={styles.legendItemContent}>
                <View style={[styles.legendColorLarge, { backgroundColor: item.color }]} />
                <View style={styles.pieLegendTextContainer}>
                  <Text style={styles.pieLegendText}>{item.label}</Text>
                  <Text style={styles.pieLegendSubtext}>
                    {item.count} đơn hàng • {item.percentage}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thống Kê Doanh Thu</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Filter */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Lọc theo thời gian</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => openDatePicker("start")}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Từ ngày</Text>
              <Text style={styles.dateValue}>
                {startDate ? formatDate(startDate) : "Chọn ngày"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => openDatePicker("end")}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Đến ngày</Text>
              <Text style={styles.dateValue}>
                {endDate ? formatDate(endDate) : "Chọn ngày"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterButtonRow}>
            <TouchableOpacity
              style={[styles.filterButton, styles.clearButton]}
              onPress={handleClearDates}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Xóa lọc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, styles.applyButton]}
              onPress={handleApplyFilter}
              activeOpacity={0.7}
            >
              <Text style={styles.filterButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {stats && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              {/* Successful Revenue */}
              <View style={[styles.summaryCard, styles.successCard]}>
                <Text style={styles.summaryLabel}>Doanh thu thành công</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(stats.summary?.successfulRevenue)}
                </Text>
                <Text style={styles.summaryCount}>
                  {stats.summary?.totalSuccessfulOrders || 0} đơn hàng
                </Text>
              </View>

              {/* Failed Revenue */}
              <View style={[styles.summaryCard, styles.failedCard]}>
                <Text style={styles.summaryLabel}>Doanh thu hủy/boom</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(stats.summary?.failedRevenue)}
                </Text>
                <Text style={styles.summaryCount}>
                  {stats.summary?.totalFailedOrders || 0} đơn hàng
                </Text>
              </View>
            </View>

            {/* Net Revenue */}
            <View style={styles.netRevenueCard}>
              <Text style={styles.netRevenueLabel}>Doanh thu thực tế</Text>
              <Text style={styles.netRevenueValue}>
                {formatCurrency(stats.summary?.netRevenue)}
              </Text>
              <Text style={styles.netRevenueSubtext}>
                (Thành công - Hủy/Boom)
              </Text>
            </View>

            {/* Total Orders */}
            <View style={styles.totalOrdersCard}>
              <View style={styles.totalOrdersRow}>
                <Text style={styles.totalOrdersLabel}>Tổng số đơn hàng</Text>
                <Text style={styles.totalOrdersValue}>
                  {stats.summary?.totalOrders || 0}
                </Text>
              </View>
              <View style={styles.totalOrdersRow}>
                <Text style={styles.totalOrdersLabel}>Tỷ lệ thành công</Text>
                <Text style={styles.totalOrdersValue}>
                  {stats.summary?.totalOrders > 0
                    ? (
                        (stats.summary?.totalSuccessfulOrders /
                          stats.summary?.totalOrders) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Text>
              </View>
            </View>

            {/* Status Stats */}
            {stats.statusStats && stats.statusStats.length > 0 && (
              <View style={styles.statusStatsContainer}>
                <Text style={styles.sectionTitle}>Thống kê theo trạng thái</Text>
                {stats.statusStats.map((stat, index) => (
                  <View key={index} style={styles.statusStatItem}>
                    <View style={styles.statusStatHeader}>
                      <Text style={styles.statusStatLabel}>
                        {getStatusText(stat._id)}
                      </Text>
                      <Text style={styles.statusStatCount}>{stat.count} đơn</Text>
                    </View>
                    <Text style={styles.statusStatAmount}>
                      {formatCurrency(stat.totalAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Monthly Revenue Chart */}
            {stats.monthlyStats && stats.monthlyStats.length > 0 ? (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Biểu đồ doanh thu theo tháng</Text>
                <View style={styles.chartCard}>
                  {renderMonthlyBarChart(stats.monthlyStats)}
                </View>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Biểu đồ doanh thu theo tháng</Text>
                <View style={styles.chartCard}>
                  <View style={styles.emptyChartContainer}>
                    <Text style={styles.emptyChartText}>Chưa có dữ liệu theo tháng</Text>
                    <Text style={styles.emptyChartSubtext}>Dữ liệu sẽ hiển thị khi có đơn hàng trong các tháng</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Status Distribution Chart */}
            {stats.statusStats && stats.statusStats.length > 0 ? (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Phân bổ đơn hàng theo trạng thái</Text>
                <View style={styles.chartCard}>
                  {renderStatusPieChart(stats.statusStats)}
                </View>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Phân bổ đơn hàng theo trạng thái</Text>
                <View style={styles.chartCard}>
                  <View style={styles.emptyChartContainer}>
                    <Text style={styles.emptyChartText}>Chưa có dữ liệu phân bổ</Text>
                    <Text style={styles.emptyChartSubtext}>Dữ liệu sẽ hiển thị khi có đơn hàng</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Monthly Stats List */}
            {stats.monthlyStats && stats.monthlyStats.length > 0 && (
              <View style={styles.monthlyStatsContainer}>
                <Text style={styles.sectionTitle}>Chi tiết theo tháng</Text>
                {stats.monthlyStats.map((stat, index) => (
                  <View key={index} style={styles.monthlyStatItem}>
                    <Text style={styles.monthlyStatLabel}>
                      Tháng {stat._id.month}/{stat._id.year}
                    </Text>
                    <View style={styles.monthlyStatRow}>
                      <View style={styles.monthlyStatCol}>
                        <Text style={styles.monthlyStatLabelSmall}>Thành công</Text>
                        <Text style={styles.monthlyStatValueSuccess}>
                          {formatCurrency(stat.successfulRevenue)}
                        </Text>
                        <Text style={styles.monthlyStatCount}>
                          {stat.successfulCount} đơn
                        </Text>
                      </View>
                      <View style={styles.monthlyStatCol}>
                        <Text style={styles.monthlyStatLabelSmall}>Hủy/Boom</Text>
                        <Text style={styles.monthlyStatValueFailed}>
                          {formatCurrency(stat.failedRevenue)}
                        </Text>
                        <Text style={styles.monthlyStatCount}>
                          {stat.failedCount} đơn
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchStats}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>Làm mới dữ liệu</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Chọn {datePickerType === "start" ? "ngày bắt đầu" : "ngày kết thúc"}
            </Text>
            <TextInput
              style={styles.dateInputField}
              value={tempDate}
              onChangeText={setTempDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
            />
            <Text style={styles.dateHint}>
              Nhập ngày theo định dạng: YYYY-MM-DD (ví dụ: 2024-01-15)
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setDatePickerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleDateConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStatusText = (status) => {
  const statusMap = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#f59e0b",
    backgroundColor: "#1a0f00",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fbbf24",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  filterCard: {
    backgroundColor: "#1a0f00",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#f59e0b",
  },
  filterTitle: {
    color: "#fbbf24",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateInputButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  dateLabel: {
    color: "#d97706",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  dateValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  filterButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyButton: {
    backgroundColor: "#f59e0b",
  },
  clearButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  filterButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  summaryContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  successCard: {
    borderColor: "#10b981",
  },
  failedCard: {
    borderColor: "#ef4444",
  },
  summaryLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "500",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  summaryCount: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "500",
  },
  netRevenueCard: {
    backgroundColor: "#1a0f00",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#f59e0b",
    alignItems: "center",
  },
  netRevenueLabel: {
    color: "#fbbf24",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  netRevenueValue: {
    color: "#fbbf24",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  netRevenueSubtext: {
    color: "#d97706",
    fontSize: 13,
    fontWeight: "500",
  },
  totalOrdersCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  totalOrdersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalOrdersLabel: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "500",
  },
  totalOrdersValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  statusStatsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    color: "#fbbf24",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statusStatItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  statusStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusStatLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  statusStatCount: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  statusStatAmount: {
    color: "#f59e0b",
    fontSize: 18,
    fontWeight: "800",
  },
  monthlyStatsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  monthlyStatItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  monthlyStatLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  monthlyStatRow: {
    flexDirection: "row",
    gap: 12,
  },
  monthlyStatCol: {
    flex: 1,
  },
  monthlyStatLabelSmall: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  monthlyStatValueSuccess: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  monthlyStatValueFailed: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  monthlyStatCount: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "500",
  },
  refreshButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  modalTitle: {
    color: "#fbbf24",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  dateInputField: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 12,
  },
  dateHint: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  modalConfirmButton: {
    backgroundColor: "#f59e0b",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalConfirmText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  chartContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  chartCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.3)",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 12,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  legendColor: {
    width: 18,
    height: 18,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  legendColorLarge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  legendText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 16,
  },
  pieChartLegend: {
    marginTop: 24,
    width: "100%",
  },
  pieLegendItem: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  legendItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pieLegendTextContainer: {
    flex: 1,
  },
  pieLegendText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  pieLegendSubtext: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  emptyChartContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyChartText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyChartSubtext: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});

