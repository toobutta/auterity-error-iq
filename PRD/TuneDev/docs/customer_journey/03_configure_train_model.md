# Configuring and Training the Specialized Model

With the template selected and dataset prepared, the customer is ready to configure and train their specialized Service Advisor model:

1. From the Model Gallery, they click **Train Model** to begin the process
2. The system presents a pre-filled configuration form based on the Service Advisor Template

![Model Training Configuration](https://i.ibb.co/0jCRGzS/model-training-mockup.jpg)

## Model Configuration

The configuration form includes:

1. **Basic Settings**:
   - **Job Name**: "DealershipX Service Advisor Model"
   - **Base Model**: Mistral-7B (pre-selected from template)
   - **Dataset**: "Service Records 2025" (their refined dataset)
   - **Training Method**: QLoRA (pre-selected from template)

2. **Training Parameters**:
   - **Learning Rate**: 2e-4 (pre-filled optimal value)
   - **Epochs**: 3 (pre-filled optimal value)
   - **Batch Size**: 8 (pre-filled optimal value)
   - **LoRA Rank**: 16 (pre-filled optimal value)

3. **Advanced Settings** (optional):
   - **LoRA Alpha**: 32
   - **LoRA Dropout**: 0.05
   - **Weight Decay**: 0.01
   - **Tags**: "automotive, service, advisor, dealershipX"

The customer can adjust these parameters if needed, but the template provides optimized defaults based on industry best practices.

## Training Process

After configuring the model, the customer:

1. Clicks **Start Training** to begin the process
2. Is redirected to the **Training** tab where they can monitor progress:
   - Current training status (In Progress)
   - Progress bar showing completion percentage
   - Real-time metrics like loss and accuracy
   - Estimated completion time
   - Resource utilization (GPU, memory)

![Training Progress](https://i.ibb.co/JnNQbWh/training-progress-mockup.jpg)

## Training Completion

When training completes:

1. The customer receives a notification
2. The model status changes to "Ready"
3. The system generates a detailed training report showing:
   - Final metrics (accuracy, F1 score, etc.)
   - Training time and resource usage
   - Comparison to baseline model
   - Recommendations for potential improvements

The entire training process is automated and optimized based on the template, requiring minimal technical expertise from the customer. The platform handles all the complex aspects of model training, including:

- Proper data formatting and tokenization
- Hyperparameter optimization
- Resource allocation
- Checkpointing and recovery
- Evaluation against standard metrics

This template-first approach enables the customer to create a specialized Service Advisor model in hours rather than weeks, with significantly reduced technical complexity.