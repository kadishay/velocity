import { format, formatDistanceToNow } from 'date-fns';
import type { DORALevel } from '../types';

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  if (days < 7) {
    return `${days.toFixed(1)}d`;
  }
  const weeks = days / 7;
  return `${weeks.toFixed(1)}w`;
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function getDoraLevel(metric: string, value: number): DORALevel {
  switch (metric) {
    case 'leadTime':
      // In hours
      if (value < 1) return 'elite';
      if (value < 24) return 'high';
      if (value < 168) return 'medium'; // 1 week
      return 'low';
    case 'deployFrequency':
      // Per day
      if (value >= 1) return 'elite'; // On-demand / multiple per day
      if (value >= 1/7) return 'high'; // Daily to weekly
      if (value >= 1/30) return 'medium'; // Weekly to monthly
      return 'low';
    case 'changeFailureRate':
      // Percentage
      if (value < 5) return 'elite';
      if (value < 10) return 'high';
      if (value < 15) return 'medium';
      return 'low';
    case 'mttr':
      // In hours
      if (value < 1) return 'elite';
      if (value < 24) return 'high';
      if (value < 168) return 'medium';
      return 'low';
    default:
      return 'medium';
  }
}

export function getDoraLevelColor(level: DORALevel): string {
  switch (level) {
    case 'elite':
      return '#10b981'; // green
    case 'high':
      return '#3b82f6'; // blue
    case 'medium':
      return '#f59e0b'; // amber
    case 'low':
      return '#ef4444'; // red
  }
}

export function getDoraLevelLabel(level: DORALevel): string {
  switch (level) {
    case 'elite':
      return 'Elite';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

export function getAIToolDisplayName(tool: string): string {
  const names: Record<string, string> = {
    copilot: 'GitHub Copilot',
    claude: 'Claude',
    cursor: 'Cursor',
    codeium: 'Codeium',
    'amazon-q': 'Amazon Q',
    gemini: 'Gemini',
    other: 'Other AI',
  };
  return names[tool] || tool;
}

export function getAIToolColor(tool: string): string {
  const colors: Record<string, string> = {
    copilot: '#6e40c9',
    claude: '#d97706',
    cursor: '#0ea5e9',
    codeium: '#22c55e',
    'amazon-q': '#ff9900',
    gemini: '#4285f4',
    other: '#6b7280',
  };
  return colors[tool] || '#6b7280';
}
