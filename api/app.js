require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const clickhouseRoutes = require('./routes/clickhouse');
const kafkaRoutes = require('./routes/kafka');
const { authenticate, authorize, login } = require('./middleware/auth');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' })); // Limit payload size for security
app.use(metricsMiddleware);

// Rate limiting (basic implementation)
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Public routes
app.post('/login', login);
app.get('/metrics', metricsEndpoint);

// Protected routes
app.use('/api/clickhouse', authenticate, authorize(['admin', 'user']), clickhouseRoutes);
app.use('/api/kafka', authenticate, authorize(['admin']), kafkaRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
