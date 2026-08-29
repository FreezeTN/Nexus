import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ModalType =
  | 'help'
  | 'shortcuts'
  | 'systemTheme'
  | 'settings'
  | 'spellBook'
  | 'gearLibrary'
  | 'rest'
  | 'deathSaves'
  | 'companion'
  | 'transformation'
  | 'exportImport'
  | 'characterSelection'
  | 'changelog'
  | 'aiAssistant'
  | 'voiceAssistant'
  | 'levelUp'
  | 'commandPalette'
  | 'diceLog'
  | 'partyOverview'
  | 'liveSync'
  | 'physicalDice'
  | 'knowledgeGraph';

interface ModalContextType {
  activeModals: Partial<Record<ModalType, boolean>>;
  openModal: (type: ModalType, payload?: any) => void;
  closeModal: (type: ModalType) => void;
  toggleModal: (type: ModalType, payload?: any) => void;
  isModalOpen: (type: ModalType) => boolean;
  closeAllModals: () => void;
  modalPayload: Record<string, any>;
  setModalPayload: (type: string, data: any) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModals, setActiveModals] = useState<Partial<Record<ModalType, boolean>>>({});
  const [modalPayload, setPayloadState] = useState<Record<string, any>>({});

  const openModal = (type: ModalType, payload?: any) => {
    if (payload !== undefined) {
      setPayloadState(prev => ({ ...prev, [type]: payload }));
    }
    setActiveModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type: ModalType) => {
    setActiveModals(prev => ({ ...prev, [type]: false }));
  };

  const toggleModal = (type: ModalType, payload?: any) => {
    if (payload !== undefined) {
      setPayloadState(prev => ({ ...prev, [type]: payload }));
    }
    setActiveModals(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const isModalOpen = (type: ModalType): boolean => {
    return !!activeModals[type];
  };

  const closeAllModals = () => {
    setActiveModals({});
  };

  const setModalPayload = (type: string, data: any) => {
    setPayloadState(prev => ({ ...prev, [type]: data }));
  };

  return (
    <ModalContext.Provider
      value={{
        activeModals,
        openModal,
        closeModal,
        toggleModal,
        isModalOpen,
        closeAllModals,
        modalPayload,
        setModalPayload
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

const defaultModalContext: ModalContextType = {
  activeModals: {},
  openModal: () => {},
  closeModal: () => {},
  toggleModal: () => {},
  isModalOpen: () => false,
  closeAllModals: () => {},
  modalPayload: {},
  setModalPayload: () => {}
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    return defaultModalContext;
  }
  return context;
};
