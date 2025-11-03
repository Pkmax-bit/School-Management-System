'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'gradient' | 'solid' | 'radial' | 'grid' | 'pattern';
  config: {
    colors: string[];
    position?: string;
    size?: string;
    direction?: string;
    gridSize?: string;
    gridLineWidth?: string;
    gridOpacity?: string;
    patternType?: string;
    customStyle?: React.CSSProperties;
  };
}

export const DEFAULT_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'emerald-glow',
    name: 'Emerald Glow',
    type: 'radial',
    config: {
      colors: ['#ffffff', '#10b981'],
      position: '50% 90%',
      size: '125% 125%',
    },
  },
  {
    id: 'blue-ocean',
    name: 'Blue Ocean',
    type: 'radial',
    config: {
      colors: ['#ffffff', '#3b82f6'],
      position: '50% 10%',
      size: '125% 125%',
    },
  },
  {
    id: 'purple-dream',
    name: 'Purple Dream',
    type: 'radial',
    config: {
      colors: ['#ffffff', '#8b5cf6'],
      position: '50% 90%',
      size: '125% 125%',
    },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    type: 'radial',
    config: {
      colors: ['#ffffff', '#f59e0b'],
      position: '50% 10%',
      size: '125% 125%',
    },
  },
  {
    id: 'pink-blossom',
    name: 'Pink Blossom',
    type: 'radial',
    config: {
      colors: ['#ffffff', '#ec4899'],
      position: '50% 90%',
      size: '125% 125%',
    },
  },
  {
    id: 'white',
    name: 'White',
    type: 'solid',
    config: {
      colors: ['#ffffff'],
    },
  },
  {
    id: 'grid-blue',
    name: 'Grid Blue',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#3b82f6'],
      gridSize: '20px',
      gridLineWidth: '1px',
      gridOpacity: '0.15',
    },
  },
  {
    id: 'grid-green',
    name: 'Grid Green',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#10b981'],
      gridSize: '20px',
      gridLineWidth: '1px',
      gridOpacity: '0.15',
    },
  },
  {
    id: 'grid-purple',
    name: 'Grid Purple',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#8b5cf6'],
      gridSize: '20px',
      gridLineWidth: '1px',
      gridOpacity: '0.15',
    },
  },
  {
    id: 'grid-pink',
    name: 'Grid Pink',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#ec4899'],
      gridSize: '20px',
      gridLineWidth: '1px',
      gridOpacity: '0.15',
    },
  },
  {
    id: 'grid-orange',
    name: 'Grid Orange',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#f59e0b'],
      gridSize: '20px',
      gridLineWidth: '1px',
      gridOpacity: '0.15',
    },
  },
  {
    id: 'grid-dark',
    name: 'Grid Dark',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#1f2937'],
      gridSize: '20px',
      gridLineWidth: '1px',
      gridOpacity: '0.2',
    },
  },
  {
    id: 'grid-dots-blue',
    name: 'Grid Dots Blue',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#3b82f6'],
      gridSize: '30px',
      gridLineWidth: '2px',
      gridOpacity: '0.2',
    },
  },
  {
    id: 'grid-large',
    name: 'Grid Large',
    type: 'grid',
    config: {
      colors: ['#ffffff', '#10b981'],
      gridSize: '40px',
      gridLineWidth: '1px',
      gridOpacity: '0.1',
    },
  },
  {
    id: 'diagonal-grid-spotlight',
    name: 'Diagonal Grid Spotlight',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#10b981'],
      patternType: 'diagonal-grid-spotlight',
    },
  },
  {
    id: 'circuit-board',
    name: 'Circuit Board',
    type: 'pattern',
    config: {
      colors: ['#f8fafc', '#e2e8f0'],
      patternType: 'circuit-board',
    },
  },
  {
    id: 'noise-texture',
    name: 'Noise Texture',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#000000'],
      patternType: 'noise-texture',
    },
  },
  {
    id: 'crosshatch-art',
    name: 'Crosshatch Art',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#4b5563'],
      patternType: 'crosshatch-art',
    },
  },
  {
    id: 'diagonal-stripes',
    name: 'Diagonal Stripes',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#f3f4f6'],
      patternType: 'diagonal-stripes',
    },
  },
  {
    id: 'diagonal-cross-center',
    name: 'Diagonal Cross Center',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#e5e7eb'],
      patternType: 'diagonal-cross-center',
    },
  },
  {
    id: 'diagonal-cross-bottom-right',
    name: 'Diagonal Cross Bottom Right',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#e5e7eb'],
      patternType: 'diagonal-cross-bottom-right',
    },
  },
  {
    id: 'diagonal-cross-grid',
    name: 'Diagonal Cross Grid',
    type: 'pattern',
    config: {
      colors: ['#ffffff', '#e5e7eb'],
      patternType: 'diagonal-cross-grid',
    },
  },
];

