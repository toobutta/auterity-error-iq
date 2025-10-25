"""Document AI service for intelligent document processing."""

import io
import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import fitz  # PyMuPDF
import openai
import pytesseract
from PIL import Image

from app.config.settings import get_settings
from app.services.storage_service import get_storage_service


class DocumentAIService:
    """Document AI service for OCR, extraction, and analysis."""

    def __init__(self):
        """Initialize Document AI service."""
        settings = get_settings()
        self.openai_api_key = getattr(settings, "OPENAI_API_KEY", "")
        self.storage = get_storage_service()

        if self.openai_api_key:
            openai.api_key = self.openai_api_key

    def extract_text_from_image(
        self, image_data: bytes, language: str = "eng"
    ) -> Dict[str, Any]:
        """Extract text from image using OCR."""
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))

            # Perform OCR
            extracted_text = pytesseract.image_to_string(image, lang=language)

            # Get detailed data with confidence scores
            ocr_data = pytesseract.image_to_data(
                image, output_type=pytesseract.Output.DICT
            )

            # Calculate average confidence
            confidences = [
                int(conf) for conf in ocr_data["conf"] if int(conf) > 0
            ]
            avg_confidence = (
                sum(confidences) / len(confidences) if confidences else 0
            )

            return {
                "text": extracted_text.strip(),
                "confidence": avg_confidence,
                "word_count": len(extracted_text.split()),
                "language": language,
                "timestamp": datetime.utcnow().isoformat(),
                "ocr_data": ocr_data,
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_text_from_pdf(self, pdf_data: bytes) -> Dict[str, Any]:
        """Extract text from PDF document."""
        try:
            # Open PDF from bytes
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")

            extracted_text = ""
            page_texts = []

            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                page_text = page.get_text()
                page_texts.append(
                    {
                        "page": page_num + 1,
                        "text": page_text,
                        "word_count": len(page_text.split()),
                    }
                )
                extracted_text += page_text + "\n"

            pdf_document.close()

            return {
                "text": extracted_text.strip(),
                "page_count": len(page_texts),
                "pages": page_texts,
                "total_word_count": len(extracted_text.split()),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_structured_data(
        self, text: str, document_type: str = "general"
    ) -> Dict[str, Any]:
        """Extract structured data from text using AI."""
        if not self.openai_api_key:
            return {"error": "OpenAI API key not configured"}

        try:
            # Define extraction prompts based on document type
            prompts = {
                "invoice": """
                Extract the following information from this invoice text:
                - Invoice number
                - Date
                - Vendor name
                - Total amount
                - Line items with descriptions and amounts
                - Tax amount
                Return as JSON format.
                """,
                "contract": """
                Extract the following information from this contract text:
                - Contract parties
                - Contract date
                - Contract value
                - Key terms and conditions
                - Expiration date
                Return as JSON format.
                """,
                "resume": """
                Extract the following information from this resume text:
                - Name
                - Contact information
                - Work experience
                - Education
                - Skills
                Return as JSON format.
                """,
                "general": """
                Extract key information from this document text and \
                    structure it as JSON.
                Include entities like names, dates, amounts, addresses, and key facts.
                """,
            }

            prompt = prompts.get(document_type, prompts["general"])

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": prompt},
                    {
                        "role": "user",
                        "content": text[:4000],
                    },  # Limit text length
                ],
                temperature=0.1,
            )

            extracted_data = response.choices[0].message.content

            # Try to parse as JSON
            try:
                structured_data = json.loads(extracted_data)
            except json.JSONDecodeError:
                structured_data = {"raw_extraction": extracted_data}

            return {
                "document_type": document_type,
                "structured_data": structured_data,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def classify_document(self, text: str) -> Dict[str, Any]:
        """Classify document type using AI."""
        if not self.openai_api_key:
            return {"error": "OpenAI API key not configured"}

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """
                        Classify this document into one of these categories:
                        - invoice
                        - contract
                        - resume
                        - legal_document
                        - financial_statement
                        - report
                        - email
                        - other

                        Return only the category name and \
                            confidence score (0-1) as JSON:
                        {"category": "invoice", "confidence": 0.95}
                        """,
                    },
                    {"role": "user", "content": text[:2000]},
                ],
                temperature=0.1,
            )

            result = response.choices[0].message.content
            classification = json.loads(result)

            return {
                "classification": classification,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def process_document_file(
        self,
        file_data: bytes,
        filename: str,
        document_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Process document file with full AI pipeline."""
        try:
            # Determine file type
            file_extension = filename.lower().split(".")[-1]

            # Extract text based on file type
            if file_extension in ["jpg", "jpeg", "png", "bmp", "tiff"]:
                extraction_result = self.extract_text_from_image(file_data)
            elif file_extension == "pdf":
                extraction_result = self.extract_text_from_pdf(file_data)
            else:
                return {"error": f"Unsupported file type: {file_extension}"}

            if "error" in extraction_result:
                return extraction_result

            extracted_text = extraction_result["text"]

            # Classify document if type not provided
            if not document_type:
                classification_result = self.classify_document(extracted_text)
                if "error" not in classification_result:
                    document_type = classification_result["classification"][
                        "category"
                    ]

            # Extract structured data
            structured_result = self.extract_structured_data(
                extracted_text, document_type or "general"
            )

            # Store processed document
            document_id = f"doc_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            storage_path = self.storage.upload_text(
                "processed-documents",
                f"{document_id}/extracted_text.txt",
                extracted_text,
            )

            return {
                "document_id": document_id,
                "filename": filename,
                "file_type": file_extension,
                "document_type": document_type,
                "extraction_result": extraction_result,
                "structured_data": structured_result.get(
                    "structured_data", {}
                ),
                "storage_path": storage_path,
                "processing_timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_entities(
        self, text: str, entity_types: List[str] = None
    ) -> Dict[str, Any]:
        """Extract specific entities from text."""
        if entity_types is None:
            entity_types = [
                "person",
                "organization",
                "location",
                "date",
                "money",
                "email",
                "phone",
            ]

        entities = {}

        # Email extraction
        if "email" in entity_types:
            email_pattern = (
                r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
            )
            entities["emails"] = re.findall(email_pattern, text)

        # Phone extraction
        if "phone" in entity_types:
            phone_pattern = r"(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})"
            entities["phones"] = re.findall(phone_pattern, text)

        # Date extraction (basic)
        if "date" in entity_types:
            date_pattern = r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b"
            entities["dates"] = re.findall(date_pattern, text)

        # Money extraction
        if "money" in entity_types:
            money_pattern = r"\$[\d,]+\.?\d*|\b\d+\.\d{2}\s*(USD|dollars?)\b"
            entities["money"] = re.findall(money_pattern, text)

        return {
            "entities": entities,
            "entity_count": sum(
                len(v) if isinstance(v, list) else 1 for v in entities.values()
            ),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def summarize_document(
        self, text: str, max_length: int = 200
    ) -> Dict[str, Any]:
        """Generate document summary using AI."""
        if not self.openai_api_key:
            return {"error": "OpenAI API key not configured"}

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"Summarize this document in {max_length} words or less. Focus on key points and \
                            \
                            main information.",
                    },
                    {"role": "user", "content": text[:4000]},
                ],
                temperature=0.3,
            )

            summary = response.choices[0].message.content

            return {
                "summary": summary,
                "original_length": len(text.split()),
                "summary_length": len(summary.split()),
                "compression_ratio": len(summary.split()) / len(text.split()),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}


# Global Document AI service instance
_document_ai_service: Optional[DocumentAIService] = None


def get_document_ai_service() -> DocumentAIService:
    """Get global Document AI service instance."""
    global _document_ai_service
    if _document_ai_service is None:
        _document_ai_service = DocumentAIService()
    return _document_ai_service
