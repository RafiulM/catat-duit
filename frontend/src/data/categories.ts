import {
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleEllipsis,
  Coffee,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  House,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  ReceiptText,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import type { Category, CategoryType } from './types';

type IconRecord = Record<string, LucideIcon>;

export const CATEGORY_ICONS: IconRecord = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  receipt: ReceiptText,
  'receipt-text': ReceiptText,
  'heart-pulse': HeartPulse,
  heart: Heart,
  'gamepad-2': Gamepad2,
  'graduation-cap': GraduationCap,
  house: House,
  home: Home,
  wallet: Wallet,
  gift: Gift,
  'trending-up': TrendingUp,
  laptop: Laptop,
  'circle-ellipsis': CircleEllipsis,
  shapes: Shapes,
  tag: Tag,
  coffee: Coffee,
  fuel: Fuel,
  bus: Bus,
  'shopping-cart': ShoppingCart,
  'book-open': BookOpen,
  briefcase: Briefcase,
  'piggy-bank': PiggyBank,
  landmark: Landmark,
  smartphone: Smartphone,
  wifi: Wifi,
  zap: Zap,
  plane: Plane,
  users: Users,
};

export type DefaultCategorySeed = Omit<Category, 'isArchived'> & {
  color: string;
};

const DESIGN_PALETTE = {
  lime: colors.lime,
  blue: colors.blue,
  pink: colors.pink,
  yellow: colors.yellow,
  violet: colors.violet,
  turquoise: colors.turquoise,
  mint: colors.mint,
} as const;

/**
 * IDs mirror backend/src/db/default-categories.ts so guest transactions can be
 * pushed to the server unchanged after the user creates an account.
 */
export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    name: 'Makan',
    type: 'expense',
    icon: 'utensils',
    color: DESIGN_PALETTE.lime,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    name: 'Transport',
    type: 'expense',
    icon: 'car',
    color: DESIGN_PALETTE.blue,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    name: 'Belanja',
    type: 'expense',
    icon: 'shopping-bag',
    color: DESIGN_PALETTE.pink,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000004',
    name: 'Tagihan',
    type: 'expense',
    icon: 'receipt',
    color: DESIGN_PALETTE.yellow,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000005',
    name: 'Kesehatan',
    type: 'expense',
    icon: 'heart-pulse',
    color: DESIGN_PALETTE.violet,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000006',
    name: 'Hiburan',
    type: 'expense',
    icon: 'gamepad-2',
    color: DESIGN_PALETTE.turquoise,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000007',
    name: 'Pendidikan',
    type: 'expense',
    icon: 'graduation-cap',
    color: DESIGN_PALETTE.mint,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000008',
    name: 'Rumah',
    type: 'expense',
    icon: 'house',
    color: DESIGN_PALETTE.blue,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000009',
    name: 'Gaji',
    type: 'income',
    icon: 'wallet',
    color: DESIGN_PALETTE.mint,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000010',
    name: 'Bonus',
    type: 'income',
    icon: 'gift',
    color: DESIGN_PALETTE.yellow,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000011',
    name: 'Investasi',
    type: 'income',
    icon: 'trending-up',
    color: DESIGN_PALETTE.turquoise,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000012',
    name: 'Freelance',
    type: 'income',
    icon: 'laptop',
    color: DESIGN_PALETTE.blue,
    isDefault: true,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000013',
    name: 'Lainnya',
    type: 'both',
    icon: 'circle-ellipsis',
    color: DESIGN_PALETTE.turquoise,
    isDefault: true,
  },
];

export const CATEGORY_COLOR_CHOICES = [
  colors.lime,
  colors.blue,
  colors.pink,
  colors.yellow,
  colors.violet,
  colors.turquoise,
  colors.mint,
] as const;

export const CATEGORY_ICON_CHOICES = [
  'tag',
  'coffee',
  'fuel',
  'bus',
  'shopping-cart',
  'book-open',
  'briefcase',
  'piggy-bank',
  'smartphone',
  'plane',
  'heart',
  'wallet',
] as const;

export function categoriesForType(
  categories: Category[],
  type: CategoryType,
): Category[] {
  return categories.filter(
    (category) =>
      !category.isArchived &&
      (category.type === type || category.type === 'both'),
  );
}

export function findCategory(
  categories: Category[],
  id: string,
): Category | undefined {
  return categories.find((category) => category.id === id);
}

