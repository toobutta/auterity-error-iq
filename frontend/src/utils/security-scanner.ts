/**
 * Security Scanner for Chrome DevTools Integration - Error-IQ
 * Provides security headers validation and vulnerability scanning
 */

export interface SecurityIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  cwe?: string;
  owasp?: string;
  affectedUrls: string[];
  evidence: string;
}

export interface SecurityHeaders {
  'content-security-policy': boolean;
  'x-frame-options': boolean;
  'x-content-type-options': boolean;
  'strict-transport-security': boolean;
  'x-xss-protection': boolean;
  'referrer-policy': boolean;
  'permissions-policy': boolean;
}

export interface SecurityReport {
  score: number;
  issues: SecurityIssue[];
  headers: SecurityHeaders;
  timestamp: number;
  scannedUrls: string[];
}

export interface SecurityMetrics {
  score: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  headersScore: number;
}

class SecurityScanner {
  private report: SecurityReport | null = null;
  private metrics: SecurityMetrics;
  private isInitialized = false;
  private scannedUrls: Set<string> = new Set();

  constructor() {
    this.metrics = {
      score: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      headersScore: 0,
    };
  }

  /**
   * Initialize security scanning
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    this.setupSecurityMonitoring();
    this.isInitialized = true;

    // Run initial scan
    setTimeout(() => this.runScan(), 1000);
  }

  /**
   * Set up security monitoring
   */
  private setupSecurityMonitoring(): void {
    // Monitor for mixed content
    this.monitorMixedContent();

    // Monitor for insecure requests
    this.monitorInsecureRequests();

    // Monitor CSP violations
    this.monitorCSPViolations();
  }

