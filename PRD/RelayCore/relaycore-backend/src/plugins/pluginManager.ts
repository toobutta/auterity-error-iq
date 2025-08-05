import path from 'path';
import fs from 'fs';
import { Application } from 'express';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';

// Plugin interface
export interface Plugin {
  name: string;
  version: string;
  initialize: (app: Application) => void;
  shutdown?: () => Promise<void>;
}

// Plugin manager class
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsDir: string;
  
  constructor(pluginsDir: string = 'plugins') {
    this.pluginsDir = pluginsDir;
  }
  
  public async loadPlugins(app: Application): Promise<number> {
    try {
      const config = configManager.getConfig();
      
      // Get enabled plugins from config
      const enabledPlugins = config.plugins?.enabled || [];
      
      if (enabledPlugins.length === 0) {
        logger.info('No plugins enabled');
        return 0;
      }
      
      // Create plugins directory if it doesn't exist
      const fullPluginsDir = path.resolve(process.cwd(), this.pluginsDir);
      if (!fs.existsSync(fullPluginsDir)) {
        fs.mkdirSync(fullPluginsDir, { recursive: true });
        logger.info(`Created plugins directory: ${fullPluginsDir}`);
      }
      
      // Load built-in plugins
      for (const pluginName of enabledPlugins) {
        try {
          // Try to load built-in plugin first
          const builtInPluginPath = path.join(__dirname, pluginName);
          
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pluginModule = require(builtInPluginPath);
            
            if (!pluginModule.default) {
              logger.warn(`Plugin ${pluginName} does not export a default export`);
              continue;
            }
            
            const plugin: Plugin = pluginModule.default;
            
            if (!this.validatePlugin(plugin)) {
              logger.warn(`Plugin ${pluginName} is invalid`);
              continue;
            }
            
            // Initialize plugin
            plugin.initialize(app);
            
            // Store plugin reference
            this.plugins.set(plugin.name, plugin);
            
            logger.info(`Loaded built-in plugin: ${plugin.name} v${plugin.version}`);
          } catch (error) {
            // If built-in plugin not found, try external plugin
            const externalPluginPath = path.join(fullPluginsDir, pluginName);
            
            if (!fs.existsSync(externalPluginPath)) {
              logger.warn(`Plugin ${pluginName} not found`);
              continue;
            }
            
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pluginModule = require(externalPluginPath);
            
            if (!pluginModule.default) {
              logger.warn(`Plugin ${pluginName} does not export a default export`);
              continue;
            }
            
            const plugin: Plugin = pluginModule.default;
            
            if (!this.validatePlugin(plugin)) {
              logger.warn(`Plugin ${pluginName} is invalid`);
              continue;
            }
            
            // Initialize plugin
            plugin.initialize(app);
            
            // Store plugin reference
            this.plugins.set(plugin.name, plugin);
            
            logger.info(`Loaded external plugin: ${plugin.name} v${plugin.version}`);
          }
        } catch (error) {
          logger.error(`Error loading plugin ${pluginName}:`, error);
        }
      }
      
      return this.plugins.size;
    } catch (error) {
      logger.error('Error loading plugins:', error);
      return 0;
    }
  }
  
  public async shutdownPlugins(): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      if (plugin.shutdown) {
        try {
          await plugin.shutdown();
          logger.info(`Shutdown plugin: ${name}`);
        } catch (error) {
          logger.error(`Error shutting down plugin ${name}:`, error);
        }
      }
    }
    
    this.plugins.clear();
  }
  
  public getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
  
  public getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  private validatePlugin(plugin: any): boolean {
    if (!plugin.name || typeof plugin.name !== 'string') {
      logger.warn('Plugin missing name property');
      return false;
    }
    
    if (!plugin.version || typeof plugin.version !== 'string') {
      logger.warn(`Plugin ${plugin.name} missing version property`);
      return false;
    }
    
    if (!plugin.initialize || typeof plugin.initialize !== 'function') {
      logger.warn(`Plugin ${plugin.name} missing initialize function`);
      return false;
    }
    
    if (plugin.shutdown && typeof plugin.shutdown !== 'function') {
      logger.warn(`Plugin ${plugin.name} has shutdown property that is not a function`);
      return false;
    }
    
    return true;
  }
}

export const pluginManager = new PluginManager();