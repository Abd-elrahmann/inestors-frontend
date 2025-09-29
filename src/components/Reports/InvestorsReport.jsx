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

const InvestorsReport = ({ reportData, reportType, settings, convertCurrency }) => {
  if (reportType === "investors") {
    return (
      <TableContainer
        component={Paper}
        sx={{ maxHeight: 650, marginTop: 2 }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">الاسم</StyledTableCell>
              <StyledTableCell align="center">الهاتف</StyledTableCell>
              <StyledTableCell align="center">رأس المال</StyledTableCell>
              <StyledTableCell align="center">مبلغ الربح</StyledTableCell>
              <StyledTableCell align="center">المجموع</StyledTableCell>
              <StyledTableCell align="center">تاريخ الانضمام</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(reportData) &&
              reportData.map((row) => (
                <StyledTableRow key={row.id}>
                  <StyledTableCell align="center">{row.fullName}</StyledTableCell>
                  <StyledTableCell align="center">{row.phone || "-"}</StyledTableCell>
                  <StyledTableCell align="center">
                    {convertCurrency(
                      row.amount || 0,
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
                      row.rollover_amount || 0,
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
                      row.amount + row.rollover_amount || 0,
                      "USD",
                      settings?.defaultCurrency
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    })}{" "}
                    {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                  </StyledTableCell>
                  <StyledTableCell align="center">{row.createdAt}</StyledTableCell>
                </StyledTableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (reportType === "individual") {
    return (
      <div>
        <Divider orientation="left" style={{ fontWeight: 'bold' }}>معلومات المستثمر</Divider>
        <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">الاسم</StyledTableCell>
                <StyledTableCell align="center">الهاتف</StyledTableCell>
                <StyledTableCell align="center">رأس المال</StyledTableCell>
                <StyledTableCell align="center">مبلغ الربح</StyledTableCell>
                <StyledTableCell align="center">المجموع</StyledTableCell>
                <StyledTableCell align="center">تاريخ الانضمام</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <StyledTableRow>
                <StyledTableCell align="center">{reportData.fullName}</StyledTableCell>
                <StyledTableCell align="center">{reportData.phone || "-"}</StyledTableCell>
                <StyledTableCell align="center">
                  {convertCurrency(
                    reportData.amount || 0,
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
                    reportData.rollover_amount || 0,
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
                    reportData.amount + reportData.rollover_amount || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center">{reportData.createdAt}</StyledTableCell>
              </StyledTableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Divider orientation="left" style={{ fontWeight: 'bold' }}>المعاملات</Divider>
        <TableContainer component={Paper} sx={{ marginTop: 2, marginBottom: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">النوع</StyledTableCell>
                <StyledTableCell align="center">المبلغ</StyledTableCell>
                <StyledTableCell align="center">العملة</StyledTableCell>
                <StyledTableCell align="center">مصدر العملية</StyledTableCell>
                <StyledTableCell align="center">السنة المالية</StyledTableCell>
                <StyledTableCell align="center">التاريخ</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(reportData.transactions || [])
                .filter((transaction) => transaction.status !== "CANCELED")
                .map((transaction) => (
                  <StyledTableRow key={transaction.id}>
                    <StyledTableCell align="center">
                      {transaction.type === "DEPOSIT"
                        ? "إيداع"
                        : transaction.type === "WITHDRAWAL"
                        ? "سحب"
                        : transaction.type === "PROFIT"
                        ? "ربح"
                        : "-"}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {convertCurrency(
                        transaction.amount || 0,
                        transaction.currency || "USD",
                        settings?.defaultCurrency
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                        maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      })}{" "}
                      {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {transaction.currency || "USD"}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {transaction.withdrawSource === "AMOUNT_ROLLOVER"
                        ? " مبلغ الربح + رأس المال"
                        : transaction.withdrawSource === "ROLLOVER"
                        ? "مبلغ الربح"
                        : "-"}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {transaction.financialYear?.year || "-"}{" "}
                      {transaction.financialYear?.periodName
                        ? `- ${transaction.financialYear.periodName}`
                        : ""}
                    </StyledTableCell>
                    <StyledTableCell align="center">{transaction.date}</StyledTableCell>
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider orientation="left" style={{ fontWeight: 'bold' }}>توزيعات الأرباح</Divider>
        <TableContainer component={Paper} sx={{ marginTop: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">السنة المالية</StyledTableCell>
                <StyledTableCell align="center">رأس المال</StyledTableCell>
                <StyledTableCell align="center">العملة</StyledTableCell>
                <StyledTableCell align="center">الربح اليومي</StyledTableCell>
                <StyledTableCell align="center">إجمالي الربح</StyledTableCell>
                <StyledTableCell align="center">تاريخ الموافقة</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(reportData.profitDistributions || []).map((distribution) => (
                <StyledTableRow key={distribution.financialYear.year}>
                  <StyledTableCell align="center">{`${distribution.financialYear.year} - ${distribution.financialYear.periodName}`}</StyledTableCell>
                  <StyledTableCell align="center">
                    {convertCurrency(
                      distribution.amount || 0,
                      "USD",
                      settings?.defaultCurrency
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    })}{" "}
                    {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {distribution.currency || "USD"}
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
                      distribution.financialYear.totalRollover || 0,
                      "USD",
                      settings?.defaultCurrency
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    })}{" "}
                    {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {distribution.financialYear.approvedAt}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }

  return null;
};

export default InvestorsReport;