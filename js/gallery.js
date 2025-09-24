/**
 * Gallery Management System
 * Handles image gallery display, filtering, and lightbox functionality
 */

class GalleryManager {
    constructor() {
        this.galleryData = null;
        this.filteredData = null;
        this.currentLightboxItem = null;
        this.currentImageIndex = 0;
        this.autoPlayInterval = null;
        this.isAutoPlaying = false;
        
        this.init();
    }

    /**
     * Initialize the gallery system
     */
    async init() {
        try {
            this.showLoading(true);
            await this.loadGalleryData();
            this.setupEventListeners();
            this.populateFilters();
            this.renderGallery();
            this.updateStats();
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showError('加载相册数据失败，请刷新页面重试。');
        }
    }

    /**
     * Load gallery data from JSON file
     */
    async loadGalleryData() {
        try {
            const response = await fetch('data/gallery.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.galleryData = data.gallery;
            this.filteredData = [...this.galleryData];
            this.config = data.config;
            this.categories = data.categories;
        } catch (error) {
            console.error('Error loading gallery data:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter controls
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('yearFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('tagFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());

        // Lightbox controls
        document.getElementById('lightboxModal').addEventListener('click', (e) => {
            if (e.target.id === 'lightboxModal') {
                this.closeLightbox();
            }
        });
        
        document.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousImage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextImage());
        document.getElementById('autoPlayBtn').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Populate filter dropdowns
     */
    populateFilters() {
        this.populateCategoryFilter();
        this.populateYearFilter();
        this.populateTagFilter();
    }

    /**
     * Populate category filter
     */
    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = this.categories || [];
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Populate year filter
     */
    populateYearFilter() {
        const yearFilter = document.getElementById('yearFilter');
        const years = [...new Set(this.galleryData.map(item => item.year))].sort((a, b) => b - a);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }

    /**
     * Populate tag filter
     */
    populateTagFilter() {
        const tagFilter = document.getElementById('tagFilter');
        const allTags = new Set();
        
        this.galleryData.forEach(item => {
            item.tags.forEach(tag => allTags.add(tag));
        });
        
        [...allTags].sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
    }

    /**
     * Apply filters to gallery data
     */
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const yearFilter = document.getElementById('yearFilter').value;
        const tagFilter = document.getElementById('tagFilter').value;

        this.filteredData = this.galleryData.filter(item => {
            const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
            const yearMatch = yearFilter === 'all' || item.year.toString() === yearFilter;
            const tagMatch = tagFilter === 'all' || item.tags.includes(tagFilter);
            
            return categoryMatch && yearMatch && tagMatch;
        });

        this.renderGallery();
        this.updateStats();
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('yearFilter').value = 'all';
        document.getElementById('tagFilter').value = 'all';
        
        this.filteredData = [...this.galleryData];
        this.renderGallery();
        this.updateStats();
    }

    /**
     * Render gallery items
     */
    renderGallery() {
        const container = document.getElementById('galleryContainer');
        
        // Clean up existing carousels before clearing container
        const existingItems = container.querySelectorAll('.gallery-item');
        existingItems.forEach(item => {
            if (item._cleanupCarousel) {
                item._cleanupCarousel();
            }
        });
        
        container.innerHTML = '';

        if (this.filteredData.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>没有找到匹配的相册</h3>
                    <p>请尝试调整筛选条件</p>
                </div>
            `;
            return;
        }

        this.filteredData.forEach(item => {
            const galleryItem = this.createGalleryItem(item);
            container.appendChild(galleryItem);
        });
    }

    /**
     * Create a gallery item element
     */
    createGalleryItem(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'gallery-item';
        if (item.featured) {
            itemElement.classList.add('featured');
        }

        const imageCount = item.images.length;

        // Create image carousel structure for multiple images
        let imageCarouselHTML = '';
        if (imageCount > 1) {
            imageCarouselHTML = `
                <div class="card-carousel">
                    <div class="card-carousel-container">
                        ${item.images.map((img, index) => `
                            <img src="${img.src}" alt="${img.alt}" loading="lazy" 
                                 class="card-carousel-image ${index === 0 ? 'active' : ''}" 
                                 data-index="${index}">
                        `).join('')}
                    </div>
                    <div class="card-carousel-indicators">
                        ${item.images.map((_, index) => `
                            <span class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            imageCarouselHTML = `<img src="${item.images[0].src}" alt="${item.images[0].alt}" loading="lazy">`;
        }

        itemElement.innerHTML = `
            <div class="gallery-item-image">
                ${imageCarouselHTML}
                <div class="image-overlay">
                    <div class="overlay-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <div class="item-meta">
                            <span class="image-count">
                                <i class="fas fa-images"></i> ${imageCount} 张照片
                            </span>
                            <span class="item-date">
                                <i class="fas fa-calendar"></i> ${this.formatDate(item.date)}
                            </span>
                        </div>
                        <div class="item-tags">
                            ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                ${item.featured ? '<div class="featured-badge"><i class="fas fa-star"></i></div>' : ''}
            </div>
        `;

        // Add click event to open lightbox
        itemElement.addEventListener('click', () => this.openLightbox(item));

        // Setup card carousel if multiple images
        if (imageCount > 1) {
            this.setupCardCarousel(itemElement, item);
        }

        return itemElement;
    }

    /**
     * Setup carousel functionality for individual cards
     */
    setupCardCarousel(itemElement, item) {
        const images = itemElement.querySelectorAll('.card-carousel-image');
        const indicators = itemElement.querySelectorAll('.indicator');
        let currentIndex = 0;
        let autoPlayInterval;

        const showImage = (index) => {
            // Hide all images
            images.forEach(img => img.classList.remove('active'));
            indicators.forEach(ind => ind.classList.remove('active'));
            
            // Show current image
            images[index].classList.add('active');
            indicators[index].classList.add('active');
        };

        const nextImage = () => {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        };

        // Auto-play functionality
        const startAutoPlay = () => {
            autoPlayInterval = setInterval(nextImage, 3000); // 3 seconds interval
        };

        const stopAutoPlay = () => {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        };

        // Add indicator click events
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening lightbox
                currentIndex = index;
                showImage(currentIndex);
                stopAutoPlay();
                startAutoPlay(); // Restart auto-play
            });
        });

        // Pause auto-play on hover
        itemElement.addEventListener('mouseenter', stopAutoPlay);
        itemElement.addEventListener('mouseleave', startAutoPlay);

        // Start auto-play
        startAutoPlay();

        // Store cleanup function for later use
        itemElement._cleanupCarousel = stopAutoPlay;
    }

    /**
     * Open lightbox with gallery item
     */
    openLightbox(item) {
        this.currentLightboxItem = item;
        this.currentImageIndex = 0;
        
        document.getElementById('lightboxTitle').textContent = item.title;
        document.getElementById('lightboxDescription').textContent = item.description;
        
        this.renderLightboxImages();
        this.updateLightboxImage();
        
        document.getElementById('lightboxModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close lightbox
     */
    closeLightbox() {
        document.getElementById('lightboxModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (this.isAutoPlaying) {
            this.stopAutoPlay();
        }
        
        this.currentLightboxItem = null;
        this.currentImageIndex = 0;
    }

    /**
     * Render images in lightbox slider
     */
    renderLightboxImages() {
        const sliderTrack = document.getElementById('sliderTrack');
        sliderTrack.innerHTML = '';

        this.currentLightboxItem.images.forEach((image, index) => {
            const imageElement = document.createElement('div');
            imageElement.className = 'slider-image';
            imageElement.innerHTML = `
                <img src="${image.src}" alt="${image.alt}">
            `;
            sliderTrack.appendChild(imageElement);
        });
    }

    /**
     * Update current lightbox image
     */
    updateLightboxImage() {
        const sliderTrack = document.getElementById('sliderTrack');
        const images = this.currentLightboxItem.images;
        const currentImage = images[this.currentImageIndex];
        
        // Update slider position
        const translateX = -this.currentImageIndex * 100;
        sliderTrack.style.transform = `translateX(${translateX}%)`;
        
        // Update image info
        document.getElementById('imageCaption').textContent = currentImage.caption || '';
        document.getElementById('imageCounter').textContent = 
            `${this.currentImageIndex + 1} / ${images.length}`;
        
        // Update navigation buttons
        document.getElementById('prevBtn').style.display = 
            this.currentImageIndex === 0 ? 'none' : 'block';
        document.getElementById('nextBtn').style.display = 
            this.currentImageIndex === images.length - 1 ? 'none' : 'block';
    }

    /**
     * Navigate to previous image
     */
    previousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.updateLightboxImage();
        }
    }

    /**
     * Navigate to next image
     */
    nextImage() {
        if (this.currentImageIndex < this.currentLightboxItem.images.length - 1) {
            this.currentImageIndex++;
            this.updateLightboxImage();
        }
    }

    /**
     * Toggle auto play
     */
    toggleAutoPlay() {
        if (this.isAutoPlaying) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    /**
     * Start auto play
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        const autoPlayBtn = document.getElementById('autoPlayBtn');
        autoPlayBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停播放';
        
        this.autoPlayInterval = setInterval(() => {
            if (this.currentImageIndex < this.currentLightboxItem.images.length - 1) {
                this.nextImage();
            } else {
                this.currentImageIndex = 0;
                this.updateLightboxImage();
            }
        }, this.config.autoSlideInterval || 5000);
    }

    /**
     * Stop auto play
     */
    stopAutoPlay() {
        this.isAutoPlaying = false;
        const autoPlayBtn = document.getElementById('autoPlayBtn');
        autoPlayBtn.innerHTML = '<i class="fas fa-play"></i> 自动播放';
        
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        const modal = document.getElementById('lightboxModal');
        
        if (!document.fullscreenElement) {
            modal.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (document.getElementById('lightboxModal').style.display === 'flex') {
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleAutoPlay();
                    break;
            }
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update lightbox layout if open
        if (this.currentLightboxItem) {
            this.updateLightboxImage();
        }
    }

    /**
     * Update statistics
     */
    updateStats() {
        const totalItems = this.filteredData.length;
        const totalPhotos = this.filteredData.reduce((sum, item) => sum + item.images.length, 0);
        const featuredItems = this.filteredData.filter(item => item.featured).length;

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalPhotos').textContent = totalPhotos;
        document.getElementById('featuredItems').textContent = featuredItems;
    }

    /**
     * Format date string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Show/hide loading indicator
     */
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('galleryContainer');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">重试</button>
            </div>
        `;
        this.showLoading(false);
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GalleryManager();
});