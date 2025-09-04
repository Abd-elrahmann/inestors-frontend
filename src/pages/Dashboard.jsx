import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Progress,
  Layout,
  Spin,
  Space,
  Segmented,
  Select,
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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';
import { useMediaQuery } from '@mui/material';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Api from '../services/api';
const { Title: AntTitle, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
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

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const chartVariants = {
  initial: { 
    opacity: 0, 
    y: 40 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
      delay: 0.3
    }
  }
};

const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    const startValue = 0;
    const endValue = parseInt(value.replace(/[^\d]/g, ''));

    const updateCount = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(startValue + (endValue - startValue) * easeOutExpo);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(updateCount);
    }, 200);

    return () => clearTimeout(timer);
  }, [value, duration, isVisible]);

  const formatNumber = (num) => {
    if (value.includes('ريال')) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ريال';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {formatNumber(count)}
    </motion.span>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalInvestors: 0,
    totalCapital: 0,
    totalProfits: 0,
    monthlyOperations: 0,
    investorGrowth: 0,
    capitalGrowth: 0,
    profitGrowth: 0,
    operationsGrowth: 0
  });
  const isMobile = useMediaQuery('(max-width: 480px)');



  const { convertAmount, currentCurrency } = useCurrencyManager();

  const [companyFinancialsData, setCompanyFinancialsData] = useState({
    labels: [],
    datasets: []
  });

  const [priceHistoryData, setPriceHistoryData] = useState({
    labels: [],
    datasets: []
  });

  const [portfolioData, setPortfolioData] = useState({
    labels: [],
    datasets: []
  });

  const [dailyPerformanceData, setDailyPerformanceData] = useState({
    labels: [],
    datasets: []
  });

  const [timeRange, setTimeRange] = useState('1Y');

  useEffect(() => {
    fetchDashboardData(); 
    const interval = setInterval(fetchDashboardData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency]); 

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [investorsResponse, transactionsResponse, financialYearsResponse] = await Promise.allSettled([
        Api.get('/investors', { params: { page: 1, limit: 1000 } }),
        Api.get('/transactions', { params: { page: 1, limit: 1000 } }),
        Api.get('/financial-years', { params: { page: 1, limit: 1000 } })
      ]);

      // Handle API responses
      let investorsData = [];
      let transactionsData = [];
      let financialYearsData = [];
      
      if (investorsResponse.status === 'fulfilled' && investorsResponse.value.data.success) {
        investorsData = investorsResponse.value.data.investors || [];
      } else {
        console.error('Error fetching investors:', investorsResponse.reason);
      }
      
      if (transactionsResponse.status === 'fulfilled' && transactionsResponse.value.data.success) {
        transactionsData = transactionsResponse.value.data.transactions || [];
      } else {
        console.error('Error fetching transactions:', transactionsResponse.reason);
      }
      
      if (financialYearsResponse.status === 'fulfilled' && financialYearsResponse.value.data.success) {
        financialYearsData = financialYearsResponse.value.data.financialYears || [];
      } else {
        console.error('Error fetching financial years:', financialYearsResponse.reason);
      }

      // Calculate total capital
      const totalCapital = await Promise.all(
        Array.isArray(investorsData) ? investorsData.map(async investor => {
          const amount = investor.amountContributed || 0;
          return convertAmount(amount, investor.currency || 'IQD', currentCurrency);
        }) : []
      ).then(amounts => amounts.reduce((sum, amount) => sum + amount, 0));
      
      // Calculate total profits
      const totalProfits = await Promise.all(
        Array.isArray(financialYearsData) ? financialYearsData.map(async year => {
          const amount = year.totalProfit || 0;
          return convertAmount(amount, year.currency || 'IQD', currentCurrency);
        }) : []
      ).then(amounts => amounts.reduce((sum, amount) => sum + amount, 0));
      
      // Calculate monthly operations
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthlyOperations = Array.isArray(transactionsData) ? transactionsData.filter(t => 
        new Date(t.createdAt || t.transactionDate || t.date) >= monthStart).length : 0;
      
      // Calculate operations growth
      const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthOperations = Array.isArray(transactionsData) ? transactionsData.filter(t => 
        new Date(t.createdAt || t.transactionDate || t.date) >= lastMonthStart && 
        new Date(t.createdAt || t.transactionDate || t.date) < monthStart).length : 0;
      
      const operationsGrowth = lastMonthOperations ? 
        ((monthlyOperations - lastMonthOperations) / lastMonthOperations) * 100 : 0;
      
      setDashboardData({
        totalInvestors: Array.isArray(investorsData) ? investorsData.length : 0,
        totalCapital,
        totalProfits,
        monthlyOperations,
        investorGrowth: 0,
        capitalGrowth: 0,
        profitGrowth: 0,
        operationsGrowth
      });
      
      await updateChartData(investorsData, transactionsData, financialYearsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // eslint-disable-next-line no-unused-vars
      const errorMessage = Api.handleApiError(error);
      // You might want to show this error to the user
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = async (investors, transactions, financialYears) => {
    const sortedYears = [...financialYears].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    const yearlyData = await Promise.all(sortedYears.map(async year => {
      const yearStart = new Date(year.startDate);
      
      const totalInvestments = await Promise.all(
        investors.map(async investor => {
          const investorJoinDate = new Date(investor.createdAt || investor.startDate);
          if (investorJoinDate <= yearStart) {
            return convertAmount(investor.amountContributed || 0, investor.currency || 'IQD', currentCurrency);
          }
          return 0;
        })
      ).then(amounts => amounts.reduce((sum, amount) => sum + amount, 0));

      const convertedProfit = await convertAmount(year.totalProfit || 0, year.currency || 'IQD', currentCurrency);
      
      return {
        totalInvestments,
        convertedProfit
      };
    }));

    setCompanyFinancialsData({
      labels: sortedYears.map(year => year.periodName || `${year.year}`),
      datasets: [
        {
          label: `إجمالي رأس المال (${currentCurrency})`,
          data: yearlyData.map(data => data.totalInvestments),
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: 1,
          borderRadius: 4,
          categoryPercentage: 0.8,
          barPercentage: 0.9
        },
        {
          label: `إجمالي الأرباح (${currentCurrency})`,
          data: yearlyData.map(data => data.convertedProfit),
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          borderWidth: 1,
          borderRadius: 4,
          categoryPercentage: 0.8,
          barPercentage: 0.9
        }
      ]
    });

    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const totalCapital = await Promise.all(
      investors.map(async investor => 
        convertAmount(investor.amountContributed || 0, investor.currency || 'IQD', currentCurrency)
      )
    ).then(amounts => amounts.reduce((sum, amount) => sum + amount, 0));
    
    const dailyCapital = last7Days.map(() => totalCapital);

    setPriceHistoryData({
      labels: last7Days.map(date => date.toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: `رأس المال (${currentCurrency})`,
          data: dailyCapital,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          pointHoverBackgroundColor: '#10B981'
        }
      ]
    });

    const investorAmounts = await Promise.all(
      investors.map(async inv => ({
        ...inv,
        convertedAmount: await convertAmount(inv.amountContributed || 0, inv.currency || 'IQD', currentCurrency)
      }))
    );

    const totalInvestment = investorAmounts.reduce((sum, inv) => sum + inv.convertedAmount, 0);
    const topInvestors = [...investorAmounts]
      .sort((a, b) => b.convertedAmount - a.convertedAmount)
      .slice(0, 5);
    
    const otherInvestors = investorAmounts.length > 5 ? 
      investorAmounts.slice(5).reduce((sum, inv) => sum + inv.convertedAmount, 0) : 0;

    setPortfolioData({
      labels: [
        ...topInvestors.map(inv => inv.fullName || 'مستثمر'),
        investorAmounts.length > 5 ? 'مستثمرون آخرون' : null
      ].filter(Boolean),
      datasets: [
        {
          data: [
            ...topInvestors.map(inv => ((inv.convertedAmount / totalInvestment) * 100).toFixed(1)),
            investorAmounts.length > 5 ? ((otherInvestors / totalInvestment) * 100).toFixed(1) : null
          ].filter(Boolean),
          backgroundColor: [
            '#3B82F6',
            '#10B981', 
            '#F59E0B',
            '#8B5CF6',
            '#EF4444',
            '#6B7280'
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3
        }
      ]
    });

    const last7DaysPerf = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const totalTransactions = transactions.length;
    const totalDeposits = transactions.filter(t => t.type === 'deposit' || t.type === 'إيداع').length;
    
    const avgDailyTransactions = Math.floor(totalTransactions / 7);
    const avgDailyDeposits = Math.floor(totalDeposits / 7);

    setDailyPerformanceData({
      labels: last7DaysPerf.map(date => date.toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric' })),
      datasets: [
        {
          label: 'متوسط العمليات',
          data: last7DaysPerf.map(() => avgDailyTransactions),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'متوسط الإيداعات',
          data: last7DaysPerf.map(() => avgDailyDeposits),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    });
  };

  const stats = [
    {
      title: 'إجمالي المساهمين',
      value: dashboardData.totalInvestors,
      icon: <UserOutlined style={{ color: '#28a745', fontSize: '24px' }} />,
      trend: dashboardData.investorGrowth,
      color: '#28a745',
      prefix: null,
      suffix: null
    },
    {
      title: `إجمالي رأس المال`,
      value: dashboardData.totalCapital,
      icon: <DollarOutlined style={{ color: '#007bff', fontSize: '24px' }} />,
      trend: dashboardData.capitalGrowth,
      color: '#007bff',
      prefix: null,
      suffix: currentCurrency
    },
    {
      title: `الأرباح المحققة`,
      value: dashboardData.totalProfits,
      icon: <RiseOutlined style={{ color: '#ffc107', fontSize: '24px' }} />,
      trend: dashboardData.profitGrowth,
      color: '#ffc107',
      prefix: null,
      suffix: currentCurrency
    },
    {
      title: 'العمليات الشهرية',
      value: dashboardData.monthlyOperations,
      icon: <TransactionOutlined style={{ color: '#dc3545', fontSize: '24px' }} />,
      trend: dashboardData.operationsGrowth,
      color: '#dc3545',
      prefix: null,
      suffix: currentCurrency
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
        cornerRadius: 8
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
          color: '#6c757d'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          fontFamily: 'Cairo',
          color: '#495057',
          usePointStyle: true,
          padding: 15
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
        cornerRadius: 8
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
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: isMobile ? 'center' : 'stretch'
    }}>
      <motion.div 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        layout={false}
        key="dashboard-page"
        style={{
          width: '100%'
        }}
      >
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
            <Row gutter={[16, 16]} style={{ marginBottom: '24px', width: '100%' }}>
              {stats.map((stat, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <motion.div
                    variants={cardVariants}
                    whileHover={{ 
                      y: -8,
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card>
                      <Statistic
                        title={stat.title}
                        value={stat.value}
                        precision={0}
                        valueStyle={{ color: stat.color }}
                        prefix={stat.icon}
                        suffix={stat.suffix}
                      />
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary">
                          {`${stat.trend >= 0 ? '+' : ''}${Number(stat.trend).toFixed(1)}% عن الشهر الماضي`}
                        </Text>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            <Row gutter={[16, 16]} style={{ width: '100%' }}>
              <Col xs={24} lg={12}>
                <motion.div variants={chartVariants}>
                  <Card 
                    title={
                      <Space>
                        <BarChartOutlined />
                        <span>البيانات المالية للشركة</span>
                      </Space>
                    }
                    extra={
                      <Segmented 
                        options={['1Y', '2Y', '5Y', '10Y', 'الكل']} 
                        value={timeRange}
                        onChange={setTimeRange}
                        size="small"
                      />
                    }
                  >
                    <div style={{ height: '300px' }}>
                      <Bar data={companyFinancialsData} options={chartOptions} />
                    </div>
                  </Card>
                </motion.div>
              </Col>

              <Col xs={24} lg={12}>
                <motion.div variants={chartVariants}>
                  <Card 
                    title={
                      <Space>
                        <LineChartOutlined />
                        <span>تاريخ الأسعار</span>
                      </Space>
                    }
                    extra={
                      <Select defaultValue="1W" size="small" style={{ width: '100px' }}>
                        <Option value="1W">أسبوع</Option>
                        <Option value="1M">شهر</Option>
                        <Option value="3M">3 أشهر</Option>
                        <Option value="6M">6 أشهر</Option>
                        <Option value="1Y">سنة</Option>
                        <Option value="all">الكل</Option>
                      </Select>
                    }
                  >
                    <div style={{ height: '300px' }}>
                      <Line data={priceHistoryData} options={chartOptions} />
                    </div>
                  </Card>
                </motion.div>
              </Col>

              <Col xs={24} lg={12}>
                <motion.div variants={chartVariants}>
                  <Card 
                    title={
                      <Space>
                        <PieChartOutlined />
                        <span>توزيع المحفظة الاستثمارية</span>
                      </Space>
                    }
                    extra={
                      <Select defaultValue="all" size="small" style={{ width: '100px' }}>
                        <Option value="top5">أعلى 5</Option>
                        <Option value="top10">أعلى 10</Option>
                        <Option value="all">الكل</Option>
                      </Select>
                    }
                  >
                    <div style={{ height: '300px' }}>
                      <Pie data={portfolioData} options={pieChartOptions} />
                    </div>
                  </Card>
                </motion.div>
              </Col>

              <Col xs={24} lg={12}>
                <motion.div variants={chartVariants}>
                  <Card 
                    title={
                      <Space>
                        <LineChartOutlined />
                        <span>أداء المؤشرات اليومي</span>
                      </Space>
                    }
                    extra={
                      <RangePicker size="small" />
                    }
                  >
                    <div style={{ height: '300px' }}>
                      <Line data={dailyPerformanceData} options={chartOptions} />
                    </div>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </>
        )}
      </motion.div>
    </Content>
    </>
  );
};

export default Dashboard;