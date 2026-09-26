import { create } from 'zustand';

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
  buttons: [{ text: 'حسناً' }],
  show: ({ title, message, buttons = [{ text: 'حسناً' }] }) =>
    set({ visible: true, title, message, buttons }),
  hide: () =>
    set({
      visible: false,
      title: '',
      message: undefined,
      buttons: [{ text: 'حسناً' }],
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
