"""Database initialization script with seed data."""

import logging

from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_seed_users():
    """Create seed users for development."""
    seed_users = [
        {"email": "admin@autodealer.com", "name": "Admin User", "password": "admin123"},
        {
            "email": "manager@autodealer.com",
            "name": "Dealership Manager",
            "password": "manager123",
        },
        {
            "email": "staff@autodealer.com",
            "name": "Staff Member",
            "password": "staff123",
        },
    ]

    with get_db_session() as db:
        for user_data in seed_users:
            # Check if user already exists
            existing_user = (
                db.query(User).filter(User.email == user_data["email"]).first()
            )
            if existing_user:
                logger.info(f"User {user_data['email']} already exists, skipping")
                continue

            user = User(
                email=user_data["email"],
                name=user_data["name"],
                hashed_password=hash_password(user_data["password"]),
                is_active=True,
            )
            db.add(user)
            logger.info(f"Created user: {user_data['email']}")


def create_seed_templates():
    """Create seed workflow templates."""

    # Customer inquiry response template
    customer_inquiry_template = {
        "name": "Customer Inquiry Response",
        "description": "Automated response to customer inquiries about vehicle availability and pricing",
        "category": "Sales",
        "definition": {
            "steps": [
                {
                    "id": "extract_info",
                    "type": "ai_processing",
                    "name": "Extract Customer Information",
                    "prompt": "Extract the customer's name, contact info, and vehicle interest from: {{customer_message}}",
                },
                {
                    "id": "check_inventory",
                    "type": "data_lookup",
                    "name": "Check Vehicle Inventory",
                    "query": "SELECT * FROM inventory WHERE make = {{vehicle_make}} AND model = {{vehicle_model}}",
                },
                {
                    "id": "generate_response",
                    "type": "ai_processing",
                    "name": "Generate Response",
                    "prompt": "Create a professional response to {{customer_name}} about {{vehicle_interest}} availability. Include pricing if available: {{inventory_data}}",
                },
            ]
        },
        "parameters": [
            {
                "name": "customer_message",
                "description": "The original customer inquiry message",
                "parameter_type": "string",
                "is_required": True,
            },
            {
                "name": "dealership_name",
                "description": "Name of the dealership",
                "parameter_type": "string",
                "is_required": True,
                "default_value": "AutoMatrix Dealership",
            },
        ],
    }

    # Service appointment scheduling template
    service_appointment_template = {
        "name": "Service Appointment Scheduling",
        "description": "Automated service appointment scheduling and confirmation",
        "category": "Service",
        "definition": {
            "steps": [
                {
                    "id": "parse_request",
                    "type": "ai_processing",
                    "name": "Parse Service Request",
                    "prompt": "Extract service type, preferred date/time, and customer details from: {{service_request}}",
                },
                {
                    "id": "check_availability",
                    "type": "data_lookup",
                    "name": "Check Service Availability",
                    "query": "SELECT available_slots FROM service_schedule WHERE date = {{requested_date}}",
                },
                {
                    "id": "book_appointment",
                    "type": "data_update",
                    "name": "Book Appointment",
                    "action": "INSERT INTO appointments (customer_id, service_type, scheduled_time) VALUES ({{customer_id}}, {{service_type}}, {{scheduled_time}})",
                },
                {
                    "id": "send_confirmation",
                    "type": "ai_processing",
                    "name": "Generate Confirmation",
                    "prompt": "Create appointment confirmation message for {{customer_name}} on {{scheduled_date}} for {{service_type}}",
                },
            ]
        },
        "parameters": [
            {
                "name": "service_request",
                "description": "Customer's service request message",
                "parameter_type": "string",
                "is_required": True,
            },
            {
                "name": "service_advisor_name",
                "description": "Name of the service advisor",
                "parameter_type": "string",
                "is_required": False,
                "default_value": "Service Team",
            },
        ],
    }

    # Parts inquiry template
    parts_inquiry_template = {
        "name": "Parts Availability Check",
        "description": "Check parts availability and provide pricing information",
        "category": "Parts",
        "definition": {
            "steps": [
                {
                    "id": "identify_part",
                    "type": "ai_processing",
                    "name": "Identify Required Part",
                    "prompt": "Identify the specific part needed from this request: {{parts_request}}. Include part number if mentioned.",
                },
                {
                    "id": "check_inventory",
                    "type": "data_lookup",
                    "name": "Check Parts Inventory",
                    "query": "SELECT * FROM parts_inventory WHERE part_number = {{part_number}} OR description LIKE '%{{part_description}}%'",
                },
                {
                    "id": "generate_quote",
                    "type": "ai_processing",
                    "name": "Generate Parts Quote",
                    "prompt": "Create a parts quote for {{customer_name}} including availability, pricing, and delivery time for: {{part_info}}",
                },
            ]
        },
        "parameters": [
            {
                "name": "parts_request",
                "description": "Customer's parts inquiry",
                "parameter_type": "string",
                "is_required": True,
            },
            {
                "name": "markup_percentage",
                "description": "Parts markup percentage",
                "parameter_type": "number",
                "is_required": False,
                "default_value": 15,
            },
        ],
    }

    templates_data = [
        customer_inquiry_template,
        service_appointment_template,
        parts_inquiry_template,
    ]

    with get_db_session() as db:
        for template_data in templates_data:
            # Check if template already exists
            existing_template = (
                db.query(Template)
                .filter(Template.name == template_data["name"])
                .first()
            )
            if existing_template:
                logger.info(
                    f"Template '{template_data['name']}' already exists, skipping"
                )
                continue

            # Create template
            template = Template(
                name=template_data["name"],
                description=template_data["description"],
                category=template_data["category"],
                definition=template_data["definition"],
                is_active=True,
            )
            db.add(template)
            db.flush()  # Get the template ID

            # Create template parameters
            for param_data in template_data["parameters"]:
                parameter = TemplateParameter(
                    template_id=template.id,
                    name=param_data["name"],
                    description=param_data["description"],
                    parameter_type=param_data["parameter_type"],
                    is_required=param_data["is_required"],
                    default_value=param_data.get("default_value"),
                    validation_rules=param_data.get("validation_rules"),
                )
                db.add(parameter)

            logger.info(f"Created template: {template_data['name']}")


def init_database():
    """Initialize database with tables and seed data."""
    logger.info("Starting database initialization...")

    # Check database connection
    if not check_database_connection():
        logger.error("Database connection failed. Cannot initialize database.")
        return False

    try:
        # Create tables
        create_tables()

        # Create seed data
        create_seed_users()
        create_seed_templates()

        logger.info("Database initialization completed successfully")
        return True

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_database()
