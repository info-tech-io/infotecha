#!/usr/bin/env node

/**
 * Module Scanner for InfoTech.io Platform
 * Scans GitHub organization for mod_* repositories and reads their module.json files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const ORG_NAME = 'info-tech-io';
const CENTRAL_MODULES_PATH = path.join(__dirname, '../modules.json');
const SCHEMA_PATH = path.join(__dirname, '../schemas/module.json');

/**
 * Logger utility (reuse from validate-module.js)
 */
class Logger {
    static colors = {
        reset: '\x1b[0m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        cyan: '\x1b[36m',
        gray: '\x1b[90m'
    };

    static error(message) {
        console.error(`${this.colors.red}✗ ERROR:${this.colors.reset} ${message}`);
    }

    static success(message) {
        console.log(`${this.colors.green}✓ SUCCESS:${this.colors.reset} ${message}`);
    }

    static warning(message) {
        console.warn(`${this.colors.yellow}⚠ WARNING:${this.colors.reset} ${message}`);
    }

    static info(message) {
        console.log(`${this.colors.blue}ℹ INFO:${this.colors.reset} ${message}`);
    }

    static debug(message) {
        if (process.env.DEBUG) {
            console.log(`${this.colors.gray}DEBUG:${this.colors.reset} ${message}`);
        }
    }
}

/**
 * GitHub API client
 */
class GitHubClient {
    constructor(token = null) {
        this.token = token || process.env.GITHUB_TOKEN;
        this.baseUrl = 'api.github.com';
    }

    /**
     * Make HTTP request to GitHub API
     */
    async request(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseUrl,
                path: path,
                method: 'GET',
                headers: {
                    'User-Agent': 'InfoTech-Module-Scanner/1.0',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            if (this.token) {
                options.headers['Authorization'] = `token ${this.token}`;
            }

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);

                        if (res.statusCode >= 400) {
                            reject(new Error(`GitHub API error ${res.statusCode}: ${jsonData.message}`));
                            return;
                        }

                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`GitHub API request failed: ${error.message}`));
            });

            req.end();
        });
    }

    /**
     * Get all repositories in organization
     */
    async getRepositories(org) {
        try {
            const repos = await this.request(`/orgs/${org}/repos?type=all&per_page=100`);
            return repos.filter(repo => repo.name.startsWith('mod_'));
        } catch (error) {
            Logger.error(`Failed to fetch repositories: ${error.message}`);
            return [];
        }
    }

    /**
     * Get file content from repository
     */
    async getFileContent(org, repo, path, branch = 'main') {
        try {
            const response = await this.request(`/repos/${org}/${repo}/contents/${path}?ref=${branch}`);

            if (response.content) {
                return Buffer.from(response.content, 'base64').toString('utf8');
            }

            return null;
        } catch (error) {
            Logger.debug(`Failed to fetch ${path} from ${repo}: ${error.message}`);
            return null;
        }
    }
}

/**
 * Module scanner
 */
