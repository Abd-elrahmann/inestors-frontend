import React from "react";
import {
  Stack,
  InputBase,
  IconButton,
  Fab,
  Box
} from "@mui/material";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const FinancialYearsToolbar = ({
  isMobile,
  onAddFinancialYear,
  onSearchChange,
  onOpenSearchModal,
  onResetFilters,
  hasActiveFilters
}) => {
  return (
    <Stack 
      direction={isMobile ? 'column' : 'row'} 
      justifyContent={isMobile ? 'center' : "space-between"} 
      alignItems="center" 
      mb={1} 
      mr={1} 
      mt={5} 
      spacing={2}
    >
      <Fab
        color="primary"
        variant="extended"
        onClick={onAddFinancialYear}
        sx={{
          borderRadius: '8px',
          fontWeight: 'bold',
          textTransform: 'none',
          height: '40px',
          width: isMobile ? '50%' : '180px',
        }}
      >
        <PlusOutlined style={{ marginLeft: 8 }} />
        إضافة سنة مالية
      </Fab>

      <Box sx={{ 
        width: isMobile ? '100%' : '250px', 
        display: 'flex', 
        justifyContent: isMobile ? 'center' : 'end',
        alignItems: 'center',
        gap: 1
      }}>
        <InputBase
          placeholder="بحث عن سنة مالية"
          startAdornment={<SearchOutlined style={{marginLeft: '10px', marginRight: '10px'}} />}
          sx={{
            width: isMobile ? '80%' : '250px',
            marginLeft: isMobile ? 0 : '5px', 
            borderRadius: '4px',
            fontSize: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onChange={onSearchChange}
        />
        <IconButton onClick={onOpenSearchModal}>
          <FilterOutlined style={{color: hasActiveFilters ? 'green' : 'inherit'}} />
        </IconButton>
        {hasActiveFilters && (
          <IconButton onClick={onResetFilters}>
            <ReloadOutlined style={{color: 'red'}} />
          </IconButton>
        )}
      </Box>
    </Stack>
  );
};

export default FinancialYearsToolbar;