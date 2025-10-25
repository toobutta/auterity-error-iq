"""Puppeteer browser automation service."""

from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

from app.config.settings import get_settings
from app.services.storage_service import get_storage_service


class PuppeteerService:
    """Puppeteer browser automation service via Browserless."""

    def __init__(self):
        """Initialize Puppeteer service."""
        settings = get_settings()
        self.browserless_url = getattr(
            settings, "BROWSERLESS_URL", "http://puppeteer:3000"
        )
        self.timeout = getattr(settings, "PUPPETEER_TIMEOUT", 30000)
        self.storage = get_storage_service()

    def generate_pdf(
        self, url: str, options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate PDF from URL."""
        try:
            pdf_options = {
                "format": "A4",
                "printBackground": True,
                "margin": {
                    "top": "1cm",
                    "right": "1cm",
                    "bottom": "1cm",
                    "left": "1cm",
                },
            }

            if options:
                pdf_options.update(options)

            payload = {"url": url, "options": pdf_options}

            response = requests.post(
                f"{self.browserless_url}/pdf",
                json=payload,
                timeout=self.timeout / 1000,
            )

            if response.status_code == 200:
                # Store PDF
                pdf_path = self.storage.upload_file(
                    "generated-pdfs",
                    f"pdf_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf",
                    response.content,
                    "application/pdf",
                )

                return {
                    "url": url,
                    "pdf_path": pdf_path,
                    "pdf_size": len(response.content),
                    "options": pdf_options,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                }
            else:
                return {
                    "error": f"PDF generation failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def take_screenshot(
        self, url: str, options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Take screenshot of webpage."""
        try:
            screenshot_options = {"fullPage": True, "type": "png"}

            if options:
                screenshot_options.update(options)

            payload = {"url": url, "options": screenshot_options}

            response = requests.post(
                f"{self.browserless_url}/screenshot",
                json=payload,
                timeout=self.timeout / 1000,
            )

            if response.status_code == 200:
                # Store screenshot
                screenshot_path = self.storage.upload_file(
                    "screenshots",
                    f"screenshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png",
                    response.content,
                    "image/png",
                )

                return {
                    "url": url,
                    "screenshot_path": screenshot_path,
                    "screenshot_size": len(response.content),
                    "options": screenshot_options,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                }
            else:
                return {
                    "error": f"Screenshot failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def scrape_content(
        self,
        url: str,
        selector: Optional[str] = None,
        wait_for: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Scrape content from webpage."""
        try:
            script = f"""
            const page = await browser.newPage();
            await page.goto('{url}', {{ waitUntil: 'networkidle2' }});

            {f"await page.waitForSelector('{wait_for}');" if wait_for else ""}

            const title = await page.title();
            \
              \
                      const content = {f"await page.$eval('{selector}', el => el.textContent)" if selector else "await page.content()"};

            await page.close();

            return {{ title, content }};
            """

            payload = {"code": script, "context": {"url": url}}

            response = requests.post(
                f"{self.browserless_url}/function",
                json=payload,
                timeout=self.timeout / 1000,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "url": url,
                    "title": result.get("title"),
                    "content": result.get("content"),
                    "selector": selector,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                }
            else:
                return {
                    "error": f"Scraping failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def execute_script(
        self, script: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute custom Puppeteer script."""
        try:
            payload = {"code": script, "context": context or {}}

            response = requests.post(
                f"{self.browserless_url}/function",
                json=payload,
                timeout=self.timeout / 1000,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "result": result,
                    "context": context,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                }
            else:
                return {
                    "error": f"Script execution failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def performance_metrics(self, url: str) -> Dict[str, Any]:
        """Get page performance metrics."""
        try:
            script = f"""
            const page = await browser.newPage();
            await page.goto('{url}', {{ waitUntil: 'networkidle2' }});

            const metrics = await page.metrics();
            const performanceEntries = await page.evaluate(() =>
                JSON.stringify(performance.getEntriesByType('navigation'))
            );

            await page.close();

            return {{ metrics, performanceEntries: JSON.parse(performanceEntries) }};
            """

            payload = {"code": script}

            response = requests.post(
                f"{self.browserless_url}/function",
                json=payload,
                timeout=self.timeout / 1000,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "url": url,
                    "metrics": result.get("metrics"),
                    "performance_entries": result.get("performanceEntries"),
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                }
            else:
                return {
                    "error": f"Performance metrics failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def bulk_screenshots(
        self, urls: List[str], options: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Take screenshots of multiple URLs."""
        results = []

        for url in urls:
            result = self.take_screenshot(url, options)
            results.append(result)

        return results

    def html_to_pdf(
        self, html_content: str, options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Convert HTML content to PDF."""
        try:
            pdf_options = {"format": "A4", "printBackground": True}

            if options:
                pdf_options.update(options)

            payload = {"html": html_content, "options": pdf_options}

            response = requests.post(
                f"{self.browserless_url}/pdf",
                json=payload,
                timeout=self.timeout / 1000,
            )

            if response.status_code == 200:
                # Store PDF
                pdf_path = self.storage.upload_file(
                    "generated-pdfs",
                    f"html_pdf_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf",
                    response.content,
                    "application/pdf",
                )

                return {
                    "html_length": len(html_content),
                    "pdf_path": pdf_path,
                    "pdf_size": len(response.content),
                    "options": pdf_options,
                    "timestamp": datetime.utcnow().isoformat(),
                    "status": "success",
                }
            else:
                return {
                    "error": f"HTML to PDF failed: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}


# Global Puppeteer service instance
_puppeteer_service: Optional[PuppeteerService] = None


def get_puppeteer_service() -> PuppeteerService:
    """Get global Puppeteer service instance."""
    global _puppeteer_service
    if _puppeteer_service is None:
        _puppeteer_service = PuppeteerService()
    return _puppeteer_service
