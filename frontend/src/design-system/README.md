

# Error-IQ Design Syst

e

m

A comprehensive design system for the Error-IQ platform, providing consistent UI components, design tokens, and utilities for building cohesive user experiences

.

#

# 🎨 Design Principle

s

#

## Consistency

- Unified color palette and typograph

y

- Consistent spacing and sizing scale

s

- Standardized component API

s

#

## Accessibility

- WCAG 2.1 AA complian

c

e

- Keyboard navigation suppor

t

- Screen reader compatibilit

y

- High contrast mode suppor

t

#

## Performance

- Optimized component renderin

g

- Efficient CSS custom propertie

s

- Lazy loading suppor

t

#

## Scalability

- Modular architectur

e

- Theme extension capabilitie

s

- Responsive design pattern

s

#

# 📚 Core Concept

s

#

## Design Tokens

```typescript
import { COLORS, TYPOGRAPHY, SPACING } from '@design-system'

;

// Use design tokens
const styles = {
  color: COLORS.primary[500],
  fontSize: TYPOGRAPHY.sizes.base,
  padding: SPACING[4]
};

```

#

## Component Variants

```

typescript
import { Button } from '@design-system'

;

// Use component variants
<Button variant="primary" size="md">
  Click me
</Button>

```

#

## Utility Functions

```

typescript
import { cn } from '@design-system'

;

// Combine classes efficiently
const classes = cn(
  'base-class',

  variant && `variant-${variant}`,

  disabled && 'disabled'
);

```

#

# 🧩 Component

s

#

## Button

```

typescript
import { Button } from '@design-system'

;

<Button
  variant="primary"
  size="md"
  loading={false}
  leftIcon={<Icon />}
  onClick={handleClick}
>
  Action
</Button>

```

**Props:

* *

- `variant`: `primary | secondary | success | error | warning

`

- `style`: `solid | outline | ghost

`

- `size`: `xs | sm | md | lg | xl

`

- `loading`: `boolean

`

- `leftIcon`/`rightIcon`: `ReactNode

`

- `fullWidth`: `boolean

`

#

## Input

```

typescript
import { Input } from '@design-system'

;

<Input
  label="Email"
  type="email"
  variant="default"
  size="md"
  helperText="Enter your email address"
  leftIcon={<MailIcon />}
  error={validationError}
/>

```

**Props:

* *

- `variant`: `default | error | success | warning

`

- `size`: `xs | sm | md | lg

`

- `label`: `string

`

- `helperText`/`error`/`success`/`warning`: `string

`

- `leftIcon`/`rightIcon`: `ReactNode

`

- `fullWidth`: `boolean

`

#

# 🎨 Design Token

s

#

## Colors

```

typescript
import { COLORS } from '@design-system'

;

// Primary colors
const primaryColor = COLORS.primary[500]; //

#3b82f

6

// Semantic colors
const successColor = COLORS.success[500]; //

#22c55e

const errorColor = COLORS.error[500];     //

#ef4444

```

#

## Typography

```

typescript
import { TYPOGRAPHY, TEXT_PRESETS } from '@design-system'

;

// Font sizes
const baseSize = TYPOGRAPHY.sizes.base; // 1rem

// Text presets
const headingStyles = TEXT_PRESETS.heading.h1;
const bodyStyles = TEXT_PRESETS.body.base;

```

#

## Spacing

```

typescript
import { SPACING } from '@design-system'

;

// Spacing scale
const smallGap = SPACING[2];  // 0.5rem

const mediumGap = SPACING[4]; // 1rem
const largeGap = SPACING[8];  // 2rem

```

#

# 🛠️ Utilitie

s

#

## Class Name Utility

```

typescript
import { cn } from '@design-system'

;

// Efficiently combine classes
const buttonClasses = cn(
  'btn',
  variant && `btn-${variant}`,

  size && `btn-${size}`,

  disabled && 'btn-disabled',

  className
);

```

#

## Variant Creator

```

typescript
import { createVariants } from '@design-system'

;

const buttonVariants = createVariants({
  primary: {
    solid: 'bg-blue-600 text-white',

    outline: 'border border-blue-600 text-blue-600'

  },
  secondary: {
    solid: 'bg-gray-600 text-white',

    outline: 'border border-gray-600 text-gray-600'

  }
});

const classes = buttonVariants('primary', 'solid');

```

#

## Component Class Generator

```

typescript
import { createComponentClasses } from '@design-system'

;

const getButtonClasses = createComponentClasses('button', {
  primary: {
    solid: 'bg-blue-600 text-white',

    outline: 'border border-blue-600 text-blue-600'

  }
});

const classes = getButtonClasses({
  variant: 'primary',
  size: 'md',
  disabled: false,
  className: 'custom-class'

});

```

#

# 🎯 Usage Guideline

s

#

## Component Patterns

1. **Always use design token

s

* * instead of hardcoded value

s

2. **Prefer component variant

s

* * over custom stylin

g

3. **Use semantic color name

s

* * for better theming suppor

t

4. **Implement proper loading state

s

* * for better U

X

#

## Accessibility

1. **Always provide label

s

* * for form input

s

2. **Use semantic HTM

L

* * element

s

3. **Support keyboard navigatio

n

* * in custom component

s

4. **Provide proper ARIA label

s

* * when neede

d

#

## Performance

1. **Use memoizatio

n

* * for expensive component

s

2. **Lazy loa

d

* * non-critical component

s

3. **Optimize re-render

s

* * with proper dependency array

s

4. **Use CSS custom propertie

s

* * for dynamic themin

g

#

# 🚀 Migration Guid

e

#

## From Existing Components

```

typescript
// Old approach
<button className="btn btn-primary btn-lg" onClick={handleClick}>

  Click me
</button>

// New approach
import { Button } from '@design-system'

;

<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>

```

#

## From Inline Styles

```

typescript
// Old approach
<div style={{ padding: '1rem', color: '

#3b82f6' }}>

  Content
</div>

// New approach
import { SPACING, COLORS } from '@design-system'

;

<div style={{
  padding: SPACING[4],
  color: COLORS.primary[500]
}}>
  Content
</div>

```

#

# 📖 API Referenc

e

#

## Components

- `Button`: Primary action componen

t

- `Input`: Form input componen

t

- `Card`: Content container componen

t

- `Modal`: Overlay dialog componen

t

- `Toast`: Notification componen

t

#

## Utilities

- `cn()`: Class name utilit

y

- `createVariants()`: Variant generato

r

- `createComponentClasses()`: Component class generato

r

#

## Tokens

- `COLORS`: Color palett

e

- `TYPOGRAPHY`: Typography scal

e

- `SPACING`: Spacing scal

e

- `SIZES`: Component sizin

g

#

# 🔧 Developmen

t

#

## Adding New Components

1. Create component in `src/design-system/components

/

`

2. Add TypeScript types in `Component.types.ts

`

3. Add styles in `Component.styles.ts

`

4. Export from `Component/index.ts

`

5. Add to main `design-system/index.t

s

`

#

## Extending Design Tokens

1. Add new tokens to appropriate file in `src/design-system/tokens

/

`

2. Update CSS custom properties if neede

d

3. Export from main index fil

e

4. Update documentatio

n

#

## Testing Components

```

typescript
import { render, screen } from '@testing-library/react';

import { Button } from '@design-system'

;

test('Button renders correctly', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

```

This design system provides a solid foundation for building consistent, accessible, and performant user interfaces across the Error-IQ platform

.
