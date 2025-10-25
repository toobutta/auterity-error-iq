#!/usr/bin/env node

/**
 * AI Framework Validation Tool
 *
 * Validates AI SDK and LangChain mappings, checks for conflicts,
 * and provides recommendations for proper configuration.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

class AIFrameworkValidator {
  constructor() {
    this.configPath = path.join(__dirname, '../../config/external-services.yml');
    this.modelsPath = path.join(__dirname, '../../services/api/src/config/models.yaml');
    this.results = {
      status: 'unknown',
      issues: [],
      warnings: [],
      recommendations: [],
      frameworkStatus: {}
    };
  }

  async validate() {
    console.log('🔍 Validating AI Framework Mappings...\n');

    try {
      // Load configuration files
      const config = this.loadConfig();
      const models = this.loadModels();

      // Validate framework mappings
      this.validateFrameworkMappings(config);

      // Check for conflicts
      this.checkForConflicts(config, models);

      // Validate provider configurations
      this.validateProviderConfigs(config);

      // Generate recommendations
      this.generateRecommendations(config);

      // Output results
      this.outputResults();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      this.results.status = 'failed';
      this.results.issues.push(`Validation error: ${error.message}`);
    }

    return this.results;
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    const configContent = fs.readFileSync(this.configPath, 'utf8');
    return yaml.parse(configContent);
  }

  loadModels() {
    if (!fs.existsSync(this.modelsPath)) {
      console.warn(`⚠️  Models configuration file not found: ${this.modelsPath}`);
      return null;
    }

    const modelsContent = fs.readFileSync(this.modelsPath, 'utf8');
    return yaml.parse(modelsContent);
  }

  validateFrameworkMappings(config) {
    const aiFrameworks = config.ai_frameworks;

    if (!aiFrameworks) {
      this.results.issues.push('Missing ai_frameworks configuration');
      return;
    }

    const mappings = aiFrameworks.framework_mappings;

    if (!mappings) {
      this.results.warnings.push('No framework mappings defined');
      return;
    }

    // Validate AI SDK to LangChain mappings
    const aiSdkToLangChain = mappings.ai_sdk_to_langchain || {};
    const langChainToAiSdk = mappings.langchain_to_ai_sdk || {};

    // Check for bidirectional consistency
    for (const [aiSdkProvider, langChainProvider] of Object.entries(aiSdkToLangChain)) {
      const reverseMapping = langChainToAiSdk[langChainProvider];
      if (reverseMapping !== aiSdkProvider) {
        this.results.warnings.push(
          `Inconsistent mapping: ${aiSdkProvider} → ${langChainProvider}, but reverse is ${reverseMapping || 'missing'}`
        );
      }
    }

    console.log('✅ Framework mappings validated');
  }

  checkForConflicts(config, models) {
    const aiFrameworks = config.ai_frameworks;

    if (!aiFrameworks) return;

    const aiSdkProviders = aiFrameworks.ai_sdk?.providers || {};
    const langChainProviders = aiFrameworks.langchain?.providers || {};

    // Check for duplicate provider configurations
    const aiSdkKeys = Object.keys(aiSdkProviders);
    const langChainKeys = Object.keys(langChainProviders);

    const commonProviders = aiSdkKeys.filter(provider => langChainKeys.includes(provider));

    if (commonProviders.length > 0) {
      this.results.warnings.push(
        `Providers configured in both frameworks: ${commonProviders.join(', ')}`
      );
    }

    // Check for missing API keys
    const providersWithoutKeys = [];

    for (const provider of aiSdkKeys) {
      const providerConfig = aiSdkProviders[provider];
      if (providerConfig.enabled && !providerConfig.api_key) {
        providersWithoutKeys.push(`${provider} (AI SDK)`);
      }
    }

    for (const provider of langChainKeys) {
      const providerConfig = langChainProviders[provider];
      if (providerConfig.enabled && !providerConfig.api_key) {
        providersWithoutKeys.push(`${provider} (LangChain)`);
      }
    }

    if (providersWithoutKeys.length > 0) {
      this.results.issues.push(
        `Providers enabled but missing API keys: ${providersWithoutKeys.join(', ')}`
      );
    }

    console.log('✅ Conflict checking completed');
  }

  validateProviderConfigs(config) {
    const aiFrameworks = config.ai_frameworks;

    if (!aiFrameworks) return;

    const unifiedConfig = aiFrameworks.unified_config || {};

    // Validate unified configuration
    if (!unifiedConfig.default_provider) {
      this.results.warnings.push('No default provider specified in unified config');
    }

    if (!unifiedConfig.fallback_provider) {
      this.results.warnings.push('No fallback provider specified in unified config');
    }

    // Check for reasonable timeouts and limits
    if (unifiedConfig.timeout > 120000) { // 2 minutes
      this.results.warnings.push('Timeout is very high (>2 minutes)');
    }

    if (unifiedConfig.max_retries > 10) {
      this.results.warnings.push('Max retries is very high (>10)');
    }

    console.log('✅ Provider configurations validated');
  }

  generateRecommendations(config) {
    const aiFrameworks = config.ai_frameworks;

    if (!aiFrameworks) {
      this.results.recommendations.push('Add ai_frameworks configuration section');
      return;
    }

    const aiSdkProviders = aiFrameworks.ai_sdk?.providers || {};
    const langChainProviders = aiFrameworks.langchain?.providers || {};

    const aiSdkCount = Object.values(aiSdkProviders).filter(p => p.enabled).length;
    const langChainCount = Object.values(langChainProviders).filter(p => p.enabled).length;

    if (aiSdkCount > 0 && langChainCount === 0) {
      this.results.recommendations.push(
        'Consider adding LangChain providers for advanced workflow orchestration'
      );
    }

    if (langChainCount > 0 && aiSdkCount === 0) {
      this.results.recommendations.push(
        'Consider adding AI SDK providers for unified streaming and cost tracking'
      );
    }

    if (aiSdkCount > 0 && langChainCount > 0) {
      this.results.recommendations.push(
        'Both frameworks operational - consider using AI SDK for simple tasks, LangChain for complex workflows'
      );
    }

    // Check for Ollama configuration
    const ollama = aiSdkProviders.ollama;
    if (ollama && !ollama.enabled) {
      this.results.recommendations.push(
        'Consider enabling Ollama for cost-effective local AI processing'
      );
    }

    console.log('✅ Recommendations generated');
  }

  outputResults() {
    console.log('\n📊 VALIDATION RESULTS\n');

    // Status
    const statusEmoji = this.results.status === 'success' ? '✅' : '❌';
    console.log(`${statusEmoji} Overall Status: ${this.results.status || 'completed'}`);

    // Issues
    if (this.results.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      this.results.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Framework Status
    console.log('\n🔧 FRAMEWORK STATUS:');
    Object.entries(this.results.frameworkStatus).forEach(([framework, status]) => {
      console.log(`  ${framework}: ${status}`);
    });

    // Summary
    const totalIssues = this.results.issues.length;
    const totalWarnings = this.results.warnings.length;

    console.log('\n📈 SUMMARY:');
    console.log(`  Issues: ${totalIssues}`);
    console.log(`  Warnings: ${totalWarnings}`);
    console.log(`  Recommendations: ${this.results.recommendations.length}`);

    if (totalIssues === 0 && totalWarnings === 0) {
      console.log('\n🎉 All validations passed! AI frameworks are properly mapped.');
      this.results.status = 'success';
    } else {
      console.log('\n⚠️  Some issues found. Please review and fix.');
      this.results.status = 'warning';
    }
  }
}

// Main execution
async function main() {
  const validator = new AIFrameworkValidator();
  await validator.validate();

  // Exit with appropriate code
  process.exit(validator.results.status === 'success' ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = AIFrameworkValidator;
