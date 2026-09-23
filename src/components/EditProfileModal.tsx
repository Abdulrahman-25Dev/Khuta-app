import React, { useEffect, useState, forwardRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetBackdrop, 
  BottomSheetTextInput 
} from '@gorhom/bottom-sheet';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../context/ThemeContext';

export type FieldType = 'name' | 'weight' | 'height' | 'dailyGoal' | null;

interface Props {
  activeField: FieldType;
  onClose: () => void;
}

export const EditProfileModal = forwardRef<BottomSheet, Props>(
  ({ activeField, onClose }, ref) => {
  const { user, updateUser } = useAppStore();
  const { accent, isDark } = useTheme();
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

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  );

  const getFieldConfig = () => {
    switch (activeField) {
      case 'name':
        return { title: 'تعديل اسم المستخدم', placeholder: 'أدخل الاسم', keyboard: 'default', unit: '' };
      case 'weight':
        return { title: 'تعديل الوزن', placeholder: 'مثال: 70', keyboard: 'numeric', unit: 'كجم' };
      case 'height':
        return { title: 'تعديل الطول', placeholder: 'مثال: 170', keyboard: 'numeric', unit: 'سم' };
      case 'dailyGoal':
        return { title: 'تعديل الهدف اليومي', placeholder: 'مثال: 6000', keyboard: 'numeric', unit: 'خطوة' };
      default:
        return { title: '', placeholder: '', keyboard: 'default', unit: '' };
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
      backgroundStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#8B949E' : '#94A3B8' }}
    >
      <BottomSheetView className="p-5 flex-1 justify-between">
        <Text className="text-appText-light dark:text-appText-dark text-lg font-bold text-right mb-2">
          {config.title}
        </Text>

        <View className="flex-row items-center bg-appBg-light dark:bg-appBg-dark border border-appBorder-light dark:border-appBorder-dark rounded-xl px-4 py-1">
          {config.unit !== '' && (
            <Text className="text-appSubText-light dark:text-appSubText-dark font-bold text-base mr-2">
              {config.unit}
            </Text>
          )}
          <BottomSheetTextInput
            value={value}
            onChangeText={setValue}
            placeholder={config.placeholder}
            placeholderTextColor={isDark ? '#8B949E' : '#94A3B8'}
            keyboardType={config.keyboard as any}
            className="flex-1 text-appText-light dark:text-appText-dark p-3 text-right text-base font-semibold"
            autoFocus
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={{ backgroundColor: accent }}
          className="p-4 rounded-xl items-center mt-4 mb-2"
        >
          <Text className="text-white font-bold text-base">حفظ التعديلات</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

EditProfileModal.displayName = 'EditProfileModal';