import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Droplets, Minus, Plus } from 'lucide-react-native';
import { getTodayKey, useAppStore } from '../../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import AppText from './AppText';

export default function WaterCard() {
  const { t, i18n } = useTranslation();
  const { user, history, addWaterCup, setWaterCups } = useAppStore();
  const { accent, card, border, text, subText } = useTheme();
  const todayLog = history.find((log) => log.date === getTodayKey());
  const waterCups = todayLog?.waterCups ?? 0;
  const goal = Math.max(1, user.waterGoalCups);
  const progress = Math.min(waterCups / goal, 1);
  const rowDirection =
    i18n.dir() === 'rtl' ? 'flex-row-reverse' : 'flex-row';

  return (
    <View
      className="rounded-3xl border p-4 mb-5"
      style={{ backgroundColor: card, borderColor: border }}
    >
      <View className={`${rowDirection} items-center gap-2`}>
        <Droplets color={accent} size={21} />
        <AppText className="text-base font-bold" style={{ color: text }}>
          {t('water.title')}
        </AppText>
      </View>

      <View
        className="h-3 rounded-full overflow-hidden mt-4"
        style={{ backgroundColor: border }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: accent,
            alignSelf: i18n.dir() === 'rtl' ? 'flex-end' : 'flex-start',
          }}
        />
      </View>

      <View className={`${rowDirection} items-center justify-between mt-3`}>
        <AppText className="text-sm font-semibold" style={{ color: subText }}>
          {t('water.progress', { current: waterCups, goal })}
        </AppText>
        <View className={`${rowDirection} items-center gap-3`}>
          <TouchableOpacity
            accessibilityLabel={t('water.undoCup')}
            onPress={() => setWaterCups(waterCups - 1)}
            activeOpacity={0.75}
            className="w-10 h-10 rounded-full border items-center justify-center"
            style={{ borderColor: border }}
          >
            <Minus color={subText} size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={t('water.addCup')}
            onPress={addWaterCup}
            activeOpacity={0.8}
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: accent }}
          >
            <Plus color="#FFFFFF" size={28} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
