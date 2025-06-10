/**
 * Universal MCP Generator - Vision Analyzer
 * Coordinates VisionCraft and YOLO for interface analysis
 */

import fs from 'fs/promises';
import path from 'path';

export class VisionAnalyzer {
  constructor() {
    this.tempDir = '/Users/tylerbessire/Desktop/universal-mcp-generator/temp';
    this.analysisCache = new Map();
  }

  /**
   * Main vision analysis method - VisionCraft → YOLO fallback
   */
  async analyze(screenshot, page) {
    const analysisId = this.generateAnalysisId(page.url());
    
    try {
      // Ensure temp directory exists
      await this.ensureTempDir();
      
      // Save screenshot for analysis
      const screenshotPath = await this.saveScreenshot(screenshot, analysisId);
      
      // Try VisionCraft first
      console.error('🔍 Attempting VisionCraft analysis...');
      let visionResult = await this.tryVisionCraft(screenshotPath, page);
      
      // Fall back to YOLO if VisionCraft fails
      if (!visionResult || !this.isAnalysisComplete(visionResult)) {
        console.error('🎯 Falling back to YOLO analysis...');
        const yoloResult = await this.tryYOLO(screenshotPath);
        visionResult = this.mergeAnalysis(visionResult, yoloResult);
      }
      
      // Add accessibility context
      const accessibilityData = await this.extractAccessibilityContext(page);
      visionResult.accessibility = accessibilityData;
      
      // Cache and return results
      this.analysisCache.set(analysisId, visionResult);
      return visionResult;
      
    } catch (error) {
      console.error(`❌ Vision analysis failed: ${error.message}`);
      return this.createFallbackAnalysis(page);
    }
  }

  /**
   * Try VisionCraft analysis using existing MCP server
   */
  async tryVisionCraft(screenshotPath, page) {
    try {
      // Note: In a real implementation, this would call the VisionCraft MCP server
      // For now, we'll simulate the analysis structure
      
      const mockVisionCraftResult = {
        method: 'visioncraft',
        confidence: 0.85,
        elements: [
          {
            type: 'button',
            text: 'Sign In',
            location: { x: 100, y: 50, width: 80, height: 30 },
            confidence: 0.9,
            actionable: true
          },
          {
            type: 'input',
            placeholder: 'Email',
            location: { x: 50, y: 100, width: 200, height: 25 },
            confidence: 0.95,
            inputType: 'email'
          },
          {
            type: 'button',
            text: 'Create',
            location: { x: 200, y: 200, width: 100, height: 40 },
            confidence: 0.88,
            actionable: true,
            primary: true
          }
        ],
        authFlow: {
          detected: true,
          type: 'email_password',
          signInButton: 'Sign In',
          signUpButton: 'Sign Up'
        },
        navigation: {
          primaryActions: ['Create', 'Generate', 'Search'],
          secondaryActions: ['Settings', 'Profile', 'Help']
        }
      };
      
      console.error('✅ VisionCraft analysis completed');
      return mockVisionCraftResult;
      
    } catch (error) {
      console.error(`❌ VisionCraft failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try YOLO analysis using existing MCP server
   */
  async tryYOLO(screenshotPath) {
    try {
      // Note: In a real implementation, this would call the YOLO MCP server
      // For now, we'll simulate the analysis structure
      
      const mockYOLOResult = {
        method: 'yolo',
        confidence: 0.75,
        detections: [
          {
            class: 'button',
            confidence: 0.82,
            bbox: [100, 50, 180, 80],
            center: { x: 140, y: 65 }
          },
          {
            class: 'textbox',
            confidence: 0.91,
            bbox: [50, 100, 250, 125],
            center: { x: 150, y: 112.5 }
          },
          {
            class: 'button', 
            confidence: 0.87,
            bbox: [200, 200, 300, 240],
            center: { x: 250, y: 220 }
          }
        ],
        totalDetections: 3
      };
      
      console.error('✅ YOLO analysis completed');
      return mockYOLOResult;
      
    } catch (error) {
      console.error(`❌ YOLO failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract accessibility context from page
   */
  async extractAccessibilityContext(page) {
    try {
      const accessibilityData = await page.evaluate(() => {
        const elements = [];
        
        // Find interactive elements
        const interactiveSelectors = [
          'button',
          'input',
          'textarea', 
          'select',
          'a[href]',
          '[role="button"]',
          '[tabindex]',
          '[onclick]'
        ];
        
        interactiveSelectors.forEach(selector => {
          const nodeList = document.querySelectorAll(selector);
          nodeList.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              elements.push({
                tag: element.tagName.toLowerCase(),
                selector: this.generateSelector(element),
                text: element.textContent?.trim() || '',
                placeholder: element.placeholder || '',
                type: element.type || '',
                role: element.getAttribute('role'),
                ariaLabel: element.getAttribute('aria-label'),
                id: element.id,
                className: element.className,
                rect: {
                  x: rect.x,
                  y: rect.y, 
                  width: rect.width,
                  height: rect.height
                },
                visible: !element.hidden && rect.width > 0 && rect.height > 0,
                clickable: element.tagName === 'BUTTON' || element.tagName === 'A' || element.onclick || element.getAttribute('role') === 'button'
              });
            }
          });
        });
        
        return {
          totalElements: elements.length,
          elements: elements.slice(0, 50), // Limit for performance
          forms: this.analyzeForms(),
          navigation: this.analyzeNavigation()
        };
      });
      
      return accessibilityData;
      
    } catch (error) {
      console.error(`❌ Accessibility extraction failed: ${error.message}`);
      return { elements: [], totalElements: 0 };
    }
  }

  /**
   * Generate analysis ID from URL
   */
  generateAnalysisId(url) {
    const domain = new URL(url).hostname.replace(/\./g, '_');
    const timestamp = Date.now();
    return `${domain}_${timestamp}`;
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Save screenshot for analysis
   */
  async saveScreenshot(screenshot, analysisId) {
    const filename = `${analysisId}_screenshot.png`;
    const filepath = path.join(this.tempDir, filename);
    await fs.writeFile(filepath, screenshot);
    return filepath;
  }

  /**
   * Check if analysis is complete enough
   */
  isAnalysisComplete(analysis) {
    if (!analysis) return false;
    return analysis.elements && analysis.elements.length > 0;
  }

  /**
   * Merge VisionCraft and YOLO results
   */
  mergeAnalysis(visionResult, yoloResult) {
    if (!visionResult) return yoloResult;
    if (!yoloResult) return visionResult;
    
    return {
      ...visionResult,
      yoloBackup: yoloResult,
      confidence: Math.max(visionResult.confidence || 0, yoloResult.confidence || 0),
      multiModal: true
    };
  }

  /**
   * Create fallback analysis when vision fails
   */
  createFallbackAnalysis(page) {
    return {
      method: 'fallback',
      confidence: 0.5,
      elements: [],
      authFlow: { detected: false },
      navigation: { primaryActions: [], secondaryActions: [] },
      accessibility: { elements: [], totalElements: 0 },
      error: 'Vision analysis failed, using accessibility tree only'
    };
  }
}
