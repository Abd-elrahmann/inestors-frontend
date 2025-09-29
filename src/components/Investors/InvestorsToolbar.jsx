import React from "react";
import {
  Stack,
  InputBase,
  IconButton,
  Fab,
  Tooltip,
  Box
} from "@mui/material";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { QuestionMark, CloudUpload } from "@mui/icons-material";
import { RestartAltOutlined } from "@mui/icons-material";
import { Spin } from "antd";

const InvestorsToolbar = ({
  isMobile,
  searchQuery,
  onSearchChange,
  onAddInvestor,
  selectedIds,
  onBulkDelete,
  onDownloadTemplate,
  onImportInvestors,
  importLoading,
  onOpenSearchModal,
  onResetFilters,
  showResetButton
}) => {
  return (
    <>
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        mt={5}
        spacing={2}
      >
        <Stack direction="row" spacing={1}>
          <Fab
            color="primary"
            variant="extended"
            onClick={onAddInvestor}
            sx={{
              width: isMobile ? "100%" : "150px",
              borderRadius: "8px",
              fontWeight: "bold",
              textTransform: "none",
              height: "40px",
              order: isMobile ? 1 : 0,
            }}
          >
            <PlusOutlined style={{ marginLeft: 8 }} />
            إضافة مستثمر
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
              <DeleteOutlined style={{ marginLeft: 8 }} />({selectedIds.length})
            </IconButton>
          )}

          <Tooltip title="تحميل نموذج المستثمرين">
            <IconButton onClick={onDownloadTemplate}>
              <QuestionMark style={{ marginRight: "10px" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="استيراد مستثمرين من Excel">
            <IconButton
              component="label"
              disabled={importLoading}
              sx={{
                color: importLoading ? "grey" : "primary.main",
              }}
            >
              <CloudUpload style={{ marginRight: "10px" }} />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onImportInvestors}
                style={{ display: "none" }}
              />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={1}
          sx={{
            order: isMobile ? 0 : 1,
          }}
        >
          <InputBase
            placeholder="بحث عن مستثمر"
            startAdornment={
              <SearchOutlined
                style={{ marginLeft: "10px", marginRight: "10px" }}
              />
            }
            sx={{
              width: isMobile ? "100%" : "250px",
              borderRadius: "4px",
              fontSize: "16px",
            }}
            value={searchQuery}
            onChange={onSearchChange}
          />

          <IconButton
            onClick={onOpenSearchModal}
            sx={{
              border: isMobile ? "none" : "1px solid",
              borderColor: isMobile ? "none" : "divider",
            }}
          >
            <FilterOutlined style={{ color: "green" }} />
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
        </Stack>
      </Stack>

      {importLoading && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            p: 2,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            borderRadius: 1,
            border: "1px solid rgba(25, 118, 210, 0.3)",
          }}
        >
          <Spin size="small" style={{ marginLeft: "10px" }} />
          <span style={{ color: "#1976d2", fontWeight: 500 }}>
            جاري استيراد المستثمرين...
          </span>
        </Box>
      )}
    </>
  );
};

export default InvestorsToolbar;