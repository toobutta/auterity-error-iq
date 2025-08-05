"""
Automotive Industry Kit for NeuroWeaver

This module provides specialized components for fine-tuning and deploying
AI models for automotive industry applications, including dealerships,
OEMs, and automotive groups.
"""

import os
import json
import yaml
import logging
from typing import Dict, Any, List, Optional, Union
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AutomotiveKit:
    """
    Automotive Industry Kit for NeuroWeaver platform.
    Provides specialized components for automotive applications.
    """
    
    def __init__(self, base_dir: Optional[str] = None):
        """
        Initialize the Automotive Kit
        
        Args:
            base_dir: Base directory for kit resources
        """
        self.base_dir = base_dir or os.path.dirname(os.path.abspath(__file__))
        self.config_dir = os.path.join(self.base_dir, "config")
        self.datasets_dir = os.path.join(self.base_dir, "datasets")
        self.templates_dir = os.path.join(self.base_dir, "templates")
        self.models_dir = os.path.join(self.base_dir, "models")
        
        # Ensure directories exist
        os.makedirs(self.config_dir, exist_ok=True)
        os.makedirs(self.datasets_dir, exist_ok=True)
        os.makedirs(self.templates_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Load kit configuration
        self.config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """
        Load kit configuration
        
        Returns:
            Dict[str, Any]: Kit configuration
        """
        config_path = os.path.join(self.config_dir, "kit_config.yaml")
        
        if not os.path.exists(config_path):
            # Create default configuration
            config = {
                "name": "Automotive Industry Kit",
                "version": "1.0.0",
                "description": "Specialized components for automotive industry applications",
                "specializations": [
                    "dealership_operations",
                    "vehicle_specifications",
                    "service_and_maintenance",
                    "sales_and_finance",
                    "parts_inventory",
                    "customer_relationship"
                ],
                "models": [
                    {
                        "name": "automotive-large",
                        "base_model": "mistral-7b",
                        "description": "Large model for comprehensive automotive applications",
                        "specializations": ["dealership_operations", "vehicle_specifications", "service_and_maintenance", "sales_and_finance"]
                    },
                    {
                        "name": "automotive-medium",
                        "base_model": "llama-7b",
                        "description": "Medium model balanced for general automotive use",
                        "specializations": ["dealership_operations", "vehicle_specifications", "customer_relationship"]
                    },
                    {
                        "name": "automotive-small",
                        "base_model": "gpt-j-6b",
                        "description": "Small model for lightweight automotive applications",
                        "specializations": ["vehicle_specifications", "parts_inventory"]
                    }
                ],
                "datasets": [
                    {
                        "name": "dealership_qa",
                        "description": "Question-answering dataset for dealership operations",
                        "format": "jsonl",
                        "size": "5MB",
                        "sample_count": 1000
                    },
                    {
                        "name": "vehicle_specs",
                        "description": "Vehicle specifications and technical details",
                        "format": "csv",
                        "size": "10MB",
                        "sample_count": 5000
                    },
                    {
                        "name": "maintenance_procedures",
                        "description": "Automotive maintenance and service procedures",
                        "format": "jsonl",
                        "size": "8MB",
                        "sample_count": 2000
                    },
                    {
                        "name": "sales_conversations",
                        "description": "Sales conversations and customer interactions",
                        "format": "jsonl",
                        "size": "15MB",
                        "sample_count": 3000
                    }
                ],
                "templates": [
                    {
                        "name": "dealership_operations",
                        "description": "Template for dealership management and operations",
                        "file": "dealership_operations.yaml"
                    },
                    {
                        "name": "service_advisor",
                        "description": "Template for service department and maintenance advising",
                        "file": "service_advisor.yaml"
                    },
                    {
                        "name": "sales_assistant",
                        "description": "Template for sales and customer relationship",
                        "file": "sales_assistant.yaml"
                    },
                    {
                        "name": "parts_inventory",
                        "description": "Template for parts department and inventory management",
                        "file": "parts_inventory.yaml"
                    }
                ],
                "integrations": [
                    {
                        "name": "RelayCore",
                        "description": "Integration with RelayCore platform",
                        "status": "planned"
                    },
                    {
                        "name": "DMS",
                        "description": "Dealership Management System integration",
                        "status": "planned"
                    },
                    {
                        "name": "OEM_APIs",
                        "description": "OEM API integrations for vehicle data",
                        "status": "planned"
                    }
                ]
            }
            
            # Save default configuration
            with open(config_path, 'w') as f:
                yaml.dump(config, f)
                
            logger.info(f"Created default configuration at {config_path}")
        else:
            # Load existing configuration
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                
            logger.info(f"Loaded configuration from {config_path}")
            
        return config
        
    def get_specializations(self) -> List[str]:
        """
        Get available specializations
        
        Returns:
            List[str]: List of specialization names
        """
        return self.config.get("specializations", [])
        
    def get_models(self) -> List[Dict[str, Any]]:
        """
        Get available models
        
        Returns:
            List[Dict[str, Any]]: List of model configurations
        """
        return self.config.get("models", [])
        
    def get_datasets(self) -> List[Dict[str, Any]]:
        """
        Get available datasets
        
        Returns:
            List[Dict[str, Any]]: List of dataset configurations
        """
        return self.config.get("datasets", [])
        
    def get_templates(self) -> List[Dict[str, Any]]:
        """
        Get available templates
        
        Returns:
            List[Dict[str, Any]]: List of template configurations
        """
        return self.config.get("templates", [])
        
    def get_integrations(self) -> List[Dict[str, Any]]:
        """
        Get available integrations
        
        Returns:
            List[Dict[str, Any]]: List of integration configurations
        """
        return self.config.get("integrations", [])
        
    def create_example_dataset(self, dataset_name: str, output_dir: Optional[str] = None) -> str:
        """
        Create an example dataset
        
        Args:
            dataset_name: Name of the dataset
            output_dir: Directory to save the dataset (defaults to kit datasets directory)
            
        Returns:
            str: Path to the created dataset
        """
        # Find dataset configuration
        dataset_config = None
        for ds in self.get_datasets():
            if ds["name"] == dataset_name:
                dataset_config = ds
                break
                
        if not dataset_config:
            raise ValueError(f"Dataset not found: {dataset_name}")
            
        # Determine output directory
        if not output_dir:
            output_dir = self.datasets_dir
            
        os.makedirs(output_dir, exist_ok=True)
        
        # Create example dataset based on format
        format = dataset_config.get("format", "jsonl")
        output_path = os.path.join(output_dir, f"{dataset_name}.{format}")
        
        if dataset_name == "dealership_qa":
            self._create_dealership_qa_dataset(output_path)
        elif dataset_name == "vehicle_specs":
            self._create_vehicle_specs_dataset(output_path)
        elif dataset_name == "maintenance_procedures":
            self._create_maintenance_procedures_dataset(output_path)
        elif dataset_name == "sales_conversations":
            self._create_sales_conversations_dataset(output_path)
        else:
            raise ValueError(f"No example generator for dataset: {dataset_name}")
            
        logger.info(f"Created example dataset at {output_path}")
        return output_path
        
    def _create_dealership_qa_dataset(self, output_path: str):
        """
        Create example dealership Q&A dataset
        
        Args:
            output_path: Path to save the dataset
        """
        examples = [
            {
                "question": "What information do I need to provide for a vehicle trade-in evaluation?",
                "answer": "For a trade-in evaluation, you'll need to provide the vehicle's make, model, year, trim level, mileage, VIN (if available), information about any accidents or damage, maintenance history, and details about any aftermarket modifications or outstanding loans. The more complete information you provide, the more accurate the trade-in estimate will be.",
                "category": "sales"
            },
            {
                "question": "How do I track the status of my vehicle that's in for service?",
                "answer": "You can track your vehicle's service status through our dealership's online customer portal. After creating an account, you'll be able to see real-time updates on your vehicle's service progress, including which services have been completed, which are in progress, and the estimated completion time. You can also enable text or email notifications for status updates. Alternatively, you can contact our service department directly at the number provided when you dropped off your vehicle.",
                "category": "service"
            },
            {
                "question": "What financing options are available for purchasing a new vehicle?",
                "answer": "Our dealership offers several financing options including traditional auto loans through our partner banks and credit unions, manufacturer-sponsored financing programs with special rates for qualified buyers, lease options with flexible terms, balloon payment plans for lower monthly payments, and special financing programs for first-time buyers or those with challenged credit. We recommend speaking with our finance department who can help determine which option best fits your financial situation and goals.",
                "category": "finance"
            },
            {
                "question": "How do I order a specific part for my vehicle?",
                "answer": "To order a specific part, you can contact our parts department directly by phone or through our website's parts request form. You'll need to provide your vehicle's make, model, year, and VIN if possible, along with the specific part name or part number if you have it. Our parts specialists can verify compatibility, check availability, and provide pricing information. We can order from both OEM and aftermarket suppliers, and we'll notify you when your part arrives. For complex parts or installation needs, we recommend scheduling a consultation with our parts department.",
                "category": "parts"
            },
            {
                "question": "What's the process for scheduling a test drive?",
                "answer": "To schedule a test drive, you can use our online appointment system on our website, call our sales department directly, or visit the dealership in person. When scheduling, please specify which vehicle(s) you're interested in testing. We recommend allowing about 30-45 minutes per vehicle. Please bring your valid driver's license, as we'll need to make a copy before the test drive. If you have specific route preferences or want to test certain driving conditions (highway, city, etc.), let us know in advance so we can plan accordingly.",
                "category": "sales"
            },
            {
                "question": "How often should I have my transmission fluid changed?",
                "answer": "Transmission fluid change intervals vary by vehicle make, model, year, and driving conditions. For most modern vehicles, manufacturers recommend changing automatic transmission fluid every 60,000 to 100,000 miles. However, if you frequently tow heavy loads, drive in extreme temperatures, or primarily drive in stop-and-go traffic, you may need more frequent service (every 30,000-50,000 miles). For manual transmissions, the interval is typically every 30,000 to 60,000 miles. We recommend following your vehicle's specific maintenance schedule in the owner's manual or consulting with our service department for personalized advice based on your driving habits and vehicle condition.",
                "category": "service"
            },
            {
                "question": "What warranties are included with a certified pre-owned vehicle?",
                "answer": "Our Certified Pre-Owned (CPO) vehicles include several warranty protections. First, any remaining portion of the original manufacturer's warranty transfers to you. Additionally, our CPO program extends the powertrain warranty (covering engine, transmission, and drivetrain) for an additional 7 years or 100,000 miles from the original in-service date. We also include a 12-month/12,000-mile bumper-to-bumper limited warranty covering most vehicle systems and components. All CPO vehicles come with 24/7 roadside assistance, a free CARFAX vehicle history report, and a 3-month trial of satellite radio where available. Optional extended warranty packages are also available for additional coverage and longer terms.",
                "category": "sales"
            },
            {
                "question": "How do I know if my vehicle is affected by a recall?",
                "answer": "To check if your vehicle is affected by a recall, you can: 1) Enter your Vehicle Identification Number (VIN) on the National Highway Traffic Safety Administration (NHTSA) website at nhtsa.gov/recalls, 2) Check the manufacturer's website using your VIN, 3) Contact our service department with your VIN, and we can verify any open recalls, 4) Sign up for recall alerts through our dealership's customer portal. If your vehicle has an open recall, the repairs will be performed at no cost to you at our service department. We recommend addressing recalls promptly for your safety.",
                "category": "service"
            },
            {
                "question": "What documents do I need to bring when purchasing a vehicle?",
                "answer": "When purchasing a vehicle, please bring: 1) Valid driver's license, 2) Proof of insurance for the new vehicle, 3) Method of payment (cashier's check, loan pre-approval letter, etc.), 4) Title and registration for your trade-in vehicle (if applicable), 5) Proof of residence (utility bill, lease agreement, etc.), 6) Proof of income if financing (recent pay stubs, tax returns for self-employed), 7) Down payment funds, 8) Any promotional offers or rebates you plan to use. If you're financing through us, we may require additional documentation. We recommend calling ahead to confirm exactly what you'll need based on your specific purchase situation.",
                "category": "finance"
            },
            {
                "question": "How long does a typical vehicle service appointment take?",
                "answer": "Service appointment duration varies based on the type of service needed. Oil changes and basic maintenance typically take 1-2 hours. Brake service usually requires 2-3 hours. More complex services like timing belt replacement or transmission work may take a full day or longer. Diagnostic evaluations generally take 1-2 hours but may lead to additional service time based on findings. We provide estimated completion times when you schedule your appointment and will update you if additional work is needed. For longer services, we offer courtesy loaner vehicles or shuttle service by appointment. You can also monitor service progress through our online portal.",
                "category": "service"
            }
        ]
        
        # Generate more examples by creating variations
        all_examples = examples.copy()
        categories = ["sales", "service", "finance", "parts"]
        
        for i in range(90):  # Create 90 more examples to reach 100 total
            base_example = examples[i % len(examples)]
            new_example = base_example.copy()
            new_example["question"] = f"[Variation {i+1}] {base_example['question']}"
            new_example["category"] = categories[i % len(categories)]
            all_examples.append(new_example)
            
        # Write to file
        with open(output_path, 'w') as f:
            for example in all_examples:
                f.write(json.dumps(example) + '\n')
                
    def _create_vehicle_specs_dataset(self, output_path: str):
        """
        Create example vehicle specifications dataset
        
        Args:
            output_path: Path to save the dataset
        """
        # CSV header
        header = "make,model,year,trim,engine,transmission,drivetrain,mpg_city,mpg_highway,horsepower,torque,seating,cargo_volume,towing_capacity,msrp"
        
        # Example data
        examples = [
            "Toyota,Camry,2025,LE,2.5L I4,8-Speed Automatic,FWD,28,39,203,184,5,15.1,1500,27190",
            "Toyota,Camry,2025,XLE,2.5L I4,8-Speed Automatic,FWD,27,38,203,184,5,15.1,1500,32190",
            "Toyota,Camry,2025,XSE,2.5L I4,8-Speed Automatic,FWD,26,36,206,186,5,15.1,1500,33790",
            "Toyota,Camry,2025,Hybrid LE,2.5L I4 Hybrid,eCVT,FWD,51,53,208,163,5,15.1,1500,29990",
            "Toyota,RAV4,2025,LE,2.5L I4,8-Speed Automatic,FWD,27,35,203,184,5,37.6,1500,28990",
            "Toyota,RAV4,2025,XLE,2.5L I4,8-Speed Automatic,AWD,27,34,203,184,5,37.6,1500,31990",
            "Toyota,RAV4,2025,Hybrid XSE,2.5L I4 Hybrid,eCVT,AWD,41,38,219,163,5,37.6,1750,36090",
            "Honda,Accord,2025,LX,1.5L Turbo I4,CVT,FWD,30,38,192,192,5,16.7,1000,28390",
            "Honda,Accord,2025,Sport,1.5L Turbo I4,CVT,FWD,29,37,192,192,5,16.7,1000,30990",
            "Honda,Accord,2025,Hybrid,2.0L I4 Hybrid,eCVT,FWD,48,47,212,232,5,16.7,1000,33990",
            "Honda,CR-V,2025,LX,1.5L Turbo I4,CVT,FWD,28,34,190,179,5,39.3,1500,29990",
            "Honda,CR-V,2025,EX-L,1.5L Turbo I4,CVT,AWD,27,32,190,179,5,39.3,1500,35990",
            "Honda,CR-V,2025,Hybrid Touring,2.0L I4 Hybrid,eCVT,AWD,40,35,212,232,5,33.2,1500,40990",
            "Ford,F-150,2025,XL,2.7L Turbo V6,10-Speed Automatic,4WD,20,26,325,400,3,52.8,8200,39990",
            "Ford,F-150,2025,Lariat,5.0L V8,10-Speed Automatic,4WD,17,24,400,410,5,52.8,13000,54990",
            "Ford,F-150,2025,Lightning,Electric,1-Speed Automatic,AWD,76,61,452,775,5,52.8,10000,59990",
            "Ford,Mustang,2025,EcoBoost,2.3L Turbo I4,10-Speed Automatic,RWD,22,32,315,350,4,13.5,0,32990",
            "Ford,Mustang,2025,GT,5.0L V8,6-Speed Manual,RWD,15,24,450,410,4,13.5,0,42990",
            "Chevrolet,Silverado,2025,Custom,2.7L Turbo I4,8-Speed Automatic,4WD,20,23,310,430,3,71.7,9600,41990",
            "Chevrolet,Silverado,2025,LTZ,5.3L V8,10-Speed Automatic,4WD,16,21,355,383,5,71.7,11000,55990",
            "Chevrolet,Equinox,2025,LS,1.5L Turbo I4,6-Speed Automatic,FWD,26,31,175,203,5,29.9,1500,27990",
            "Chevrolet,Equinox,2025,Premier,1.5L Turbo I4,6-Speed Automatic,AWD,24,30,175,203,5,29.9,1500,34990",
            "Chevrolet,Equinox EV,2025,LT,Electric,1-Speed Automatic,FWD,115,106,210,242,5,57.2,1500,43990",
            "BMW,3 Series,2025,330i,2.0L Turbo I4,8-Speed Automatic,RWD,26,36,255,295,5,17.0,0,45990",
            "BMW,3 Series,2025,M340i,3.0L Turbo I6,8-Speed Automatic,AWD,23,32,382,369,5,17.0,0,58990",
            "BMW,X5,2025,sDrive40i,3.0L Turbo I6,8-Speed Automatic,RWD,21,26,335,331,5,33.9,7200,65990",
            "BMW,X5,2025,M50i,4.4L Turbo V8,8-Speed Automatic,AWD,16,22,523,553,5,33.9,7200,87990",
            "Tesla,Model 3,2025,Standard Range,Electric,1-Speed Automatic,RWD,138,126,283,330,5,23.0,0,42990",
            "Tesla,Model 3,2025,Long Range,Electric,1-Speed Automatic,AWD,131,120,346,389,5,23.0,0,52990",
            "Tesla,Model Y,2025,Long Range,Electric,1-Speed Automatic,AWD,127,117,384,376,5,76.2,0,57990",
            "Tesla,Model Y,2025,Performance,Electric,1-Speed Automatic,AWD,115,106,456,497,5,76.2,0,62990"
        ]
        
        # Generate more examples by creating variations
        all_examples = examples.copy()
        
        makes = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Tesla", "Hyundai", "Kia", "Nissan", "Volkswagen", "Audi", "Mercedes-Benz", "Lexus", "Acura", "Subaru"]
        models = ["Sedan", "SUV", "Crossover", "Truck", "Coupe", "Convertible", "Hatchback", "Wagon", "Van"]
        engines = ["2.0L I4", "2.5L I4", "3.0L V6", "3.5L V6", "5.0L V8", "1.5L Turbo I4", "2.0L Turbo I4", "3.0L Turbo I6", "Electric", "2.0L I4 Hybrid"]
        transmissions = ["6-Speed Manual", "6-Speed Automatic", "8-Speed Automatic", "10-Speed Automatic", "CVT", "eCVT", "1-Speed Automatic", "9-Speed Automatic"]
        drivetrains = ["FWD", "RWD", "AWD", "4WD"]
        
        for i in range(70):  # Create 70 more examples to reach 100 total
            make = makes[i % len(makes)]
            model = f"{models[i % len(models)]}-{i+100}"
            year = 2025
            trim = f"Trim-{i % 5}"
            engine = engines[i % len(engines)]
            transmission = transmissions[i % len(transmissions)]
            drivetrain = drivetrains[i % len(drivetrains)]
            mpg_city = 15 + (i % 25)
            mpg_highway = mpg_city + 5 + (i % 10)
            horsepower = 150 + (i * 10) % 400
            torque = horsepower - 10 + (i % 50)
            seating = 5
            cargo_volume = 10 + (i % 70)
            towing_capacity = (i % 10) * 1000
            msrp = 25000 + (i * 1000) % 50000
            
            new_example = f"{make},{model},{year},{trim},{engine},{transmission},{drivetrain},{mpg_city},{mpg_highway},{horsepower},{torque},{seating},{cargo_volume},{towing_capacity},{msrp}"
            all_examples.append(new_example)
            
        # Write to file
        with open(output_path, 'w') as f:
            f.write(header + '\n')
            for example in all_examples:
                f.write(example + '\n')
                
    def _create_maintenance_procedures_dataset(self, output_path: str):
        """
        Create example maintenance procedures dataset
        
        Args:
            output_path: Path to save the dataset
        """
        examples = [
            {
                "procedure": "Oil Change",
                "vehicle_type": "Passenger Car",
                "description": "Replace engine oil and oil filter to maintain proper engine lubrication and performance.",
                "steps": [
                    "Position vehicle on lift or jack stands",
                    "Drain old oil by removing drain plug",
                    "Remove old oil filter",
                    "Install new oil filter with gasket lubricated",
                    "Replace drain plug with new washer if required",
                    "Add new oil to proper level",
                    "Start engine and check for leaks",
                    "Reset oil life monitor if equipped"
                ],
                "parts": ["Engine oil (5W-30, 0W-20, etc.)", "Oil filter", "Drain plug washer"],
                "tools": ["Oil filter wrench", "Drain pan", "Socket set", "Funnel"],
                "time_estimate": "30-45 minutes",
                "difficulty": "Easy",
                "interval": "5,000-10,000 miles or 6 months"
            },
            {
                "procedure": "Brake Pad Replacement",
                "vehicle_type": "Passenger Car",
                "description": "Replace worn brake pads to maintain proper braking performance and safety.",
                "steps": [
                    "Remove wheel",
                    "Remove caliper bolts and pivot caliper away",
                    "Remove old brake pads and hardware",
                    "Clean caliper bracket and apply brake grease to contact points",
                    "Install new hardware and brake pads",
                    "Compress caliper piston",
                    "Reinstall caliper and bolts",
                    "Reinstall wheel",
                    "Pump brake pedal to establish proper pad contact",
                    "Test drive to verify proper operation"
                ],
                "parts": ["Brake pads", "Brake hardware kit", "Brake grease"],
                "tools": ["Jack and stands", "Lug wrench", "Caliper tool", "C-clamp", "Socket set", "Brake cleaner"],
                "time_estimate": "1-2 hours per axle",
                "difficulty": "Intermediate",
                "interval": "30,000-70,000 miles or when pad thickness is less than 3mm"
            },
            {
                "procedure": "Timing Belt Replacement",
                "vehicle_type": "Passenger Car",
                "description": "Replace timing belt to prevent engine damage and maintain proper valve timing.",
                "steps": [
                    "Disconnect battery",
                    "Remove accessory belts",
                    "Remove timing belt covers",
                    "Set engine to TDC on #1 cylinder",
                    "Mark timing belt rotation direction",
                    "Loosen tensioner and remove old timing belt",
                    "Inspect water pump and replace if necessary",
                    "Install new timing belt following timing marks",
                    "Set proper tension according to specifications",
                    "Reinstall covers and accessory belts",
                    "Start engine and verify proper operation"
                ],
                "parts": ["Timing belt", "Tensioner", "Idler pulleys", "Water pump (recommended)", "Accessory belts (recommended)"],
                "tools": ["Socket set", "Torque wrench", "Timing alignment tools", "Belt tension gauge"],
                "time_estimate": "4-8 hours",
                "difficulty": "Advanced",
                "interval": "60,000-100,000 miles or 7-10 years"
            },
            {
                "procedure": "Transmission Fluid Change",
                "vehicle_type": "Passenger Car",
                "description": "Replace transmission fluid to maintain proper shifting and extend transmission life.",
                "steps": [
                    "Position vehicle on lift or jack stands",
                    "Locate transmission drain plug or pan",
                    "Place drain pan under transmission",
                    "Remove drain plug or pan bolts",
                    "Allow fluid to drain completely",
                    "Replace transmission filter if equipped",
                    "Clean pan and replace gasket if removed",
                    "Reinstall pan or drain plug",
                    "Add new fluid through fill tube or dipstick",
                    "Start engine and check for leaks",
                    "Check fluid level and adjust as needed"
                ],
                "parts": ["Transmission fluid (specific type)", "Transmission filter kit", "Pan gasket"],
                "tools": ["Socket set", "Drain pan", "Funnel", "Torque wrench"],
                "time_estimate": "1-3 hours",
                "difficulty": "Intermediate",
                "interval": "30,000-100,000 miles depending on vehicle and driving conditions"
            },
            {
                "procedure": "Spark Plug Replacement",
                "vehicle_type": "Passenger Car",
                "description": "Replace spark plugs to maintain proper engine performance, fuel economy, and emissions.",
                "steps": [
                    "Ensure engine is cool",
                    "Remove engine covers if necessary",
                    "Disconnect spark plug wire or coil",
                    "Clean area around spark plug",
                    "Remove old spark plug",
                    "Check gap on new spark plug and adjust if needed",
                    "Install new spark plug and torque to specification",
                    "Reconnect spark plug wire or coil",
                    "Repeat for remaining cylinders",
                    "Start engine and check for proper operation"
                ],
                "parts": ["Spark plugs (specific type)", "Dielectric grease"],
                "tools": ["Spark plug socket", "Ratchet", "Gap tool", "Torque wrench"],
                "time_estimate": "30-90 minutes",
                "difficulty": "Easy to Intermediate",
                "interval": "30,000-100,000 miles depending on plug type"
            },
            {
                "procedure": "Cabin Air Filter Replacement",
                "vehicle_type": "Passenger Car",
                "description": "Replace cabin air filter to maintain air quality inside the vehicle and proper HVAC operation.",
                "steps": [
                    "Locate cabin air filter (typically behind glove box or under dashboard)",
                    "Remove access panel or glove box",
                    "Remove old filter",
                    "Note airflow direction for new filter installation",
                    "Install new filter in correct orientation",
                    "Reinstall access panel or glove box"
                ],
                "parts": ["Cabin air filter"],
                "tools": ["Screwdriver (may not be needed)"],
                "time_estimate": "10-30 minutes",
                "difficulty": "Easy",
                "interval": "15,000-30,000 miles or annually"
            },
            {
                "procedure": "Battery Replacement",
                "vehicle_type": "Passenger Car",
                "description": "Replace vehicle battery to ensure reliable starting and electrical system operation.",
                "steps": [
                    "Ensure vehicle is off and key is removed",
                    "Identify battery location",
                    "Disconnect negative terminal first (black)",
                    "Disconnect positive terminal (red)",
                    "Remove battery hold-down bracket",
                    "Remove old battery",
                    "Clean battery tray if corroded",
                    "Install new battery",
                    "Secure with hold-down bracket",
                    "Connect positive terminal first, then negative",
                    "Apply anti-corrosion spray or pads",
                    "Test electrical system operation"
                ],
                "parts": ["Battery (correct group size and specifications)", "Anti-corrosion spray or pads"],
                "tools": ["Wrench or socket set", "Battery terminal cleaner", "Gloves"],
                "time_estimate": "30-45 minutes",
                "difficulty": "Easy",
                "interval": "3-5 years or when battery fails load test"
            },
            {
                "procedure": "Coolant Flush",
                "vehicle_type": "Passenger Car",
                "description": "Replace engine coolant to maintain proper cooling system function and prevent corrosion.",
                "steps": [
                    "Ensure engine is cool",
                    "Place drain pan under radiator",
                    "Open radiator drain valve or remove lower radiator hose",
                    "Drain old coolant",
                    "Close drain valve or reconnect hose",
                    "Add cooling system flush chemical if used",
                    "Fill with water, run engine to operating temperature",
                    "Drain again",
                    "Fill with correct coolant/water mixture",
                    "Bleed air from cooling system",
                    "Check for leaks",
                    "Test drive and verify proper temperature operation"
                ],
                "parts": ["Coolant (specific type)", "Distilled water"],
                "tools": ["Drain pan", "Funnel", "Cooling system pressure tester"],
                "time_estimate": "1-2 hours",
                "difficulty": "Intermediate",
                "interval": "2-5 years or 30,000-100,000 miles depending on coolant type"
            },
            {
                "procedure": "Serpentine Belt Replacement",
                "vehicle_type": "Passenger Car",
                "description": "Replace serpentine belt to maintain proper operation of engine accessories.",
                "steps": [
                    "Locate belt routing diagram",
                    "Identify belt tensioner",
                    "Release tension using appropriate tool",
                    "Remove old belt",
                    "Inspect pulleys for damage or misalignment",
                    "Route new belt according to diagram",
                    "Apply tension using tensioner",
                    "Verify belt is properly seated on all pulleys",
                    "Start engine and observe belt operation"
                ],
                "parts": ["Serpentine belt (correct length and width)"],
                "tools": ["Tensioner tool or socket wrench", "Belt routing diagram"],
                "time_estimate": "30-60 minutes",
                "difficulty": "Intermediate",
                "interval": "60,000-100,000 miles or when cracks/wear appear"
            },
            {
                "procedure": "Wheel Alignment",
                "vehicle_type": "Passenger Car",
                "description": "Adjust wheel alignment angles to ensure proper handling, tire wear, and fuel economy.",
                "steps": [
                    "Mount vehicle on alignment rack",
                    "Check tire pressure and condition",
                    "Install alignment sensors on wheels",
                    "Measure current alignment angles",
                    "Compare to manufacturer specifications",
                    "Adjust camber, caster, and toe as needed",
                    "Verify adjustments with final measurements",
                    "Road test to confirm proper handling"
                ],
                "parts": ["None (adjustment only)", "May require camber bolts if not adjustable"],
                "tools": ["Alignment machine", "Alignment rack", "Adjustment wrenches"],
                "time_estimate": "1-2 hours",
                "difficulty": "Professional",
                "interval": "When new tires are installed or every 2-3 years"
            }
        ]
        
        # Generate more examples by creating variations
        all_examples = examples.copy()
        
        vehicle_types = ["Passenger Car", "SUV", "Truck", "Hybrid", "Electric Vehicle", "Luxury Vehicle", "Sports Car", "Diesel"]
        difficulty_levels = ["Easy", "Intermediate", "Advanced", "Professional"]
        
        for i in range(90):  # Create 90 more examples to reach 100 total
            base_example = examples[i % len(examples)]
            new_example = base_example.copy()
            new_example["procedure"] = f"{base_example['procedure']} - Variation {i+1}"
            new_example["vehicle_type"] = vehicle_types[i % len(vehicle_types)]
            new_example["difficulty"] = difficulty_levels[i % len(difficulty_levels)]
            all_examples.append(new_example)
            
        # Write to file
        with open(output_path, 'w') as f:
            for example in all_examples:
                f.write(json.dumps(example) + '\n')
                
    def _create_sales_conversations_dataset(self, output_path: str):
        """
        Create example sales conversations dataset
        
        Args:
            output_path: Path to save the dataset
        """
        examples = [
            {
                "conversation_id": "SC001",
                "customer_type": "First-time buyer",
                "vehicle_interest": "Compact SUV",
                "conversation": [
                    {"role": "customer", "message": "Hi, I'm looking for a compact SUV with good fuel economy. This would be my first car purchase."},
                    {"role": "salesperson", "message": "Welcome! First-time car buying is exciting. For compact SUVs with good fuel economy, we have the RAV4 Hybrid getting about 40 MPG combined, the CR-V Hybrid at similar efficiency, and the Escape Hybrid. What's your budget range?"},
                    {"role": "customer", "message": "I'm hoping to stay under $35,000 if possible. Fuel economy is important since I have a long commute."},
                    {"role": "salesperson", "message": "Great, all three models I mentioned have versions under $35,000. The RAV4 Hybrid LE starts around $32,000, the CR-V Hybrid around $33,000, and the Escape Hybrid around $31,000. Would you like to see these models and maybe take one for a test drive?"},
                    {"role": "customer", "message": "Yes, I'd like to test drive the RAV4 Hybrid. Does it have Apple CarPlay?"},
                    {"role": "salesperson", "message": "Yes, the RAV4 Hybrid comes standard with both Apple CarPlay and Android Auto. It also includes Toyota Safety Sense with features like adaptive cruise control and lane keeping assist, which are great for long commutes. Let me grab the keys and we can take it for a drive."},
                    {"role": "customer", "message": "That sounds perfect. And what kind of financing options do you have for someone with good but not extensive credit history?"},
                    {"role": "salesperson", "message": "We have several options for first-time buyers with good credit. Toyota offers special rates for qualified first-time buyers, typically with APRs starting around 3.9% for 60 months. We can also check with several partner banks to find the best rate. Would you like to get pre-approved while we prepare the vehicle for a test drive?"},
                    {"role": "customer", "message": "Yes, that would be helpful. I'd like to know what my monthly payments might look like."},
                    {"role": "salesperson", "message": "Perfect. With about $3,000 down on a $32,000 RAV4 Hybrid with a 60-month term at around 3.9%, you'd be looking at approximately $550-575 per month. Let's get your information for pre-approval, and then we'll take that test drive."}
                ],
                "outcome": "Test drive scheduled, financing application submitted",
                "follow_up_actions": ["Complete test drive", "Review financing options", "Discuss extended warranty"]
            },
            {
                "conversation_id": "SC002",
                "customer_type": "Return customer",
                "vehicle_interest": "Luxury sedan",
                "conversation": [
                    {"role": "customer", "message": "Hi James, it's Michael again. My lease is ending on the 5-Series and I'm considering trying something different this time."},
                    {"role": "salesperson", "message": "Great to see you again, Michael! I remember you've enjoyed the 5-Series for the past three years. What kind of change are you considering?"},
                    {"role": "customer", "message": "I'm thinking about the new electric options. Maybe the i4 or i7? I'm curious about the range and charging situation."},
                    {"role": "salesperson", "message": "The electric models are excellent choices. The i4 offers up to 300 miles of range and starts around $56,000, while the i7 is more premium at $120,000+ with about 318 miles of range. Both qualify for the federal tax credit. For charging, we can install a Level 2 charger at your home, which adds about 30-40 miles of range per hour of charging."},
                    {"role": "customer", "message": "The i4 sounds more reasonable for my needs. How does the performance compare to my current 5-Series?"},
                    {"role": "salesperson", "message": "The i4 M50 variant actually outperforms your current 530i in acceleration, going 0-60 in about 3.7 seconds versus 5.8 seconds. The instant torque from the electric motors gives it impressive responsiveness. The handling is excellent too, with the battery pack lowering the center of gravity. Would you like to take one for a drive?"},
                    {"role": "customer", "message": "Definitely. And what about the technology features? I really like the driver assistance in my current car."},
                    {"role": "salesperson", "message": "You'll find all the features you currently enjoy plus several upgrades. The i4 includes the latest iDrive 8 system with a curved display combining a 12.3-inch instrument cluster and 14.9-inch infotainment screen. The driver assistance package includes hands-free driving capability on highways, remote parking, and enhanced navigation that plans routes with charging stops if needed."},
                    {"role": "customer", "message": "That sounds impressive. What about my lease return? I'm about 2,000 miles over the limit."},
                    {"role": "salesperson", "message": "As a returning customer, we can work with you on those excess miles. BMW is currently running a loyalty program that includes waiving up to 2,500 excess miles when you lease or purchase another BMW. Let's get you in that i4 for a test drive, and while you're out, I'll prepare some lease and purchase options for when you return."}
                ],
                "outcome": "Test drive completed, new lease signed",
                "follow_up_actions": ["Schedule home charger installation", "Set up BMW app for charging network", "Review electric vehicle tax incentives"]
            },
            {
                "conversation_id": "SC003",
                "customer_type": "Family buyer",
                "vehicle_interest": "Three-row SUV",
                "conversation": [
                    {"role": "customer", "message": "We're expecting our third child and need to upgrade from our current crossover to something with three rows."},
                    {"role": "salesperson", "message": "Congratulations on your growing family! Three-row SUVs are perfect for that transition. Are you looking for features like easy access to the third row, car seat compatibility, or specific cargo space requirements?"},
                    {"role": "customer", "message": "All of those are important. We'll have two car seats and a booster, and we take road trips frequently so cargo space is essential even with all seats occupied."},
                    {"role": "salesperson", "message": "Based on those needs, I'd recommend looking at the Highlander, Pilot, or Telluride. All three have LATCH systems in both the second and third rows, and the Telluride and Pilot have particularly good cargo space behind the third row at 21 cubic feet. The Highlander Hybrid might be worth considering for those road trips with its excellent fuel economy. Would you like to see how car seats fit in these models?"},
                    {"role": "customer", "message": "Yes, that would be helpful. We have our car seats in the car if we could try installing them. Safety features are our top priority."},
                    {"role": "salesperson", "message": "Perfect, we can definitely test your car seats. All three models have earned Top Safety Pick+ ratings from IIHS. They include automatic emergency braking, lane keeping systems, and blind spot monitoring. The Telluride and Pilot also offer rear occupant alerts to remind you to check the back seats before leaving the vehicle, which is great for families. Let's start with the Telluride since it has the most spacious second row."},
                    {"role": "customer", "message": "What about reliability? We plan to keep this vehicle for at least 8-10 years as our family car."},
                    {"role": "salesperson", "message": "For long-term reliability, all three have strong reputations. The Highlander has Toyota's excellent track record, with many models exceeding 200,000 miles with proper maintenance. The Telluride is newer but Kia's warranty is outstanding at 10 years/100,000 miles for the powertrain. The Pilot has Honda's reputation for longevity. Consumer Reports ranks all three above average for predicted reliability."},
                    {"role": "customer", "message": "And what are the price differences between these models with similar features?"},
                    {"role": "salesperson", "message": "For mid-level trims with leather, sunroof, and advanced safety features, the Highlander XLE is about $43,000, the Pilot EX-L around $42,000, and the Telluride EX approximately $41,000. The Highlander Hybrid would add about $1,500 to the Toyota's price. Would you like to start by installing your car seats in the Telluride, and then we can try the others for comparison?"}
                ],
                "outcome": "Vehicle purchased (Telluride)",
                "follow_up_actions": ["Schedule delivery", "Review owner's manual features", "Set up family profiles in vehicle"]
            }
        ]
        
        # Generate more examples by creating variations
        all_examples = examples.copy()
        
        customer_types = ["First-time buyer", "Return customer", "Family buyer", "Business customer", "Luxury buyer", "Budget-conscious", "Performance enthusiast", "Eco-conscious buyer"]
        vehicle_interests = ["Compact SUV", "Luxury sedan", "Three-row SUV", "Electric vehicle", "Pickup truck", "Sports car", "Hybrid sedan", "Minivan", "Compact car"]
        outcomes = ["Vehicle purchased", "Test drive scheduled", "Financing application submitted", "Customer still considering options", "Customer decided on different model", "Customer will return with spouse/partner"]
        
        for i in range(97):  # Create 97 more examples to reach 100 total
            base_example = examples[i % len(examples)]
            new_example = {
                "conversation_id": f"SC{i+4:03d}",
                "customer_type": customer_types[i % len(customer_types)],
                "vehicle_interest": vehicle_interests[i % len(vehicle_interests)],
                "conversation": [
                    {"role": "customer", "message": f"[Variation {i+1}] {base_example['conversation'][0]['message']}"},
                    {"role": "salesperson", "message": f"[Variation {i+1}] {base_example['conversation'][1]['message']}"},
                    {"role": "customer", "message": f"[Variation {i+1}] {base_example['conversation'][2]['message']}"},
                    {"role": "salesperson", "message": f"[Variation {i+1}] {base_example['conversation'][3]['message']}"}
                ],
                "outcome": outcomes[i % len(outcomes)],
                "follow_up_actions": [f"Action {i+1}", f"Action {i+2}", f"Action {i+3}"]
            }
            all_examples.append(new_example)
            
        # Write to file
        with open(output_path, 'w') as f:
            for example in all_examples:
                f.write(json.dumps(example) + '\n')
                
    def create_example_template(self, template_name: str, output_dir: Optional[str] = None) -> str:
        """
        Create an example template
        
        Args:
            template_name: Name of the template
            output_dir: Directory to save the template (defaults to kit templates directory)
            
        Returns:
            str: Path to the created template
        """
        # Find template configuration
        template_config = None
        for t in self.get_templates():
            if t["name"] == template_name:
                template_config = t
                break
                
        if not template_config:
            raise ValueError(f"Template not found: {template_name}")
            
        # Determine output directory
        if not output_dir:
            output_dir = self.templates_dir
            
        os.makedirs(output_dir, exist_ok=True)
        
        # Create example template
        output_path = os.path.join(output_dir, template_config["file"])
        
        if template_name == "dealership_operations":
            self._create_dealership_operations_template(output_path)
        elif template_name == "service_advisor":
            self._create_service_advisor_template(output_path)
        elif template_name == "sales_assistant":
            self._create_sales_assistant_template(output_path)
        elif template_name == "parts_inventory":
            self._create_parts_inventory_template(output_path)
        else:
            raise ValueError(f"No example generator for template: {template_name}")
            
        logger.info(f"Created example template at {output_path}")
        return output_path
        
    def _create_dealership_operations_template(self, output_path: str):
        """
        Create example dealership operations template
        
        Args:
            output_path: Path to save the template
        """
        template = {
            "metadata": {
                "name": "dealership_operations",
                "description": "Template for dealership management and operations",
                "category": "automotive",
                "version": "1.0.0"
            },
            "template": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "dealership_operations",
                "model": "${model}",
                "method": "${method}",
                "dataset": "${dataset}",
                "parameters": {
                    "epochs": "${epochs}",
                    "learning_rate": "${learning_rate}",
                    "batch_size": "${batch_size}",
                    "lora_r": "${lora_r}",
                    "lora_alpha": "${lora_alpha}",
                    "lora_dropout": "${lora_dropout}"
                },
                "evaluation": {
                    "metrics": ["${metrics}"],
                    "test_split": "${test_split}"
                },
                "output": {
                    "dir": "${output_dir}",
                    "format": "${output_format}"
                },
                "deployment": {
                    "endpoint_type": "${endpoint_type}",
                    "quantization": "${quantization}",
                    "instance_type": "${instance_type}",
                    "instance_count": "${instance_count}"
                }
            },
            "example": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "dealership_operations",
                "model": "mistral-7b",
                "method": "QLoRA",
                "dataset": "./datasets/dealership_qa.jsonl",
                "parameters": {
                    "epochs": 3,
                    "learning_rate": 2e-4,
                    "batch_size": 8,
                    "lora_r": 16,
                    "lora_alpha": 32,
                    "lora_dropout": 0.05
                },
                "evaluation": {
                    "metrics": ["accuracy", "f1"],
                    "test_split": 0.1
                },
                "output": {
                    "dir": "./checkpoints/mistral-dealership",
                    "format": "safetensors"
                },
                "deployment": {
                    "endpoint_type": "vllm",
                    "quantization": "int8",
                    "instance_type": "g4dn.xlarge",
                    "instance_count": 1
                }
            },
            "variables": [
                {
                    "name": "model",
                    "description": "Base model to fine-tune",
                    "type": "string",
                    "options": ["mistral-7b", "llama-7b", "llama-13b", "gpt-j-6b"]
                },
                {
                    "name": "method",
                    "description": "Fine-tuning method",
                    "type": "string",
                    "options": ["QLoRA", "LoRA"]
                },
                {
                    "name": "dataset",
                    "description": "Path to dataset",
                    "type": "string"
                },
                {
                    "name": "epochs",
                    "description": "Number of training epochs",
                    "type": "integer",
                    "default": 3,
                    "min": 1,
                    "max": 10
                },
                {
                    "name": "learning_rate",
                    "description": "Learning rate",
                    "type": "number",
                    "default": 2e-4
                },
                {
                    "name": "batch_size",
                    "description": "Batch size",
                    "type": "integer",
                    "default": 8,
                    "options": [1, 2, 4, 8, 16, 32]
                },
                {
                    "name": "lora_r",
                    "description": "LoRA r parameter",
                    "type": "integer",
                    "default": 16,
                    "options": [4, 8, 16, 32, 64]
                },
                {
                    "name": "lora_alpha",
                    "description": "LoRA alpha parameter",
                    "type": "integer",
                    "default": 32,
                    "options": [8, 16, 32, 64, 128]
                },
                {
                    "name": "lora_dropout",
                    "description": "LoRA dropout",
                    "type": "number",
                    "default": 0.05,
                    "min": 0,
                    "max": 0.5
                },
                {
                    "name": "metrics",
                    "description": "Evaluation metrics",
                    "type": "array",
                    "items": {
                        "type": "string",
                        "options": ["accuracy", "f1", "precision", "recall"]
                    }
                },
                {
                    "name": "test_split",
                    "description": "Test split ratio",
                    "type": "number",
                    "default": 0.1,
                    "min": 0.05,
                    "max": 0.3
                },
                {
                    "name": "output_dir",
                    "description": "Output directory for checkpoints",
                    "type": "string"
                },
                {
                    "name": "output_format",
                    "description": "Output format",
                    "type": "string",
                    "options": ["safetensors", "pytorch", "onnx"]
                },
                {
                    "name": "endpoint_type",
                    "description": "Inference endpoint type",
                    "type": "string",
                    "options": ["vllm", "triton", "tensorrt", "onnx"]
                },
                {
                    "name": "quantization",
                    "description": "Quantization method",
                    "type": "string",
                    "options": ["none", "int8", "int4"]
                },
                {
                    "name": "instance_type",
                    "description": "Instance type for deployment",
                    "type": "string",
                    "options": ["g4dn.xlarge", "g5.xlarge", "c5.2xlarge"]
                },
                {
                    "name": "instance_count",
                    "description": "Number of instances",
                    "type": "integer",
                    "default": 1,
                    "min": 1,
                    "max": 10
                }
            ]
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(template, f)
            
    def _create_service_advisor_template(self, output_path: str):
        """
        Create example service advisor template
        
        Args:
            output_path: Path to save the template
        """
        template = {
            "metadata": {
                "name": "service_advisor",
                "description": "Template for service department and maintenance advising",
                "category": "automotive",
                "version": "1.0.0"
            },
            "template": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "service_advisor",
                "model": "${model}",
                "method": "${method}",
                "dataset": "${dataset}",
                "parameters": {
                    "epochs": "${epochs}",
                    "learning_rate": "${learning_rate}",
                    "batch_size": "${batch_size}",
                    "lora_r": "${lora_r}",
                    "lora_alpha": "${lora_alpha}",
                    "lora_dropout": "${lora_dropout}"
                },
                "evaluation": {
                    "metrics": ["${metrics}"],
                    "test_split": "${test_split}"
                },
                "output": {
                    "dir": "${output_dir}",
                    "format": "${output_format}"
                },
                "deployment": {
                    "endpoint_type": "${endpoint_type}",
                    "quantization": "${quantization}",
                    "instance_type": "${instance_type}",
                    "instance_count": "${instance_count}"
                }
            },
            "example": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "service_advisor",
                "model": "mistral-7b",
                "method": "QLoRA",
                "dataset": "./datasets/maintenance_procedures.jsonl",
                "parameters": {
                    "epochs": 3,
                    "learning_rate": 2e-4,
                    "batch_size": 8,
                    "lora_r": 16,
                    "lora_alpha": 32,
                    "lora_dropout": 0.05
                },
                "evaluation": {
                    "metrics": ["accuracy", "f1"],
                    "test_split": 0.1
                },
                "output": {
                    "dir": "./checkpoints/mistral-service-advisor",
                    "format": "safetensors"
                },
                "deployment": {
                    "endpoint_type": "vllm",
                    "quantization": "int8",
                    "instance_type": "g4dn.xlarge",
                    "instance_count": 1
                }
            },
            "variables": [
                {
                    "name": "model",
                    "description": "Base model to fine-tune",
                    "type": "string",
                    "options": ["mistral-7b", "llama-7b", "llama-13b", "gpt-j-6b"]
                },
                {
                    "name": "method",
                    "description": "Fine-tuning method",
                    "type": "string",
                    "options": ["QLoRA", "LoRA"]
                },
                {
                    "name": "dataset",
                    "description": "Path to dataset",
                    "type": "string"
                },
                {
                    "name": "epochs",
                    "description": "Number of training epochs",
                    "type": "integer",
                    "default": 3,
                    "min": 1,
                    "max": 10
                },
                {
                    "name": "learning_rate",
                    "description": "Learning rate",
                    "type": "number",
                    "default": 2e-4
                },
                {
                    "name": "batch_size",
                    "description": "Batch size",
                    "type": "integer",
                    "default": 8,
                    "options": [1, 2, 4, 8, 16, 32]
                },
                {
                    "name": "lora_r",
                    "description": "LoRA r parameter",
                    "type": "integer",
                    "default": 16,
                    "options": [4, 8, 16, 32, 64]
                },
                {
                    "name": "lora_alpha",
                    "description": "LoRA alpha parameter",
                    "type": "integer",
                    "default": 32,
                    "options": [8, 16, 32, 64, 128]
                },
                {
                    "name": "lora_dropout",
                    "description": "LoRA dropout",
                    "type": "number",
                    "default": 0.05,
                    "min": 0,
                    "max": 0.5
                },
                {
                    "name": "metrics",
                    "description": "Evaluation metrics",
                    "type": "array",
                    "items": {
                        "type": "string",
                        "options": ["accuracy", "f1", "precision", "recall"]
                    }
                },
                {
                    "name": "test_split",
                    "description": "Test split ratio",
                    "type": "number",
                    "default": 0.1,
                    "min": 0.05,
                    "max": 0.3
                },
                {
                    "name": "output_dir",
                    "description": "Output directory for checkpoints",
                    "type": "string"
                },
                {
                    "name": "output_format",
                    "description": "Output format",
                    "type": "string",
                    "options": ["safetensors", "pytorch", "onnx"]
                },
                {
                    "name": "endpoint_type",
                    "description": "Inference endpoint type",
                    "type": "string",
                    "options": ["vllm", "triton", "tensorrt", "onnx"]
                },
                {
                    "name": "quantization",
                    "description": "Quantization method",
                    "type": "string",
                    "options": ["none", "int8", "int4"]
                },
                {
                    "name": "instance_type",
                    "description": "Instance type for deployment",
                    "type": "string",
                    "options": ["g4dn.xlarge", "g5.xlarge", "c5.2xlarge"]
                },
                {
                    "name": "instance_count",
                    "description": "Number of instances",
                    "type": "integer",
                    "default": 1,
                    "min": 1,
                    "max": 10
                }
            ]
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(template, f)
            
    def _create_sales_assistant_template(self, output_path: str):
        """
        Create example sales assistant template
        
        Args:
            output_path: Path to save the template
        """
        template = {
            "metadata": {
                "name": "sales_assistant",
                "description": "Template for sales and customer relationship",
                "category": "automotive",
                "version": "1.0.0"
            },
            "template": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "sales_assistant",
                "model": "${model}",
                "method": "${method}",
                "dataset": "${dataset}",
                "parameters": {
                    "epochs": "${epochs}",
                    "learning_rate": "${learning_rate}",
                    "batch_size": "${batch_size}",
                    "lora_r": "${lora_r}",
                    "lora_alpha": "${lora_alpha}",
                    "lora_dropout": "${lora_dropout}"
                },
                "evaluation": {
                    "metrics": ["${metrics}"],
                    "test_split": "${test_split}"
                },
                "output": {
                    "dir": "${output_dir}",
                    "format": "${output_format}"
                },
                "deployment": {
                    "endpoint_type": "${endpoint_type}",
                    "quantization": "${quantization}",
                    "instance_type": "${instance_type}",
                    "instance_count": "${instance_count}"
                }
            },
            "example": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "sales_assistant",
                "model": "mistral-7b",
                "method": "QLoRA",
                "dataset": "./datasets/sales_conversations.jsonl",
                "parameters": {
                    "epochs": 3,
                    "learning_rate": 2e-4,
                    "batch_size": 8,
                    "lora_r": 16,
                    "lora_alpha": 32,
                    "lora_dropout": 0.05
                },
                "evaluation": {
                    "metrics": ["accuracy", "f1"],
                    "test_split": 0.1
                },
                "output": {
                    "dir": "./checkpoints/mistral-sales-assistant",
                    "format": "safetensors"
                },
                "deployment": {
                    "endpoint_type": "vllm",
                    "quantization": "int8",
                    "instance_type": "g4dn.xlarge",
                    "instance_count": 1
                }
            },
            "variables": [
                {
                    "name": "model",
                    "description": "Base model to fine-tune",
                    "type": "string",
                    "options": ["mistral-7b", "llama-7b", "llama-13b", "gpt-j-6b"]
                },
                {
                    "name": "method",
                    "description": "Fine-tuning method",
                    "type": "string",
                    "options": ["QLoRA", "LoRA"]
                },
                {
                    "name": "dataset",
                    "description": "Path to dataset",
                    "type": "string"
                },
                {
                    "name": "epochs",
                    "description": "Number of training epochs",
                    "type": "integer",
                    "default": 3,
                    "min": 1,
                    "max": 10
                },
                {
                    "name": "learning_rate",
                    "description": "Learning rate",
                    "type": "number",
                    "default": 2e-4
                },
                {
                    "name": "batch_size",
                    "description": "Batch size",
                    "type": "integer",
                    "default": 8,
                    "options": [1, 2, 4, 8, 16, 32]
                },
                {
                    "name": "lora_r",
                    "description": "LoRA r parameter",
                    "type": "integer",
                    "default": 16,
                    "options": [4, 8, 16, 32, 64]
                },
                {
                    "name": "lora_alpha",
                    "description": "LoRA alpha parameter",
                    "type": "integer",
                    "default": 32,
                    "options": [8, 16, 32, 64, 128]
                },
                {
                    "name": "lora_dropout",
                    "description": "LoRA dropout",
                    "type": "number",
                    "default": 0.05,
                    "min": 0,
                    "max": 0.5
                },
                {
                    "name": "metrics",
                    "description": "Evaluation metrics",
                    "type": "array",
                    "items": {
                        "type": "string",
                        "options": ["accuracy", "f1", "precision", "recall"]
                    }
                },
                {
                    "name": "test_split",
                    "description": "Test split ratio",
                    "type": "number",
                    "default": 0.1,
                    "min": 0.05,
                    "max": 0.3
                },
                {
                    "name": "output_dir",
                    "description": "Output directory for checkpoints",
                    "type": "string"
                },
                {
                    "name": "output_format",
                    "description": "Output format",
                    "type": "string",
                    "options": ["safetensors", "pytorch", "onnx"]
                },
                {
                    "name": "endpoint_type",
                    "description": "Inference endpoint type",
                    "type": "string",
                    "options": ["vllm", "triton", "tensorrt", "onnx"]
                },
                {
                    "name": "quantization",
                    "description": "Quantization method",
                    "type": "string",
                    "options": ["none", "int8", "int4"]
                },
                {
                    "name": "instance_type",
                    "description": "Instance type for deployment",
                    "type": "string",
                    "options": ["g4dn.xlarge", "g5.xlarge", "c5.2xlarge"]
                },
                {
                    "name": "instance_count",
                    "description": "Number of instances",
                    "type": "integer",
                    "default": 1,
                    "min": 1,
                    "max": 10
                }
            ]
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(template, f)
            
    def _create_parts_inventory_template(self, output_path: str):
        """
        Create example parts inventory template
        
        Args:
            output_path: Path to save the template
        """
        template = {
            "metadata": {
                "name": "parts_inventory",
                "description": "Template for parts department and inventory management",
                "category": "automotive",
                "version": "1.0.0"
            },
            "template": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "parts_inventory",
                "model": "${model}",
                "method": "${method}",
                "dataset": "${dataset}",
                "parameters": {
                    "epochs": "${epochs}",
                    "learning_rate": "${learning_rate}",
                    "batch_size": "${batch_size}",
                    "lora_r": "${lora_r}",
                    "lora_alpha": "${lora_alpha}",
                    "lora_dropout": "${lora_dropout}"
                },
                "evaluation": {
                    "metrics": ["${metrics}"],
                    "test_split": "${test_split}"
                },
                "output": {
                    "dir": "${output_dir}",
                    "format": "${output_format}"
                },
                "deployment": {
                    "endpoint_type": "${endpoint_type}",
                    "quantization": "${quantization}",
                    "instance_type": "${instance_type}",
                    "instance_count": "${instance_count}"
                }
            },
            "example": {
                "task": "vertical-tune",
                "vertical": "automotive",
                "specialization": "parts_inventory",
                "model": "mistral-7b",
                "method": "QLoRA",
                "dataset": "./datasets/vehicle_specs.csv",
                "parameters": {
                    "epochs": 3,
                    "learning_rate": 2e-4,
                    "batch_size": 8,
                    "lora_r": 16,
                    "lora_alpha": 32,
                    "lora_dropout": 0.05
                },
                "evaluation": {
                    "metrics": ["accuracy", "f1"],
                    "test_split": 0.1
                },
                "output": {
                    "dir": "./checkpoints/mistral-parts-inventory",
                    "format": "safetensors"
                },
                "deployment": {
                    "endpoint_type": "vllm",
                    "quantization": "int8",
                    "instance_type": "g4dn.xlarge",
                    "instance_count": 1
                }
            },
            "variables": [
                {
                    "name": "model",
                    "description": "Base model to fine-tune",
                    "type": "string",
                    "options": ["mistral-7b", "llama-7b", "llama-13b", "gpt-j-6b"]
                },
                {
                    "name": "method",
                    "description": "Fine-tuning method",
                    "type": "string",
                    "options": ["QLoRA", "LoRA"]
                },
                {
                    "name": "dataset",
                    "description": "Path to dataset",
                    "type": "string"
                },
                {
                    "name": "epochs",
                    "description": "Number of training epochs",
                    "type": "integer",
                    "default": 3,
                    "min": 1,
                    "max": 10
                },
                {
                    "name": "learning_rate",
                    "description": "Learning rate",
                    "type": "number",
                    "default": 2e-4
                },
                {
                    "name": "batch_size",
                    "description": "Batch size",
                    "type": "integer",
                    "default": 8,
                    "options": [1, 2, 4, 8, 16, 32]
                },
                {
                    "name": "lora_r",
                    "description": "LoRA r parameter",
                    "type": "integer",
                    "default": 16,
                    "options": [4, 8, 16, 32, 64]
                },
                {
                    "name": "lora_alpha",
                    "description": "LoRA alpha parameter",
                    "type": "integer",
                    "default": 32,
                    "options": [8, 16, 32, 64, 128]
                },
                {
                    "name": "lora_dropout",
                    "description": "LoRA dropout",
                    "type": "number",
                    "default": 0.05,
                    "min": 0,
                    "max": 0.5
                },
                {
                    "name": "metrics",
                    "description": "Evaluation metrics",
                    "type": "array",
                    "items": {
                        "type": "string",
                        "options": ["accuracy", "f1", "precision", "recall"]
                    }
                },
                {
                    "name": "test_split",
                    "description": "Test split ratio",
                    "type": "number",
                    "default": 0.1,
                    "min": 0.05,
                    "max": 0.3
                },
                {
                    "name": "output_dir",
                    "description": "Output directory for checkpoints",
                    "type": "string"
                },
                {
                    "name": "output_format",
                    "description": "Output format",
                    "type": "string",
                    "options": ["safetensors", "pytorch", "onnx"]
                },
                {
                    "name": "endpoint_type",
                    "description": "Inference endpoint type",
                    "type": "string",
                    "options": ["vllm", "triton", "tensorrt", "onnx"]
                },
                {
                    "name": "quantization",
                    "description": "Quantization method",
                    "type": "string",
                    "options": ["none", "int8", "int4"]
                },
                {
                    "name": "instance_type",
                    "description": "Instance type for deployment",
                    "type": "string",
                    "options": ["g4dn.xlarge", "g5.xlarge", "c5.2xlarge"]
                },
                {
                    "name": "instance_count",
                    "description": "Number of instances",
                    "type": "integer",
                    "default": 1,
                    "min": 1,
                    "max": 10
                }
            ]
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(template, f)
            
    def create_relaycore_integration_spec(self, output_path: str):
        """
        Create RelayCore integration specification
        
        Args:
            output_path: Path to save the specification
        """
        spec = {
            "name": "RelayCore Integration",
            "version": "1.0.0",
            "description": "Integration specification for RelayCore platform",
            "components": [
                {
                    "name": "API Gateway",
                    "description": "Gateway for API communication between NeuroWeaver and RelayCore",
                    "endpoints": [
                        {
                            "path": "/api/v1/relaycore/models",
                            "method": "GET",
                            "description": "List available models for RelayCore integration",
                            "parameters": {},
                            "responses": {
                                "200": {
                                    "description": "List of available models",
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "model_id": {"type": "string"},
                                                "name": {"type": "string"},
                                                "description": {"type": "string"},
                                                "specializations": {"type": "array", "items": {"type": "string"}}
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "path": "/api/v1/relaycore/inference",
                            "method": "POST",
                            "description": "Perform inference using RelayCore integration",
                            "parameters": {
                                "model_id": {"type": "string", "required": True},
                                "prompt": {"type": "string", "required": True},
                                "max_tokens": {"type": "integer", "default": 1024},
                                "temperature": {"type": "number", "default": 0.7},
                                "context": {"type": "object"}
                            },
                            "responses": {
                                "200": {
                                    "description": "Inference result",
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "output": {"type": "string"},
                                            "model_used": {"type": "string"},
                                            "tokens_input": {"type": "integer"},
                                            "tokens_output": {"type": "integer"},
                                            "latency_ms": {"type": "number"}
                                        }
                                    }
                                }
                            }
                        },
                        {
                            "path": "/api/v1/relaycore/fine-tune",
                            "method": "POST",
                            "description": "Fine-tune a model using RelayCore data",
                            "parameters": {
                                "base_model": {"type": "string", "required": True},
                                "specialization": {"type": "string", "required": True},
                                "dataset_source": {"type": "string", "enum": ["relaycore", "neuroweaver", "combined"]},
                                "config": {"type": "object"}
                            },
                            "responses": {
                                "202": {
                                    "description": "Fine-tuning job started",
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "job_id": {"type": "string"},
                                            "status": {"type": "string"},
                                            "estimated_completion": {"type": "string", "format": "date-time"}
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "name": "Data Connector",
                    "description": "Connector for data exchange between NeuroWeaver and RelayCore",
                    "features": [
                        {
                            "name": "Data Import",
                            "description": "Import data from RelayCore to NeuroWeaver",
                            "parameters": {
                                "data_type": {"type": "string", "enum": ["conversations", "vehicle_specs", "service_records"]},
                                "date_range": {"type": "object"},
                                "filters": {"type": "object"}
                            }
                        },
                        {
                            "name": "Data Export",
                            "description": "Export data from NeuroWeaver to RelayCore",
                            "parameters": {
                                "data_type": {"type": "string", "enum": ["model_outputs", "analytics", "recommendations"]},
                                "format": {"type": "string", "enum": ["json", "csv", "parquet"]},
                                "destination": {"type": "string"}
                            }
                        },
                        {
                            "name": "Real-time Sync",
                            "description": "Synchronize data in real-time between NeuroWeaver and RelayCore",
                            "parameters": {
                                "sync_direction": {"type": "string", "enum": ["bidirectional", "to_relaycore", "from_relaycore"]},
                                "data_types": {"type": "array", "items": {"type": "string"}},
                                "sync_interval": {"type": "integer", "description": "Interval in seconds"}
                            }
                        }
                    ]
                },
                {
                    "name": "Authentication",
                    "description": "Authentication mechanisms for RelayCore integration",
                    "methods": [
                        {
                            "name": "OAuth2",
                            "description": "OAuth2 authentication for RelayCore API access",
                            "parameters": {
                                "client_id": {"type": "string"},
                                "client_secret": {"type": "string"},
                                "scope": {"type": "string"},
                                "redirect_uri": {"type": "string"}
                            }
                        },
                        {
                            "name": "API Key",
                            "description": "API key authentication for RelayCore API access",
                            "parameters": {
                                "api_key": {"type": "string"},
                                "api_secret": {"type": "string"}
                            }
                        },
                        {
                            "name": "SSO",
                            "description": "Single Sign-On integration with RelayCore",
                            "parameters": {
                                "sso_provider": {"type": "string"},
                                "sso_domain": {"type": "string"},
                                "sso_config": {"type": "object"}
                            }
                        }
                    ]
                }
            ],
            "data_models": [
                {
                    "name": "Vehicle",
                    "description": "Vehicle data model for RelayCore integration",
                    "properties": {
                        "vin": {"type": "string", "description": "Vehicle Identification Number"},
                        "make": {"type": "string"},
                        "model": {"type": "string"},
                        "year": {"type": "integer"},
                        "trim": {"type": "string"},
                        "engine": {"type": "string"},
                        "transmission": {"type": "string"},
                        "mileage": {"type": "integer"},
                        "service_history": {"type": "array", "items": {"$ref": "#/data_models/ServiceRecord"}}
                    }
                },
                {
                    "name": "ServiceRecord",
                    "description": "Service record data model for RelayCore integration",
                    "properties": {
                        "id": {"type": "string"},
                        "vehicle_id": {"type": "string"},
                        "service_date": {"type": "string", "format": "date"},
                        "mileage": {"type": "integer"},
                        "services_performed": {"type": "array", "items": {"type": "string"}},
                        "parts_used": {"type": "array", "items": {"type": "string"}},
                        "technician_notes": {"type": "string"},
                        "cost": {"type": "number"}
                    }
                },
                {
                    "name": "Customer",
                    "description": "Customer data model for RelayCore integration",
                    "properties": {
                        "id": {"type": "string"},
                        "first_name": {"type": "string"},
                        "last_name": {"type": "string"},
                        "email": {"type": "string"},
                        "phone": {"type": "string"},
                        "address": {"type": "object"},
                        "vehicles": {"type": "array", "items": {"$ref": "#/data_models/Vehicle"}},
                        "preferences": {"type": "object"}
                    }
                }
            ],
            "implementation_steps": [
                {
                    "step": 1,
                    "name": "API Configuration",
                    "description": "Configure API endpoints and authentication",
                    "tasks": [
                        "Set up OAuth2 client credentials",
                        "Configure API rate limits and quotas",
                        "Implement error handling and retry logic",
                        "Set up monitoring and logging"
                    ]
                },
                {
                    "step": 2,
                    "name": "Data Mapping",
                    "description": "Map data models between NeuroWeaver and RelayCore",
                    "tasks": [
                        "Define schema mappings for vehicle data",
                        "Define schema mappings for service records",
                        "Define schema mappings for customer data",
                        "Implement data transformation functions"
                    ]
                },
                {
                    "step": 3,
                    "name": "Integration Testing",
                    "description": "Test integration between NeuroWeaver and RelayCore",
                    "tasks": [
                        "Test API connectivity and authentication",
                        "Test data import and export",
                        "Test real-time synchronization",
                        "Validate data integrity and consistency"
                    ]
                },
                {
                    "step": 4,
                    "name": "Deployment",
                    "description": "Deploy RelayCore integration to production",
                    "tasks": [
                        "Set up production environment",
                        "Configure monitoring and alerting",
                        "Perform security review and penetration testing",
                        "Create documentation and user guides"
                    ]
                }
            ]
        }
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Write specification to file
        with open(output_path, 'w') as f:
            yaml.dump(spec, f)
            
        logger.info(f"Created RelayCore integration specification at {output_path}")
        return output_path


# Example usage
if __name__ == "__main__":
    # Initialize the Automotive Kit
    kit = AutomotiveKit()
    
    # Create example datasets
    for dataset_name in ["dealership_qa", "vehicle_specs", "maintenance_procedures", "sales_conversations"]:
        kit.create_example_dataset(dataset_name)
        
    # Create example templates
    for template_name in ["dealership_operations", "service_advisor", "sales_assistant", "parts_inventory"]:
        kit.create_example_template(template_name)
        
    # Create RelayCore integration specification
    kit.create_relaycore_integration_spec(os.path.join(kit.config_dir, "relaycore_integration.yaml"))
    
    # Print kit information
    print(f"Automotive Kit initialized at {kit.base_dir}")
    print(f"Available specializations: {kit.get_specializations()}")
    print(f"Available models: {len(kit.get_models())}")
    print(f"Available datasets: {len(kit.get_datasets())}")
    print(f"Available templates: {len(kit.get_templates())}")
    print(f"Available integrations: {len(kit.get_integrations())}")