import { memo, useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Coins,
  Crown,
  Lock,
  Check,
  User,
} from 'lucide-react-native';

import { useAppStore } from '../../../store/useAppStore';
import { BadgeIcon } from '../../components/BadgeIcon';
import { useTheme } from '../../context/ThemeContext';
import {
  appThemes,
  ringStyles,
  defaultThemeId,
  AppTheme,
  ProfileBanner,
  RingStyle,
} from '../../data/storeCatalog';

// المظهر الافتراضي غير قابل للشراء أو التبديل: يُخفى من شريط المتجر
const shopThemes = appThemes.filter((t) => t.id !== defaultThemeId);

type TabKey = 'themes' | 'rings';

const TABS: { key: TabKey; label: string; hint: string }[] = [
  {
    key: 'themes',
    label: 'ألوان التطبيق',
    hint: 'تدرجات تُطبَّق على التطبيق بالكامل',
  },
  {
    key: 'rings',
    label: 'أنماط العداد',
    hint: 'تأثير حلقة التقدم في شاشة الخطوات اليوميّة',
  },
];

type BadgeType = 'active' | 'premium' | 'locked';

const formatNumber = (n: number) => n.toLocaleString('en-US');

// ————— مكونات ثابتة معزولة لمنع إعادة الرسم أثناء تحديثات الحالة الأخرى —————
// كل مكوّن يسحب ألوان الأسطح من السياق الذرّي (نفس إطار قراءة الخلفية).

