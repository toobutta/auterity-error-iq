import { NodeTemplate, NodeCategory } from "../../../types/workflow-builder";

// Trigger Node Templates
export const TRIGGER_TEMPLATES: NodeTemplate[] = [
  {
    type: "customer_inquiry",
    label: "Customer Inquiry",
    icon: "📧",
    description:
      "Triggered when a customer makes an inquiry via email, phone, or web form",
    category: "triggers",
    inputs: [],
    outputs: [
      {
        id: "customer_data",
        name: "Customer Data",
        type: "object",
        description: "Customer contact information and inquiry details",
      },
      {
        id: "inquiry_type",
        name: "Inquiry Type",
        type: "string",
        description: "Type of inquiry (sales, service, parts)",
      },
    ],
    config: {
      customerInquiry: {
        sources: ["email", "phone", "web_form"],
        filters: {},
      },
    },
    defaultData: {
      label: "Customer Inquiry",
      description: "Handles incoming customer inquiries",
      validation: [
        {
          field: "sources",
          type: "required",
          message: "At least one inquiry source must be selected",
        },
      ],
    },
  },
  {
    type: "inventory_update",
    label: "Inventory Update",
    icon: "🚗",
    description:
      "Triggered when vehicle inventory changes (new arrivals, price changes)",
    category: "triggers",
    inputs: [],
    outputs: [
      {
        id: "vehicle_data",
        name: "Vehicle Data",
        type: "object",
        description: "Updated vehicle information",
      },
      {
        id: "update_type",
        name: "Update Type",
        type: "string",
        description:
          "Type of update (new_arrival, price_change, status_change)",
      },
    ],
    config: {
      inventoryUpdate: {
        eventTypes: ["new_arrival", "price_change"],
        vehicleFilters: {},
      },
    },
    defaultData: {
      label: "Inventory Update",
      description: "Monitors vehicle inventory changes",
      validation: [
        {
          field: "eventTypes",
          type: "required",
          message: "At least one event type must be selected",
        },
      ],
    },
  },
  {
    type: "service_appointment",
    label: "Service Appointment",
    icon: "🔧",
    description:
      "Triggered when service appointments are scheduled or modified",
    category: "triggers",
    inputs: [],
    outputs: [
      {
        id: "appointment_data",
        name: "Appointment Data",
        type: "object",
        description: "Service appointment details",
      },
      {
        id: "customer_data",
        name: "Customer Data",
        type: "object",
        description: "Customer information",
      },
    ],
    config: {
      serviceAppointment: {
        serviceTypes: ["maintenance", "repair"],
        reminderSettings: {
          enabled: true,
          daysBefore: 1,
        },
      },
    },
    defaultData: {
      label: "Service Appointment",
      description: "Handles service appointment events",
      validation: [
        {
          field: "serviceTypes",
          type: "required",
          message: "At least one service type must be selected",
        },
      ],
    },
  },
  {
    type: "lead_generation",
    label: "Lead Generation",
    icon: "🎯",
    description:
      "Triggered by website visits, test drive requests, or marketing campaigns",
    category: "triggers",
    inputs: [],
    outputs: [
      {
        id: "lead_data",
        name: "Lead Data",
        type: "object",
        description: "Lead information and source",
      },
      {
        id: "lead_score",
        name: "Lead Score",
        type: "number",
        description: "Initial lead qualification score",
      },
    ],
    config: {},
    defaultData: {
      label: "Lead Generation",
      description: "Captures and processes new leads",
      validation: [],
    },
  },
];

