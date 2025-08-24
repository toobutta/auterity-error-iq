/**
 * SDK Generator for Multiple Languages
 * Generates TypeScript, Python, Java, and other language SDKs from OpenAPI specs
 */

import fs from 'fs-extra';
import path from 'path';
import Mustache from 'mustache';
import archiver from 'archiver';
import yaml from 'yaml';

export interface SDKConfig {
  language: string;
  packageName: string;
  version: string;
  apiBaseUrl: string;
  outputDir: string;
  templateDir: string;
}

export interface APIEndpoint {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  description?: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: { [statusCode: string]: Response };
  tags: string[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  type: string;
  description?: string;
}

export interface RequestBody {
  required: boolean;
  content: { [mediaType: string]: { schema: any } };
}

export interface Response {
  description: string;
  content?: { [mediaType: string]: { schema: any } };
}

export class SDKGenerator {
  private apiSpec: any;
  private endpoints: APIEndpoint[] = [];

  constructor(private openApiSpecPath: string) {
    this.loadAPISpec();
    this.parseEndpoints();
  }

  private loadAPISpec(): void {
    const specContent = fs.readFileSync(this.openApiSpecPath, 'utf-8');
    this.apiSpec = yaml.parse(specContent);
  }

  private parseEndpoints(): void {
    const paths = this.apiSpec.paths || {};
    
    for (const [pathUrl, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          this.endpoints.push({
            path: pathUrl,
            method: method.toUpperCase(),
            operationId: operation.operationId || this.generateOperationId(method, pathUrl),
            summary: operation.summary || '',
            description: operation.description,
            parameters: this.parseParameters(operation.parameters || []),
            requestBody: operation.requestBody,
            responses: operation.responses || {},
            tags: operation.tags || [],
          });
        }
      }
    }
  }

  private generateOperationId(method: string, path: string): string {
    const cleanPath = path.replace(/[{}]/g, '').replace(/\//g, '_').replace(/^_/, '');
    return `${method}_${cleanPath}`;
  }

  private parseParameters(parameters: any[]): Parameter[] {
    return parameters.map(param => ({
      name: param.name,
      in: param.in,
      required: param.required || false,
      type: this.getTypeFromSchema(param.schema),
      description: param.description,
    }));
  }

  private getTypeFromSchema(schema: any): string {
    if (!schema) return 'any';
    
    switch (schema.type) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return `${this.getTypeFromSchema(schema.items)}[]`;
      case 'object': return 'object';
      default: return 'any';
    }
  }

