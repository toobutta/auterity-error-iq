import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

// Mock react-router-dom to avoid navigation issues in tests
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Navigate: () => <div>Redirecting...</div>,
  };
});

// Mock the auth context
vi.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

// Mock other contexts
vi.mock("./contexts/ErrorContext", () => ({
  ErrorProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("./components/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("./components/notifications/NotificationSystem", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    // Just check that the app renders without throwing errors
    expect(container.querySelector(".App")).toBeInTheDocument();
  });
});


