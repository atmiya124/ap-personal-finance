/**
 * UI Constants
 * 
 * Centralized constants for UI components and layouts.
 * Update these values to change common UI patterns across the app.
 */

export const UI_CONSTANTS = {
  // Layout
  layout: {
    maxWidth: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      full: "100%",
    },
    containerPadding: {
      mobile: "1rem",
      tablet: "1.5rem",
      desktop: "2rem",
    },
    sidebarWidth: "16rem", // 256px
    headerHeight: "4rem", // 64px
  },

  // Cards
  card: {
    defaultPadding: "1.5rem",
    borderRadius: "0.5rem",
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    hoverShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },

  // Buttons
  button: {
    height: {
      sm: "2rem",   // 32px
      md: "2.5rem", // 40px
      lg: "3rem",   // 48px
    },
    borderRadius: "0.375rem",
    padding: {
      sm: "0.5rem 1rem",
      md: "0.625rem 1.25rem",
      lg: "0.75rem 1.5rem",
    },
  },

  // Forms
  form: {
    inputHeight: "2.5rem",
    inputPadding: "0.75rem",
    labelSpacing: "0.5rem",
    fieldSpacing: "1.5rem",
    borderRadius: "0.375rem",
  },

  // Tables
  table: {
    rowHeight: "3rem",
    cellPadding: "1rem",
    headerHeight: "3rem",
    stripeColor: "rgb(249 250 251)", // gray-50
  },

  // Navigation
  navigation: {
    itemHeight: "2.5rem",
    itemPadding: "0.75rem 1rem",
    activeIndicatorWidth: "0.25rem",
  },

  // Dashboard
  dashboard: {
    cardGap: "1.5rem",
    sectionSpacing: "2rem",
    chartHeight: "300px",
  },

  // Colors (semantic names for easy updates)
  semanticColors: {
    background: {
      primary: "rgb(249 250 251)",    // gray-50
      secondary: "rgb(255 255 255)",  // white
      accent: "rgb(239 246 255)",     // blue-50
    },
    text: {
      primary: "rgb(17 24 39)",       // gray-900
      secondary: "rgb(107 114 128)",  // gray-500
      muted: "rgb(156 163 175)",      // gray-400
      inverse: "rgb(255 255 255)",    // white
    },
    border: {
      default: "rgb(229 231 235)",   // gray-200
      hover: "rgb(209 213 219)",     // gray-300
    },
  },
} as const;

export type UIConstants = typeof UI_CONSTANTS;

