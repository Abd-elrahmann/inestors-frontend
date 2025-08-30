import React from 'react';
import { Card, Table, Tag, Row, Col, Typography, Divider } from 'antd';

const { Title, Text } = Typography;

const IndividualReportContent = ({ individualReportData, currentCurrency, formatAmount }) => {
  const transactionColumns = [
    {
      title: 'التاريخ',
      dataIndex: 'transactionDate',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('en-CA'),
    },
    {
      title: 'النوع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color, text;
        switch (type) {
          case 'deposit':
            color = 'green';
            text = 'إيداع';
            break;
          case 'withdrawal':
            color = 'orange';
            text = 'سحب';
            break;
          case 'profit':
            color = 'blue';
            text = 'ربح';
            break;
          default:
            color = 'default';
            text = type;
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => formatAmount(amount * (currentCurrency === 'IQD' ? 1 : 100), record.currency),
    },
    {
      title: 'سنة الأرباح',
      dataIndex: 'profitYear',
      key: 'profitYear',
      render: (year) => year ? (
        <span style={{ color: '#28a745', fontWeight: 'bold' }}>{year}</span>
      ) : 'لا يوجد',
    },
  ];

  const profitColumns = [
    {
      title: 'السنة المالية',
      dataIndex: ['year', 'year'],
      key: 'year',
      render: (year) => <Text strong style={{ color: '#28a745' }}>{year}</Text>,
    },
    {
      title: 'مبلغ الاستثمار',
      dataIndex: 'investmentAmount',
      key: 'investmentAmount',
      render: (amount, record) => formatAmount(amount * (currentCurrency === 'IQD' ? 1 : 100), record.currency),
    },
    {
      title: 'عدد الأيام',
      dataIndex: 'totalDays',
      key: 'totalDays',
    },
    {
      title: 'الربح المحسوب',
      dataIndex: 'calculatedProfit',
      key: 'calculatedProfit',
      render: (amount, record) => formatAmount(amount * (currentCurrency === 'IQD' ? 1 : 100), record.currency),
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
        <Title level={5}>المعلومات الأساسية</Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Text strong>الاسم: </Text>
            {individualReportData.investor.fullName}
          </Col>
          <Col xs={24} md={12}>
            <Text strong>الرقم الوطني: </Text>
            {individualReportData.investor.nationalId}
          </Col>
          <Col xs={24} md={12}>
            <Text strong>مبلغ المساهمة: </Text>
            {formatAmount(
              individualReportData.investor.amountContributed * (currentCurrency === 'IQD' ? 1 : 100),
              individualReportData.investor.currency
            )}
          </Col>
          <Col xs={24} md={12}>
            <Text strong>نسبة المساهمة: </Text>
            {parseFloat((individualReportData.investor.sharePercentage || 0).toFixed(2))}%
          </Col>
        </Row>
      </Card>

      {individualReportData.transactions.length > 0 && (
        <>
          <Divider />
          <Card style={{ marginBottom: '16px' }}>
            <Title level={5}>الحركات المالية</Title>
            <Table
              columns={transactionColumns}
              dataSource={individualReportData.transactions}
              pagination={{ pageSize: 5 }}
              scroll={{ x: true }}
            />
          </Card>
        </>
      )}

      <Divider />
      <Card>
        <Title level={5}>توزيعات الأرباح</Title>
        <Table
          columns={profitColumns}
          dataSource={individualReportData.profits}
          pagination={{ pageSize: 5 }}
          scroll={{ x: true }}
          locale={{
            emptyText: 'لا توجد توزيعات أرباح لهذا المساهم'
          }}
        />
      </Card>
    </div>
  );
};

export default IndividualReportContent;