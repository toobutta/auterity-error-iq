
# YAML & GUI Launch Pack

## Objective
Enable no-code access to NeuroWeaver workflows using GUI + YAML automation.

## YAML Schema Example
```yaml
task: fine-tune
model: mistral-7b
method: QLoRA
dataset: ./datasets/financial_qa
feedback: auto_rlaif
output_dir: ./checkpoints/mistral-financial
metrics:
  - accuracy
  - f1
```

## GUI Features
- Drag-and-drop dataset loader
- Preset templates per domain
- Auto-log to CostGuard dashboard
- One-click deployment to vLLM/Triton
