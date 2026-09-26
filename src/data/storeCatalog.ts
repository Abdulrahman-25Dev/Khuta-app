// كتالوج المتجر: مظاهر التطبيق وخلفيات البروفايل القابلة للشراء

// ————— مظاهر التطبيق —————
export interface AppTheme {
  id: string;
  name: string;
  price: number;
  accent: string;
  secondaryGlow?: string;
  premium?: boolean;
}

export const appThemes: AppTheme[] = [
  {
    id: 'default-dark',
    name: 'الافتراضي / الليل الداكن',
    price: 0,
    accent: '#00E5FF',
    secondaryGlow: '#70F3FF',
  },
  {
    id: 'crystal-blue',
    name: 'الأزرق الكريستالي',
    price: 250,
    accent: '#60A5FA',
    secondaryGlow: '#BFDBFE',
  },
  {
    id: 'turquoise-night',
    name: 'التركواز المتوهج',
    price: 350,
    accent: '#06B6D4',
    secondaryGlow: '#67E8F9',
  },
  {
    id: 'mint-wave',
    name: 'النيتروجين الأخضر',
    price: 450,
    accent: '#34D399',
    secondaryGlow: '#A7F3D0',
  },
  {
    id: 'warm-sunset',
    name: 'الوردي النيون',
    price: 600,
    accent: '#FF2A85',
    secondaryGlow: '#FF75B5',
  },
  {
    id: 'sunset-coral',
    name: 'المرجان الشمسي',
    price: 750,
    accent: '#FB7185',
    secondaryGlow: '#FDBA74',
  },
  {
    id: 'forest-emerald',
    name: 'الليموني الرياضي',
    price: 900,
    accent: '#CCFF00',
    secondaryGlow: '#E5FF66',
  },
  {
    id: 'royal-violet',
    name: 'المرجاني المشع',
    price: 1200,
    accent: '#FF6B4A',
    secondaryGlow: '#FFA08B',
    premium: true,
  },
  {
    id: 'aurora-purple',
    name: 'الأورورا البنفسجية',
    price: 1500,
    accent: '#A78BFA',
    secondaryGlow: '#DDD6FE',
    premium: true,
  },
  {
    id: 'royal-deep-violet',
    name: 'البنفسجي الملكي',
    price: 2200,
    accent: '#8B5CF6',
    secondaryGlow: '#C4B5FD',
    premium: true,
  },
  {
    id: 'luxe-black',
    name: 'الذهبي الفاخر',
    price: 3200,
    accent: '#FFD700',
    secondaryGlow: '#FFF066',
    premium: true,
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
  | 'arc';

export interface RingStyle {
  id: string;
  name: string;
  price: number;
  kind: RingStyleKind;
  accent: string;
  premium?: boolean;
}

export const ringStyles: RingStyle[] = [
  {
    id: 'ticks-default',
    name: 'الشرطات التقليدية',
    price: 0,
    kind: 'ticks',
    accent: '#00E5FF',
  },
  {
    id: 'solid-soft',
    name: 'الخط الناعم',
    price: 200,
    kind: 'solid',
    accent: '#8B5CF6',
  },
  {
    id: 'dots-classic',
    name: 'المنقط العادي',
    price: 450,
    kind: 'dots',
    accent: '#CCFF00',
  },
  {
    id: 'dash-ring',
    name: 'الخط المتقطع',
    price: 700,
    kind: 'dash',
    accent: '#06B6D4',
  },
  {
    id: 'wave-audio',
    name: 'موجات الصوت',
    price: 0,
    kind: 'wave',
    accent: '#FF6B4A',
  },
  {
    id: 'pulse-ring',
    name: 'نبض التقدم',
    price: 1200,
    kind: 'pulse',
    accent: '#FF2052',
  },
  {
    id: 'double-ring',
    name: 'الحلقة المزدوجة',
    price: 1600,
    kind: 'double',
    accent: '#EAB308',
  },
  {
    id: 'arc-ring',
    name: 'المسار المتداخل',
    price: 2200,
    kind: 'infinity',
    accent: '#FF2A85',
    premium: true,
  },
  {
    id: 'boost-ring',
    name: 'الدائرة الالماسية',
    price: 3500,
    kind: 'dotted-flow',
    accent: '#FFD700',
    premium: true,
  },
];

export const defaultRingStyleId = ringStyles[0].id;

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
  price: number;
  bannerGradient: [string, string, string];
  badgeIcon: BadgeIconName;
  premium?: boolean;
}

export const profileBanners: ProfileBanner[] = [
  {
    id: 'default-banner',
    name: 'الأصلية',
    price: 0,
    bannerGradient: ['#2F3B4C', '#45566B', '#5B7290'],
    badgeIcon: 'footprints',
  },
  {
    id: 'ocean-banner',
    name: 'المحيط',
    price: 300,
    bannerGradient: ['#0EA5E9', '#3B82F6', '#1E3A8A'],
    badgeIcon: 'waves',
  },
  {
    id: 'sunset-banner',
    name: 'الغروب',
    price: 500,
    bannerGradient: ['#F59E0B', '#F97316', '#7C2D12'],
    badgeIcon: 'sun',
  },
  {
    id: 'forest-banner',
    name: 'الغابة',
    price: 700,
    bannerGradient: ['#22C55E', '#16A34A', '#14532D'],
    badgeIcon: 'sprout',
  },
  {
    id: 'flame-banner',
    name: 'اللهب',
    price: 1000,
    bannerGradient: ['#F87171', '#DC2626', '#7F1D1D'],
    badgeIcon: 'flame',
  },
  {
    id: 'midnight-banner',
    name: 'منتصف الليل',
    price: 1400,
    bannerGradient: ['#6366F1', '#4F46E5', '#1E1B4B'],
    badgeIcon: 'moon',
  },
  {
    id: 'royal-banner',
    name: 'الملوكية',
    price: 2500,
    bannerGradient: ['#FCD34D', '#F59E0B', '#92400E'],
    badgeIcon: 'crown',
    premium: true,
  },
  {
    id: 'cosmic-banner',
    name: 'الفضاء',
    price: 3200,
    bannerGradient: ['#C084FC', '#7C3AED', '#2E1065'],
    badgeIcon: 'sparkles',
    premium: true,
  },
];

export const defaultBannerId = profileBanners[0].id;