---
name: gluestack-v5
description: Gluestack UI v5 setup, components, theming, and LiquidGlass for Expo/React Native projects. Use when working with Gluestack v5, NativeWind v5, UniWind, or LiquidGlass on iOS 26+.
---

# Gluestack UI v5 — Expo / React Native

Gluestack v5 is a copy-paste component library built on NativeWind v5 (Tailwind v4). Components live in your project under `components/ui/` — you own the code. Alpha as of July 2026.

**Full LLM docs:** https://gluestack.io/llms-full.txt

## When to use

- Setting up or configuring Gluestack v5 in an Expo project
- Adding or customizing any Gluestack component (Button, Progress, Toast, Modal, Badge, etc.)
- Implementing LiquidGlass / GlassView on iOS 26+
- Theming: mapping design tokens to Gluestack's color system
- Migrating existing StyleSheet components to NativeWind className styling

## Prerequisites

- Expo >= 50 (this project uses SDK 54 ✓)
- React Native >= 0.72.5 ✓
- Node > 16 ✓
- Does NOT support Next.js

---

## Installation

```bash
npx gluestack-ui@latest init
```

When prompted, select **UniWind** (Expo-only, Tailwind v4, no PostCSS — simpler than NativeWind v5).

The CLI auto-configures: `metro.config.js`, `babel.config.js`, `global.css`, `GluestackUIProvider` in app entry.

### Add components

```bash
npx gluestack-ui@latest add button
npx gluestack-ui@latest add toast
npx gluestack-ui@latest add progress
npx gluestack-ui@latest add liquid-glass
# etc.
```

Components are copied into `components/ui/` — edit them freely.

---

## Theming

Gluestack v5 uses a **semantic color token system** (inspired by shadcn/ui). Tokens are defined in `gluestack-ui-provider/config.ts` using `vars()` from NativeWind.

### config.ts

```typescript
import { vars } from 'nativewind';

export const config = {
  light: vars({
    '--background': '255 255 255',
    '--foreground': '10 10 10',
    '--primary': '59 130 246',
    '--primary-foreground': '255 255 255',
    '--secondary': '245 245 245',
    '--secondary-foreground': '23 23 23',
    '--accent': '251 146 60',
    '--accent-foreground': '255 255 255',
    '--muted': '245 245 245',
    '--muted-foreground': '115 115 115',
    '--destructive': '239 68 68',
    '--card': '255 255 255',
    '--border': '229 229 229',
    '--input': '229 229 229',
    '--ring': '59 130 246',
  }),
  dark: vars({
    '--background': '10 10 10',
    '--foreground': '250 250 250',
    '--primary': '147 197 253',
    '--primary-foreground': '23 23 23',
    '--secondary': '38 38 38',
    '--secondary-foreground': '250 250 250',
    '--accent': '251 146 60',
    '--accent-foreground': '255 255 255',
    '--muted': '38 38 38',
    '--muted-foreground': '161 161 161',
    '--destructive': '252 165 165',
    '--card': '23 23 23',
    '--border': '46 46 46',
    '--input': '46 46 46',
    '--ring': '147 197 253',
  }),
};
```

**Important:** Colors use RGB without `rgb()` wrapper to enable opacity modifiers like `bg-primary/50`.

### Custom tokens (success, warning, etc.)

```typescript
// Add to both light and dark in config.ts
'--success': '34 197 94',
'--success-foreground': '255 255 255',
'--warning': '251 146 60',
```

### Usage in components

```tsx
<Box className="bg-card border border-border p-4 rounded-2xl">
  <Text className="text-foreground font-semibold">Title</Text>
  <Text className="text-muted-foreground">Subtitle</Text>
</Box>

<Button className="bg-primary">
  <ButtonText className="text-primary-foreground">Action</ButtonText>
</Button>

// Opacity modifier
<Box className="bg-primary/20">...</Box>
```

### UniWind gotcha

If theme tokens don't apply on web: ensure `.light {}` and `.dark {}` are at the **top level** of `@layer theme` — NOT nested inside `:root {}`.

---

## Components

### Button

```bash
npx gluestack-ui@latest add button
```

```tsx
import { Button, ButtonText, ButtonIcon, ButtonSpinner, ButtonGroup } from '@/components/ui/button';

// Variants: solid | outline | link
// Actions: primary | secondary | positive | negative | default
// Sizes: xs | sm | md | lg | xl

<Button size="lg" variant="solid" action="primary">
  <ButtonText>+250 ml</ButtonText>
</Button>

<Button variant="outline" isDisabled>
  <ButtonSpinner />
  <ButtonText>Loading...</ButtonText>
</Button>

<ButtonGroup isAttached>
  <Button><ButtonText>Left</ButtonText></Button>
  <Button><ButtonText>Right</ButtonText></Button>
</ButtonGroup>
```

---

### Progress

```bash
npx gluestack-ui@latest add progress
```

```tsx
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';

// Sizes: xs | sm | md | lg | xl | 2xl
// Orientation: horizontal | vertical

<Progress value={65} size="md">
  <ProgressFilledTrack className="bg-primary" />
</Progress>
```

---

### Toast

```bash
npx gluestack-ui@latest add toast
```

```tsx
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';

// Actions: error | warning | success | info | muted
// Variants: solid | outline
// Placement: top | top right | top left | bottom | bottom left | bottom right

function MyComponent() {
  const toast = useToast();

  const showToast = () => {
    toast.show({
      placement: 'top',
      duration: 3000,
      render: ({ id }) => (
        <Toast nativeID={id} action="success" variant="solid">
          <ToastTitle>+250 ml hinzugefügt</ToastTitle>
          <ToastDescription>Weiter so!</ToastDescription>
        </Toast>
      ),
    });
  };
}
```

---

### LiquidGlass (iOS 26+)

```bash
npx gluestack-ui@latest add liquid-glass
```

```tsx
import {
  GlassView,
  GlassContainer,
  isLiquidGlassAvailable,
  isGlassEffectAPIAvailable,
} from '@/components/ui/liquid-glass';

// Platform behavior:
// iOS 26+  → full Liquid Glass (Apple UIVisualEffectView)
// Android / older iOS → frosted blur fallback

// GlassView Props:
// glassEffectStyle: 'regular' | 'clear'   (regular = frosted, clear = more transparent)
// tintColor: string                         (color overlay)
// isInteractive: boolean                    (press feedback on iOS 26+)
// colorScheme: 'auto' | 'light' | 'dark'

// GlassContainer Props:
// spacing: number   (distance threshold where adjacent elements visually merge)

<GlassContainer spacing={8} className="p-4 rounded-2xl">
  <GlassView
    glassEffectStyle="regular"
    isInteractive
    className="p-6 rounded-xl items-center"
  >
    <Text className="text-foreground font-semibold">Glass Card</Text>
  </GlassView>
</GlassContainer>

// Conditional rendering
{isLiquidGlassAvailable() ? (
  <GlassView>...</GlassView>
) : (
  <View className="bg-card/80">...</View>
)}
```

**Note:** Apple requires all iOS apps to support Liquid Glass by **September 2026**.

---

## Project-specific notes (WaterTrack)

- Existing custom components (`ProgressRing`, `QuickAddButton`, `BarChart`, `StreakCard`) stay — Gluestack complements, not replaces them
- Map `constants/theme.ts` tokens → `config.ts` vars when theming
- Widget code (`targets/WaterWidget/`) is Swift-only — unaffected by Gluestack
- Test on iOS Simulator with iOS 26 for LiquidGlass; older simulator shows blur fallback
