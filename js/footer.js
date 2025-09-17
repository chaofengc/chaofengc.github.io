/**
 * Unified Footer Management System
 * Ensures consistent footer across all pages with professional styling
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // Generate simple footer HTML structure with improved text
    function generateFooterHTML() {
        return `
            <div class="wrapper">
                <div class="footer-col-wrapper">
                    <div class="footer-col">
                        <p>© 2025 Chaofeng Chen • All rights reserved</p>
                    </div>
                    <div class="footer-col">
                        <p class="update-time">Last updated: <span id="update-time"></span></p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set the last updated time (date only, no specific time)
     */
    function setUpdateTime() {
        const updateTimeElement = document.getElementById('update-time');
        if (updateTimeElement) {
            const now = new Date();
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            };
            const formattedDate = now.toLocaleDateString('en-US', options);
            updateTimeElement.textContent = formattedDate;
        }
    }
    
    /**
     * Initialize unified footer
     */
    function initializeFooter() {
        const footerElement = document.querySelector('.site-footer');
        if (footerElement) {
            footerElement.innerHTML = generateFooterHTML();
            // Set update time after HTML is inserted
            setTimeout(setUpdateTime, 100);
        }
    }
    
    // Initialize footer
    initializeFooter();
});