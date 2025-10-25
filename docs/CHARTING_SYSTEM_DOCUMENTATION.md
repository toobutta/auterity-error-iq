

# 📊 Charting System Documentatio

n

#

# Overvie

w

This document explains the charting system used across the Auterity frontend, how it integrates with dashboards and widgets, data sources, performance patterns, and UX conventions. It maps components to back-end data flows to ensure a cohesive experience

.

#

# Table of Content

s

1. Charting Architectur

e

2. Core Components and Location

s

3. Usage Patterns (Dashboards, Widgets, Pages

)

4. Data Integrations and Connector

s

5. Performance and Optimization

s

6. Accessibility and UX Guideline

s

7. Real-time and Streami

n

g

8. Testing and Example

s

#

# 1) Charting Architectur

e

```mermaid
graph TD
  A[Dashboard/Feature UI] --> B[Chart Components]

  B --> C[Chart Primitives (Recharts)]

  A --> D[Hooks & API Clients]

  D --> E[Analytics API]

  D --> F[Data Connectors API]

  E --> G[Services/Analytics]

  F --> H[External Sources]

  B --> I[Optimized Lazy Variants

]

```

#

# 2) Core Components and Location

s

Frontend locations:

```

frontend/src/components/charts/

  - ChartComponents.tsx



# Unified chart primitives & wrappers

  - LineChart.tsx



# Thin wrappers for common variants

  - BarChart.ts

x

  - optimized

/

      - LazyLineChart.tsx



# Code-split, lazy-loaded variant

s

      - LazyBarChart.ts

x

frontend/src/components/widgets/core/

  - ChartWidget.tsx



# Widgetized chart for dashboards

  - types.ts



# Strongly-typed chart prop

s

```

Key file: `frontend/src/components/charts/ChartComponents.tsx`

- Exposes reusable building blocks

:

  - `LineChartComponent`, `BarChartComponent`, `PieChartComponent`, `ScatterChartComponent`, `RadarChartComponent

`

  - `KPICard`, `MetricComparison`, `ChartGrid

`

  - `CustomTooltip`, `TrendIndicator`, `CHART_COLORS

`

#

# 3) Usage Pattern

s

- Dashboards: `AnalyticsDashboard`, `WorkflowAnalyticsDashboard`, `PredictiveOrchestrationDashboard`, etc., compose chart components within dashboard layouts

.

- Widgets: `ChartWidget.tsx` consumes typed props from `widgets/core/types.ts` and renders chart primitives

.

- Pages/Features: Analytics predefined pages (e.g., `EnhancedAnalyticsDashboard.tsx`) import chart components directly

.

Example (widget pattern):

```

tsx
// frontend/src/components/widgets/core/ChartWidget.tsx (conceptual)
<ChartWidget
  id="exec-rate"

  title="Execution Rate"
  chartType="line"
  data={series}
  xAxis="timestamp"
  yAxis={["rate"]}
  colors={CHART_COLORS.primary}
  showLegend={true}
  dataSource={{ type: 'rest', endpoint: '/api/v1/analytics/metrics' }}
/>

```

#

# 4) Data Integrations and Connector

s

- Primary analytics endpoints: `/api/v1/analytics/metrics`, `/api/v1/analytics/dashboards`

.

- Data Connectors: `frontend/src/api/data-connectors.ts` provides connections to REST/DB/streams for bespoke charts

.

  - Supported types include `rest_api`, `postgresql`, `mongodb`, `redis`, `elasticsearch`, `s3`, `bigquery`, `snowflake`, `kafka`, `websocket`

.

  - Use `executeQuery`, `getConnectionSchema`, `getConnectorAnalytics` for dynamic chart data

.

Recommended flow:
1) Fetch data via feature-specific hook or API client.

2) Normalize to `ChartDataPoint[]` with stable keys.
3) Pass to chart component with typed `ChartConfig`.

#

# 5) Performance and Optimization

s

- Prefer `optimized/Lazy*Chart.tsx` for heavy views; code-splits reduce initial bundle

.

- Downsample and aggregate large time-series before render (server-side when possible)

.

- Memoize transformed datasets with `useMemo` (see `ChartComponents.tsx`)

.

- Use `ResponsiveContainer` and toggle `showGrid`, `showLegend` to reduce DOM cost on dense dashboards

.

- Cache API responses (ETags/TTL) and reuse across charts where feasible

.

#

# 6) Accessibility and UX Guideline

s

- Titles and descriptions: always set `title` and optional `description` for context

.

- Color contrast: use `CHART_COLORS` families; avoid reliance on color alone for meaning

.

- Tooltips: provide formatted values and labels (`CustomTooltip` supports formatters)

.

- Keyboard: ensure surrounding cards/controls are focusable; charts are read-only visuals

.

- Empty/error states: leverage `WidgetError`/`WidgetLoading` when used in widgets

.

#

# 7) Real-time and Streami

n

g

- For live metrics, use WebSocket via data connectors (`websocket` type) or platform real-time services

.

- Stream handler parses messages and updates chart state; throttle/rate-limit updates for render stability

.

- For dashboards, prefer incremental append with fixed window to cap point count

.

#

# 8) Testing and Example

s

- Snapshot key chart pages to guard regressions (see `__tests__/PerformanceDashboard.test.tsx`)

.

- Build chart stories with representative datasets and edge cases (nulls, sparse, spikes)

.

- Example composition

:

```

tsx
<ChartGrid columns={3}>
  <LineChartComponent
    title="Throughput"
    data={throughput}
    xAxis="time"
    yAxis={["rps"]}
    trend={{ value: 5.2, direction: 'up', label: '7d' }}

  />
  <BarChartComponent
    title="Failures by Type"
    data={failures}
    xAxis="type"
    yAxis={["count"]}
    variant="grouped"
  />
  <PieChartComponent
    title="Traffic Split"
    data={split}
    dataKey="value"
    nameKey="name"
  />
</ChartGrid>

```

--

- This document, together with `DASHBOARD_SYSTEM_DOCUMENTATION.md`, `ANALYTICS_SYSTEM_DOCUMENTATION.md`, and `WIDGET_SYSTEM_DOCUMENTATION.md`, provides end-to-end coverage of charting from UI composition to data ingress for a cohesive experience

.

