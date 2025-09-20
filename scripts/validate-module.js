#!/usr/bin/env node

/**
 * Module Validator for InfoTech.io Platform
 * Validates module.json files against JSON Schema
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Configuration
const SCHEMA_PATH = path.join(__dirname, '../schemas/module.json');
const ORG_NAME = 'info-tech-io';

/**
 * Logger utility with colored output
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
 * Module JSON validator
 */
class ModuleValidator {
    constructor() {
        this.ajv = new Ajv({ allErrors: true, verbose: true });
        addFormats(this.ajv);
        this.schema = null;
        this.loadSchema();
    }

    /**
     * Load JSON Schema
     */
    loadSchema() {
        try {
            const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
            this.schema = JSON.parse(schemaContent);
            this.validate = this.ajv.compile(this.schema);
            Logger.debug('JSON Schema loaded successfully');
        } catch (error) {
            Logger.error(`Failed to load schema: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Validate module.json content
     */
    validateModule(moduleData, moduleName = 'unknown') {
        Logger.info(`Validating module: ${moduleName}`);

        // Schema validation
        const isValid = this.validate(moduleData);

        if (!isValid) {
            Logger.error(`Schema validation failed for ${moduleName}:`);
            this.validate.errors.forEach(error => {
                const path = error.instancePath || 'root';
                Logger.error(`  ${path}: ${error.message}`);
                if (error.data !== undefined) {
                    Logger.error(`    Current value: ${JSON.stringify(error.data)}`);
                }
            });
            return false;
        }

        // Additional semantic validations
        const warnings = this.performSemanticValidation(moduleData);
        if (warnings.length > 0) {
            warnings.forEach(warning => Logger.warning(warning));
        }

        Logger.success(`Module ${moduleName} passed validation`);
        return true;
    }

    /**
     * Perform additional semantic validations
     */
    performSemanticValidation(moduleData) {
        const warnings = [];

        // Check if subdomain matches module name
        if (moduleData.deployment?.subdomain !== moduleData.name) {
            warnings.push(`Subdomain "${moduleData.deployment?.subdomain}" doesn't match module name "${moduleData.name}"`);
        }

        // Check if repository name follows convention
        const expectedRepo = `mod_${moduleData.name.replace(/-/g, '_')}`;
        if (moduleData.deployment?.repository !== expectedRepo) {
            warnings.push(`Repository name "${moduleData.deployment?.repository}" doesn't follow convention. Expected: "${expectedRepo}"`);
        }

        // Check production URL format
        const expectedUrl = `https://${moduleData.name}.infotecha.ru`;
        if (moduleData.urls?.production !== expectedUrl) {
            warnings.push(`Production URL "${moduleData.urls?.production}" doesn't match expected format: "${expectedUrl}"`);
        }

        // Check if license is specified
        if (!moduleData.metadata?.license) {
            warnings.push('License not specified - consider adding one');
        }

        // Check Hugo version currency
        if (moduleData.hugo_config?.hugo_version && moduleData.hugo_config.hugo_version !== '0.148.0') {
            warnings.push(`Hugo version ${moduleData.hugo_config.hugo_version} differs from current platform version 0.148.0`);
        }

        // Check tag count
        if (moduleData.metadata?.tags && moduleData.metadata.tags.length < 3) {
            warnings.push('Consider adding more tags (3-5 recommended) for better categorization');
        }

        return warnings;
    }

    /**
     * Validate module from file path
     */
    async validateFromFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                Logger.error(`File not found: ${filePath}`);
                return false;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const moduleData = JSON.parse(content);
            const moduleName = path.basename(path.dirname(filePath)) || 'unknown';

            return this.validateModule(moduleData, moduleName);
        } catch (error) {
            Logger.error(`Failed to read/parse file ${filePath}: ${error.message}`);
            return false;
        }
    }

    /**
     * Validate module from URL
     */
    async validateFromUrl(url) {
        return new Promise((resolve, reject) => {
            Logger.info(`Fetching module from: ${url}`);

            https.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const moduleData = JSON.parse(data);
                        const urlParts = url.split('/');
                        const repoIndex = urlParts.findIndex(part => part.startsWith('mod_'));
                        const moduleName = repoIndex !== -1 ? urlParts[repoIndex] : 'unknown';

                        const isValid = this.validateModule(moduleData, moduleName);
                        resolve(isValid);
                    } catch (error) {
                        Logger.error(`Failed to parse JSON from URL: ${error.message}`);
                        resolve(false);
                    }
                });
            }).on('error', (error) => {
                Logger.error(`Failed to fetch URL: ${error.message}`);
                resolve(false);
            });
        });
    }

    /**
     * Generate module.json template
     */
    generateTemplate() {
        const template = {
            "schema_version": "1.0",
            "name": "{{MODULE_NAME}}",
            "title": "{{MODULE_TITLE}}",
            "description": "{{MODULE_DESCRIPTION}}",
            "version": "0.1.0",
            "type": "educational",

            "deployment": {
                "subdomain": "{{MODULE_NAME}}",
                "repository": "mod_{{MODULE_NAME_UNDERSCORE}}",
                "build_system": "hugo-base"
            },

            "hugo_config": {
                "template": "default",
                "theme": "compose",
                "components": ["quiz-engine"],
                "hugo_version": "0.148.0"
            },

            "metadata": {
                "author": "InfoTech.io Team",
                "difficulty": "beginner",
                "estimated_time": "20 hours",
                "language": "ru",
                "tags": ["{{TAG1}}", "{{TAG2}}", "{{TAG3}}"]
            },

            "urls": {
                "production": "https://{{MODULE_NAME}}.infotecha.ru",
                "repository": "https://github.com/info-tech-io/mod_{{MODULE_NAME_UNDERSCORE}}"
            },

            "status": {
                "lifecycle": "development",
                "last_updated": new Date().toISOString().split('T')[0],
                "content_complete": false
            }
        };

        return JSON.stringify(template, null, 2);
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Module Validator for InfoTech.io Platform

USAGE:
  validate-module.js <file_path>           Validate local module.json file
  validate-module.js --url <url>           Validate remote module.json file
  validate-module.js --template            Generate module.json template
  validate-module.js --help                Show this help

EXAMPLES:
  validate-module.js ./module.json
  validate-module.js --url https://raw.githubusercontent.com/info-tech-io/mod_linux_base/main/module.json
  validate-module.js --template > template.json

OPTIONS:
  --url <url>      Validate module from URL
  --template       Generate module.json template
  --verbose        Enable verbose output
  --help, -h       Show help
        `);
        process.exit(0);
    }

    // Enable debug mode if verbose
    if (args.includes('--verbose')) {
        process.env.DEBUG = 'true';
    }

    const validator = new ModuleValidator();

    // Generate template
    if (args.includes('--template')) {
        console.log(validator.generateTemplate());
        process.exit(0);
    }

    // Validate from URL
    const urlIndex = args.indexOf('--url');
    if (urlIndex !== -1 && urlIndex + 1 < args.length) {
        const url = args[urlIndex + 1];
        const isValid = await validator.validateFromUrl(url);
        process.exit(isValid ? 0 : 1);
    }

    // Validate from file
    const filePath = args[0];
    if (filePath && !filePath.startsWith('--')) {
        const isValid = await validator.validateFromFile(filePath);
        process.exit(isValid ? 0 : 1);
    }

    Logger.error('Invalid arguments. Use --help for usage information.');
    process.exit(1);
}

// Export for testing
module.exports = { ModuleValidator, Logger };

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        Logger.error(`Unexpected error: ${error.message}`);
        process.exit(1);
    });
}