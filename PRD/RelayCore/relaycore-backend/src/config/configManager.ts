import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ConfigManager {
  private config: any;
  private configPath: string;
  
  constructor(configPath: string = 'relaycore.config.yaml') {
    this.configPath = configPath;
    this.loadConfig();
  }
  
  private loadConfig() {
    try {
      // Check if config file exists
      if (fs.existsSync(this.configPath)) {
        const configFile = fs.readFileSync(this.configPath, 'utf8');
        this.config = yaml.load(configFile);
      } else {
        // Use default config if file doesn't exist
        this.config = this.getDefaultConfig();
        
        // Save default config
        this.saveConfig(this.config);
      }
      
      // Replace environment variables in config
      this.replaceEnvVars(this.config);
    } catch (error) {
      console.error(`Error loading config from ${this.configPath}:`, error);
      this.config = this.getDefaultConfig();
    }
  }
  
  private replaceEnvVars(obj: any) {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('${') && obj[key].endsWith('}')) {
        const envVar = obj[key].slice(2, -1);
        obj[key] = process.env[envVar] || '';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.replaceEnvVars(obj[key]);
      }
    }
  }
  
  public getConfig() {
    return this.config;
  }
  
  public getProviderConfig(provider: string) {
    return this.config.providers?.[provider] || {};
  }
  
  public getCacheConfig() {
    return this.config.cache || {};
  }
  
  public getBatchConfig() {
    return this.config.batch || {};
  }
  
  public saveConfig(newConfig: any) {
    this.config = newConfig;
    
    try {
      const yamlStr = yaml.dump(newConfig);
      fs.writeFileSync(this.configPath, yamlStr, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
  
  private getDefaultConfig() {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        cors: {
          enabled: true,
          origins: ['http://localhost:3001']
        },
        rateLimit: {
          enabled: true,
          windowMs: 60000,
          max: 100
        },
        logging: {
          level: 'info',
          format: 'json',
          destination: 'stdout'
        }
      },
      auth: {
        apiKey: {
          enabled: true,
          headerName: 'X-API-Key'
        },
        jwt: {
          enabled: false,
          secret: '',
          expiresIn: '1d'
        }
      },
      cache: {
        enabled: true,
        type: 'memory',
        ttl: 3600,
        redis: {
          host: 'localhost',
          port: 6379,
          password: ''
        },
        memory: {
          maxSize: '1GB'
        },
        similarityCache: {
          enabled: true,
          threshold: 0.92,
          ttl: 1800
        }
      },
      providers: {
        openai: {
          enabled: true,
          apiKey: '${OPENAI_API_KEY}',
          baseUrl: 'https://api.openai.com',
          models: {
            'gpt-4': {
              enabled: true,
              maxTokens: 8192,
              costPerInputToken: 0.00003,
              costPerOutputToken: 0.00006
            },
            'gpt-3.5-turbo': {
              enabled: true,
              maxTokens: 4096,
              costPerInputToken: 0.0000015,
              costPerOutputToken: 0.000002
            }
          }
        },
        anthropic: {
          enabled: true,
          apiKey: '${ANTHROPIC_API_KEY}',
          baseUrl: 'https://api.anthropic.com',
          models: {
            'claude-3-opus': {
              enabled: true,
              maxTokens: 200000,
              costPerInputToken: 0.00001,
              costPerOutputToken: 0.00003
            },
            'claude-3-sonnet': {
              enabled: true,
              maxTokens: 200000,
              costPerInputToken: 0.000003,
              costPerOutputToken: 0.000015
            }
          }
        }
      }
    };
  }
}

export const configManager = new ConfigManager();