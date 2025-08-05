# Deploying and Integrating the Model

After evaluating and refining the model to meet their requirements, the customer is ready to deploy their specialized Service Advisor model and integrate it into their dealership operations:

1. From the Model Gallery, they select their "DealershipX Service Advisor Model"
2. They click the **Deploy Model** button to begin the deployment process

![Model Deployment](https://i.ibb.co/cXJLJZs/model-deployment-mockup.jpg)

## Deployment Configuration

The deployment form is pre-filled with optimized settings from the Service Advisor Template:

1. **Deployment Settings**:
   - **Deployment Type**: vLLM (optimized for inference)
   - **Quantization**: INT8 (balanced performance and efficiency)
   - **Instance Type**: g4dn.xlarge (cost-effective for this model size)
   - **Scaling Policy**: Request-count based (automatically scales with usage)

2. **Advanced Settings** (optional):
   - **Min Instances**: 1 (minimum number of instances)
   - **Max Instances**: 5 (maximum number of instances for scaling)
   - **Inference Timeout**: 30 seconds (maximum response time)
   - **Auto-scaling Metrics**: RequestCount, CPUUtilization

The customer can adjust these settings based on their specific needs, but the template provides optimized defaults that balance performance and cost.

## Deployment Process

After configuring the deployment, the customer:

1. Clicks **Deploy** to start the process
2. Monitors the deployment progress on the deployment status page:
   - Provisioning infrastructure
   - Loading model weights
   - Setting up API endpoint
   - Configuring monitoring

3. Receives a notification when deployment is complete, including:
   - API endpoint URL
   - Authentication credentials
   - Usage documentation
   - Monitoring dashboard link

![Deployment Complete](https://i.ibb.co/Lkf1Jqv/deployment-complete-mockup.jpg)

## Integration Options

Once deployed, the customer has several options for integrating the model into their dealership operations:

1. **Direct API Integration**:
   - The platform provides code samples for API integration in multiple languages (Python, JavaScript, Java, etc.)
   - The customer's IT team can integrate the API directly into their existing systems

2. **Pre-built Connectors**:
   - The platform offers pre-built connectors for common dealership management systems (DMS)
   - The customer selects their DMS (e.g., CDK, Reynolds & Reynolds, Dealertrack)
   - They configure the connector with their DMS credentials
   - The system automatically sets up the integration

3. **No-Code Integration**:
   - For customers without technical resources, the platform offers no-code integration options:
   - Web widget that can be embedded in internal portals
   - Email integration for service advisors to query the model directly
   - Mobile app for service advisors to use on the shop floor

![Integration Options](https://i.ibb.co/YTGnwQW/integration-options-mockup.jpg)

## Monitoring and Management

After deployment and integration, the customer can monitor and manage their model:

1. The **CostGuard Dashboard** provides:
   - Usage metrics (requests, tokens, response times)
   - Cost tracking and optimization recommendations
   - Performance metrics in production
   - Alerts for any issues or anomalies

2. The **Management Console** allows them to:
   - Update the model with new versions
   - Adjust deployment settings
   - Manage access controls
   - Schedule maintenance or updates

The entire deployment and integration process is streamlined through the template-first approach, allowing the customer to go from a trained model to production deployment in minutes rather than days or weeks.