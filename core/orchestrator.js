/**
 * Universal MCP Generator - Core Orchestrator
 * Coordinates the entire automation generation pipeline
 */

import { chromium } from 'playwright';
import { VisionAnalyzer } from './vision-analyzer.js';
import { AuthManager } from './auth-manager.js';
import { InterfaceMapper } from './interface-mapper.js';
import { ToolGenerator } from './tool-generator.js';
import { NPMPackager } from './npm-packager.js';
import { ConfigUpdater } from './config-updater.js';

export class Orchestrator {
  constructor() {
    this.visionAnalyzer = new VisionAnalyzer();
    this.authManager = new AuthManager();
    this.interfaceMapper = new InterfaceMapper();
    this.toolGenerator = new ToolGenerator();
    this.npmPackager = new NPMPackager();
    this.configUpdater = new ConfigUpdater();
    
    this.browser = null;
    this.page = null;
  }

  /**
   * Main orchestration method - generates complete MCP package
   */
  async generateAutomation(url, siteName, options = {}) {
    const pipeline = {
      url,
      siteName,
      options,
      startTime: Date.now(),
      steps: []
    };

    try {
      // Step 1: Initialize Browser
      await this.log(pipeline, '🌐 Initializing Browser Session...');
      await this.initializeBrowser();

      // Step 2: Navigate to Website  
      await this.log(pipeline, `📍 Navigating to ${url}...`);
      await this.navigateToSite(url);

      // Step 3: Handle Authentication (if not skipped)
      if (!options.skipAuth) {
        await this.log(pipeline, '🔐 Analyzing Authentication Requirements...');
        const authResult = await this.handleAuthentication(url);
        pipeline.authResult = authResult;
      }

      // Step 4: Vision Analysis
      await this.log(pipeline, '👁️ Running Vision Analysis...');
      const visionResult = await this.runVisionAnalysis();
      pipeline.visionResult = visionResult;

      // Step 5: Interface Mapping
      await this.log(pipeline, '🗺️ Mapping Interface Elements...');
      const interfaceMap = await this.mapInterface();
      pipeline.interfaceMap = interfaceMap;

      // Step 6: Generate MCP Tools
      await this.log(pipeline, '🔧 Generating MCP Tools...');
      const tools = await this.generateTools(interfaceMap, visionResult);
      pipeline.tools = tools;

      // Step 7: Create NPM Package
      await this.log(pipeline, '📦 Creating NPM Package...');
      const packageResult = await this.createPackage(siteName, tools, pipeline);
      pipeline.packageResult = packageResult;

      // Step 8: Deploy to Claude Desktop (if enabled)
      if (options.autoDeploy !== false) {
        await this.log(pipeline, '🚀 Deploying to Claude Desktop...');
        const deployResult = await this.deployToClaudeDesktop(siteName, packageResult);
        pipeline.deployResult = deployResult;
      }

      // Success!
      await this.log(pipeline, '✅ Universal MCP Generation Complete!');
      return this.formatSuccess(pipeline);

    } catch (error) {
      await this.log(pipeline, `❌ Pipeline Failed: ${error.message}`);
      return this.formatError(pipeline, error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize Playwright browser with optimal settings
   */
  async initializeBrowser() {
    this.browser = await chromium.launch({
      headless: false, // Show browser for debugging
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--disable-background-timer-throttling',
      ]
    });

    this.page = await this.browser.newPage({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Enable request interception for advanced features
    await this.page.route('**/*', (route) => route.continue());
  }

  /**
   * Navigate to target website with error handling
   */
  async navigateToSite(url) {
    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for page to stabilize
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * Handle authentication flow using AuthManager
   */
  async handleAuthentication(url) {
    return await this.authManager.analyzeAndHandle(this.page, url);
  }

  /**
   * Run vision analysis with VisionCraft → YOLO fallback
   */
  async runVisionAnalysis() {
    // Take screenshot for vision analysis
    const screenshot = await this.page.screenshot({ 
      fullPage: false, // Focus on viewport
      type: 'png' 
    });

    return await this.visionAnalyzer.analyze(screenshot, this.page);
  }

  /**
   * Map interface elements using accessibility tree
   */
  async mapInterface() {
    return await this.interfaceMapper.mapElements(this.page);
  }

  /**
   * Generate MCP tools based on interface analysis
   */
  async generateTools(interfaceMap, visionResult) {
    return await this.toolGenerator.generateFromAnalysis(
      interfaceMap, 
      visionResult,
      this.page.url()
    );
  }

  /**
   * Create complete NPM package
   */
  async createPackage(siteName, tools, pipeline) {
    return await this.npmPackager.createPackage(siteName, tools, pipeline);
  }

  /**
   * Deploy to Claude Desktop using AppleScript
   */
  async deployToClaudeDesktop(siteName, packageResult) {
    return await this.configUpdater.addToClaudeDesktop(siteName, packageResult);
  }

  /**
   * Log pipeline step with timestamp
   */
  async log(pipeline, message) {
    const timestamp = new Date().toLocaleTimeString();
    const step = {
      timestamp,
      message,
      elapsed: Date.now() - pipeline.startTime
    };
    
    pipeline.steps.push(step);
    console.error(`[${timestamp}] ${message}`);
  }

  /**
   * Format successful pipeline result
   */
  formatSuccess(pipeline) {
    const elapsed = Date.now() - pipeline.startTime;
    
    return {
      success: true,
      siteName: pipeline.siteName,
      url: pipeline.url,
      elapsed: `${elapsed}ms`,
      steps: pipeline.steps,
      tools: pipeline.tools?.length || 0,
      packagePath: pipeline.packageResult?.path,
      deployed: !!pipeline.deployResult?.success,
      summary: `✅ Successfully generated MCP automation for ${pipeline.siteName} in ${elapsed}ms`
    };
  }

  /**
   * Format error result with debugging info
   */
  formatError(pipeline, error) {
    return {
      success: false,
      error: error.message,
      siteName: pipeline.siteName,
      url: pipeline.url,
      steps: pipeline.steps,
      failedAt: pipeline.steps[pipeline.steps.length - 1]?.message || 'Unknown'
    };
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
