# Desktop App Resources

This directory contains build resources for the Electron desktop application.

## Required Files

### Icons
You need to create icon files for each platform:

1. **icon.png** (1024x1024) - Linux icon
2. **icon.ico** - Windows icon (256x256)
3. **icon.icns** - macOS icon bundle

### System Tray Icons
4. **tray-icon.png** (16x16 or 32x32) - System tray icon for Windows/Linux
5. **tray-icon-Template.png** (16x16 @1x, 32x32 @2x) - macOS system tray icon

## Creating Icons

### From a Logo Image

If you have a logo/brand image, use these tools:

**Online Tools:**
- https://cloudconvert.com/png-to-ico (Windows .ico)
- https://cloudconvert.com/png-to-icns (macOS .icns)
- https://www.img2go.com/ (General conversion)

**Command Line:**
```bash
# macOS (requires iconutil)
mkdir icon.iconset
sips -z 16 16     logo.png --out icon.iconset/icon_16x16.png
sips -z 32 32     logo.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     logo.png --out icon.iconset/icon_32x32.png
sips -z 64 64     logo.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   logo.png --out icon.iconset/icon_128x128.png
sips -z 256 256   logo.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   logo.png --out icon.iconset/icon_256x256.png
sips -z 512 512   logo.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   logo.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 logo.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset

# ImageMagick (cross-platform)
convert logo.png -resize 256x256 icon.ico
convert logo.png -resize 1024x1024 icon.png
```

### Placeholder Icons
Until you create custom icons, you can use placeholder colors or text.

## Icon Guidelines

### Main Application Icon
- **Size**: 1024x1024 base image
- **Format**: PNG with transparency
- **Style**: Simple, recognizable at small sizes
- **Brand**: Should represent the airline theme

### Tray Icon
- **Size**: 16x16 or 32x32
- **Format**: PNG with transparency
- **Style**: Monochrome or simple 2-color
- **macOS**: Use @2x retina images, suffix with "Template" for dark mode support
- **Contrast**: Should work on both light and dark backgrounds

## File Structure

```
build/
├── icon.png              # Linux (1024x1024)
├── icon.ico              # Windows (256x256 embedded)
├── icon.icns             # macOS bundle
├── tray-icon.png         # Windows/Linux tray
├── tray-icon-Template.png # macOS tray (dark mode aware)
└── entitlements.mac.plist # macOS signing entitlements
```

## Notes

- Icons are embedded at build time by electron-builder
- Missing icons will cause build warnings but won't fail the build
- Default Electron icons will be used if custom icons are not provided
- For professional distribution, proper icon design is recommended
