---
name: SuperCampus CRM
colors:
  surface: '#fffaf4'
  surface-dim: '#dad8e8'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#eeecfc'
  surface-container-high: '#e9e6f6'
  surface-container-highest: '#e3e1f1'
  on-surface: '#1a1b26'
  on-surface-variant: '#454558'
  inverse-surface: '#2f2f3b'
  inverse-on-surface: '#f1efff'
  outline: '#767589'
  outline-variant: '#c6c4db'
  surface-tint: '#393bff'
  primary: '#0b00bc'
  on-primary: '#ffffff'
  primary-container: '#1400ff'
  on-primary-container: '#b5b8ff'
  inverse-primary: '#bfc1ff'
  secondary: '#8200c9'
  on-secondary: '#ffffff'
  secondary-container: '#a600ff'
  on-secondary-container: '#fbebff'
  tertiary: '#720400'
  on-tertiary: '#ffffff'
  tertiary-container: '#9d0700'
  on-tertiary-container: '#ffa798'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#bfc1ff'
  on-primary-fixed: '#03006d'
  on-primary-fixed-variant: '#1200ed'
  secondary-fixed: '#f3daff'
  secondary-fixed-dim: '#e3b5ff'
  on-secondary-fixed: '#2f004c'
  on-secondary-fixed-variant: '#6e00ab'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a7'
  on-tertiary-fixed: '#400100'
  on-tertiary-fixed-variant: '#920600'
  background: '#f7f4ef'
  on-background: '#1a1b26'
  surface-variant: '#e3e1f1'
  panel: '#f1ece7'
  card: '#ffffff'
  text-primary: '#161318'
  text-muted: '#6f6875'
  border: '#e7ded8'
  soft-blue: '#776cf5'
  pink-violet: '#de6cf5'
  danger-pink: '#ff005c'
  dark-bg: '#090914'
  dark-surface: '#111122'
  dark-panel: '#18182c'
  dark-card: '#1f1f35'
typography:
  display:
    fontFamily: plusJakartaSans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: plusJakartaSans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: plusJakartaSans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: plusJakartaSans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: plusJakartaSans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gap-card: 12px
  gap-column: 16px
  padding-compact: 8px
  padding-standard: 16px
---

# SuperCampus CRM — Admission Team Portal Design System

## 1. Visual Language
**Style:** Soft UI / Neomorphic hybrid. Functional, operational, and data-dense. High tactile depth with minimal contrast for a focused staff environment.
**Tone:** Professional, reliable, task-oriented.

## 2. Color Palette
### Light Mode
- **Background:** #f7f4ef (Soft off-white)
- **Surface:** #fffaf4 (Warm cream)
- **Panel:** #f1ece7 (Muted beige)
- **Card:** #ffffff (Pure white)
- **Text Primary:** #161318 (Deep charcoal)
- **Text Muted:** #6f6875 (Slate gray)
- **Border:** #e7ded8 (Soft taupe)
- **Brand Blue:** #1400ff
- **Brand Violet:** #a600ff
- **Soft Blue:** #776cf5 (Column accent)
- **Pink Violet:** #de6cf5 (Column accent)
- **Danger Pink:** #ff005c (Column accent / High priority)
- **Gradient:** linear-gradient(135deg, #1400ff 0%, #a600ff 100%)

### Dark Mode
- **Background:** #090914
- **Surface:** #111122
- **Panel:** #18182c
- **Card:** #1f1f35
- **Card Soft:** #262640
- **Text Primary:** #f7f3ff
- **Text Muted:** #b9b2ce
- **Border:** rgba(255, 255, 255, 0.1)

## 3. Typography
- **Primary:** Poppins (400, 500, 600, 700) - For all interface text.
- **Logo:** Brittany (Handwritten/Accent) - Used specifically for "SuperCampus" text.

## 4. Density & Spacing
- **Mode:** COMPACT.
- **Padding:** 8px to 16px for internal elements.
- **Gaps:** 12px between cards, 16px between columns.

## 5. Components
- **Kanban Card:** Rounded (12px), white background, subtle shadow, left-border accent for status.
- **Priority Badge:** Rounded pill with semi-transparent background and matching text/border color.
- **Column Header:** Sticky, includes name, count pill, and action menu.
- **Modal:** Rounded-2xl (24px), centered, black backdrop (50% opacity).

## 6. Shadows
- **Light:** 0 18px 40px rgba(0, 0, 0, 0.08)
- **Dark:** 0 18px 40px rgba(0, 0, 0, 0.35)
