```mermaid
graph TD
    subgraph "1. Select Template"
        A[Browse Model Gallery] --> B[Select Automotive Dealership Kit]
        B --> C[Choose Service Advisor Template]
    end
    
    subgraph "2. Prepare Dataset"
        D[Upload Service Records Dataset] --> E[Refine Dataset]
        E --> F[Analyze Dataset Quality]
    end
    
    subgraph "3. Configure & Train"
        G[Review Pre-filled Configuration] --> H[Adjust Parameters if Needed]
        H --> I[Start Training Process]
        I --> J[Monitor Training Progress]
    end
    
    subgraph "4. Evaluate & Refine"
        K[Review Evaluation Metrics] --> L[Test Model Interactively]
        L --> M{Performance\nSatisfactory?}
        M -->|No| N[Refine Model]
        N --> I
        M -->|Yes| O[Proceed to Deployment]
    end
    
    subgraph "5. Deploy & Integrate"
        P[Configure Deployment Settings] --> Q[Deploy Model]
        Q --> R[Select Integration Method]
        R --> S1[Direct API]
        R --> S2[Pre-built Connectors]
        R --> S3[No-Code Integration]
        S1 --> T[Monitor & Manage]
        S2 --> T
        S3 --> T
    end
    
    C --> D
    F --> G
    O --> P
    
    style A fill:#f9f9f9,stroke:#3f51b5,stroke-width:2px
    style B fill:#f9f9f9,stroke:#3f51b5,stroke-width:2px
    style C fill:#f9f9f9,stroke:#3f51b5,stroke-width:2px
    
    style D fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style E fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style F fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    
    style G fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style H fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style I fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style J fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    
    style K fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style L fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style M fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style N fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style O fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    
    style P fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style Q fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style R fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style S1 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style S2 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style S3 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style T fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
```

# Customer Journey Diagram: Model Specialization with NeuroWeaver

The diagram above illustrates the end-to-end process a customer follows to specialize an AI model using the NeuroWeaver platform. This visual representation highlights the five key stages of the journey and the specific steps within each stage.

## Journey Stages

### 1. Select Template (Purple)
The customer begins by browsing the Model Gallery, selecting the Automotive Dealership Kit, and choosing the Service Advisor Template that best fits their needs.

### 2. Prepare Dataset (Green)
The customer uploads their service records dataset, refines it using the platform's tools, and analyzes the dataset quality to ensure it meets the requirements.

### 3. Configure & Train (Blue)
With a template and dataset ready, the customer reviews the pre-filled configuration, makes any necessary adjustments, starts the training process, and monitors progress.

### 4. Evaluate & Refine (Orange)
After training, the customer reviews evaluation metrics, tests the model interactively, and decides whether to proceed to deployment or refine the model further.

### 5. Deploy & Integrate (Pink)
Finally, the customer configures deployment settings, deploys the model, selects an integration method (API, connectors, or no-code), and monitors the model's performance.

## Key Decision Points

The diagram highlights a critical decision point in the Evaluate & Refine stage, where the customer determines if the model's performance meets their requirements. If not, they can iterate through additional refinement cycles until the model achieves satisfactory performance.

## Integration Options

The diagram also illustrates the three integration paths available to customers:
1. Direct API integration for technical teams
2. Pre-built connectors for common dealership systems
3. No-code integration options for non-technical users

This flexible approach ensures that customers of all technical capabilities can successfully integrate the specialized model into their operations.