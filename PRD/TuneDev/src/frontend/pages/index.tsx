import React from 'react';
import Layout from '../components/Layout';
import { Grid, Paper, Typography, Box, Card, CardContent, CardHeader, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
}));

const StatIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  marginRight: theme.spacing(2),
}));

// Sample data for charts
const lineChartData: ChartData<'line'> = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Model Training Time',
      data: [12, 19, 3, 5, 2, 3],
      fill: false,
      backgroundColor: 'rgba(75,192,192,0.4)',
      borderColor: 'rgba(75,192,192,1)',
      tension: 0.4,
    },
    {
      label: 'Inference Time',
      data: [1, 2, 5, 3, 2, 1],
      fill: false,
      backgroundColor: 'rgba(153,102,255,0.4)',
      borderColor: 'rgba(153,102,255,1)',
      tension: 0.4,
    },
  ],
};

const barChartData: ChartData<'bar'> = {
  labels: ['Template 1', 'Template 2', 'Template 3', 'Template 4', 'Template 5'],
  datasets: [
    {
      label: 'Usage Count',
      data: [12, 19, 3, 5, 2],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} md={6} lg={3}>
            <StatCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <StatIcon>
                  <ModelTrainingIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <Typography variant="h6" component="div">
                    Models
                  </Typography>
                  <Typography variant="h4" component="div">
                    24
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                    <ArrowUpwardIcon fontSize="small" />
                    <Typography variant="body2" component="span">
                      +15% this week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <StatCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <StatIcon sx={{ backgroundColor: 'secondary.main' }}>
                  <StorageIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <Typography variant="h6" component="div">
                    Datasets
                  </Typography>
                  <Typography variant="h4" component="div">
                    18
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                    <ArrowUpwardIcon fontSize="small" />
                    <Typography variant="body2" component="span">
                      +8% this week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <StatCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <StatIcon sx={{ backgroundColor: 'info.main' }}>
                  <MemoryIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <Typography variant="h6" component="div">
                    Inference
                  </Typography>
                  <Typography variant="h4" component="div">
                    1.2M
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                    <ArrowUpwardIcon fontSize="small" />
                    <Typography variant="body2" component="span">
                      +32% this week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <StatCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <StatIcon sx={{ backgroundColor: 'warning.main' }}>
                  <AttachMoneyIcon fontSize="large" />
                </StatIcon>
                <Box>
                  <Typography variant="h6" component="div">
                    Cost Savings
                  </Typography>
                  <Typography variant="h4" component="div">
                    $5.2K
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                    <ArrowDownwardIcon fontSize="small" />
                    <Typography variant="body2" component="span">
                      -8% this week
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Item>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Performance Metrics
                </Typography>
                <Button variant="outlined" size="small">
                  View Details
                </Button>
              </Box>
              <Line data={lineChartData} />
            </Item>
          </Grid>
          <Grid item xs={12} md={4}>
            <Item>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Template Usage
                </Typography>
                <Button variant="outlined" size="small">
                  View All
                </Button>
              </Box>
              <Bar data={barChartData} />
            </Item>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Recent Activities" />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Service Advisor Template Created</Typography>
                    <Typography variant="body2" color="text.secondary">
                      2 hours ago
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Model Training Completed</Typography>
                    <Typography variant="body2" color="text.secondary">
                      5 hours ago
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Dataset Refinement Completed</Typography>
                    <Typography variant="body2" color="text.secondary">
                      8 hours ago
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">New User Added</Typography>
                    <Typography variant="body2" color="text.secondary">
                      1 day ago
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">System Update Completed</Typography>
                    <Typography variant="body2" color="text.secondary">
                      2 days ago
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button variant="contained" fullWidth>
                      Create Template
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="contained" fullWidth>
                      Train Model
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="contained" fullWidth>
                      Upload Dataset
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="contained" fullWidth>
                      Deploy Model
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}