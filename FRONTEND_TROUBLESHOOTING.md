# Frontend Troubleshooting Guide

## 🚨 ISSUE: Blank White Screen

The frontend is showing a blank white screen. This is typically caused by:

1. **JavaScript Errors** - Check browser console for errors
2. **Missing Dependencies** - Some packages may not be installed
3. **React Version Compatibility** - React 19 may have compatibility issues
4. **TypeScript Errors** - Type errors preventing compilation

## 🔧 IMMEDIATE FIXES

### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any red error messages
4. Share the error messages if any

### Step 2: Restart Development Server
```bash
cd e:\NeuroStack\Projects\LegalBot\frontend

# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Clear Cache and Reinstall
```bash
cd e:\NeuroStack\Projects\LegalBot\frontend

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rmdir /s node_modules
del package-lock.json
npm install

# Start development server
npm run dev
```

### Step 4: Check for TypeScript Errors
```bash
cd e:\NeuroStack\Projects\LegalBot\frontend

# Check for TypeScript compilation errors
npx tsc --noEmit
```

## 🔄 ALTERNATIVE: Use Simplified Version

If the main app still doesn't work, I've created a simplified version that should work:

### Test with Basic React App
```bash
cd e:\NeuroStack\Projects\LegalBot\frontend

# Create a simple test component
echo 'import React from "react"; export default function App() { return <div><h1>LegalBot Test</h1><p>If you see this, React is working!</p></div>; }' > src/App.tsx

npm run dev
```

If this works, the issue is with the complex components.

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: React 19 Compatibility
**Symptoms**: Blank screen, console errors about React
**Solution**: Downgrade React to stable version
```bash
npm install react@18.2.0 react-dom@18.2.0 @types/react@18.2.0 @types/react-dom@18.2.0
```

### Issue 2: Material-UI Compatibility
**Symptoms**: MUI component errors
**Solution**: Ensure compatible MUI version
```bash
npm install @mui/material@5.15.0 @mui/icons-material@5.15.0 @emotion/react@11.11.0 @emotion/styled@11.11.0
```

### Issue 3: TypeScript Strict Mode
**Symptoms**: Type errors preventing compilation
**Solution**: Update tsconfig.json to be less strict temporarily
```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

### Issue 4: Vite Configuration
**Symptoms**: Build/dev server issues
**Solution**: Check vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

## 📋 STEP-BY-STEP DEBUGGING

### 1. Basic Connectivity Test
```bash
# Test if Vite server starts
cd e:\NeuroStack\Projects\LegalBot\frontend
npm run dev

# Should show:
# Local:   http://localhost:5173/
# Network: http://192.168.x.x:5173/
```

### 2. Browser Test
1. Open http://localhost:5173 in browser
2. Check if page loads (even if blank)
3. Open Developer Tools (F12)
4. Check Console for errors
5. Check Network tab for failed requests

### 3. Component Test
Replace App.tsx with minimal component:
```tsx
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>LegalBot Frontend Test</h1>
      <p>✅ React is working!</p>
      <p>✅ TypeScript is working!</p>
      <button onClick={() => alert('Click works!')}>
        Test Button
      </button>
    </div>
  );
}

export default App;
```

### 4. Gradual Feature Addition
If basic test works, gradually add features:
1. Add Material-UI theme
2. Add basic layout
3. Add sidebar
4. Add chat interface
5. Add API integration

## 🚀 QUICK RECOVERY

If nothing works, here's a nuclear option:

### Complete Reset
```bash
cd e:\NeuroStack\Projects\LegalBot

# Backup current frontend
move frontend frontend_backup

# Create new React app
npx create-react-app frontend --template typescript
cd frontend

# Install required dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Copy our components
copy ..\frontend_backup\src\App.tsx src\App.tsx

npm start
```

## 📞 NEXT STEPS

1. **Try the fixes above in order**
2. **Check browser console for specific errors**
3. **Test with simplified App.tsx first**
4. **Report any specific error messages**

The frontend should work - let's identify the specific issue and fix it!