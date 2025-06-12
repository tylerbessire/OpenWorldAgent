/**
 * Universal MCP Generator - Interface Mapper
 * Maps interface elements to actionable automation tools
 */

export class InterfaceMapper {
  constructor() {
    this.elementTypes = {
      button: 'clickable',
      input: 'fillable', 
      textarea: 'fillable',
      select: 'selectable',
      a: 'navigable',
      form: 'submittable'
    };
  }

  /**
   * Map all interactive elements on the page
   */
  async mapElements(page) {
    try {
      const elementMap = await page.evaluate(() => {
        const generateOptimalSelector = (el) => {
          if (el.id) return `#${el.id}`;
          if (el.className) {
            const cls = el.className.trim().split(/\s+/).join('.');
            return `${el.tagName.toLowerCase()}.${cls}`;
          }
          return el.tagName.toLowerCase();
        };

        const mapForms = () => Array.from(document.forms).length;

        const mapNavigation = () => Array.from(document.querySelectorAll('a[href]')).map(a => a.href);

        const identifyPrimaryActions = (els) => els.filter(e => e.isClickable).slice(0, 5).map(e => e.text);

        const elements = [];
        const elementId = (element, index) =>
          element.id || element.className.split(' ')[0] || `element_${index}`;

        const interactiveElements = document.querySelectorAll([
          'button', 'input', 'textarea', 'select', 'a[href]',
          '[role="button"]', '[onclick]', '[tabindex]'
        ].join(','));

        interactiveElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const elData = {
              id: elementId(element, index),
              tag: element.tagName.toLowerCase(),
              type: element.type || 'unknown',
              text: element.textContent?.trim().substring(0, 100) || '',
              placeholder: element.placeholder || '',
              value: element.value || '',
              href: element.href || '',
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              attributes: {
                id: element.id,
                className: element.className,
                name: element.name,
                role: element.getAttribute('role'),
                ariaLabel: element.getAttribute('aria-label'),
                dataTestId: element.getAttribute('data-testid')
              },
              parent: element.parentElement?.tagName?.toLowerCase(),
              isVisible: !element.hidden && rect.width > 0 && rect.height > 0,
              isClickable: ['button', 'a'].includes(element.tagName.toLowerCase()) ||
                          element.onclick || element.getAttribute('role') === 'button'
            };
            elData.selector = generateOptimalSelector(element);
            elements.push(elData);
          }
        });

        return {
          elements,
          totalElements: elements.length,
          forms: mapForms(),
          navigation: mapNavigation(),
          primaryActions: identifyPrimaryActions(elements)
        };
      });

      // Categorize elements by functionality
      return this.categorizeElements(elementMap);

    } catch (error) {
      console.error(`❌ Interface mapping failed: ${error.message}`);
      return { elements: [], categories: {} };
    }
  }

  /**
   * Categorize elements by their automation potential
   */
  categorizeElements(elementMap) {
    const categories = {
      authentication: [],
      navigation: [],
      forms: [],
      actions: [],
      content: []
    };

    elementMap.elements.forEach(element => {
      // Authentication elements
      if (this.isAuthElement(element)) {
        categories.authentication.push(element);
      }
      // Navigation elements  
      else if (this.isNavigationElement(element)) {
        categories.navigation.push(element);
      }
      // Form elements
      else if (this.isFormElement(element)) {
        categories.forms.push(element);
      }
      // Action elements
      else if (this.isActionElement(element)) {
        categories.actions.push(element);
      }
      // Content elements
      else {
        categories.content.push(element);
      }
    });

    return {
      ...elementMap,
      categories,
      automationPotential: this.assessAutomationPotential(categories)
    };
  }

  /**
   * Check if element is authentication-related
   */
  isAuthElement(element) {
    const authKeywords = ['login', 'signin', 'signup', 'password', 'email', 'register', 'auth'];
    const text = (element.text + element.placeholder + element.attributes.id + element.attributes.className).toLowerCase();
    return authKeywords.some(keyword => text.includes(keyword)) || element.type === 'password';
  }

  /**
   * Check if element is navigation-related
   */
  isNavigationElement(element) {
    const navKeywords = ['home', 'about', 'contact', 'menu', 'nav', 'link'];
    const text = (element.text + element.href + element.attributes.className).toLowerCase();
    return element.tag === 'a' || navKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check if element is form-related
   */
  isFormElement(element) {
    return ['input', 'textarea', 'select'].includes(element.tag) && !this.isAuthElement(element);
  }

  /**
   * Check if element is action-related
   */
  isActionElement(element) {
    const actionKeywords = ['create', 'generate', 'submit', 'send', 'save', 'delete', 'edit', 'update'];
    const text = (element.text + element.attributes.ariaLabel).toLowerCase();
    return element.tag === 'button' || actionKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Assess automation potential of categorized elements
   */
  assessAutomationPotential(categories) {
    return {
      score: Math.min(100, (Object.values(categories).flat().length * 10)),
      hasAuth: categories.authentication.length > 0,
      hasActions: categories.actions.length > 0,
      hasForms: categories.forms.length > 0,
      hasNavigation: categories.navigation.length > 0,
      totalInteractiveElements: Object.values(categories).flat().length
    };
  }
}

/**
 * Universal MCP Generator - Tool Generator  
 * Creates MCP tool definitions from interface analysis
 */
export class ToolGenerator {
  constructor() {
    this.toolTemplates = {
      click: 'click_element',
      fill: 'fill_field', 
      select: 'select_option',
      navigate: 'navigate_to',
      submit: 'submit_form',
      screenshot: 'take_screenshot',
      status: 'get_status'
    };
  }

  /**
   * Generate MCP tools from interface analysis
   */
  async generateFromAnalysis(interfaceMap, visionResult, url) {
    const tools = [];
    const siteName = this.extractSiteName(url);

    // Always add base tools
    tools.push(...this.generateBaseTools(siteName));

    // Generate tools from interface categories
    Object.entries(interfaceMap.categories).forEach(([category, elements]) => {
      tools.push(...this.generateCategoryTools(category, elements, siteName));
    });

    // Generate tools from vision analysis
    if (visionResult && visionResult.elements) {
      tools.push(...this.generateVisionTools(visionResult, siteName));
    }

    return {
      tools,
      totalTools: tools.length,
      categories: Object.keys(interfaceMap.categories),
      metadata: {
        url,
        siteName, 
        generatedAt: new Date().toISOString(),
        interfaceElements: interfaceMap.totalElements
      }
    };
  }

  /**
   * Generate base tools every site needs
   */
  generateBaseTools(siteName) {
    return [
      {
        name: `${siteName}_initialize`,
        description: `Initialize browser session and navigate to ${siteName}`,
        inputSchema: {
          type: 'object',
          properties: {
            headless: { type: 'boolean', default: false }
          }
        },
        implementation: 'navigate_and_initialize'
      },
      {
        name: `${siteName}_screenshot`,
        description: `Take screenshot of ${siteName} page`,
        inputSchema: {
          type: 'object', 
          properties: {
            filename: { type: 'string', default: `${siteName}_screenshot.png` }
          }
        },
        implementation: 'take_screenshot'
      },
      {
        name: `${siteName}_get_status`,
        description: `Get current status and page information`,
        inputSchema: { type: 'object', properties: {} },
        implementation: 'get_page_status'
      }
    ];
  }

  /**
   * Generate tools for specific element categories
   */
  generateCategoryTools(category, elements, siteName) {
    const tools = [];

    switch (category) {
      case 'authentication':
        tools.push(...this.generateAuthTools(elements, siteName));
        break;
      case 'actions':
        tools.push(...this.generateActionTools(elements, siteName));
        break;
      case 'forms':
        tools.push(...this.generateFormTools(elements, siteName));
        break;
      case 'navigation':
        tools.push(...this.generateNavigationTools(elements, siteName));
        break;
    }

    return tools;
  }

  /**
   * Generate authentication tools
   */
  generateAuthTools(elements, siteName) {
    const tools = [];
    
    // Login tool
    if (elements.some(el => el.text.toLowerCase().includes('login') || el.text.toLowerCase().includes('signin'))) {
      tools.push({
        name: `${siteName}_login`,
        description: `Login to ${siteName} with credentials`,
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Email address' },
            password: { type: 'string', description: 'Password' }
          },
          required: ['email', 'password']
        },
        implementation: 'handle_login'
      });
    }

    // Signup tool
    if (elements.some(el => el.text.toLowerCase().includes('signup') || el.text.toLowerCase().includes('register'))) {
      tools.push({
        name: `${siteName}_signup`,
        description: `Create new account on ${siteName}`,
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          },
          required: ['email', 'password']
        },
        implementation: 'handle_signup'
      });
    }

    return tools;
  }

  /**
   * Generate action tools
   */
  generateActionTools(elements, siteName) {
    const tools = [];

    elements.forEach(element => {
      if (element.isClickable && element.text) {
        const actionName = this.sanitizeName(element.text.toLowerCase());
        tools.push({
          name: `${siteName}_${actionName}`,
          description: `${element.text} action on ${siteName}`,
          inputSchema: {
            type: 'object',
            properties: {
              options: { type: 'object', default: {} }
            }
          },
          implementation: 'click_element',
          selector: element.selector,
          element: element
        });
      }
    });

    return tools.slice(0, 10); // Limit to prevent too many tools
  }

  /**
   * Generate form tools
   */
  generateFormTools(elements, siteName) {
    const tools = [];

    // Group form elements
    const formGroups = this.groupFormElements(elements);
    
    formGroups.forEach((group, index) => {
      tools.push({
        name: `${siteName}_fill_form_${index + 1}`,
        description: `Fill form ${index + 1} on ${siteName}`,
        inputSchema: {
          type: 'object',
          properties: this.generateFormSchema(group)
        },
        implementation: 'fill_form',
        formElements: group
      });
    });

    return tools;
  }

  /**
   * Generate navigation tools
   */
  generateNavigationTools(elements, siteName) {
    const tools = [];

    elements.forEach(element => {
      if (element.href && element.text) {
        const navName = this.sanitizeName(element.text);
        tools.push({
          name: `${siteName}_goto_${navName}`,
          description: `Navigate to ${element.text} on ${siteName}`,
          inputSchema: { type: 'object', properties: {} },
          implementation: 'navigate_to',
          href: element.href,
          element: element
        });
      }
    });

    return tools.slice(0, 5); // Limit navigation tools
  }

  /**
   * Generate tools from vision analysis
   */
  generateVisionTools(visionResult, siteName) {
    const tools = [];

    if (visionResult.authFlow?.detected) {
      tools.push({
        name: `${siteName}_vision_auth`,
        description: `Handle authentication using vision-detected elements`,
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['login', 'signup'], default: 'login' }
          }
        },
        implementation: 'vision_based_auth',
        visionData: visionResult.authFlow
      });
    }

    return tools;
  }

  /**
   * Extract site name from URL
   */
  extractSiteName(url) {
    try {
      return new URL(url).hostname.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    } catch {
      return 'site';
    }
  }

  /**
   * Sanitize name for tool generation
   */
  sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  }

  /**
   * Group related form elements
   */
  groupFormElements(elements) {
    // Simple grouping - in practice this would be more sophisticated
    return [elements];
  }

  /**
   * Generate form schema from elements
   */
  generateFormSchema(elements) {
    const schema = {};
    
    elements.forEach(element => {
      if (element.placeholder || element.attributes.name) {
        const fieldName = element.attributes.name || this.sanitizeName(element.placeholder);
        schema[fieldName] = {
          type: 'string',
          description: element.placeholder || `${fieldName} field`
        };
      }
    });

    return schema;
  }
}
