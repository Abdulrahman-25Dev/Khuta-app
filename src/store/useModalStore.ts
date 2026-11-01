import { create } from 'zustand';

import { i18n } from '../i18n/i18next';
import type { AppModalButton } from '../components/CustomModal';

interface ModalState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppModalButton[];
  show: (params: {
    title: string;
    message?: string;
    buttons?: AppModalButton[];
  }) => void;
  hide: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [{ text: i18n.t('common.ok') }],
  show: ({ title, message, buttons = [{ text: i18n.t('common.ok') }] }) =>
    set({ visible: true, title, message, buttons }),
  hide: () =>
    set({
      visible: false,
      title: '',
      message: undefined,
      buttons: [{ text: i18n.t('common.ok') }],
    }),
}));

export const showCustomModal = ({
  title,
  message,
  buttons,
}: {
  title: string;
  message?: string;
  buttons?: AppModalButton[];
}) => {
  useModalStore.getState().show({ title, message, buttons });
};

export const hideCustomModal = () => useModalStore.getState().hide();
