import React, { useState, useEffect, useRef } from 'react';
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
  DatePicker,
  Button
} from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  RiseOutlined, 
  TransactionOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  DownloadOutlined
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
import { useCurrencyManager, formatCurrency } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';
import { useMediaQuery } from '@mui/material';
import Api from '../services/api';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    totalInvested: 0,
    totalProfit: 0,
    totalTransactions: 0,
    weeklyIncreases: {
      investors: 0,
      amount: 0,
      profit: 0,
      transactions: 0
    }
  });
  
  const [aggregatesData, setAggregatesData] = useState({
    period: '',
    startDate: '',
    endDate: '',
    totalAmount: 0,
    totalProfit: 0,
    currency: 'USD'
  });
  
  const [transactionsData, setTransactionsData] = useState({
    startDate: '',
    endDate: '',
    currency: 'USD',
    days: []
  });
  
  const [financialYearsData, setFinancialYearsData] = useState([]);
  const [topInvestorsData, setTopInvestorsData] = useState([]);
  
  const isMobile = useMediaQuery('(max-width: 480px)');
  const { currentCurrency, convertAmount } = useCurrencyManager();
  const contentRef = useRef(null);
  const filterSectionRef = useRef(null);

  const exportToPDF = async () => {
    try {
      if (!contentRef.current) return;

      if (filterSectionRef.current) {
        filterSectionRef.current.style.display = 'none';
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#f0f2f5'
      });

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      if (filterSectionRef.current) {
        filterSectionRef.current.style.display = 'block';
      }

      pdf.save('dashboard_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (filterSectionRef.current) {
        filterSectionRef.current.style.display = 'block';
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        overviewResponse,
        aggregatesResponse,
        transactionsResponse,
        financialYearsResponse,
        topInvestorsResponse
      ] = await Promise.allSettled([
        Api.get('/api/dashboard/overview'),
        Api.get('/api/dashboard/aggregates'),
        Api.get('/api/dashboard/transactions-range'),
        Api.get('/api/dashboard/financial-years'),
        Api.get('/api/dashboard/top-investors')
      ]);

      if (overviewResponse.status === 'fulfilled') {
        const data = overviewResponse.value.data;
        setOverviewData({
          ...data,
          totalAmount: convertAmount(data.totalAmount || 0, 'USD', currentCurrency),
          totalProfit: convertAmount(data.totalProfit || 0, 'USD', currentCurrency)
        });
      } else {
        console.error('Error fetching overview:', overviewResponse.reason);
      }

      if (aggregatesResponse.status === 'fulfilled') {
        const data = aggregatesResponse.value.data;
        setAggregatesData({
          ...data,
          totalAmount: convertAmount(data.totalAmount || 0, 'USD', currentCurrency),
          totalProfit: convertAmount(data.totalProfit || 0, 'USD', currentCurrency)
        });
      } else {
        console.error('Error fetching aggregates:', aggregatesResponse.reason);
      }
      if (transactionsResponse.status === 'fulfilled') {
        const data = transactionsResponse.value.data;
        const days = data.days?.map(day => ({
          ...day,
          averageDeposit: day.averageDeposit || 0,
          averageWithdraw: day.averageWithdraw || 0, 
          averageRollover: day.averageRollover || 0,
        })) || [];
        setTransactionsData({
          ...data,
          days: days
        });
      } else {
        console.error('Error fetching transactions:', transactionsResponse.reason);
      }

      if (financialYearsResponse.status === 'fulfilled') {
        const data = financialYearsResponse.value.data;
        const convertedData = data?.map(year => ({
          ...year,
          financialYears: year.financialYears?.map(fy => ({
            ...fy,
            totalProfit: convertAmount(fy.totalProfit || 0, 'USD', currentCurrency)
          })) || []
        })) || [];
        setFinancialYearsData(convertedData);
      } else {
        console.error('Error fetching financial years:', financialYearsResponse.reason);
      }

      if (topInvestorsResponse.status === 'fulfilled') {
        const data = topInvestorsResponse.value.data?.topInvestors;
        const convertedInvestors = data?.map(investor => ({
          ...investor,
          amount: convertAmount((investor.amount || 0) + (investor.rolloverAmount || 0), 'USD', currentCurrency)
        })) || [];
        setTopInvestorsData(convertedInvestors);
      } else {
        console.error('Error fetching top investors:', topInvestorsResponse.reason);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareFinancialsChartData = () => {
    const totalAmount = aggregatesData.totalAmount || 0;
    const totalProfit = aggregatesData.totalProfit || 0;
    
    return {
      labels: [aggregatesData.period || 'الفترة الحالية'],
      datasets: [
        {
          label: `إجمالي رأس المال (${currentCurrency})`,
          data: [totalAmount],
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6', 
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: `إجمالي الأرباح (${currentCurrency})`,
          data: [totalProfit],
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          borderWidth: 1,
          borderRadius: 4
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
    const data = financialYears.map(fy => fy.totalProfit || 0);

    return {
      labels,
      datasets: [
        {
          label: `إجمالي الأرباح (${currentCurrency})`,
          data,
          backgroundColor: '#10B981',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    };
  };

  const prepareTopInvestorsChartData = () => {
    if (!topInvestorsData.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    return {
      labels: topInvestorsData.map(investor => investor.fullName),
      datasets: [
        {
          label: `المبلغ (${currentCurrency})`,
          data: topInvestorsData.map(investor => investor.amount || 0),
          backgroundColor: '#6366F1',
          borderColor: '#6366F1',
          borderWidth: 1,
          borderRadius: 4
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
    
    return {
      labels,
      datasets: [
        {
          label: 'متوسط الإيداعات',
          data: sortedDays.map(day => day.averageDeposit || 0),
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
          data: sortedDays.map(day => day.averageWithdraw || 0),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: 'متوسط الربح',
          data: sortedDays.map(day => day.averageRollover || 0),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6
        },
      ]
    };
  };

  const stats = [
    {
      title: 'إجمالي المساهمين',
      value: overviewData.totalInvestors,
      icon: <UserOutlined style={{ color: '#28a745', fontSize: '20px' }} />,
      trend: overviewData.weeklyIncreases?.investors || 0,
      color: '#28a745',
      suffix: null
    },
    {
      title: `إجمالي رأس المال`,
      value: convertAmount(overviewData.totalInvested, 'USD', currentCurrency),
      icon: <DollarOutlined style={{ color: '#007bff', fontSize: '20px' }} />,
      trend: overviewData.weeklyIncreases?.amount || 0,
      color: '#007bff',
      suffix: null
    },
    {
      title: `الأرباح المحققة`,
      value: convertAmount(overviewData.totalRollover, 'USD', currentCurrency),
      icon: <RiseOutlined style={{ color: '#ffc107', fontSize: '20px' }} />,
      trend: overviewData.weeklyIncreases?.profit || 0,
      color: '#ffc107',
      suffix: null
    },
    {
      title: 'إجمالي المعاملات',
      value: overviewData.totalTransactions,
      icon: <TransactionOutlined style={{ color: '#dc3545', fontSize: '20px' }} />,
      trend: overviewData.weeklyIncreases?.transactions || 0,
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
            return `${label}: ${formatCurrency(value, currentCurrency)}`;
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
            return formatCurrency(value, currentCurrency);
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
        <div style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AntTitle level={2}>لوحة التحكم</AntTitle>
          <Text type="secondary">تحليلات شاملة وإحصائيات مرئية لأداء النظام</Text>
          <Button  
            color='green'
            icon={<DownloadOutlined />} 
            onClick={exportToPDF}
            style={{ marginTop: '16px', marginLeft: '16px' }}
          >
            تصدير كملف PDF
          </Button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div ref={contentRef}>
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

            {topInvestorsData.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24}>
                  <Card
                    title={
                      <Space>
                        <TrophyOutlined style={{ color: '#28a745', fontSize: '20px' }} />
                        <span>أعلى المستثمرين</span>
                      </Space>
                    }
                  >
                    <div style={{ height: '400px' }}>
                      <Bar data={prepareTopInvestorsChartData()} options={chartOptions} />
                    </div>
                  </Card>
                </Col>
              </Row>
            )}

            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card 
                  title={
                    <Space>
                      <BarChartOutlined style={{ color: '#28a745', fontSize: '20px' }} />
                      <span>البيانات المالية</span>
                    </Space>
                  }
                  extra={
                    <div ref={filterSectionRef}>
                      <Segmented 
                        options={['أسبوع', 'شهر', 'ربع سنة', 'سنة']} 
                        defaultValue="أسبوع"
                        size="small"
                      />
                    </div>
                  }
                >
                  <div style={{ height: '400px' }}>
                    <Bar data={prepareFinancialsChartData()} options={chartOptions} />
                  </div>
                </Card>
              </Col>
           
                <Col xs={24}>
                  <Card 
                    title={
                      <Space>
                        <BarChartOutlined style={{ color: '#28a745', fontSize: '20px' }} />
                        <span>توزيعات السنة المالية</span>
                      </Space>
                    }
                  >
                    <div style={{ height: '400px' }}>
                      <Bar data={prepareFinancialYearsChartData()} options={chartOptions} />
                    </div>
                  </Card>
                </Col>

              {transactionsData.days.length > 0 && (
                <Col xs={24}>
                  <Card 
                    title={
                      <Space>
                        <LineChartOutlined style={{ color: '#28a745', fontSize: '20px' }} />
                        <span>مؤشرات العمليات اليومية</span>
                      </Space>
                    }
                    extra={
                      <div ref={filterSectionRef}>
                        <RangePicker 
                          size="small"
                          value={[
                            transactionsData.startDate ? dayjs(transactionsData.startDate) : null,
                            transactionsData.endDate ? dayjs(transactionsData.endDate) : null
                          ]}
                        />
                      </div>
                    }
                  >
                    <div style={{ height: '400px' }}>
                      <Line data={prepareDailyPerformanceData()} options={chartOptions} />
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Content>
    </>
  );
};

export default Dashboard;