import {
  memo,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
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
  profileBanners,
  defaultThemeId,
  AppTheme,
  ProfileBanner,
} from '../../data/storeCatalog';

// المظهر الافتراضي غير قابل للشراء أو التبديل: يُخفى من شريط المتجر
const shopThemes = appThemes.filter((t) => t.id !== defaultThemeId);

type TabKey = 'themes' | 'banners';

const TABS: { key: TabKey; label: string; hint: string }[] = [
  {
    key: 'themes',
    label: 'ألوان التطبيق',
    hint: 'تدرجات تُطبَّق على خلفية التطبيق بالكامل',
  },
  {
    key: 'banners',
    label: 'خلفية البروفايل',
    hint: 'شريط الألوان أعلى صفحة ملفك الشخصي',
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
const ActionButton = memo(function ActionButton({
  state,
  onPress,
  price,
  primary,
}: {
  state: 'active' | 'apply' | 'buy';
  onPress?: () => void;
  price?: number;
  primary: string;
}) {
  const { bg, border, subText } = useTheme();

  if (state === 'active') {
    return (
      <View
        className="rounded-xl py-2.5 items-center opacity-60 flex-row justify-center gap-1 border"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <Check color="#22C55E" size={14} strokeWidth={3} />
        <Text className="font-bold text-sm" style={{ color: subText }}>
          نشط
        </Text>
      </View>
    );
  }

  if (state === 'apply') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{ backgroundColor: primary, paddingVertical: 10, borderRadius: 8 }}
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
        borderColor: `${primary}55`,
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
      }}
    >
      {/* معاينة لون التمييز فوق الخلفية الداكنة الثابتة */}
      <View
        className="relative h-24 rounded-2xl overflow-hidden items-center justify-center"
        style={{ backgroundColor: card }}
      >
        <View
          style={{ borderColor: item.accent }}
          className="w-12 h-12 rounded-full border-[3px] items-center justify-center"
        >
          <View
            style={{ backgroundColor: item.accent }}
            className="w-4 h-4 rounded-full"
          />
        </View>
        <View
          style={{ backgroundColor: `${item.accent}20` }}
          className="mt-2.5 h-1.5 w-16 rounded-full overflow-hidden"
        >
          <View
            style={{ backgroundColor: item.accent, width: '70%' }}
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
            <Text style={{ color: item.accent }} className="text-[10px] font-bold">
              {formatNumber(item.price)}
            </Text>
          </View>
        )}
      </View>
      {/* حاوية الزر بها حشوة سفلية واضحة فلا يتداخل زر الشراء مع الصفوف التالية */}
      <View className="px-1 pb-1">
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
        <View className="absolute left-0 right-0 bottom-0 h-10" style={{ backgroundColor: card }} />
        {/* صورة البروفايل الدائرية متراكبة على حد الشريط السفلي */}
        <View
          style={{ marginLeft: -18, backgroundColor: card, borderColor: border }}
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
      {/* حاوية الزر بها حشوة سفلية واضحة فلا يتداخل زر الشراء مع الصفوف التالية */}
      <View className="px-1 pb-1">
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
  const currentProfileBannerId = useAppStore((s) => s.currentProfileBannerId);
  const ownedProfileBanners = useAppStore((s) => s.ownedProfileBanners);
  const selectStoreTheme = useAppStore((s) => s.selectStoreTheme);
  const applyProfileBanner = useAppStore((s) => s.applyProfileBanner);
  const purchaseTheme = useAppStore((s) => s.purchaseTheme);
  const purchaseProfileBanner = useAppStore((s) => s.purchaseProfileBanner);

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

  const handleBuyTheme = useCallback(
    (item: AppTheme, price: number) => {
      if (totalCoins < price) {
        Alert.alert(INSUFFICIENT, INSUFFICIENT_MSG);
        return;
      }
      if (purchaseTheme(item.id, price)) {
        Alert.alert('تم الشراء', 'أُضيف المظهر إلى مكتبتك، فعّله من زر «تطبيق».');
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

  const renderBannerItem = useCallback(
    ({ item }: { item: ProfileBanner }) => (
      <View style={{ transform: [{ scaleX: -1 }] }} className="flex-1">
        <BannerCard
          item={item}
          isActive={item.id === currentProfileBannerId}
          owned={item.price === 0 || ownedProfileBanners.includes(item.id)}
          primary={accent}
          onApply={handleApplyBanner}
          onBuy={handleBuyBanner}
        />
      </View>
    ),
    [
      currentProfileBannerId,
      ownedProfileBanners,
      accent,
      handleApplyBanner,
      handleBuyBanner,
    ]
  );

  const activeTabData = TABS.find((t) => t.key === activeTab);

  return (
    <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        {/* الرأس: رصيد العملات يميناً، زر العودة يساراً، والعنوان في المنتصف */}
        <View className="relative flex-row items-center justify-center py-3 px-4">
          <View
            className="absolute left-4 flex-row-reverse items-center gap-1 border px-3 py-1.5 rounded-full"
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
          className="mx-4 mb-2 flex-row-reverse rounded-2xl border p-1"
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

        <Text className="text-xs font-bold text-center mb-3 px-6" style={{ color: subText }}>
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
            <FlatList<ProfileBanner>
              key="banners"
              data={profileBanners}
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
              renderItem={renderBannerItem}
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