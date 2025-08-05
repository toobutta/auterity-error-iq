"""
NeuroWeaver Automotive Templates Service
Manages automotive-specific prompt templates and datasets
"""

import json
import yaml
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

from app.core.logging import logger
from app.core.config import settings


@dataclass
class AutomotiveTemplate:
    """Automotive template data structure"""
    id: str
    name: str
    description: str
    category: str  # sales, service, parts, finance
    specialization: str
    prompt_template: str
    example_inputs: List[Dict[str, Any]]
    expected_outputs: List[str]
    parameters: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    version: str = "1.0.0"
    is_active: bool = True


@dataclass
class AutomotiveDataset:
    """Automotive dataset metadata"""
    id: str
    name: str
    description: str
    category: str
    format: str  # jsonl, csv, yaml
    file_path: str
    size_mb: float
    sample_count: int
    specializations: List[str]
    created_at: datetime
    version: str = "1.0.0"
    is_active: bool = True


class AutomotiveTemplateService:
    """Service for managing automotive templates and datasets"""

    def __init__(self):
        self.templates_dir = (
            Path(settings.DATA_DIR) / "automotive" / "templates"
        )
        self.datasets_dir = (
            Path(settings.DATA_DIR) / "automotive" / "datasets"
        )
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        self.datasets_dir.mkdir(parents=True, exist_ok=True)

        # Initialize default templates and datasets
        self._initialize_defaults()

    def _initialize_defaults(self):
        """Initialize default automotive templates and datasets"""
        try:
            self._create_default_templates()
            self._create_default_datasets()
            logger.info("Automotive templates and datasets initialized")

        except Exception as e:
            logger.error(f"Failed to initialize automotive templates: {e}")

    def _create_default_templates(self):
        """Create default automotive templates"""
        templates = [
            {
                "id": "dealership_service_advisor",
                "name": "Service Advisor Assistant",
                "description": (
                    "Template for automotive service department interactions"
                ),
                "category": "service",
                "specialization": "service_advisor",
                "prompt_template": self._get_service_advisor_template(),
                "example_inputs": [
                    {
                        "make": "Toyota",
                        "model": "Camry",
                        "year": "2020",
                        "mileage": "45000",
                        "last_service_date": "6 months ago",
                        "customer_concern": "Strange noise when braking"
                    }
                ],
                "expected_outputs": [
                    (
                        "Based on your Toyota Camry's mileage and the brake "
                        "noise concern, I recommend a comprehensive brake "
                        "inspection..."
                    )
                ],
                "parameters": {
                    "max_tokens": 500,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            },
            {
                "id": "automotive_sales_assistant",
                "name": "Sales Assistant",
                "description": (
                    "Template for automotive sales interactions and "
                    "vehicle recommendations"
                ),
                "category": "sales",
                "specialization": "sales_assistant",
                "prompt_template": self._get_sales_assistant_template(),
                "example_inputs": [
                    {
                        "budget": "$35,000",
                        "vehicle_type": "SUV",
                        "primary_use": "Family transportation",
                        "family_size": "4",
                        "fuel_preference": "Hybrid preferred",
                        "special_requirements": "Good safety ratings"
                    }
                ],
                "expected_outputs": [
                    (
                        "Based on your requirements for a family SUV with "
                        "hybrid efficiency and strong safety ratings..."
                    )
                ],
                "parameters": {
                    "max_tokens": 600,
                    "temperature": 0.8,
                    "top_p": 0.9
                }
            },
            {
                "id": "parts_inventory_assistant",
                "name": "Parts Department Assistant",
                "description": (
                    "Template for parts department inquiries and "
                    "inventory management"
                ),
                "category": "parts",
                "specialization": "parts_inventory",
                "prompt_template": self._get_parts_assistant_template(),
                "example_inputs": [
                    {
                        "year": "2019",
                        "make": "Honda",
                        "model": "Civic",
                        "vin": "1HGBH41JXMN109186",
                        "part_description": "Front brake pads",
                        "quantity": "1 set",
                        "urgency": "Needed today"
                    }
                ],
                "expected_outputs": [
                    (
                        "For your 2019 Honda Civic, I can help you with the "
                        "front brake pads. Let me verify the exact part "
                        "number..."
                    )
                ],
                "parameters": {
                    "max_tokens": 400,
                    "temperature": 0.6,
                    "top_p": 0.8
                }
            },
            {
                "id": "finance_advisor_assistant",
                "name": "Finance Advisor Assistant",
                "description": (
                    "Template for automotive finance and insurance "
                    "discussions"
                ),
                "category": "finance",
                "specialization": "finance_advisor",
                "prompt_template": self._get_finance_advisor_template(),
                "example_inputs": [
                    {
                        "vehicle_price": "$28,500",
                        "down_payment": "$5,000",
                        "credit_score": "720-750",
                        "loan_term": "60 months",
                        "trade_value": "$8,000",
                        "special_offers": "0.9% APR promotion"
                    }
                ],
                "expected_outputs": [
                    (
                        "Great! With your excellent credit score and the "
                        "current 0.9% APR promotion, you have some excellent "
                        "financing options..."
                    )
                ],
                "parameters": {
                    "max_tokens": 500,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
        ]

        for template_data in templates:
            template = AutomotiveTemplate(
                **template_data,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self._save_template(template)

    def _create_default_datasets(self):
        """Create default automotive datasets"""
        datasets = [
            {
                "id": "dealership_qa_comprehensive",
                "name": "Comprehensive Dealership Q&A",
                "description": (
                    "Extensive Q&A dataset covering all dealership operations"
                ),
                "category": "general",
                "format": "jsonl",
                "specializations": [
                    "service_advisor", "sales_assistant",
                    "parts_inventory", "finance_advisor"
                ],
                "sample_count": 2500
            },
            {
                "id": "vehicle_specifications_2024",
                "name": "2024 Vehicle Specifications Database",
                "description": (
                    "Complete vehicle specifications for 2024 model year"
                ),
                "category": "specifications",
                "format": "csv",
                "specializations": ["sales_assistant", "parts_inventory"],
                "sample_count": 1500
            },
            {
                "id": "service_procedures_manual",
                "name": "Automotive Service Procedures",
                "description": "Detailed service and maintenance procedures",
                "category": "service",
                "format": "jsonl",
                "specializations": ["service_advisor"],
                "sample_count": 800
            }
        ]

        for dataset_data in datasets:
            file_name = f"{dataset_data['id']}.{dataset_data['format']}"
            file_path = self.datasets_dir / file_name

            self._generate_sample_dataset(file_path, dataset_data)

            dataset = AutomotiveDataset(
                **dataset_data,
                file_path=str(file_path),
                size_mb=(
                    file_path.stat().st_size / (1024 * 1024)
                    if file_path.exists() else 0.0
                ),
                created_at=datetime.utcnow()
            )

            self._save_dataset_metadata(dataset)

    def _generate_sample_dataset(self, file_path: Path, dataset_info: Dict):
        """Generate sample dataset file"""
        if dataset_info["format"] == "jsonl":
            self._generate_jsonl_dataset(file_path, dataset_info)
        elif dataset_info["format"] == "csv":
            self._generate_csv_dataset(file_path, dataset_info)

    def _generate_jsonl_dataset(self, file_path: Path, dataset_info: Dict):
        """Generate JSONL format dataset"""
        sample_data = []

        if "qa" in dataset_info["id"].lower():
            qa_samples = [
                {
                    "question": "What should I do if my check engine light "
                               "comes on?",
                    "answer": (
                        "If your check engine light comes on, you should "
                        "schedule a diagnostic appointment as soon as "
                        "possible. While the vehicle may still be drivable, "
                        "the light indicates an issue that needs attention."
                    ),
                    "category": "service",
                    "specialization": "service_advisor"
                },
                {
                    "question": "How often should I change my oil?",
                    "answer": (
                        "Oil change intervals depend on your vehicle and "
                        "driving conditions. Most modern vehicles require "
                        "oil changes every 5,000-10,000 miles or 6-12 months."
                    ),
                    "category": "service",
                    "specialization": "service_advisor"
                }
            ]

            for i in range(min(dataset_info["sample_count"], 100)):
                base_sample = qa_samples[i % len(qa_samples)]
                sample = base_sample.copy()
                sample["id"] = f"sample_{i+1}"
                sample["timestamp"] = datetime.utcnow().isoformat()
                sample_data.append(sample)

        with open(file_path, 'w') as f:
            for sample in sample_data:
                f.write(json.dumps(sample) + '\n')

    def _generate_csv_dataset(self, file_path: Path, dataset_info: Dict):
        """Generate CSV format dataset"""
        if "specification" in dataset_info["id"].lower():
            header = (
                "make,model,year,trim,engine,transmission,drivetrain,"
                "mpg_city,mpg_highway,horsepower,torque,seating,"
                "cargo_volume,towing_capacity,msrp"
            )

            sample_data = [
                "Toyota,Camry,2024,LE,2.5L I4,8-Speed Automatic,FWD,"
                "28,39,203,184,5,15.1,1500,27190",
                "Honda,Accord,2024,LX,1.5L Turbo I4,CVT,FWD,"
                "30,38,192,192,5,16.7,1000,28390"
            ]

            with open(file_path, 'w') as f:
                f.write(header + '\n')
                for i in range(min(dataset_info["sample_count"], 100)):
                    sample = sample_data[i % len(sample_data)]
                    f.write(sample + '\n')

    def _save_template(self, template: AutomotiveTemplate):
        """Save template to file"""
        template_file = self.templates_dir / f"{template.id}.yaml"
        with open(template_file, 'w') as f:
            yaml.dump(asdict(template), f, default_flow_style=False)

    def _save_dataset_metadata(self, dataset: AutomotiveDataset):
        """Save dataset metadata"""
        metadata_file = self.datasets_dir / f"{dataset.id}_metadata.yaml"
        with open(metadata_file, 'w') as f:
            yaml.dump(asdict(dataset), f, default_flow_style=False)

    async def get_templates(
        self,
        category: Optional[str] = None,
        specialization: Optional[str] = None
    ) -> List[AutomotiveTemplate]:
        """Get automotive templates with optional filtering"""
        templates = []

        for template_file in self.templates_dir.glob("*.yaml"):
            if template_file.name.endswith("_metadata.yaml"):
                continue

            try:
                with open(template_file, 'r') as f:
                    template_data = yaml.safe_load(f)

                template = AutomotiveTemplate(**template_data)

                if category and template.category != category:
                    continue
                if specialization and template.specialization != specialization:
                    continue

                templates.append(template)

            except Exception as e:
                logger.error(f"Failed to load template {template_file}: {e}")

        return templates

    async def get_template(self, template_id: str) -> Optional[AutomotiveTemplate]:
        """Get specific template by ID"""
        template_file = self.templates_dir / f"{template_id}.yaml"

        if not template_file.exists():
            return None

        try:
            with open(template_file, 'r') as f:
                template_data = yaml.safe_load(f)

            return AutomotiveTemplate(**template_data)

        except Exception as e:
            logger.error(f"Failed to load template {template_id}: {e}")
            return None

    async def create_custom_template(
        self, template_data: Dict[str, Any]
    ) -> AutomotiveTemplate:
        """Create a custom automotive template"""
        template = AutomotiveTemplate(
            **template_data,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self._save_template(template)
        logger.info(f"Created custom template: {template.id}")

        return template

    def _get_service_advisor_template(self) -> str:
        """Get service advisor prompt template"""
        return """<|system|>
You are an experienced automotive service advisor assistant. Your role is to help customers understand their vehicle's maintenance needs, explain service procedures, and provide accurate technical information.

Key responsibilities:
- Assess vehicle maintenance needs based on mileage and service history
- Explain service procedures in customer-friendly language
- Provide accurate cost estimates and timeframes
- Recommend preventive maintenance based on manufacturer guidelines
- Address customer concerns with empathy and expertise

Always prioritize customer safety and satisfaction while maintaining technical accuracy.
<|endoftext|>

<|user|>
Vehicle Information:
- Make: {make}
- Model: {model}
- Year: {year}
- Mileage: {mileage}
- Last Service: {last_service_date}
- Customer Concern: {customer_concern}

Please provide service recommendations and explain any necessary procedures.
<|endoftext|>

<|assistant|>
{response}
<|endoftext|>"""

    def _get_sales_assistant_template(self) -> str:
        """Get sales assistant prompt template"""
        return """<|system|>
You are a knowledgeable automotive sales assistant. Your role is to help customers find the right vehicle based on their needs, budget, and preferences while providing accurate information about features, financing, and incentives.

Key responsibilities:
- Understand customer needs and preferences
- Recommend suitable vehicles based on requirements
- Explain vehicle features and benefits clearly
- Provide accurate pricing and financing information
- Address customer questions and concerns professionally

Always be honest, helpful, and focused on finding the best solution for the customer.
<|endoftext|>

<|user|>
Customer Profile:
- Budget: {budget}
- Vehicle Type: {vehicle_type}
- Primary Use: {primary_use}
- Family Size: {family_size}
- Fuel Preference: {fuel_preference}
- Special Requirements: {special_requirements}

Please recommend suitable vehicles and explain why they would be a good fit.
<|endoftext|>

<|assistant|>
{response}
<|endoftext|>"""

    def _get_parts_assistant_template(self) -> str:
        """Get parts assistant prompt template"""
        return """<|system|>
You are a parts department specialist assistant. Your role is to help customers and technicians find the correct parts, check availability, provide pricing, and offer installation guidance.

Key responsibilities:
- Identify correct parts using VIN, year, make, model information
- Check parts availability and provide accurate pricing
- Suggest OEM vs aftermarket alternatives when appropriate
- Provide basic installation guidance and tool requirements
- Handle special orders and delivery timeframes

Always ensure part compatibility and provide clear, accurate information.
<|endoftext|>

<|user|>
Parts Request:
- Vehicle: {year} {make} {model}
- VIN: {vin}
- Part Needed: {part_description}
- Quantity: {quantity}
- Urgency: {urgency}

Please help identify the correct part and provide availability/pricing information.
<|endoftext|>

<|assistant|>
{response}
<|endoftext|>"""

    def _get_finance_advisor_template(self) -> str:
        """Get finance advisor prompt template"""
        return """<|system|>
You are an automotive finance advisor assistant. Your role is to help customers understand financing options, calculate payments, explain warranties and insurance products, and guide them through the finance process.

Key responsibilities:
- Explain financing options (loans, leases, cash)
- Calculate monthly payments and total costs
- Present warranty and insurance products clearly
- Help customers understand terms and conditions
- Ensure compliance with lending regulations

Always be transparent about costs and terms while helping customers make informed decisions.
<|endoftext|>

<|user|>
Finance Inquiry:
- Vehicle Price: {vehicle_price}
- Down Payment: {down_payment}
- Credit Score Range: {credit_score}
- Preferred Term: {loan_term}
- Trade-in Value: {trade_value}
- Special Offers: {special_offers}

Please explain financing options and calculate estimated payments.
<|endoftext|>

<|assistant|>
{response}
<|endoftext|>"""