const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const kill = require('tree-kill');

class BackendManager {
  constructor(store, log) {
    this.store = store;
    this.log = log;
    this.webProcess = null;
    this.simulationProcess = null;
    this.isProduction = app.isPackaged;
    this.initCache = this.loadInitCache();
  }

  /**
   * Load initialization cache to skip redundant checks
   */
  loadInitCache() {
    try {
      const cacheDir = path.join(this.getBackendPath(), '../desktop-app/.cache');
      const cachePath = path.join(cacheDir, 'init-complete.json');
      
      if (fs.existsSync(cachePath)) {
        const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        this.log.info('Initialization cache found - fast startup enabled');
        return cache;
      }
    } catch (error) {
      this.log.warn('Could not load init cache:', error);
    }
    return null;
  }

  /**
   * Check if backend is pre-initialized
   */
  isPreInitialized() {
    return this.initCache && this.initCache.initialized === true;
  }

  /**
   * Get the base path for backend files
   */
  getBackendPath() {
    if (this.isProduction) {
      return path.join(process.resourcesPath, 'backend');
    } else {
      return path.resolve(__dirname, '../../');
    }
  }

  /**
   * Get Java executable path
   */
  getJavaPath() {
    // Try to find Java in common locations
    const javaHome = process.env.JAVA_HOME;
    
    if (javaHome) {
      const javaBin = process.platform === 'win32' ? 'java.exe' : 'java';
      return path.join(javaHome, 'bin', javaBin);
    }
    
    // Fallback to system Java
    return 'java';
  }

  /**
   * Get SBT executable path
   */
  getSbtPath() {
    // In development, use system SBT
    if (!this.isProduction) {
      return 'sbt';
    }
    
    // In production, we'll use the staged JAR files directly
    return null;
  }

