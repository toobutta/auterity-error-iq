resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = {
    Name        = "${var.cluster_name}-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-neuroweaver-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EKS", "cluster_failed_node_count", "ClusterName", var.cluster_name],
            ["AWS/EKS", "node_cpu_utilization", "ClusterName", var.cluster_name],
            ["AWS/EKS", "node_memory_utilization", "ClusterName", var.cluster_name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EKS Cluster Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECR", "RepositoryPullCount", "RepositoryName", "neuroweaver/template-system"],
            ["AWS/ECR", "RepositoryPullCount", "RepositoryName", "neuroweaver/auto-specializer"],
            ["AWS/ECR", "RepositoryPullCount", "RepositoryName", "neuroweaver/inference-weaver"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "ECR Repository Metrics"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          query = "SOURCE '/aws/eks/${var.cluster_name}/cluster' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "EKS Cluster Logs"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "cluster_node_count" {
  alarm_name          = "${var.environment}-cluster-node-count-alarm"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "cluster_node_count"
  namespace           = "AWS/EKS"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This alarm monitors EKS cluster node count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = {
    ClusterName = var.cluster_name
  }
}

resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-neuroweaver-alerts"

  tags = {
    Name        = "${var.environment}-neuroweaver-alerts"
    Environment = var.environment
  }
}