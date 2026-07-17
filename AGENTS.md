# Bob Plugin OpenAI Translator

## About This Project

This is a Bob plugin for text translation, text polishing, and grammar correction based on the OpenAI API. We are building a translation plugin that integrates with Bob, a popular macOS translation application.

## Runtime Environment

This plugin runs within the **Bob** application environment:

- **Host Application**: Bob (macOS translation app)
- **Runtime Engine**: JavaScriptCore (not Node.js, not Web browser)
- **Target Format**: CommonJS (`.bobplugin` package)
- **Development Language**: TypeScript (compiled to JavaScript)

### Runtime Constraints

The plugin runtime has specific limitations:

- No Node.js APIs (no `fs`, `path`, `process`, etc.)
- No Web APIs (no `fetch`, `XMLHttpRequest`, etc.)
- Only JavaScript built-in objects and functions
- Bob-provided APIs and objects
- Custom imported/implemented code modules

### Development vs Runtime

- **Development**: Can use modern TypeScript, NPM packages, build tools
- **Runtime**: Must be pure JavaScript compatible with JavaScriptCore
- **Build Process**: Bun bundles all dependencies into a single `main.js` file

## Bob Plugin Development Guide

### Plugin Structure

Every Bob plugin requires at minimum:

```
plugin-root/
├── info.json          # Plugin metadata (required)
├── main.js            # Plugin implementation (required)
└── icon.png           # Plugin icon (optional, 256x256 recommended)
```

### info.json Configuration

Required fields:
- `identifier`: Unique plugin ID (lowercase letters, numbers, periods only)
- `version`: Plugin version (semver format)
- `category`: Plugin type (`translate`, `ocr`, or `tts`)
- `name`: Plugin display name

Optional fields:
- `summary`: Plugin description
- `icon`: Built-in icon identifier or file path
- `author`: Plugin creator
- `homepage`: Plugin website
- `appcast`: Update URL for auto-updates
- `minBobVersion`: Minimum required Bob version
- `options`: User-configurable settings

Example:
```json
{
    "identifier": "com.openai.translator",
    "version": "1.0.0",
    "category": "translate",
    "name": "OpenAI Translator",
    "summary": "Translation plugin using OpenAI API",
    "author": "OpenAI Translator Team",
    "homepage": "https://github.com/openai-translator/bob-plugin-openai-translator"
}
```

### Translation Plugin Implementation

Translation plugins must implement the following functions in `main.js`:

#### 1. supportLanguages() - Required
**Location**: `src/main.ts:122-123`

Returns an array of supported language codes that the plugin can handle.

```javascript
function supportLanguages() {
    return ['auto', 'zh-Hans', 'zh-Hant', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'ru'];
}
```

**Implementation in this project**:
```typescript
export const supportLanguages = () =>
  supportLanguageList.map(([standardLang]) => standardLang);
```

#### 2. translate(query) - Required
**Location**: `src/main.ts:73-95`

Handles the actual translation process. This is the core function of any translation plugin.

```javascript
function translate(query) {
    // query object contains:
    // - text: string to translate
    // - from: source language code
    // - to: target language code
    // - detectFrom: detected source language
    // - detectTo: detected target language
    // - cancelSignal: cancellation signal
    // - onStream: stream callback (Bob 1.8.0+)
    // - onCompletion: completion callback (Bob 1.8.0+)

    // For Bob 1.8.0+, use query.onCompletion()
    query.onCompletion({
        result: {
            from: query.from,
            to: query.to,
            toParagraphs: ["Translated text"]
        }
    });
}
```

**Implementation in this project**:
```typescript
export const translate: TextTranslate = (query) => {
  const { apiKeys, apiUrl, serviceProvider, stream } = $option;

  // Validate plugin configuration
  const error = validatePluginConfig();
  if (error) {
    handleGeneralError(query, error);
    return;
  }

  // Get service adapter and API key
  const serviceAdapter = getServiceAdapter(serviceProvider as ServiceProvider);
  const apiKey = getApiKey(apiKeys);

  // Perform translation
  serviceAdapter
    .translate(
      query,
      apiKey,
      ensureHttpsAndNoTrailingSlash(apiUrl),
      stream === 'enable',
    )
    .catch((error: unknown) => {
      handleGeneralError(query, error);
    });
};
```

