import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media', // 啟用深色模式支持（基於系統偏好）
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 2026 智慧家居風格配色方案（參考 Shutterstock 科技品牌配色）
        // 主色系：大地赤陶色（Terracotta）- 溫暖且現代
        coffee: {
          50: '#fef7f4',   // 極淺赤陶色
          100: '#fceee6',
          200: '#f8d4c0',
          300: '#f2b89c',
          400: '#e8946a',
          500: '#d97747',  // 主色 - 大地赤陶色（溫暖紅棕）
          600: '#b85d38',
          700: '#954a26',
          800: '#723818',
          900: '#4f260d',
        },
        // 輔助色系：植物灰綠色（Sage Green）- 療癒且自然
        sage: {
          50: '#f4f7f4',   // 極淺灰綠色
          100: '#e6eee6',
          200: '#c0d4c0',
          300: '#9cb89c',
          400: '#6a946a',
          500: '#477047',  // 主色 - 植物灰綠色（低飽和度）
          600: '#385d38',
          700: '#264a26',
          800: '#183718',
          900: '#0d260d',
        },
        // 中性色系：柔和米色（Soft Beige）- 溫暖且舒適
        beige: {
          50: '#fefdfb',   // 極淺米色
          100: '#fef9f3',
          200: '#fdf2e6',
          300: '#fbe8d3',
          400: '#f8d4b0',
          500: '#f4c088',  // 主色 - 柔和米色
          600: '#e8a866',
          700: '#d18a4a',
          800: '#b8703a',
          900: '#965a2e',
        },
        // 保留 matcha 作為強調色（用於成功狀態等）
        matcha: {
          50: '#f0f9f4',
          100: '#dcf2e6',
          200: '#b8e4cc',
          300: '#7dd3a0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // 庫存及數量配色
        coral: {
          50: '#fef5f3',
          100: '#fde8e4',
          200: '#fbd5ce',
          300: '#f8b5a8',
          400: '#f48a75',
          500: '#F2735B',  // 主色 - 溫暖珊瑚色
          600: '#e05a42',
          700: '#c04a35',
          800: '#9e3d2c',
          900: '#823528',
        },
        // 按鈕配色
        button: {
          50: '#e6f4f7',
          100: '#cce9ef',
          200: '#99d3df',
          300: '#66bdcf',
          400: '#4aadc4',
          500: '#62B6CB',  // 主色 - 清新藍色
          600: '#4e92a2',
          700: '#3a6d79',
          800: '#274851',
          900: '#132428',
        },
      },
    },
  },
  plugins: [],
};
export default config;



