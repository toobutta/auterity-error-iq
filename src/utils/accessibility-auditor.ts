/**
 * Accessibility Auditor for Chrome DevTools Integration
 * Provides WCAG compliance checking and accessibility auditing
 */

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    target: string;
    html: string;
    failureSummary: string;
  }[];
  tags: string[];
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  score: number;
  timestamp: number;
}

export interface AccessibilityMetrics {
  score: number;
  violations: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
}

class AccessibilityAuditor {
  private report: AccessibilityReport | null = null;
  private metrics: AccessibilityMetrics;
  private isInitialized = false;
  private axeCore: any = null;

  constructor() {
    this.metrics = {
      score: 0,
      violations: 0,
      criticalIssues: 0,
      seriousIssues: 0,
      moderateIssues: 0,
      minorIssues: 0,
    };
  }

  /**
   * Initialize accessibility auditing
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadAxeCore();
      this.setupPeriodicAuditing();
      this.isInitialized = true;
      console.log('[AccessibilityAuditor] Accessibility auditing initialized');
    } catch (error) {
      console.error('[AccessibilityAuditor] Failed to initialize:', error);
    }
  }

  /**
   * Load axe-core library
   */
  private async loadAxeCore(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).axe) {
        this.axeCore = (window as any).axe;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.3/axe.min.js';
      script.onload = () => {
        this.axeCore = (window as any).axe;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Set up periodic accessibility auditing
   */
  private setupPeriodicAuditing(): void {
    // Run initial audit
    setTimeout(() => this.runAudit(), 2000);

    // Run periodic audits every 5 minutes
    setInterval(() => this.runAudit(), 300000);
  }

  /**
   * Run accessibility audit
   */
  public async runAudit(): Promise<AccessibilityReport | null> {
    if (!this.axeCore) {
      console.warn('[AccessibilityAuditor] axe-core not loaded');
      return null;
    }

    try {
      const results = await this.axeCore.run(document, {
        rules: {
          // Enable all rules
        },
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        }
      });

      this.report = {
        violations: results.violations.map(this.mapViolation.bind(this)),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        score: this.calculateAccessibilityScore(results),
        timestamp: Date.now(),
      };

      this.updateMetrics(this.report);

      // Log results to console
      this.logAuditResults(this.report);

      return this.report;
    } catch (error) {
      console.error('[AccessibilityAuditor] Audit failed:', error);
      return null;
    }
  }

  /**
   * Map axe-core violation to our format
   */
  private mapViolation(violation: any): AccessibilityViolation {
    return {
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node: any) => ({
        target: node.target.join(', '),
        html: node.html,
        failureSummary: node.failureSummary,
      })),
      tags: violation.tags,
    };
  }

  /**
   * Calculate accessibility score based on violations
   */
  private calculateAccessibilityScore(results: any): number {
    const totalChecks = results.passes.length + results.violations.length + results.incomplete.length;
    if (totalChecks === 0) return 100;

    // Weight violations by impact
    const violationScore = results.violations.reduce((score: number, violation: any) => {
      switch (violation.impact) {
        case 'critical': return score - 20;
        case 'serious': return score - 15;
        case 'moderate': return score - 10;
        case 'minor': return score - 5;
        default: return score - 5;
      }
    }, 100);

    return Math.max(0, Math.min(100, violationScore));
  }

  /**
   * Update accessibility metrics
   */
  private updateMetrics(report: AccessibilityReport): void {
    this.metrics.score = report.score;
    this.metrics.violations = report.violations.length;

    // Count by impact
    this.metrics.criticalIssues = report.violations.filter(v => v.impact === 'critical').length;
    this.metrics.seriousIssues = report.violations.filter(v => v.impact === 'serious').length;
    this.metrics.moderateIssues = report.violations.filter(v => v.impact === 'moderate').length;
    this.metrics.minorIssues = report.violations.filter(v => v.impact === 'minor').length;
  }

  /**
   * Log audit results to console
   */
  private logAuditResults(report: AccessibilityReport): void {
    console.group(`[Accessibility] Audit Results - Score: ${report.score}/100`);

    console.log(`✅ Passes: ${report.passes}`);
    console.log(`⚠️  Incomplete: ${report.incomplete}`);
    console.log(`❌ Violations: ${report.violations.length}`);

    if (report.violations.length > 0) {
      console.group('Violations:');
      report.violations.forEach((violation, index) => {
        const impactEmoji = {
          critical: '🚨',
          serious: '🔴',
          moderate: '🟡',
          minor: '🔵',
        }[violation.impact] || '⚪';

        console.group(`${impactEmoji} ${index + 1}. ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Help: ${violation.help}`);
        console.log(`URL: ${violation.helpUrl}`);
        console.log(`Affected: ${violation.nodes.length} element(s)`);
        console.groupEnd();
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Get current accessibility metrics
   */
  public getMetrics(): AccessibilityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get latest accessibility report
   */
  public getReport(): AccessibilityReport | null {
    return this.report;
  }

  /**
   * Get violations by impact level
   */
  public getViolationsByImpact(impact: AccessibilityViolation['impact']): AccessibilityViolation[] {
    return this.report?.violations.filter(v => v.impact === impact) || [];
  }

  /**
   * Check if element passes accessibility checks
   */
  public async checkElement(selector: string): Promise<AccessibilityReport | null> {
    if (!this.axeCore) return null;

    try {
      const element = document.querySelector(selector);
      if (!element) {
        console.warn(`[AccessibilityAuditor] Element not found: ${selector}`);
        return null;
      }

      const results = await this.axeCore.run(element, {
        rules: {},
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      });

      const report: AccessibilityReport = {
        violations: results.violations.map(this.mapViolation.bind(this)),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        score: this.calculateAccessibilityScore(results),
        timestamp: Date.now(),
      };

      console.log(`[Accessibility] Element check for "${selector}": ${report.score}/100`);
      return report;
    } catch (error) {
      console.error(`[AccessibilityAuditor] Element check failed for ${selector}:`, error);
      return null;
    }
  }

  /**
   * Generate accessibility recommendations
   */
  public generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.report) return recommendations;

    if (this.metrics.score < 70) {
      recommendations.push('Critical accessibility issues detected. Immediate attention required.');
    }

    if (this.metrics.criticalIssues > 0) {
      recommendations.push(`${this.metrics.criticalIssues} critical violations found. These block access for users with disabilities.`);
    }

    if (this.metrics.seriousIssues > 0) {
      recommendations.push(`${this.metrics.seriousIssues} serious violations found. These significantly impact user experience.`);
    }

    const violationsByTag = this.groupViolationsByTag();
    Object.entries(violationsByTag).forEach(([tag, count]) => {
      if (count > 2) {
        recommendations.push(`Multiple issues with ${tag} (${count} violations). Consider comprehensive review.`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Accessibility audit passed with good score. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Group violations by WCAG tag
   */
  private groupViolationsByTag(): Record<string, number> {
    const groups: Record<string, number> = {};

    this.report?.violations.forEach(violation => {
      violation.tags.forEach(tag => {
        groups[tag] = (groups[tag] || 0) + 1;
      });
    });

    return groups;
  }

  /**
   * Export accessibility report
   */
  public exportReport(): string {
    if (!this.report) return 'No report available';

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      report: this.report,
      recommendations: this.generateRecommendations(),
    }, null, 2);
  }

  /**
   * Destroy auditor and clean up
   */
  public destroy(): void {
    this.report = null;
    this.metrics = {
      score: 0,
      violations: 0,
      criticalIssues: 0,
      seriousIssues: 0,
      moderateIssues: 0,
      minorIssues: 0,
    };
    this.isInitialized = false;
  }
}

export { AccessibilityAuditor };