#### 3. pluginTimeoutInterval() - Optional
**Location**: `src/main.ts:120-121`

Customizes the timeout interval for translation requests (Bob 1.6.0+).

- Default: 60 seconds
- Range: 30-300 seconds
- Not recommended to set too high for better UX

```javascript
function pluginTimeoutInterval() {
    return 120; // 120 seconds timeout
}
```

**Implementation in this project**:
```typescript
export const pluginTimeoutInterval = () => 120;
```

#### 4. pluginValidate(completion) - Optional
**Location**: `src/main.ts:97-119`

Validates plugin configuration and API connectivity before actual use.

```javascript
function pluginValidate(completion) {
    // Validate configuration
    // Test API connection
    // Call completion with success/error result

    completion({
        result: {
            // Plugin is valid
        }
    });
}
```

**Implementation in this project**:
```typescript
export const pluginValidate: PluginValidate = (completion) => {
  const { apiKeys, apiUrl, serviceProvider } = $option;

  // Validate plugin configuration
  const pluginConfigError = validatePluginConfig();
  if (pluginConfigError) {
    handleValidateError(completion, pluginConfigError);
    return;
  }

  // Test API connection
  const apiKey = getApiKey(apiKeys);
  const serviceAdapter = getServiceAdapter(serviceProvider as ServiceProvider);

  serviceAdapter
    .testApiConnection(
      apiKey,
      ensureHttpsAndNoTrailingSlash(apiUrl),
      completion,
    )
    .catch((error: unknown) => {
      handleValidateError(completion, error);
    });
};
```

### Debugging

Bob plugins can be debugged using:

1. **$log function**: Print debug information
```javascript
$log("Debug message: " + JSON.stringify(data));
```

2. **Console.app** (macOS):
   - Enable detailed logging
   - Search for plugin identifier: `[com.your.plugin]`

3. **Bob Export Logs**:
   - Menu Bar Icon > Help > Export Logs
   - Search for plugin identifier in exported logs

### Building and Packaging

#### Development Build
```bash
bun run build        # Build TypeScript to CommonJS
bun run dev         # Build and package for testing
```

#### Packaging for Distribution
1. Build the plugin: `bun run build`
2. Navigate to project root
3. Select all files (NOT the root folder)
4. Compress selected files to ZIP
5. Rename `.zip` to `.bobplugin`

#### Publishing

To make the plugin discoverable:

1. **GitHub Repository**:
   - Add "bobplugin" topic to repository
   - Enables discovery via https://github.com/topics/bobplugin

2. **Auto-Updates** (optional):
   - Create `appcast.json` in repository root
   - Include version history with SHA256 hashes
   - Generate SHA256: `shasum -a 256 plugin-file.bobplugin`

Example `appcast.json`:
```json
{
    "identifier": "com.openai.translator",
    "versions": [
        {
            "version": "1.0.0",
            "desc": "Initial release",
            "sha256": "abc123...",
            "url": "https://github.com/user/repo/releases/download/v1.0.0/plugin.bobplugin",
            "minBobVersion": "1.8.0",
            "timestamp": 1641024000
        }
    ]
}
```

### Development Workflow

1. **Setup**: Use TypeScript + modern tooling for development
2. **Build**: Bundle all dependencies into single CommonJS file
3. **Test**: Package as `.bobplugin` and install in Bob
4. **Debug**: Use `$log` and console monitoring
5. **Package**: Create proper `.bobplugin` file
6. **Publish**: Add GitHub topic and optionally create appcast

### Bob-Specific APIs

Bob provides special objects and functions for plugin development:
- `$log()`: Logging function
- `$option`: Access user-configured options
- `$http`: HTTP request capabilities
- Various language and utility functions

Refer to Bob's official API documentation for complete reference.

## Build Configuration

This project uses:
- **Bun**: Build tool and runtime
- **TypeScript**: Development language
- **Biome**: Linting and formatting
- **Target**: CommonJS for Bob compatibility

Key build settings in `scripts/build.mts`:
- Entry: `src/main.ts`
- Output: `dist/main.js`
- Format: CommonJS (`cjs`)
- External: `crypto` (Bob provides this)
