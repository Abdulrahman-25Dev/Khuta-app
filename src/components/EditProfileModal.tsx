import React, { useEffect, useState, forwardRef } from 'react';
import {
  View,
  TouchableOpacity,
  type KeyboardTypeOptions,
} from 'react-native';
import { Clock } from 'lucide-react-native';
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetBackdrop, 
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import AppText from './AppText';

export type FieldType =
  | 'name'
  | 'weight'
  | 'height'
  | 'gender'
  | 'dailyGoal'
  | 'waterGoalCups'
  | 'waterReminderStart'
  | 'waterReminderEnd'
  | 'waterReminderInterval'
  | null;

interface Props {
  activeField: FieldType;
  onClose: () => void;
}

const formatTimeInput = (input: string) => {
  const digits = input
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\D/g, '')
    .slice(0, 4);
  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
};

const normalizeTimeInput = (input: string): string | null => {
  const digits = input
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\D/g, '')
    .slice(0, 4);
  if (digits.length === 0) return null;

  const hours = Number(digits.slice(0, 2));
  const minuteDigits = digits.slice(2);
  const minutes =
    minuteDigits.length === 0
      ? 0
      : Number(minuteDigits.padEnd(2, '0'));

  if (hours > 23 || minutes > 59) return '23:59';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const EditProfileModal = forwardRef<BottomSheet, Props>(
  ({ activeField, onClose }, ref) => {
  const { t, i18n } = useTranslation();
  const rowDirection =
    i18n.dir() === 'rtl' ? 'flex-row-reverse' : 'flex-row';
  const textAlignment = i18n.dir() === 'rtl' ? 'text-right' : 'text-left';
  const { user, updateUser } = useAppStore();
  const { accent, isDark, bg, card, border, text, subText } = useTheme();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const isTimeField =
    activeField === 'waterReminderStart' ||
    activeField === 'waterReminderEnd';

  useEffect(() => {
    if (activeField && activeField in user) {
      const currentValue = user[activeField as keyof typeof user];
      setValue(currentValue !== undefined ? String(currentValue) : '');
    }
    setError('');
  }, [activeField, user]);

  const handleSave = () => {
    if (!activeField) return;

    if (activeField === 'gender') {
      updateUser({ gender: value === 'female' ? 'female' : 'male' });
      onClose();
      return;
    }

    if (activeField === 'name') {
      updateUser({ name: value });
      onClose();
      return;
    }

    if (isTimeField) {
      const normalizedTime = normalizeTimeInput(value);
      if (!normalizedTime) {
        setError(t('profile.edit.invalidTime'));
        return;
      }
      setValue(normalizedTime);
      const start =
        activeField === 'waterReminderStart'
          ? normalizedTime
          : user.waterReminderStart;
      const end =
        activeField === 'waterReminderEnd'
          ? normalizedTime
          : user.waterReminderEnd;
      const toMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      if (toMinutes(start) >= toMinutes(end)) {
        setError(t('profile.edit.invalidTimeRange'));
        return;
      }
      updateUser(
        activeField === 'waterReminderStart'
          ? { waterReminderStart: normalizedTime }
          : { waterReminderEnd: normalizedTime }
      );
      onClose();
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setError(t('profile.edit.invalidValue'));
      return;
    }
    if (
      (activeField === 'waterGoalCups' ||
        activeField === 'waterReminderInterval' ||
        activeField === 'dailyGoal') &&
      !Number.isInteger(parsedValue)
    ) {
      setError(t('profile.edit.invalidValue'));
      return;
    }
    if (activeField === 'waterReminderInterval') {
      const [startHour, startMinute] = user.waterReminderStart
        .split(':')
        .map(Number);
      const [endHour, endMinute] = user.waterReminderEnd.split(':').map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      if (Math.floor((end - start) / parsedValue) + 1 > 60) {
        setError(t('profile.edit.intervalTooFrequent'));
        return;
      }
    }

    switch (activeField) {
      case 'weight':
        updateUser({ weight: parsedValue });
        break;
      case 'height':
        updateUser({ height: parsedValue });
        break;
      case 'dailyGoal':
        updateUser({ dailyGoal: parsedValue });
        break;
      case 'waterGoalCups':
        updateUser({ waterGoalCups: parsedValue });
        break;
      case 'waterReminderInterval':
        updateUser({ waterReminderInterval: parsedValue });
        break;
    }
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
      case 'gender':
        return {
          title: t('profile.gender'),
          placeholder: '',
          keyboard: 'default' as KeyboardTypeOptions,
          unit: '',
        };
      case 'dailyGoal':
        return {
          title: t('profile.edit.dailyGoalTitle'),
          placeholder: t('profile.edit.dailyGoalPlaceholder'),
          keyboard: 'numeric' as KeyboardTypeOptions,
          unit: t('home.stepsUnit'),
        };
      case 'waterGoalCups':
        return {
          title: t('profile.edit.waterGoalTitle'),
          placeholder: t('profile.edit.waterGoalPlaceholder'),
          keyboard: 'numeric' as KeyboardTypeOptions,
          unit: t('water.cups'),
        };
      case 'waterReminderStart':
      case 'waterReminderEnd':
        return {
          title: t(
            activeField === 'waterReminderStart'
              ? 'profile.edit.waterStartTitle'
              : 'profile.edit.waterEndTitle'
          ),
          placeholder: t('profile.edit.timePlaceholder'),
          keyboard: 'number-pad' as KeyboardTypeOptions,
          unit: '',
        };
      case 'waterReminderInterval':
        return {
          title: t('profile.edit.waterReminderIntervalTitle'),
          placeholder: t('profile.edit.waterReminderIntervalPlaceholder'),
          keyboard: 'numeric' as KeyboardTypeOptions,
          unit: t('water.minutes'),
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
      snapPoints={['45%']}
      enablePanDownToClose
      onClose={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: card }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#8B949E' : '#94A3B8' }}
    >
      <BottomSheetView className="p-5 flex-1 justify-between">
        <AppText className="text-lg font-bold text-right mb-2" style={{ color: text }}>
          {config.title}
        </AppText>

        {activeField === 'gender' ? (
          <View className={`${rowDirection} gap-3`}>
            {(['male', 'female'] as const).map((gender) => {
              const isSelected = value === gender;
              return (
                <TouchableOpacity
                  key={gender}
                  onPress={() => setValue(gender)}
                  activeOpacity={0.8}
                  className="flex-1 items-center rounded-2xl p-4 border"
                  style={{
                    backgroundColor: isSelected ? `${accent}20` : bg,
                    borderColor: isSelected ? accent : border,
                  }}
                >
                  <AppText
                    className="font-bold text-base"
                    style={{ color: text }}
                  >
                    {t(`profile.${gender}`)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View
            className={`${rowDirection} items-center border rounded-xl px-4 py-1`}
            style={{ backgroundColor: bg, borderColor: border }}
          >
            {config.unit !== '' && (
              <AppText
                className={`font-bold text-base ${i18n.dir() === 'rtl' ? 'ml-2' : 'mr-2'}`}
                style={{ color: subText }}
              >
                {config.unit}
              </AppText>
            )}
            {isTimeField && (
              <Clock
                size={20}
                color={accent}
                style={{ marginEnd: 10 }}
              />
            )}
            <BottomSheetTextInput
              value={value}
              onChangeText={(input) => {
                setError('');
                setValue(isTimeField ? formatTimeInput(input) : input);
              }}
              onBlur={() => {
                if (!isTimeField) return;
                const normalizedTime = normalizeTimeInput(value);
                if (normalizedTime) {
                  setValue(normalizedTime);
                  setError('');
                } else {
                  setError(t('profile.edit.invalidTime'));
                }
              }}
              placeholder={config.placeholder}
              placeholderTextColor={isDark ? '#8B949E' : '#94A3B8'}
              keyboardType={config.keyboard}
              maxLength={isTimeField ? 5 : undefined}
              className={`flex-1 p-3 ${textAlignment} text-base font-semibold`}
              style={{
                color: text,
                fontFamily: i18n.language.startsWith('ar') ? 'Tajawal' : 'Inter',
              }}
              autoFocus
            />
          </View>
        )}

        {error !== '' && (
          <AppText className="text-sm text-red-500 mt-2 text-right">
            {error}
          </AppText>
        )}

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={{ backgroundColor: accent }}
          className="p-4 rounded-xl items-center mt-4 mb-2"
        >
          <AppText className="text-white font-bold text-base">
            {t('profile.edit.saveChanges')}
          </AppText>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

EditProfileModal.displayName = 'EditProfileModal';