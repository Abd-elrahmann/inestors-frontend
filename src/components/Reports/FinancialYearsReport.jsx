import React from "react";
import {
  Divider,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { StyledTableCell, StyledTableRow } from "../../styles/TableLayout";

const FinancialYearsReport = ({ reportData, settings, convertCurrency }) => {
  return (
    <div>
      <Divider orientation="left" style={{ fontWeight: 'bold' }}>معلومات السنة المالية</Divider>
      <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">السنة</StyledTableCell>
              <StyledTableCell align="center">الفترة</StyledTableCell>
              <StyledTableCell align="center">مبلغ التوزيع</StyledTableCell>
              <StyledTableCell align="center">الحالة</StyledTableCell>
              <StyledTableCell align="center">تاريخ البداية</StyledTableCell>
              <StyledTableCell align="center">تاريخ النهاية</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <StyledTableRow>
              <StyledTableCell align="center">{reportData.year}</StyledTableCell>
              <StyledTableCell align="center">{reportData.periodName}</StyledTableCell>
              <StyledTableCell align="center">
                {convertCurrency(
                  reportData.totalProfit || 0,
                  "USD",
                  settings?.defaultCurrency
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{" "}
                {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
              </StyledTableCell>
              <StyledTableCell align="center">
                {reportData.status === "PENDING"
                  ? "في انتظار الموافقة"
                  : reportData.status === "DISTRIBUTED"
                  ? "موزع"
                  : reportData.status}
              </StyledTableCell>
              <StyledTableCell align="center">{reportData.startDate}</StyledTableCell>
              <StyledTableCell align="center">{reportData.endDate}</StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider orientation="left" style={{ fontWeight: 'bold' }}>معاملات السنة المالية</Divider>
      <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">ت</StyledTableCell>
              <StyledTableCell align="center">نوع المعاملة</StyledTableCell>
              <StyledTableCell align="center">المبلغ</StyledTableCell>
              <StyledTableCell align="center">التاريخ</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(reportData.transactions || []).map((transaction) => (
              <StyledTableRow key={transaction.id}>
                <StyledTableCell align="center">{transaction.id}</StyledTableCell>
                <StyledTableCell align="center">
                  {transaction.type === "PROFIT" ? "ربح" : transaction.type}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {convertCurrency(
                    transaction.amount || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {transaction.date?.split("T")[0]}
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider orientation="left" style={{ fontWeight: 'bold' }}>توزيعات الأرباح</Divider>
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">ت</StyledTableCell>
              <StyledTableCell align="center">المستثمر</StyledTableCell>
              <StyledTableCell align="center">المجموع</StyledTableCell>
              <StyledTableCell align="center">ايام المستثمر</StyledTableCell>
              <StyledTableCell align="center">الربح اليومي</StyledTableCell>
              <StyledTableCell align="center">المجموع</StyledTableCell>
              <StyledTableCell align="center">تاريخ المساهمة</StyledTableCell>
              <StyledTableCell align="center">تاريخ الموافقة</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(reportData.profitDistributions || []).map((distribution, index) => (
              <StyledTableRow key={index}>
                <StyledTableCell align="center">
                  {distribution.investors?.id || "-"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {distribution.investors?.fullName || "-"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {convertCurrency(
                    distribution.amount || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {distribution.daysSoFar || "-"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {convertCurrency(
                    distribution.dailyProfit || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {convertCurrency(
                    distribution.totalProfit || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {distribution.investors?.createdAt || "-"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {reportData.approvedAt || "-"}
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FinancialYearsReport;