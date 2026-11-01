// كتالوج المتجر: مظاهر التطبيق وخلفيات البروفايل القابلة للشراء

// ————— مظاهر التطبيق —————
export interface AppTheme {
  id: string;
  name: string;
  nameKey: string;
  price: number;
  accent: string;
  secondaryGlow?: string;
  premium?: boolean;
}

export const appThemes: AppTheme[] = [
  {
    id: 'default-dark',
    name: 'الافتراضي / الليل الداكن',
    nameKey: 'store.themes.default',
    price: 0,
    accent: '#00E5FF',
    secondaryGlow: '#70F3FF',
  },
  {
    id: 'crystal-blue',
    name: 'الأزرق الكريستالي',
    nameKey: 'store.themes.crystalBlue',
    price: 250,
    accent: '#60A5FA',
    secondaryGlow: '#BFDBFE',
  },
  {
    id: 'turquoise-night',
    name: 'التركواز المتوهج',
    nameKey: 'store.themes.turquoiseNight',
    price: 350,
    accent: '#06B6D4',
    secondaryGlow: '#67E8F9',
  },
  {
    id: 'mint-wave',
    name: 'النيتروجين الأخضر',
    nameKey: 'store.themes.mintWave',
    price: 450,
    accent: '#34D399',
    secondaryGlow: '#A7F3D0',
  },
  {
    id: 'warm-sunset',
    name: 'عنبر الغروب',
    nameKey: 'store.themes.sunsetAmber',
    price: 600,
    accent: '#F59E0B',
    secondaryGlow: '#FCD34D',
  },
  {
    id: 'sunset-coral',
    name: 'المرجان الشمسي',
    nameKey: 'store.themes.sunsetCoral',
    price: 750,
    accent: '#FB7185',
    secondaryGlow: '#FDBA74',
  },
  {
    id: 'forest-emerald',
    name: 'الليموني الرياضي',
    nameKey: 'store.themes.forestEmerald',
    price: 900,
    accent: '#CCFF00',
    secondaryGlow: '#E5FF66',
  },
  {
    id: 'royal-violet',
    name: 'المرجاني المشع',
    nameKey: 'store.themes.royalViolet',
    price: 1200,
    accent: '#FF6B4A',
    secondaryGlow: '#FFA08B',
    premium: true,
  },
  {
    id: 'aurora-purple',
    name: 'التركواز الشفقي',
    nameKey: 'store.themes.auroraTeal',
    price: 1500,
    accent: '#0F766E',
    secondaryGlow: '#5EEAD4',
    premium: true,
  },
  {
    id: 'royal-deep-violet',
    name: 'القرمزي الملكي',
    nameKey: 'store.themes.royalCrimson',
    price: 2200,
    accent: '#BE123C',
    secondaryGlow: '#FDA4AF',
    premium: true,
  },
  {
    id: 'luxe-black',
    name: 'الفضي الفاخر',
    nameKey: 'store.themes.luxeSilver',
    price: 3200,
    accent: '#C0C0C0',
    secondaryGlow: '#F1F5F9',
    premium: true,
  },
  {
    id: 'polar-aurora',
    name: 'الشفق القطبي',
    nameKey: 'store.themes.polarAurora',
    price: 1800,
    accent: '#FF007F',
    secondaryGlow: '#FF80BF',
    premium: true,
  },
  {
    id: 'royal-gold',
    name: 'الذهب الملكي',
    nameKey: 'store.themes.royalGold',
    price: 2400,
    accent: '#D4AF37',
    secondaryGlow: '#F3DF8A',
    premium: true,
  },
  {
    id: 'deep-navy',
    name: 'النيلي الملكي',
    nameKey: 'store.themes.deepNavy',
    price: 1100,
    accent: '#4338CA',
    secondaryGlow: '#A5B4FC',
  },
  {
    id: 'mint-calm',
    name: 'النعناع الهادئ',
    nameKey: 'store.themes.mintCalm',
    price: 800,
    accent: '#98FF98',
    secondaryGlow: '#D1FFD1',
  },
];

export const defaultThemeId = appThemes[0].id;

