import React from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  DatePicker,
} from "antd";
import {
  EyeOutlined,
} from "@ant-design/icons";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CalendarIcon from "@mui/icons-material/CalendarToday";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const ReportFilters = ({
  reportType,
  selectedInvestor,
  onInvestorChange,
  onInvestorSearch,
  investors,
  investorsLoading,
  selectedFinancialYear,
  onFinancialYearChange,
  onFinancialYearSearch,
  financialYears,
  financialYearsLoading,
  dateRange,
  onDateRangeChange,
  onGenerateReport,
  onCancel,
  previewLoading
}) => {
  if (!reportType) return null;

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
      }}
      styles={{
        body: { padding: 16 }
      }}
    >
      <Row gutter={[24, 24]} align="middle" justify="center">
        {reportType === "individual" && (
          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              اختر مستثمر
            </Text>
            <Autocomplete
              options={investors}
              getOptionLabel={(option) => `${option.fullName}`}
              value={selectedInvestor}
              onChange={(event, newValue) => {
                onInvestorChange(newValue);
              }}
              onInputChange={(event, value) => {
                onInvestorSearch(value);
              }}
              filterOptions={(x) => x}
              loading={investorsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ابحث عن المساهم"
                  placeholder="اكتب اسم المساهم للبحث..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: "#28a745" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {investorsLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              style={{ display: "flex", justifyContent: "center" }}
            />
          </Col>
        )}

        {(reportType === "individual" || reportType === "financial-year" || reportType === "transactions") && (
          <Col xs={24} sm={12} md={6}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              {reportType === "financial-year" 
                ? "اختر سنة مالية"
                : "اختر سنة مالية (اختياري)"}
            </Text>
            <Autocomplete
              options={financialYears}
              getOptionLabel={(option) => option.periodName}
              value={selectedFinancialYear}
              onChange={(event, newValue) => {
                onFinancialYearChange(newValue);
              }}
              onInputChange={(event, value) => {
                onFinancialYearSearch(value);
              }}
              filterOptions={(x) => x}
              loading={financialYearsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="اكتب السنة المالية للبحث..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon style={{ color: "#28a745" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {financialYearsLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option?.periodName === value?.periodName}
              style={{ display: "flex", justifyContent: "center" }}
            />
          </Col>
        )}

        {(reportType === "investors" || reportType === "transactions") && (
          <Col
            xs={24}
            sm={16}
            md={8}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <Text strong style={{ marginBottom: 8 }}>
              اختر نطاق التاريخ
            </Text>
            <RangePicker
              style={{ width: "100%" }}
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder={["تاريخ البداية", "تاريخ النهاية"]}
              allowClear
            />
          </Col>
        )}

        <Col
          xs={24}
          sm={24}
          md={
            reportType === "individual"
              ? 6
              : reportType === "financial-year"
              ? 6
              : 8
          }
        >
          <Space
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 25,
            }}
          >
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={onGenerateReport}
              loading={previewLoading}
              style={{
                backgroundColor: "#28a745",
                borderColor: "#28a745",
                width: 140,
              }}
            >
              معاينة التقرير
            </Button>
            <Button
              onClick={onCancel}
              style={{ width: 80 }}
            >
              إلغاء
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ReportFilters;