  /**
   * Monitor mixed content (HTTP resources on HTTPS pages)
   */
  private monitorMixedContent(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      if (event.violatedDirective === 'mixed-content') {

        this.addSecurityIssue({
          id: 'mixed-content',
          severity: 'high',
          title: 'Mixed Content Vulnerability',
          description: 'HTTP resources loaded on HTTPS page',
          recommendation: 'Use HTTPS for all resources or implement CSP upgrade-insecure-requests',
          affectedUrls: [event.blockedURI],
          evidence: `Blocked URI: ${event.blockedURI}`,
        });
      }
    });
  }

  /**
   * Monitor insecure requests
   */
  private monitorInsecureRequests(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (url.startsWith('http://') && window.location.protocol === 'https:') {

        this.addSecurityIssue({
          id: 'insecure-request',
          severity: 'medium',
          title: 'Insecure HTTP Request',
          description: 'HTTP request made from HTTPS page',
          recommendation: 'Use HTTPS URLs for all requests',
          affectedUrls: [url],
          evidence: `Request URL: ${url}`,
        });
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Monitor CSP violations
   */
  private monitorCSPViolations(): void {
    document.addEventListener('securitypolicyviolation', (event) => {

      this.addSecurityIssue({
        id: 'csp-violation',
        severity: 'medium',
        title: 'Content Security Policy Violation',
        description: `CSP blocked ${event.violatedDirective}`,
        recommendation: 'Review and update Content Security Policy',
        affectedUrls: [event.blockedURI],
        evidence: `Directive: ${event.violatedDirective}, Blocked: ${event.blockedURI}`,
      });
    });
  }

  /**
   * Run comprehensive security scan
   */
  public async runScan(): Promise<SecurityReport | null> {
    try {
      const headers = await this.scanSecurityHeaders();
      const issues = await this.scanForVulnerabilities();

      this.report = {
        score: this.calculateSecurityScore(issues, headers),
        issues,
        headers,
        timestamp: Date.now(),
        scannedUrls: Array.from(this.scannedUrls),
      };

      this.updateMetrics(this.report);

      // Log results to console
      this.logScanResults(this.report);

      return this.report;
    } catch (error) {

      return null;
    }
  }

  /**
   * Scan security headers
   */
  private async scanSecurityHeaders(): Promise<SecurityHeaders> {
    const headers: SecurityHeaders = {
      'content-security-policy': false,
      'x-frame-options': false,
      'x-content-type-options': false,
      'strict-transport-security': false,
      'x-xss-protection': false,
      'referrer-policy': false,
      'permissions-policy': false,
    };

    try {
      // Check CSP
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (csp || document.head.innerHTML.includes('Content-Security-Policy')) {
        headers['content-security-policy'] = true;
      }

      // Check other security headers via fetch to current page
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const responseHeaders = response.headers;

      headers['x-frame-options'] = responseHeaders.has('x-frame-options');
      headers['x-content-type-options'] = responseHeaders.has('x-content-type-options');
      headers['strict-transport-security'] = responseHeaders.has('strict-transport-security');
      headers['x-xss-protection'] = responseHeaders.has('x-xss-protection');
      headers['referrer-policy'] = responseHeaders.has('referrer-policy');
      headers['permissions-policy'] = responseHeaders.has('permissions-policy');

    } catch (error) {

    }

    return headers;
  }

  /**
   * Scan for common vulnerabilities
   */
  private async scanForVulnerabilities(): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for missing security headers
    const headers = await this.scanSecurityHeaders();

    if (!headers['content-security-policy']) {
      issues.push({
        id: 'missing-csp',
        severity: 'high',
        title: 'Missing Content Security Policy',
        description: 'No CSP header or meta tag found',
        recommendation: 'Implement a Content Security Policy to prevent XSS attacks',
        owasp: 'A6:2021-Identification and Authentication Failures',
        affectedUrls: [window.location.href],
        evidence: 'CSP header/meta tag not detected',
      });
    }

    if (!headers['x-frame-options']) {
      issues.push({
        id: 'missing-x-frame-options',
        severity: 'medium',
        title: 'Missing X-Frame-Options Header',
        description: 'Page can be embedded in frames',
        recommendation: 'Set X-Frame-Options header to prevent clickjacking',
        owasp: 'A4:2021-Insecure Design',
        affectedUrls: [window.location.href],
        evidence: 'X-Frame-Options header not found',
      });
    }

    // Check for insecure forms
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const action = (form as HTMLFormElement).action;
      if (action && action.startsWith('http://') && window.location.protocol === 'https:') {
        issues.push({
          id: `insecure-form-${index}`,
          severity: 'high',
          title: 'Insecure Form Submission',
          description: 'Form submits to HTTP URL from HTTPS page',
          recommendation: 'Change form action to HTTPS URL',
          affectedUrls: [action],
          evidence: `Form action: ${action}`,
        });
      }
    });

    return issues;
  }

  /**
   * Add security issue to current scan
   */
  private addSecurityIssue(issue: Omit<SecurityIssue, 'id'> & { id: string }): void {
    if (!this.report) return;

    // Check if issue already exists
    const existingIssue = this.report.issues.find(i => i.id === issue.id);
    if (existingIssue) {
      // Add affected URLs if not already present
      issue.affectedUrls.forEach(url => {
        if (!existingIssue.affectedUrls.includes(url)) {
          existingIssue.affectedUrls.push(url);
        }
      });
      return;
    }

    this.report.issues.push(issue as SecurityIssue);
    this.updateMetrics(this.report);
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(issues: SecurityIssue[], headers: SecurityHeaders): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Bonus for security headers
    const headerCount = Object.values(headers).filter(Boolean).length;
    score += headerCount * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update security metrics
   */
  private updateMetrics(report: SecurityReport): void {
    this.metrics.score = report.score;

    this.metrics.criticalIssues = report.issues.filter(i => i.severity === 'critical').length;
    this.metrics.highIssues = report.issues.filter(i => i.severity === 'high').length;
    this.metrics.mediumIssues = report.issues.filter(i => i.severity === 'medium').length;
    this.metrics.lowIssues = report.issues.filter(i => i.severity === 'low').length;

    // Calculate headers score
    const headerValues = Object.values(report.headers);
    this.metrics.headersScore = (headerValues.filter(Boolean).length / headerValues.length) * 100;
  }

  /**
   * Log scan results to console
   */
  private logScanResults(report: SecurityReport): void {
    console.group(`[Security] Scan Results - Score: ${report.score}/100`);





    if (report.issues.length > 0) {
      console.group('Issues:');
      report.issues.forEach((issue, index) => {
        const severityEmoji = {
          critical: '🚨',
          high: '🔴',
          medium: '🟡',
          low: '🔵',
        }[issue.severity] || '⚪';

        console.group(`${severityEmoji} ${index + 1}. ${issue.title}`);



        console.groupEnd();
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Get current security metrics
   */
  public getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get latest security report
   */
  public getReport(): SecurityReport | null {
    return this.report;
  }

  /**
   * Get issues by severity
   */
  public getIssuesBySeverity(severity: SecurityIssue['severity']): SecurityIssue[] {
    return this.report?.issues.filter(i => i.severity === severity) || [];
  }

  /**
   * Export security report
   */
  public exportReport(): string {
    if (!this.report) return 'No report available';

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      report: this.report,
    }, null, 2);
  }

  /**
   * Destroy scanner and clean up
   */
  public destroy(): void {
    this.report = null;
    this.metrics = {
      score: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      headersScore: 0,
    };
    this.scannedUrls.clear();
    this.isInitialized = false;
  }
}

export { SecurityScanner };


