# FlightForge Desktop App

🛫 **Airline Management Simulation - Desktop Edition**

This is the desktop application version of FlightForge, an open-source airline management simulation game. Built with Electron, it wraps the Scala/Play Framework backend with a native desktop experience.

## Features

✨ **Native Desktop Experience**
- System tray integration
- Native window management
- Offline-capable (after initial setup)
- Cross-platform (Windows, macOS, Linux)

🎮 **Game Controls**
- Start/stop backend server
- Control simulation engine
- Manage game settings
- View logs and status

🔧 **Configuration**
- Customizable database settings
- Port configuration
- Auto-start options
- Window preferences

## Prerequisites

### Development
- **Java 11+** (OpenJDK recommended)
- **SBT** (Scala Build Tool)
- **Node.js 18+** and npm
- **MySQL 8** (for database)

### Production (Running the app)
- **Java 11+** (Runtime only)
- **MySQL 8** (or configure to use embedded database)

## Quick Start (Development)

### 1. Install Dependencies
```bash
cd desktop-app
npm install
```

### 2. Build the Backend
```bash
# From project root
cd airline-data
export SBT_OPTS="-Xms2g -Xmx8g"
sbt publishLocal

cd ../airline-web
sbt stage
```

### 3. Set Up Database
Make sure MySQL is running and create the database:
```sql
CREATE DATABASE airline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Run the Desktop App
```bash
cd desktop-app
npm start
```

The app will:
1. Launch the Electron window
2. Start the backend server on port 9000
3. Load the game interface
4. Optionally start the simulation engine

## Building Installers

### Using the Build Script
```bash
# Build for current platform
./build.sh

# Build for specific platform
./build.sh mac
./build.sh win
./build.sh linux
```

### Manual Build
```bash
cd desktop-app

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux
```

Output will be in `desktop-app/dist/`

## Application Structure

```
desktop-app/
├── src/
│   ├── main.js              # Main Electron process
│   └── backend-manager.js   # Backend lifecycle management
├── preload.js               # Secure IPC bridge
├── package.json             # App configuration
└── build/                   # Build resources (icons, etc.)
```

## Architecture

### Process Structure
```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  (Window Management, System Tray, IPC)  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│   Renderer   │    │ Backend Manager  │
│   Process    │    │                  │
│  (Web UI)    │    │  ┌────────────┐  │
└──────────────┘    │  │ airline-web│  │
                    │  │   :9000    │  │
                    │  └────────────┘  │
                    │  ┌────────────┐  │
                    │  │airline-data│  │
                    │  │ Simulation │  │
                    │  └────────────┘  │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │    MySQL     │
                    └──────────────┘
```

### Component Communication
1. **Electron Main Process**: Manages windows, system tray, and coordinates all processes
2. **Backend Manager**: Spawns and controls Scala/Play backend processes
3. **Renderer Process**: Displays the web UI (airline-web frontend)
4. **IPC Bridge**: Secure communication between renderer and main process

## Configuration

Settings are stored in the app's config directory:
- **macOS**: `~/Library/Application Support/flightforge-desktop/`
- **Windows**: `%APPDATA%/flightforge-desktop/`
- **Linux**: `~/.config/flightforge-desktop/`

### Default Configuration
```json
{
  "windowBounds": { "width": 1400, "height": 900 },
  "autoStartBackend": true,
  "backendPort": 9000,
  "dbHost": "localhost",
  "dbPort": 3306,
  "dbName": "airline",
  "dbUser": "mfc01",
  "dbPassword": "ghEtmwBdnXYBQH4",
  "startMinimized": false,
  "theme": "classic"
}
```

## System Tray

The app runs in the system tray with these options:
- **Show FlightForge** - Restore the main window
- **Start Backend** - Launch the game server
- **Stop Backend** - Shut down the server
- **Start Simulation** - Begin game cycle simulation
- **Stop Simulation** - Pause simulation
- **Quit** - Exit the application

## Menu Bar

### File Menu
- Preferences (⌘,) - Configure app settings
- Quit (⌘Q) - Exit the application

### Backend Menu
- Start/Stop Backend
- Restart Backend
- Start/Stop Simulation
- View Logs

### View Menu
- Reload, Force Reload
- Toggle Developer Tools
- Zoom controls
- Toggle Fullscreen

### Window Menu
- Minimize, Zoom
- Window management

### Help Menu
- Documentation
- Report Issue
- About

## Development Tips

### Running in Development Mode
```bash
npm run dev
```

This enables:
- Hot reload for Electron code
- Better error messages
- Developer tools auto-open
- Verbose logging

### Debugging Backend
Logs are written to:
- **macOS**: `~/Library/Logs/flightforge-desktop/`
- **Windows**: `%USERPROFILE%\AppData\Roaming\flightforge-desktop\logs\`
- **Linux**: `~/.config/flightforge-desktop/logs/`

View logs from the app: **Backend → View Logs**

### Testing Backend Separately
You can still run the backend manually for testing:
```bash
# Terminal 1: Start web server
cd airline-web
sbt run

# Terminal 2: Start simulation
cd airline-data
sbt run  # Select option 2 (MainSimulation)
```

## Troubleshooting

### Backend Won't Start
1. Check Java is installed: `java -version`
2. Verify SBT works: `sbt about`
3. Check logs for errors
4. Ensure MySQL is running and accessible

### Database Connection Issues
1. Verify MySQL is running: `mysql -u mfc01 -p`
2. Check database exists: `SHOW DATABASES;`
3. Update credentials in Preferences
4. Check firewall settings

### Build Failures
1. Clean build: `npm run clean && npm install`
2. Rebuild backend: `cd airline-data && sbt clean publishLocal`
3. Check disk space
4. Review error logs

### Port Already in Use
The app defaults to port 9000. Change it in Preferences or:
```bash
# Before starting the app
export BACKEND_PORT=9001
npm start
```

## Distribution

### Signing (macOS)
To distribute on macOS, you need to sign the app:
1. Get an Apple Developer ID
2. Set environment variables:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_PASSWORD="app-specific-password"
   ```
3. Build: `npm run build:mac`

### Code Signing (Windows)
For Windows distribution:
1. Get a code signing certificate
2. Configure in `package.json` under `build.win`
3. Build: `npm run build:win`

## Performance

### Memory Usage
- **Electron**: ~150-200 MB
- **Backend (Web)**: ~500-800 MB
- **Backend (Simulation)**: ~1-2 GB
- **Total**: ~2-3 GB recommended

### Optimization
- Close unused windows/tabs
- Stop simulation when not needed
- Regular database maintenance
- Monitor logs for memory leaks

## Contributing

This is part of the open-source FlightForge project. See the main repository for contribution guidelines.

## License

See LICENSE file in the project root.

## Credits

- **Original Game**: Airline Club (airline-club.com)
- **Desktop Wrapper**: Electron
- **Backend**: Scala, Play Framework, Pekko
- **Community**: All contributors to the FlightForge project

## Support

- **Issues**: https://github.com/patsonluk/airline/issues
- **Discussions**: GitHub Discussions
- **Documentation**: Project README files

---

**Happy Flying! ✈️**
