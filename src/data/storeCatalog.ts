// كتالوج المتجر: مظاهر التطبيق وخلفيات البروفايل القابلة للشراء

// ————— مظاهر التطبيق (تمييز الألوان فقط، مع بقاء الخلفية والبطاقات داكنة ثابتة) —————
export interface AppTheme {
  id: string;
  name: string;
  price: number;
  // اللون المميز الديناميكي الذي يُوجَّه إلى عناصر التفاعل في التطبيق
  accent: string;
  secondaryGlow?: string;
  premium?: boolean;
}

export const appThemes: AppTheme[] = [
  {
    id: 'default-dark',
    name: 'الافتراضي / الليل الداكن',
    price: 0,
    accent: '#38BDF8',
    secondaryGlow: '#7DD3FC',
  },
  {
    id: 'turquoise-night',
    name: 'التركواز المتوهج',
    price: 200,
    accent: '#00D2FF',
    secondaryGlow: '#7CEBFF',
  },
  {
    id: 'warm-sunset',
    name: 'الوردي النيون',
    price: 350,
    accent: '#FF2A85',
    secondaryGlow: '#FF75B5',
  },
  {
    id: 'forest-emerald',
    name: 'الليموني الرياضي',
    price: 500,
    accent: '#CCFF00',
    secondaryGlow: '#E5FF66',
  },
  {
    id: 'royal-violet',
    name: 'المرجاني المشع',
    price: 650,
    accent: '#FF6B4A',
    secondaryGlow: '#FFA08B',
    premium: true,
  },
  {
    id: 'luxe-black',
    name: 'الذهبي الفاخر',
    price: 800,
    accent: '#F59E0B',
    secondaryGlow: '#FCD34D',
    premium: true,
  },
];

// المظهر الافتراضي (المجاني) المطبّق عند أول تشغيل
export const defaultThemeId = appThemes[0].id;

// ————— أنماط العداد (حلقة التقدم اليومي) —————
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
    accent: '#38BDF8',
  },
  {
    id: 'wave-audio',
    name: 'موجات الصوت',
    price: 0,
    kind: 'wave',
    accent: '#F59E0B',
  },
  {
    id: 'solid-soft',
    name: 'الخط الناعم',
    price: 75,
    kind: 'solid',
    accent: '#8B5CF6',
  },
  {
    id: 'dots-classic',
    name: 'المنقط العادي',
    price: 450,
    kind: 'dots',
    accent: '#10B981',
  },
  {
    id: 'dash-ring',
    name: 'الخط المتقطع',
    price: 220,
    kind: 'dash',
    accent: '#14B8A6',
  },
  {
    id: 'double-ring',
    name: 'الحلقة المزدوجة',
    price: 600,
    kind: 'double',
    accent: '#F59E0B',
  },
  {
    id: 'pulse-ring',
    name: 'نبض التقدم',
    price: 700,
    kind: 'pulse',
    accent: '#F97316',
  },
  {
    id: 'arc-ring',
    name: 'المسار المتداخل',
    price: 750,
    kind: 'infinity',
    accent: '#A78BFA',
    premium: true,
  },
  {
    id: 'neon-glow',
    name: 'التدفق النقطي',
    price: 850,
    kind: 'dotted-flow',
    accent: '#F43F5E',
    premium: true,
  },
];

export const defaultRingStyleId = ringStyles[0].id;

// ————— خلفيات البروفايل (شريط رأس الملف الشخصي) —————
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
  // تدرج الشريط العلوي لرأس البروفايل
  bannerGradient: [string, string, string];
  // أيقونة زخرفية تُعرض على الشريط
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
    price: 250,
    bannerGradient: ['#0EA5E9', '#3B82F6', '#1E3A8A'],
    badgeIcon: 'waves',
  },
  {
    id: 'sunset-banner',
    name: 'الغروب',
    price: 300,
    bannerGradient: ['#F59E0B', '#F97316', '#7C2D12'],
    badgeIcon: 'sun',
  },
  {
    id: 'forest-banner',
    name: 'الغابة',
    price: 350,
    bannerGradient: ['#22C55E', '#16A34A', '#14532D'],
    badgeIcon: 'sprout',
  },
  {
    id: 'flame-banner',
    name: 'اللهب',
    price: 400,
    bannerGradient: ['#F87171', '#DC2626', '#7F1D1D'],
    badgeIcon: 'flame',
  },
  {
    id: 'midnight-banner',
    name: 'منتصف الليل',
    price: 450,
    bannerGradient: ['#6366F1', '#4F46E5', '#1E1B4B'],
    badgeIcon: 'moon',
  },
  {
    id: 'royal-banner',
    name: 'الملوكية',
    price: 500,
    bannerGradient: ['#FCD34D', '#F59E0B', '#92400E'],
    badgeIcon: 'crown',
    premium: true,
  },
  {
    id: 'cosmic-banner',
    name: 'الفضاء',
    price: 550,
    bannerGradient: ['#C084FC', '#7C3AED', '#2E1065'],
    badgeIcon: 'sparkles',
    premium: true,
  },
];

// الخلفية الافتراضية (المجانية) المطبّقة على رأس البروفايل
export const defaultBannerId = profileBanners[0].id;
