# Scala Template @ Symbol Issue - Fixed

## The Problem

When adding Leaflet CDN links to the Scala template file (`index.scala.html`), we got compilation errors:

```
[error] Invalid '@' symbol
[error] <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
```

## Why This Happened

Play Framework uses **Twirl** template engine for `.scala.html` files. In Twirl:
- `@` is a **special character** used to insert Scala code
- When the template sees `leaflet@1.9.4`, it tries to interpret `@1` as Scala code
- This causes a compilation error

## The Fix

In Scala templates, escape `@` symbols by using `@@` (double at sign):

### Before (Causes Error):
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-polylinedecorator@1.6.0/dist/leaflet.polylineDecorator.js"></script>
```

### After (Works Correctly):
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-polylinedecorator@@1.6.0/dist/leaflet.polylineDecorator.js"></script>
```

## What `@@` Does

- `@@` in a Scala template renders as a single `@` in the final HTML
- The template compiler sees `@@` and knows to output a literal `@` character
- The browser receives the correct URL: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`

## Files Fixed

✅ **airline-web/app/views/index.scala.html**
- Line 6067: Changed `leaflet@1.9.4` → `leaflet@@1.9.4`
- Line 6072: Changed `leaflet@1.9.4` → `leaflet@@1.9.4`
- Line 6077: Changed `leaflet-polylinedecorator@1.6.0` → `leaflet-polylinedecorator@@1.6.0`

## How to Verify

After the fix, the app should compile successfully:

```bash
# Restart the app
docker-compose restart airline-app

# Check logs - should see "Server started" without template errors
docker-compose logs -f airline-app | grep -i "error\|started"
```

## General Rule for Scala Templates

**Always escape `@` in URLs and text:**

| Context | Wrong | Correct |
|---------|-------|---------|
| Email | `contact@example.com` | `contact@@example.com` |
| CDN Version | `jquery@3.6.0` | `jquery@@3.6.0` |
| Twitter Handle | `@username` | `@@username` |
| Scala Variable | `@myVariable` | Keep as `@myVariable` (this is Scala code) |

## Other Common Template Syntax

### Inserting Scala Variables:
```scala
<h1>@username</h1>  // Single @ for Scala code
```

### Literal @ Symbol:
```scala
<p>Email: user@@example.com</p>  // Double @@ for literal @
```

### Scala Expressions:
```scala
<p>Total: @(price * quantity)</p>  // @ with parentheses
```

### Asset Routes (Our Project):
```scala
<script src="@routes.Assets.versioned("javascripts/main.js")"></script>  // Single @ for Play routes
```

## Status

**Fixed:** ✅
- All `@` symbols in CDN URLs escaped with `@@`
- Template should compile successfully
- Leaflet libraries will load correctly

---

**Date:** October 28, 2025  
**Issue:** Template compilation error with `@` in CDN URLs  
**Resolution:** Escaped with `@@` for literal output
