/**
 * OpenWorldAgent - Authentication Manager
 * Handles user credentials and authentication flows securely
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export class AuthManager {
  constructor(config = {}) {
    this.profilePath = config.profilePath || path.join(process.cwd(), 'credentials/profile.json');
    this.profile = null;
    this.otpRetries = 3;
    this.otpTimeout = 60000; // 60 seconds
    this.env = process.env;
  }

  /**
   * Initialize user authentication profile from environment variables
   */
  async initializeProfile() {
    if (this.profile) return this.profile;

    try {
      // Try to load existing profile
      const profileData = await fs.readFile(this.profilePath, 'utf8');
      this.profile = JSON.parse(profileData);
    } catch (error) {
      // Create new profile with user's information from environment
      this.profile = {
        personal: {
          firstName: this.env.USER_FIRST_NAME || 'User',
          lastName: this.env.USER_LAST_NAME || 'Name',
          email: this.env.USER_EMAIL || 'user@example.com',
          phone: this.env.USER_PHONE || '555-555-5555',
          address: this.env.USER_ADDRESS || '123 Example St, City, State, ZIP'
        },
        credentials: {
          primary: {
            email: this.env.USER_EMAIL || 'user@example.com',
            password: this.env.USER_PASSWORD || 'secure_password'
          },
          variations: [
            this.env.USER_EMAIL || 'user@example.com'
          ]
        },
        preferences: {
          preferGoogleSSO: true,
          autoCreateAccounts: true,
          rememberPasswords: true
        },
        sessions: {}
      };

      // Save profile
      await this.saveProfile();
    }

    return this.profile;
  }

  async analyzeAndHandle(page, url) {
    await this.initializeProfile();
    
    const domain = new URL(url).hostname;
    console.error(`🔐 Analyzing authentication for ${domain}...`);

    try {
      const loginStatus = await this.checkLoginStatus(page);
      if (loginStatus.loggedIn) {
        console.error('✅ Already authenticated');
        return { success: true, action: 'already_logged_in', ...loginStatus };
      }

      const authForms = await this.detectAuthenticationForms(page);
      
      if (!authForms.hasAuth) {
        console.error('ℹ️ No authentication required');
        return { success: true, action: 'no_auth_required' };
      }

      if (authForms.hasGoogleSSO && this.profile.preferences.preferGoogleSSO) {
        return await this.handleGoogleSSO(page, authForms);
      } else if (authForms.hasEmailPassword) {
        return await this.handleEmailPasswordAuth(page, authForms);
      } else {
        console.error('⚠️ Unsupported authentication method');
        return { success: false, error: 'Unsupported authentication method' };
      }

    } catch (error) {
      console.error(`❌ Authentication failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async checkLoginStatus(page) {
    try {
      const indicators = await page.evaluate(() => {
        const loginIndicators = [
          'a[href*="logout"]',
          'button[onclick*="logout"]', 
          'a[href*="profile"]',
          'a[href*="account"]',
          'a[href*="dashboard"]',
          '[data-testid="user-menu"]',
          '.user-avatar',
          '.profile-menu'
        ];

        const loggedInElements = loginIndicators.some(selector => 
          document.querySelector(selector)
        );

        const loginForms = document.querySelectorAll([
          'form[action*="login"]',
          'input[type="password"]',
          'button:contains("Sign In")',
          'button:contains("Log In")'
        ].join(','));

        return {
          hasLoggedInIndicators: loggedInElements,
          hasLoginForms: loginForms.length > 0,
          url: window.location.href
        };
      });

      const loggedIn = indicators.hasLoggedInIndicators && !indicators.hasLoginForms;
      
      return {
        loggedIn,
        confidence: loggedIn ? 0.8 : 0.9,
        indicators
      };

    } catch (error) {
      return { loggedIn: false, error: error.message };
    }
  }

  async saveProfile() {
    try {
      await fs.mkdir(path.dirname(this.profilePath), { recursive: true });
      await fs.writeFile(this.profilePath, JSON.stringify(this.profile, null, 2));
    } catch (error) {
      console.error(`❌ Failed to save profile: ${error.message}`);
    }
  }
}
