---
name: RelayCore Issue
about: Report issues or request features for RelayCore AI Router
title: "[RelayCore] "
labels: "component:relaycore"
assignees: ""
---

## 🎯 **Component**: RelayCore AI Router

### **Issue Type**

- [ ] Bug Report
- [ ] Feature Request
- [ ] Performance Issue
- [ ] Documentation Issue
- [ ] Plugin Issue (VSCode/JetBrains/CLI)

### **Description**

A clear and concise description of the issue or feature request.

### **Current Behavior** (for bugs)

What is currently happening?

### **Expected Behavior**

What should happen instead?

### **Steps to Reproduce** (for bugs)

1. Configure RelayCore with...
2. Send request to...
3. Observe...

### **Configuration**

```yaml
# Your RelayCore configuration (remove sensitive data)
steering_rules:
  - name: "example"
    condition: "..."
    action: "..."
```

### **Environment**

- RelayCore Version:
- Node.js Version:
- Operating System:
- Docker: Yes/No

### **API Request/Response** (if applicable)

```bash
# Request
curl -X POST http://localhost:3001/api/v1/ai/route \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'

# Response
{"error": "..."}
```

### **Logs**

```
[Paste relevant RelayCore logs here]
```

### **Additional Context**

- Are you using RelayCore standalone or integrated with AutoMatrix?
- Which AI providers are you routing to?
- Any custom steering rules or plugins?

### **Related Components**

- [ ] This affects AutoMatrix integration
- [ ] This affects NeuroWeaver integration
- [ ] This affects IDE plugins
- [ ] This is RelayCore-only

---

**Documentation**: [RelayCore Docs](../docs/components/relaycore/README.md)
**Contributing**: [RelayCore Contributing Guide](../docs/components/relaycore/CONTRIBUTING.md)
