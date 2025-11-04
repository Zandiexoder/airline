# Quick Start - FlightForge Desktop

Get started with the desktop app in minutes!

## ⚡ For End Users (Download & Play)

> **Note**: Pre-built installers don't exist yet. You need to build them first (see "For Developers" section below). Once built, they will be in `desktop-app/dist/`

### macOS
1. Download `FlightForge.dmg` (from `desktop-app/dist/` after building)
2. Open the DMG and drag app to Applications
3. Right-click → Open (first time only, for Gatekeeper)
4. The app will start, initialize database (first run only)
5. Play!

### Windows
1. Download `FlightForge Setup.exe` (from `desktop-app/dist/` after building)
2. Run the installer
3. Launch from Start Menu or Desktop
4. First run will initialize database (be patient)
5. Play!

### Linux
1. Download `FlightForge.AppImage` (from `desktop-app/dist/` after building)
2. Make it executable: `chmod +x FlightForge.AppImage`
3. Run: `./FlightForge.AppImage`
4. First run initializes database
5. Play!

## 🛠️ For Developers (Build from Source)

> **This is what you need to do first!** The desktop app must be built before installers exist.

### Prerequisites
```bash
# macOS
brew install java11 sbt node mysql

# Ubuntu/Debian
sudo apt install openjdk-11-jdk sbt nodejs npm mysql-server

# Windows (use Chocolatey)
choco install openjdk11 sbt nodejs mysql
```

### Quick Build (Creates the installers)

```bash
# 1. You're already in the repo
cd airline

# 2. Set up database
mysql -u root -p
mysql> CREATE DATABASE airline CHARACTER SET utf8mb4;
mysql> CREATE USER 'mfc01'@'localhost' IDENTIFIED BY 'ghEtmwBdnXYBQH4';
mysql> GRANT ALL PRIVILEGES ON airline.* TO 'mfc01'@'localhost';
mysql> EXIT;

# 3. Initialize database
cd airline-data
export SBT_OPTS="-Xms2g -Xmx8g"
sbt run
# Choose option 1 (MainInit) - takes 10-15 minutes

# 4. Build installers (this creates the .dmg, .exe, .AppImage files)
cd desktop-app
./build.sh

# Installers will be created in desktop-app/dist/:
# - FlightForge.dmg (macOS)
# - FlightForge Setup.exe (Windows)
# - FlightForge.AppImage (Linux)
```

### Development Mode (Run without building installers)

```bash
# This runs the app directly without creating installers
cd desktop-app
npm install
./dev.sh

# Or use the interactive setup:
./setup.sh
```

## 🎮 Using the App

### First Launch
1. App starts with loading screen
2. Backend initializes (30-60 seconds)
3. Login or create account
4. Start your airline!

### System Tray
- **Left Click**: Show/hide window
- **Right Click**: Menu
  - Start/Stop Backend
  - Start/Stop Simulation
  - Quit

### Menu Bar
- **File → Preferences**: Configure settings
- **Backend**: Control servers
- **View**: Zoom, DevTools, etc.
- **Help**: Docs, report issues

### Keyboard Shortcuts
- `Cmd/Ctrl + Q`: Quit
- `Cmd/Ctrl + ,`: Preferences
- `Cmd/Ctrl + R`: Reload page
- `Cmd/Ctrl + Option + I`: DevTools

## 📊 System Requirements

### Minimum
- **OS**: Windows 10, macOS 10.13+, Ubuntu 18.04+
- **CPU**: Dual-core 2.0 GHz
- **RAM**: 4 GB
- **Disk**: 500 MB (plus database growth)
- **Java**: JRE 11+

### Recommended
- **OS**: Windows 11, macOS 12+, Ubuntu 22.04+
- **CPU**: Quad-core 2.5 GHz
- **RAM**: 8 GB
- **Disk**: 2 GB
- **Java**: JRE 17+

## ❓ Troubleshooting

### App won't start
```bash
# Check Java
java -version

# Check MySQL
mysql -u mfc01 -p

# View logs
# macOS: ~/Library/Logs/flightforge-desktop/
# Windows: %APPDATA%/flightforge-desktop/logs/
# Linux: ~/.config/flightforge-desktop/logs/
```

### "Port already in use"
Another app is using port 9000. Either:
1. Stop that app
2. Change port in Preferences

### Database errors
Re-initialize the database:
```bash
cd airline-data
sbt run
# Choose option 1 (MainInit)
```

### Slow performance
1. Close unused browser tabs
2. Stop simulation if not playing
3. Restart the app
4. Check system resources

## 🆘 Getting Help

- **Documentation**: See `desktop-app/README.md` and `desktop-app/GUIDE.md`
- **Issues**: https://github.com/patsonluk/airline/issues
- **Community**: GitHub Discussions

## 🎯 Next Steps

Once you're up and running:
1. **Tutorial**: Complete the in-game tutorial
2. **Documentation**: Read game mechanics
3. **Community**: Join discussions
4. **Contribute**: Report bugs, suggest features

---

**Happy Flying! ✈️**
