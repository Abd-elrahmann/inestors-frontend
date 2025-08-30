import React from 'react';
import { Card, Table, Tag, Row, Col, Typography } from 'antd';

const { Title, Text } = Typography;

const FinancialYearReport = ({ financialYearReportData, currentCurrency, formatAmount }) => {
  if (!financialYearReportData) return null;

  const distributionColumns = [
    {
      title: 'المساهم',
      dataIndex: ['investorId', 'fullName'],
      key: 'investor',
      render: (text) => text || 'غير محدد',
    },
    {
      title: 'المبلغ المستثمر',
      dataIndex: ['calculation', 'investmentAmount'],
      key: 'investmentAmount',
      render: (amount, record) => 
        formatAmount(amount / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), record.currency),
    },
    {
      title: 'عدد الأيام',
      dataIndex: ['calculation', 'totalDays'],
      key: 'totalDays',
    },
    {
      title: 'الربح المحسوب',
      dataIndex: ['calculation', 'calculatedProfit'],
      key: 'calculatedProfit',
      render: (amount, record) => 
        formatAmount(amount / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), record.currency),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color, text;
        switch (status) {
          case 'calculated':
            color = 'blue';
            text = 'محسوب';
            break;
          case 'approved':
            color = 'orange';
            text = 'موافق عليه';
            break;
          case 'distributed':
            color = 'green';
            text = 'موزع';
            break;
          case 'pending':
            color = 'default';
            text = 'قيد الانتظار';
            break;
          default:
            color = 'default';
            text = status;
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Title level={5}>معلومات السنة المالية</Title>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Text strong>السنة: </Text>
            {financialYearReportData.year}
          </Col>
          <Col xs={24} md={8}>
            <Text strong>تاريخ البداية: </Text>
            {new Date(financialYearReportData.startDate).toLocaleDateString()}
          </Col>
          <Col xs={24} md={8}>
            <Text strong>تاريخ النهاية: </Text>
            {new Date(financialYearReportData.endDate).toLocaleDateString()}
          </Col>
          <Col xs={24} md={8}>
            <Text strong>إجمالي الأيام: </Text>
            {financialYearReportData.totalDays - 1}
          </Col>
          <Col xs={24} md={8}>
            <Text strong>إجمالي الربح: </Text>
            {formatAmount(
              financialYearReportData.totalProfit / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), 
              financialYearReportData.currency
            )}
          </Col>
          <Col xs={24} md={8}>
            <Text strong>معدل الربح اليومي: </Text>
            {financialYearReportData.dailyProfitRate?.toFixed(6)}
          </Col>
        </Row>
      </Card>

      {financialYearReportData.distributions?.length > 0 && (
        <Card>
          <Title level={5}>توزيعات الأرباح</Title>
          <Table
            columns={distributionColumns}
            dataSource={financialYearReportData.distributions}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>
      )}
    </div>
  );
};

export default FinancialYearReport;