// Action Node Templates
export const ACTION_TEMPLATES: NodeTemplate[] = [
  {
    type: "send_email",
    label: "Send Email",
    icon: "📤",
    description: "Send automated email responses and follow-ups",
    category: "actions",
    inputs: [
      {
        id: "recipient",
        name: "Recipient",
        type: "string",
        required: true,
        description: "Email recipient address",
      },
      {
        id: "customer_data",
        name: "Customer Data",
        type: "object",
        required: false,
        description: "Customer data for personalization",
      },
    ],
    outputs: [
      {
        id: "email_sent",
        name: "Email Sent",
        type: "boolean",
        description: "Whether email was sent successfully",
      },
    ],
    config: {
      emailTemplate: {
        subject: "Thank you for your inquiry",
        body: "Dear {{customer_name}},\n\nThank you for contacting us. We will get back to you shortly.\n\nBest regards,\nYour Dealership Team",
        recipients: [],
        attachments: [],
      },
    },
    defaultData: {
      label: "Send Email",
      description: "Sends personalized email to customer",
      validation: [
        {
          field: "subject",
          type: "required",
          message: "Email subject is required",
        },
        {
          field: "body",
          type: "required",
          message: "Email body is required",
        },
      ],
    },
  },
  {
    type: "update_crm",
    label: "Update CRM",
    icon: "📊",
    description: "Update customer relationship management system",
    category: "actions",
    inputs: [
      {
        id: "customer_id",
        name: "Customer ID",
        type: "string",
        required: true,
        description: "Customer identifier",
      },
      {
        id: "update_data",
        name: "Update Data",
        type: "object",
        required: true,
        description: "Data to update in CRM",
      },
    ],
    outputs: [
      {
        id: "crm_updated",
        name: "CRM Updated",
        type: "boolean",
        description: "Whether CRM was updated successfully",
      },
    ],
    config: {
      crmFields: {
        leadScore: 0,
        status: "new",
        notes: "",
        tags: [],
        customFields: {},
      },
    },
    defaultData: {
      label: "Update CRM",
      description: "Updates customer information in CRM",
      validation: [
        {
          field: "status",
          type: "required",
          message: "Customer status is required",
        },
      ],
    },
  },
  {
    type: "schedule_appointment",
    label: "Schedule Appointment",
    icon: "📅",
    description: "Schedule sales meetings or service appointments",
    category: "actions",
    inputs: [
      {
        id: "customer_data",
        name: "Customer Data",
        type: "object",
        required: true,
        description: "Customer information",
      },
      {
        id: "preferred_time",
        name: "Preferred Time",
        type: "string",
        required: false,
        description: "Customer preferred appointment time",
      },
    ],
    outputs: [
      {
        id: "appointment_scheduled",
        name: "Appointment Scheduled",
        type: "boolean",
        description: "Whether appointment was scheduled",
      },
      {
        id: "appointment_details",
        name: "Appointment Details",
        type: "object",
        description: "Scheduled appointment information",
      },
    ],
    config: {
      scheduleAppointment: {
        appointmentType: "sales",
        duration: 60,
        location: "Main Showroom",
        autoConfirm: false,
      },
    },
    defaultData: {
      label: "Schedule Appointment",
      description: "Books appointment with customer",
      validation: [
        {
          field: "appointmentType",
          type: "required",
          message: "Appointment type is required",
        },
        {
          field: "duration",
          type: "required",
          message: "Appointment duration is required",
        },
      ],
    },
  },
  {
    type: "generate_quote",
    label: "Generate Quote",
    icon: "💰",
    description: "Generate pricing quotes with financing options",
    category: "actions",
    inputs: [
      {
        id: "vehicle_data",
        name: "Vehicle Data",
        type: "object",
        required: true,
        description: "Vehicle information for quote",
      },
      {
        id: "customer_preferences",
        name: "Customer Preferences",
        type: "object",
        required: false,
        description: "Customer financing preferences",
      },
    ],
    outputs: [
      {
        id: "quote_generated",
        name: "Quote Generated",
        type: "object",
        description: "Generated quote details",
      },
    ],
    config: {
      generateQuote: {
        includeFinancing: true,
        includeTradeIn: true,
        validityDays: 30,
        discountRules: {},
      },
    },
    defaultData: {
      label: "Generate Quote",
      description: "Creates personalized vehicle quote",
      validation: [
        {
          field: "validityDays",
          type: "required",
          message: "Quote validity period is required",
        },
      ],
    },
  },
  {
    type: "inventory_check",
    label: "Inventory Check",
    icon: "🔍",
    description: "Check vehicle availability and specifications",
    category: "actions",
    inputs: [
      {
        id: "search_criteria",
        name: "Search Criteria",
        type: "object",
        required: true,
        description: "Vehicle search parameters",
      },
    ],
    outputs: [
      {
        id: "available_vehicles",
        name: "Available Vehicles",
        type: "object",
        description: "List of matching vehicles",
      },
      {
        id: "inventory_count",
        name: "Inventory Count",
        type: "number",
        description: "Number of matching vehicles",
      },
    ],
    config: {
      inventoryCheck: {
        searchCriteria: {
          make: "",
          model: "",
          year: new Date().getFullYear(),
          features: [],
        },
        includeNearbyDealerships: false,
      },
    },
    defaultData: {
      label: "Inventory Check",
      description: "Searches available vehicle inventory",
      validation: [],
    },
  },
];

