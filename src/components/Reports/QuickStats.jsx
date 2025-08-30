import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  TransactionOutlined,
  RiseOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const QuickStats = ({ quickStats, currentCurrency, formatAmount }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="إجمالي المساهمين"
            value={quickStats.totalInvestors}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#28a745' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="إجمالي رأس المال"
            value={formatAmount(quickStats.totalCapital / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5))}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="العمليات الشهرية"
            value={quickStats.monthlyOperations}
            prefix={<TransactionOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="إجمالي الأرباح"
            value={formatAmount(quickStats.totalProfits / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5))}
            prefix={<RiseOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default QuickStats;