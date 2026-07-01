'use client';
import { Globe, Video, BookOpen, MessageCircle, Gamepad2, Camera, Lightbulb } from 'lucide-react';
import type { SourceType } from '@/types/card';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<SourceType, LucideIcon> = {
  webpage: Globe,
  video: Video,
  book: BookOpen,
  social_post: MessageCircle,
  game: Gamepad2,
  screenshot: Camera,
  thought: Lightbulb,
};

const colorMap: Record<SourceType, string> = {
  webpage: 'text-blue-500',
  video: 'text-red-500',
  book: 'text-amber-700',
  social_post: 'text-pink-500',
  game: 'text-purple-500',
  screenshot: 'text-green-500',
  thought: 'text-yellow-500',
};

interface TypeIconProps {
  type: SourceType | null;
  size?: number;
}

export function TypeIcon({ type, size = 16 }: TypeIconProps) {
  const Icon = type ? iconMap[type] : Lightbulb;
  const colorClass = type ? colorMap[type] : 'text-yellow-500';
  return <Icon size={size} className={colorClass} />;
}
