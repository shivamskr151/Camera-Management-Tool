import { useEffect, useState } from 'react';

interface ThemeColor {
  [key: string]: string;
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColor;
  radius: string;
}

interface ThemesConfig {
  themes: {
    [key: string]: ThemeConfig;
  };
  activeTheme: string;
}

const defaultConfig: ThemesConfig = {
  themes: {
    light: {
      name: "Light",
      colors: {
        background: "#ffffff",
        foreground: "#020817",
        card: "#ffffff",
        "card-foreground": "#020817",
        popover: "#ffffff",
        "popover-foreground": "#020817",
        primary: "#0f172a",
        "primary-foreground": "#f8fafc",
        secondary: "#f1f5f9",
        "secondary-foreground": "#0f172a",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        accent: "#f1f5f9",
        "accent-foreground": "#0f172a",
        destructive: "#ef4444",
        "destructive-foreground": "#f8fafc",
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#0f172a"
      },
      radius: "0.75rem"
    },
    dark: {
      name: "Dark",
      colors: {
        background: "#020817",
        foreground: "#f8fafc",
        card: "#020817",
        "card-foreground": "#f8fafc",
        popover: "#020817",
        "popover-foreground": "#f8fafc",
        primary: "#f8fafc",
        "primary-foreground": "#0f172a",
        secondary: "#1e293b",
        "secondary-foreground": "#f8fafc",
        muted: "#1e293b",
        "muted-foreground": "#94a3b8",
        accent: "#1e293b",
        "accent-foreground": "#f8fafc",
        destructive: "#ef4444",
        "destructive-foreground": "#f8fafc",
        border: "#1e293b",
        input: "#1e293b",
        ring: "#f8fafc"
      },
      radius: "0.75rem"
    }
  },
  activeTheme: "light"
};

export const useThemeConfig = () => {
  const [themeConfig] = useState<ThemesConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const getTheme = (themeName: string): ThemeConfig | undefined => {
    return themeConfig.themes[themeName];
  };

  const getAllThemes = (): { id: string; name: string }[] => {
    return Object.entries(themeConfig.themes).map(([id, theme]) => ({
      id,
      name: theme.name
    }));
  };

  const getActiveThemeName = (): string => {
    return themeConfig.activeTheme;
  };

  return {
    themeConfig,
    loading,
    error,
    getTheme,
    getAllThemes,
    getActiveThemeName
  };
}; 