const STORAGE_KEY = 'background_settings';

export interface BackgroundSettings {
  selectedPresetId: string | null;
  customPresets: BackgroundPreset[];
  currentConfig: BackgroundPreset | null;
}

interface BackgroundSettingsContextType {
  settings: BackgroundSettings;
  selectPreset: (presetId: string) => void;
  addCustomPreset: (preset: BackgroundPreset) => void;
  updateCustomPreset: (id: string, preset: BackgroundPreset) => void;
  deleteCustomPreset: (id: string) => void;
  getAllPresets: () => BackgroundPreset[];
  getBackgroundStyle: (config: BackgroundPreset | null) => React.CSSProperties;
  currentConfig: BackgroundPreset | null;
}

const BackgroundSettingsContext = createContext<BackgroundSettingsContextType | undefined>(undefined);

export function BackgroundSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BackgroundSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const allPresets = [...DEFAULT_BACKGROUNDS, ...(parsed.customPresets || [])];
          const currentPreset = allPresets.find(p => p.id === parsed.selectedPresetId);
          return {
            ...parsed,
            currentConfig: currentPreset || DEFAULT_BACKGROUNDS[0],
          };
        } catch (e) {
          console.error('Error parsing background settings:', e);
        }
      }
    }
    return {
      selectedPresetId: DEFAULT_BACKGROUNDS[0].id,
      customPresets: [],
      currentConfig: DEFAULT_BACKGROUNDS[0],
    };
  });

  // Ref để track xem update có phải từ local hay từ external
  const isInternalUpdate = useRef(false);
  const isInitialMount = useRef(true);

  // Lưu vào localStorage khi settings thay đổi (chỉ khi là internal update)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInternalUpdate.current && !isInitialMount.current) {
      const toStore = {
        selectedPresetId: settings.selectedPresetId,
        customPresets: settings.customPresets,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      
      // Dispatch custom event để các component khác biết settings đã thay đổi
      // Chỉ dispatch khi không phải là storage event (để tránh vòng lặp với các tab khác)
      window.dispatchEvent(new CustomEvent('backgroundSettingsChanged', { detail: toStore }));
      
      // Reset flag sau khi dispatch
      isInternalUpdate.current = false;
    }
    isInitialMount.current = false;
  }, [settings]);

  // Lắng nghe storage event để cập nhật khi có thay đổi từ tab/window khác
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // So sánh với settings hiện tại để tránh update không cần thiết
          const allPresets = [...DEFAULT_BACKGROUNDS, ...(parsed.customPresets || [])];
          const currentPreset = allPresets.find(p => p.id === parsed.selectedPresetId);
          const newSettings = {
            ...parsed,
            currentConfig: currentPreset || DEFAULT_BACKGROUNDS[0],
          };
          
          // Chỉ update nếu thực sự có thay đổi
          setSettings(prev => {
            if (
              prev.selectedPresetId === newSettings.selectedPresetId &&
              JSON.stringify(prev.customPresets) === JSON.stringify(newSettings.customPresets)
            ) {
              return prev;
            }
            isInternalUpdate.current = false; // Đánh dấu đây là external update
            return newSettings;
          });
        }
      } catch (error) {
        console.error('Error updating background settings from storage:', error);
      }
    };

    // Chỉ lắng nghe storage event (từ tab/window khác), không lắng nghe custom event
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const selectPreset = useCallback((presetId: string) => {
    isInternalUpdate.current = true; // Đánh dấu đây là internal update
    setSettings(prev => {
      const allPresets = [...DEFAULT_BACKGROUNDS, ...prev.customPresets];
      const preset = allPresets.find(p => p.id === presetId);
      if (preset && prev.selectedPresetId !== presetId) {
        return {
          ...prev,
          selectedPresetId: presetId,
          currentConfig: preset,
        };
      }
      return prev;
    });
  }, []);

  const addCustomPreset = useCallback((preset: BackgroundPreset) => {
    isInternalUpdate.current = true; // Đánh dấu đây là internal update
    setSettings(prev => ({
      ...prev,
      customPresets: [...prev.customPresets, preset],
      selectedPresetId: preset.id,
      currentConfig: preset,
    }));
  }, []);

  const updateCustomPreset = useCallback((id: string, preset: BackgroundPreset) => {
    isInternalUpdate.current = true; // Đánh dấu đây là internal update
    setSettings(prev => ({
      ...prev,
      customPresets: prev.customPresets.map(p => p.id === id ? preset : p),
      currentConfig: preset.id === id ? preset : prev.currentConfig,
    }));
  }, []);

  const deleteCustomPreset = useCallback((id: string) => {
    isInternalUpdate.current = true; // Đánh dấu đây là internal update
    setSettings(prev => {
      const newPresets = prev.customPresets.filter(p => p.id !== id);
      const newSelectedId = prev.selectedPresetId === id 
        ? DEFAULT_BACKGROUNDS[0].id 
        : prev.selectedPresetId;
      const allPresets = [...DEFAULT_BACKGROUNDS, ...newPresets];
      const currentPreset = allPresets.find(p => p.id === newSelectedId) || DEFAULT_BACKGROUNDS[0];
      
      return {
        ...prev,
        customPresets: newPresets,
        selectedPresetId: newSelectedId,
        currentConfig: currentPreset,
      };
    });
  }, []);

  const getAllPresets = useCallback(() => {
    return [...DEFAULT_BACKGROUNDS, ...settings.customPresets];
  }, [settings.customPresets]);

  const getBackgroundStyle = useCallback((config: BackgroundPreset | null): React.CSSProperties => {
    if (!config) {
      return {
        backgroundImage: 'none',
        backgroundColor: '#ffffff',
      };
    }

    if (config.type === 'solid') {
      return {
        backgroundColor: config.config.colors[0] || '#ffffff',
      };
    }

    if (config.type === 'radial') {
      const { colors, position = '50% 90%', size = '125% 125%' } = config.config;
      const color1 = colors[0] || '#ffffff';
      const color2 = colors[1] || '#10b981';
      
      return {
        backgroundImage: `radial-gradient(${size} at ${position}, ${color1} 40%, ${color2} 100%)`,
        backgroundSize: '100% 100%',
      };
    }

    if (config.type === 'gradient') {
      const { colors, direction = 'to bottom' } = config.config;
      return {
        backgroundImage: `linear-gradient(${direction}, ${colors.join(', ')})`,
      };
    }

    if (config.type === 'grid') {
      const { colors, gridSize = '20px', gridLineWidth = '1px', gridOpacity = '0.15' } = config.config;
      const bgColor = colors[0] || '#ffffff';
      const gridColor = colors[1] || '#10b981';
      const opacity = parseFloat(gridOpacity) || 0.15;
      
      // Convert hex color to rgba with opacity
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      
      const gridColorWithOpacity = gridColor.startsWith('#') 
        ? hexToRgba(gridColor, opacity)
        : gridColor;
      
      return {
        backgroundColor: bgColor,
        backgroundImage: `
          linear-gradient(${gridColorWithOpacity} ${gridLineWidth}, transparent ${gridLineWidth}),
          linear-gradient(90deg, ${gridColorWithOpacity} ${gridLineWidth}, transparent ${gridLineWidth})
        `,
        backgroundSize: `${gridSize} ${gridSize}`,
        backgroundPosition: '0 0, 0 0',
      };
    }

    if (config.type === 'pattern') {
      const { colors, patternType } = config.config;
      const bgColor = colors[0] || '#ffffff';
      const patternColor = colors[1] || '#10b981';
      
      // Helper to convert hex to rgba
      const hexToRgba = (hex: string, alpha: number = 1) => {
        if (!hex.startsWith('#')) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      switch (patternType) {
        case 'diagonal-grid-spotlight': {
          const colorRgba = hexToRgba(patternColor, 0.25);
          return {
            backgroundColor: bgColor,
            backgroundImage: `
              linear-gradient(90deg, ${colorRgba} 1px, transparent 0),
              linear-gradient(180deg, ${colorRgba} 1px, transparent 0),
              repeating-linear-gradient(45deg, ${hexToRgba(patternColor, 0.2)} 0 2px, transparent 2px 6px)
            `,
            backgroundSize: '24px 24px, 24px 24px, 24px 24px',
          };
        }
        
        case 'circuit-board': {
          const color1 = hexToRgba(patternColor, 1);
          const color2 = hexToRgba(patternColor, 0.8);
          return {
            backgroundColor: bgColor,
            backgroundImage: `
              linear-gradient(90deg, ${color1} 1px, transparent 1px),
              linear-gradient(180deg, ${color1} 1px, transparent 1px),
              linear-gradient(90deg, ${color2} 1px, transparent 1px),
              linear-gradient(180deg, ${color2} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px, 50px 50px, 10px 10px, 10px 10px',
          };
        }
        
        case 'noise-texture': {
          const dotColor = hexToRgba(patternColor, 0.35);
          return {
            backgroundColor: bgColor,
            backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          };
        }
        
        case 'crosshatch-art': {
          const color1 = hexToRgba(patternColor, 0.06);
          const color2 = hexToRgba(patternColor, 0.05);
          const color3 = hexToRgba(patternColor, 0.04);
          const color4 = hexToRgba(patternColor, 0.03);
          return {
            backgroundImage: `
              repeating-linear-gradient(22.5deg, transparent, transparent 2px, ${color1} 2px, ${color1} 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(67.5deg, transparent, transparent 2px, ${color2} 2px, ${color2} 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(112.5deg, transparent, transparent 2px, ${color3} 2px, ${color3} 3px, transparent 3px, transparent 8px),
              repeating-linear-gradient(157.5deg, transparent, transparent 2px, ${color4} 2px, ${color4} 3px, transparent 3px, transparent 8px)
            `,
            pointerEvents: 'none',
          };
        }
        
        case 'diagonal-stripes': {
          const stripeColor = patternColor;
          return {
            backgroundColor: bgColor,
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, ${stripeColor} 2px, ${stripeColor} 4px)`,
          };
        }
        
        case 'diagonal-cross-center': {
          const crossColor = patternColor;
          return {
            backgroundColor: bgColor,
            backgroundImage: `
              linear-gradient(45deg, transparent 49%, ${crossColor} 49%, ${crossColor} 51%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, ${crossColor} 49%, ${crossColor} 51%, transparent 51%)
            `,
            backgroundSize: '40px 40px',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)',
          };
        }
        
        case 'diagonal-cross-bottom-right': {
          const crossColor = patternColor;
          return {
            backgroundColor: bgColor,
            backgroundImage: `
              linear-gradient(45deg, transparent 49%, ${crossColor} 49%, ${crossColor} 51%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, ${crossColor} 49%, ${crossColor} 51%, transparent 51%)
            `,
            backgroundSize: '40px 40px',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 0% 100%, #000 50%, transparent 90%)',
            maskImage: 'radial-gradient(ellipse 80% 80% at 0% 100%, #000 50%, transparent 90%)',
          };
        }
        
        case 'diagonal-cross-grid': {
          const crossColor = patternColor;
          return {
            backgroundColor: bgColor,
            backgroundImage: `
              linear-gradient(45deg, transparent 49%, ${crossColor} 49%, ${crossColor} 51%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, ${crossColor} 49%, ${crossColor} 51%, transparent 51%)
            `,
            backgroundSize: '40px 40px',
          };
        }
        
        default:
          return {
            backgroundColor: bgColor,
          };
      }
    }

    return {
      backgroundColor: '#ffffff',
    };
  }, []);

  return (
    <BackgroundSettingsContext.Provider
      value={{
        settings,
        selectPreset,
        addCustomPreset,
        updateCustomPreset,
        deleteCustomPreset,
        getAllPresets,
        getBackgroundStyle,
        currentConfig: settings.currentConfig,
      }}
    >
      {children}
    </BackgroundSettingsContext.Provider>
  );
}

export function useBackgroundSettings() {
  const context = useContext(BackgroundSettingsContext);
  if (context === undefined) {
    throw new Error('useBackgroundSettings must be used within a BackgroundSettingsProvider');
  }
  return context;
}