class ModuleScanner {
    constructor() {
        this.github = new GitHubClient();
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Load central modules.json as fallback
     */
    loadCentralModules() {
        try {
            if (fs.existsSync(CENTRAL_MODULES_PATH)) {
                const content = fs.readFileSync(CENTRAL_MODULES_PATH, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            Logger.warning(`Failed to load central modules.json: ${error.message}`);
        }
        return { modules: [] };
    }

    /**
     * Scan specific module
     */
    async scanModule(moduleName) {
        Logger.info(`Scanning module: ${moduleName}`);

        // Check cache first
        const cacheKey = `module:${moduleName}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            Logger.debug(`Using cached data for ${moduleName}`);
            return cached.data;
        }

        try {
            // Try to fetch module.json
            const moduleJsonContent = await this.github.getFileContent(ORG_NAME, moduleName, 'module.json');

            if (moduleJsonContent) {
                const moduleData = JSON.parse(moduleJsonContent);

                // Cache the result
                this.cache.set(cacheKey, {
                    data: { success: true, source: 'module.json', data: moduleData },
                    timestamp: Date.now()
                });

                Logger.success(`Found module.json for ${moduleName}`);
                return { success: true, source: 'module.json', data: moduleData };
            }

            // Fallback to central modules.json
            const centralModules = this.loadCentralModules();
            const centralModule = centralModules.modules ?
                Object.values(centralModules.modules).find(m => m.content_repo === moduleName) : null;

            if (centralModule) {
                Logger.info(`Using central config for ${moduleName}`);
                return { success: true, source: 'central', data: centralModule };
            }

            Logger.warning(`No configuration found for ${moduleName}`);
            return { success: false, error: 'No configuration found' };

        } catch (error) {
            Logger.error(`Failed to scan ${moduleName}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Scan all modules in organization
     */
    async scanAllModules() {
        Logger.info(`Scanning all modules in ${ORG_NAME} organization`);

        try {
            const repos = await this.github.getRepositories(ORG_NAME);
            Logger.info(`Found ${repos.length} mod_* repositories`);

            const results = [];

            for (const repo of repos) {
                const result = await this.scanModule(repo.name);
                results.push({
                    repository: repo.name,
                    ...result
                });
            }

            return results;
        } catch (error) {
            Logger.error(`Failed to scan all modules: ${error.message}`);
            return [];
        }
    }

    /**
     * Generate unified modules.json
     */
    async generateUnifiedModules() {
        const scanResults = await this.scanAllModules();

        const unifiedModules = {
            version: "2.0",
            generated_at: new Date().toISOString(),
            build_system: "hybrid", // Both hugo-base and hugo-templates
            modules: []
        };

        for (const result of scanResults) {
            if (result.success) {
                if (result.source === 'module.json') {
                    // Convert module.json format to legacy format for compatibility
                    const legacyFormat = this.convertToLegacyFormat(result.data);
                    legacyFormat._source = 'module.json';
                    unifiedModules.modules.push(legacyFormat);
                } else {
                    // Use central format as-is
                    result.data._source = 'central';
                    unifiedModules.modules.push(result.data);
                }
            } else {
                Logger.warning(`Skipping ${result.repository}: ${result.error}`);
            }
        }

        return unifiedModules;
    }

    /**
     * Convert module.json format to legacy modules.json format
     */
    convertToLegacyFormat(moduleData) {
        return {
            name: moduleData.name,
            title: moduleData.title,
            description: moduleData.description,
            subdomain: moduleData.deployment?.subdomain || moduleData.name,
            repository: moduleData.deployment?.repository || `mod_${moduleData.name.replace(/-/g, '_')}`,
            url: moduleData.urls?.production || `https://${moduleData.name}.infotecha.ru`,

            // Additional fields for enhanced functionality
            version: moduleData.version,
            type: moduleData.type,
            difficulty: moduleData.metadata?.difficulty,
            estimated_time: moduleData.metadata?.estimated_time,
            tags: moduleData.metadata?.tags || [],
            lifecycle: moduleData.status?.lifecycle,
            last_updated: moduleData.status?.last_updated,

            // Hugo configuration
            hugo_config: moduleData.hugo_config
        };
    }

    /**
     * Validate all found modules
     */
    async validateAllModules() {
        const { ModuleValidator } = require('./validate-module.js');
        const validator = new ModuleValidator();

        const scanResults = await this.scanAllModules();
        const validationResults = [];

        for (const result of scanResults) {
            if (result.success && result.source === 'module.json') {
                const isValid = validator.validateModule(result.data, result.repository);
                validationResults.push({
                    repository: result.repository,
                    valid: isValid
                });
            }
        }

        return validationResults;
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Module Scanner for InfoTech.io Platform

USAGE:
  scan-modules.js                          Scan all modules and generate unified modules.json
  scan-modules.js --module <name>          Scan specific module
  scan-modules.js --validate               Validate all modules with module.json
  scan-modules.js --output <format>        Output format (json|pretty|legacy)

EXAMPLES:
  scan-modules.js
  scan-modules.js --module mod_linux_base
  scan-modules.js --validate
  scan-modules.js --output json > unified-modules.json

OPTIONS:
  --module <name>    Scan specific module repository
  --validate         Validate all found module.json files
  --output <format>  Output format: json, pretty, legacy (default: pretty)
  --verbose          Enable verbose output
  --help, -h         Show help

ENVIRONMENT:
  GITHUB_TOKEN       GitHub API token for authentication (optional but recommended)
        `);
        process.exit(0);
    }

    // Enable debug mode if verbose
    if (args.includes('--verbose')) {
        process.env.DEBUG = 'true';
    }

    const scanner = new ModuleScanner();

    // Validate all modules
    if (args.includes('--validate')) {
        Logger.info('Validating all modules...');
        const results = await scanner.validateAllModules();

        console.log('\nValidation Results:');
        results.forEach(result => {
            const status = result.valid ? '✓' : '✗';
            console.log(`  ${status} ${result.repository}`);
        });

        const allValid = results.every(r => r.valid);
        process.exit(allValid ? 0 : 1);
    }

    // Scan specific module
    const moduleIndex = args.indexOf('--module');
    if (moduleIndex !== -1 && moduleIndex + 1 < args.length) {
        const moduleName = args[moduleIndex + 1];
        const result = await scanner.scanModule(moduleName);

        if (result.success) {
            console.log(JSON.stringify(result.data, null, 2));
            process.exit(0);
        } else {
            Logger.error(`Failed to scan module: ${result.error}`);
            process.exit(1);
        }
    }

    // Generate unified modules
    const outputFormat = args.includes('--output') ?
        args[args.indexOf('--output') + 1] : 'pretty';

    const unified = await scanner.generateUnifiedModules();

    switch (outputFormat) {
        case 'json':
            console.log(JSON.stringify(unified, null, 2));
            break;
        case 'legacy':
            console.log(JSON.stringify({ modules: unified.modules }, null, 2));
            break;
        case 'pretty':
        default:
            console.log(`\nUnified Modules Configuration:`);
            console.log(`Generated: ${unified.generated_at}`);
            console.log(`Modules found: ${unified.modules.length}\n`);

            unified.modules.forEach(module => {
                const source = module._source || 'unknown';
                console.log(`📦 ${module.name} (${source})`);
                console.log(`   ${module.title}`);
                console.log(`   ${module.url}`);
                console.log('');
            });
            break;
    }
}

// Export for testing
module.exports = { ModuleScanner, GitHubClient, Logger };

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        Logger.error(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}