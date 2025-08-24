"""Playwright web scraping and automation service."""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

from playwright.async_api import async_playwright

from app.config.settings import get_settings
from app.services.storage_service import get_storage_service


class PlaywrightService:
    """Playwright web scraping and automation service."""

    def __init__(self):
        """Initialize Playwright service."""
        settings = get_settings()
        self.headless = getattr(settings, "PLAYWRIGHT_HEADLESS", True)
        self.timeout = getattr(settings, "PLAYWRIGHT_TIMEOUT", 30000)
        self.storage = get_storage_service()
        self.browser = None

    async def start_browser(self, browser_type: str = "chromium"):
        """Start browser instance."""
        if not self.browser:
            playwright = await async_playwright().start()
            if browser_type == "chromium":
                self.browser = await playwright.chromium.launch(headless=self.headless)
            elif browser_type == "firefox":
                self.browser = await playwright.firefox.launch(headless=self.headless)
            elif browser_type == "webkit":
                self.browser = await playwright.webkit.launch(headless=self.headless)
        return self.browser

    async def close_browser(self):
        """Close browser instance."""
        if self.browser:
            await self.browser.close()
            self.browser = None

    async def scrape_page(
        self,
        url: str,
        selectors: Optional[Dict[str, str]] = None,
        wait_for: Optional[str] = None,
        screenshot: bool = False,
    ) -> Dict[str, Any]:
        """Scrape data from a web page."""
        try:
            browser = await self.start_browser()
            page = await browser.new_page()

            # Navigate to page
            await page.goto(url, timeout=self.timeout)

            # Wait for specific element if specified
            if wait_for:
                await page.wait_for_selector(wait_for, timeout=self.timeout)

            # Extract data using selectors
            scraped_data = {}
            if selectors:
                for key, selector in selectors.items():
                    try:
                        elements = await page.query_selector_all(selector)
                        if len(elements) == 1:
                            scraped_data[key] = await elements[0].text_content()
                        else:
                            scraped_data[key] = [
                                await elem.text_content() for elem in elements
                            ]
                    except Exception as e:
                        scraped_data[key] = f"Error: {str(e)}"

            # Get page content
            page_content = await page.content()
            page_title = await page.title()

            # Take screenshot if requested
            screenshot_path = None
            if screenshot:
                screenshot_data = await page.screenshot()
                screenshot_path = self.storage.upload_file(
                    "screenshots",
                    f"screenshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png",
                    screenshot_data,
                    "image/png",
                )

            await page.close()

            return {
                "url": url,
                "title": page_title,
                "scraped_data": scraped_data,
                "page_content": page_content[:5000],  # Limit content size
                "screenshot_path": screenshot_path,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success",
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    async def scrape_multiple_pages(
        self,
        urls: List[str],
        selectors: Optional[Dict[str, str]] = None,
        concurrent_limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Scrape multiple pages concurrently."""
        semaphore = asyncio.Semaphore(concurrent_limit)

        async def scrape_with_semaphore(url):
            async with semaphore:
                return await self.scrape_page(url, selectors)

        tasks = [scrape_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return [
            (
                result
                if not isinstance(result, Exception)
                else {"error": str(result), "url": urls[i]}
            )
            for i, result in enumerate(results)
        ]

    async def fill_form(
        self,
        url: str,
        form_data: Dict[str, str],
        submit_selector: str = "input[type='submit']",
        wait_after_submit: int = 3000,
    ) -> Dict[str, Any]:
        """Fill and submit a form."""
        try:
            browser = await self.start_browser()
            page = await browser.new_page()

            await page.goto(url, timeout=self.timeout)

            # Fill form fields
            for field_selector, value in form_data.items():
                await page.fill(field_selector, value)

            # Submit form
            await page.click(submit_selector)

            # Wait for response
            await page.wait_for_timeout(wait_after_submit)

            # Get result page
            result_url = page.url
            result_content = await page.content()

            await page.close()

            return {
                "original_url": url,
                "result_url": result_url,
                "form_data": form_data,
                "result_content": result_content[:2000],
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success",
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    async def monitor_page_changes(
        self, url: str, selector: str, check_interval: int = 60, max_checks: int = 10
    ) -> Dict[str, Any]:
        """Monitor page for changes."""
        try:
            browser = await self.start_browser()
            page = await browser.new_page()

            await page.goto(url, timeout=self.timeout)

            changes = []
            previous_content = None

            for check in range(max_checks):
                try:
                    element = await page.query_selector(selector)
                    current_content = await element.text_content() if element else None

                    if (
                        previous_content is not None
                        and current_content != previous_content
                    ):
                        changes.append(
                            {
                                "check_number": check + 1,
                                "timestamp": datetime.utcnow().isoformat(),
                                "previous_content": previous_content,
                                "current_content": current_content,
                            }
                        )

                    previous_content = current_content

                    if check < max_checks - 1:
                        await page.wait_for_timeout(check_interval * 1000)
                        await page.reload()

                except Exception as e:
                    changes.append(
                        {
                            "check_number": check + 1,
                            "error": str(e),
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )

            await page.close()

            return {
                "url": url,
                "selector": selector,
                "total_checks": max_checks,
                "changes_detected": len(changes),
                "changes": changes,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e), "url": url}

    async def extract_links(
        self,
        url: str,
        link_selector: str = "a[href]",
        filter_domain: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Extract all links from a page."""
        try:
            browser = await self.start_browser()
            page = await browser.new_page()

            await page.goto(url, timeout=self.timeout)

            # Get all links
            links = await page.evaluate(
                f"""
                Array.from(document.querySelectorAll('{link_selector}')).map(link => ({{
                    href: link.href,
                    text: link.textContent.trim(),
                    title: link.title || ''
                }}))
            """
            )

            # Filter by domain if specified
            if filter_domain:
                links = [link for link in links if filter_domain in link["href"]]

            await page.close()

            return {
                "url": url,
                "total_links": len(links),
                "links": links,
                "filter_domain": filter_domain,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e), "url": url}


# Global Playwright service instance
_playwright_service: Optional[PlaywrightService] = None


def get_playwright_service() -> PlaywrightService:
    """Get global Playwright service instance."""
    global _playwright_service
    if _playwright_service is None:
        _playwright_service = PlaywrightService()
    return _playwright_service
