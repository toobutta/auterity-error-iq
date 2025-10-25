import { LineChart as RechartsLine, BarChart as RechartsBar } from "recharts";

declare module "recharts" {
  import React from "react";

  type RechartsComponent<P> = React.ComponentClass<P>;

  export const LineChart: RechartsComponent<
    React.ComponentProps<typeof RechartsLine>
  >;
  export const BarChart: RechartsComponent<
    React.ComponentProps<typeof RechartsBar>
  >;
  export const XAxis: RechartsComponent<
    React.ComponentProps<(typeof RechartsLine)["XAxis"]>
  >;
  export const YAxis: RechartsComponent<
    React.ComponentProps<(typeof RechartsLine)["YAxis"]>
  >;
  export const CartesianGrid: RechartsComponent<
    React.ComponentProps<(typeof RechartsLine)["CartesianGrid"]>
  >;
  export const Tooltip: RechartsComponent<
    React.ComponentProps<(typeof RechartsLine)["Tooltip"]>
  >;
  export const Legend: RechartsComponent<
    React.ComponentProps<(typeof RechartsLine)["Legend"]>
  >;
  export const Line: RechartsComponent<
    React.ComponentProps<(typeof RechartsLine)["Line"]>
  >;
  export const Bar: RechartsComponent<
    React.ComponentProps<(typeof RechartsBar)["Bar"]>
  >;
}


