import os
import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from flask import Flask

# Initialize the Flask server
server = Flask(__name__)

# Initialize the Dash app
app = dash.Dash(
    __name__,
    server=server,
    title="NeuroWeaver CostGuard Dashboard",
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}],
)

# Sample data generation
def generate_sample_data():
    # Time series data for cost tracking
    dates = pd.date_range(start="2025-01-01", end="2025-08-01", freq="D")
    
    # Cost data
    np.random.seed(42)
    baseline_costs = np.random.normal(1000, 100, len(dates))
    optimized_costs = baseline_costs * np.random.uniform(0.5, 0.8, len(dates))
    
    cost_df = pd.DataFrame({
        "date": dates,
        "baseline_cost": baseline_costs,
        "optimized_cost": optimized_costs,
    })
    
    # Model performance data
    models = ["Service Advisor", "Sales Assistant", "Parts Inventory", "Customer Support", "Dealership Operations"]
    metrics = ["Accuracy", "F1 Score", "Latency (ms)", "Cost per 1K tokens ($)"]
    
    performance_data = []
    for model in models:
        performance_data.append({
            "Model": model,
            "Accuracy": np.random.uniform(0.85, 0.95),
            "F1 Score": np.random.uniform(0.82, 0.93),
            "Latency (ms)": np.random.uniform(50, 200),
            "Cost per 1K tokens ($)": np.random.uniform(0.01, 0.05),
        })
    
    performance_df = pd.DataFrame(performance_data)
    
    # Usage data
    usage_data = []
    for date in dates[-30:]:  # Last 30 days
        for model in models:
            usage_data.append({
                "date": date,
                "model": model,
                "tokens": np.random.randint(10000, 100000),
                "requests": np.random.randint(100, 1000),
            })
    
    usage_df = pd.DataFrame(usage_data)
    
    return cost_df, performance_df, usage_df

# Generate sample data
cost_df, performance_df, usage_df = generate_sample_data()

# Calculate savings
total_baseline = cost_df["baseline_cost"].sum()
total_optimized = cost_df["optimized_cost"].sum()
total_savings = total_baseline - total_optimized
savings_percentage = (total_savings / total_baseline) * 100