// Condition Node Templates
export const CONDITION_TEMPLATES: NodeTemplate[] = [
  {
    type: "customer_type",
    label: "Customer Type",
    icon: "👤",
    description: "Route based on customer type (new vs returning)",
    category: "conditions",
    inputs: [
      {
        id: "customer_data",
        name: "Customer Data",
        type: "object",
        required: true,
        description: "Customer information to evaluate",
      },
    ],
    outputs: [
      {
        id: "is_new_customer",
        name: "New Customer",
        type: "boolean",
        description: "True if customer is new",
      },
      {
        id: "customer_category",
        name: "Customer Category",
        type: "string",
        description: "Customer classification",
      },
    ],
    config: {
      conditions: [
        {
          field: "customer_history",
          operator: "equals",
          value: null,
          logicalOperator: "and",
        },
      ],
    },
    defaultData: {
      label: "Customer Type",
      description: "Determines if customer is new or returning",
      validation: [
        {
          field: "conditions",
          type: "required",
          message: "At least one condition must be defined",
        },
      ],
    },
  },
  {
    type: "budget_range",
    label: "Budget Range",
    icon: "💵",
    description: "Route based on customer budget and price preferences",
    category: "conditions",
    inputs: [
      {
        id: "budget_info",
        name: "Budget Info",
        type: "object",
        required: true,
        description: "Customer budget information",
      },
    ],
    outputs: [
      {
        id: "budget_category",
        name: "Budget Category",
        type: "string",
        description: "Budget classification (economy, mid-range, luxury)",
      },
      {
        id: "financing_needed",
        name: "Financing Needed",
        type: "boolean",
        description: "Whether customer needs financing",
      },
    ],
    config: {
      conditions: [
        {
          field: "max_budget",
          operator: "greater_than",
          value: 50000,
          logicalOperator: "and",
        },
      ],
    },
    defaultData: {
      label: "Budget Range",
      description: "Categorizes customer by budget range",
      validation: [
        {
          field: "conditions",
          type: "required",
          message: "Budget conditions must be defined",
        },
      ],
    },
  },
  {
    type: "vehicle_preference",
    label: "Vehicle Preference",
    icon: "🚙",
    description: "Route based on vehicle type and feature preferences",
    category: "conditions",
    inputs: [
      {
        id: "preferences",
        name: "Preferences",
        type: "object",
        required: true,
        description: "Customer vehicle preferences",
      },
    ],
    outputs: [
      {
        id: "vehicle_category",
        name: "Vehicle Category",
        type: "string",
        description: "Preferred vehicle category",
      },
      {
        id: "feature_requirements",
        name: "Feature Requirements",
        type: "object",
        description: "Required vehicle features",
      },
    ],
    config: {
      conditions: [
        {
          field: "vehicle_type",
          operator: "in",
          value: ["sedan", "suv", "truck"],
          logicalOperator: "or",
        },
      ],
    },
    defaultData: {
      label: "Vehicle Preference",
      description: "Routes based on vehicle preferences",
      validation: [],
    },
  },
  {
    type: "geographic_location",
    label: "Geographic Location",
    icon: "📍",
    description: "Route based on customer location and dealership proximity",
    category: "conditions",
    inputs: [
      {
        id: "location_data",
        name: "Location Data",
        type: "object",
        required: true,
        description: "Customer location information",
      },
    ],
    outputs: [
      {
        id: "nearest_dealership",
        name: "Nearest Dealership",
        type: "string",
        description: "Closest dealership location",
      },
      {
        id: "distance_miles",
        name: "Distance (Miles)",
        type: "number",
        description: "Distance to nearest dealership",
      },
    ],
    config: {
      conditions: [
        {
          field: "distance",
          operator: "less_than",
          value: 50,
          logicalOperator: "and",
        },
      ],
    },
    defaultData: {
      label: "Geographic Location",
      description: "Routes based on customer location",
      validation: [],
    },
  },
];

