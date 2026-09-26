import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { hideCustomModal, useModalStore } from '../store/useModalStore';

export type AppModalButton = {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
};

interface CustomModalProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AppModalButton[];
  onClose?: () => void;
}

export function CustomModal({
  visible,
  title,
  message,
  buttons = [{ text: 'حسناً' }],
  onClose,
}: CustomModalProps) {
  const { accent, bg, card, border, text, subText } = useTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm rounded-3xl p-5"
          style={{ backgroundColor: card, borderColor: border, borderWidth: 1 }}
          onPress={() => undefined}
        >
          <Text
            className="text-xl font-bold text-center"
            style={{ color: text }}
          >
            {title}
          </Text>

          {message ? (
            <Text
              className="mt-3 text-center text-sm leading-6"
              style={{ color: subText }}
            >
              {message}
            </Text>
          ) : null}

          <View className="mt-5 flex-row-reverse justify-end gap-2">
            {buttons.map((button, index) => {
              const isPrimary = button.variant !== 'secondary';

              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  activeOpacity={0.9}
                  onPress={() => {
                    button.onPress?.();
                    onClose?.();
                  }}
                  className="flex-1 rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: isPrimary ? accent : bg,
                    borderWidth: 1,
                    borderColor: isPrimary ? accent : border,
                  }}
                >
                  <Text
                    className="text-center text-sm font-bold"
                    style={{ color: isPrimary ? '#FFFFFF' : text }}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function CustomModalHost() {
  const { visible, title, message, buttons } = useModalStore();

  return (
    <CustomModal
      visible={visible}
      title={title}
      message={message}
      buttons={buttons}
      onClose={hideCustomModal}
    />
  );
}
