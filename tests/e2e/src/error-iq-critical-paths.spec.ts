import { test, expect } from "@playwright/test";

/**
 * Critical Path E2E Tests for Auterity Error-IQ
 * These tests cover the core user workflows for error monitoring and triage
 */

test.describe("Error Monitoring Dashboard - Critical Paths", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and wait for initial load
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="kpi-header"]');
  });

  test.describe("KPI Header & Real-time Updates", () => {
    test("should display key metrics with proper formatting", async ({
      page,
    }) => {
      // Check that all KPI cards are present
      const kpiCards = page.locator('[data-testid="kpi-card"]');
      await expect(kpiCards).toHaveCount(4);

      // Verify metric formatting (numbers with K/M suffixes)
      const errorCountCard = page.locator(
        '[data-testid="kpi-card-error-count"]',
      );
      const errorCountValue = errorCountCard.locator(
        '[data-testid="metric-value"]',
      );
      await expect(errorCountValue).toContainText(/^\d+(\.\d+)?[KM]?$/);

      // Check trend indicators are present
      const trendIndicator = errorCountCard.locator(
        '[data-testid="trend-indicator"]',
      );
      await expect(trendIndicator).toBeVisible();
    });

    test("should refresh metrics when refresh button is clicked", async ({
      page,
    }) => {
      const refreshButton = page.locator('[data-testid="refresh-metrics-btn"]');

      // Get initial timestamp
      const initialTimestamp = await page
        .locator('[data-testid="last-updated"]')
        .textContent();

      // Click refresh and verify loading state
      await refreshButton.click();
      await expect(refreshButton).toBeDisabled();
      await expect(
        page.locator('[data-testid="refresh-spinner"]'),
      ).toBeVisible();

      // Wait for refresh to complete
      await expect(refreshButton).toBeEnabled({ timeout: 5000 });

      // Verify timestamp updated
      const newTimestamp = await page
        .locator('[data-testid="last-updated"]')
        .textContent();
      expect(newTimestamp).not.toBe(initialTimestamp);
    });

    test("should show severity-appropriate colors for critical issues", async ({
      page,
    }) => {
      const criticalCard = page.locator(
        '[data-testid="kpi-card-critical-errors"]',
      );
      await expect(criticalCard).toHaveClass(/border-l-red-500/);

      const severityBadge = criticalCard.locator(
        '[data-testid="severity-badge"]',
      );
      await expect(severityBadge).toHaveClass(/bg-red-100.*text-red-800/);
    });
  });

  test.describe("Issue List & Filtering", () => {
    test("should display paginated list of issues", async ({ page }) => {
      await page.goto("/issues");

      // Wait for issues to load
      await page.waitForSelector('[data-testid="issue-list"]');

      // Check that issues are displayed
      const issueRows = page.locator('[data-testid="issue-row"]');
      await expect(issueRows).toHaveCount.greaterThan(0);

      // Verify essential issue information is shown
      const firstIssue = issueRows.first();
      await expect(
        firstIssue.locator('[data-testid="issue-title"]'),
      ).toBeVisible();
      await expect(
        firstIssue.locator('[data-testid="severity-badge"]'),
      ).toBeVisible();
      await expect(
        firstIssue.locator('[data-testid="status-badge"]'),
      ).toBeVisible();
    });

    test("should filter issues by severity", async ({ page }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Get initial issue count
      const initialCount = await page
        .locator('[data-testid="issue-count"]')
        .textContent();

      // Apply critical severity filter
      await page.selectOption('[data-testid="severity-filter"]', "critical");

      // Wait for filter to apply
      await page.waitForFunction(() => {
        const countElement = document.querySelector(
          '[data-testid="issue-count"]',
        );
        return countElement && countElement.textContent !== initialCount;
      });

      // Verify only critical issues are shown
      const visibleSeverityBadges = page.locator(
        '[data-testid="severity-badge"]:visible',
      );
      const severityTexts = await visibleSeverityBadges.allTextContents();
      expect(
        severityTexts.every((text) => text.toLowerCase().includes("critical")),
      ).toBe(true);
    });

    test("should search issues by title/description", async ({ page }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Enter search term
      const searchInput = page.locator('[data-testid="search-issues"]');
      await searchInput.fill("database timeout");

      // Wait for search results
      await page.waitForTimeout(500); // Debounce delay

      // Verify search results contain the term
      const issueRows = page.locator('[data-testid="issue-row"]:visible');
      const issueTitles = await issueRows
        .locator('[data-testid="issue-title"]')
        .allTextContents();
      expect(
        issueTitles.some(
          (title) =>
            title.toLowerCase().includes("database") ||
            title.toLowerCase().includes("timeout"),
        ),
      ).toBe(true);
    });

    test("should handle empty search results gracefully", async ({ page }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Search for non-existent term
      await page.fill('[data-testid="search-issues"]', "nonexistentissue12345");
      await page.waitForTimeout(500);

      // Verify empty state is shown
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="empty-state-message"]'),
      ).toContainText("No issues found");
    });

    test("should support bulk actions for issue management", async ({
      page,
    }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Select multiple issues
      const checkboxes = page.locator('[data-testid="issue-checkbox"]');
      await checkboxes.first().check();
      await checkboxes.nth(1).check();

      // Verify bulk actions toolbar appears
      await expect(
        page.locator('[data-testid="bulk-actions-toolbar"]'),
      ).toBeVisible();

      // Test bulk status change
      await page.click('[data-testid="bulk-action-status"]');
      await page.selectOption(
        '[data-testid="bulk-status-select"]',
        "investigating",
      );
      await page.click('[data-testid="apply-bulk-action"]');

      // Verify success notification
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    });
  });

  test.describe("Issue Detail View", () => {
    test("should navigate to issue detail from list", async ({ page }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Click on first issue
      const firstIssue = page.locator('[data-testid="issue-row"]').first();
      const issueTitle = await firstIssue
        .locator('[data-testid="issue-title"]')
        .textContent();

      await firstIssue.click();

      // Verify navigation to detail page
      await expect(page).toHaveURL(/\/issues\/[^\/]+$/);
      await expect(
        page.locator('[data-testid="issue-detail-title"]'),
      ).toContainText(issueTitle);
    });

    test("should display comprehensive issue information", async ({ page }) => {
      // Navigate directly to an issue detail page
      await page.goto("/issues/test-issue-123");
      await page.waitForSelector('[data-testid="issue-detail"]');

      // Verify all essential sections are present
      await expect(
        page.locator('[data-testid="issue-overview"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="impact-metrics"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="issue-timeline"]'),
      ).toBeVisible();
      await expect(page.locator('[data-testid="stack-trace"]')).toBeVisible();

      // Check impact metrics are properly formatted
      const affectedUsers = page.locator(
        '[data-testid="affected-users-count"]',
      );
      await expect(affectedUsers).toContainText(/^\d+(\.\d+)?[KM]?\s+users?$/);
    });

    test("should allow status changes with proper workflow", async ({
      page,
    }) => {
      await page.goto("/issues/test-issue-123");
      await page.waitForSelector('[data-testid="issue-detail"]');

      // Change status from open to investigating
      const statusSelect = page.locator('[data-testid="status-select"]');
      await statusSelect.selectOption("investigating");

      // Verify optimistic update
      await expect(statusSelect).toHaveValue("investigating");

      // Verify timeline event was created
      await expect(
        page.locator('[data-testid="timeline-event"]').first(),
      ).toContainText("Status changed to investigating");
    });

    test("should expand stack trace frames with code context", async ({
      page,
    }) => {
      await page.goto("/issues/test-issue-123");
      await page.waitForSelector('[data-testid="issue-detail"]');

      // Navigate to stack trace tab
      await page.click('[data-testid="tab-stacktrace"]');

      // Click on first stack frame
      const firstFrame = page.locator('[data-testid="stack-frame"]').first();
      await firstFrame.click();

      // Verify code context is shown
      await expect(page.locator('[data-testid="code-context"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-line"]')).toHaveClass(
        /bg-red-100/,
      );
    });

    test("should show related issues and suggestions", async ({ page }) => {
      await page.goto("/issues/test-issue-123");
      await page.waitForSelector('[data-testid="issue-detail"]');

      // Check for related issues section
      const relatedIssues = page.locator('[data-testid="related-issues"]');
      if (await relatedIssues.isVisible()) {
        const relatedLinks = relatedIssues.locator(
          '[data-testid="related-issue-link"]',
        );
        await expect(relatedLinks.first()).toBeVisible();

        // Click on a related issue should navigate correctly
        await relatedLinks.first().click();
        await expect(page).toHaveURL(/\/issues\/[^\/]+$/);
      }
    });
  });

  test.describe("Performance & Responsiveness", () => {
    test("should load dashboard within performance budget", async ({
      page,
    }) => {
      const startTime = Date.now();

      await page.goto("/dashboard");
      await page.waitForSelector('[data-testid="kpi-header"]');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    test("should handle large issue lists without performance degradation", async ({
      page,
    }) => {
      // Navigate to a page with many issues
      await page.goto("/issues?limit=1000");

      const startTime = Date.now();
      await page.waitForSelector('[data-testid="issue-list"]');

      // Scroll through the list to test virtualization
      await page.mouse.wheel(0, 5000);
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, -5000);

      const scrollTime = Date.now() - startTime;
      expect(scrollTime).toBeLessThan(1000); // Should remain responsive
    });

    test("should be responsive on mobile viewports", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      await page.goto("/dashboard");
      await page.waitForSelector('[data-testid="kpi-header"]');

      // Check that KPI cards stack vertically on mobile
      const kpiCards = page.locator('[data-testid="kpi-card"]');
      const firstCard = kpiCards.first();
      const secondCard = kpiCards.nth(1);

      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();

      // Verify cards are stacked (second card is below first)
      expect(secondCardBox!.y).toBeGreaterThan(
        firstCardBox!.y + firstCardBox!.height - 10,
      );
    });
  });

  test.describe("Accessibility", () => {
    test("should be navigable via keyboard", async ({ page }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Test keyboard navigation through filters
      await page.keyboard.press("Tab"); // Focus search input
      await expect(page.locator('[data-testid="search-issues"]')).toBeFocused();

      await page.keyboard.press("Tab"); // Focus severity filter
      await expect(
        page.locator('[data-testid="severity-filter"]'),
      ).toBeFocused();

      // Test keyboard activation of issue rows
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const focusedIssue = page.locator('[data-testid="issue-row"]:focus');
      await page.keyboard.press("Enter");

      // Should navigate to issue detail
      await expect(page).toHaveURL(/\/issues\/[^\/]+$/);
    });

    test("should have proper ARIA labels and roles", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForSelector('[data-testid="kpi-header"]');

      // Check main landmark
      await expect(page.locator("main")).toHaveAttribute("role", "main");

      // Check KPI region has proper labeling
      const kpiSection = page.locator('[data-testid="kpi-header"]');
      await expect(kpiSection).toHaveAttribute(
        "aria-label",
        /metrics|dashboard/i,
      );

      // Check buttons have proper labels
      const refreshButton = page.locator('[data-testid="refresh-metrics-btn"]');
      await expect(refreshButton).toHaveAttribute("aria-label", /refresh/i);
    });

    test("should meet color contrast requirements", async ({ page }) => {
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // This would typically use axe-core for automated testing
      // For now, verify critical severity has sufficient contrast
      const criticalBadge = page
        .locator('[data-testid="severity-badge"]:has-text("Critical")')
        .first();

      if (await criticalBadge.isVisible()) {
        const styles = await criticalBadge.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
          };
        });

        // Verify critical badges use high-contrast colors
        expect(styles.color).toMatch(/rgb\(127, 29, 29\)|rgb\(153, 27, 27\)/); // Dark red text
        expect(styles.backgroundColor).toMatch(
          /rgb\(254, 242, 242\)|rgb\(239, 68, 68\)/,
        ); // Light red bg
      }
    });
  });

  test.describe("Error States & Edge Cases", () => {
    test("should handle API errors gracefully", async ({ page }) => {
      // Intercept API calls and simulate failure
      await page.route("**/api/issues", (route) => route.abort());

      await page.goto("/issues");

      // Verify error state is shown
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        /failed to load|error/i,
      );

      // Verify retry functionality
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.isVisible()) {
        await retryButton.click();
        // Should attempt to reload data
      }
    });

    test("should handle offline state", async ({ page, context }) => {
      await page.goto("/dashboard");
      await page.waitForSelector('[data-testid="kpi-header"]');

      // Simulate offline
      await context.setOffline(true);

      // Try to refresh metrics
      await page.click('[data-testid="refresh-metrics-btn"]');

      // Should show offline indicator or error
      await expect(
        page.locator(
          '[data-testid="offline-indicator"], [data-testid="network-error"]',
        ),
      ).toBeVisible();
    });

    test("should handle very long issue titles gracefully", async ({
      page,
    }) => {
      // This test assumes we have control over test data
      await page.goto("/issues");
      await page.waitForSelector('[data-testid="issue-list"]');

      // Look for truncated text
      const longTitle = page.locator('[data-testid="issue-title"]').first();
      const titleText = await longTitle.textContent();

      if (titleText && titleText.length > 100) {
        // Verify title is truncated and shows ellipsis
        await expect(longTitle).toHaveClass(/truncate|line-clamp/);
      }
    });
  });
});

/**
 * Performance monitoring test that can be run in CI
 */
test.describe("Core Web Vitals", () => {
  test("should meet performance thresholds", async ({ page }) => {
    await page.goto("/dashboard");

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};

          entries.forEach((entry) => {
            if (entry.entryType === "largest-contentful-paint") {
              metrics.lcp = entry.startTime;
            }
            if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + entry.value;
            }
          });

          resolve(metrics);
        }).observe({
          entryTypes: ["largest-contentful-paint", "layout-shift"],
        });

        // Resolve after 5 seconds if no metrics collected
        setTimeout(() => resolve({}), 5000);
      });
    });

    // Assert performance thresholds
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    }
    if (metrics.cls !== undefined) {
      expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1
    }
  });
});
