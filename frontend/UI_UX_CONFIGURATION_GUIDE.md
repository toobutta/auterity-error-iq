

# UI/UX Environment Variables Configuration Guid

e

This document outlines the comprehensive environment variables available for customizing the UI/UX of the Auterity Error-IQ frontend application

.

#

# 🎨 Theme This comprehensive configuration system provides extensive customization options while maintaining consistency and performance across the application.Color Configuratio

n

#

## Primary Theme Color

s

```bash
VITE_THEME_PRIMARY=

#2563eb          # Primary brand color

VITE_THEME_ACCENT=

#f59e0b           # Accent color for highlights

VITE_THEME_SURFACE=

#f8fafc          # Background surface color

VITE_THEME_STORAGE_KEY=autmatrix-theme



# Local storage key for theme persistence

```

#

## Semantic Color

s

```

bash
VITE_THEME_ERROR=

#dc2626            # Error states and critical alerts

VITE_THEME_WARNING=

#f59e0b          # Warning states and caution alerts

VITE_THEME_SUCCESS=

#16a34a          # Success states and confirmations

VITE_THEME_INFO=

#0284c7             # Information states and notices

VITE_THEME_SECONDARY=

#64748b        # Secondary text and muted elements

```

#

# 📏 Component Sizing & Layou

t

#

## Default Component Size

s

```

bash
VITE_COMPONENT_SIZE_DEFAULT=md

# sm | md | lg | xl

VITE_BUTTON_SIZE_DEFAULT=md

# sm | md | lg | xl

VITE_INPUT_SIZE_DEFAULT=md

# sm | md | lg | xl

VITE_MODAL_SIZE_DEFAULT=md

# sm | md | lg | xl | full

```

#

## Layout Configuratio

n

```

bash
VITE_LAYOUT_DENSITY=comfortable

# compact | comfortable | spacious

VITE_GRID_GAP=4

# Grid gap in spacing units (1-12

)

VITE_CONTAINER_MAX_WIDTH=xl

# sm | md | lg | xl | 2xl | full

VITE_SIDEBAR_WIDTH=280px

# Sidebar width in pixels

```

#

# ✍️ Typography Setting

s

```

bash
VITE_FONT_FAMILY=sans

# sans | mono

VITE_FONT_SIZE_BASE=base

# xs | sm | base | lg | xl

VITE_LINE_HEIGHT=normal

# tight | normal | relaxed

VITE_LETTER_SPACING=normal

# tight | normal | wide

```

#

# ♿ Accessibility Feature

s

```

bash
VITE_ACCESSIBILITY_HIGH_CONTRAST=false

# Enable high contrast mode

VITE_ACCESSIBILITY_REDUCED_MOTION=false

# Respect reduced motion preferences

VITE_ACCESSIBILITY_FOCUS_VISIBLE=true

# Show focus rings

```

#

# 📊 Dashboard & Data Visualizatio

n

```

bash
VITE_DASHBOARD_LAYOUT=grid

# grid | list | masonry

VITE_CHART_THEME=default

# default | automotive | minimal

VITE_METRIC_CARD_VARIANT=glass

# default | glass | elevated | outline

VITE_STATUS_INDICATOR_SIZE=md

# sm | md | lg

```

#

# 📝 Forms & Input Component

s

```

bash
VITE_FORM_LAYOUT=vertical

# vertical | horizontal | inline

VITE_INPUT_VARIANT=outlined

# outlined | filled | minimal

VITE_LABEL_POSITION=top

# top | left | floating

VITE_VALIDATION_STYLE=inline

# inline | tooltip | bottom

```

#

# 🔔 Notifications & Feedbac

k

```

bash
VITE_TOAST_POSITION=top-right



# top-left | top-right | bottom-left | bottom-righ

t

VITE_TOAST_DURATION=5000

# Duration in milliseconds

VITE_NOTIFICATION_VARIANT=glass

# default | glass | solid | minimal

VITE_LOADING_SPINNER_VARIANT=pulse

# pulse | spin | dots | bars

```

#

# 📱 Responsive Desig

n

```

bash
VITE_RESPONSIVE_BREAKPOINT_SM=640px

# Small breakpoint

VITE_RESPONSIVE_BREAKPOINT_MD=768px

# Medium breakpoint

VITE_RESPONSIVE_BREAKPOINT_LG=1024px

# Large breakpoint

VITE_RESPONSIVE_BREAKPOINT_XL=1280px

# Extra large breakpoint

```

#

# ✨ Advanced UI Feature

s

