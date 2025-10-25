import { lazy } from "react";

export const LazyBarChart = lazy(() =>
  import("../BarChart").then((module) => ({
    default: module.BarChart,
  })),
);


