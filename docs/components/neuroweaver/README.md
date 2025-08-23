# NeuroWeaver - ML Model Management Platform

[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../../LICENSE)
[![Docker](https://img.shields.io/badge/docker-available-green.svg)](https://hub.docker.com/r/auterity/neuroweaver)

## 🎯 **Overview**

NeuroWeaver is a comprehensive ML model management platform that specializes in training, deploying, and managing AI models for specific domains. It includes pre-built automotive industry templates and vertical kits.

**Key Features**:
- 🧠 **Automated Training**: Fine-tuning pipeline with AutoRLAIF
- 🚗 **Automotive Templates**: Pre-built models for dealership operations
- 📊 **Performance Monitoring**: Real-time model accuracy and speed tracking
- 🔄 **Model Registry**: Centralized model catalog and versioning
- ⚡ **Dynamic Inference**: Intelligent model selection for requests

## 🚀 **Quick Start**

### **Docker (Recommended)**
```bash
docker run -p 3002:3002 -v $(pwd)/models:/app/models auterity/neuroweaver:latest
```

### **From Source**
```bash
cd systems/neuroweaver
pip install -r requirements.txt
python -m app.main
```

### **Basic Usage**
```python
import requests

# Deploy a model
response = requests.post('http://localhost:3002/api/v1/models/deploy', json={
    'model_name': 'automotive-service-advisor',
    'template': 'service_advisor',
    'training_data': 'path/to/data.jsonl'
})

# Make inference request
response = requests.post('http://localhost:3002/api/v1/inference', json={
    'model_id': 'automotive-service-advisor-v1',
    'prompt': 'Customer complaint about brake noise',
    'context': {'vehicle_type': 'sedan', 'mileage': 45000}
})
```

## 📋 **Configuration**

### **Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_TOKEN=your_hf_token

# Optional
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/neuroweaver
MODEL_STORAGE_PATH=/app/models
TRAINING_GPU_COUNT=1

# Monitoring
PROMETHEUS_PORT=9091
MLFLOW_TRACKING_URI=http://localhost:5000
```

### **Model Configuration**
```yaml
# config/model-config.yaml
automotive_models:
  service_advisor:
    base_model: "gpt-3.5-turbo"
    specialization: "automotive_service"
    training_epochs: 3
    learning_rate: 0.0001
    
  sales_assistant:
    base_model: "claude-3-haiku"
    specialization: "automotive_sales"
    training_epochs: 5
    learning_rate: 0.00005
```

## 🏭 **Industry Profile System**

### **Available Industry Profiles**
```
industry_profiles/
├── automotive/
│   ├── service_advisor.yaml      # Service department workflows
│   ├── sales_assistant.yaml     # Sales process automation
│   └── finance_insurance.yaml   # F&I department support
├── healthcare/
│   ├── patient_intake.yaml      # Patient onboarding
│   ├── appointment_scheduling.yaml # Scheduling workflows
│   └── compliance_tracking.yaml # Regulatory compliance
├── finance/
│   ├── loan_processing.yaml     # Loan application workflows
│   ├── risk_assessment.yaml    # Risk evaluation
│   └── compliance_reporting.yaml # Regulatory reporting
├── retail/
│   ├── inventory_management.yaml # Stock management
│   ├── customer_service.yaml   # Support workflows
│   └── order_fulfillment.yaml  # Order processing
└── general/
    ├── project_management.yaml  # Generic project workflows
    ├── data_processing.yaml    # Data transformation
    └── approval_workflows.yaml # Generic approval processes
```

### **Dynamic Profile Configuration**
```yaml
name: "Industry-Adaptive Workflow Assistant"
description: "AI assistant that adapts to industry-specific needs"
profile_type: "${INDUSTRY_PROFILE}" # automotive, healthcare, finance, retail, general
specialization: "${PROFILE_SPECIALIZATION}"
training_data:
  - industry_specific_data
  - workflow_patterns
  - compliance_requirements
  - best_practices
capabilities:
  - context_aware_processing
  - industry_compliance
  - specialized_recommendations
  - adaptive_learning
```

### **Using Industry Profiles**
```python
# Deploy industry-specific model
response = requests.post('/api/v1/models/deploy-template', json={
    'template': 'service_advisor',
    'industry_profile': 'automotive',
    'tenant_id': 'tenant123',
    'customization': {
        'industry_focus': ['automotive_service'],
        'workflow_types': ['maintenance', 'repair', 'diagnostics'],
        'compliance_requirements': ['automotive_standards']
    }
})

# Deploy healthcare model
response = requests.post('/api/v1/models/deploy-template', json={
    'template': 'patient_intake',
    'industry_profile': 'healthcare',
    'tenant_id': 'hospital456',
    'customization': {
        'industry_focus': ['patient_care'],
        'workflow_types': ['intake', 'scheduling', 'compliance'],
        'compliance_requirements': ['hipaa', 'hitech']
    }
})
```

## 🔧 **API Reference**

### **Model Management**
```http
POST /api/v1/models/deploy
GET /api/v1/models
GET /api/v1/models/{model_id}
DELETE /api/v1/models/{model_id}
```

### **Training Pipeline**
```http
POST /api/v1/training/start
GET /api/v1/training/{job_id}/status
GET /api/v1/training/{job_id}/logs
POST /api/v1/training/{job_id}/stop
```

### **Inference Engine**
```http
POST /api/v1/inference
POST /api/v1/inference/batch
GET /api/v1/inference/{request_id}/status
```

### **Performance Monitoring**
```http
GET /api/v1/models/{model_id}/metrics
GET /api/v1/models/{model_id}/performance
POST /api/v1/models/{model_id}/feedback
```

## 🧪 **Training Pipeline**

### **AutoRLAIF Training**
```python
# Start training with AutoRLAIF
training_config = {
    'model_name': 'custom-automotive-model',
    'base_model': 'gpt-3.5-turbo',
    'training_data': 'automotive_conversations.jsonl',
    'rlaif_config': {
        'reward_model': 'automotive_quality_scorer',
        'iterations': 5,
        'batch_size': 32
    }
}

response = requests.post('/api/v1/training/start', json=training_config)
```

### **Dataset Refinement**
```python
# Refine training dataset
refinement_config = {
    'dataset_path': 'raw_data.jsonl',
    'quality_threshold': 0.8,
    'diversity_sampling': True,
    'automotive_focus': True
}

response = requests.post('/api/v1/dataset/refine', json=refinement_config)
```

### **Training Monitoring**
```bash
# Monitor training progress
curl http://localhost:3002/api/v1/training/job123/status

# View training logs
curl http://localhost:3002/api/v1/training/job123/logs

# Get performance metrics
curl http://localhost:3002/api/v1/training/job123/metrics
```

## 📊 **Performance Monitoring**

### **Model Metrics**
- **Accuracy**: Response quality scores
- **Latency**: Inference response times
- **Throughput**: Requests per second
- **Cost**: Training and inference costs
- **User Satisfaction**: Feedback scores

### **MLflow Integration**
```python
import mlflow

# Track model performance
with mlflow.start_run():
    mlflow.log_param("model_type", "automotive_service")
    mlflow.log_metric("accuracy", 0.92)
    mlflow.log_metric("latency_ms", 850)
    mlflow.log_artifact("model.pkl")
```

### **Grafana Dashboard**
```bash
# Import NeuroWeaver dashboard
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana/neuroweaver-dashboard.json
```

## 🚀 **Deployment**

### **Production Docker**
```bash
docker run -d \
  --name neuroweaver \
  -p 3002:3002 \
  -v /data/models:/app/models \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e MODEL_STORAGE_PATH=/app/models \
  auterity/neuroweaver:latest
```

### **Kubernetes with GPU**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuroweaver
spec:
  replicas: 2
  selector:
    matchLabels:
      app: neuroweaver
  template:
    metadata:
      labels:
        app: neuroweaver
    spec:
      containers:
      - name: neuroweaver
        image: auterity/neuroweaver:latest
        resources:
          limits:
            nvidia.com/gpu: 1
          requests:
            memory: "4Gi"
            cpu: "2"
        ports:
        - containerPort: 3002
```

### **Model Storage**
```bash
# Configure persistent storage for models
kubectl create pv neuroweaver-models --capacity=100Gi --access-modes=ReadWriteOnce
kubectl create pvc neuroweaver-models-claim --request=100Gi
```

## 🛠️ **Development**

### **Local Development**
```bash
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq/systems/neuroweaver

# Backend setup
cd backend
pip install -r requirements.txt
python -m app.main

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

### **Code Structure**
```
neuroweaver/
├── backend/
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Data models
│   │   └── core/             # Core functionality
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   └── types/           # TypeScript types
│   └── package.json
└── vertical_kits/           # Industry templates
```

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
pytest tests/                    # Run all tests
pytest tests/test_training.py   # Training pipeline tests
pytest tests/test_inference.py  # Inference engine tests
```

### **Frontend Tests**
```bash
cd frontend
npm test                        # Run React tests
npm run test:e2e               # End-to-end tests
```

### **Integration Tests**
```bash
# Test full pipeline
python backend/test_automotive_integration.py

# Test model deployment
python backend/test_implementation.py
```

## 🤝 **Contributing**

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### **Quick Contribution Steps**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/neuroweaver-enhancement`
3. Make changes and add tests
4. Run test suite: `pytest` (backend) and `npm test` (frontend)
5. Submit pull request with `component:neuroweaver` label

## 📝 **Changelog**

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.

## 🆘 **Troubleshooting**

### **Common Issues**

**Training Job Fails**
```bash
# Check GPU availability
nvidia-smi

# Check training logs
curl http://localhost:3002/api/v1/training/job123/logs

# Verify dataset format
python -c "import json; [json.loads(line) for line in open('data.jsonl')]"
```

**Model Deployment Issues**
```bash
# Check model storage
ls -la /app/models/

# Verify model format
python -c "import torch; torch.load('model.pt')"

# Check API health
curl http://localhost:3002/health
```

**Performance Issues**
```bash
# Monitor resource usage
docker stats neuroweaver

# Check inference metrics
curl http://localhost:3002/api/v1/models/model123/metrics
```

## 📚 **Additional Resources**

- [Training Guide](TRAINING.md)
- [Template Documentation](TEMPLATES.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [API Documentation](API.md)

---

**Need help?** [Create an issue](https://github.com/toobutta/auterity-error-iq/issues) with the `component:neuroweaver` label.