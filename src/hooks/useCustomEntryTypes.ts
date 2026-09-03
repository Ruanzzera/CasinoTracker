import { useState, useEffect } from 'react';
import { entryTypeLabels } from '@/types/casino';

export interface CustomEntryType {
  value: string;
  label: string;
  color: string;
}

const STORAGE_KEY = 'casino_custom_entry_types';

const DEFAULT_COLORS = [
  '#06b6d4', '#f97316', '#84cc16', '#e11d48', '#0ea5e9',
  '#d946ef', '#14b8a6', '#f59e0b', '#6366f1', '#10b981',
];

export function useCustomEntryTypes() {
  const [customTypes, setCustomTypes] = useState<CustomEntryType[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTypes));
  }, [customTypes]);

  const addCustomType = (label: string): string => {
    const value = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const uniqueValue = value || `custom_${Date.now()}`;
    const color = DEFAULT_COLORS[customTypes.length % DEFAULT_COLORS.length];

    const newType: CustomEntryType = { value: uniqueValue, label, color };
    setCustomTypes(prev => [...prev, newType]);
    return uniqueValue;
  };

  const removeCustomType = (value: string) => {
    setCustomTypes(prev => prev.filter(t => t.value !== value));
  };

  // Merge built-in + custom into a unified list
  const allTypes: { value: string; label: string; isCustom?: boolean }[] = [
    ...Object.entries(entryTypeLabels).map(([value, label]) => ({ value, label })),
    ...customTypes.map(t => ({ value: t.value, label: t.label, isCustom: true })),
  ];

  return { customTypes, allTypes, addCustomType, removeCustomType };
}