  async generateTypeScriptSDK(config: SDKConfig): Promise<string> {
    const templateDir = path.join(config.templateDir, 'typescript');
    const outputDir = path.join(config.outputDir, 'typescript');

    await fs.ensureDir(outputDir);

    // Generate client class
    const clientTemplate = await fs.readFile(path.join(templateDir, 'client.ts.mustache'), 'utf-8');
    const clientCode = Mustache.render(clientTemplate, {
      packageName: config.packageName,
      version: config.version,
      apiBaseUrl: config.apiBaseUrl,
      endpoints: this.endpoints,
    });

    await fs.writeFile(path.join(outputDir, 'client.ts'), clientCode);

    // Generate types
    const typesTemplate = await fs.readFile(path.join(templateDir, 'types.ts.mustache'), 'utf-8');
    const typesCode = Mustache.render(typesTemplate, {
      schemas: this.apiSpec.components?.schemas || {},
    });

    await fs.writeFile(path.join(outputDir, 'types.ts'), typesCode);

    // Generate package.json
    const packageJson = {
      name: config.packageName,
      version: config.version,
      description: `TypeScript SDK for ${config.packageName}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      scripts: {
        build: 'tsc',
        test: 'jest',
      },
      dependencies: {
        axios: '^1.5.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0',
        jest: '^29.0.0',
        '@types/jest': '^29.0.0',
      },
    };

    await fs.writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Generate index.ts
    const indexCode = `export * from './client';\nexport * from './types';`;
    await fs.writeFile(path.join(outputDir, 'index.ts'), indexCode);

    return outputDir;
  }

  async generatePythonSDK(config: SDKConfig): Promise<string> {
    const templateDir = path.join(config.templateDir, 'python');
    const outputDir = path.join(config.outputDir, 'python');

    await fs.ensureDir(outputDir);

    // Generate client class
    const clientTemplate = await fs.readFile(path.join(templateDir, 'client.py.mustache'), 'utf-8');
    const clientCode = Mustache.render(clientTemplate, {
      packageName: config.packageName.replace(/-/g, '_'),
      version: config.version,
      apiBaseUrl: config.apiBaseUrl,
      endpoints: this.endpoints.map(endpoint => ({
        ...endpoint,
        pythonMethodName: this.toPythonMethodName(endpoint.operationId),
      })),
    });

    await fs.writeFile(path.join(outputDir, 'client.py'), clientCode);

    // Generate setup.py
    const setupPy = `from setuptools import setup, find_packages

setup(
    name="${config.packageName.replace(/-/g, '_')}",
    version="${config.version}",
    description="Python SDK for ${config.packageName}",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.0",
        "typing-extensions>=4.0.0",
    ],
    python_requires=">=3.7",
)`;

    await fs.writeFile(path.join(outputDir, 'setup.py'), setupPy);

    // Generate __init__.py
    const initCode = `from .client import *\n__version__ = "${config.version}"`;
    await fs.writeFile(path.join(outputDir, '__init__.py'), initCode);

    return outputDir;
  }

  private toPythonMethodName(operationId: string): string {
    return operationId.toLowerCase().replace(/[A-Z]/g, '_$&').replace(/^_/, '');
  }

  async generateDocumentation(config: SDKConfig): Promise<string> {
    const outputDir = path.join(config.outputDir, 'docs');
    await fs.ensureDir(outputDir);

    // Generate API reference
    const apiRefTemplate = `# API Reference

## Base URL
\`${config.apiBaseUrl}\`

## Authentication
Include your API key in the \`Authorization\` header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

${this.endpoints.map(endpoint => `
### ${endpoint.method} ${endpoint.path}

**${endpoint.summary}**

${endpoint.description || ''}

#### Parameters
${endpoint.parameters.length > 0 ? endpoint.parameters.map(param => 
  `- \`${param.name}\` (${param.type}) ${param.required ? '**required**' : '*optional*'} - ${param.description || ''}`
).join('\n') : 'No parameters'}

#### Example Request
\`\`\`bash
curl -X ${endpoint.method} "${config.apiBaseUrl}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"
\`\`\`

`).join('\n')}`;

    await fs.writeFile(path.join(outputDir, 'api-reference.md'), apiRefTemplate);

    // Generate quickstart guide
    const quickstartTemplate = `# Quick Start Guide

## Installation

### TypeScript/JavaScript
\`\`\`bash
npm install ${config.packageName}
\`\`\`

### Python
\`\`\`bash
pip install ${config.packageName.replace(/-/g, '_')}
\`\`\`

## Basic Usage

### TypeScript
\`\`\`typescript
import { Client } from '${config.packageName}';

const client = new Client({
  apiKey: 'your-api-key',
  baseUrl: '${config.apiBaseUrl}'
});

// Example API call
const response = await client.getWorkflows();
console.log(response);
\`\`\`

### Python
\`\`\`python
from ${config.packageName.replace(/-/g, '_')} import Client

client = Client(
    api_key='your-api-key',
    base_url='${config.apiBaseUrl}'
)

# Example API call
response = client.get_workflows()
print(response)
\`\`\`

## Error Handling

All SDK methods throw exceptions for HTTP errors. Make sure to handle them appropriately:

### TypeScript
\`\`\`typescript
try {
  const response = await client.getWorkflows();
} catch (error) {
  console.error('API Error:', error.message);
}
\`\`\`

### Python
\`\`\`python
try:
    response = client.get_workflows()
except Exception as error:
    print(f"API Error: {error}")
\`\`\`
`;

    await fs.writeFile(path.join(outputDir, 'quickstart.md'), quickstartTemplate);

    return outputDir;
  }

  async packageSDK(outputDir: string, language: string): Promise<string> {
    const packagePath = path.join(path.dirname(outputDir), `${language}-sdk.zip`);
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(packagePath));
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(outputDir, false);
      archive.finalize();
    });
  }

  getEndpoints(): APIEndpoint[] {
    return this.endpoints;
  }

  getAPISpec(): any {
    return this.apiSpec;
  }
}
