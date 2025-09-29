import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  Checkbox,
  TableSortLabel
} from "@mui/material";
import { EditOutlined, DeleteOutlined, CloseOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { StyledTableCell, StyledTableRow } from "../../styles/TableLayout";

const TransactionsTable = ({
  transactionsData,
  isLoading,
  isFetching,
  selectedIds,
  onSelectAll,
  onSelectOne,
  orderBy,
  order,
  onRequestSort,
  settings,
  onCancelTransaction,
  onDeleteTransaction,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  convertCurrency,
  isAdmin,
  transactions = []
}) => {
  const totalTransactions = transactionsData?.totalTransactions || 0;
  const totalPages = transactionsData?.totalPages || 0;

  const createSortHandler = (property) => () => {
    onRequestSort(property);
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "ايداع";
      case "WITHDRAWAL":
        return "سحب";
      case "PROFIT":
        return "ربح";
      default:
        return "غير محدد";
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "DEPOSIT":
        return "warning";
      case "WITHDRAWAL":
        return "error";
      case "PROFIT":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: 650, scrollbarWidth: "none" }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell padding="checkbox">
              <Checkbox
                style={{ color: "white" }}
                checked={
                  selectedIds.length === transactions.length &&
                  transactions.length > 0
                }
                indeterminate={
                  selectedIds.length > 0 &&
                  selectedIds.length < transactions.length
                }
                onChange={onSelectAll}
              />
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "id"}
                direction={orderBy === "id" ? order : "asc"}
                onClick={createSortHandler("id")}
                sx={{ color: "white !important" }}
              >
                ت
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "investors.fullName"}
                direction={orderBy === "investors.fullName" ? order : "asc"}
                onClick={createSortHandler("investors.fullName")}
                sx={{ color: "white !important" }}
              >
                اسم المساهم
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "type"}
                direction={orderBy === "type" ? order : "asc"}
                onClick={createSortHandler("type")}
                sx={{ color: "white !important" }}
              >
                نوع المعاملة
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "amount"}
                direction={orderBy === "amount" ? order : "asc"}
                onClick={createSortHandler("amount")}
                sx={{ color: "white !important" }}
              >
                المبلغ ({settings?.defaultCurrency})
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "currency"}
                direction={orderBy === "currency" ? order : "asc"}
                onClick={createSortHandler("currency")}
                sx={{ color: "white !important" }}
              >
                العملة
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "withdrawSource"}
                direction={orderBy === "withdrawSource" ? order : "asc"}
                onClick={createSortHandler("withdrawSource")}
                sx={{ color: "white !important" }}
              >
                مصدر العملية
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "financialYear.year"}
                direction={orderBy === "financialYear.year" ? order : "asc"}
                onClick={createSortHandler("financialYear.year")}
                sx={{ color: "white !important" }}
              >
                السنة المالية
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "date"}
                direction={orderBy === "date" ? order : "asc"}
                onClick={createSortHandler("date")}
                sx={{ color: "white !important" }}
              >
                تاريخ المعاملة
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "status"}
                direction={orderBy === "status" ? order : "asc"}
                onClick={createSortHandler("status")}
                sx={{ color: "white !important" }}
              >
                الحالة
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              الغاء العملية
            </StyledTableCell>
            {isAdmin && (
              <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                حذف
              </StyledTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading || isFetching ? (
            <StyledTableRow>
              <StyledTableCell colSpan={isAdmin ? 12 : 11} align="center">
                <Spin size="large" />
              </StyledTableCell>
            </StyledTableRow>
          ) : transactions.length === 0 ? (
            <StyledTableRow>
              <StyledTableCell colSpan={isAdmin ? 12 : 11} align="center">
                لا توجد معاملات
              </StyledTableCell>
            </StyledTableRow>
          ) : (
            transactions.map((transaction) => (
              <StyledTableRow key={transaction.id}>
                <StyledTableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(transaction.id)}
                    onChange={(event) =>
                      onSelectOne(event, transaction.id)
                    }
                  />
                </StyledTableCell>
                <StyledTableCell align="center">
                  {transaction.id || "غير محدد"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {transaction.investors?.fullName || "غير محدد"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  <Chip
                    label={getTransactionTypeLabel(transaction.type)}
                    color={getTransactionTypeColor(transaction.type)}
                    variant="outlined"
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                </StyledTableCell>
                <StyledTableCell align="center">
                  {convertCurrency(
                    transaction.amount,
                    transaction.currency || "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits:
                      settings?.defaultCurrency === "USD" ? 2 : 0,
                    maximumFractionDigits:
                      settings?.defaultCurrency === "USD" ? 2 : 0,
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
                <StyledTableCell align="center">
                  {transaction.date ? transaction.date : "-"}
                </StyledTableCell>
                <StyledTableCell align="center">
                  {transaction.status === "CANCELED" ? (
                    <Chip
                      label="ملغاة"
                      color="error"
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    "-"
                  )}
                </StyledTableCell>
                <StyledTableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onCancelTransaction(transaction)}
                    disabled={transaction.status === "CANCELED"}
                  >
                    <CloseOutlined />
                  </IconButton>
                </StyledTableCell>
                {isAdmin && (
                  <StyledTableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteTransaction(transaction)}
                    >
                      <DeleteOutlined />
                    </IconButton>
                  </StyledTableCell>
                )}
              </StyledTableRow>
            ))
          )}
        </TableBody>
      </Table>
      {isAdmin && (
        <TablePagination
          component="div"
          count={totalTransactions}
          totalPages={totalPages}
          page={page - 1}
          onPageChange={(e, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="عدد الصفوف في الصفحة"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
        />
      )}
    </TableContainer>
  );
};

export default TransactionsTable;