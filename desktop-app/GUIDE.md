# FlightForge Desktop App - Complete Guide

## 🎯 Overview

The FlightForge Desktop App transforms the web-based airline simulation into a native desktop application using Electron. This provides a seamless, offline-capable gaming experience with system integration.

## 🏗️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON DESKTOP APP                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  IPC  ┌──────────────────────────────┐ │
│  │   Main Process │◄─────►│     Renderer Process         │ │
│  │                │       │   (Web UI - airline-web)     │ │
│  │ • Window Mgmt  │       │                              │ │
│  │ • System Tray  │       │ • jQuery/Angular Frontend    │ │
│  │ • Menus        │       │ • Game Interface             │ │
│  │ • IPC Handler  │       │ • Maps, Charts               │ │
│  └────────┬───────┘       └──────────────────────────────┘ │
│           │                                                  │
│           │ Controls                                         │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Backend Manager (Node.js)                    │  │
│  │                                                        │  │
│  │  ┌─────────────────┐     ┌──────────────────────┐   │  │
│  │  │  airline-web    │     │   airline-data       │   │  │
│  │  │  (Play Server)  │     │   (Simulation)       │   │  │
│  │  │  Port 9000      │     │                      │   │  │
│  │  │                 │     │  • MainSimulation    │   │  │
│  │  │  • REST API     │     │  • Game Cycles       │   │  │
│  │  │  • Controllers  │     │  • Bot AI            │   │  │
│  │  │  • Routes       │     │  • Demand Sim        │   │  │
│  │  └─────────────────┘     └──────────────────────┘   │  │
│  │           │                         │                 │  │
│  │           └─────────┬───────────────┘                 │  │
│  └─────────────────────┼─────────────────────────────────┘  │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         ▼
                  ┌────────────┐
                  │   MySQL    │
                  │  Database  │
                  └────────────┘
```

### Process Lifecycle

1. **User launches app** → Electron main process starts
2. **Main process initializes**:
   - Creates browser window (hidden)
   - Sets up system tray
   - Initializes backend manager
   - Loads configuration
3. **Backend starts** (if auto-start enabled):
   - Spawns airline-web process (SBT or staged JAR)
   - Waits for server to be ready
   - Loads game UI in browser window
4. **User interaction**:
   - Game UI communicates with backend via HTTP
   - Electron UI controls backend via IPC
5. **Simulation** (optional):
   - Spawns separate airline-data process
   - Runs game cycles independently
6. **Shutdown**:
   - Gracefully stops all backend processes
   - Saves window state
   - Cleans up resources

## 📁 File Structure

```
desktop-app/
├── package.json              # Electron app configuration
├── build.sh                  # Build script for packaging
├── dev.sh                    # Development mode runner
├── README.md                 # User documentation
├── GUIDE.md                  # This file - developer guide
│
├── src/
│   ├── main.js              # Electron main process
│   │                        # - Window management
│   │                        # - System tray
│   │                        # - Application menu
│   │                        # - IPC handlers
│   │
│   └── backend-manager.js   # Backend lifecycle manager
│                            # - Start/stop web server
│                            # - Start/stop simulation
│                            # - Process monitoring
│                            # - Log capture
│
├── preload.js               # IPC bridge (security layer)
│                            # - Exposes safe APIs to renderer
│                            # - No direct Node.js access
│
├── build/                   # Build resources
│   ├── icon.png            # Linux icon
│   ├── icon.ico            # Windows icon
│   ├── icon.icns           # macOS icon
│   ├── tray-icon.png       # System tray icon
│   ├── entitlements.mac.plist  # macOS code signing
│   └── README.md           # Icon creation guide
│
├── logs/                    # Application logs
│   └── .gitkeep
│
└── dist/                    # Build output (generated)
    ├── MyFly Club.app      # macOS application
    ├── MyFly Club.exe      # Windows installer
    └── MyFly-Club.AppImage # Linux portable
```

## 🔧 Development Setup

### Prerequisites

**Required:**
- Node.js 18+ and npm
- Java 11+ (OpenJDK)
- SBT (Scala Build Tool)
- MySQL 8

**Optional:**
- Elasticsearch 7 (for flight search)
- Google Maps API key (for maps)

### Initial Setup

```bash
# 1. Clone the repository (if not already done)
git clone <repo-url>
cd airline

# 2. Set up the database
mysql -u root -p
> CREATE DATABASE airline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
> GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;

# 3. Initialize the database schema
cd airline-data
export SBT_OPTS="-Xms2g -Xmx8g"
sbt run
# Select option 1: MainInit (this will take 10-15 minutes)

