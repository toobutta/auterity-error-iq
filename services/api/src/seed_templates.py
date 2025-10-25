"""Seed script for creating common dealership workflow templates."""

import asyncio
from typing import Any, Dict

from app.database import SessionLocal
from app.services.template_engine import TemplateEngine


def create_customer_inquiry_template() -> Dict[str, Any]:
    """Create a customer inquiry processing template."""
    return {
        "name": "Customer Inquiry Processing",
        "description": "Process customer inquiries with AI-powered responses and follow-up actions",
        "category": "sales",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Customer Inquiry Received"},
                },
                {
                    "id": "analyze_inquiry",
                    "type": "ai_process",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "label": "Analyze Inquiry",
                        "prompt": "Analyze this customer inquiry and categorize it: {{customer_message}}. Determine if it's about: sales, service, parts, or general information. Also extract key details like vehicle interest, budget range, or specific needs.",
                        "output_key": "analysis",
                    },
                },
                {
                    "id": "generate_response",
                    "type": "ai_process",
                    "position": {"x": 500, "y": 100},
                    "data": {
                        "label": "Generate Response",
                        "prompt": "Based on this analysis: {{analysis}}, generate a professional and helpful response to the customer. Use the dealership name '{{dealership_name}}' and include relevant information about our {{vehicle_brand}} vehicles. Keep the tone {{response_tone}}.",
                        "output_key": "response",
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 700, "y": 100},
                    "data": {"label": "Response Generated"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "analyze_inquiry"},
                {
                    "id": "e2",
                    "source": "analyze_inquiry",
                    "target": "generate_response",
                },
                {"id": "e3", "source": "generate_response", "target": "end"},
            ],
        },
        "parameters": [
            {
                "name": "dealership_name",
                "description": "Name of the dealership",
                "parameter_type": "string",
                "is_required": True,
                "validation_rules": {"min_length": 2, "max_length": 100},
            },
            {
                "name": "vehicle_brand",
                "description": "Primary vehicle brand sold by the dealership",
                "parameter_type": "string",
                "is_required": True,
                "default_value": "Toyota",
            },
            {
                "name": "response_tone",
                "description": "Tone for customer responses",
                "parameter_type": "string",
                "is_required": False,
                "default_value": "friendly and professional",
            },
        ],
    }


def create_service_appointment_template() -> Dict[str, Any]:
    """Create a service appointment scheduling template."""
    return {
        "name": "Service Appointment Scheduling",
        "description": "Process service appointment requests and provide scheduling options",
        "category": "service",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Service Request Received"},
                },
                {
                    "id": "extract_details",
                    "type": "ai_process",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "label": "Extract Service Details",
                        "prompt": "Extract service details from this request: {{service_request}}. Identify: vehicle make/model/year, service type needed, urgency level, preferred dates/times, and customer contact information.",
                        "output_key": "service_details",
                    },
                },
                {
                    "id": "check_availability",
                    "type": "process",
                    "position": {"x": 500, "y": 100},
                    "data": {
                        "label": "Check Availability",
                        "description": "Check service bay availability for the requested timeframe",
                    },
                },
                {
                    "id": "generate_options",
                    "type": "ai_process",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "label": "Generate Appointment Options",
                        "prompt": "Based on these service details: {{service_details}} and available slots: {{available_slots}}, generate 3 appointment options for the customer. Include estimated service time of {{estimated_duration}} hours and mention our {{service_specials}} if applicable.",
                        "output_key": "appointment_options",
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 900, "y": 100},
                    "data": {"label": "Options Provided"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "extract_details"},
                {
                    "id": "e2",
                    "source": "extract_details",
                    "target": "check_availability",
                },
                {
                    "id": "e3",
                    "source": "check_availability",
                    "target": "generate_options",
                },
                {"id": "e4", "source": "generate_options", "target": "end"},
            ],
        },
        "parameters": [
            {
                "name": "estimated_duration",
                "description": "Default estimated service duration in hours",
                "parameter_type": "number",
                "is_required": False,
                "default_value": 2,
                "validation_rules": {"min_value": 0.5, "max_value": 8},
            },
            {
                "name": "service_specials",
                "description": "Current service specials or promotions",
                "parameter_type": "string",
                "is_required": False,
                "default_value": "10% off oil changes this month",
            },
        ],
    }


