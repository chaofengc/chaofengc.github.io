/**
 * Simple animations for the academic portfolio website
 */
document.addEventListener('DOMContentLoaded', function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Add fade-in animation to main sections
    const sections = document.querySelectorAll('.profile-section, .research-interests, .projects-section, .publications-list');
    
    if (!prefersReducedMotion) {
        // Simple staggered fade-in for sections using CSS classes.
        sections.forEach((section, index) => {
            section.classList.add('fade-in-section');
            setTimeout(() => {
                section.classList.add('is-visible');
            }, 80 * index);
        });
    }
    
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.site-nav .page-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only apply to same-page links
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: prefersReducedMotion ? 'auto' : 'smooth'
                    });
                }
            }
        });
    });
});