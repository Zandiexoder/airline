const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class SaveManager {
  constructor(store, log) {
    this.store = store;
    this.log = log;
    this.savesDir = path.join(app.getPath('userData'), 'saves');
    this.ensureSavesDirectory();
  }

  /**
   * Ensure saves directory exists
   */
  ensureSavesDirectory() {
    if (!fs.existsSync(this.savesDir)) {
      fs.mkdirSync(this.savesDir, { recursive: true });
      this.log.info(`Created saves directory: ${this.savesDir}`);
    }
  }

  /**
   * Get path to a save directory
   */
  getSavePath(saveId) {
    return path.join(this.savesDir, saveId);
  }

  /**
   * Get metadata file path for a save
   */
  getMetadataPath(saveId) {
    return path.join(this.getSavePath(saveId), 'metadata.json');
  }

  /**
   * Create a new save slot
   */
  async createNew(saveName) {
    const saveId = `save_${Date.now()}`;
    const savePath = this.getSavePath(saveId);
    
    try {
      // Create save directory
      fs.mkdirSync(savePath, { recursive: true });
      
      // Create metadata
      const metadata = {
        id: saveId,
        name: saveName || `New Game ${new Date().toLocaleDateString()}`,
        created: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        cycle: 0,
        version: '1.0.0'
      };
      
      fs.writeFileSync(
        this.getMetadataPath(saveId),
        JSON.stringify(metadata, null, 2)
      );
      
      // Set as active save
      this.store.set('activeSave', saveId);
      
      this.log.info(`Created new save: ${saveId}`);
      return { success: true, saveId };
    } catch (error) {
      this.log.error(`Failed to create save: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all saves
   */
  async list() {
    try {
      const saves = [];
      const entries = fs.readdirSync(this.savesDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = this.getMetadataPath(entry.name);
          
          if (fs.existsSync(metadataPath)) {
            try {
              const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
              saves.push(metadata);
            } catch (error) {
              this.log.warn(`Failed to read metadata for ${entry.name}: ${error}`);
            }
          }
        }
      }
      
      // Sort by last played (most recent first)
      saves.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
      
      return saves;
    } catch (error) {
      this.log.error(`Failed to list saves: ${error}`);
      return [];
    }
  }

  /**
   * Load a save (set as active)
   */
  async load(saveId) {
    const savePath = this.getSavePath(saveId);
    
    if (!fs.existsSync(savePath)) {
      return { success: false, error: 'Save not found' };
    }
    
    try {
      // Update last played time
      const metadataPath = this.getMetadataPath(saveId);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata.lastPlayed = new Date().toISOString();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Set as active save
      this.store.set('activeSave', saveId);
      
      this.log.info(`Loaded save: ${saveId}`);
      return { success: true, saveId };
    } catch (error) {
      this.log.error(`Failed to load save: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a save
   */
  async delete(saveId) {
    const savePath = this.getSavePath(saveId);
    
    if (!fs.existsSync(savePath)) {
      return { success: false, error: 'Save not found' };
    }
    
    try {
      // Remove directory recursively
      fs.rmSync(savePath, { recursive: true, force: true });
      
      // Clear active save if it was deleted
      if (this.store.get('activeSave') === saveId) {
        this.store.delete('activeSave');
      }
      
      this.log.info(`Deleted save: ${saveId}`);
      return { success: true };
    } catch (error) {
      this.log.error(`Failed to delete save: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update metadata for a save
   */
  async updateMetadata(updates) {
    const activeSave = this.getActiveSave();
    
    if (!activeSave) {
      return { success: false, error: 'No active save' };
    }
    
    try {
      const metadataPath = this.getMetadataPath(activeSave);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Merge updates
      Object.assign(metadata, updates);
      metadata.lastPlayed = new Date().toISOString();
      
      // Write updated metadata
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      this.log.info(`Updated metadata for save: ${activeSave}`);
      return { success: true };
    } catch (error) {
      this.log.error(`Failed to update metadata: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the currently active save
   */
  getActiveSave() {
    return this.store.get('activeSave');
  }

  /**
   * Update save metadata (e.g., after game cycle)
   */
  async updateMetadata(saveId, updates) {
    const metadataPath = this.getMetadataPath(saveId);
    
    if (!fs.existsSync(metadataPath)) {
      return { success: false, error: 'Save not found' };
    }
    
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      Object.assign(metadata, updates);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      return { success: true };
    } catch (error) {
      this.log.error(`Failed to update metadata: ${error}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export a save (for backup or sharing)
   */
  async export(saveId, exportPath) {
    // TODO: Implement save export (zip the save directory)
    this.log.info(`Export save ${saveId} to ${exportPath} - Not implemented yet`);
    return { success: false, error: 'Not implemented yet' };
  }

  /**
   * Import a save
   */
  async import(importPath) {
    // TODO: Implement save import (unzip to saves directory)
    this.log.info(`Import save from ${importPath} - Not implemented yet`);
    return { success: false, error: 'Not implemented yet' };
  }
}

module.exports = SaveManager;
