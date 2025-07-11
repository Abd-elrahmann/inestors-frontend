import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ModalLoader } from "../components/shared/LoadingComponents";
import {
  Autorenew as RolloverIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { financialYearsAPI } from "../services/apiHelpers";
import { showErrorAlert, showSuccessAlert } from "../utils/sweetAlert";

const AddFinancialYearModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    periodType: "custom",
    startDate: new Date(new Date().getFullYear(), 0, 1), // January 1st
    endDate: new Date(new Date().getFullYear(), 11, 31), // December 31st
    totalProfit: "",
    currency: "IQD",
    rolloverSettings: {
      enabled: false, // زر تفعيل التدوير
      percentage: 100,
      autoRollover: false,
      autoRolloverDate: null,
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleRolloverSettingChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      rolloverSettings: {
        ...prev.rolloverSettings,
        [field]: value,
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.year) {
      newErrors.year = "السنة مطلوبة";
    }

    if (!formData.startDate) {
      newErrors.startDate = "تاريخ البداية مطلوب";
    }

    if (!formData.endDate) {
      newErrors.endDate = "تاريخ النهاية مطلوب";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      newErrors.endDate = "تاريخ النهاية يجب أن يكون بعد تاريخ البداية";
    }

    // التحقق من تطابق نوع الفترة مع المدة الفعلية
    if (formData.startDate && formData.endDate) {
      const diffTime = Math.abs(formData.endDate - formData.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      let expectedRange = "";
      switch (formData.periodType) {
        case "monthly":
          if (diffDays < 28 || diffDays > 31) {
            expectedRange = "شهرية (28-31 يوم)";
          }
          break;
        case "quarterly":
          if (diffDays < 89 || diffDays > 92) {
            expectedRange = "ربع سنوية (89-92 يوم)";
          }
          break;
        case "annual":
          if (diffDays < 365 || diffDays > 366) {
            expectedRange = "سنوية (365-366 يوم)";
          }
          break;
      }

      if (expectedRange) {
        newErrors.periodType = `المدة الفعلية (${diffDays} يوم) لا تتطابق مع النوع المختار: ${expectedRange}`;
      }
    }

    if (!formData.totalProfit || parseFloat(formData.totalProfit) <= 0) {
      newErrors.totalProfit = "إجمالي الربح يجب أن يكون أكبر من صفر";
    }

    if (!formData.currency) {
      newErrors.currency = "العملة مطلوبة";
    }

    // التحقق من نسبة التدوير فقط إذا كان التدوير مفعل
    if (formData.rolloverSettings.enabled) {
      if (
        formData.rolloverSettings.percentage < 0 ||
        formData.rolloverSettings.percentage > 100
      ) {
        newErrors.rolloverPercentage = "نسبة التدوير يجب أن تكون بين 0 و 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        year: formData.year,
        periodType: formData.periodType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalProfit: parseFloat(formData.totalProfit),
        currency: formData.currency,
        rolloverSettings: formData.rolloverSettings.enabled
          ? {
              rolloverPercentage: formData.rolloverSettings.percentage,
              autoRollover: formData.rolloverSettings.autoRollover,
              autoRolloverDate: formData.rolloverSettings.autoRolloverDate,
            }
          : {
              rolloverPercentage: 0, // تدوير يدوي
              autoRollover: false,
              autoRolloverDate: null,
            },
      };

      const response = await financialYearsAPI.create(submitData);

      if (response.success) {
        showSuccessAlert("تم إنشاء السنة المالية بنجاح");
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error("Error creating financial year:", error);
      showErrorAlert(error.message || "حدث خطأ أثناء إنشاء السنة المالية");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        year: new Date().getFullYear(),
        periodType: "custom",
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31),
        totalProfit: "",
        currency: "IQD",
        rolloverSettings: {
          enabled: false,
          percentage: 100,
          autoRollover: false,
          autoRolloverDate: null,
        },
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold">
            إضافة سنة مالية جديدة
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <ModalLoader
              loading={loading}
              message="جاري إنشاء السنة المالية..."
            >
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                width: '60%',
                mx: 'auto'
              }}>
                {/* السنة المالية */}
                <TextField
                  fullWidth
                  label="السنة المالية"
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    handleChange("year", parseInt(e.target.value))
                  }
                  error={!!errors.year}
                  helperText={errors.year}
                  required
                />

                {/* إجمالي الربح للفترة */}
                <TextField
                  fullWidth
                  label="إجمالي الربح للفترة"
                  type="number"
                  value={formData.totalProfit}
                  onChange={(e) =>
                    handleChange("totalProfit", e.target.value)
                  }
                  error={!!errors.totalProfit}
                  required
                  inputProps={{ min: 0, step: "0.01" }}
                />

                {/* العملة */}
                <FormControl fullWidth error={!!errors.currency}>
                  <InputLabel>العملة</InputLabel>
                  <Select
                    value={formData.currency}
                    label="العملة"
                    onChange={(e) => handleChange("currency", e.target.value)}
                  >
                    <MenuItem value="IQD">دينار عراقي (IQD)</MenuItem>
                    <MenuItem value="USD">دولار أمريكي (USD)</MenuItem>
                  </Select>
                </FormControl>

                {/* تواريخ الفترة */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label="تاريخ بداية الفترة"
                    value={formData.startDate}
                    onChange={(date) => handleChange("startDate", date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.startDate}
                        helperText={errors.startDate}
                        required
                      />
                    )}
                  />

                  <DatePicker
                    label="تاريخ نهاية الفترة"
                    value={formData.endDate}
                    onChange={(date) => handleChange("endDate", date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.endDate}
                        helperText={errors.endDate}
                        required
                      />
                    )}
                  />
                </Box>

                {/* مدة الفترة */}
                {formData.startDate && formData.endDate ? (
                  <TextField
                    fullWidth
                    label="مدة الفترة"
                    value={`${Math.ceil(
                      Math.abs(formData.endDate - formData.startDate) /
                        (1000 * 60 * 60 * 24)+1
                    )} يوم`}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="مدة الفترة"
                    value="اختر التواريخ أولاً"
                    InputProps={{
                      readOnly: true,
                    }}
                    disabled
                  />
                )}

                {/* قسم التدوير */}
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <RolloverIcon color="primary" />
                    إعدادات التدوير
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.rolloverSettings.enabled}
                          onChange={(e) =>
                            handleRolloverSettingChange(
                              "enabled",
                              e.target.checked
                            )
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Typography>تفعيل التدوير</Typography>
                          <Chip
                            label={
                              formData.rolloverSettings.enabled
                                ? "مفعل"
                                : "تدوير يدوي"
                            }
                            color={
                              formData.rolloverSettings.enabled
                                ? "success"
                                : "warning"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {formData.rolloverSettings.enabled
                        ? "سيتم تحديد نسبة التدوير مسبقاً عند إنشاء السنة المالية"
                        : "سيتم عرض زر التدوير اليدوي في الإجراءات بعد توزيع الأرباح"}
                    </Typography>

                    {formData.rolloverSettings.enabled && (
                      <>
                        <TextField
                          fullWidth
                          label="نسبة التدوير (%)"
                          type="number"
                          value={formData.rolloverSettings.percentage}
                          onChange={(e) =>
                            handleRolloverSettingChange(
                              "percentage",
                              Math.min(
                                100,
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            )
                          }
                          error={!!errors.rolloverPercentage}
                          helperText={
                            errors.rolloverPercentage ||
                            "النسبة المئوية من الأرباح التي سيتم تدويرها إلى رأس المال"
                          }
                          inputProps={{ min: 0, max: 100 }}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.rolloverSettings.autoRollover}
                              onChange={(e) =>
                                handleRolloverSettingChange(
                                  "autoRollover",
                                  e.target.checked
                                )
                              }
                              color="secondary"
                            />
                          }
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <ScheduleIcon fontSize="small" />
                              <Typography>تدوير تلقائي</Typography>
                            </Box>
                          }
                        />

                        {formData.rolloverSettings.autoRollover && (
                          <DatePicker
                            label="تاريخ التدوير التلقائي"
                            value={formData.rolloverSettings.autoRolloverDate}
                            onChange={(date) =>
                              handleRolloverSettingChange(
                                "autoRolloverDate",
                                date
                              )
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                helperText="التاريخ الذي سيتم فيه تدوير الأرباح تلقائياً"
                              />
                            )}
                          />
                        )}

                        <Alert severity="info">
                          <Typography variant="body2">
                            سيتم تدوير{" "}
                            <strong>
                              {formData.rolloverSettings.percentage}%
                            </strong>{" "}
                            من الأرباح (
                            {formData.totalProfit
                              ? new Intl.NumberFormat("ar-EG").format(
                                  (parseFloat(formData.totalProfit) *
                                    formData.rolloverSettings.percentage) /
                                    100
                                )
                              : "0"}{" "}
                            {formData.currency}) إلى رأس المال كإيداعات جديدة.
                            {formData.rolloverSettings.percentage < 100 && (
                              <>
                                <br />
                                المبلغ المتبقي (
                                {formData.totalProfit
                                  ? new Intl.NumberFormat("ar-EG").format(
                                      (parseFloat(formData.totalProfit) *
                                        (100 -
                                          formData.rolloverSettings
                                            .percentage)) /
                                        100
                                    )
                                  : "0"}{" "}
                                {formData.currency}) سيتم توزيعه على المساهمين.
                              </>
                            )}
                          </Typography>
                        </Alert>
                      </>
                    )}

                    {!formData.rolloverSettings.enabled && (
                      <Alert severity="warning">
                        <Typography variant="body2">
                          <strong>تدوير يدوي:</strong> سيظهر زر "تدوير الأرباح"
                          في الإجراءات بعد توزيع الأرباح، حيث يمكنك تحديد نسبة
                          التدوير في ذلك الوقت.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Box>

                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>ملاحظة:</strong> بعد إنشاء السنة المالية، ستحتاج
                    إلى حساب توزيع الأرباح ثم الموافقة عليها قبل التوزيع.
                  </Typography>
                </Alert>
              </Box>
            </ModalLoader>
          </DialogContent>

          <DialogActions sx={{ p: 3, justifyContent: 'center',direction:'ltr' }}>
            <Button onClick={handleClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء السنة المالية"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddFinancialYearModal;
