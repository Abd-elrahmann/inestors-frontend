import React from 'react';
import { Card, Form, Button, Select, DatePicker, Row, Col, Spin, AutoComplete } from 'antd';
import {
  FileSearchOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ReportFilters = ({
  selectedReport,
  dateRange,
  setDateRange,
  investors,
  selectedInvestor,
  setSelectedInvestor,
  financialYears,
  selectedFinancialYear,
  setSelectedFinancialYear,
  reportGenerating,
  financialYearReportLoading,
  handleGenerateReport,
  handleGenerateIndividualReport,
  setIndividualReportOpen
}) => {
  if (!selectedReport) return null;

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Form layout="vertical">
        {selectedReport === "individual_investor" && (
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <Form.Item label="اختر المساهم">
                <Select
                  showSearch
                  placeholder="ابحث عن مساهم"
                  optionFilterProp="children"
                  value={selectedInvestor?._id}
                  onChange={(value) => setSelectedInvestor(investors.find(inv => inv._id === value))}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {investors.map(investor => (
                    <Option key={investor._id} value={investor._id}>
                      {investor.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Button
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={async () => {
                  await handleGenerateIndividualReport();
                  setIndividualReportOpen(true);
                }}
                disabled={!selectedInvestor}
                loading={reportGenerating}
                style={{ width: '100%', height: '40px',backgroundColor: '#28a745', borderColor: '#28a745',color: 'white' }}
              >
                إنشاء تقرير المساهم
              </Button>
            </Col>
          </Row>
        )}

        {selectedReport === "financial_year" && (
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <Form.Item label="اختر السنة المالية">
                <Select
                  placeholder="اختر السنة المالية"
                  value={selectedFinancialYear?._id}
                  onChange={(value) => setSelectedFinancialYear(financialYears.find(fy => fy._id === value))}
                >
                  {financialYears.map(year => (
                    <Option key={year._id} value={year._id}>
                      {year.year}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={handleGenerateReport}
                disabled={!selectedFinancialYear}
                loading={financialYearReportLoading}
                style={{ width: '100%', height: '40px',backgroundColor: '#28a745', borderColor: '#28a745',color: 'white' }}
              >
                إنشاء التقرير
              </Button>
            </Col>
          </Row>
        )}

        {(selectedReport === "investors_summary" || selectedReport === "financial_transactions") && (
          <Row gutter={16} align="middle">
            <Col xs={24} md={selectedReport === "investors_summary" ? 16 : 12}>
              <Form.Item label={selectedReport === "investors_summary" ? "الفترة الزمنية (اختياري)" : "الفترة الزمنية (مطلوب)"}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={selectedReport === "investors_summary" ? 8 : 12}>
              <Button
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={handleGenerateReport}
                disabled={selectedReport === "financial_transactions" && dateRange.length !== 2}
                loading={reportGenerating}
                style={{ width: '100%', height: '40px',backgroundColor: '#28a745', borderColor: '#28a745',color: 'white' }}
              >
                إنشاء التقرير
              </Button>
            </Col>
          </Row>
        )}
      </Form>
    </Card>
  );
};

export default ReportFilters;