```

bash
VITE_ENABLE_RIPPLE_EFFECTS=true

# Material Design ripple effects

VITE_ENABLE_HOVER_LIFT=true

# Hover lift animations

VITE_ENABLE_FOCUS_RINGS=true

# Focus ring indicators

VITE_ENABLE_GRADIENT_BACKGROUNDS=true

# Gradient backgrounds

```

#

# 🎭 Glassmorphism & Visual Effect

s

```

bash
VITE_GLASSMORPHISM_ENABLED=true

# Enable glassmorphism

VITE_GLASSMORPHISM_INTENSITY=medium

# subtle | medium | strong

VITE_ANIMATIONS_ENABLED=true

# Enable animations

VITE_ANIMATIONS_DURATION=normal

# fast | normal | slow

```

#

# 🧩 Component Variant

s

```

bash
VITE_BUTTON_VARIANT=filled

# filled | outlined | ghost | link

VITE_CARD_VARIANT=elevated

# default | glass | elevated | outline

VITE_MODAL_VARIANT=glass

# default | glass | centered

```

#

# 🚀 Usage in Component

s

#

## Accessing Configuration in Component

s

```

typescript
import { config } from '@/config/constants';

// Use in component styling
const buttonClass = `btn-${config.BUTTON_VARIANT} btn-${config.BUTTON_SIZE_DEFAULT}`;

const cardClass = `card-${config.CARD_VARIANT}`;

const toastConfig = {
  position: config.TOAST_POSITION,
  duration: config.TOAST_DURATION,
  variant: config.NOTIFICATION_VARIANT
};

```

#

## Dynamic Theming with CSS Variable

s

```

css
:root {
  --theme-primary: env(VITE_THEME_PRIMARY)

;
  --theme-accent: env(VITE_THEME_ACCENT)

;
  --theme-surface: env(VITE_THEME_SURFACE)

;
  --theme-error: env(VITE_THEME_ERROR)

;
  --component-size: env(VITE_COMPONENT_SIZE_DEFAULT);

}

.button {
  background-color: var(--theme-primary);

  padding: calc(var(--component-size

)

 * 0.25rem)

;

}

```

#

## Responsive Breakpoint

s

```

typescript
const breakpoints = {
  sm: config.RESPONSIVE_BREAKPOINT_SM,
  md: config.RESPONSIVE_BREAKPOINT_MD,
  lg: config.RESPONSIVE_BREAKPOINT_LG,
  xl: config.RESPONSIVE_BREAKPOINT_XL,
};

// Use in media queries
const mediaQuery = `@media (min-width: ${breakpoints.md})`

;

```

#

# 🔧 Development Workflo

w

#

## Environment-Specific Configurati

o

n

1. **Developmen

t

* * (`.env`): Enable all features, use development-friendly setting

s

2. **Productio

n

* * (`.env.production`): Optimize for performance, disable development feature

s

3. **Exampl

e

* * (`.env.example`): Template for new developer

s

#

## Best Practice

s

1. **Consistent Naming**: Use `VITE_` prefix for all client-side variabl

e

s

2. **Fallback Values**: Always provide sensible defaul

t

s

3. **Type Safety**: Use TypeScript interfaces for configuration objec

t

s

4. **Documentation**: Keep this guide updated with new variabl

e

s

5. **Testing**: Test configuration changes across different environmen

t

s

#

## Performance Consideration

s

- **Bundle Size**: Only import configuration that's actually use

d

- **Runtime Evaluation**: Environment variables are evaluated at build tim

e

- **Caching**: Changes require rebuild to take effec

t

- **Validation**: Validate configuration values in developmen

t

#

# 🎯 Future Enhancement

s

#

## Planned Variable

s

- **Color Schemes**: Dark mode variants, custom color palette

s

- **Animation Presets**: Predefined animation sequence

s

- **Layout Templates**: Saved layout configuration

s

- **Component Libraries**: Third-party component integration

s

- **Internationalization**: Locale-specific stylin

g

- **Performance Modes**: Reduced motion, low-power optimization

s

#

## Advanced Feature

s

- **Dynamic Theme Switching**: Runtime theme change

s

- **User Preferences**: Persistent user customizatio

n

- **A/B Testing**: Configuration-based feature testin

g

- **Progressive Enhancement**: Graceful degradatio

n

- **Accessibility Profiles**: Predefined accessibility configuration

s

This comprehensive configuration system provides extensive customization options while maintaining consistency and performance across the application.</content>
<parameter name="filePath">c:\Users\Andrew\OneDrive\Documents\auterity-error-iq\frontend\UI_UX_CONFIGURATION_GUIDE.m

d
