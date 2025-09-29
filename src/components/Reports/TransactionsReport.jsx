import React from "react";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { StyledTableCell, StyledTableRow } from "../../styles/TableLayout";

const TransactionsReport = ({ reportData, settings, convertCurrency }) => {
  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <StyledTableCell align="center">المستثمر</StyledTableCell>
            <StyledTableCell align="center">النوع</StyledTableCell>
            <StyledTableCell align="center">المبلغ</StyledTableCell>
            <StyledTableCell align="center">العملة</StyledTableCell>
            <StyledTableCell align="center">مصدر العملية</StyledTableCell>
            <StyledTableCell align="center">السنة المالية</StyledTableCell>
            <StyledTableCell align="center">التاريخ</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.isArray(reportData) &&
            reportData
              .filter((transaction) => transaction.status !== "CANCELED")
              .map((transaction) => (
                <StyledTableRow key={transaction.id}>
                  <StyledTableCell align="center">
                    {transaction.investors?.fullName}
                  </StyledTableCell>
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
  );
};

export default TransactionsReport;