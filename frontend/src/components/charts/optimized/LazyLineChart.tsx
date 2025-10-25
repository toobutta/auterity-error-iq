import { lazy } from "react";

export const LazyLineChart = lazy(() =>
  import("../LineChart").then((module) => ({
    default: module.LineChart,
  })),
);


