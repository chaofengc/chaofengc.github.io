// Projects page functionality
class ProjectsManager {
    constructor() {
        this.projects = [];
        this.allTags = [];
        this.currentFilter = 'all';
        this.githubStarsCache = new Map();
        this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
        this.init();
    }

    async init() {
        try {
            // Add loading state to prevent layout shifts
            const projectsContainer = document.getElementById('projects-container');
            const filterContainer = document.getElementById('filter-tags');
            
            if (projectsContainer) {
                projectsContainer.style.minHeight = '400px';
                projectsContainer.innerHTML = '<div class="loading">Loading projects...</div>';
            }
            
            if (filterContainer) {
                filterContainer.style.minHeight = '50px';
            }
            
            await this.loadProjects();
            this.renderFilterTags();
            this.renderProjects(); // Render with loading indicators
            this.setupEventListeners();
            
            // Load GitHub stars in the background and update display
            this.loadGitHubStars().then(() => {
                this.renderProjects(); // Re-render with actual star counts
                this.updateStats();
            }).catch(error => {
                console.warn('GitHub stars loading failed, using fallback values:', error);
                this.renderProjects(); // Re-render with fallback values
                this.updateStats();
            });
        } catch (error) {
            console.error('Error initializing projects:', error);
            this.showError('Failed to load projects. Please try again later.');
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('data/projects.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.projects = data.projects || [];
            
            // 自动从项目的tags字段提取所有唯一标签
            const tagSet = new Set();
            this.projects.forEach(project => {
                if (project.tags && Array.isArray(project.tags)) {
                    project.tags.forEach(tag => tagSet.add(tag));
                }
            });
            this.allTags = Array.from(tagSet).sort();
        } catch (error) {
            console.error('Error loading projects:', error);
            throw error;
        }
    }

    async loadGitHubStars() {
        console.log('Loading GitHub stars for projects...');
        
        const promises = this.projects.map(async (project) => {
            if (project.github_repo) {
                try {
                    const stars = await this.getGitHubStars(project.github_repo);
                    project.github_stars = stars;
                    if (stars > 0) {
                        console.log(`✓ ${project.github_repo}: ${stars} stars`);
                    }
                } catch (error) {
                    console.warn(`Failed to fetch stars for ${project.github_repo}:`, error);
                    // Try fallback first
                    const fallbackStars = this.getFallbackStars(project.github_repo);
                    project.github_stars = fallbackStars > 0 ? fallbackStars : 0;
                    if (fallbackStars > 0) {
                        console.log(`✓ ${project.github_repo}: ${fallbackStars} stars (fallback)`);
                    }
                }
            } else {
                project.github_stars = 0;
            }
        });

        await Promise.all(promises);
        console.log('GitHub stars loading completed');
    }

    async getGitHubStars(repo) {
        // Check cache first
        const cacheKey = repo;
        const cached = this.githubStarsCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.stars;
        }

        try {
            // Fetch from GitHub API
            const response = await fetch(`https://api.github.com/repos/${repo}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Portfolio-Website'
                    // Note: For production, consider adding GitHub token for higher rate limits
                    // 'Authorization': 'token YOUR_GITHUB_TOKEN'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 403) {
                    console.warn(`GitHub API rate limit exceeded for repo: ${repo}. Status: ${response.status}`);
                    console.warn('Rate limit info:', {
                        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
                        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
                        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset')
                    });
                    
                    // Always use fallback values when rate limited
                    const fallbackStars = this.getFallbackStars(repo);
                    if (fallbackStars > 0) {
                        console.log(`✓ Using fallback stars (${fallbackStars}) for ${repo} due to rate limit`);
                        return fallbackStars;
                    }
                    return cached ? cached.stars : 0;
                }
                
                if (response.status === 404) {
                    console.warn(`Repository not found: ${repo}`);
                    return 0;
                }
                
                throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const stars = data.stargazers_count || 0;

            // Cache the result
            this.githubStarsCache.set(cacheKey, {
                stars: stars,
                timestamp: Date.now()
            });

            console.log(`✓ Fetched ${stars} stars for ${repo} from GitHub API`);
            return stars;
        } catch (error) {
            console.warn(`Error fetching GitHub stars for ${repo}:`, error.message);
            
            // Try fallback values first
            const fallbackStars = this.getFallbackStars(repo);
            if (fallbackStars > 0) {
                console.log(`✓ Using fallback stars (${fallbackStars}) for ${repo} due to API error`);
                return fallbackStars;
            }
            
            return cached ? cached.stars : 0;
        }
    }

    getFallbackStars(repo) {
        // Fallback star counts for popular repositories (updated as of 2024)
        const fallbackData = {
            'VQAssessment/FastVQA': 245,
            'VQAssessment/DOVER': 189,
            'csxmli2016/DFDNet': 1250,
            'chaofengc/FeMaSR': 467,
            'chaofengc/Q-Bench': 89,
            'Q-Future/Q-Instruct': 156,
            'chaofengc/OneScorer': 45,
            'chaofengc/PYIQA': 890,
            'chaofengc/IQA-PyTorch': 1200,
            'chaofengc/PSFRGAN': 320,
            'chaofengc/Face-SPARNet': 180
        };
        
        return fallbackData[repo] || 0;
    }

    renderFilterTags() {
        const filterTagsContainer = document.getElementById('filterTags');
        if (!filterTagsContainer) return;

        // Clear all existing tags
        filterTagsContainer.innerHTML = '';

        // Add "All Projects" button
        const allButton = document.createElement('button');
        allButton.className = 'filter-tag active';
        allButton.setAttribute('data-tag', 'all');
        allButton.textContent = 'All Projects';
        allButton.addEventListener('click', () => this.filterProjects('all'));
        filterTagsContainer.appendChild(allButton);

        // Add Featured filter button
        const featuredButton = document.createElement('button');
        featuredButton.className = 'filter-tag';
        featuredButton.setAttribute('data-tag', 'featured');
        featuredButton.textContent = 'Featured';
        featuredButton.addEventListener('click', () => this.filterProjects('featured'));
        filterTagsContainer.appendChild(featuredButton);

        // Add tag buttons (从项目tags字段自动生成)
        this.allTags.forEach(tag => {
            const tagButton = document.createElement('button');
            tagButton.className = 'filter-tag';
            tagButton.setAttribute('data-tag', tag);
            tagButton.textContent = tag;
            tagButton.addEventListener('click', () => this.filterProjects(tag));
            filterTagsContainer.appendChild(tagButton);
        });
    }

    renderProjects(filteredProjects = null) {
        const container = document.getElementById('projectsContainer');
        if (!container) return;

        const projectsToRender = filteredProjects || this.projects;
        
        if (projectsToRender.length === 0) {
            container.innerHTML = '<div class="no-projects">No projects found for the selected filter.</div>';
            return;
        }

        container.innerHTML = projectsToRender.map(project => this.createProjectCard(project)).join('');
    }

    createProjectCard(project) {
        let githubStarsDisplay = '';
        
        if (project.github_repo) {
            if (project.github_stars !== undefined) {
                // Stars have been loaded
                if (project.github_stars > 0) {
                    githubStarsDisplay = `<div class="project-stars">
                        <i class="fab fa-github"></i>
                        <span>${this.formatNumber(project.github_stars)}</span>
                    </div>`;
                }
            } else {
                // Stars are still loading
                githubStarsDisplay = `<div class="project-stars loading">
                    <i class="fab fa-github"></i>
                    <span>...</span>
                </div>`;
            }
        }

        const featuredBadge = project.featured ? 
            '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : '';

        const venueYear = project.venue && project.year ? 
            `<span class="project-venue">${project.venue} ${project.year}</span>` : '';

        const tagsHtml = project.tags.map(tag => 
            `<span class="project-tag" data-tag="${tag}">${tag}</span>`
        ).join('');

        const linksHtml = Object.entries(project.links).map(([type, url]) => {
            const iconMap = {
                paper: 'fas fa-file-alt',
                github: 'fab fa-github',
                demo: 'fas fa-play-circle',
                project: 'fas fa-external-link-alt'
            };
            const icon = iconMap[type] || 'fas fa-link';
            return `<a href="${url}" target="_blank" class="project-link" title="${type}">
                        <i class="${icon}"></i>
                        <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </a>`;
        }).join('');

        return `
            <div class="project-card" data-tags="${project.tags.join(',')}" data-featured="${project.featured}">
                ${featuredBadge}
                <div class="project-image">
                    <img src="${project.image}" alt="${project.title}" loading="lazy">
                    <div class="project-overlay">
                        <div class="project-links">
                            ${linksHtml}
                        </div>
                    </div>
                </div>
                <div class="project-content">
                    <div class="project-header">
                        <div class="project-title-row">
                            <h3 class="project-title">${project.title}</h3>
                            ${venueYear}
                        </div>
                        ${githubStarsDisplay}
                    </div>
                    <p class="project-description">${project.description}</p>
                    <div class="project-tags">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    filterProjects(tag) {
        this.currentFilter = tag;
        
        // Update active filter button
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tag="${tag}"]`).classList.add('active');

        // Filter and render projects
        let filteredProjects;
        if (tag === 'all') {
            filteredProjects = this.projects;
        } else if (tag === 'featured') {
            filteredProjects = this.projects.filter(project => 
                project.featured === true
            );
        } else {
            filteredProjects = this.projects.filter(project => 
                project.tags.includes(tag)
            );
        }

        this.renderProjects(filteredProjects);
        this.updateStats(filteredProjects);
    }

    updateStats(filteredProjects = null) {
        const projectsToCount = filteredProjects || this.projects;
        
        const totalProjects = projectsToCount.length;
        const totalStars = projectsToCount.reduce((sum, project) => sum + (project.github_stars || 0), 0);
        const featuredProjects = projectsToCount.filter(project => project.featured).length;

        this.animateNumber('totalProjects', totalProjects);
        this.animateNumber('totalStars', totalStars);
        this.animateNumber('featuredProjects', featuredProjects);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000; // 1 second
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = this.formatNumber(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    setupEventListeners() {
        // Filter tag click handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-tag')) {
                const tag = e.target.getAttribute('data-tag');
                this.filterProjects(tag);
            }
            
            // Project tag click handlers
            if (e.target.classList.contains('project-tag')) {
                const tag = e.target.getAttribute('data-tag');
                this.filterProjects(tag);
            }
        });

        // Mobile navigation
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking on a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }

        // Smooth scrolling for internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    showError(message) {
        const container = document.getElementById('projectsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProjectsManager();
});

// Add some utility functions for enhanced functionality
window.ProjectsUtils = {
    // Function to search projects
    searchProjects: function(query) {
        const projectsManager = window.projectsManager;
        if (!projectsManager) return;

        const filteredProjects = projectsManager.projects.filter(project => 
            project.title.toLowerCase().includes(query.toLowerCase()) ||
            project.description.toLowerCase().includes(query.toLowerCase()) ||
            project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        projectsManager.renderProjects(filteredProjects);
        projectsManager.updateStats(filteredProjects);
    },

    // Function to sort projects
    sortProjects: function(sortBy) {
        const projectsManager = window.projectsManager;
        if (!projectsManager) return;

        let sortedProjects = [...projectsManager.projects];
        
        switch(sortBy) {
            case 'stars':
                sortedProjects.sort((a, b) => (b.github_stars || 0) - (a.github_stars || 0));
                break;
            case 'year':
                sortedProjects.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case 'title':
                sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'featured':
                sortedProjects.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                break;
        }

        projectsManager.renderProjects(sortedProjects);
    }
};