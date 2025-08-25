---
name: NeuroWeaver Issue
about: Report issues or request features for NeuroWeaver ML Platform
title: "[NeuroWeaver] "
labels: "component:neuroweaver"
assignees: ""
---

## 🧠 **Component**: NeuroWeaver ML Platform

### **Issue Type**

- [ ] Bug Report
- [ ] Feature Request
- [ ] Training Issue
- [ ] Model Deployment Issue
- [ ] Performance Issue
- [ ] Documentation Issue
- [ ] Automotive Template Issue

### **Description**

A clear and concise description of the issue or feature request.

### **Current Behavior** (for bugs)

What is currently happening?

### **Expected Behavior**

What should happen instead?

### **Steps to Reproduce** (for bugs)

1. Deploy model with...
2. Start training with...
3. Observe...

### **Model Configuration**

```yaml
# Your model configuration (remove sensitive data)
model_name: "example-model"
base_model: "gpt-3.5-turbo"
specialization: "automotive_service"
training_config:
  epochs: 3
  learning_rate: 0.0001
```

### **Environment**

- NeuroWeaver Version:
- Python Version:
- Operating System:
- GPU Available: Yes/No
- Docker: Yes/No

### **Training Data** (if applicable)

- Dataset size:
- Data format: JSONL/CSV/Other
- Automotive vertical: Service/Sales/F&I/Other

### **API Request/Response** (if applicable)

```bash
# Request
curl -X POST http://localhost:3002/api/v1/models/deploy \
  -H "Content-Type: application/json" \
  -d '{"model_name": "test"}'

# Response
{"error": "..."}
```

### **Logs**

```
[Paste relevant NeuroWeaver logs here]
```

### **Performance Metrics** (if applicable)

- Training time:
- Inference latency:
- Model accuracy:
- Memory usage:

### **Additional Context**

- Are you using pre-built automotive templates?
- Which vertical kit are you working with?
- Any custom training configurations?

### **Related Components**

- [ ] This affects RelayCore integration
- [ ] This affects AutoMatrix workflows
- [ ] This is NeuroWeaver-only
- [ ] This affects automotive templates

---

**Documentation**: [NeuroWeaver Docs](../docs/components/neuroweaver/README.md)
**Contributing**: [NeuroWeaver Contributing Guide](../docs/components/neuroweaver/CONTRIBUTING.md)
