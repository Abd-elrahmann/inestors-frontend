import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Paper, CircularProgress } from '@mui/material';
import { MdPeople as People, MdAccountBalance as AccountBalance, MdTrendingUp as TrendingUp, MdAssessment as Assessment } from 'react-icons/md';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  
  const { formatAmount, convertAmount, currentCurrency } = useCurrencyManager();

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

  useEffect(() => {
    const getSidebarState = () => {
      try {
        const savedState = localStorage.getItem('sidebarOpen');
        setIsSidebarOpen(savedState !== null ? JSON.parse(savedState) : true);
      } catch {
        setIsSidebarOpen(true);
      }
    };

    getSidebarState();
    
    const handleStorageChange = () => {
      getSidebarState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebarToggle', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData(); 
    const interval = setInterval(fetchDashboardData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency]); 

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [investorsResponse, transactionsResponse, financialYearsResponse] = await Promise.all([
        fetch('/api/investors', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/transactions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/financial-years', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const [investorsData, transactionsData, financialYearsData] = await Promise.all([
        investorsResponse.json(),
        transactionsResponse.json(),
        financialYearsResponse.json()
      ]);

      const totalCapital = await Promise.all(
        investorsData.data?.investors?.map(async investor => {
          const amount = investor.amountContributed || 0;
          return convertAmount(amount, investor.currency || 'IQD', currentCurrency);
        }) || []
      ).then(amounts => amounts.reduce((sum, amount) => sum + amount, 0));
      
      const totalProfits = await Promise.all(
        financialYearsData.data?.financialYears?.map(async year => {
          const amount = year.totalProfit || 0;
          return convertAmount(amount, year.currency || 'IQD', currentCurrency);
        }) || []
      ).then(amounts => amounts.reduce((sum, amount) => sum + amount, 0));
      
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthlyOperations = transactionsData.data?.transactions?.filter(t => 
        new Date(t.createdAt) >= monthStart).length || 0;
      
      const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastMonthOperations = transactionsData.data?.transactions?.filter(t => 
        new Date(t.createdAt) >= lastMonthStart && new Date(t.createdAt) < monthStart).length || 0;
      
      const operationsGrowth = lastMonthOperations ? 
        ((monthlyOperations - lastMonthOperations) / lastMonthOperations) * 100 : 0;
      
      setDashboardData({
        totalInvestors: investorsData.data?.investors?.length || 0,
        totalCapital,
        totalProfits,
        monthlyOperations,
        investorGrowth: 0,
        capitalGrowth: 0,
        profitGrowth: 0,
        operationsGrowth
      });
      
      await updateChartData(investorsData.data?.investors || [], 
                     transactionsData.data?.transactions || [], 
                     financialYearsData.data?.financialYears || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
          const investorJoinDate = new Date(investor.createdAt);
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
      labels: last7Days.map(date => date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })),
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
    const totalDeposits = transactions.filter(t => t.type === 'deposit').length;
    
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
      value: dashboardData.totalInvestors.toString(),
      icon: <People sx={{ fontSize: 40, color: '#28a745' }} />,
      trend: `${dashboardData.investorGrowth >= 0 ? '+' : ''}${dashboardData.investorGrowth.toFixed(1)}% عن الشهر الماضي`,
      color: '#28a745'
    },
    {
      title: `إجمالي رأس المال (${currentCurrency})`,
      value: formatAmount(dashboardData.totalCapital, currentCurrency),
      icon: <AccountBalance sx={{ fontSize: 40, color: '#007bff' }} />,
      trend: `${dashboardData.capitalGrowth >= 0 ? '+' : ''}${dashboardData.capitalGrowth.toFixed(1)}% عن الشهر الماضي`,
      color: '#007bff'
    },
    {
      title: `الأرباح المحققة (${currentCurrency})`,
      value: formatAmount(dashboardData.totalProfits, currentCurrency),
      icon: <TrendingUp sx={{ fontSize: 40, color: '#ffc107' }} />,
      trend: `${dashboardData.profitGrowth >= 0 ? '+' : ''}${dashboardData.profitGrowth.toFixed(1)}% عن الشهر الماضي`,
      color: '#ffc107'
    },
    {
      title: 'العمليات الشهرية',
      value: dashboardData.monthlyOperations.toString(),
      icon: <Assessment sx={{ fontSize: 40, color: '#dc3545' }} />,
      trend: `${dashboardData.operationsGrowth >= 0 ? '+' : ''}${dashboardData.operationsGrowth.toFixed(1)}% عن الشهر الماضي`,
      color: '#dc3545'
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
    <motion.div 
      className="content-area"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      layout={false}
      key="dashboard-page"
      style={{
        maxWidth: '1500px',
        margin: '0 auto',
        textAlign:  'center'
      }}
    >
      <motion.div 
        className="page-header"
        variants={cardVariants}
        style={{
          textAlign: 'center'
        }}
      >
        <h1 className="page-title">لوحة التحكم</h1>
        <p className="page-subtitle">تحليلات شاملة وإحصائيات مرئية لأداء النظام</p>
      </motion.div>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid 
          container 
          spacing={3} 
          mb={12}
          justifyContent={isSidebarOpen ? 'flex-start' : 'center'}
          sx={{
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {stats.map((stat, index) => (
            <Grid  xs={12} sm={6} md={3} lg={3} key={index}>
              <motion.div
                variants={cardVariants}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  sx={{ 
                    height: '230px',
                    width: '260px',
                    transition: 'all 0.3s ease',
                    background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                    border: `1px solid ${stat.color}20`,
                    '&:hover': {
                      boxShadow: `0 8px 25px ${stat.color}25`
                    }
                  }}
                >
                  <CardContent sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    fontSize: '40px'
                  }}>
                    <Box mb={2}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" component="div" gutterBottom sx={{ 
                      fontWeight: 400, 
                      color: stat.color,
                      fontFamily: 'Cairo'
                    }}>
                      <AnimatedCounter value={stat.value} duration={2000 + index * 200} />
                    </Typography>
                    <Typography variant="h6" color="text.primary" gutterBottom sx={{ 
                      fontFamily: 'Cairo',
                      fontSize: '1rem'
                    }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      fontFamily: 'Cairo',
                      color: stat.color,
                      fontWeight: 500
                    }}>
                      {stat.trend}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      
      <Grid container spacing={3}>
        <Grid  xs={12} sx={{width: '94%'}}>
          <motion.div variants={chartVariants}>
            <Paper elevation={1} sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff'
            }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ 
                  fontFamily: 'Cairo', 
                  color: '#374151', 
                  fontWeight: 600
                }}>
                  البيانات المالية للشركة
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontFamily: 'Cairo',
                  color: '#6b7280'
                }}>
                  مصدر البيانات: التقارير المالية
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {['1Y', '2Y', '5Y', '10Y', 'الكل'].map((period, index) => (
                  <Box 
                    key={period}
                    sx={{ 
                      px: 2, 
                      py: 0.5, 
                      border: index === 0 ? '1px solid #3B82F6' : '1px solid #d1d5db',
                      borderRadius: 1,
                      cursor: 'pointer',
                      backgroundColor: index === 0 ? '#eff6ff' : 'transparent',
                      color: index === 0 ? '#3B82F6' : '#6b7280'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontFamily: 'Cairo' }}>
                      {period}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ height: 400 }}>
                <Bar data={companyFinancialsData} options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'top',
                      align: 'start',
                      labels: {
                        fontFamily: 'Cairo',
                        color: '#374151',
                        usePointStyle: true,
                        padding: 20,
                        generateLabels: function(chart) {
                          const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
                          const labels = original.call(this, chart);
                          labels.forEach(label => {
                            label.pointStyle = 'rect';
                          });
                          return labels;
                        }
                      }
                    }
                  }
                }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        
        <Grid  xs={12} sx={{width: '94%'}}>
          <motion.div variants={chartVariants}>
            <Paper elevation={1} sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff'
            }}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ 
                  fontFamily: 'Cairo', 
                  color: '#374151', 
                  fontWeight: 600
                }}>
                  تاريخ الأسعار
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontFamily: 'Cairo',
                  color: '#6b7280'
                }}>
                  مصدر البيانات: السوق المالية
                </Typography>
              </Box>

              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['1W', '1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', 'الكل'].map((period, index) => (
                  <Box 
                    key={period}
                    sx={{ 
                      px: 1.5, 
                      py: 0.3, 
                      border: index === 1 ? '1px solid #10B981' : '1px solid #d1d5db',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      backgroundColor: index === 1 ? '#ecfdf5' : 'transparent',
                      color: index === 1 ? '#10B981' : '#6b7280',
                      fontSize: '0.75rem'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontFamily: 'Cairo', fontSize: '0.7rem' }}>
                      {period}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ height: 350 }}>
                <Line data={priceHistoryData} options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    x: {
                      display: true,
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: { family: 'Cairo', size: 10 },
                        color: '#9ca3af',
                        maxTicksLimit: 6
                      }
                    },
                    y: {
                      display: true,
                      position: 'right',
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: { family: 'Cairo', size: 10 },
                        color: '#9ca3af'
                      }
                    }
                  }
                }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

                
        <Grid  xs={12} md={6} sx={{width: '94%'}}>
          <motion.div variants={chartVariants}>
            <Paper elevation={1} sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              height: '100%'
            }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontFamily: 'Cairo', 
                color: '#374151', 
                fontWeight: 600,
                mb: 3
              }}>
                توزيع المحفظة الاستثمارية
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie data={portfolioData} options={{
                  ...pieChartOptions,
                  plugins: {
                    ...pieChartOptions.plugins,
                    legend: {
                      position: 'bottom',
                      labels: {
                        fontFamily: 'Cairo',
                        color: '#374151',
                        usePointStyle: true,
                        padding: 15,
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid  xs={12} md={6} sx={{width: '94%'}}>
          <motion.div variants={chartVariants}>
            <Paper elevation={1} sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              height: '100%'
            }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontFamily: 'Cairo', 
                color: '#374151', 
                fontWeight: 600,
                mb: 3
              }}>
                أداء المؤشرات اليومي
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line data={dailyPerformanceData} options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'top',
                      align: 'start',
                      labels: {
                        fontFamily: 'Cairo',
                        color: '#374151',
                        usePointStyle: true,
                        padding: 20
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: { family: 'Cairo', size: 10 },
                        color: '#9ca3af'
                      }
                    },
                    y: {
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: { family: 'Cairo', size: 10 },
                        color: '#9ca3af'
                      }
                    }
                  }
                }} />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default Dashboard; 