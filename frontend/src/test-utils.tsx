import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

export const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

export const renderWithoutRouter = (ui: React.ReactElement) => {
  return render(ui);
};