// AI-Powered Node Templates
export const AI_TEMPLATES: NodeTemplate[] = [
  {
    type: "lead_qualification",
    label: "Lead Qualification",
    icon: "🎯",
    description: "AI-powered lead scoring and qualification",
    category: "ai_powered",
    inputs: [
      {
        id: "lead_data",
        name: "Lead Data",
        type: "object",
        required: true,
        description: "Raw lead information",
      },
    ],
    outputs: [
      {
        id: "lead_score",
        name: "Lead Score",
        type: "number",
        description: "AI-generated lead score (0-100)",
      },
      {
        id: "qualification_notes",
        name: "Qualification Notes",
        type: "string",
        description: "AI analysis of lead quality",
      },
    ],
    config: {
      aiPrompt: {
        model: "gpt-4",
        prompt:
          "Analyze this automotive lead and provide a qualification score from 0-100 based on buying intent, budget indicators, and engagement level.",
        temperature: 0.3,
        maxTokens: 500,
        systemMessage:
          "You are an expert automotive sales AI that qualifies leads for car dealerships.",
      },
    },
    defaultData: {
      label: "Lead Qualification",
      description: "AI-powered lead scoring and analysis",
      validation: [
        {
          field: "prompt",
          type: "required",
          message: "AI prompt is required",
        },
      ],
    },
  },
  {
    type: "price_optimization",
    label: "Price Optimization",
    icon: "📈",
    description: "AI-driven dynamic pricing based on market data",
    category: "ai_powered",
    inputs: [
      {
        id: "vehicle_data",
        name: "Vehicle Data",
        type: "object",
        required: true,
        description: "Vehicle specifications and current pricing",
      },
      {
        id: "market_data",
        name: "Market Data",
        type: "object",
        required: false,
        description: "Current market conditions and competitor pricing",
      },
    ],
    outputs: [
      {
        id: "optimized_price",
        name: "Optimized Price",
        type: "number",
        description: "AI-recommended vehicle price",
      },
      {
        id: "pricing_rationale",
        name: "Pricing Rationale",
        type: "string",
        description: "Explanation of pricing decision",
      },
    ],
    config: {
      aiPrompt: {
        model: "gpt-4",
        prompt:
          "Analyze vehicle specifications, market conditions, and competitor pricing to recommend an optimal price that maximizes both competitiveness and profit margin.",
        temperature: 0.2,
        maxTokens: 300,
      },
    },
    defaultData: {
      label: "Price Optimization",
      description: "AI-powered dynamic pricing optimization",
      validation: [],
    },
  },
  {
    type: "customer_sentiment",
    label: "Customer Sentiment",
    icon: "😊",
    description: "Analyze customer communication tone and sentiment",
    category: "ai_powered",
    inputs: [
      {
        id: "communication_text",
        name: "Communication Text",
        type: "string",
        required: true,
        description: "Customer communication to analyze",
      },
    ],
    outputs: [
      {
        id: "sentiment_score",
        name: "Sentiment Score",
        type: "number",
        description: "Sentiment score (-1 to 1, negative to positive)",
      },
      {
        id: "emotion_analysis",
        name: "Emotion Analysis",
        type: "object",
        description: "Detailed emotion breakdown",
      },
      {
        id: "response_recommendation",
        name: "Response Recommendation",
        type: "string",
        description: "Suggested response approach",
      },
    ],
    config: {
      aiPrompt: {
        model: "gpt-3.5-turbo",
        prompt:
          "Analyze the sentiment and emotional tone of this customer communication. Provide a sentiment score and recommend the best response approach.",
        temperature: 0.1,
        maxTokens: 200,
      },
    },
    defaultData: {
      label: "Customer Sentiment",
      description: "AI sentiment analysis of customer communications",
      validation: [],
    },
  },
  {
    type: "recommendation_engine",
    label: "Vehicle Recommendations",
    icon: "🚗",
    description:
      "AI-powered vehicle recommendations based on customer preferences",
    category: "ai_powered",
    inputs: [
      {
        id: "customer_preferences",
        name: "Customer Preferences",
        type: "object",
        required: true,
        description: "Customer preferences and requirements",
      },
      {
        id: "available_inventory",
        name: "Available Inventory",
        type: "object",
        required: true,
        description: "Current vehicle inventory",
      },
    ],
    outputs: [
      {
        id: "recommended_vehicles",
        name: "Recommended Vehicles",
        type: "object",
        description: "List of recommended vehicles with match scores",
      },
      {
        id: "recommendation_reasoning",
        name: "Recommendation Reasoning",
        type: "string",
        description: "Explanation of why vehicles were recommended",
      },
    ],
    config: {
      aiPrompt: {
        model: "gpt-4",
        prompt:
          "Based on customer preferences and available inventory, recommend the top 3 vehicles that best match their needs. Explain your reasoning.",
        temperature: 0.4,
        maxTokens: 600,
      },
    },
    defaultData: {
      label: "Vehicle Recommendations",
      description: "AI-powered vehicle matching and recommendations",
      validation: [],
    },
  },
];

// Combine all templates into categories
export const AUTOMOTIVE_NODE_CATEGORIES: NodeCategory[] = [
  {
    id: "triggers",
    name: "Triggers",
    icon: "⚡",
    color: "yellow",
    nodes: TRIGGER_TEMPLATES,
  },
  {
    id: "actions",
    name: "Actions",
    icon: "🔄",
    color: "blue",
    nodes: ACTION_TEMPLATES,
  },
  {
    id: "conditions",
    name: "Conditions",
    icon: "❓",
    color: "purple",
    nodes: CONDITION_TEMPLATES,
  },
  {
    id: "ai_powered",
    name: "AI Powered",
    icon: "🤖",
    color: "green",
    nodes: AI_TEMPLATES,
  },
];


