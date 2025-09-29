import React from "react";
import {
  Stack,
  InputBase,
  InputAdornment,
  IconButton,
  Fab,
  Card,
  Typography
} from "@mui/material";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { RestartAltOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const TransactionsToolbar = ({
  isMobile,
  searchQuery,
  onSearchChange,
  onAddTransaction,
  selectedIds,
  onBulkDelete,
  onOpenSearchModal,
  onResetFilters,
  showResetButton,
  isAdmin,
  investorId,
  investorDetails,
  totalAmount,
  settings,
  convertCurrency
}) => {
  const navigate = useNavigate();

  return (
    <>
      {investorId && (
        <Card sx={{ p: 2, mb: 3, mt: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              المساهم: {investorDetails?.fullName}
            </Typography>
            <Typography variant="h6">
              إجمالي المبالغ:{" "}
              {convertCurrency(
                totalAmount,
                "USD",
                settings?.defaultCurrency
              ).toLocaleString("en-US", {
                minimumFractionDigits: settings?.defaultCurrency === 'USD' ? 2 : 0,
                maximumFractionDigits: settings?.defaultCurrency === 'USD' ? 2 : 0,
              })}{" "}
              {settings?.defaultCurrency === "USD" ? "$" : "د.ع"}
            </Typography>

            <Typography variant="h6">العملة: {settings?.defaultCurrency || "USD"}</Typography>
          </Stack>
          <Stack
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            marginTop={2}
          >
            <Fab
              variant="extended"
              color="primary"
              onClick={() => navigate("/investors")}
              sx={{
                borderRadius: "8px",
                fontWeight: "bold",
                textTransform: "none",
                height: "40px",
              }}
            >
              <ArrowLeftOutlined style={{ marginLeft: "10px" }} />
              الرجوع لصفحة المساهمين
            </Fab>
          </Stack>
        </Card>
      )}

      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        mt={5}
        spacing={2}
      >
        <Stack direction={isMobile ? "column" : "row"} spacing={1}>
          {isAdmin && (
            <>
              <Fab
                variant="extended"
                color="primary"
                onClick={onAddTransaction}
                sx={{
                  borderRadius: "8px",
                  fontWeight: "bold",
                  textTransform: "none",
                  height: "40px",
                  width: isMobile ? "100%" : "180px",
                }}
              >
                <PlusOutlined style={{ marginLeft: 8 }} />
                إضافة عملية جديدة
              </Fab>
              {selectedIds.length > 0 && (
                <IconButton
                  color="error"
                  variant="extended"
                  onClick={onBulkDelete}
                  sx={{
                    width: isMobile ? "100%" : "100px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    height: "40px",
                    fontSize: "14px",
                    order: isMobile ? 1 : 0,
                  }}
                >
                  <DeleteOutlined style={{ marginLeft: 8 }} />(
                  {selectedIds.length})
                </IconButton>
              )}
            </>
          )}
        </Stack>

        <Stack direction={isMobile ? "column" : "row"} spacing={1}>
          {isAdmin && (
            <>
              <InputBase
                placeholder="ابحث عن عملية..."
                value={searchQuery}
                onChange={onSearchChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchOutlined
                      style={{ color: "#666", marginRight: "10px" }}
                    />
                  </InputAdornment>
                }
                sx={{
                  width: isMobile ? "100%" : "250px",
                  padding: "8px 15px",
                  marginLeft: "5px",
                  borderRadius: "4px",
                  fontSize: "16px",
                }}
              />

              <IconButton
                onClick={onOpenSearchModal}
                sx={{
                  border: isMobile ? "none" : "1px solid",
                  borderColor: isMobile ? "none" : "divider",
                }}
              >
                <FilterOutlined />
              </IconButton>
              {showResetButton && (
                <IconButton
                  onClick={onResetFilters}
                  sx={{
                    border: isMobile ? "none" : "1px solid",
                    borderColor: isMobile ? "none" : "divider",
                  }}
                >
                  <RestartAltOutlined style={{ color: "red" }} />
                </IconButton>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default TransactionsToolbar;