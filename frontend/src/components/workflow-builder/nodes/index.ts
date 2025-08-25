// Export all automotive node components
export { default as CustomerInquiryNode } from "./CustomerInquiryNode";
export { default as SendEmailNode } from "./SendEmailNode";
export { default as LeadQualificationNode } from "./LeadQualificationNode";

// Re-export existing nodes
export { StartNode } from "../../nodes/StartNode";
export { AIProcessNode } from "../../nodes/AIProcessNode";
export { EndNode } from "../../nodes/EndNode";

// For now, use existing components as placeholders for missing nodes
export { StartNode as InventoryUpdateNode } from "../../nodes/StartNode";
export { StartNode as ServiceAppointmentNode } from "../../nodes/StartNode";
export { AIProcessNode as UpdateCRMNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as ScheduleAppointmentNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as GenerateQuoteNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as InventoryCheckNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as CustomerTypeNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as BudgetRangeNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as VehiclePreferenceNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as GeographicLocationNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as PriceOptimizationNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as CustomerSentimentNode } from "../../nodes/AIProcessNode";
export { AIProcessNode as RecommendationEngineNode } from "../../nodes/AIProcessNode";
