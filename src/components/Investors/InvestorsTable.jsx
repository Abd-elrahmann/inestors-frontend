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
  Checkbox,
  TableSortLabel
} from "@mui/material";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import { StyledTableCell, StyledTableRow } from "../../styles/TableLayout";

const InvestorsTable = ({
  investorsData,
  isLoading,
  isFetching,
  selectedIds,
  onSelectAll,
  onSelectOne,
  orderBy,
  order,
  onRequestSort,
  settings,
  onEditInvestor,
  onDeleteInvestor,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  convertCurrency
}) => {
  const filteredInvestors = investorsData?.investors || [];
  const totalPages = investorsData?.totalPages || 0;
  const totalInvestors = investorsData?.totalInvestors || 0;

  const createSortHandler = (property) => () => {
    onRequestSort(property);
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
                  selectedIds.length === filteredInvestors.length &&
                  filteredInvestors.length > 0
                }
                indeterminate={
                  selectedIds.length > 0 &&
                  selectedIds.length < filteredInvestors.length
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
                active={orderBy === "fullName"}
                direction={orderBy === "fullName" ? order : "asc"}
                onClick={createSortHandler("fullName")}
                sx={{ color: "white !important" }}
              >
                اسم المستثمر
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap", width: "70px" }}>
              <TableSortLabel
                active={orderBy === "phone"}
                direction={orderBy === "phone" ? order : "asc"}
                onClick={createSortHandler("phone")}
                sx={{ color: "white !important" }}
              >
                الهاتف
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "amount"}
                direction={orderBy === "amount" ? order : "asc"}
                onClick={createSortHandler("amount")}
                sx={{ color: "white !important" }}
              >
                رأس المال ({settings?.defaultCurrency})
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "rollover_amount"}
                direction={orderBy === "rollover_amount" ? order : "asc"}
                onClick={createSortHandler("rollover_amount")}
                sx={{ color: "white !important" }}
              >
                مبلغ الربح ({settings?.defaultCurrency})
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "total_amount"}
                direction={orderBy === "total_amount" ? order : "asc"}
                onClick={createSortHandler("total_amount")}
                sx={{ color: "white !important" }}
              >
                المجموع ({settings?.defaultCurrency})
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "sharePercentage"}
                direction={orderBy === "sharePercentage" ? order : "asc"}
                onClick={createSortHandler("sharePercentage")}
                sx={{ color: "white !important" }}
              >
                نسبة المستثمر
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              <TableSortLabel
                active={orderBy === "createdAt"}
                direction={orderBy === "createdAt" ? order : "asc"}
                onClick={createSortHandler("createdAt")}
                sx={{ color: "white !important" }}
              >
                تاريخ الانضمام
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              عرض المعاملات
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              تعديل
            </StyledTableCell>
            <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
              حذف
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading || isFetching ? (
            <StyledTableRow>
              <StyledTableCell colSpan={11} align="center">
                <Spin style={{ marginLeft: "100px" }} size="large" />
              </StyledTableCell>
            </StyledTableRow>
          ) : !investorsData?.investors?.length ? (
            <StyledTableRow>
              <StyledTableCell colSpan={11} align="center">
                لا يوجد مستثمرين
              </StyledTableCell>
            </StyledTableRow>
          ) : (
            <>
              {filteredInvestors.map((investor) => (
                <StyledTableRow key={investor.id}>
                  <StyledTableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(investor.id)}
                      onChange={(event) => onSelectOne(event, investor.id)}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {investor.id}
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {investor.fullName}
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap", width: "70px" }}>
                    {investor.phone || "-"}
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {convertCurrency(
                      investor.amount,
                      "USD",
                      settings?.defaultCurrency
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    })}{" "}
                    {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {convertCurrency(
                      investor.rollover || 0,
                      "USD",
                      settings?.defaultCurrency
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    })}{" "}
                    {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {convertCurrency(
                      investor.totalAmount,
                      "USD",
                      settings?.defaultCurrency
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                      maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    })}{" "}
                    {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                  </StyledTableCell>
                  <StyledTableCell align="center">{`${investor.sharePercentage.toFixed(2)}%`}</StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    {investor.createdAt || "-"}
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <Link to={`/transactions/${investor.id}`}>
                      <IconButton size="small">
                        <EyeOutlined style={{ color: "green" }} />
                      </IconButton>
                    </Link>
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onEditInvestor(investor)}
                    >
                      <EditOutlined style={{ color: "blue" }} />
                    </IconButton>
                  </StyledTableCell>
                  <StyledTableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteInvestor(investor)}
                    >
                      <DeleteOutlined style={{ color: "red" }} />
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
              <StyledTableRow>
                <StyledTableCell colSpan={4} align="center" sx={{ fontWeight: "bold" }}>
                  الإجمالي
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                  {convertCurrency(
                    investorsData?.totalAmount || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                  {convertCurrency(
                    investorsData?.totalRollover || 0,
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                  {convertCurrency(
                    (investorsData?.totalAmount || 0) + (investorsData?.totalRollover || 0),
                    "USD",
                    settings?.defaultCurrency
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                    maximumFractionDigits: settings?.defaultCurrency === "USD" ? 2 : 0,
                  })}{" "}
                  {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
                </StyledTableCell>
                <StyledTableCell colSpan={5} sx={{ whiteSpace: "nowrap" }} />
              </StyledTableRow>
            </>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={totalInvestors}
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
    </TableContainer>
  );
};

export default InvestorsTable;