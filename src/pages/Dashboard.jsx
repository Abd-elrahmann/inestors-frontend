import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Layout,
  Spin,
  Space,
  Segmented,
  DatePicker
} from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  RiseOutlined, 
  TransactionOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';
import { useMediaQuery } from '@mui/material';
import Api from '../services/api';
import dayjs from 'dayjs';

const { Title: AntTitle, Text } = Typography;
const { Content } = Layout;
const { RangePicker } = DatePicker;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({
    totalInvestors: 0,
    totalAmount: 0,
    totalProfit: 0,
    totalTransactions: 0,
    monthlyIncreasePercentage: 0
  });
  
  const [aggregatesData, setAggregatesData] = useState({
    period: '',
    startDate: '',
    endDate: '',
    totalAmount: 0,
    totalProfit: 0,
    currency: 'IQD'
  });
  
  const [transactionsData, setTransactionsData] = useState({
    startDate: '',
    endDate: '',
    currency: 'IQD',
    days: []
  });
  
  const [financialYearsData, setFinancialYearsData] = useState([]);
  
  const isMobile = useMediaQuery('(max-width: 480px)');
  const { formatAmount, currentCurrency } = useCurrencyManager();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentCurrency]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        overviewResponse,
        aggregatesResponse,
        transactionsResponse,
        financialYearsResponse
      ] = await Promise.allSettled([
        Api.get('/api/dashboard/overview'),
        Api.get('/api/dashboard/aggregates'),
        Api.get('/api/dashboard/transactions-range'),
        Api.get('/api/dashboard/financial-years')
      ]);

      // Handle overview data
      if (overviewResponse.status === 'fulfilled') {
        setOverviewData(overviewResponse.value.data);
      } else {
        console.error('Error fetching overview:', overviewResponse.reason);
      }

      // Handle aggregates data
      if (aggregatesResponse.status === 'fulfilled') {
        setAggregatesData(aggregatesResponse.value.data);
      } else {
        console.error('Error fetching aggregates:', aggregatesResponse.reason);
      }

      // Handle transactions data
      if (transactionsResponse.status === 'fulfilled') {
        setTransactionsData(transactionsResponse.value.data);
      } else {
        console.error('Error fetching transactions:', transactionsResponse.reason);
      }

      // Handle financial years data
      if (financialYearsResponse.status === 'fulfilled') {
        setFinancialYearsData(financialYearsResponse.value.data);
      } else {
        console.error('Error fetching financial years:', financialYearsResponse.reason);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const prepareFinancialsChartData = () => {
    return {
      labels: [aggregatesData.period || 'الفترة الحالية'],
      datasets: [
        {
          label: `إجمالي رأس المال (${currentCurrency})`,
          data: [aggregatesData.totalAmount],
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: `إجمالي الأرباح (${currentCurrency})`,
          data: [aggregatesData.totalProfit],
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  };

  const prepareFinancialYearsChartData = () => {
    if (!financialYearsData.length || !financialYearsData[0].financialYears.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const financialYears = financialYearsData[0].financialYears;
    const labels = financialYears.map(fy => fy.name);
    const data = financialYears.map(fy => fy.totalProfit);

    return {
      labels,
      datasets: [
        {
          label: `إجمالي الأرباح (${currentCurrency})`,
          data,
          backgroundColor: '#10B981',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };
  };

  const prepareDailyPerformanceData = () => {
    if (!transactionsData.days.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    // ترتيب الأيام حسب التاريخ
    const sortedDays = [...transactionsData.days].sort((a, b) => 
      new Date(a.day) - new Date(b.day)
    );

    const labels = sortedDays.map(day => {
      const date = new Date(day.day);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    });
    
    const depositData = sortedDays.map(day => day.averageDeposit);
    const withdrawData = sortedDays.map(day => day.averageWithdraw);

    return {
      labels,
      datasets: [
        {
          label: 'متوسط الإيداعات',
          data: depositData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'متوسط السحوبات',
          data: withdrawData,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    };
  };

  const stats = [
    {
      title: 'إجمالي المساهمين',
      value: overviewData.totalInvestors,
      icon: <UserOutlined style={{ color: '#28a745', fontSize: '24px' }} />,
      trend: overviewData.monthlyIncreasePercentage||0,
      color: '#28a745',
      suffix: null
    },
    {
      title: `إجمالي رأس المال`,
      value: formatAmount(overviewData.totalAmount, currentCurrency),
      icon: <DollarOutlined style={{ color: '#007bff', fontSize: '24px' }} />,
      trend: overviewData.monthlyIncreasePercentage,
      color: '#007bff',
      suffix: null
    },
    {
      title: `الأرباح المحققة`,
      value: formatAmount(overviewData.totalProfit, currentCurrency),
      icon: <RiseOutlined style={{ color: '#ffc107', fontSize: '24px' }} />,
      trend: overviewData.monthlyIncreasePercentage||0,
      color: '#ffc107',
      suffix: null
    },
    {
      title: 'إجمالي المعاملات',
      value: overviewData.totalTransactions,
      icon: <TransactionOutlined style={{ color: '#dc3545', fontSize: '24px' }} />,
      trend: overviewData.monthlyIncreasePercentage||0,
      color: '#dc3545',
      suffix: null
    }
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          fontFamily: 'Cairo',
          color: '#495057',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        titleFont: { family: 'Cairo' },
        bodyFont: { family: 'Cairo' },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#28a745',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatAmount(value, currentCurrency)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { family: 'Cairo' },
          color: '#6c757d'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          font: { family: 'Cairo' },
          color: '#6c757d',
          callback: function(value) {
            return formatAmount(value, currentCurrency);
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (  
    <>
      <Helmet>
        <title>لوحة التحكم</title>
        <meta name="description" content="لوحة التحكم في نظام إدارة المساهمين" />
      </Helmet>
      <Content style={{ 
        padding: isMobile ? '16px' : '24px', 
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <AntTitle level={2}>لوحة التحكم</AntTitle>
          <Text type="secondary">تحليلات شاملة وإحصائيات مرئية لأداء النظام</Text>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Statistics Row - جميع البوكسات بنفس الحجم */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              {stats.map((stat, index) => (
                <Col xs={24} sm={12} md={6} lg={6} key={index}>
                  <Card 
                    style={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Statistic
                      title={stat.title}
                      value={stat.value}
                      precision={0}
                      valueStyle={{ 
                        color: stat.color,
                        fontSize: isMobile ? '16px' : '20px'
                      }}
                      prefix={stat.icon}
                      suffix={stat.suffix}
                    />
                    {stat.trend !== 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type={stat.trend >= 0 ? 'success' : 'danger'}>
                          {`${stat.trend >= 0 ? '+' : ''}${Number(stat.trend).toFixed(1)}%`}
                        </Text>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Charts Section */}
            <Row gutter={[16, 16]}>
              {/* البيانات المالية */}
              <Col xs={24}>
                <Card 
                  title={
                    <Space>
                      <BarChartOutlined />
                      <span>البيانات المالية</span>
                    </Space>
                  }
                  extra={
                    <Segmented 
                      options={['أسبوع', 'شهر', 'ربع سنة', 'سنة']} 
                      defaultValue="أسبوع"
                      size="small"
                    />
                  }
                >
                  <div style={{ height: '400px' }}>
                    <Bar data={prepareFinancialsChartData()} options={chartOptions} />
                  </div>
                </Card>
              </Col>

              {/* توزيعات السنة المالية (أعمدة بدلاً من دائرة) */}
              {financialYearsData.length > 0 && financialYearsData[0].financialYears.length > 0 && (
                <Col xs={24}>
                  <Card 
                    title={
                      <Space>
                        <BarChartOutlined />
                        <span>توزيعات السنة المالية</span>
                      </Space>
                    }
                  >
                    <div style={{ height: '400px' }}>
                      <Bar data={prepareFinancialYearsChartData()} options={chartOptions} />
                    </div>
                  </Card>
                </Col>
              )}

              {/* مؤشرات العمليات اليومية */}
              {transactionsData.days.length > 0 && (
                <Col xs={24}>
                  <Card 
                    title={
                      <Space>
                        <LineChartOutlined />
                        <span>مؤشرات العمليات اليومية</span>
                      </Space>
                    }
                    extra={
                      <RangePicker 
                        size="small"
                        value={[
                          transactionsData.startDate ? dayjs(transactionsData.startDate) : null,
                          transactionsData.endDate ? dayjs(transactionsData.endDate) : null
                        ]}
                      />
                    }
                  >
                    <div style={{ height: '400px' }}>
                      <Line data={prepareDailyPerformanceData()} options={chartOptions} />
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </>
        )}
      </Content>
    </>
  );
};

export default Dashboard;