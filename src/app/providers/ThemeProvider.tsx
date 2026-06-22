import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ConfigProvider, theme as antdTheme, App as AntdApp } from "antd";
import { ThemeContext, type Theme } from "@/app/providers/theme-context";

const THEME_STORAGE_KEY = "app-theme";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "light";
};

const applyThemeClass = (t: Theme) => {
  document.documentElement.setAttribute("data-theme", t);
  if (t === "dark") {
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.style.colorScheme = "light";
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getPreferredTheme);

  useEffect(() => {
    applyThemeClass(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  const antdAlgorithm =
    theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  const premiumTokens = useMemo(() => {
    const base = {
      fontFamily:
        "SF Pro Text, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      borderRadius: 10, // 0.625rem = 10px base radius
    };

    if (theme === "dark") {
      return {
        ...base,
        colorPrimary: "#0066cc", // Action Blue
        colorPrimaryHover: "#0071e3", // Primary focus
        colorInfo: "#0066cc",
        colorSuccess: "#22c55e",
        colorWarning: "#f59e0b",
        colorError: "#e01e2c", // Destructive Red
        colorBgContainer: "#1c1c1e", // --card (Apple Dark container)
        colorBgLayout: "#000000", // --background (Pure Black)
        colorText: "#ffffff", // --foreground (White on dark)
        colorTextSecondary: "#cccccc", // --muted-foreground
        colorTextDescription: "#86868b", // Ink Muted 48
        colorBorder: "#2c2c2e", // --border
        colorBorderSecondary: "#1c1c1e",
      };
    }

    return {
      ...base,
      colorPrimary: "#0066cc", // Action Blue
      colorPrimaryHover: "#0071e3", // Primary focus
      colorInfo: "#0066cc",
      colorSuccess: "#22c55e",
      colorWarning: "#f59e0b",
      colorError: "#e01e2c", // Destructive Red
      colorBgContainer: "#ffffff", // --card (White)
      colorBgLayout: "#f5f5f7", // --background (Apple Parchment layout grey)
      colorText: "#1d1d1f", // --foreground (Apple Ink)
      colorTextSecondary: "#717171", // --muted-foreground
      colorTextDescription: "#7a7a7a", // Ink Muted 48
      colorBorder: "#e5e5e5", // --border (Hairline)
      colorBorderSecondary: "#f0f0f0", // divider-soft
    };
  }, [theme]);

  const componentTokens = useMemo(() => {
    const isDark = theme === "dark";

    return {
      Button: {
        borderRadius: 9999, // Primary / Default are capsule pill by default
        borderRadiusSM: 8, // Utility buttons are rounded-sm
        controlHeight: 40,
        controlHeightSM: 32,
        controlHeightLG: 48,
        // Secondary/Default button: Action Blue text + border, transparent bg
        defaultColor: "#0066cc",
        defaultBorderColor: "#0066cc",
        defaultBg: "transparent",
        defaultColorHover: "#0071e3",
        defaultBorderColorHover: "#0071e3",
        defaultBgHover: isDark
          ? "rgba(255, 255, 255, 0.04)"
          : "rgba(0, 0, 0, 0.02)",
      },
      Input: {
        borderRadius: 8, // Standard inputs are rounded-sm
        controlHeight: 40,
        colorBorder: isDark ? "#2c2c2e" : "#e5e5e5",
        activeBorderColor: "#0066cc",
        hoverBorderColor: "#0071e3",
      },
      Select: {
        borderRadius: 8,
        controlHeight: 40,
        colorBorder: isDark ? "#2c2c2e" : "#e5e5e5",
        colorPrimary: "#0066cc",
      },
      Card: {
        borderRadiusLG: 18, // Card is rounded-lg (18px)
        colorBorderSecondary: isDark ? "#2c2c2e" : "#e5e5e5",
      },
      Table: {
        borderRadius: 18,
        headerBg: isDark ? "#252527" : "#f5f5f7",
        headerColor: isDark ? "#ffffff" : "#1d1d1f",
        rowHoverBg: isDark ? "#272729" : "#fafafc",
        borderColor: isDark ? "#2c2c2e" : "#e5e5e5",
      },
      Modal: {
        borderRadiusLG: 18,
        contentBg: isDark ? "#1c1c1e" : "#ffffff",
        headerBg: isDark ? "#1c1c1e" : "#ffffff",
      },
      Tabs: {
        itemColor: isDark ? "#cccccc" : "#717171",
        itemHoverColor: isDark ? "#ffffff" : "#1d1d1f",
        itemSelectedColor: "#0066cc",
        inkBarColor: "#0066cc",
      },
      Menu: {
        itemColor: isDark ? "#ffffff" : "#1d1d1f",
        itemHoverColor: "#0066cc",
        itemSelectedColor: "#0066cc",
        itemSelectedBg: isDark ? "#272729" : "#ffffff",
        itemActiveBg: isDark ? "#2a2a2c" : "#f5f5f7",
        itemBorderRadius: 8,
      },
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: antdAlgorithm,
          token: premiumTokens,
          components: componentTokens,
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
