import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'fs';
import path from 'path';
import type { Plugin, PluginOption } from 'vite';

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a custom error handler plugin
const errorLogPlugin = (): PluginOption => ({
  name: 'error-log-plugin',
  buildStart() {
    console.log('Build started, errors will be logged to logs/build-errors.log');
  },
  buildEnd(error?: Error) {
    if (error) {
      const timestamp = new Date().toISOString();
      const errorMessage = `[${timestamp}] Build Error: ${error.message}\n${error.stack || ''}\n\n`;
      
      fs.appendFileSync(
        path.resolve(logsDir, 'build-errors.log'),
        errorMessage
      );
      
      // Display a user-friendly error to the console
      console.error('\x1b[31m%s\x1b[0m', 'Build failed. Check logs/build-errors.log for details.');
    }
  }
});

// Custom plugin to inject DOM error handling code
const reactDOMErrorHandlingPlugin = (): PluginOption => {
  const virtualModuleId = 'virtual:react-dom-error-handler';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  
  return {
    name: 'react-dom-error-handling',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          // React DOM Error Patching
          export function patchReactDOM() {
            // Wait for React to be available
            const checkReact = () => {
              if (window.React && window.ReactDOM) {
                applyPatches();
              } else {
                setTimeout(checkReact, 50);
              }
            };
            
            function applyPatches() {
              try {
                // Save original methods that might cause DOM manipulation errors
                const originalRemoveChild = Node.prototype.removeChild;
                const originalInsertBefore = Node.prototype.insertBefore;
                const originalAppendChild = Node.prototype.appendChild;
                
                // Patch removeChild to be more resilient
                Node.prototype.removeChild = function(child) {
                  try {
                    if (this.contains(child)) {
                      return originalRemoveChild.call(this, child);
                    } else {
                      console.warn('Prevented removeChild error - node is not a child of parent');
                      return child;
                    }
                  } catch (e) {
                    console.warn('Safe removeChild - caught error:', e.message);
                    return child;
                  }
                };
                
                // Patch insertBefore to be more resilient
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  try {
                    if (!referenceNode || this.contains(referenceNode)) {
                      return originalInsertBefore.call(this, newNode, referenceNode);
                    } else {
                      console.warn('Prevented insertBefore error - reference node is not a child');
                      return originalAppendChild.call(this, newNode);
                    }
                  } catch (e) {
                    console.warn('Safe insertBefore - caught error:', e.message);
                    return originalAppendChild.call(this, newNode);
                  }
                };
                
                console.log('DOM manipulation safeguards installed successfully');
              } catch (e) {
                console.error('Failed to install DOM manipulation safeguards:', e);
              }
            }
            
            // Initialize checking
            checkReact();
          }
        `;
      }
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: `
              import { patchReactDOM } from "${virtualModuleId}";
              document.addEventListener('DOMContentLoaded', () => {
                patchReactDOM();
              });
            `
          }
        ]
      };
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Configure React plugin to avoid DOM issues
      jsxRuntime: "automatic",
      babel: {
        plugins: [
          // Add babel plugin to transform class components properly
          "@babel/plugin-transform-react-jsx",
          "@babel/plugin-transform-react-display-name"
        ]
      }
    }),
    errorLogPlugin(),
    reactDOMErrorHandlingPlugin()
  ],
  base: '/',
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    assetsInlineLimit: 0, // Ensure images are not inlined into the JS
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
      onwarn(warning, warn) {
        // Log warnings to file
        const warningMessage = `[${new Date().toISOString()}] Build Warning: ${warning.message || warning}\n`;
        fs.appendFileSync(
          path.resolve(logsDir, 'build-warnings.log'),
          warningMessage
        );
        
        // Still show in console but with less detail
        if (warning.code === 'MISSING_EXPORT') {
          console.warn(`Warning: Missing export (see logs for details)`);
        } else {
          warn(warning);
        }
      }
    }
  }
});
