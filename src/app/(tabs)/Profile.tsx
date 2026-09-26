import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Href } from 'expo-router';
import {
  User,
  Target,
  Palette,
  Bell,
  ChevronLeft,
  Award,
  Ruler,
  Weight,
  Camera,
  Sun,
  Moon,
  Check,
  Sprout,
  Footprints,
  Zap,
  Flame,
  Crown,
  Trophy,
  Store,
  Coins,
  LucideIcon,
} from 'lucide-react-native';

import {
  useAppStore,
  colorPalettes,
  AccentColor,
} from '../../../store/useAppStore';
import { EditProfileModal, FieldType } from '../../components/EditProfileModal';
import { profileBanners } from '../../data/storeCatalog';
import { useTheme } from '../../context/ThemeContext';
import { showCustomModal } from '../../store/useModalStore';
import { getUserLevel } from '../../utils/levelUtils';

const levelIcons: Record<number, LucideIcon> = {
  1: Sprout,
  2: Footprints,
  3: Zap,
  4: Flame,
  5: Award,
  6: Crown,
  7: Trophy,
};

const Profile = () => {
  const router = useRouter();
  // جلب البيانات والحالات مباشرة من المتجر
  const {
    user,
    updateUser,
    history,
    totalCoins,
    selectProfileTheme,
    toggleTheme,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useAppStore();

  // كل الألوان والاسم الظاهر من السياق الذرّي: لون التمييز + الأسطح + المظهر النشط
  const { isDarkMode, accent, bg, card, border, text, subText, theme } =
    useTheme();
  const isDark = isDarkMode;
  // خلفية البروفايل النشطة من المتجر (تُطبَّق فوراً دون إعادة تشغيل)
  const currentProfileBannerId = useAppStore((s) => s.currentProfileBannerId);
  const banner =
    profileBanners.find((b) => b.id === currentProfileBannerId) ??
    profileBanners[0];

  const totalSteps = history.reduce((sum, log) => sum + log.steps, 0);
  const totalCalories = Math.round(totalSteps * 0.04);

  const bestStreak = (() => {
    const goalDates = history
      .filter((log) => log.goalReached)
      .map((log) => log.date)
      .sort();

    let best = 0;
    let current = 0;
    let prevTime = 0;

    for (const dateStr of goalDates) {
      const time = new Date(dateStr + 'T00:00:00').getTime();
      if (prevTime && time - prevTime === 86400000) {
        current += 1;
      } else {
        current = 1;
      }
      prevTime = time;
      best = Math.max(best, current);
    }

    return best;
  })();

  const formatNumber = (n: number) => n.toLocaleString('en-US');

  // صياغة مضغوطة للأعداد الكبيرة مثل 5.5k أو 1.2M
  const formatCompact = (n: number) => {
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (n >= 1000) {
      const value = n / 1000;
      return `${value >= 100 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}k`;
    }
    return n.toLocaleString('en-US');
  };

  const currentLevel = getUserLevel(totalSteps);
  const LevelIcon = levelIcons[currentLevel.level];

  // مرجع الـ Bottom Sheet والحقل النشط
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeField, setActiveField] = useState<FieldType>(null);

  // دالة اختيار الصورة
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showCustomModal({
        title: 'الصلاحية مطلوبة',
        message: 'يلزم السماح بالوصول للصور لتغيير صورة البروفايل',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      updateUser({ image: result.assets[0].uri });
    }
  };

  // دالة فتح الـ Bottom Sheet وتمرير نوع الحقل
  const openEditModal = (field: FieldType) => {
    setActiveField(field);
    bottomSheetRef.current?.expand();
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 p-4">
        {/* 1. شريط خلفية البروفايل + الصورة والاسم والمستوى */}
        <View className="items-center my-5">
          <View className="w-full">
            {/* شريط التدرج العلوي */}
            <LinearGradient
              colors={banner.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-32 w-full rounded-3xl"
            />

            {/* صورة البروفايل متراكبة على حافة الشريط السفلي */}
            <View className="items-center">
              <View className="relative">
                {/* الإطار الخارجي + قص الصورة داخل الدائرة تماماً */}
                <View className="w-24 h-24 rounded-full justify-center items-center">
                  <View className="w-full h-full rounded-full overflow-hidden justify-center items-center">
                    {user.image ? (
                      <Image
                        source={{ uri: user.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <User color={accent} size={44} />
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                  style={{ backgroundColor: accent }}
                  className="absolute bottom-1 -right-1 p-1.5 rounded-full border-2 z-10"
                >
                  <Camera color="#FFFFFF" size={14} />
                </TouchableOpacity>
              </View>
            </View>

            <Text
              className="text-xl font-bold mt-3 text-center"
              style={{ color: text }}
            >
              {user.name}
            </Text>
            <View className="flex-row-reverse items-center gap-1 mt-1 justify-center">
              <LevelIcon color={accent} size={18} />
              <Text
                className="text-xs font-semibold"
                style={{ color: subText }}
              >
                المستوى {currentLevel.level} • {currentLevel.title}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. مفتاح الوضع الفاتح / الداكن */}
        <View
          className="flex-row-reverse items-center justify-between p-4 rounded-3xl border mb-4"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <View className="flex-row-reverse items-center gap-3">
            <View
              className="w-9 h-9 rounded-full justify-center items-center"
              style={{ backgroundColor: bg }}
            >
              {isDark ? (
                <Moon color={accent} size={18} />
              ) : (
                <Sun color={accent} size={18} />
              )}
            </View>
            <View>
              <Text
                className="text-sm font-bold text-right"
                style={{ color: text }}
              >
                الوضع الداكن
              </Text>
              <Text className="text-xs text-right" style={{ color: subText }}>
                {isDark ? 'مُفعّل' : 'مُعطّل'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#CBD5E1', true: accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* 3. اختيار ريشة ألوان الهوية */}
        <View
          className="p-4 rounded-3xl border mb-6"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <View className="flex-row-reverse items-center gap-2 mb-3">
            <Palette color={accent} size={18} />
            {/* اسم المظهر يعكس المصدر النشط فعلياً (مظهر المتجر أو اللون الافتراضي) */}
            <Text
              className="text-sm font-bold text-right"
              style={{ color: text }}
            >
              {theme.name}
            </Text>
          </View>

          <View className="flex-row justify-around items-center pt-1">
            {(Object.keys(colorPalettes) as AccentColor[]).map((key) => {
              const palette = colorPalettes[key];
              // علامة الاختيار تظهر فقط عندما يكون اللون الافتراضي هو المصدر النشط فعلاً
              const isSelected = theme.kind === 'profile' && theme.id === key;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => selectProfileTheme(key)}
                  activeOpacity={0.8}
                  style={{ backgroundColor: palette.primary }}
                  className={`w-10 h-10 rounded-full justify-center items-center ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                      : 'opacity-80'
                  }`}
                >
                  {isSelected && (
                    <Check color="#FFFFFF" size={16} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. كارت الإحصائيات الشاملة */}
        <View
          className="flex-row-reverse p-4 rounded-3xl border justify-between mb-6"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <View className="items-center flex-1">
            <Text style={{ color: accent }} className="text-base font-bold">
              {formatCompact(totalSteps)}
            </Text>
            <Text className="text-[10px] mt-1" style={{ color: subText }}>
              إجمالي الخطوات
            </Text>
          </View>
          <View
            className="w-[1px] h-full"
            style={{ backgroundColor: border }}
          />
          <View className="items-center flex-1">
            <Text style={{ color: accent }} className="text-base font-bold">
              {formatNumber(bestStreak)} {bestStreak === 1 ? 'يوم' : 'أيام'}
            </Text>
            <Text className="text-[10px] mt-1" style={{ color: subText }}>
              أعلى ستريك
            </Text>
          </View>
          <View
            className="w-[1px] h-full"
            style={{ backgroundColor: border }}
          />
          <View className="items-center flex-1">
            <Text style={{ color: accent }} className="text-base font-bold">
              {formatCompact(totalCalories)}
            </Text>
            <Text className="text-[10px] mt-1" style={{ color: subText }}>
              سعرة حرارية
            </Text>
          </View>
        </View>

        {/* 5. المتجر والربح */}
        <Text
          className="text-xs font-bold text-right mb-2 pr-1"
          style={{ color: subText }}
        >
          المتجر والربح
        </Text>
        <View
          className="rounded-3xl border overflow-hidden mb-6"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <TouchableOpacity
            onPress={() => router.push('/store' as Href)}
            activeOpacity={0.8}
            className="flex-row-reverse justify-between items-center p-4"
          >
            <View className="flex-row-reverse items-center gap-3">
              <View
                className="w-9 h-9 rounded-full justify-center items-center"
                style={{ backgroundColor: bg }}
              >
                <Store color={accent} size={18} />
              </View>
              <View>
                <Text
                  className="text-sm font-bold text-right"
                  style={{ color: text }}
                >
                  متجر خُطى
                </Text>
                <View className="flex-row-reverse items-center gap-1 mt-1">
                  <Coins color={accent} size={12} />
                  <Text style={{ color: accent }} className="text-xs font-bold">
                    {formatNumber(totalCoins)} عملة
                  </Text>
                </View>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>
        </View>

        {/* 6. قسم البيانات الشخصية والبدنية */}
        <Text
          className="text-xs font-bold text-right mb-2 pr-1"
          style={{ color: subText }}
        >
          البيانات الشخصية
        </Text>
        <View
          className="rounded-3xl border overflow-hidden mb-6"
          style={{ backgroundColor: card, borderColor: border }}
        >
          {/* تعديل الاسم */}
          <TouchableOpacity
            onPress={() => openEditModal('name')}
            className="flex-row-reverse justify-between items-center p-4 border-b"
            style={{ borderBottomColor: border }}
          >
            <View className="flex-row-reverse items-center gap-3">
              <View
                className="w-9 h-9 rounded-full justify-center items-center"
                style={{ backgroundColor: bg }}
              >
                <User color={accent} size={18} />
              </View>
              <View>
                <Text
                  className="text-sm font-bold text-right"
                  style={{ color: text }}
                >
                  اسم المستخدم
                </Text>
                <Text className="text-xs text-right" style={{ color: subText }}>
                  {user.name}
                </Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* تعديل الوزن */}
          <TouchableOpacity
            onPress={() => openEditModal('weight')}
            className="flex-row-reverse justify-between items-center p-4 border-b"
            style={{ borderBottomColor: border }}
          >
            <View className="flex-row-reverse items-center gap-3">
              <View
                className="w-9 h-9 rounded-full justify-center items-center"
                style={{ backgroundColor: bg }}
              >
                <Weight color={accent} size={18} />
              </View>
              <View>
                <Text
                  className="text-sm font-bold text-right"
                  style={{ color: text }}
                >
                  الوزن
                </Text>
                <Text className="text-xs text-right" style={{ color: subText }}>
                  {user.weight} كجم
                </Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* تعديل الطول */}
          <TouchableOpacity
            onPress={() => openEditModal('height')}
            className="flex-row-reverse justify-between items-center p-4 border-b"
            style={{ borderBottomColor: border }}
          >
            <View className="flex-row-reverse items-center gap-3">
              <View
                className="w-9 h-9 rounded-full justify-center items-center"
                style={{ backgroundColor: bg }}
              >
                <Ruler color={accent} size={18} />
              </View>
              <View>
                <Text
                  className="text-sm font-bold text-right"
                  style={{ color: text }}
                >
                  الطول
                </Text>
                <Text className="text-xs text-right" style={{ color: subText }}>
                  {user.height} سم
                </Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* تعديل الهدف اليومي */}
          <TouchableOpacity
            onPress={() => openEditModal('dailyGoal')}
            className="flex-row-reverse justify-between items-center p-4"
          >
            <View className="flex-row-reverse items-center gap-3">
              <View
                className="w-9 h-9 rounded-full justify-center items-center"
                style={{ backgroundColor: bg }}
              >
                <Target color={accent} size={18} />
              </View>
              <View>
                <Text
                  className="text-sm font-bold text-right"
                  style={{ color: text }}
                >
                  الهدف اليومي
                </Text>
                <Text className="text-xs text-right" style={{ color: subText }}>
                  {user.dailyGoal?.toLocaleString()} خطوة/يوم
                </Text>
              </View>
            </View>
            <ChevronLeft color="#94A3B8" size={18} />
          </TouchableOpacity>
        </View>

        {/* 7. قسم التنبيهات والإعدادات */}
        <Text
          className="text-xs font-bold text-right mb-2 pr-1"
          style={{ color: subText }}
        >
          الإعدادات
        </Text>
        <View
          className="rounded-3xl border overflow-hidden mb-10"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <View className="flex-row-reverse items-center justify-between p-4">
            <View className="flex-row-reverse items-center gap-3">
              <View
                className="w-9 h-9 rounded-full justify-center items-center"
                style={{ backgroundColor: bg }}
              >
                <Bell color={accent} size={18} />
              </View>
              <View>
                <Text
                  className="text-sm font-bold text-right"
                  style={{ color: text }}
                >
                  تنبيهات الهدف اليومي
                </Text>
                <Text className="text-xs text-right" style={{ color: subText }}>
                  {notificationsEnabled ? 'مُفعّلة' : 'مُعطّلة'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* الـ Bottom Sheet الديناميكي للتعديل */}
      <EditProfileModal
        ref={bottomSheetRef}
        activeField={activeField}
        onClose={() => setActiveField(null)}
      />
    </SafeAreaView>
  );
};

export default Profile;
