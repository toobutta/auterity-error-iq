#!/usr/bin/env node

/**
 * Commit Message Validation Script for Auterity AI Platform
 * Validates commit messages against conventional commit standards
 * 
 * Usage: node validate-commit-msg.js <commit_msg_file>
 * Git Hook: Save as .git/hooks/commit-msg and make executable
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  types: ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
  scopes: ['backend', 'frontend', 'api', 'db', 'auth', 'workflow', 'agent', 'ui', 'config', 'infra', 'deps', 'test', 'ci', 'docs'],
  maxSubjectLength: 50,
  maxLineLength: 72,
  subjectPattern: /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z-]+\))?: .{1,50}$/,
  forbiddenSubjects: ['update', 'changes', 'misc', 'stuff', 'things', 'work', 'fixes', 'wip', 'todo', 'temp', 'debug'],
  bodyRequiredForLargeChanges: true,
  requireIssueReference: false // Set to true in production
};

// Colors for console output
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function validateCommitMessage(message) {
  const errors = [];
  const warnings = [];
  const lines = message.split('\n');
  const subject = lines[0];
  const body = lines.slice(2).join('\n').trim();

  // Validate subject line
  if (!subject) {
    errors.push('Subject line is required');
    return { valid: false, errors, warnings };
  }

  // Check subject length
  if (subject.length > CONFIG.maxSubjectLength) {
    errors.push(`Subject line too long (${subject.length}/${CONFIG.maxSubjectLength} chars)`);
  }

  // Check conventional commit format
  if (!CONFIG.subjectPattern.test(subject)) {
    errors.push('Subject line must follow conventional commit format: <type>(<scope>): <description>');
  }

  // Extract type and scope
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
  if (match) {
    const [, type, scope, description] = match;

    // Validate type
    if (!CONFIG.types.includes(type)) {
      errors.push(`Invalid commit type: "${type}". Must be one of: ${CONFIG.types.join(', ')}`);
    }

    // Validate scope (if provided)
    if (scope && !CONFIG.scopes.includes(scope)) {
      warnings.push(`Unknown scope: "${scope}". Consider using: ${CONFIG.scopes.join(', ')}`);
    }

    // Check for forbidden words in description
    const descriptionLower = description.toLowerCase();
    const forbidden = CONFIG.forbiddenSubjects.find(word => descriptionLower.includes(word));
    if (forbidden) {
      warnings.push(`Avoid generic terms like "${forbidden}" in commit description`);
    }

    // Check capitalization
    if (description[0] === description[0].toUpperCase() && !/^[A-Z][a-z]/.test(description)) {
      warnings.push('Description should start with lowercase letter (imperative mood)');
    }

    // Check for period at end
    if (description.endsWith('.')) {
      warnings.push('Remove period at end of subject line');
    }
  }

  // Validate body format for structured commits
  if (body) {
    const bodyLines = body.split('\n');
    
    // Check for structured format
    const hasStructuredFormat = bodyLines.some(line => 
      line.match(/^- (What|Why|How):/i)
    );

    if (body.length > 20 && !hasStructuredFormat) {
      warnings.push('Consider using structured body format: "- What:", "- Why:", "- How:"');
    }

    // Check line length
    bodyLines.forEach((line, index) => {
      if (line.length > CONFIG.maxLineLength) {
        warnings.push(`Body line ${index + 3} too long (${line.length}/${CONFIG.maxLineLength} chars)`);
      }
    });

    // Check for issue reference in footer
    if (CONFIG.requireIssueReference && !body.match(/Refs?:\s*#\d+/i)) {
      warnings.push('Consider adding issue reference: "Refs: #123"');
    }
  }

  // Check if body is required (for significant changes)
  if (CONFIG.bodyRequiredForLargeChanges && !body) {
    // This would need integration with git to check changed files
    // For now, just warn for certain types
    if (['feat', 'refactor', 'perf'].includes(match?.[1])) {
      warnings.push('Consider adding body with "- What:", "- Why:", "- How:" for significant changes');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function printResults(result, message) {
  console.log(colorize('\n📝 Commit Message Validation', 'bold'));
  console.log('─'.repeat(50));

  if (result.valid) {
    console.log(colorize('✅ Valid commit message format', 'green'));
  } else {
    console.log(colorize('❌ Invalid commit message format', 'red'));
  }

  if (result.errors.length > 0) {
    console.log(colorize('\n🚫 Errors:', 'red'));
    result.errors.forEach(error => {
      console.log(colorize(`  • ${error}`, 'red'));
    });
  }

  if (result.warnings.length > 0) {
    console.log(colorize('\n⚠️  Warnings:', 'yellow'));
    result.warnings.forEach(warning => {
      console.log(colorize(`  • ${warning}`, 'yellow'));
    });
  }

  if (!result.valid || result.warnings.length > 0) {
    console.log(colorize('\n📚 Examples:', 'cyan'));
    console.log(colorize('  feat(auth): add JWT token validation', 'cyan'));
    console.log(colorize('  fix(workflow): resolve execution timeout', 'cyan'));
    console.log(colorize('  docs(api): update authentication endpoints', 'cyan'));
    
    console.log(colorize('\n📖 Full format for significant changes:', 'cyan'));
    console.log(colorize('  feat(workflow): add parallel execution engine', 'cyan'));
    console.log(colorize('  ', 'cyan'));
    console.log(colorize('  - What: Implemented concurrent step processing', 'cyan'));
    console.log(colorize('  - Why: Improve performance for complex workflows', 'cyan'));
    console.log(colorize('  - How: Added TopologicalExecutor with batching', 'cyan'));
    console.log(colorize('  ', 'cyan'));
    console.log(colorize('  Refs: #147', 'cyan'));
    console.log(colorize('  Tested: Unit tests, integration tests', 'cyan'));
  }

  console.log('─'.repeat(50));
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(colorize('Usage: node validate-commit-msg.js <commit_msg_file>', 'red'));
    process.exit(1);
  }

  const commitMsgFile = args[0];

  if (!fs.existsSync(commitMsgFile)) {
    console.error(colorize(`File not found: ${commitMsgFile}`, 'red'));
    process.exit(1);
  }

  try {
    const message = fs.readFileSync(commitMsgFile, 'utf8').trim();
    
    if (!message) {
      console.error(colorize('Empty commit message', 'red'));
      process.exit(1);
    }

    const result = validateCommitMessage(message);
    printResults(result, message);

    if (!result.valid) {
      console.log(colorize('\n💡 Tip: Use the AI commit message rules from AI_COMMIT_MESSAGE_RULES.md', 'blue'));
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.log(colorize('\n✅ Commit accepted with warnings', 'yellow'));
    }

    process.exit(0);

  } catch (error) {
    console.error(colorize(`Error reading commit message: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Export for testing
if (require.main === module) {
  main();
} else {
  module.exports = { validateCommitMessage, CONFIG };
}
