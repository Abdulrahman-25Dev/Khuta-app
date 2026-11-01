import React, { useEffect, useState, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  type KeyboardTypeOptions,
} from 'react-native';
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetBackdrop, 
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../context/ThemeContext';

export type FieldType = 'name' | 'weight' | 'height' | 'dailyGoal' | null;

interface Props {
  activeField: FieldType;
  onClose: () => void;
}

export const EditProfileModal = forwardRef<BottomSheet, Props>(
  ({ activeField, onClose }, ref) => {
  const { t, i18n } = useTranslation();
  const rowDirection =
    i18n.dir() === 'rtl' ? 'flex-row-reverse' : 'flex-row';
  const textAlignment = i18n.dir() === 'rtl' ? 'text-right' : 'text-left';
  const { user, updateUser } = useAppStore();
  const { accent, isDark, bg, card, border, text, subText } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (activeField && activeField in user) {
      const currentValue = user[activeField as keyof typeof user];
      setValue(currentValue !== undefined ? String(currentValue) : '');
    }
  }, [activeField, user]);

  const handleSave = () => {
    if (!activeField) return;

    const parsedValue = activeField === 'name' ? value : Number(value);
    updateUser({ [activeField]: parsedValue });
    onClose();
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  );

  const getFieldConfig = () => {
    switch (activeField) {
      case 'name':
        return {
          title: t('profile.edit.nameTitle'),
          placeholder: t('profile.edit.namePlaceholder'),
          keyboard: 'default' as KeyboardTypeOptions,
          unit: '',
        };
      case 'weight':
        return {
          title: t('profile.edit.weightTitle'),
          placeholder: t('profile.edit.weightPlaceholder'),
          keyboard: 'numeric' as KeyboardTypeOptions,
          unit: t('home.weightKg'),
        };
      case 'height':
        return {
          title: t('profile.edit.heightTitle'),
          placeholder: t('profile.edit.heightPlaceholder'),
          keyboard: 'numeric' as KeyboardTypeOptions,
          unit: t('home.heightCm'),
        };
      case 'dailyGoal':
        return {
          title: t('profile.edit.dailyGoalTitle'),
          placeholder: t('profile.edit.dailyGoalPlaceholder'),
          keyboard: 'numeric' as KeyboardTypeOptions,
          unit: t('home.stepsUnit'),
        };
      default:
        return {
          title: '',
          placeholder: '',
          keyboard: 'default' as KeyboardTypeOptions,
          unit: '',
        };
    }
  };

  const config = getFieldConfig();

  if (!activeField) return null;

  return (
    <BottomSheet
      ref={ref}
      snapPoints={['40%']}
      enablePanDownToClose
      onClose={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: card }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#8B949E' : '#94A3B8' }}
    >
      <BottomSheetView className="p-5 flex-1 justify-between">
        <Text className="text-lg font-bold text-right mb-2" style={{ color: text }}>
          {config.title}
        </Text>

        <View
          className={`${rowDirection} items-center border rounded-xl px-4 py-1`}
          style={{ backgroundColor: bg, borderColor: border }}
        >
          {config.unit !== '' && (
            <Text
              className={`font-bold text-base ${i18n.dir() === 'rtl' ? 'ml-2' : 'mr-2'}`}
              style={{ color: subText }}
            >
              {config.unit}
            </Text>
          )}
          <BottomSheetTextInput
            value={value}
            onChangeText={setValue}
            placeholder={config.placeholder}
            placeholderTextColor={isDark ? '#8B949E' : '#94A3B8'}
            keyboardType={config.keyboard as any}
            className={`flex-1 p-3 ${textAlignment} text-base font-semibold`}
            style={{ color: text }}
            autoFocus
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={{ backgroundColor: accent }}
          className="p-4 rounded-xl items-center mt-4 mb-2"
        >
          <Text className="text-white font-bold text-base">
            {t('profile.edit.saveChanges')}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

EditProfileModal.displayName = 'EditProfileModal';