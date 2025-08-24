#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Comprehensive TypeScript Error Resolution\n');

// Fix remaining auterity-expansion components
const fixAuterityExpansionComponents = () => {
  console.log('📁 Fixing auterity-expansion components...');
  
  const componentsToFix = [
    'SmartTriageDashboard.tsx',
    'VectorSimilarityDashboard.tsx'
  ];
  
  componentsToFix.forEach(component => {
    const filePath = `./src/components/auterity-expansion/${component}`;
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix any type violations
      content = content.replace(/: any/g, ': unknown');
      content = content.replace(/any\[\]/g, 'unknown[]');
      content = content.replace(/\(.*?: any\)/g, (match) => match.replace('any', 'unknown'));
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${component}`);
    }
  });
};

// Fix unused variables and imports
const fixUnusedVariables = () => {
  console.log('🧹 Removing unused variables and imports...');
  
  const filesToFix = [
    './src/pages/ModernDashboard.tsx',
    './src/components/ModernErrorDashboard.tsx',
    './src/components/ModernLandingPage.tsx'
  ];
  
  filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove unused React import if JSX transform is used
      if (content.includes("import React") && !content.includes('React.')) {
        content = content.replace(/import React,?\s*{([^}]+)}/g, 'import {$1}');
        content = content.replace(/import React from 'react';\s*/g, '');
      }
      
      // Remove unused Suspense import
      content = content.replace(/import\s*{\s*([^}]*),?\s*Suspense\s*([^}]*)\s*}/g, (match, before, after) => {
        const cleanBefore = before ? before.trim() : '';
        const cleanAfter = after ? after.trim() : '';
        const imports = [cleanBefore, cleanAfter].filter(Boolean).join(', ');
        return imports ? `import { ${imports} }` : '';
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed unused imports: ${path.basename(filePath)}`);
    }
  });
};

// Fix component prop type issues
const fixComponentProps = () => {
  console.log('🔧 Fixing component prop types...');
  
  // Fix Dashboard.tsx MetricCard props
  const dashboardPath = './src/pages/Dashboard.tsx';
  if (fs.existsSync(dashboardPath)) {
    let content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Fix variant type issues
    content = content.replace(/variant: "neutral"/g, 'trend: "stable"');
    content = content.replace(/variant: string/g, 'trend: "up" | "down" | "stable"');
    
    fs.writeFileSync(dashboardPath, content);
    console.log('✅ Fixed Dashboard.tsx prop types');
  }
};

// Fix test files
const fixTestFiles = () => {
  console.log('🧪 Fixing test files...');
  
  const testDir = './src/components/__tests__';
  if (fs.existsSync(testDir)) {
    const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.tsx'));
    
    testFiles.forEach(file => {
      const filePath = path.join(testDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove unused React imports
      if (content.includes("import React from 'react';") && !content.includes('React.')) {
        content = content.replace("import React from 'react';\n", '');
      }
      
      // Fix null assignments
      content = content.replace(/defaultValue: null/g, 'defaultValue: undefined');
      content = content.replace(/validationRules: null/g, 'validationRules: undefined');
      content = content.replace(/outputData: null/g, 'outputData: undefined');
      
      fs.writeFileSync(filePath, content);
    });
    
    console.log(`✅ Fixed ${testFiles.length} test files`);
  }
};

// Fix workflow execution status types
const fixWorkflowTypes = () => {
  console.log('🔄 Fixing workflow execution types...');
  
  const workflowFiles = [
    './src/components/WorkflowExecutionHistory.tsx',
    './src/components/WorkflowExecutionResults.tsx'
  ];
  
  workflowFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Ensure status includes 'cancelled'
      content = content.replace(
        /'pending' \| 'running' \| 'completed' \| 'failed'/g,
        "'pending' | 'running' | 'completed' | 'failed' | 'cancelled'"
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
    }
  });
};

// Fix missing type definitions
const addMissingTypes = () => {
  console.log('📝 Adding missing type definitions...');
  
  // Create missing error types if not exists
  const errorTypesPath = './src/types/error.ts';
  if (!fs.existsSync(errorTypesPath)) {
    const errorTypes = `export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export type ErrorCategory = 'auth' | 'api' | 'workflow' | 'template' | 'network' | 'system';

export interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
  retryable?: boolean;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface ErrorReportData {
  error: AppError;
  userAgent?: string;
  url?: string;
  additionalInfo?: Record<string, unknown>;
}`;
    
    fs.writeFileSync(errorTypesPath, errorTypes);
    console.log('✅ Created error types');
  }
};

// Run all fixes
const runAllFixes = () => {
  try {
    fixAuterityExpansionComponents();
    fixUnusedVariables();
    fixComponentProps();
    fixTestFiles();
    fixWorkflowTypes();
    addMissingTypes();
    
    console.log('\n🎯 Running TypeScript check...');
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
      console.log('\n✅ All TypeScript errors resolved!');
    } catch (error) {
      console.log('\n⚠️  Some TypeScript errors may remain. Check output above.');
    }
    
    console.log('\n🎉 TypeScript compliance fix complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run lint -- --fix');
    console.log('2. Run: npm run test');
    console.log('3. Run: npm run build');
    
  } catch (error) {
    console.error('❌ Error during fix process:', error.message);
    process.exit(1);
  }
};

runAllFixes();