// ⚡ محسن المودالز لتسريع فتحها وإغلاقها

import { useState, useCallback, useRef, useEffect } from 'react';

// 🎯 Hook مخصص لتحسين أداء المودالز
export const useOptimizedModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  // 🚀 فتح المودال بتحسين
  const openModal = useCallback(() => {
    if (isOpen || isAnimating) return;
    
    setIsAnimating(true);
    
    // تأخير بسيط لضمان smooth animation
    requestAnimationFrame(() => {
      setIsOpen(true);
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 200); // مدة الانتقال
    });
  }, [isOpen, isAnimating]);

  // ⚡ إغلاق المودال بتحسين
  const closeModal = useCallback(() => {
    if (!isOpen) return;
    
    setIsAnimating(true);
    setIsOpen(false);
    
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 200); // مدة الانتقال
  }, [isOpen]);

  // 🔄 تبديل حالة المودال
  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);

  // تنظيف عند unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    isAnimating,
    openModal,
    closeModal,
    toggleModal
  };
};

// 🎨 إعدادات الانتقالات المحسّنة
export const OPTIMIZED_MODAL_TRANSITIONS = {
  // انتقال سريع للمودالز الصغيرة
  fast: {
    enter: {
      duration: 150,
      ease: 'ease-out'
    },
    exit: {
      duration: 100,
      ease: 'ease-in'
    }
  },
  
  // انتقال متوسط للمودالز العادية
  normal: {
    enter: {
      duration: 200,
      ease: 'ease-out'
    },
    exit: {
      duration: 150,
      ease: 'ease-in'
    }
  },
  
  // انتقال بطيء للمودالز الكبيرة
  slow: {
    enter: {
      duration: 300,
      ease: 'ease-out'
    },
    exit: {
      duration: 200,
      ease: 'ease-in'
    }
  }
};

// 🔧 دالة لتحسين props المودال
export const getOptimizedModalProps = (size = 'normal') => {
  const transition = OPTIMIZED_MODAL_TRANSITIONS[size];
  
  return {
    TransitionProps: {
      timeout: {
        enter: transition.enter.duration,
        exit: transition.exit.duration
      }
    },
    slotProps: {
      backdrop: {
        timeout: {
          enter: transition.enter.duration,
          exit: transition.exit.duration
        }
      }
    }
  };
};

// 🎯 معالج الأحداث المحسّن للمودالز
export const createModalHandler = (modalSetter, shouldPreventDefault = true) => {
  return (event) => {
    if (shouldPreventDefault && event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // استخدام requestAnimationFrame لتحسين الأداء
    requestAnimationFrame(() => {
      modalSetter(true);
    });
  };
};

// 🚀 مدير المودالز المتعددة
class ModalManager {
  constructor() {
    this.openModals = new Set();
    this.modalStack = [];
  }

  // فتح مودال جديد
  openModal(modalId) {
    this.openModals.add(modalId);
    this.modalStack.push(modalId);
    
    // إدارة الـ z-index
    this.updateZIndex();
  }

  // إغلاق مودال
  closeModal(modalId) {
    this.openModals.delete(modalId);
    const index = this.modalStack.indexOf(modalId);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
    
    this.updateZIndex();
  }

  // إغلاق آخر مودال
  closeLastModal() {
    if (this.modalStack.length > 0) {
      const lastModalId = this.modalStack[this.modalStack.length - 1];
      this.closeModal(lastModalId);
      return lastModalId;
    }
    return null;
  }

  // إغلاق جميع المودالز
  closeAllModals() {
    this.openModals.clear();
    this.modalStack = [];
  }

  // تحديث z-index للمودالز
  updateZIndex() {
    this.modalStack.forEach((modalId, index) => {
      const modalElement = document.querySelector(`[data-modal-id="${modalId}"]`);
      if (modalElement) {
        modalElement.style.zIndex = 1300 + index;
      }
    });
  }

  // التحقق من وجود مودالز مفتوحة
  hasOpenModals() {
    return this.openModals.size > 0;
  }

  // الحصول على عدد المودالز المفتوحة
  getOpenModalCount() {
    return this.openModals.size;
  }
}

// إنشاء instance واحد للاستخدام العام
export const modalManager = new ModalManager();

// 🎮 Hook للتحكم في المودالز المتعددة
export const useModalManager = (modalId) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
    modalManager.openModal(modalId);
  }, [modalId]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    modalManager.closeModal(modalId);
  }, [modalId]);

  useEffect(() => {
    return () => {
      if (isOpen) {
        modalManager.closeModal(modalId);
      }
    };
  }, [modalId, isOpen]);

  return {
    isOpen,
    openModal,
    closeModal,
    hasOtherModals: modalManager.getOpenModalCount() > (isOpen ? 1 : 0)
  };
};

// 🔄 Hook لمعالجة إغلاق المودال بـ ESC
export const useModalEscapeKey = (isOpen, closeModal) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, closeModal]);
};

// 🎯 تحسينات خاصة بمودالز البيانات الكبيرة
export const useLargeDataModal = (data, pageSize = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(data);
  const [searchTerm, setSearchTerm] = useState('');

  // تقسيم البيانات إلى صفحات
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // البحث المحسّن
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    
    if (!term.trim()) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(term.toLowerCase())
        )
      );
      setFilteredData(filtered);
    }
  }, [data]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    handleSearch,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

export default {
  useOptimizedModal,
  OPTIMIZED_MODAL_TRANSITIONS,
  getOptimizedModalProps,
  createModalHandler,
  modalManager,
  useModalManager,
  useModalEscapeKey,
  useLargeDataModal
}; 