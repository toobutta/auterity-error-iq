import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Since the app redirects to dashboard and requires auth,
    // we should see the login form
    expect(screen.getByText(/Sign in to AutoMatrix AI Hub/i)).toBeInTheDocument();
  });
});
