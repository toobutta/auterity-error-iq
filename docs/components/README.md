# Component Documentation

This directory contains detailed documentation for each open-source component in the Auterity platform.

## 📁 **Directory Structure**

```
components/
├── relaycore/          # AI Request Router & Cost Optimizer
├── neuroweaver/        # ML Model Management Platform  
├── autmatrix/          # Visual Workflow Automation Engine
├── shared/             # Reusable UI Components & Libraries
└── integration/        # Cross-Component Integration Guides
```

## 🎯 **Component Overview**

| Component | Purpose | Language | Status | Documentation |
|-----------|---------|----------|--------|---------------|
| **RelayCore** | AI routing & cost optimization | TypeScript | ✅ Stable | [📖 Docs](relaycore/README.md) |
| **NeuroWeaver** | ML model training & deployment | Python/React | ✅ Stable | [📖 Docs](neuroweaver/README.md) |
| **AutoMatrix** | Visual workflow automation | Python/React | ✅ Stable | [📖 Docs](autmatrix/README.md) |
| **Shared Library** | Cross-system components | TypeScript | ✅ Stable | [📖 Docs](shared/README.md) |

## 🚀 **Quick Navigation**

### **For Developers**
- [RelayCore API Reference](relaycore/API.md)
- [NeuroWeaver Training Guide](neuroweaver/TRAINING.md)
- [AutoMatrix Workflow Builder](autmatrix/WORKFLOWS.md)
- [Shared Component Library](shared/COMPONENTS.md)

### **For Contributors**
- [RelayCore Contributing](relaycore/CONTRIBUTING.md)
- [NeuroWeaver Contributing](neuroweaver/CONTRIBUTING.md)
- [AutoMatrix Contributing](autmatrix/CONTRIBUTING.md)
- [Shared Library Contributing](shared/CONTRIBUTING.md)

### **For DevOps**
- [RelayCore Deployment](relaycore/DEPLOYMENT.md)
- [NeuroWeaver Deployment](neuroweaver/DEPLOYMENT.md)
- [AutoMatrix Deployment](autmatrix/DEPLOYMENT.md)
- [Integration Patterns](integration/CROSS_SYSTEM.md)

## 🔧 **Component Architecture**

Each component follows a consistent documentation structure:

```
component-name/
├── README.md           # Overview and quick start
├── API.md             # API reference and examples
├── DEPLOYMENT.md      # Deployment and configuration
├── CONTRIBUTING.md    # Contribution guidelines
├── CHANGELOG.md       # Version history
└── examples/          # Code examples and tutorials
```

## 📊 **Integration Matrix**

| From/To | RelayCore | NeuroWeaver | AutoMatrix | Shared |
|---------|-----------|-------------|------------|--------|
| **RelayCore** | - | ✅ Model routing | ✅ AI requests | ✅ Components |
| **NeuroWeaver** | ✅ Registration | - | ✅ Models | ✅ Components |
| **AutoMatrix** | ✅ AI calls | ✅ Workflows | - | ✅ Components |
| **Shared** | ✅ UI/Utils | ✅ UI/Utils | ✅ UI/Utils | - |

## 🎯 **Getting Started**

1. **Choose your component** from the table above
2. **Read the component README** for overview and setup
3. **Follow the quick start guide** for your use case
4. **Check the API documentation** for integration details
5. **Review contribution guidelines** if you want to contribute

## 🤝 **Contributing to Documentation**

To improve component documentation:

1. Fork the repository
2. Navigate to the relevant component directory
3. Update the documentation files
4. Follow the documentation style guide
5. Submit a pull request with `docs:component-name` label

## 📝 **Documentation Standards**

All component documentation follows these standards:

- **Clear headings** with emoji indicators
- **Code examples** with syntax highlighting
- **API references** with request/response examples
- **Deployment guides** with step-by-step instructions
- **Troubleshooting sections** for common issues
- **Links to related documentation**

---

**Need help?** [Create an issue](https://github.com/toobutta/auterity-error-iq/issues) with the `documentation` label.