// ————— أنماط العداد —————
export type RingStyleKind =
  | 'ticks'
  | 'wave'
  | 'solid'
  | 'dots'
  | 'double'
  | 'infinity'
  | 'dotted-flow'
  | 'dash'
  | 'pulse'
  | 'arc'
  | 'spiral'
  | 'star'
  | 'cube'
  | 'zigzag';

export interface RingStyle {
  id: string;
  name: string;
  nameKey: string;
  price: number;
  kind: RingStyleKind;
  accent: string;
  premium?: boolean;
}

export const ringStyles: RingStyle[] = [
  {
    id: 'ticks-default',
    name: 'الشرطات التقليدية',
    nameKey: 'store.rings.ticksDefault',
    price: 0,
    kind: 'ticks',
    accent: '#00E5FF',
  },
  {
    id: 'solid-soft',
    name: 'الخط الناعم',
    nameKey: 'store.rings.solidSoft',
    price: 200,
    kind: 'solid',
    accent: '#8B5CF6',
  },
  {
    id: 'dots-classic',
    name: 'المنقط العادي',
    nameKey: 'store.rings.dotsClassic',
    price: 450,
    kind: 'dots',
    accent: '#CCFF00',
  },
  {
    id: 'dash-ring',
    name: 'الخط المتقطع',
    nameKey: 'store.rings.dashRing',
    price: 700,
    kind: 'dash',
    accent: '#06B6D4',
  },
  {
    id: 'wave-audio',
    name: 'موجات الصوت',
    nameKey: 'store.rings.waveAudio',
    price: 0,
    kind: 'wave',
    accent: '#FF6B4A',
  },
  {
    id: 'pulse-ring',
    name: 'نبض التقدم',
    nameKey: 'store.rings.pulseRing',
    price: 1200,
    kind: 'pulse',
    accent: '#FF2052',
  },
  {
    id: 'double-ring',
    name: 'الحلقة المزدوجة',
    nameKey: 'store.rings.doubleRing',
    price: 1600,
    kind: 'double',
    accent: '#EAB308',
  },
  {
    id: 'arc-ring',
    name: 'المسار المتداخل',
    nameKey: 'store.rings.arcRing',
    price: 2200,
    kind: 'infinity',
    accent: '#FF2A85',
    premium: true,
  },
  {
    id: 'boost-ring',
    name: 'الدائرة الالماسية',
    nameKey: 'store.rings.boostRing',
    price: 3500,
    kind: 'dotted-flow',
    accent: '#FFD700',
    premium: true,
  },
  {
    id: 'spiral-ring',
    name: 'الحلزون',
    nameKey: 'store.rings.spiral',
    price: 900,
    kind: 'spiral',
    accent: '#F59E0B',
  },
  {
    id: 'star-ring',
    name: 'النجمة',
    nameKey: 'store.rings.star',
    price: 1400,
    kind: 'star',
    accent: '#FACC15',
    premium: true,
  },
  {
    id: 'cube-ring',
    name: 'المكعب',
    nameKey: 'store.rings.cube',
    price: 2200,
    kind: 'cube',
    accent: '#38BDF8',
    premium: true,
  },
  {
    id: 'zigzag-ring',
    name: 'المسار المتعرج',
    nameKey: 'store.rings.zigzag',
    price: 2800,
    kind: 'zigzag',
    accent: '#A78BFA',
    premium: true,
  },
];

export const defaultRingStyleId = ringStyles[0].id;

// ————— العروض —————
export type OfferKind =
  | 'coin-box'
  | 'streak-freeze'
  | 'multiplier'
  | 'goal-reduce'
  | 'daily-free';

export interface Offer {
  id: string;
  nameKey: string;
  descriptionKey: string;
  price: number;
  kind: OfferKind;
  value: number;
  premium?: boolean;
}