# 4. Build backend for first time
cd airline-data
sbt publishLocal

cd ../airline-web
sbt stage

# 5. Set up desktop app
cd ../desktop-app
npm install
```

### Running in Development

**Option 1: Development Mode (Recommended)**
```bash
cd desktop-app
./dev.sh
# or
npm run dev
```

This enables:
- Live reload on code changes
- Developer tools auto-open
- Verbose logging
- Uses local Scala source code

**Option 2: Production Mode**
```bash
cd desktop-app
npm start
```

Uses staged/compiled backend files.

### Development Workflow

**Making Changes:**

1. **Electron Code (JavaScript)**:
   - Edit files in `desktop-app/src/`
   - Restart the app to see changes
   - In dev mode, Electron will auto-reload

2. **Backend Code (Scala)**:
   ```bash
   # If you changed airline-data
   cd airline-data
   sbt publishLocal
   
   # If you changed airline-web
   cd airline-web
   sbt stage
   
   # Restart desktop app
   cd ../desktop-app
   npm start
   ```

3. **Frontend Code (JS/CSS in airline-web)**:
   - Changes to `airline-web/public/` files
   - Just refresh the window (Cmd/Ctrl+R)
   - No rebuild needed

## 🔌 IPC Communication

The app uses Electron's IPC for secure communication between processes.

### Available APIs (Exposed to Renderer)

```javascript
// In the renderer process (web UI), you can access:

// Backend control
await window.electronAPI.backend.start();
await window.electronAPI.backend.stop();
const status = await window.electronAPI.backend.status();

// Simulation control
await window.electronAPI.simulation.start();
await window.electronAPI.simulation.stop();

// Configuration
const value = await window.electronAPI.config.get('backendPort');
await window.electronAPI.config.set('backendPort', 9001);
const allConfig = await window.electronAPI.config.getAll();

// System info
const platform = window.electronAPI.platform;
const versions = window.electronAPI.versions;
```

### Adding New IPC Channels

1. **In main.js**, add IPC handler:
```javascript
ipcMain.handle('myFeature:action', async (event, arg) => {
  // Handle the action
  return result;
});
```

2. **In preload.js**, expose to renderer:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  myFeature: {
    action: (arg) => ipcRenderer.invoke('myFeature:action', arg)
  }
});
```

3. **In renderer**, use the API:
```javascript
const result = await window.electronAPI.myFeature.action(arg);
```

## 🛠️ Backend Manager

The `BackendManager` class handles all Scala backend processes.

### Key Methods

```javascript
// Start the web server
await backendManager.startWeb();

// Start the simulation
await backendManager.startSimulation();

// Stop processes
await backendManager.stopWeb();
await backendManager.stopSimulation();
await backendManager.stopAll();

// Get status
const status = backendManager.getStatus();
// Returns: { web: { running: true, pid: 12345 }, simulation: { ... } }

// Initialize database
await backendManager.initDatabase();
```

### Process Management

**Development Mode:**
- Uses `sbt run` to launch processes
- Allows live Scala code changes
- Longer startup time

**Production Mode:**
- Uses staged JAR files
- Faster startup
- No SBT dependency

### Log Handling

All backend output is captured and logged:
- `stdout` → info level
- `stderr` → warn level
- Logs stored in app data directory

## 📦 Building & Packaging

### Build Process

The `build.sh` script automates the entire process:

```bash
# Build for current platform
./build.sh

# Build for specific platform
./build.sh mac
./build.sh win
./build.sh linux
```

**What happens during build:**

1. **Backend Build** (20-30 minutes):
   - Compiles airline-data with SBT
   - Publishes to local ivy repository
   - Stages airline-web (creates runnable distribution)

2. **Frontend Build** (2-5 minutes):
   - Installs npm dependencies
   - Bundles Electron app
   - Copies backend artifacts to `extraResources`
   - Creates platform-specific installer

3. **Output**:
   - `dist/MyFly Club.app` (macOS)
   - `dist/MyFly Club Setup.exe` (Windows)
   - `dist/MyFly-Club.AppImage` (Linux)

### Package Size

- **macOS DMG**: ~150-200 MB
- **Windows Installer**: ~100-150 MB
- **Linux AppImage**: ~120-170 MB

Size includes:
- Electron runtime (~80 MB)
- Backend JARs (~50-80 MB)
- Data files (CSV, configs)
- Dependencies

### Reducing Size

To minimize package size:

1. **Remove unused JARs**:
   - Clean SBT cache before building
   - Only include necessary dependencies

2. **Compress assets**:
   - Use electron-builder's compression
   - Minify JavaScript if needed

