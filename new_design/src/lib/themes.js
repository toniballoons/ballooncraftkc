import { THEMES_GROUP1 } from './themes-group1';
import { THEMES_GROUP2 } from './themes-group2';
import { THEMES_GROUP3 } from './themes-group3';
import { THEMES_GROUP4 } from './themes-group4';

export const THEMES = [...THEMES_GROUP1, ...THEMES_GROUP2, ...THEMES_GROUP3, ...THEMES_GROUP4];

export const THEME_CATEGORIES = [
  { id: 'all', label: 'All Themes' },
  { id: 'default', label: '🎈 Classic' },
  { id: 'kids', label: '🧒 Kids' },
  { id: 'wedding', label: '💒 Wedding' },
  { id: 'baby_shower', label: '👶 Baby Shower' },
  { id: 'corporate', label: '🏢 Corporate' },
  { id: 'graduation', label: '🎓 Graduation' },
  { id: 'holiday', label: '🎄 Holiday' },
  { id: 'fun', label: '🎉 Fun & Party' },
  { id: 'seasonal', label: '🌸 Seasonal' },
  { id: 'luxury', label: '💎 Luxury' },
  { id: 'artistic', label: '🎨 Artistic' },
  { id: 'specialty', label: '✨ Specialty' },
  { id: 'boho', label: '🌾 Boho' },
];

export const THEME_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'variant', label: '🎨 Color Variants' },
  { id: 'template', label: '🏗️ New Templates' },
  { id: 'mixed', label: '🔀 Mixed' },
  { id: 'creative', label: '💡 Creative' },
];

export function getThemeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}