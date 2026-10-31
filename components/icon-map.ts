import { createElement } from 'react';
import type React from 'react';
import {
  Award,
  BadgeCheck,
  Bot,
  Briefcase,
  Clock,
  Cloud,
  Code,
  CreditCard,
  Film,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  Key,
  Lock,
  MessageCircle,
  Monitor,
  Music,
  Package,
  Palette,
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Tv,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Icon names admins can type in Homepage / Category settings (lucide names). */
const ICONS: Record<string, LucideIcon> = {
  Award,
  BadgeCheck,
  Bot,
  Briefcase,
  Clock,
  Cloud,
  Code,
  CreditCard,
  Film,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  Key,
  Lock,
  MessageCircle,
  Monitor,
  Music,
  Package,
  Palette,
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Tv,
  Users,
  Wallet,
  Zap,
};

export function iconFor(name?: string, fallback: LucideIcon = BadgeCheck): LucideIcon {
  return (name && ICONS[name]) || fallback;
}

/** Icon element by lucide name (for client components, where a component picked during render is not allowed). */
export function renderIcon(name: string | undefined, className: string, fallback: LucideIcon = BadgeCheck): React.ReactElement {
  return createElement(iconFor(name, fallback), { className, 'aria-hidden': true });
}
