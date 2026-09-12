import React from 'react';
import { useModal } from './ModalContext';
import { renderRegisteredModal } from './modalRegistry';
import { ModalId } from './modalTypes';

export function ModalContainer() {
  const { activeModals, closeModal } = useModal();

  if (!activeModals || activeModals.length === 0) {
    return null;
  }

  return (
    <>
      {activeModals.map((modal) => (
        <React.Fragment key={modal.id}>
          {renderRegisteredModal({
            modalId: modal.id as ModalId,
            props: modal.props,
            onClose: () => closeModal(modal.id as ModalId)
          })}
        </React.Fragment>
      ))}
    </>
  );
}
