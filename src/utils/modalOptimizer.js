
import { useState, useCallback, useRef, useEffect } from 'react';


export const useOptimizedModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);


  const openModal = useCallback(() => {
    if (isOpen || isAnimating) return;
    
    setIsAnimating(true);
    

    requestAnimationFrame(() => {
      setIsOpen(true);
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 200);
    });
  }, [isOpen, isAnimating]);


  const closeModal = useCallback(() => {
    if (!isOpen) return;
    
    setIsAnimating(true);
    setIsOpen(false);
    
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 200);
  }, [isOpen]);


  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);


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


export const OPTIMIZED_MODAL_TRANSITIONS = {

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


export const createModalHandler = (modalSetter, shouldPreventDefault = true) => {
  return (event) => {
    if (shouldPreventDefault && event) {
      event.preventDefault();
      event.stopPropagation();
    }
    

    requestAnimationFrame(() => {
      modalSetter(true);
    });
  };
};


class ModalManager {
  constructor() {
    this.openModals = new Set();
    this.modalStack = [];
  }


  openModal(modalId) {
    this.openModals.add(modalId);
    this.modalStack.push(modalId);
    

    this.updateZIndex();
  }


  closeModal(modalId) {
    this.openModals.delete(modalId);
    const index = this.modalStack.indexOf(modalId);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
    
    this.updateZIndex();
  }


  closeLastModal() {
    if (this.modalStack.length > 0) {
      const lastModalId = this.modalStack[this.modalStack.length - 1];
      this.closeModal(lastModalId);
      return lastModalId;
    }
    return null;
  }


  closeAllModals() {
    this.openModals.clear();
    this.modalStack = [];
  }


  updateZIndex() {
    this.modalStack.forEach((modalId, index) => {
      const modalElement = document.querySelector(`[data-modal-id="${modalId}"]`);
      if (modalElement) {
        modalElement.style.zIndex = 1300 + index;
      }
    });
  }


  hasOpenModals() {
    return this.openModals.size > 0;
  }


  getOpenModalCount() {
    return this.openModals.size;
  }
}


export const modalManager = new ModalManager();


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


export const useLargeDataModal = (data, pageSize = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(data);
  const [searchTerm, setSearchTerm] = useState('');


  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);

    
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