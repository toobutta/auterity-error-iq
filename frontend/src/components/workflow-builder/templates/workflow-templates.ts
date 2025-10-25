import { Workflow } from "../../../types/workflow-builder";

// Pre-built automotive workflow templates
export const AUTOMOTIVE_WORKFLOW_TEMPLATES: Workflow[] = [
  {
    id: "template-lead-qualification",
    name: "Lead Qualification & Follow-up",
    description:
      "Automatically qualify incoming leads and send personalized follow-up emails",
    category: "sales",
    steps: [
      {
        id: "trigger-1",
        type: "customer_inquiry",
        name: "Customer Inquiry",
        description: "Triggered when customer submits inquiry form",
        config: {
          customerInquiry: {
            sources: ["web_form", "email"],
            filters: {},
          },
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-1",
        type: "lead_qualification",
        name: "AI Lead Scoring",
        description: "Score lead quality using AI analysis",
        config: {
          aiPrompt: {
            model: "gpt-4",
            prompt:
              "Analyze this automotive lead and provide a qualification score from 0-100 based on buying intent, budget indicators, and engagement level.",
            temperature: 0.3,
            maxTokens: 500,
          },
        },
        position: { x: 100, y: 250 },
      },
      {
        id: "condition-1",
        type: "budget_range",
        name: "Budget Check",
        description: "Route based on customer budget",
        config: {
          conditions: [
            {
              field: "lead_score",
              operator: "greater_than",
              value: 70,
              logicalOperator: "and",
            },
          ],
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "action-1",
        type: "send_email",
        name: "High-Value Lead Email",
        description: "Send premium follow-up email",
        config: {
          emailTemplate: {
            subject: "Exclusive Vehicle Offers Just for You",
            body: "Dear {{customer_name}},\n\nThank you for your interest in our vehicles. Based on your preferences, I have some exclusive offers that might interest you.\n\nBest regards,\nYour Sales Team",
            recipients: [],
          },
        },
        position: { x: 300, y: 500 },
      },
      {
        id: "action-2",
        type: "send_email",
        name: "Standard Follow-up",
        description: "Send standard follow-up email",
        config: {
          emailTemplate: {
            subject: "Thank you for your inquiry",
            body: "Dear {{customer_name}},\n\nThank you for contacting us. We will get back to you shortly with more information.\n\nBest regards,\nYour Sales Team",
            recipients: [],
          },
        },
        position: { x: -100, y: 500 },
      },
      {
        id: "action-3",
        type: "update_crm",
        name: "Update CRM",
        description: "Update customer record in CRM",
        config: {
          crmFields: {
            leadScore: 0,
            status: "contacted",
            notes: "Lead processed through qualification workflow",
            tags: ["web-lead", "qualified"],
          },
        },
        position: { x: 100, y: 650 },
      },
    ],
    connections: [
      {
        id: "conn-1",
        source: "trigger-1",
        target: "ai-1",
        label: "New Lead",
      },
      {
        id: "conn-2",
        source: "ai-1",
        target: "condition-1",
        label: "Scored",
      },
      {
        id: "conn-3",
        source: "condition-1",
        target: "action-1",
        label: "High Score",
      },
      {
        id: "conn-4",
        source: "condition-1",
        target: "action-2",
        label: "Low Score",
      },
      {
        id: "conn-5",
        source: "action-1",
        target: "action-3",
        label: "Email Sent",
      },
      {
        id: "conn-6",
        source: "action-2",
        target: "action-3",
        label: "Email Sent",
      },
    ],
    triggers: [],
    variables: [
      {
        name: "customer_name",
        type: "string",
        defaultValue: "",
        description: "Customer full name",
      },
      {
        name: "customer_email",
        type: "string",
        defaultValue: "",
        description: "Customer email address",
      },
      {
        name: "lead_score",
        type: "number",
        defaultValue: 0,
        description: "AI-generated lead score",
      },
    ],
    version: 1,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: "template-service-reminder",
    name: "Service Appointment Reminder",
    description: "Automated service reminders and appointment scheduling",
    category: "service",
    steps: [
      {
        id: "trigger-1",
        type: "service_appointment",
        name: "Service Due",
        description: "Triggered when service is due",
        config: {
          serviceAppointment: {
            serviceTypes: ["maintenance"],
            reminderSettings: {
              enabled: true,
              daysBefore: 7,
            },
          },
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "action-1",
        type: "send_email",
        name: "Service Reminder",
        description: "Send service reminder email",
        config: {
          emailTemplate: {
            subject: "Your {{vehicle_make}} {{vehicle_model}} Service is Due",
            body: "Dear {{customer_name}},\n\nYour {{vehicle_make}} {{vehicle_model}} is due for service. Please schedule an appointment at your convenience.\n\nBest regards,\nService Department",
            recipients: [],
          },
        },
        position: { x: 100, y: 250 },
      },
      {
        id: "action-2",
        type: "schedule_appointment",
        name: "Auto-Schedule",
        description: "Automatically schedule appointment",
        config: {
          scheduleAppointment: {
            appointmentType: "service",
            duration: 120,
            location: "Service Bay 1",
            autoConfirm: false,
          },
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "action-3",
        type: "update_crm",
        name: "Update Service Record",
        description: "Update customer service history",
        config: {
          crmFields: {
            status: "service_scheduled",
            notes: "Service reminder sent and appointment scheduled",
            tags: ["service-due", "reminder-sent"],
          },
        },
        position: { x: 100, y: 550 },
      },
    ],
    connections: [
      {
        id: "conn-1",
        source: "trigger-1",
        target: "action-1",
        label: "Service Due",
      },
      {
        id: "conn-2",
        source: "action-1",
        target: "action-2",
        label: "Reminder Sent",
      },
      {
        id: "conn-3",
        source: "action-2",
        target: "action-3",
        label: "Scheduled",
      },
    ],
    triggers: [],
    variables: [
      {
        name: "customer_name",
        type: "string",
        defaultValue: "",
        description: "Customer full name",
      },
      {
        name: "vehicle_make",
        type: "string",
        defaultValue: "",
        description: "Vehicle make",
      },
      {
        name: "vehicle_model",
        type: "string",
        defaultValue: "",
        description: "Vehicle model",
      },
    ],
    version: 1,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: "template-inventory-alert",
    name: "New Inventory Alert",
    description: "Notify interested customers when matching vehicles arrive",
    category: "inventory",
    steps: [
      {
        id: "trigger-1",
        type: "inventory_update",
        name: "New Vehicle Arrival",
        description: "Triggered when new vehicle is added to inventory",
        config: {
          inventoryUpdate: {
            eventTypes: ["new_arrival"],
            vehicleFilters: {},
          },
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-1",
        type: "recommendation_engine",
        name: "Match Customers",
        description: "Find customers interested in this vehicle type",
        config: {
          aiPrompt: {
            model: "gpt-4",
            prompt:
              "Based on the new vehicle specifications and customer preferences in our database, identify customers who might be interested in this vehicle.",
            temperature: 0.4,
            maxTokens: 600,
          },
        },
        position: { x: 100, y: 250 },
      },
      {
        id: "action-1",
        type: "send_email",
        name: "Inventory Alert",
        description: "Send new inventory alert to matched customers",
        config: {
          emailTemplate: {
            subject: "New {{vehicle_make}} {{vehicle_model}} Just Arrived!",
            body: "Dear {{customer_name}},\n\nGreat news! A {{vehicle_year}} {{vehicle_make}} {{vehicle_model}} just arrived at our dealership. Based on your preferences, this might be the perfect vehicle for you.\n\nWould you like to schedule a test drive?\n\nBest regards,\nSales Team",
            recipients: [],
          },
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "action-2",
        type: "update_crm",
        name: "Log Notification",
        description: "Log inventory notification in CRM",
        config: {
          crmFields: {
            status: "inventory_notified",
            notes: "Customer notified of matching inventory arrival",
            tags: ["inventory-alert", "potential-match"],
          },
        },
        position: { x: 100, y: 550 },
      },
    ],
    connections: [
      {
        id: "conn-1",
        source: "trigger-1",
        target: "ai-1",
        label: "New Vehicle",
      },
      {
        id: "conn-2",
        source: "ai-1",
        target: "action-1",
        label: "Customers Matched",
      },
      {
        id: "conn-3",
        source: "action-1",
        target: "action-2",
        label: "Alerts Sent",
      },
    ],
    triggers: [],
    variables: [
      {
        name: "vehicle_make",
        type: "string",
        defaultValue: "",
        description: "Vehicle make",
      },
      {
        name: "vehicle_model",
        type: "string",
        defaultValue: "",
        description: "Vehicle model",
      },
      {
        name: "vehicle_year",
        type: "number",
        defaultValue: new Date().getFullYear(),
        description: "Vehicle year",
      },
    ],
    version: 1,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  {
    id: "template-price-optimization",
    name: "Dynamic Price Optimization",
    description: "AI-powered pricing adjustments based on market conditions",
    category: "marketing",
    steps: [
      {
        id: "trigger-1",
        type: "inventory_update",
        name: "Price Review Trigger",
        description: "Triggered weekly for price review",
        config: {
          inventoryUpdate: {
            eventTypes: ["price_change"],
            vehicleFilters: {},
          },
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-1",
        type: "price_optimization",
        name: "AI Price Analysis",
        description: "Analyze market conditions and recommend pricing",
        config: {
          aiPrompt: {
            model: "gpt-4",
            prompt:
              "Analyze current market conditions, competitor pricing, and vehicle specifications to recommend optimal pricing that maximizes both competitiveness and profit margin.",
            temperature: 0.2,
            maxTokens: 300,
          },
        },
        position: { x: 100, y: 250 },
      },
      {
        id: "condition-1",
        type: "budget_range",
        name: "Price Change Threshold",
        description: "Check if price change is significant",
        config: {
          conditions: [
            {
              field: "price_change_percent",
              operator: "greater_than",
              value: 5,
              logicalOperator: "and",
            },
          ],
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "action-1",
        type: "update_crm",
        name: "Update Pricing",
        description: "Update vehicle pricing in system",
        config: {
          crmFields: {
            status: "price_updated",
            notes: "Price updated based on AI recommendation",
            tags: ["price-optimization", "ai-recommended"],
          },
        },
        position: { x: 100, y: 550 },
      },
    ],
    connections: [
      {
        id: "conn-1",
        source: "trigger-1",
        target: "ai-1",
        label: "Review Needed",
      },
      {
        id: "conn-2",
        source: "ai-1",
        target: "condition-1",
        label: "Analysis Complete",
      },
      {
        id: "conn-3",
        source: "condition-1",
        target: "action-1",
        label: "Significant Change",
      },
    ],
    triggers: [],
    variables: [
      {
        name: "current_price",
        type: "number",
        defaultValue: 0,
        description: "Current vehicle price",
      },
      {
        name: "recommended_price",
        type: "number",
        defaultValue: 0,
        description: "AI recommended price",
      },
      {
        name: "price_change_percent",
        type: "number",
        defaultValue: 0,
        description: "Percentage change in price",
      },
    ],
    version: 1,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper function to get templates by category
export const getTemplatesByCategory = (
  category: "sales" | "service" | "marketing" | "inventory",
) => {
  return AUTOMOTIVE_WORKFLOW_TEMPLATES.filter(
    (template) => template.category === category,
  );
};

// Helper function to get template by ID
export const getTemplateById = (id: string) => {
  return AUTOMOTIVE_WORKFLOW_TEMPLATES.find((template) => template.id === id);
};