export const offers: Offer[] = [
  {
    id: 'coin-box-500',
    nameKey: 'offers.items.coinBox500.name',
    descriptionKey: 'offers.items.coinBox500.desc',
    price: 400,
    kind: 'coin-box',
    value: 500,
  },
  {
    id: 'coin-box-2000',
    nameKey: 'offers.items.coinBox2000.name',
    descriptionKey: 'offers.items.coinBox2000.desc',
    price: 1400,
    kind: 'coin-box',
    value: 2000,
    premium: true,
  },
  {
    id: 'streak-freeze-1',
    nameKey: 'offers.items.streakFreeze1.name',
    descriptionKey: 'offers.items.streakFreeze1.desc',
    price: 300,
    kind: 'streak-freeze',
    value: 1,
  },
  {
    id: 'streak-freeze-3',
    nameKey: 'offers.items.streakFreeze3.name',
    descriptionKey: 'offers.items.streakFreeze3.desc',
    price: 700,
    kind: 'streak-freeze',
    value: 3,
    premium: true,
  },
  {
    id: 'multiplier-24h',
    nameKey: 'offers.items.multiplier24h.name',
    descriptionKey: 'offers.items.multiplier24h.desc',
    price: 800,
    kind: 'multiplier',
    value: 2,
  },
  {
    id: 'multiplier-7d',
    nameKey: 'offers.items.multiplier7d.name',
    descriptionKey: 'offers.items.multiplier7d.desc',
    price: 2500,
    kind: 'multiplier',
    value: 2,
    premium: true,
  },
  {
    id: 'goal-reduce-1d',
    nameKey: 'offers.items.goalReduce1d.name',
    descriptionKey: 'offers.items.goalReduce1d.desc',
    price: 400,
    kind: 'goal-reduce',
    value: 30,
  },
  {
    id: 'daily-free',
    nameKey: 'offers.dailyFree.title',
    descriptionKey: 'offers.dailyFree.desc',
    price: 0,
    kind: 'daily-free',
    value: 10,
  },
];

// ————— خلفيات البروفايل —————
export type BadgeIconName =
  | 'footprints'
  | 'sun'
  | 'sprout'
  | 'crown'
  | 'moon'
  | 'sparkles'
  | 'flame'
  | 'waves'
  | 'star'
  | 'heart'
  | 'zap';

export interface ProfileBanner {
  id: string;
  name: string;
  nameKey: string;
  price: number;
  bannerGradient: [string, string, string];
  badgeIcon: BadgeIconName;
  premium?: boolean;
}

export const profileBanners: ProfileBanner[] = [
  {
    id: 'default-banner',
    name: 'الأصلية',
    nameKey: 'store.banners.default',
    price: 0,
    bannerGradient: ['#2F3B4C', '#45566B', '#5B7290'],
    badgeIcon: 'footprints',
  },
  {
    id: 'ocean-banner',
    name: 'المحيط',
    nameKey: 'store.banners.ocean',
    price: 300,
    bannerGradient: ['#0EA5E9', '#3B82F6', '#1E3A8A'],
    badgeIcon: 'waves',
  },
  {
    id: 'sunset-banner',
    name: 'الغروب',
    nameKey: 'store.banners.sunset',
    price: 500,
    bannerGradient: ['#F59E0B', '#F97316', '#7C2D12'],
    badgeIcon: 'sun',
  },
  {
    id: 'forest-banner',
    name: 'الغابة',
    nameKey: 'store.banners.forest',
    price: 700,
    bannerGradient: ['#22C55E', '#16A34A', '#14532D'],
    badgeIcon: 'sprout',
  },
  {
    id: 'flame-banner',
    name: 'اللهب',
    nameKey: 'store.banners.flame',
    price: 1000,
    bannerGradient: ['#F87171', '#DC2626', '#7F1D1D'],
    badgeIcon: 'flame',
  },
  {
    id: 'midnight-banner',
    name: 'منتصف الليل',
    nameKey: 'store.banners.midnight',
    price: 1400,
    bannerGradient: ['#6366F1', '#4F46E5', '#1E1B4B'],
    badgeIcon: 'moon',
  },
  {
    id: 'royal-banner',
    name: 'الملوكية',
    nameKey: 'store.banners.royal',
    price: 2500,
    bannerGradient: ['#FCD34D', '#F59E0B', '#92400E'],
    badgeIcon: 'crown',
    premium: true,
  },
  {
    id: 'cosmic-banner',
    name: 'الفضاء',
    nameKey: 'store.banners.cosmic',
    price: 3200,
    bannerGradient: ['#C084FC', '#7C3AED', '#2E1065'],
    badgeIcon: 'sparkles',
    premium: true,
  },
];

export const defaultBannerId = profileBanners[0].id;