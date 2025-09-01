/**
 * InfoTech.io Modules Loader
 * Загружает каталог курсов из modules.json и отображает их на главной странице
 */

class ModulesLoader {
    constructor() {
        this.modulesUrl = '/modules.json';
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.loadingEl = document.getElementById('loading');
        this.errorEl = document.getElementById('error');
        this.coursesGridEl = document.getElementById('courses-grid');
        this.emptyEl = document.getElementById('empty');
        this.retryButtonEl = document.getElementById('retry-button');
        
        this.init();
    }

    init() {
        this.loadModules();
        this.retryButtonEl.addEventListener('click', () => this.loadModules());
    }

    async loadModules() {
        this.showLoading();
        
        try {
            console.log('🔄 Loading modules from:', this.modulesUrl);
            
            const response = await fetch(this.modulesUrl, {
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Modules loaded:', data);
            
            this.renderModules(data);
            this.retryCount = 0; // Reset retry count on success
            
        } catch (error) {
            console.error('❌ Error loading modules:', error);
            this.handleError(error);
        }
    }

    renderModules(data) {
        if (!data.modules || Object.keys(data.modules).length === 0) {
            this.showEmpty();
            return;
        }

        const activeModules = Object.entries(data.modules)
            .filter(([key, module]) => module.status === 'active')
            .sort((a, b) => a[1].name.localeCompare(b[1].name));

        if (activeModules.length === 0) {
            this.showEmpty();
            return;
        }

        const coursesHtml = activeModules.map(([key, module]) => 
            this.createModuleCard(key, module, data.platform.domain)
        ).join('');

        this.coursesGridEl.innerHTML = coursesHtml;
        this.showCourses();
    }

    createModuleCard(moduleKey, module, domain) {
        const moduleUrl = `https://${module.subdomain}.${domain}`;
        const lastUpdated = new Date(module.last_updated).toLocaleDateString('ru-RU');
        
        // Определяем иконку по категории (для будущего использования)
        const categoryIcon = this.getCategoryIcon(module.category);
        
        return `
            <article class="course-card">
                <div class="course-header">
                    <div class="course-icon">${categoryIcon}</div>
                    <div class="course-meta">
                        <span class="course-difficulty">${this.getDifficultyLabel(module.difficulty)}</span>
                        ${module.duration ? `<span class="course-duration">${module.duration}</span>` : ''}
                    </div>
                </div>
                
                <div class="course-content">
                    <h3 class="course-title">
                        <a href="${moduleUrl}" target="_blank">${module.name}</a>
                    </h3>
                    <p class="course-description">${module.description}</p>
                    
                    ${module.tags ? `
                        <div class="course-tags">
                            ${module.tags.map(tag => `<span class="course-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="course-footer">
                    <span class="course-updated">Обновлен: ${lastUpdated}</span>
                    <a href="${moduleUrl}" class="course-button" target="_blank">
                        Изучать →
                    </a>
                </div>
            </article>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            'devops': '⚙️',
            'programming': '💻',
            'web-development': '🌐',
            'data-science': '📊',
            'design': '🎨',
            'mobile': '📱'
        };
        return icons[category] || '📚';
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            'beginner': 'Начальный',
            'intermediate': 'Средний',
            'advanced': 'Продвинутый'
        };
        return labels[difficulty] || difficulty;
    }

    showLoading() {
        this.loadingEl.style.display = 'flex';
        this.errorEl.style.display = 'none';
        this.coursesGridEl.style.display = 'none';
        this.emptyEl.style.display = 'none';
    }

    showError() {
        this.loadingEl.style.display = 'none';
        this.errorEl.style.display = 'block';
        this.coursesGridEl.style.display = 'none';
        this.emptyEl.style.display = 'none';
    }

    showCourses() {
        this.loadingEl.style.display = 'none';
        this.errorEl.style.display = 'none';
        this.coursesGridEl.style.display = 'grid';
        this.emptyEl.style.display = 'none';
    }

    showEmpty() {
        this.loadingEl.style.display = 'none';
        this.errorEl.style.display = 'none';
        this.coursesGridEl.style.display = 'none';
        this.emptyEl.style.display = 'block';
    }

    handleError(error) {
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            console.log(`🔄 Retry ${this.retryCount}/${this.maxRetries} in 2 seconds...`);
            setTimeout(() => this.loadModules(), 2000);
        } else {
            console.error(`❌ Max retries (${this.maxRetries}) reached`);
            this.showError();
        }
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 InfoTech.io Modules Loader initialized');
    new ModulesLoader();
});

// Обработка ошибок JavaScript
window.addEventListener('error', (event) => {
    console.error('💥 JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});