def create_parts_inquiry_template() -> Dict[str, Any]:
    """Create a parts inquiry and availability template."""
    return {
        "name": "Parts Inquiry and Availability",
        "description": "Process parts inquiries and provide availability and pricing information",
        "category": "parts",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Parts Inquiry Received"},
                },
                {
                    "id": "identify_part",
                    "type": "ai_process",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "label": "Identify Part",
                        "prompt": "Analyze this parts request: {{parts_request}}. Identify the specific part needed, vehicle make/model/year, part number if provided, and quantity requested.",
                        "output_key": "part_details",
                    },
                },
                {
                    "id": "check_inventory",
                    "type": "process",
                    "position": {"x": 500, "y": 100},
                    "data": {
                        "label": "Check Inventory",
                        "description": "Check parts inventory and pricing",
                    },
                },
                {
                    "id": "generate_quote",
                    "type": "ai_process",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "label": "Generate Quote",
                        "prompt": "Based on part details: {{part_details}} and inventory status: {{inventory_status}}, generate a professional quote. Include pricing with {{markup_percentage}}% markup, availability timeline, and installation options if applicable.",
                        "output_key": "parts_quote",
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 900, "y": 100},
                    "data": {"label": "Quote Provided"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "identify_part"},
                {
                    "id": "e2",
                    "source": "identify_part",
                    "target": "check_inventory",
                },
                {
                    "id": "e3",
                    "source": "check_inventory",
                    "target": "generate_quote",
                },
                {"id": "e4", "source": "generate_quote", "target": "end"},
            ],
        },
        "parameters": [
            {
                "name": "markup_percentage",
                "description": "Markup percentage for parts pricing",
                "parameter_type": "number",
                "is_required": False,
                "default_value": 25,
                "validation_rules": {"min_value": 0, "max_value": 100},
            }
        ],
    }


def create_lead_qualification_template() -> Dict[str, Any]:
    """Create a lead qualification template."""
    return {
        "name": "Sales Lead Qualification",
        "description": "Qualify and score sales leads based on customer information and preferences",
        "category": "sales",
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Lead Received"},
                },
                {
                    "id": "extract_info",
                    "type": "ai_process",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "label": "Extract Lead Information",
                        "prompt": "Extract key information from this lead: {{lead_data}}. Identify: budget range, vehicle preferences, timeline to purchase, financing needs, trade-in information, and contact preferences.",
                        "output_key": "lead_info",
                    },
                },
                {
                    "id": "score_lead",
                    "type": "ai_process",
                    "position": {"x": 500, "y": 100},
                    "data": {
                        "label": "Score Lead",
                        "prompt": "Score this lead from 1-10 based on: {{lead_info}}. Consider budget alignment with {{target_price_range}}, timeline urgency, and likelihood to purchase. Provide reasoning for the score.",
                        "output_key": "lead_score",
                    },
                },
                {
                    "id": "recommend_action",
                    "type": "ai_process",
                    "position": {"x": 700, "y": 100},
                    "data": {
                        "label": "Recommend Next Action",
                        "prompt": "Based on lead score: {{lead_score}} and info: {{lead_info}}, recommend the best next action. Should this be: immediate call, email follow-up, appointment scheduling, or nurture campaign? Include suggested messaging approach.",
                        "output_key": "recommended_action",
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 900, "y": 100},
                    "data": {"label": "Lead Qualified"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "extract_info"},
                {"id": "e2", "source": "extract_info", "target": "score_lead"},
                {
                    "id": "e3",
                    "source": "score_lead",
                    "target": "recommend_action",
                },
                {"id": "e4", "source": "recommend_action", "target": "end"},
            ],
        },
        "parameters": [
            {
                "name": "target_price_range",
                "description": "Target price range for vehicles (e.g., '$20,000-$35,000')",
                "parameter_type": "string",
                "is_required": True,
                "default_value": "$20,000-$40,000",
            }
        ],
    }


async def seed_templates():
    """Seed the database with common dealership workflow templates."""
    db = SessionLocal()
    template_engine = TemplateEngine(db)

    templates = [
        create_customer_inquiry_template(),
        create_service_appointment_template(),
        create_parts_inquiry_template(),
        create_lead_qualification_template(),
    ]

    try:
        for template_data in templates:
            # Check if template already exists
            existing = (
                db.query(Template)
                .filter(Template.name == template_data["name"])
                .first()
            )

            if existing:
                print(
                    f"Template '{template_data['name']}' already exists, skipping..."
                )
                continue

            template = await template_engine.create_template(
                name=template_data["name"],
                description=template_data["description"],
                category=template_data["category"],
                definition=template_data["definition"],
                parameters=template_data.get("parameters", []),
            )

            print(f"Created template: {template.name} (ID: {template.id})")

        print("Template seeding completed successfully!")

    except Exception as e:
        print(f"Error seeding templates: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # Import here to avoid circular imports
    from app.models import Template

    asyncio.run(seed_templates())
