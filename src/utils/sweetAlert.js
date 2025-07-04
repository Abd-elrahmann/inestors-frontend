import Swal from 'sweetalert2';

// Configure SweetAlert2 with Arabic RTL support
const swalConfig = {
  customClass: {
    popup: 'swal-rtl',
    title: 'swal-title-rtl',
    content: 'swal-content-rtl',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn'
  },
  buttonsStyling: false,
  reverseButtons: true, // Put confirm button on the right for RTL
  showClass: {
    popup: 'animate__animated animate__fadeInDown'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp'
  }
};

// Delete confirmation alert
export const showDeleteConfirmation = async (itemName, itemType = 'العنصر') => {
  const result = await Swal.fire({
    ...swalConfig,
    title: `حذف ${itemType}`,
    html: `
      <div style="font-family: 'Cairo', sans-serif; text-align: center; direction: rtl;">
        <p style="font-size: 16px; color: #666; margin: 10px 0;">
          هل أنت متأكد من حذف ${itemType}:
        </p>
        <p style="font-size: 18px; font-weight: bold; color: #dc3545; margin: 15px 0;">
          "${itemName}"
        </p>
        <p style="font-size: 14px; color: #999; margin: 10px 0;">
          هذا الإجراء لا يمكن التراجع عنه
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    focusCancel: true,
    allowOutsideClick: false,
    allowEscapeKey: true
  });

  return result.isConfirmed;
};

// Delete confirmation for investors with option for force delete
export const showInvestorDeleteConfirmation = async (investorName) => {
  const result = await Swal.fire({
    ...swalConfig,
    customClass: {
      ...swalConfig.customClass,
      confirmButton: 'swal-confirm-btn-warning',
      denyButton: 'swal-deny-btn-danger',
      cancelButton: 'swal-cancel-btn'
    },
    title: 'حذف المساهم',
    html: `
      <div style="font-family: 'Cairo', sans-serif; text-align: center; direction: rtl;">
        <p style="font-size: 16px; color: #666; margin: 10px 0;">
          هل أنت متأكد من حذف المساهم:
        </p>
        <p style="font-size: 18px; font-weight: bold; color: #dc3545; margin: 15px 0;">
          "${investorName}"
        </p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #dee2e6;">
          <p style="font-size: 14px; color: #495057; margin: 8px 0;">
            <strong style="color: #ffc107;">حذف من التوزيعات:</strong> إخفاء المساهم من توزيع الأرباح مع الاحتفاظ بجميع البيانات. سيتم إعادة حساب نسب المساهمين المتبقين تلقائياً.
          </p>
          <p style="font-size: 14px; color: #495057; margin: 8px 0;">
            <strong style="color: #dc3545;">حذف نهائي:</strong> حذف كامل مع جميع المعاملات والبيانات (لا يمكن التراجع)
        </p>
        </div>
      </div>
      <style>
        .swal-confirm-btn-warning {
          background-color: #ffc107 !important;
          color: #212529 !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-family: 'Cairo', sans-serif !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin: 0 8px !important;
          transition: all 0.3s ease !important;
        }
        .swal-confirm-btn-warning:hover {
          background-color: #e0a800 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3) !important;
        }
        .swal-deny-btn-danger {
          background-color: #dc3545 !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-family: 'Cairo', sans-serif !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin: 0 8px !important;
          transition: all 0.3s ease !important;
        }
        .swal-deny-btn-danger:hover {
          background-color: #c82333 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3) !important;
        }
      </style>
    `,
    icon: 'warning',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'حذف من التوزيعات',
    denyButtonText: 'حذف نهائي',
    cancelButtonText: 'إلغاء',
    buttonsStyling: false,
    focusCancel: true,
    allowOutsideClick: false,
    allowEscapeKey: true
  });

  if (result.isConfirmed) {
    return { confirmed: true, forceDelete: false };
  } else if (result.isDenied) {
    // تأكيد إضافي للحذف النهائي
    const forceConfirm = await Swal.fire({
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      },
      title: 'تأكيد الحذف النهائي',
      html: `
        <div style="font-family: 'Cairo', sans-serif; text-align: center; direction: rtl;">
          <p style="font-size: 16px; color: #dc3545; margin: 10px 0; font-weight: bold;">
            ⚠️ تحذير شديد ⚠️
          </p>
          <p style="font-size: 14px; color: #666; margin: 10px 0;">
            سيتم حذف المساهم "${investorName}" نهائياً مع:
          </p>
          <ul style="text-align: right; margin: 15px 0; color: #666;">
            <li>جميع المعاملات المالية</li>
            <li>جميع توزيعات الأرباح</li>
            <li>إعادة حساب نسب باقي المساهمين</li>
          </ul>
          <p style="font-size: 14px; color: #dc3545; margin: 10px 0; font-weight: bold;">
            هذا الإجراء لا يمكن التراجع عنه نهائياً!
          </p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف نهائياً',
      cancelButtonText: 'إلغاء',
      buttonsStyling: false,
      focusCancel: true,
      allowOutsideClick: false,
      allowEscapeKey: true
    });
    
    return { confirmed: forceConfirm.isConfirmed, forceDelete: true };
  }
  
  return { confirmed: false, forceDelete: false };
};

// Success alert
export const showSuccessAlert = (message, title = 'تم بنجاح') => {
  return Swal.fire({
    ...swalConfig,
    title,
    text: message,
    icon: 'success',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#28a745',
    timer: 3000,
    timerProgressBar: true
  });
};

// Error alert
export const showErrorAlert = (message, title = 'خطأ') => {
  return Swal.fire({
    ...swalConfig,
    title,
    text: message,
    icon: 'error',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#dc3545'
  });
};

// Info alert
export const showInfoAlert = (message, title = 'معلومات') => {
  return Swal.fire({
    ...swalConfig,
    title,
    text: message,
    icon: 'info',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#17a2b8'
  });
};

// Warning alert
export const showWarningAlert = (message, title = 'تحذير') => {
  return Swal.fire({
    ...swalConfig,
    title,
    text: message,
    icon: 'warning',
    confirmButtonText: 'موافق',
    confirmButtonColor: '#ffc107'
  });
};

// Confirmation alert
export const showConfirmAlert = async (title, message, confirmText = 'نعم', cancelText = 'إلغاء') => {
  const result = await Swal.fire({
    ...swalConfig,
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    focusCancel: true,
    allowOutsideClick: false,
    allowEscapeKey: true
  });

  return result.isConfirmed;
}; 