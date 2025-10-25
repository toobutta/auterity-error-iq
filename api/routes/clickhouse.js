const express = require('express');
const { ClickHouse } = require('clickhouse');
const NodeCache = require('node-cache');

const router = express.Router();

// Initialize ClickHouse client with connection pooling
const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL || 'http://localhost',
  port: process.env.CLICKHOUSE_PORT || 8123,
  debug: false,
  basicAuth: null,
  isUseGzip: true, // Enable compression
  format: 'json',
  config: {
    max_open_connections: 10, // Connection pool
    max_idle_connections: 5,
  }
});

// Cache for query results (TTL: 5 minutes)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Query ClickHouse with caching
router.get('/query', async (req, res) => {
  const { sql } = req.query;
  const cacheKey = `query_${sql}`;

  if (!sql) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return res.status(200).json({ data: cachedResult, cached: true });
  }

  try {
    const rows = await clickhouse.query(sql).toPromise();
    // Cache the result
    cache.set(cacheKey, rows);
    res.status(200).json({ data: rows, cached: false });
  } catch (error) {
    console.error('ClickHouse query error:', error);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// Clear cache endpoint
router.post('/clear-cache', (req, res) => {
  cache.flushAll();
  res.status(200).json({ message: 'Cache cleared' });
});

module.exports = router;
