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
import {
  appThemes,
  profileBanners,
  AppTheme,
  ProfileBanner,
} from '../../data/storeCatalog';

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

// شارة الحالة: علامة للمفعّل، تاج للمميزة، قفل للمقفلة
const StatusBadge = memo(function StatusBadge({ type }: { type: BadgeType }) {
  const wrap =
    type === 'active'
      ? 'bg-emerald-500'
      : type === 'premium'
        ? 'bg-amber-400'
        : 'bg-appBg-light dark:bg-appBg-dark border border-appBorder-light dark:border-appBorder-dark';
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
  if (state === 'active') {
    return (
      <View className="rounded-xl py-2.5 items-center opacity-60 bg-appBg-light dark:bg-appBg-dark border border-appBorder-light dark:border-appBorder-dark flex-row justify-center gap-1">
        <Check color="#22C55E" size={14} strokeWidth={3} />
        <Text className="text-appSubText-light dark:text-appSubText-dark font-bold text-sm">
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
        style={{ backgroundColor: primary }}
        className="rounded-xl py-2.5 items-center"
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
      }}
      className="rounded-xl py-2.5 items-center border flex-row justify-center gap-1"
    >
      <Coins color={primary} size={14} />
      <Text style={{ color: primary }} className="font-bold text-sm">
        شراء: {formatNumber(price ?? 0)}
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
  const badge: BadgeType | undefined = isActive
    ? 'active'
    : !owned
      ? item.premium
        ? 'premium'
        : 'locked'
      : undefined;

  return (
    <View className="flex-1 bg-appCard-light dark:bg-appCard-dark rounded-3xl border border-appBorder-light dark:border-appBorder-dark p-2">
      {/* معاينة لون التمييز فوق الخلفية الداكنة الثابتة */}
      <View className="relative h-24 rounded-2xl overflow-hidden bg-appCard-light dark:bg-appCard-dark items-center justify-center">
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
        <Text className="text-appText-light dark:text-appText-dark text-xs font-bold text-right">
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
  const badge: BadgeType | undefined = isActive
    ? 'active'
    : !owned
      ? item.premium
        ? 'premium'
        : 'locked'
      : undefined;

  return (
    <View className="flex-1 bg-appCard-light dark:bg-appCard-dark rounded-3xl border border-appBorder-light dark:border-appBorder-dark p-2">
      {/* محاكاة مصغّرة لرأس البروفايل: شريط التدرج مع صورة دائرية متراكبة عليه */}
      <View className="relative h-24 rounded-2xl overflow-hidden">
        <LinearGradient
          colors={item.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="h-14 w-full"
        />
        <View className="absolute left-0 right-0 bottom-0 h-10 bg-appCard-light dark:bg-appCard-dark" />
        {/* صورة البروفايل الدائرية متراكبة على حد الشريط السفلي */}
        <View
          style={{ marginLeft: -18 }}
          className="absolute left-1/2 top-[38px] w-9 h-9 rounded-full bg-appCard-light dark:bg-appCard-dark border-2 border-appBorder-light dark:border-appBorder-dark items-center justify-center"
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
        <Text className="text-appText-light dark:text-appText-dark text-xs font-bold text-right">
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
  const themeMode = useAppStore((s) => s.themeMode);
  const totalCoins = useAppStore((s) => s.totalCoins);
  const currentThemeId = useAppStore((s) => s.currentThemeId);
  const ownedThemes = useAppStore((s) => s.ownedThemes);
  const currentProfileBannerId = useAppStore((s) => s.currentProfileBannerId);
  const ownedProfileBanners = useAppStore((s) => s.ownedProfileBanners);
  const applyTheme = useAppStore((s) => s.applyTheme);
  const applyProfileBanner = useAppStore((s) => s.applyProfileBanner);
  const purchaseTheme = useAppStore((s) => s.purchaseTheme);
  const purchaseProfileBanner = useAppStore((s) => s.purchaseProfileBanner);

  const isDark = themeMode === 'dark';
  // اللون المميز للمظهر المطبّق حاليًا (يُستخدم لهيكل المتجر وأزرار الخلفيات)
  const currentTheme =
    appThemes.find((t) => t.id === currentThemeId) ?? appThemes[0];
  const accent = currentTheme.accent;

  // ————— معالجات الأعمال (مثبتة بـ useCallback، بلا حلقة إعادة رسم) —————
  const handleApplyTheme = useCallback(
    (id: string) => applyTheme(id),
    [applyTheme]
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
          isActive={item.id === currentThemeId}
          owned={item.price === 0 || ownedThemes.includes(item.id)}
          onApply={handleApplyTheme}
          onBuy={handleBuyTheme}
        />
      </View>
    ),
    [currentThemeId, ownedThemes, handleApplyTheme, handleBuyTheme]
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
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* الرأس: زر العودة + العنوان + رصيد العملات */}
        <View className="relative flex-row items-center justify-center py-3 px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="absolute left-4 w-9 h-9 rounded-full bg-appCard-light dark:bg-appCard-dark border border-appBorder-light dark:border-appBorder-dark items-center justify-center"
          >
            <ChevronRight color={accent} size={20} />
          </TouchableOpacity>

          <Text className="text-appText-light dark:text-appText-dark text-base font-black">
            متجر المظهر
          </Text>

          <View className="absolute right-4 flex-row-reverse items-center gap-1 bg-appCard-light dark:bg-appCard-dark border border-appBorder-light dark:border-appBorder-dark px-3 py-1.5 rounded-full">
            <Coins color={accent} size={15} />
            <Text style={{ color: accent }} className="text-sm font-black">
              {formatNumber(totalCoins)}
            </Text>
          </View>
        </View>

        {/* شريط التبويبات */}
        <View className="mx-4 mb-2 flex-row-reverse bg-appCard-light dark:bg-appCard-dark rounded-2xl border border-appBorder-light dark:border-appBorder-dark p-1">
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
                  className={`text-sm font-bold ${isActive ? 'text-white' : 'text-appSubText-light dark:text-appSubText-dark'}`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-appSubText-light dark:text-appSubText-dark text-xs font-bold text-center mb-3 px-6">
          {activeTabData?.hint}
        </Text>

        {/* المحتوى حسب التبويب */}
        {activeTab === 'themes' ? (
          <RtlGrid>
            <FlatList<AppTheme>
              key="themes"
              data={appThemes}
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