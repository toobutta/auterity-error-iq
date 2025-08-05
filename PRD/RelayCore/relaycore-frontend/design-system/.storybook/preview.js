import React from 'react';
import { ThemeProvider } from '../src/themes/ThemeProvider';
import { lightTheme } from '../src/themes/lightTheme';
import { darkTheme } from '../src/themes/darkTheme';
import { addDecorator } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';

// Add accessibility checks to all stories
addDecorator(withA11y);

// Global decorator to apply the styles to all stories
export const decorators = [
  (Story) => (
    <ThemeProvider theme={lightTheme}>
      <div style={{ margin: '2rem' }}>
        <Story />
      </div>
    </ThemeProvider>
  ),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#FFFFFF',
      },
      {
        name: 'dark',
        value: '#1A202C',
      },
      {
        name: 'neutral',
        value: '#F7FAFC',
      },
    ],
  },
  themes: {
    default: 'light',
    list: [
      { name: 'light', class: 'light-theme', color: '#FFFFFF' },
      { name: 'dark', class: 'dark-theme', color: '#1A202C' },
    ],
    onChange: (theme) => {
      // Change the theme when the user selects a different theme
      const themeMap = {
        light: lightTheme,
        dark: darkTheme,
      };
      return themeMap[theme.name] || lightTheme;
    },
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1280px',
          height: '800px',
        },
      },
      widescreen: {
        name: 'Widescreen',
        styles: {
          width: '1920px',
          height: '1080px',
        },
      },
    },
  },
};