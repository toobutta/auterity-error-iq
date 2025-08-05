# Troubleshooting Guide

This guide provides solutions for common issues that may arise when using the Cost-Aware Model Switching component.

## Table of Contents

1. [Environment Setup Issues](#environment-setup-issues)
2. [Database Issues](#database-issues)
3. [API Issues](#api-issues)
4. [Budget Management Issues](#budget-management-issues)
5. [Model Selection Issues](#model-selection-issues)
6. [Cost Tracking Issues](#cost-tracking-issues)
7. [Integration Issues](#integration-issues)
8. [Performance Issues](#performance-issues)
9. [Logging and Monitoring](#logging-and-monitoring)
10. [Common Error Codes](#common-error-codes)

## Environment Setup Issues

### Docker Containers Not Starting

**Symptoms:**
- Docker containers fail to start
- Error messages in Docker logs

**Solutions:**
1. Check if Docker and Docker Compose are installed and running
2. Verify that ports 3002, 5432, 6379, and 8080 are not in use by other applications
3. Check Docker logs for specific error messages:
   ```bash
   docker-compose logs
   ```
4. Ensure that the `.env` file exists and contains the required environment variables
5. Try rebuilding the containers:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Environment Variables Not Loaded

**Symptoms:**
- Application fails to connect to database or Redis
- Error messages about missing configuration

**Solutions:**
1. Verify that the `.env` file exists in the project root
2. Check that the `.env` file contains all required variables from `.env.example`
3. Ensure that the Docker containers are using the correct environment variables:
   ```bash
   docker-compose exec cost-aware-service env
   ```
4. Restart the containers after updating environment variables:
   ```bash
   docker-compose restart
   ```

## Database Issues

### Database Connection Errors

**Symptoms:**
- Error messages about database connection failures
- API endpoints return 500 errors

**Solutions:**
1. Check that the PostgreSQL container is running:
   ```bash
   docker-compose ps postgres
   ```
2. Verify the database connection string in the `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cost_aware_db
   ```
3. Check PostgreSQL logs for errors:
   ```bash
   docker-compose logs postgres
   ```
4. Try connecting to the database manually:
   ```bash
   docker-compose exec postgres psql -U postgres -d cost_aware_db
   ```

### Database Schema Issues

**Symptoms:**
- Error messages about missing tables or columns
- API endpoints return 500 errors with database-related messages

**Solutions:**
1. Check if the database schema was initialized correctly:
   ```bash
   docker-compose exec postgres psql -U postgres -d cost_aware_db -c "\dt"
   ```
2. Verify that the `init.sql` script was executed:
   ```bash
   docker-compose exec postgres psql -U postgres -d cost_aware_db -c "SELECT * FROM model_cost_profiles LIMIT 1"
   ```
3. Manually run the initialization script if needed:
   ```bash
   docker-compose exec postgres psql -U postgres -d cost_aware_db -f /docker-entrypoint-initdb.d/init.sql
   ```
4. Check for database migration errors in the application logs:
   ```bash
   docker-compose logs cost-aware-service
   ```

## API Issues

### API Endpoints Not Responding

**Symptoms:**
- API requests time out or return connection errors
- Unable to access API endpoints

**Solutions:**
1. Check that the application container is running:
   ```bash
   docker-compose ps cost-aware-service
   ```
2. Verify that the API server is listening on the correct port:
   ```bash
   docker-compose exec cost-aware-service netstat -tulpn | grep 3002
   ```
3. Check application logs for startup errors:
   ```bash
   docker-compose logs cost-aware-service
   ```
4. Try accessing the health check endpoint:
   ```bash
   curl http://localhost:3002/health
   ```

### API Authentication Errors

**Symptoms:**
- API requests return 401 Unauthorized errors
- Unable to authenticate with the API

**Solutions:**
1. Check that the JWT secret is properly configured in the `.env` file:
   ```
   JWT_SECRET=your_jwt_secret_here
   ```
2. Verify that the JWT token is valid and not expired
3. Check that the token is being sent in the Authorization header:
   ```
   Authorization: Bearer <token>
   ```
4. Regenerate a new token if needed

## Budget Management Issues

### Budget Not Being Enforced

**Symptoms:**
- AI usage continues despite exceeding budget limits
- No budget alerts are triggered

**Solutions:**
1. Check that the budget is enabled:
   ```sql
   SELECT * FROM budget_configs WHERE id = '<budget_id>' AND enabled = true;
   ```
2. Verify that the budget scope and ID are correct:
   ```sql
   SELECT * FROM budget_configs WHERE scope = '<scope>' AND scope_id = '<scope_id>';
   ```
3. Ensure that the budget period is current:
   ```sql
   SELECT * FROM budget_configs WHERE id = '<budget_id>' AND NOW() BETWEEN start_date AND end_date;
   ```
4. Check that the budget actions are configured correctly:
   ```sql
   SELECT warning_action, critical_action, exhausted_action FROM budget_configs WHERE id = '<budget_id>';
   ```
5. Verify that cost tracking is working properly:
   ```sql
   SELECT SUM(cost) FROM cost_tracking WHERE budget_id = '<budget_id>';
   ```

### Incorrect Budget Usage Calculation

**Symptoms:**
- Budget usage appears incorrect
- Unexpected budget alerts

**Solutions:**
1. Check for recent cost data synchronization issues:
   ```sql
   SELECT * FROM cost_sync_history ORDER BY created_at DESC LIMIT 5;
   ```
2. Verify that all AI usage is being tracked:
   ```sql
   SELECT COUNT(*) FROM cost_tracking WHERE timestamp > NOW() - INTERVAL '24 hours';
   ```
3. Check for duplicate cost records:
   ```sql
   SELECT request_id, provider, model, COUNT(*) 
   FROM cost_tracking 
   GROUP BY request_id, provider, model 
   HAVING COUNT(*) > 1;
   ```
4. Ensure that the currency is consistent:
   ```sql
   SELECT DISTINCT currency FROM cost_tracking WHERE budget_id = '<budget_id>';
   ```
5. Manually recalculate budget usage:
   ```sql
   SELECT SUM(cost) FROM cost_tracking WHERE budget_id = '<budget_id>';
   ```

## Model Selection Issues

### Incorrect Model Selection

**Symptoms:**
- Unexpected models being selected
- Models not respecting budget constraints

**Solutions:**
1. Check the model selection logs:
   ```sql
   SELECT * FROM model_selection_history ORDER BY timestamp DESC LIMIT 10;
   ```
2. Verify that the model cost profiles are up to date:
   ```sql
   SELECT * FROM model_cost_profiles WHERE enabled = true;
   ```
3. Check the budget status at the time of selection:
   ```sql
   SELECT * FROM budget_alerts WHERE budget_id = '<budget_id>' ORDER BY triggered_at DESC LIMIT 5;
   ```
4. Review the selection constraints in the API request:
   ```json
   {
     "constraints": {
       "preferredModel": "gpt-4-turbo",
       "excludedModels": ["claude-3-opus"],
       "maxCost": 0.1,
       "minQuality": 70,
       "requiredCapabilities": ["text-generation", "code-generation"]
     }
   }
   ```
5. Check the model selection explanation:
   ```sql
   SELECT * FROM model_selection_explanations WHERE request_id = '<request_id>';
   ```

### Token Estimation Issues

**Symptoms:**
- Inaccurate cost estimates
- Unexpected model selections due to cost constraints

**Solutions:**
1. Check the token estimation cache:
   ```sql
   SELECT * FROM token_estimation_cache WHERE content_hash = '<content_hash>';
   ```
2. Verify that the token estimation algorithm is working correctly:
   ```javascript
   // Example token estimation
   const text = "Hello, world!";
   const tokens = Math.ceil(text.length / 4); // Should be 4 tokens
   ```
3. Compare estimated tokens with actual tokens:
   ```sql
   SELECT 
     request_id, 
     input_tokens, 
     output_tokens 
   FROM cost_tracking 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```
4. Clear the token estimation cache if needed:
   ```sql
   DELETE FROM token_estimation_cache WHERE expires_at < NOW();
   ```

## Cost Tracking Issues

### Missing Cost Data

**Symptoms:**
- Cost data is missing for some requests
- Budget usage appears lower than expected

**Solutions:**
1. Check that cost tracking is enabled:
   ```
   ENABLE_COST_TRACKING=true
   ```
2. Verify that the cost tracking middleware is active:
   ```javascript
   // Middleware should be registered in app.ts
   app.use(costTrackingMiddleware);
   ```
3. Check for errors in the cost tracking logs:
   ```bash
   docker-compose logs cost-aware-service | grep "Error tracking cost"
   ```
4. Verify that the model cost profiles exist for all used models:
   ```sql
   SELECT provider, model FROM model_cost_profiles WHERE enabled = true;
   ```
5. Check for failed cost data synchronization:
   ```sql
   SELECT * FROM cost_sync_history WHERE status = 'error' ORDER BY created_at DESC LIMIT 5;
   ```

### Duplicate Cost Records

**Symptoms:**
- Budget usage appears higher than expected
- Cost reports show inflated numbers

**Solutions:**
1. Check for duplicate cost records:
   ```sql
   SELECT request_id, provider, model, COUNT(*) 
   FROM cost_tracking 
   GROUP BY request_id, provider, model 
   HAVING COUNT(*) > 1;
   ```
2. Identify the source of duplicates:
   ```sql
   SELECT request_id, provider, model, source, timestamp 
   FROM cost_tracking 
   WHERE request_id = '<request_id>' 
   ORDER BY timestamp;
   ```
3. Fix duplicate records:
   ```sql
   -- Keep only one record per request_id, provider, model
   DELETE FROM cost_tracking 
   WHERE id IN (
     SELECT id FROM (
       SELECT id, ROW_NUMBER() OVER (
         PARTITION BY request_id, provider, model 
         ORDER BY timestamp
       ) AS row_num 
       FROM cost_tracking
     ) t 
     WHERE t.row_num > 1
   );
   ```
4. Update budget usage after fixing duplicates:
   ```sql
   UPDATE budget_configs 
   SET current_spend = (
     SELECT SUM(cost) FROM cost_tracking WHERE budget_id = budget_configs.id
   ), 
   last_updated = NOW() 
   WHERE id = '<budget_id>';
   ```

## Integration Issues

### RelayCore Integration Issues

**Symptoms:**
- Unable to connect to RelayCore
- Cost data not syncing with RelayCore

**Solutions:**
1. Check that the RelayCore API URL is correct:
   ```
   RELAYCORE_API_URL=http://relaycore:3000
   ```
2. Verify that RelayCore is accessible:
   ```bash
   curl -I http://relaycore:3000/health
   ```
3. Check for authentication issues:
   ```bash
   docker-compose logs cost-aware-service | grep "RelayCore authentication"
   ```
4. Verify that the integration is enabled:
   ```
   ENABLE_INTEGRATIONS=true
   ```
5. Check the integration logs:
   ```bash
   docker-compose logs cost-aware-service | grep "relaycore-integration"
   ```

### Auterity Integration Issues

**Symptoms:**
- Unable to connect to Auterity
- Budget alerts not being sent to Auterity

**Solutions:**
1. Check that the Auterity API URL is correct:
   ```
   AUTERITY_API_URL=http://auterity:3001
   ```
2. Verify that Auterity is accessible:
   ```bash
   curl -I http://auterity:3001/health
   ```
3. Check for authentication issues:
   ```bash
   docker-compose logs cost-aware-service | grep "Auterity authentication"
   ```
4. Verify that the integration is enabled:
   ```
   ENABLE_INTEGRATIONS=true
   ```
5. Check the integration logs:
   ```bash
   docker-compose logs cost-aware-service | grep "auterity-integration"
   ```

## Performance Issues

### Slow API Response Times

**Symptoms:**
- API requests take a long time to complete
- Timeouts during model selection

**Solutions:**
1. Check the application logs for slow queries:
   ```bash
   docker-compose logs cost-aware-service | grep "Slow query"
   ```
2. Verify that database indexes are being used:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM cost_tracking WHERE user_id = '<user_id>' ORDER BY timestamp DESC LIMIT 10;
   ```
3. Check Redis cache performance:
   ```bash
   docker-compose exec redis redis-cli --stat
   ```
4. Monitor system resources:
   ```bash
   docker stats
   ```
5. Optimize database queries if needed:
   ```sql
   -- Add indexes for frequently used queries
   CREATE INDEX IF NOT EXISTS idx_cost_tracking_user_id_timestamp ON cost_tracking(user_id, timestamp);
   ```

### Memory Usage Issues

**Symptoms:**
- Container restarts due to out-of-memory errors
- Slow performance and high memory usage

**Solutions:**
1. Check container memory usage:
   ```bash
   docker stats
   ```
2. Identify memory-intensive operations:
   ```bash
   docker-compose logs cost-aware-service | grep "Memory usage"
   ```
3. Optimize memory usage in the application:
   ```javascript
   // Use streams for large data processing
   // Implement pagination for large result sets
   // Avoid loading large datasets into memory
   ```
4. Increase container memory limits if needed:
   ```yaml
   # In docker-compose.yml
   services:
     cost-aware-service:
       deploy:
         resources:
           limits:
             memory: 1G
   ```

## Logging and Monitoring

### Missing Logs

**Symptoms:**
- Unable to find logs for specific operations
- Difficulty troubleshooting issues

**Solutions:**
1. Check that logging is properly configured:
   ```
   LOG_LEVEL=debug
   ```
2. Verify that logs are being written:
   ```bash
   docker-compose logs cost-aware-service
   ```
3. Check for log rotation issues:
   ```bash
   docker-compose exec cost-aware-service ls -la /app/logs
   ```
4. Ensure that the logger is being used consistently:
   ```javascript
   // Example of proper logging
   const logger = createLogger('component-name');
   logger.info('Operation completed', { details });
   logger.error('Error occurred', error);
   ```

### Monitoring Issues

**Symptoms:**
- Unable to monitor system health
- No alerts for system issues

**Solutions:**
1. Check that health checks are working:
   ```bash
   curl http://localhost:3002/health
   ```
2. Verify that metrics are being collected:
   ```bash
   curl http://localhost:3002/metrics
   ```
3. Check that alerting is configured:
   ```bash
   docker-compose logs cost-aware-service | grep "Alert sent"
   ```
4. Ensure that monitoring tools are properly configured:
   ```bash
   # Example: Check Prometheus configuration
   cat prometheus.yml
   ```

## Common Error Codes

### HTTP Status Codes

| Status Code | Description | Possible Causes | Solutions |
|-------------|-------------|-----------------|-----------|
| 400 | Bad Request | Invalid request parameters | Check request body and parameters |
| 401 | Unauthorized | Missing or invalid authentication | Verify JWT token and authentication headers |
| 403 | Forbidden | Insufficient permissions | Check user roles and permissions |
| 404 | Not Found | Resource not found | Verify resource IDs and endpoints |
| 409 | Conflict | Resource already exists | Check for duplicate resources |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff strategy |
| 500 | Internal Server Error | Server-side error | Check application logs for details |
| 503 | Service Unavailable | Service temporarily unavailable | Check system health and dependencies |

### Application Error Codes

| Error Code | Description | Possible Causes | Solutions |
|------------|-------------|-----------------|-----------|
| `DB_CONNECTION_ERROR` | Database connection error | Database unavailable | Check database container and connection string |
| `REDIS_CONNECTION_ERROR` | Redis connection error | Redis unavailable | Check Redis container and connection string |
| `VALIDATION_ERROR` | Request validation error | Invalid request data | Check request body against schema |
| `BUDGET_EXCEEDED` | Budget exceeded | Usage exceeds budget limit | Increase budget or reduce usage |
| `MODEL_NOT_FOUND` | Model not found | Invalid model ID | Check available models |
| `INTEGRATION_ERROR` | Integration error | External service issue | Check integration logs and external service |
| `TOKEN_ESTIMATION_ERROR` | Token estimation error | Invalid content | Check content format and token estimator |
| `SYNC_ERROR` | Synchronization error | Data sync issue | Check sync logs and external services |