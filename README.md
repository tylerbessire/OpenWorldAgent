# 🚀 OpenWorldAgent
**Universal MCP Generator Framework - The 3D Printer for AI Automation**

Transform any website into controllable automation with a single command.

## 🎯 What It Does

Point OpenWorldAgent at any website and it will:

1. **🔍 Analyze Interface** - VisionCraft + YOLO computer vision
2. **🔐 Handle Authentication** - Auto-login/signup with user profile  
3. **🗺️ Map Elements** - Accessibility tree + element detection
4. **🔧 Generate Tools** - Create MCP automation tools dynamically
5. **📦 Build Package** - Complete NPM package with server
6. **⚙️ Deploy Automatically** - Add to Claude Desktop config via AppleScript

**Result:** Instant automation for ANY website!

## 🏗️ Architecture

```
OpenWorldAgent
├── server.js                 # Main MCP server
├── core/
│   ├── orchestrator.js       # Pipeline coordinator
│   ├── vision-analyzer.js    # VisionCraft + YOLO 
│   ├── auth-manager.js       # User auth profile
│   ├── interface-mapper.js   # Element mapping
│   ├── tool-generator.js     # Dynamic tool creation
│   ├── npm-packager.js       # Package builder
│   └── config-updater.js     # AppleScript integration
├── credentials/
│   └── profile.json          # User secure profile
└── generated/                # Generated MCP packages
```

## 🔒 Security & Privacy

- **Environment Variables**: All sensitive data stored in `.env`
- **Local Only**: Your credentials never leave your machine
- **Open Source Safe**: No hardcoded personal information
- **Gitignore Protected**: `.env` and credentials automatically excluded

## 🚀 Installation

1. **Clone and Setup:**
```bash
git clone https://github.com/tylerbessire/OpenWorldAgent.git
cd OpenWorldAgent
npm install
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. **Add to Claude Desktop Config:**
```json
{
  "mcpServers": {
    "openworldagent": {
      "command": "node",
      "args": ["/path/to/OpenWorldAgent/server.js"],
      "env": {}
    }
  }
}
```

4. **Restart Claude Desktop**

5. **Run Tests:**
```bash
npm test
```

## 🎯 Usage

### Generate Automation for Any Website

```javascript
// Point at any website and generate complete automation
generate_automation({
  url: "https://example.com",
  siteName: "example",
  options: {
    skipAuth: false,      // Handle login/signup
    autoDeploy: true      // Auto-add to Claude Desktop
  }
})
```

### Available Tools

- **`generate_automation`** - Main tool: URL → Complete MCP package
- **`analyze_interface`** - Vision analysis only
- **`test_authentication`** - Test login flows
- **`list_generated_packages`** - See created packages
- **`deploy_package`** - Add package to Claude Desktop
- **`get_generator_status`** - System status

## 🔧 Environment Configuration

Create a `.env` file with your credentials:

```bash
USER_EMAIL=your_email@example.com
USER_PASSWORD=your_secure_password
USER_PHONE=555-555-5555
USER_FIRST_NAME=YourFirst
USER_LAST_NAME=YourLast
USER_ADDRESS=123 Example St, City, State, ZIP

# Optional: Override default paths
MCP_BASE_DIR=/path/to/OpenWorldAgent
CLAUDE_CONFIG_PATH=/path/to/claude_desktop_config.json
```

## 🎛️ Tool Stack

**Vision Analysis:**
- VisionCraft (primary)
- YOLO (fallback)
- Sequential Thinking (complex analysis)

**Automation:**
- Playwright (browser control)
- AppleScript (macOS integration)
- Accessibility Tree (element mapping)

**Integration:**
- Auto-config updates
- NPM package generation
- Claude Desktop deployment

## 📦 Generated Package Structure

Each website generates a complete MCP package:

```
example-mcp/
├── package.json          # NPM package config
├── server.js            # MCP server with tools
├── README.md            # Usage instructions
└── Auto-deployed to Claude Desktop
```

## 🔥 Examples

### Generate Music Automation
```javascript
generate_automation({
  url: "https://suno.com",
  siteName: "suno"
})
// → Creates suno-mcp package with music generation tools
```

### Generate GitHub Automation  
```javascript
generate_automation({
  url: "https://github.com",
  siteName: "github"
})
// → Creates github-mcp package with repo management tools
```

### Generate Trading Automation
```javascript
generate_automation({
  url: "https://tradingsite.com",
  siteName: "trading"
})
// → Creates trading-mcp package with buy/sell/analyze tools
```

## 🚀 Revolution Complete

**OpenWorldAgent: The world's first Universal MCP Generator!**

- Point at any website
- Get working automation in minutes
- Control the entire web from Claude Desktop

**The "3D Printer for AI Automation" is operational!** 🔥

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Ensure no credentials are hardcoded
4. Test with `.env.example` 
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

*Created by Tyler Bessire - June 2025*  
*The future of AI automation is here.*
