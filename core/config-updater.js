/**
 * Universal MCP Generator - Config Updater
 * Updates Claude Desktop config using AppleScript
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export class ConfigUpdater {
  constructor(config = {}) {
    this.configPath = config.configPath || process.env.CLAUDE_CONFIG_PATH ||
      path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
  }

  /**
   * Add generated package to Claude Desktop config
   */
  async addToClaudeDesktop(siteName, packageResult) {
    try {
      console.error('🔧 Updating Claude Desktop config...');

      // Read current config
      const currentConfig = await this.readCurrentConfig();
      
      // Add new MCP server
      const newServerConfig = {
        command: 'node',
        args: [packageResult.serverPath],
        env: {}
      };

      currentConfig.mcpServers = currentConfig.mcpServers || {};
      currentConfig.mcpServers[`${siteName}-automation`] = newServerConfig;

      // Write updated config using AppleScript
      await this.writeConfigViaAppleScript(currentConfig);

      console.error(`✅ Added ${siteName}-automation to Claude Desktop config`);

      return {
        success: true,
        serverName: `${siteName}-automation`,
        configPath: this.configPath,
        requiresRestart: true
      };

    } catch (error) {
      console.error(`❌ Config update failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Read current Claude Desktop config
   */
  async readCurrentConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      // Return default config if file doesn't exist
      return { mcpServers: {} };
    }
  }

  /**
   * Write config using AppleScript (bypasses file permission issues)
   */
  async writeConfigViaAppleScript(config) {
    // In a real implementation, this would use AppleScript to write the file
    // For now, we'll use direct file writing
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.error('✅ Config updated successfully');
    } catch (error) {
      console.error(`❌ Failed to write config: ${error.message}`);
      throw error;
    }
  }
}
