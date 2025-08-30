import React from 'react';
import { Card, Typography, Grid, Space } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  TableOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const reportTypes = [
  {
    id: "investors_summary",
    title: "تقرير المساهمين",
    description: "ملخص شامل لجميع المساهمين ومساهماتهم",
    icon: <UserOutlined style={{ fontSize: '32px', color: "#28a745" }} />,
  },
  {
    id: "financial_transactions",
    title: "تقرير العمليات المالية",
    description: "تفاصيل جميع العمليات المالية في فترة محددة",
    icon: <DollarOutlined style={{ fontSize: '32px', color: "#28a745" }} />,
  },
  {
    id: "individual_investor",
    title: "تقرير مساهم فردي",
    description: "تقرير مفصل لمساهم واحد مع جميع حركاته المالية والأرباح",
    icon: <FileTextOutlined style={{ fontSize: '32px', color: "#28a745" }} />,
  },
  {
    id: "financial_year",
    title: "تقرير السنة المالية",
    description: "تقرير تفصيلي عن السنة المالية وتوزيعات الأرباح",
    icon: <TableOutlined style={{ fontSize: '32px', color: "#28a745" }} />,
  }
];

const ReportTypeSelector = ({ selectedReport, setSelectedReport }) => {
  const screens = useBreakpoint();

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4} style={{ textAlign: 'center', marginBottom: '24px' }}>
        اختيار التقرير
      </Title>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: screens.xs ? '1fr' : screens.md ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px' 
      }}>
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            hoverable
            onClick={() => setSelectedReport(report.id)}
            style={{
              cursor: 'pointer',
              border: selectedReport === report.id ? '2px solid #28a745' : '1px solid #d9d9d9',
              boxShadow: selectedReport === report.id ? '0 4px 12px rgba(40, 167, 69, 0.15)' : 'none',
              transition: 'all 0.3s ease',
            }}
            styles={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            {report.icon}
            <Title level={5} style={{ margin: 0 }}>
              {report.title}
            </Title>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              {report.description}
            </p>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default ReportTypeSelector;