3. **Separate architecture builds**:
   - Build for specific CPU architectures
   - Don't bundle universal binaries

## 🔒 Security Considerations

### Context Isolation

The app uses Electron's context isolation for security:
- Renderer process has NO direct access to Node.js
- All communication via IPC through preload script
- Prevents XSS attacks from compromising the system

### External Links

External URLs open in the default browser, not in the app:
```javascript
// Automatically handled in main.js
this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  if (url.startsWith('http')) {
    shell.openExternal(url);
    return { action: 'deny' };
  }
});
```

### Code Signing

**macOS:**
- Requires Apple Developer ID
- Set `APPLE_ID` and `APPLE_PASSWORD` env vars
- App will be notarized automatically

**Windows:**
- Requires code signing certificate
- Configure in `package.json`
- Users may see SmartScreen warning without signature

## 🐛 Debugging

### Electron DevTools

**Enable DevTools:**
```bash
# In dev mode (automatic)
npm run dev

# In production mode
# View → Toggle Developer Tools
# Or press Cmd/Ctrl+Option+I
```

### Backend Logs

**View from app:**
- Menu: Backend → View Logs
- Opens logs directory in file manager

**View from terminal:**
```bash
# macOS
tail -f ~/Library/Logs/airline-game-desktop/main.log

# Linux
tail -f ~/.config/airline-game-desktop/logs/main.log

# Windows
type %USERPROFILE%\AppData\Roaming\airline-game-desktop\logs\main.log
```

### Common Issues

**Backend won't start:**
```bash
# Check Java
java -version  # Should be 11+

# Check SBT
sbt about

# Try manual start
cd airline-web
sbt run
```

**Port conflicts:**
```bash
# Check what's using port 9000
lsof -i :9000  # macOS/Linux
netstat -ano | findstr :9000  # Windows

# Change port in app config
# Or kill the conflicting process
```

**Database errors:**
```bash
# Verify MySQL is running
mysql -u mfc01 -p

# Check database exists
SHOW DATABASES;

# Re-initialize if needed
cd airline-data
sbt run  # Select MainInit
```

## 🚀 Distribution

### Code Signing

**macOS:**
```bash
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"
npm run build:mac
```

**Windows:**
```bash
# Install certificate
# Update package.json with certificate details
npm run build:win
```

### Auto-Updates

To enable auto-updates (optional):

1. Set up update server (e.g., GitHub Releases)
2. Configure `electron-updater` in main.js
3. Add update checking logic
4. Build with update URLs

### Release Checklist

- [ ] Update version in `package.json`
- [ ] Test on all target platforms
- [ ] Verify database initialization
- [ ] Check log outputs
- [ ] Test auto-start features
- [ ] Verify system tray works
- [ ] Test quit/cleanup
- [ ] Build signed releases
- [ ] Create release notes
- [ ] Upload to distribution platform

## 📊 Performance

### Memory Usage

Typical memory consumption:
- Electron (UI): 150-200 MB
- airline-web: 500-800 MB
- airline-data (simulation): 1-2 GB
- MySQL: 200-500 MB
- **Total**: 2-3.5 GB

### Optimization Tips

1. **Stop simulation when idle**:
   - Simulation uses significant CPU/memory
   - Only run when actively playing

2. **Database maintenance**:
   ```sql
   OPTIMIZE TABLE link;
   OPTIMIZE TABLE link_assignment;
   OPTIMIZE TABLE airport;
   ```

3. **Limit window count**:
   - Keep only one main window open
   - Close unused popups

4. **Monitor logs**:
   - Large log files can slow down app
   - Rotate logs periodically

## 🤝 Contributing

### Code Style

- **JavaScript**: Use ES6+, async/await
- **Indentation**: 2 spaces
- **Comments**: JSDoc for public APIs
- **Naming**: camelCase for variables/functions

### Testing

Currently no automated tests. Manual testing checklist:

- [ ] App launches successfully
- [ ] Backend starts and connects
- [ ] UI loads and is responsive
- [ ] System tray functions work
- [ ] Simulation can start/stop
- [ ] Settings persist
- [ ] App quits cleanly

### Pull Request Process

1. Test your changes thoroughly
2. Update documentation if needed
3. Follow existing code style
4. Describe changes in PR description

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Guide](https://www.electron.build/)
- [Play Framework Docs](https://www.playframework.com/documentation)
- [Scala Documentation](https://docs.scala-lang.org/)

## 🆘 Getting Help

- **Bug Reports**: GitHub Issues
- **Questions**: GitHub Discussions
- **Documentation**: Project README files
- **Community**: Discord/Forums (if available)

---

**Last Updated**: November 2025
