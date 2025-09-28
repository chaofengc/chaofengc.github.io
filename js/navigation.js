/**
 * Unified Navigation Header Generator
 * Generates consistent navigation headers for all pages
 */

class NavigationGenerator {
    constructor() {
        this.siteTitle = "CHEN Chaofeng";
        this.navigationItems = [
            { name: "About", href: "index.html", id: "home" },
            { name: "Publications", href: "publications.html", id: "publications" },
            // { name: "Projects", href: "projects.html", id: "projects" },
            // { name: "Group", href: "group.html", id: "group" },
            { name: "Openings", href: "openings.html", id: "openings" },
            // { name: "Gallery", href: "gallery.html", id: "gallery" }
        ];
    }

    /**
     * Get the current page identifier based on the current URL
     */
    getCurrentPage() {
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'index.html';
        
        // Map file names to page identifiers
        const pageMap = {
            'index.html': 'home',
            '': 'home', // Root path
            'publications.html': 'publications',
            'group.html': 'group',
            'projects.html': 'projects',
            'gallery.html': 'gallery',
            'openings.html': 'openings'
        };
        
        return pageMap[currentFile] || 'home';
    }

    /**
     * Generate the navigation HTML structure
     */
    generateNavigation() {
        const currentPage = this.getCurrentPage();
        
        const navigationHTML = `
            <header class="site-header">
                <div class="wrapper">
                    <a class="site-title" href="index.html">${this.siteTitle}</a>
                    <nav class="site-nav">
                        <input type="checkbox" id="nav-trigger" class="nav-trigger">
                        <label for="nav-trigger">
                            <span class="menu-icon">
                                <i class="fas fa-bars"></i>
                            </span>
                        </label>
                        <div class="trigger">
                            ${this.generateNavigationLinks(currentPage)}
                        </div>
                    </nav>
                </div>
            </header>
        `;
        
        return navigationHTML;
    }

    /**
     * Generate navigation links with proper active state
     */
    generateNavigationLinks(currentPage) {
        return this.navigationItems
            .filter(item => !item.hidden) // Filter out hidden items
            .map(item => {
                const activeClass = item.id === currentPage ? ' active' : '';
                return `<a class="page-link${activeClass}" href="${item.href}">${item.name}</a>`;
            })
            .join('\n                            ');
    }

    /**
     * Insert navigation into the page
     */
    insertNavigation() {
        // Check if navigation already exists
        const existingHeader = document.querySelector('.site-header');
        if (existingHeader) {
            console.log('Navigation already exists, skipping insertion');
            return;
        }

        const navigationHTML = this.generateNavigation();
        
        // Insert at the beginning of body
        const body = document.body;
        if (body) {
            body.insertAdjacentHTML('afterbegin', navigationHTML);
        }
    }

    /**
     * Replace existing navigation
     */
    replaceNavigation() {
        const existingHeader = document.querySelector('.site-header');
        if (existingHeader) {
            existingHeader.remove();
        }
        this.insertNavigation();
    }

    /**
     * Initialize navigation system
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.insertNavigation();
                this.initScrollEffect();
            });
        } else {
            this.insertNavigation();
            this.initScrollEffect();
        }
    }

    /**
     * Initialize scroll effect for transparent navigation
     */
    initScrollEffect() {
        let ticking = false;
        let isInitialized = false;
        
        const updateNavigation = () => {
            const header = document.querySelector('.site-header');
            if (!header) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const threshold = 100; // 滚动超过100px时触发透明效果
            
            // 立即设置初始状态，避免闪烁
            if (scrollTop > threshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateNavigation);
                ticking = true;
            }
        };
        
        // 立即设置初始状态
        const header = document.querySelector('.site-header');
        if (header) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 100) {
                header.classList.add('scrolled');
            }
            isInitialized = true;
        }
        
        // 监听滚动事件
        window.addEventListener('scroll', () => {
            requestTick();
        }, { passive: true });
    }

    /**
     * Update navigation items configuration
     */
    updateNavigationItems(items) {
        this.navigationItems = items;
    }

    /**
     * Show/hide specific navigation item
     */
    toggleNavigationItem(itemId, show = true) {
        const item = this.navigationItems.find(item => item.id === itemId);
        if (item) {
            item.hidden = !show;
            this.replaceNavigation();
        }
    }
}

// Create global navigation instance
const navigation = new NavigationGenerator();

// Auto-initialize when script loads
navigation.init();

// Export for manual control if needed
window.NavigationGenerator = NavigationGenerator;
window.navigation = navigation;