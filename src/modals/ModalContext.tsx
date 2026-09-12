import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ModalId, ModalPropsMap, ActiveModalInstance } from './modalTypes';
import { eventBus } from '../events/eventBus';

interface ModalContextType {
  activeModals: ActiveModalInstance[];
  openModal: <K extends ModalId>(id: K, props?: ModalPropsMap[K]) => void;
  closeModal: (id?: ModalId) => void;
  isModalOpen: (id: ModalId) => boolean;
  getModalProps: <K extends ModalId>(id: K) => ModalPropsMap[K] | undefined;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ActiveModalInstance[]>([]);

  const openModal = useCallback(<K extends ModalId>(id: K, props?: ModalPropsMap[K]) => {
    setModals(prev => {
      // If modal is already in stack, update its props and bring to top
      const filtered = prev.filter(m => m.id !== id);
      return [...filtered, { id, props: (props || {}) as ModalPropsMap[K] }];
    });
  }, []);

  const closeModal = useCallback((id?: ModalId) => {
    setModals(prev => {
      if (!id) {
        // Close topmost modal
        return prev.slice(0, -1);
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const isModalOpen = useCallback((id: ModalId) => {
    return modals.some(m => m.id === id);
  }, [modals]);

  const getModalProps = useCallback(<K extends ModalId>(id: K): ModalPropsMap[K] | undefined => {
    const found = modals.find(m => m.id === id);
    return found ? (found.props as ModalPropsMap[K]) : undefined;
  }, [modals]);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  // Subscribe to EventBus OpenModal and CloseModal events for decoupled modal orchestration
  useEffect(() => {
    const unsubOpen = eventBus.on('OpenModal', ({ modalId, props }) => {
      openModal(modalId as ModalId, props as any);
    });

    const unsubClose = eventBus.on('CloseModal', ({ modalId }) => {
      closeModal(modalId as ModalId | undefined);
    });

    return () => {
      unsubOpen();
      unsubClose();
    };
  }, [openModal, closeModal]);

  return (
    <ModalContext.Provider
      value={{
        activeModals: modals,
        openModal,
        closeModal,
        isModalOpen,
        getModalProps,
        closeAllModals
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
