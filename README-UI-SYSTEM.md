# UI System Documentation

This application uses a centralized design system for easy UI customization. All UI changes can be made in a few key files.

## Quick Start: Making UI Changes

### 1. Change Colors
Edit `lib/theme.ts` - Update the `colors` object to change the entire color scheme.

### 2. Change Spacing & Layout
Edit `lib/ui-constants.ts` - Modify `layout`, `card`, `button`, etc. values.

### 3. Change Typography
Edit `lib/theme.ts` - Update the `typography` section.

### 4. Update Global Styles
Edit `app/globals.css` - Modify CSS variables for theme colors.

## File Structure

```
lib/
  ├── theme.ts          # Theme configuration (colors, typography, spacing)
  ├── ui-constants.ts  # UI constants (layout, cards, buttons, forms)
  └── utils.ts          # Utility functions (cn helper)

components/
  ├── layout/          # Layout components
  │   ├── Container.tsx    # Page container with max-width
  │   ├── Section.tsx      # Section with spacing
  │   └── PageHeader.tsx   # Page header component
  └── ui/              # UI components
      ├── PageCard.tsx      # Consistent card styling
      └── Typography.tsx    # Typography component
```

## Usage Examples

### Using Container
```tsx
import { Container } from "@/components/layout/Container";

<Container maxWidth="xl" padding>
  <YourContent />
</Container>
```

### Using Section
```tsx
import { Section } from "@/components/layout/Section";

<Section spacing="lg" background="muted">
  <YourContent />
</Section>
```

### Using PageHeader
```tsx
import { PageHeader } from "@/components/layout/PageHeader";

<PageHeader
  title="Dashboard"
  description="Your financial overview"
  action={<Button>Add New</Button>}
/>
```

### Using PageCard
```tsx
import { PageCard } from "@/components/ui/PageCard";

<PageCard title="Transactions" variant="elevated">
  <YourContent />
</PageCard>
```

### Using Typography
```tsx
import { Typography } from "@/components/ui/Typography";

<Typography variant="h1" color="primary">
  Heading
</Typography>
```

## Common UI Updates

### Change Primary Color
1. Edit `app/globals.css` - Update `--primary` CSS variable
2. Or edit `lib/theme.ts` - Update `colors.primary` object

### Change Card Styling
1. Edit `lib/ui-constants.ts` - Update `card` object
2. Or edit `components/ui/PageCard.tsx` - Modify `variantStyles`

### Change Button Styling
1. Edit `lib/ui-constants.ts` - Update `button` object
2. Or edit `components/ui/button.tsx` - Modify button variants

### Change Spacing
1. Edit `lib/theme.ts` - Update `spacing` object
2. Or edit `lib/ui-constants.ts` - Update layout spacing

## Theme Variables

All theme colors are available as CSS variables in `app/globals.css`:
- `--primary`: Primary brand color
- `--secondary`: Secondary color
- `--background`: Background color
- `--foreground`: Text color
- `--border`: Border color
- `--radius`: Border radius

## Best Practices

1. **Use Components**: Always use the provided layout and UI components instead of inline styles
2. **Update Constants**: Make changes in `theme.ts` and `ui-constants.ts` rather than individual components
3. **Consistent Spacing**: Use the spacing scale from `theme.ts`
4. **Color System**: Use semantic color names (primary, secondary, success, error) instead of raw colors
5. **Responsive**: Use Tailwind's responsive prefixes (sm:, md:, lg:) for responsive design

## Migration Guide

To migrate existing components to use the new system:

1. Replace hardcoded colors with theme colors
2. Replace inline spacing with spacing constants
3. Wrap content in `Container` and `Section` components
4. Use `PageCard` instead of custom card styling
5. Use `Typography` component for text

Example migration:
```tsx
// Before
<div className="max-w-7xl mx-auto px-6 py-6">
  <h1 className="text-3xl font-bold text-gray-900">Title</h1>
</div>

// After
<Container maxWidth="xl" padding>
  <Section spacing="md">
    <Typography variant="h1">Title</Typography>
  </Section>
</Container>
```

