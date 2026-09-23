import {
  Footprints,
  Sun,
  Sprout,
  Crown,
  Moon,
  Sparkles,
  Flame,
  Waves,
  Star,
  Heart,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import type { BadgeIconName } from '../data/storeCatalog';

const ICONS: Record<BadgeIconName, LucideIcon> = {
  footprints: Footprints,
  sun: Sun,
  sprout: Sprout,
  crown: Crown,
  moon: Moon,
  sparkles: Sparkles,
  flame: Flame,
  waves: Waves,
  star: Star,
  heart: Heart,
  zap: Zap,
};

export const BadgeIcon = ({
  name,
  color,
  size = 16,
  strokeWidth = 2,
}: {
  name: BadgeIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}) => {
  const Icon = ICONS[name] ?? Star;
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
};