  /**
   * Start the web server (airline-web)
   */
  async startWeb() {
    if (this.webProcess) {
      this.log.info('Web server already running');
      return { success: false, error: 'Web server already running' };
    }

    try {
      const basePath = this.getBackendPath();
      const port = this.store.get('backendPort');
      
      // Check if pre-initialized
      if (this.isPreInitialized()) {
        this.log.info('Using pre-initialized backend - fast startup enabled');
      } else {
        this.log.warn('Backend not pre-initialized - startup will be slower');
      }
      
      this.log.info(`Starting web server on port ${port}...`);
      
      if (this.isProduction) {
        // Production: Use staged application
        const webPath = path.join(basePath, 'airline-web');
        const binPath = process.platform === 'win32' 
          ? path.join(webPath, 'bin', 'airline-web.bat')
          : path.join(webPath, 'bin', 'airline-web');
        
        if (!fs.existsSync(binPath)) {
          throw new Error(`Web server executable not found at ${binPath}`);
        }
        
        // Use optimized JVM settings for faster startup
        const jvmOpts = this.isPreInitialized() 
          ? '-Xms512m -Xmx2g -XX:+TieredCompilation -XX:TieredStopAtLevel=1'
          : '-Xms2g -Xmx4g';
        
        this.webProcess = spawn(binPath, [], {
          cwd: webPath,
          env: {
            ...process.env,
            HTTP_PORT: port.toString(),
            APPLICATION_SECRET: this.generateSecret(),
            JAVA_OPTS: jvmOpts
          },
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else {
        // Development: Use SBT
        const webPath = path.join(basePath, 'airline-web');
        const sbt = this.getSbtPath();
        
        // Use optimized SBT options for faster startup
        const sbtOpts = this.isPreInitialized()
          ? '-Xms512m -Xmx2g -XX:+TieredCompilation -XX:TieredStopAtLevel=1'
          : process.env.SBT_OPTS || '-Xms2g -Xmx8g';
        
        this.webProcess = spawn(sbt, ['run'], {
          cwd: webPath,
          env: {
            ...process.env,
            SBT_OPTS: sbtOpts,
            HTTP_PORT: port.toString()
          },
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true
        });
      }

      // Handle output
      this.webProcess.stdout.on('data', (data) => {
        this.log.info(`[Web] ${data.toString().trim()}`);
      });

      this.webProcess.stderr.on('data', (data) => {
        this.log.warn(`[Web] ${data.toString().trim()}`);
      });

      this.webProcess.on('close', (code) => {
        this.log.info(`Web server exited with code ${code}`);
        this.webProcess = null;
      });

      this.webProcess.on('error', (error) => {
        this.log.error('Web server error:', error);
        this.webProcess = null;
      });

      return { success: true };
    } catch (error) {
      this.log.error('Failed to start web server:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the simulation (airline-data MainSimulation)
   */
  async startSimulation() {
    if (this.simulationProcess) {
      this.log.info('Simulation already running');
      return { success: false, error: 'Simulation already running' };
    }

    try {
      const basePath = this.getBackendPath();
      
      this.log.info('Starting simulation...');
      
      if (this.isProduction) {
        // Production: Run JAR directly
        const dataPath = path.join(basePath, 'airline-data');
        const jarFiles = fs.readdirSync(dataPath)
          .filter(f => f.endsWith('.jar') && !f.includes('javadoc') && !f.includes('sources'));
        
        if (jarFiles.length === 0) {
          throw new Error('No JAR file found for airline-data');
        }
        
        const jarPath = path.join(dataPath, jarFiles[0]);
        const java = this.getJavaPath();
        
        this.simulationProcess = spawn(java, [
          '-Xms2g',
          '-Xmx8g',
          '-cp',
          jarPath,
          'com.patson.MainSimulation'
        ], {
          cwd: dataPath,
          env: {
            ...process.env,
            DB_HOST: this.store.get('dbHost'),
            DB_PORT: this.store.get('dbPort'),
            DB_NAME: this.store.get('dbName'),
            DB_USER: this.store.get('dbUser'),
            DB_PASSWORD: this.store.get('dbPassword')
          },
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else {
        // Development: Use SBT
        const dataPath = path.join(basePath, 'airline-data');
        const sbt = this.getSbtPath();
        
        // Set SBT options for memory
        const sbtOpts = process.env.SBT_OPTS || '-Xms2g -Xmx8g';
        
        this.simulationProcess = spawn(sbt, ['run'], {
          cwd: dataPath,
          env: {
            ...process.env,
            SBT_OPTS: sbtOpts
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true
        });

        // Auto-select MainSimulation option (usually option 2)
        setTimeout(() => {
          if (this.simulationProcess) {
            this.simulationProcess.stdin.write('2\n');
          }
        }, 5000);
      }

      // Handle output
      this.simulationProcess.stdout.on('data', (data) => {
        this.log.info(`[Simulation] ${data.toString().trim()}`);
      });

      this.simulationProcess.stderr.on('data', (data) => {
        this.log.warn(`[Simulation] ${data.toString().trim()}`);
      });

      this.simulationProcess.on('close', (code) => {
        this.log.info(`Simulation exited with code ${code}`);
        this.simulationProcess = null;
      });

      this.simulationProcess.on('error', (error) => {
        this.log.error('Simulation error:', error);
        this.simulationProcess = null;
      });

      return { success: true };
    } catch (error) {
      this.log.error('Failed to start simulation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop the web server
   */
  async stopWeb() {
    if (!this.webProcess) {
      return { success: true };
    }

    return new Promise((resolve) => {
      this.log.info('Stopping web server...');
      
      kill(this.webProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          this.log.error('Error stopping web server:', err);
          resolve({ success: false, error: err.message });
        } else {
          this.webProcess = null;
          this.log.info('Web server stopped');
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Stop the simulation
   */
  async stopSimulation() {
    if (!this.simulationProcess) {
      return { success: true };
    }

    return new Promise((resolve) => {
      this.log.info('Stopping simulation...');
      
      kill(this.simulationProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          this.log.error('Error stopping simulation:', err);
          resolve({ success: false, error: err.message });
        } else {
          this.simulationProcess = null;
          this.log.info('Simulation stopped');
          resolve({ success: true });
        }
      });
    });
  }

  /**
   * Stop all backend processes
   */
  async stopAll() {
    const webResult = await this.stopWeb();
    const simResult = await this.stopSimulation();
    
    return {
      success: webResult.success && simResult.success,
      error: webResult.error || simResult.error
    };
  }

  /**
   * Get status of backend processes
   */
  getStatus() {
    return {
      web: {
        running: this.webProcess !== null,
        pid: this.webProcess?.pid
      },
      simulation: {
        running: this.simulationProcess !== null,
        pid: this.simulationProcess?.pid
      }
    };
  }

  /**
   * Initialize database (run MainInit)
   */
  async initDatabase() {
    const basePath = this.getBackendPath();
    const dataPath = path.join(basePath, 'airline-data');
    const sbt = this.getSbtPath();
    
    this.log.info('Initializing database...');
    
    return new Promise((resolve, reject) => {
      const sbtOpts = process.env.SBT_OPTS || '-Xms2g -Xmx8g';
      
      const initProcess = spawn(sbt, ['run'], {
        cwd: dataPath,
        env: {
          ...process.env,
          SBT_OPTS: sbtOpts
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      // Auto-select MainInit option (usually option 1)
      setTimeout(() => {
        initProcess.stdin.write('1\n');
      }, 5000);

      initProcess.stdout.on('data', (data) => {
        this.log.info(`[Init] ${data.toString().trim()}`);
      });

      initProcess.stderr.on('data', (data) => {
        this.log.warn(`[Init] ${data.toString().trim()}`);
      });

      initProcess.on('close', (code) => {
        if (code === 0) {
          this.log.info('Database initialized successfully');
          resolve({ success: true });
        } else {
          this.log.error(`Database initialization failed with code ${code}`);
          reject(new Error(`Database initialization failed with code ${code}`));
        }
      });

      initProcess.on('error', (error) => {
        this.log.error('Database initialization error:', error);
        reject(error);
      });
    });
  }

  /**
   * Generate a random application secret for Play Framework
   */
  generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 64; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}

module.exports = BackendManager;