// شارة الحالة: علامة للمفعّل، تاج للمميزة، قفل للمقفلة
const StatusBadge = memo(function StatusBadge({ type }: { type: BadgeType }) {
  const { bg, border } = useTheme();
  const wrap =
    type === 'active'
      ? 'bg-emerald-500'
      : type === 'premium'
        ? 'bg-amber-400'
        : 'border';
  const wrapStyle =
    type === 'active' || type === 'premium'
      ? undefined
      : { backgroundColor: bg, borderColor: border };
  const icon =
    type === 'active' ? (
      <Check color="#FFFFFF" size={12} strokeWidth={3} />
    ) : type === 'premium' ? (
      <Crown color="#78350F" size={12} strokeWidth={2.5} />
    ) : (
      <Lock color="#94A3B8" size={11} strokeWidth={2.5} />
    );

  return (
    <View
      className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full items-center justify-center ${wrap}`}
      style={wrapStyle}
    >
      {icon}
    </View>
  );
});

// زر الإجراء أسفل كل بطاقة
const ActivePlaceholder = memo(function ActivePlaceholder({
  accent,
}: {
  accent: string;
}) {
  const { bg, border } = useTheme();

  return (
    <View
      className="rounded-xl items-center justify-center border"
      style={{
        backgroundColor: bg,
        borderColor: border,
        height: 42,
      }}
    >
      <View className="flex-row-reverse items-center gap-1 opacity-70">
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <Text className="text-[10px] font-bold" style={{ color: accent }}>
          نشط
        </Text>
      </View>
    </View>
  );
});

const ActionButton = memo(function ActionButton({
  state,
  onPress,
  price,
  primary,
  secondary,
}: {
  state: 'active' | 'apply' | 'buy';
  onPress?: () => void;
  price?: number;
  primary: string;
  secondary?: string;
}) {
  if (state === 'active') {
    return (
      <View>
        <View className="h-5 items-center justify-center mb-1.5 opacity-60">
          <Text className="text-[9px] font-bold" style={{ color: primary }}>
            محدد
          </Text>
        </View>
        <ActivePlaceholder accent={primary} />
      </View>
    );
  }

  if (state === 'apply') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: primary,
          borderColor: secondary ?? primary,
          borderWidth: 1,
          paddingVertical: 10,
          borderRadius: 8,
        }}
        className="items-center"
      >
        <Text className="text-white font-bold text-sm">تطبيق</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: `${primary}18`,
        borderColor: secondary ? `${secondary}66` : `${primary}55`,
        paddingVertical: 10,
        borderRadius: 8,
      }}
      className="items-center border flex-row justify-center gap-1"
    >
      <Coins color={primary} size={14} />
      <Text style={{ color: primary }} className="font-bold text-sm">
        شراء {formatNumber(price ?? 0)}
      </Text>
    </TouchableOpacity>
  );
});

// ————— بطاقة مظهر التطبيق (معزولة بـ React.memo) —————
const ThemeCard = memo(function ThemeCard({
  item,
  isActive,
  owned,
  onApply,
  onBuy,
}: {
  item: AppTheme;
  isActive: boolean;
  owned: boolean;
  onApply: (id: string) => void;
  onBuy: (item: AppTheme, price: number) => void;
}) {
  const { card, border, text } = useTheme();
  const badge: BadgeType | undefined = isActive
    ? 'active'
    : !owned
      ? item.premium
        ? 'premium'
        : 'locked'
      : undefined;

  return (
    <View
      className="flex-1 rounded-3xl border"
      style={{
        backgroundColor: card,
        borderColor: border,
        overflow: 'hidden',
        padding: 8,
        minHeight: 230,
      }}
    >
      {/* معاينة لون التمييز فوق الخلفية الداكنة الثابتة */}
      <View
        className="relative h-24 rounded-2xl overflow-hidden items-center justify-center"
        style={{ backgroundColor: card }}
      >
        <View
          style={{
            backgroundColor: item.secondaryGlow
              ? `${item.secondaryGlow}26`
              : `${item.accent}20`,
            borderColor: item.secondaryGlow ?? item.accent,
          }}
          className="w-12 h-12 rounded-full border-[3px] items-center justify-center"
        >
          <View
            style={{ backgroundColor: item.accent }}
            className="w-4 h-4 rounded-full"
          />
        </View>
        <View
          style={{
            backgroundColor: item.secondaryGlow
              ? `${item.secondaryGlow}22`
              : `${item.accent}20`,
          }}
          className="mt-2.5 h-1.5 w-16 rounded-full overflow-hidden"
        >
          <View
            style={{
              backgroundColor: item.secondaryGlow ?? item.accent,
              width: '70%',
            }}
            className="h-full rounded-full"
          />
        </View>
        {badge && <StatusBadge type={badge} />}
      </View>
      <View className="px-1 pt-2 pb-1">
        <Text className="text-xs font-bold text-right" style={{ color: text }}>
          {item.name}
        </Text>
        {!owned && (
          <View className="flex-row-reverse items-center gap-1 mt-0.5">
            <Coins color={item.accent} size={10} />
            <Text
              style={{ color: item.accent }}
              className="text-[10px] font-bold"
            >
              {formatNumber(item.price)}
            </Text>
          </View>
        )}
      </View>
      <View className="px-1 pb-1 flex-1 justify-end">
        <ActionButton
          state={isActive ? 'active' : owned ? 'apply' : 'buy'}
          onPress={
            isActive
              ? undefined
              : owned
                ? () => onApply(item.id)
                : () => onBuy(item, item.price)
          }
          price={item.price}
          primary={item.accent}
          secondary={item.secondaryGlow}
        />
      </View>
    </View>
  );
});

const PulseRingPreview = ({
  active,
  ringColor,
}: {
  active: boolean;
  ringColor: string;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.06, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={72} height={72} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="previewPulseGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00F0FF" stopOpacity={1} />
            <Stop offset="60%" stopColor="#00F0FF" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={50}
          cy={50}
          r={28}
          fill="none"
          stroke="url(#previewPulseGlow)"
          strokeWidth="7"
          opacity={active ? 0.9 : 0.5}
        />
        <Circle
          cx={50}
          cy={50}
          r={26}
          fill="none"
          stroke={ringColor}
          strokeWidth="5"
          opacity={active ? 1 : 0.7}
        />
      </Svg>
    </Animated.View>
  );
};

const RingPreview = ({
  style,
  active,
}: {
  style: RingStyle;
  active: boolean;
}) => {
  const ringColor = style.accent;
  const radius = 26;
  const center = 36;

  switch (style.kind) {
    case 'ticks':
      return (
        <Svg width={72} height={72} viewBox="0 0 72 72">
          {Array.from({ length: 30 }).map((_, index) => {
            const angle = (index * 360) / 30 - 90;
            const rad = (angle * Math.PI) / 180;
            const inner = 24;
            const outer = 32;
            const x1 = center + inner * Math.cos(rad);
            const y1 = center + inner * Math.sin(rad);
            const x2 = center + outer * Math.cos(rad);
            const y2 = center + outer * Math.sin(rad);
            const isActive = index < 12 && active;
            return (
              <Line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? ringColor : '#94A3B8'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
          <Circle
            cx={center}
            cy={center}
            r={7}
            fill={ringColor}
            opacity={active ? 1 : 0.7}
          />
        </Svg>
      );
    case 'wave':
      return (
        <Svg width={72} height={72} viewBox="0 0 72 72">
          {Array.from({ length: 32 }).map((_, index) => {
            const angle = (index * 360) / 32 - 90;
            const rad = (angle * Math.PI) / 180;
            const waveLength = [
              7, 9, 12, 8, 13, 10, 7, 11, 9, 13, 10, 8, 12, 15, 10, 9, 13, 11,
              8, 12, 10, 7, 11, 9, 14, 10, 8, 12, 9, 13, 10, 7,
            ][index];
            const inner = 18;
            const outer = 22 + waveLength;
            const x1 = center + inner * Math.cos(rad);
            const y1 = center + inner * Math.sin(rad);
            const x2 = center + outer * Math.cos(rad);
            const y2 = center + outer * Math.sin(rad);
            const isActive = index < 22 && active;
            return (
              <Line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? ringColor : '#94A3B8'}
                strokeWidth="2.3"
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.65}
              />
            );
          })}
          <Circle
            cx={center}
            cy={center}
            r={7}
            fill={ringColor}
            opacity={active ? 1 : 0.7}
          />
        </Svg>
      );
    case 'solid':
      return (
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="126 30"
            opacity={active ? 1 : 0.8}
          />
          <Circle
            cx={center}
            cy={center}
            r={12}
            fill={ringColor}
            opacity={active ? 1 : 0.7}
          />
        </Svg>
      );
    case 'dots':
      return (
        <Svg width={72} height={72} viewBox="0 0 72 72">
          {Array.from({ length: 20 }).map((_, index) => {
            const angle = (index * 360) / 20 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = center + 26 * Math.cos(rad);
            const y = center + 26 * Math.sin(rad);
            const visible = index < 12 && active;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={visible ? 2.8 : 2.2}
                fill={visible ? ringColor : '#94A3B8'}
              />
            );
          })}
          <Circle
            cx={center}
            cy={center}
            r={9}
            fill={ringColor}
            opacity={active ? 1 : 0.7}
          />
        </Svg>
      );
    case 'double':
      return (
        <Svg width={72} height={72} viewBox="0 0 100 100">
          <Circle
            cx={50}
            cy={50}
            r={28}
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeDasharray="12 10"
            strokeLinecap="round"
            strokeOpacity={active ? 1 : 0.7}
          />
          <Circle
            cx={50}
            cy={50}
            r={22}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeDasharray="12 10"
            strokeLinecap="round"
            strokeOpacity={active ? 0.7 : 0.5}
          />
        </Svg>
      );
    case 'dash':
      return (
        <Svg width={72} height={72} viewBox="0 0 100 100">
          <Circle
            cx={50}
            cy={50}
            r={28}
            fill="none"
            stroke={active ? ringColor : '#94A3B8'}
            strokeWidth="6"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'pulse':
      return <PulseRingPreview active={active} ringColor={ringColor} />;
    case 'arc':
      return (
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <Circle
            cx={center}
            cy={center}
            r={22}
            fill="none"
            stroke={active ? ringColor : '#94A3B8'}
            strokeWidth="6"
            strokeDasharray="70 28"
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
          <Circle
            cx={center}
            cy={center}
            r={10}
            fill={ringColor}
            opacity={active ? 1 : 0.7}
          />
        </Svg>
      );
    case 'infinity':
      return (
        <Svg width={72} height={72} viewBox="0 0 100 100">
          <Circle
            cx={50}
            cy={50}
            r={32}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            opacity={active ? 0.9 : 0.7}
          />
          <Circle
            cx={50}
            cy={50}
            r={24}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            opacity={active ? 0.8 : 0.6}
          />
        </Svg>
      );
    case 'dotted-flow':
      return (
        <Svg width={72} height={72} viewBox="0 0 100 100">
          {Array.from({ length: 28 }).map((_, index) => {
            const angle = (index / 28) * Math.PI * 2 - Math.PI / 2;
            const cx = 50 + 32 * Math.cos(angle);
            const cy = 50 + 32 * Math.sin(angle);
            const isActive = index / 28 <= (active ? 0.75 : 0.2);
            const points = [
              `${cx},${cy - 2.5}`,
              `${cx + 2.5},${cy}`,
              `${cx},${cy + 2.5}`,
              `${cx - 2.5},${cy}`,
            ].join(' ');

            return (
              <Polygon
                key={index}
                points={points}
                fill={isActive ? '#00F0FF' : '#1E293B'}
                fillOpacity={isActive ? 1 : 0.3}
                stroke={isActive ? '#00E5FF' : '#334155'}
                strokeWidth={1}
              />
            );
          })}
        </Svg>
      );
    default:
      return null;
  }
};

const RingStyleCard = memo(function RingStyleCard({
  item,
  isActive,
  owned,
  onApply,
  onBuy,
}: {
  item: RingStyle;
  isActive: boolean;
  owned: boolean;
  onApply: (id: string) => void;
  onBuy: (item: RingStyle, price: number) => void;
}) {
  const { card, border, text } = useTheme();
  const badge: BadgeType | undefined = isActive
    ? 'active'
    : !owned
      ? item.premium
        ? 'premium'
        : 'locked'
      : undefined;

  return (
    <View
      className="flex-1 rounded-3xl border"
      style={{
        backgroundColor: card,
        borderColor: border,
        overflow: 'hidden',
        padding: 8,
        minHeight: 230,
      }}
    >
      <View
        className="relative h-24 rounded-2xl overflow-hidden items-center justify-center"
        style={{ backgroundColor: card }}
      >
        <RingPreview style={item} active={isActive} />
        {badge && <StatusBadge type={badge} />}
      </View>
      <View className="px-1 pt-2 pb-1">
        <Text className="text-xs font-bold text-right" style={{ color: text }}>
          {item.name}
        </Text>
        {!owned && (
          <View className="flex-row-reverse items-center gap-1 mt-0.5">
            <Coins color={item.accent} size={10} />
            <Text
              style={{ color: item.accent }}
              className="text-[10px] font-bold"
            >
              {formatNumber(item.price)}
            </Text>
          </View>
        )}
      </View>
      <View className="px-1 pb-1 flex-1 justify-end">
        <ActionButton
          state={isActive ? 'active' : owned ? 'apply' : 'buy'}
          onPress={
            isActive
              ? undefined
              : owned
                ? () => onApply(item.id)
                : () => onBuy(item, item.price)
          }
          price={item.price}
          primary={item.accent}
        />
      </View>
    </View>
  );
});

// ————— بطاقة خلفية البروفايل (معزولة بـ React.memo) —————
const BannerCard = memo(function BannerCard({
  item,
  isActive,
  owned,
  primary,
  onApply,
  onBuy,
}: {
  item: ProfileBanner;
  isActive: boolean;
  owned: boolean;
  primary: string;
  onApply: (id: string) => void;
  onBuy: (item: ProfileBanner, price: number) => void;
}) {
  const { card, border, text } = useTheme();
  const badge: BadgeType | undefined = isActive
    ? 'active'
    : !owned
      ? item.premium
        ? 'premium'
        : 'locked'
      : undefined;

  return (
    <View
      className="flex-1 rounded-3xl border"
      style={{
        backgroundColor: card,
        borderColor: border,
        overflow: 'hidden',
        padding: 8,
        minHeight: 230,
      }}
    >
      {/* محاكاة مصغّرة لرأس البروفايل: شريط التدرج مع صورة دائرية متراكبة عليه */}
      <View className="relative h-24 rounded-2xl overflow-hidden">
        <LinearGradient
          colors={item.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="h-14 w-full"
        />
        <View
          className="absolute left-0 right-0 bottom-0 h-10"
          style={{ backgroundColor: card }}
        />
        {/* صورة البروفايل الدائرية متراكبة على حد الشريط السفلي */}
        <View
          style={{
            marginLeft: -18,
            backgroundColor: card,
            borderColor: border,
          }}
          className="absolute left-1/2 top-[38px] w-9 h-9 rounded-full border-2 items-center justify-center"
        >
          <User color="#94A3B8" size={14} />
        </View>
        {/* أيقونة الشارة على الشريط */}
        <View className="absolute top-2 left-2">
          <BadgeIcon name={item.badgeIcon} color="#FFFFFF" size={14} />
        </View>
        {badge && <StatusBadge type={badge} />}
      </View>
      <View className="px-1 pt-2 pb-1">
        <Text className="text-xs font-bold text-right" style={{ color: text }}>
          {item.name}
        </Text>
        {!owned && (
          <View className="flex-row-reverse items-center gap-1 mt-0.5">
            <Coins color={primary} size={10} />
            <Text style={{ color: primary }} className="text-[10px] font-bold">
              {formatNumber(item.price)}
            </Text>
          </View>
        )}
      </View>
      <View className="px-1 pb-1 flex-1 justify-end">
        <ActionButton
          state={isActive ? 'active' : owned ? 'apply' : 'buy'}
          onPress={
            isActive
              ? undefined
              : owned
                ? () => onApply(item.id)
                : () => onBuy(item, item.price)
          }
          price={item.price}
          primary={primary}
        />
      </View>
    </View>
  );
});

const INSUFFICIENT = 'رصيد غير كافٍ';
const INSUFFICIENT_MSG =
  'أكمل مهامك اليومية وبلوغ الهدف لجمع المزيد من العملات.';

export default function StoreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('themes');

  // اشتراكات انتقائية: قراءة كل حقل على حدة حتى لا يُعاد رسم الشاشة عند تغيير
  // أي جزء آخر لا يهم المتجر (مثل الخطوات أو المهام).
  const totalCoins = useAppStore((s) => s.totalCoins);
  const activeTheme = useAppStore((s) => s.activeTheme);
  const ownedThemes = useAppStore((s) => s.ownedThemes);
  const activeRingStyle = useAppStore((s) => s.activeRingStyle);
  const ownedRingStyles = useAppStore((s) => s.ownedRingStyles);
  const selectStoreTheme = useAppStore((s) => s.selectStoreTheme);
  const applyProfileBanner = useAppStore((s) => s.applyProfileBanner);
  const selectRingStyle = useAppStore((s) => s.selectRingStyle);
  const purchaseTheme = useAppStore((s) => s.purchaseTheme);
  const purchaseProfileBanner = useAppStore((s) => s.purchaseProfileBanner);
  const purchaseRingStyle = useAppStore((s) => s.purchaseRingStyle);

  // ألوان الأسطح والتمييز من السياق الذرّي في نفس إطار القراءة
  const { isDarkMode, accent, card, border, text, subText } = useTheme();

  // ————— معالجات الأعمال (مثبتة بـ useCallback، بلا حلقة إعادة رسم) —————
  const handleApplyTheme = useCallback(
    (id: string) => selectStoreTheme(id),
    [selectStoreTheme]
  );

  const handleApplyBanner = useCallback(
    (id: string) => applyProfileBanner(id),
    [applyProfileBanner]
  );

  const handleApplyRingStyle = useCallback(
    (id: string) => selectRingStyle(id),
    [selectRingStyle]
  );

  const handleBuyTheme = useCallback(
    (item: AppTheme, price: number) => {
      if (totalCoins < price) {
        Alert.alert(INSUFFICIENT, INSUFFICIENT_MSG);
        return;
      }
      if (purchaseTheme(item.id, price)) {
        Alert.alert(
          'تم الشراء',
          'أُضيف المظهر إلى مكتبتك، فعّله من زر «تطبيق».'
        );
      }
    },
    [totalCoins, purchaseTheme]
  );

  const handleBuyBanner = useCallback(
    (item: ProfileBanner, price: number) => {
      if (totalCoins < price) {
        Alert.alert(INSUFFICIENT, INSUFFICIENT_MSG);
        return;
      }
      if (purchaseProfileBanner(item.id, price)) {
        Alert.alert(
          'تم الشراء',
          'أُضيفت الخلفية إلى مكتبتك، فعّلها من زر «تطبيق».'
        );
      }
    },
    [totalCoins, purchaseProfileBanner]
  );

  const handleBuyRingStyle = useCallback(
    (item: RingStyle, price: number) => {
      if (totalCoins < price) {
        Alert.alert(INSUFFICIENT, INSUFFICIENT_MSG);
        return;
      }
      if (purchaseRingStyle(item.id, price)) {
        Alert.alert(
          'تم الشراء',
          'أُضيف نمط العداد إلى مكتبتك، فعّله من زر «تطبيق».'
        );
      }
    },
    [totalCoins, purchaseRingStyle]
  );

  // ————— عرض الشبكة عبر FlatList (معزول ولم يُعاد إنشاؤه إلا عند تغيّر الحالة ذات الصلة) —————
  const renderThemeItem = useCallback(
    ({ item }: { item: AppTheme }) => (
      <View style={{ transform: [{ scaleX: -1 }] }} className="flex-1">
        <ThemeCard
          item={item}
          isActive={
            activeTheme.kind === 'store' && activeTheme.themeId === item.id
          }
          owned={item.price === 0 || ownedThemes.includes(item.id)}
          onApply={handleApplyTheme}
          onBuy={handleBuyTheme}
        />
      </View>
    ),
    [activeTheme, ownedThemes, handleApplyTheme, handleBuyTheme]
  );

  const renderRingStyleItem = useCallback(
    ({ item }: { item: RingStyle }) => (
      <View style={{ transform: [{ scaleX: -1 }] }} className="flex-1">
        <RingStyleCard
          item={item}
          isActive={item.id === activeRingStyle}
          owned={item.price === 0 || ownedRingStyles.includes(item.id)}
          onApply={handleApplyRingStyle}
          onBuy={handleBuyRingStyle}
        />
      </View>
    ),
    [activeRingStyle, ownedRingStyles, handleApplyRingStyle, handleBuyRingStyle]
  );

  const activeTabData = TABS.find((t) => t.key === activeTab);

  return (
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* الرأس: رصيد العملات يميناً، زر العودة يساراً، والعنوان في المنتصف */}
      <View className="relative flex-row items-center justify-center py-3 px-4">
        <View
          className="absolute left-4 top-3 flex-row-reverse items-center gap-1 border px-3 py-1.5 rounded-full"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <Coins color={accent} size={15} />
          <Text style={{ color: accent }} className="text-sm font-black">
            {formatNumber(totalCoins)}
          </Text>
        </View>

        <Text className="text-base font-black" style={{ color: text }}>
          متجر المظهر
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="absolute right-4 w-9 h-9 rounded-full border items-center justify-center"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <ChevronRight color={accent} size={20} />
        </TouchableOpacity>
      </View>

      {/* شريط التبويبات */}
      <View
        className="mx-4 mt-4 mb-3 flex-row-reverse rounded-2xl border p-1"
        style={{ backgroundColor: card, borderColor: border }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
              style={isActive ? { backgroundColor: accent } : undefined}
              className="flex-1 py-2 rounded-xl items-center"
            >
              <Text
                className="text-sm font-bold"
                style={{ color: isActive ? '#FFFFFF' : subText }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text
        className="text-xs font-bold text-center mb-3 px-6"
        style={{ color: subText }}
      >
        {activeTabData?.hint}
      </Text>

      {/* المحتوى حسب التبويب */}
      {activeTab === 'themes' ? (
        <RtlGrid>
          <FlatList<AppTheme>
            key="themes"
            data={shopThemes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 32,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={4}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews
            renderItem={renderThemeItem}
          />
        </RtlGrid>
      ) : (
        <RtlGrid>
          <FlatList<RingStyle>
            key="rings"
            data={ringStyles}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 32,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={4}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews
            renderItem={renderRingStyleItem}
          />
        </RtlGrid>
      )}
    </SafeAreaView>
  );
}

// كامل الشبكة معكوسة لتدفق البطاقات من اليمين لليسار (RTL)، وكل بطاقة تُعاد لعكس صورتها
const RtlGrid = ({ children }: { children: ReactNode }) => (
  <View style={{ transform: [{ scaleX: -1 }] }} className="flex-1">
    {children}
  </View>
);
