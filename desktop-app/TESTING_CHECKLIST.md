# Desktop App Testing Checklist

Use this checklist to verify the desktop app works correctly on each platform.

## ✅ Pre-Release Testing

### Installation

#### macOS
- [ ] DMG opens correctly
- [ ] App drags to Applications folder
- [ ] First launch requires right-click → Open (Gatekeeper)
- [ ] Subsequent launches work normally
- [ ] App icon appears correctly in Dock
- [ ] App icon appears correctly in Applications folder

#### Windows
- [ ] Installer runs without admin rights (or prompts appropriately)
- [ ] Installation directory can be customized
- [ ] Desktop shortcut created (if selected)
- [ ] Start menu shortcut created
- [ ] App uninstalls cleanly
- [ ] App icon appears correctly

#### Linux
- [ ] AppImage is executable
- [ ] AppImage runs without installation
- [ ] DEB package installs correctly
- [ ] Application menu entry created
- [ ] App icon appears correctly

### First Launch

- [ ] Loading screen appears
- [ ] Backend starts automatically (if auto-start enabled)
- [ ] Database initialization prompt (if needed)
- [ ] Login screen loads
- [ ] No console errors visible
- [ ] Window size is reasonable (1400x900)
- [ ] Window is centered on screen

### System Tray

- [ ] Tray icon appears
- [ ] Tray icon is visible on light backgrounds
- [ ] Tray icon is visible on dark backgrounds
- [ ] Left-click shows/hides window
- [ ] Right-click shows context menu
- [ ] Context menu options work:
  - [ ] Show MyFly Club
  - [ ] Start Backend (when stopped)
  - [ ] Stop Backend (when running)
  - [ ] Start Simulation
  - [ ] Stop Simulation
  - [ ] Quit

### Window Management

- [ ] Window can be minimized
- [ ] Window can be maximized
- [ ] Window can be resized
- [ ] Window size persists between launches
- [ ] Window position persists between launches
- [ ] Window can be closed (minimizes to tray)
- [ ] Quit from menu actually quits
- [ ] Full-screen mode works

### Menu Bar

#### File Menu
- [ ] Preferences opens (or shows "coming soon")
- [ ] Quit works (stops backend, closes app)

#### Backend Menu
- [ ] Start Backend works
- [ ] Stop Backend works
- [ ] Restart Backend works
- [ ] Start Simulation works
- [ ] Stop Simulation works
- [ ] View Logs opens log directory

#### View Menu
- [ ] Reload refreshes the page
- [ ] Force Reload works
- [ ] Toggle Developer Tools works
- [ ] Reset Zoom works
- [ ] Zoom In works
- [ ] Zoom Out works
- [ ] Toggle Fullscreen works

#### Window Menu
- [ ] Minimize works
- [ ] Zoom works (macOS)
- [ ] Close works

#### Help Menu
- [ ] Documentation opens in browser
- [ ] Report Issue opens in browser
- [ ] About dialog shows version info

### Backend Management

- [ ] Backend starts successfully
- [ ] Web UI loads at localhost:9000
- [ ] Game functions work (login, create airline, etc.)
- [ ] Simulation can start independently
- [ ] Simulation runs without crashing
- [ ] Backend logs are captured
- [ ] Backend stops cleanly
- [ ] No zombie processes after quit

### Configuration

- [ ] Config file is created on first launch
- [ ] Settings persist between launches
- [ ] Database settings can be changed
- [ ] Port can be changed
- [ ] Auto-start option works
- [ ] Theme preference works (if implemented)

### Performance

- [ ] App starts in under 10 seconds
- [ ] Backend starts in under 60 seconds
- [ ] Memory usage is reasonable (~2-3 GB total)
- [ ] CPU usage is low when idle
- [ ] No memory leaks after prolonged use
- [ ] No excessive disk I/O

### Stability

- [ ] App runs for 1+ hour without issues
- [ ] No crashes during normal use
- [ ] Backend crashes don't crash the app
- [ ] Network errors handled gracefully
- [ ] Database errors handled gracefully
- [ ] Logs don't grow excessively

### Security

- [ ] External links open in browser, not in app
- [ ] No Node.js access from renderer
- [ ] No direct filesystem access from renderer
- [ ] IPC communication works correctly
- [ ] No security warnings on launch

### Edge Cases

- [ ] Port 9000 already in use (shows error)
- [ ] Database not running (shows error)
- [ ] Database not initialized (prompts user)
- [ ] Multiple instances (prevents or allows)
- [ ] System sleep/wake (app recovers)
- [ ] Network loss (handles gracefully)
- [ ] Disk full (shows error)

### Cleanup

- [ ] Quit stops all processes
- [ ] No zombie processes remain
- [ ] Logs are properly closed
- [ ] Database connections closed
- [ ] Uninstall removes app files
- [ ] Uninstall preserves user data (or prompts)

## 🧪 Development Testing

### Development Mode

- [ ] `npm run dev` works
- [ ] Developer tools open automatically
- [ ] Changes to main.js require restart
- [ ] Logs are verbose
- [ ] Uses local Scala source code

### Build System

- [ ] `npm install` works without errors
- [ ] `npm start` launches the app
- [ ] `npm run build` creates installers
- [ ] `./build.sh` works
- [ ] `./build.sh mac` works (on macOS)
- [ ] `./build.sh win` works (on Windows)
- [ ] `./build.sh linux` works (on Linux)

### Backend Integration

- [ ] Backend build works (`sbt publishLocal`)
- [ ] Web staging works (`sbt stage`)
- [ ] Database init works (MainInit)
- [ ] Simulation runs (MainSimulation)
- [ ] Development mode uses SBT
- [ ] Production mode uses staged JARs

### IPC Communication

- [ ] All IPC channels respond
- [ ] Errors are handled properly
- [ ] Async operations work correctly
- [ ] No race conditions observed

### Logging

- [ ] Main process logs to file
- [ ] Backend logs captured
- [ ] Log rotation works
- [ ] Log files have reasonable size
- [ ] Logs help with debugging

## 📋 Platform-Specific Tests

### macOS Only
- [ ] Touch Bar support (if implemented)
- [ ] Dark mode support
- [ ] App Nap doesn't interfere
- [ ] Dock menu works
- [ ] Native notifications work
- [ ] Code signing valid (if signed)
- [ ] Notarization valid (if notarized)

### Windows Only
- [ ] Task bar integration works
- [ ] System notifications work
- [ ] Windows defender doesn't block
- [ ] Code signing valid (if signed)
- [ ] NSIS installer options work

### Linux Only
- [ ] Desktop file created
- [ ] Icon appears in app launcher
- [ ] System tray works (various DEs)
- [ ] AppImage integration works
- [ ] DEB package dependencies correct

## 📊 Acceptance Criteria

Before marking as production-ready:

- [ ] All critical tests pass (Installation, First Launch, Backend)
- [ ] At least 95% of tests pass overall
- [ ] No known crashes or data loss bugs
- [ ] Documentation is complete and accurate
- [ ] Build process is documented and reproducible
- [ ] Performance is acceptable on minimum specs
- [ ] Code is reviewed and approved

## 🐛 Issue Tracking

For any failed tests, create an issue with:
- Test name that failed
- Platform/OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if relevant

## 📝 Notes

Use this checklist for:
- Pre-release testing
- Platform verification
- Regression testing after changes
- User acceptance testing
- Beta testing coordination

Update this checklist as new features are added.

---

**Last Updated**: November 2025
