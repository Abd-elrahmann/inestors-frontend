import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Row,
  Col,
  Button,
  Typography,
  Space,
  Spin,
  Card,
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { toast } from "react-toastify";
// Components
import ReportCard from "../../components/Reports/ReportCard";
import ReportFilters from "../../components/Reports/ReportFilters";
import InvestorsReport from "../../components/Reports/InvestorsReport";
import TransactionsReport from "../../components/Reports/TransactionsReport";
import FinancialYearsReport from "../../components/Reports/FinancialYearsReport";

// API
import { reportsApi } from "./reportsApi";
import { useSettings } from "../../hooks/useSettings";
import {
  exportToExcel,
  exportIndividualInvestorToPDF,
  exportFinancialYearToPDF,
  exportAllInvestorsToPDF,
  exportTransactionsToPDF,
} from "../../utils/reportExporter";

const { Title, Text } = Typography;

const Reports = () => {
  const { data: settings } = useSettings();
  const [reportType, setReportType] = useState("");
  const [investors, setInvestors] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const printRef = useRef();

  // Memoized currency converter
  const convertCurrency = useCallback((amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!settings?.USDtoIQD) return amount;

    if (fromCurrency === "IQD" && toCurrency === "USD") {
      return amount / settings.USDtoIQD;
    } else if (fromCurrency === "USD" && toCurrency === "IQD") {
      return amount * settings.USDtoIQD;
    }
    return amount;
  }, [settings?.USDtoIQD]);

  // Fetch initial data
  useEffect(() => {
    fetchInvestors();
    fetchFinancialYears();
  }, []);

  // Reset form when report type changes
  useEffect(() => {
    setReportData([]);
    setSelectedInvestor(null);
    setSelectedFinancialYear(null);
    setDateRange([]);
  }, [reportType]);

  // Debounced search functions
  const debouncedSearch = useMemo(
    () => debounce((searchTerm) => {
      fetchInvestors(searchTerm);
    }, 1000),
    []
  );

  const debouncedFinancialYearsSearch = useMemo(
    () => debounce((searchTerm) => {
      fetchFinancialYears(searchTerm);
    }, 1000),
    []
  );

  // API functions
  const fetchInvestors = async (searchTerm = "") => {
    try {
      setInvestorsLoading(true);
      const response = await reportsApi.getInvestors(searchTerm);
      
      if (response.data?.investors) {
        setInvestors(response.data.investors);
      } else {
        setInvestors([]);
      }
    } catch (error) {
      console.error("Error fetching investors:", error);
      toast.error("فشل في تحميل قائمة المستثمرين");
      setInvestors([]);
    } finally {
      setInvestorsLoading(false);
    }
  };

  const fetchFinancialYears = async (searchTerm = '') => {
    try {
      setFinancialYearsLoading(true);
      const response = await reportsApi.getFinancialYears(searchTerm);

      if (response.data?.years) {
        setFinancialYears(response.data.years);
      } else {
        setFinancialYears([]);
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
      toast.error('فشل في تحميل قائمة السنوات المالية');
      setFinancialYears([]);
    } finally {
      setFinancialYearsLoading(false);
    }
  };

  const generateReport = async () => {
    setPreviewLoading(true);
    try {
      let response;
      const params = {};

      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format("YYYY-MM-DD");
        params.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      switch (reportType) {
        case "investors":
          response = await reportsApi.getInvestorsReport(params);
          break;
        case "individual":
          if (!selectedInvestor) {
            toast.error("يجب اختيار مساهم اولا");
            setPreviewLoading(false);
            return;
          }
          response = await reportsApi.getIndividualInvestorReport(
            selectedInvestor.id,
            selectedFinancialYear?.periodName
          );
          break;
        case "transactions":
          if (selectedFinancialYear?.periodName) {
            params.periodName = selectedFinancialYear.periodName;
          }
          response = await reportsApi.getTransactionsReport(params);
          break;
        case "financial-year":
          if (!selectedFinancialYear) {
            toast.error("يجب اختيار سنة مالية");
            setPreviewLoading(false);
            return;
          }
          response = await reportsApi.getFinancialYearReport(selectedFinancialYear.periodName);
          break;
        default:
          break;
      }

      setReportData(response?.data || []);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const exportReport = (format) => {
    if (
      !reportData ||
      (Array.isArray(reportData) && reportData.length === 0) ||
      (typeof reportData === "object" && Object.keys(reportData).length === 0)
    ) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    try {
      switch (format) {
        case "excel":
          exportToExcel(reportData, reportType);
          break;
        case "pdf":
          if (reportType === "individual") {
            exportIndividualInvestorToPDF(reportData);
          } else if (reportType === "financial-year") {
            exportFinancialYearToPDF(reportData);
          } else if (reportType === "investors") {
            exportAllInvestorsToPDF(reportData);
          } else if (reportType === "transactions") {
            exportTransactionsToPDF(reportData);
          } else {
            toast.error("التصدير إلى PDF غير متاح لهذا النوع من التقارير");
          }
          break;
        default:
          break;
      }
      toast.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("فشل في تصدير التقرير");
    }
  };

  const printReport = () => {
    if (
      !reportData ||
      (Array.isArray(reportData) && reportData.length === 0) ||
      (typeof reportData === "object" && Object.keys(reportData).length === 0)
    ) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }

    const printContent = printRef.current;
    if (!printContent) {
      toast.error("فشل في تحضير المحتوى للطباعة");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    let reportTitle = "تقرير";
    switch (reportType) {
      case "investors":
        reportTitle = "تقرير جميع المستثمرين";
        break;
      case "individual":
        reportTitle = `تقرير المستثمر - ${reportData.fullName || ""}`;
        if (selectedFinancialYear) {
          reportTitle += ` - السنة المالية: ${selectedFinancialYear.periodName}`;
        }
        break;
      case "transactions":
        reportTitle = "تقرير المعاملات";
        break;
      case "financial-year":
        reportTitle = `تقرير السنة المالية - ${selectedFinancialYear?.periodName || ""}`;
        break;
      default:
        break;
    }

    const printHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            direction: rtl;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #28a745;
            padding-bottom: 10px;
          }
          .print-title {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
          }
          .print-date {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #28a745;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 25px;
            margin-bottom: 10px;
            color: #28a745;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 15px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${reportTitle}</div>
          <div class="print-date">تاريخ التقرير: ${new Date().toLocaleDateString("ar-EG")}</div>
        </div>
        ${printContent.innerHTML}
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.onload = function () {
      printWindow.print();
    };
  };

  const renderReportPreview = () => {
    if (previewLoading) {
      return (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      );
    }

    if (
      !reportData ||
      (Array.isArray(reportData) && reportData.length === 0) ||
      (typeof reportData === "object" && Object.keys(reportData).length === 0)
    ) {
      return (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Text>لا توجد بيانات للعرض</Text>
        </div>
      );
    }

    switch (reportType) {
      case "investors":
      case "individual":
        return (
          <InvestorsReport
            reportData={reportData}
            reportType={reportType}
            settings={settings}
            convertCurrency={convertCurrency}
          />
        );
      case "transactions":
        return (
          <TransactionsReport
            reportData={reportData}
            settings={settings}
            convertCurrency={convertCurrency}
          />
        );
      case "financial-year":
        return (
          <FinancialYearsReport
            reportData={reportData}
            settings={settings}
            convertCurrency={convertCurrency}
          />
        );
      default:
        return null;
    }
  };

  const renderReportOptions = () => (
    <Row gutter={[24, 24]} justify="center" style={{ marginBottom: 20 }}>
      <Col xs={24} sm={12} md={6}>
        <ReportCard
          type="investors"
          title="جميع المستثمرين"
          isActive={reportType === "investors"}
          onClick={() => setReportType("investors")}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <ReportCard
          type="individual"
          title="مستثمر فردي"
          isActive={reportType === "individual"}
          onClick={() => setReportType("individual")}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <ReportCard
          type="transactions"
          title="تقرير المعاملات"
          isActive={reportType === "transactions"}
          onClick={() => setReportType("transactions")}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <ReportCard
          type="financial-year"
          title="سنة مالية"
          isActive={reportType === "financial-year"}
          onClick={() => setReportType("financial-year")}
        />
      </Col>
    </Row>
  );

  const handleCancel = () => {
    setReportType("");
    setReportData([]);
    setSelectedInvestor(null);
    setSelectedFinancialYear(null);
    setDateRange([]);
  };

  const hasReportData = reportData && 
    (Array.isArray(reportData) ? reportData.length > 0 : Object.keys(reportData).length > 0);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Helmet>
        <title>التقارير</title>
        <meta name="description" content="التقارير في نظام إدارة المساهمين" />
      </Helmet>
      
      <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
        التقارير
      </Title>

      {renderReportOptions()}
      
      <ReportFilters
        reportType={reportType}
        selectedInvestor={selectedInvestor}
        onInvestorChange={setSelectedInvestor}
        onInvestorSearch={debouncedSearch}
        investors={investors}
        investorsLoading={investorsLoading}
        selectedFinancialYear={selectedFinancialYear}
        onFinancialYearChange={setSelectedFinancialYear}
        onFinancialYearSearch={debouncedFinancialYearsSearch}
        financialYears={financialYears}
        financialYearsLoading={financialYearsLoading}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onGenerateReport={generateReport}
        onCancel={handleCancel}
        previewLoading={previewLoading}
      />

      {hasReportData && (
        <>
          <Row justify="end" style={{ marginBottom: 16 }}>
            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={printReport}
                style={{
                  color: "#28a745",
                  borderColor: "#28a745",
                }}
              >
                طباعة
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportReport("excel")}
                style={{
                  color: "#28a745",
                  borderColor: "#28a745",
                }}
              >
                تصدير لإكسل
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportReport("pdf")}
                style={{
                  color: "#28a745",
                  borderColor: "#28a745",
                }}
              >
                تصدير لPDF
              </Button>
            </Space>
          </Row>

          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          >
            <div ref={printRef}>{renderReportPreview()}</div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;