# App layout
app.layout = html.Div([
    html.Div([
        html.H1("NeuroWeaver CostGuard Dashboard", className="header-title"),
        html.P("Monitor and optimize AI model costs and performance", className="header-description"),
    ], className="header"),
    
    html.Div([
        html.Div([
            html.Div([
                html.H3("Total Cost Savings"),
                html.H2(f"${total_savings:,.2f}"),
                html.P(f"{savings_percentage:.1f}% reduction from baseline"),
            ], className="metric-card"),
            
            html.Div([
                html.H3("Average Cost per 1K Tokens"),
                html.H2(f"${performance_df['Cost per 1K tokens ($)'].mean():.3f}"),
                html.P("Across all models"),
            ], className="metric-card"),
            
            html.Div([
                html.H3("Average Latency"),
                html.H2(f"{performance_df['Latency (ms)'].mean():.1f} ms"),
                html.P("Across all models"),
            ], className="metric-card"),
            
            html.Div([
                html.H3("Total Tokens Processed"),
                html.H2(f"{usage_df['tokens'].sum():,}"),
                html.P("Last 30 days"),
            ], className="metric-card"),
        ], className="metrics-container"),
        
        html.Div([
            html.H3("Cost Comparison: Baseline vs. Optimized"),
            dcc.Graph(
                figure=px.line(
                    cost_df,
                    x="date",
                    y=["baseline_cost", "optimized_cost"],
                    labels={"value": "Cost ($)", "date": "Date", "variable": "Cost Type"},
                    color_discrete_map={"baseline_cost": "#FF6B6B", "optimized_cost": "#4CAF50"},
                    title="Daily Cost Comparison",
                ).update_layout(
                    legend=dict(
                        orientation="h",
                        yanchor="bottom",
                        y=1.02,
                        xanchor="right",
                        x=1
                    )
                )
            ),
        ], className="chart-container"),
        
        html.Div([
            html.Div([
                html.H3("Model Performance Metrics"),
                dcc.Graph(
                    figure=px.bar(
                        performance_df,
                        x="Model",
                        y=["Accuracy", "F1 Score"],
                        barmode="group",
                        title="Model Accuracy and F1 Score",
                    ).update_layout(
                        legend=dict(
                            orientation="h",
                            yanchor="bottom",
                            y=1.02,
                            xanchor="right",
                            x=1
                        )
                    )
                ),
            ], className="chart-container half-width"),
            
            html.Div([
                html.H3("Model Cost Efficiency"),
                dcc.Graph(
                    figure=px.scatter(
                        performance_df,
                        x="Latency (ms)",
                        y="Cost per 1K tokens ($)",
                        size="Accuracy",
                        color="Model",
                        hover_name="Model",
                        title="Cost vs. Latency (Size = Accuracy)",
                    )
                ),
            ], className="chart-container half-width"),
        ], className="flex-container"),
        
        html.Div([
            html.H3("Model Usage Trends"),
            dcc.Graph(
                figure=px.line(
                    usage_df.groupby(["date", "model"]).sum().reset_index(),
                    x="date",
                    y="tokens",
                    color="model",
                    title="Daily Token Usage by Model",
                )
            ),
        ], className="chart-container"),
        
        html.Div([
            html.H3("Cost Optimization Recommendations"),
            html.Div([
                html.Div([
                    html.H4("1. Quantization Opportunities"),
                    html.P("Implement INT8 quantization for the Sales Assistant model to reduce inference costs by up to 30% with minimal accuracy impact."),
                ], className="recommendation-card"),
                
                html.Div([
                    html.H4("2. Caching Strategy"),
                    html.P("Implement response caching for common queries in the Customer Support model to reduce token usage by approximately 25%."),
                ], className="recommendation-card"),
                
                html.Div([
                    html.H4("3. Batch Processing"),
                    html.P("Increase batch size for Parts Inventory model inference to improve throughput and reduce per-token costs."),
                ], className="recommendation-card"),
                
                html.Div([
                    html.H4("4. Model Rightsizing"),
                    html.P("Consider downgrading Dealership Operations model from Mistral-7B to Phi-2 for simpler queries to reduce costs while maintaining acceptable performance."),
                ], className="recommendation-card"),
            ], className="recommendations-container"),
        ], className="chart-container"),
    ], className="dashboard-container"),
    
    html.Footer([
        html.P("NeuroWeaver CostGuard Dashboard © 2025 TuneDev"),
    ], className="footer"),
    
    # CSS
    html.Style("""
        * {
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #3f51b5;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header-title {
            margin: 0;
            font-size: 24px;
        }
        .header-description {
            margin: 5px 0 0 0;
            font-size: 16px;
            opacity: 0.8;
        }
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .metrics-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            flex: 1;
            min-width: 200px;
        }
        .metric-card h3 {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .metric-card h2 {
            margin: 10px 0;
            font-size: 24px;
            color: #3f51b5;
        }
        .metric-card p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .chart-container {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }
        .flex-container {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .half-width {
            flex: 1;
            min-width: 300px;
        }
        .recommendations-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        }
        .recommendation-card {
            background-color: #f9f9f9;
            border-left: 4px solid #3f51b5;
            padding: 15px;
            border-radius: 4px;
        }
        .recommendation-card h4 {
            margin: 0 0 10px 0;
            color: #3f51b5;
        }
        .recommendation-card p {
            margin: 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 768px) {
            .flex-container {
                flex-direction: column;
            }
            .metrics-container {
                flex-direction: column;
            }
        }
    """),
])

# Run the app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8050))
    app.run_server(debug=False, host="0.0.0.0", port=port)