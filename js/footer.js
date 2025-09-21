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
                    <div class="footer-col footer-stats">
                        <div class="visitor-stats">
                            <script type='text/javascript' id='clustrmaps' 
                              src='//cdn.clustrmaps.com/map_v2.js?cl=ffffff&w=a&t=tt&d=_WPYBsWS3jdK-Qk2uEpzsJESFoZAn23tijknLzpnvis'></script>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set the last updated time based on document modification time
     */
    function setUpdateTime() {
        const updateTimeElement = document.getElementById('update-time');
        if (!updateTimeElement) return;

        // Use document.lastModified to get the actual file modification time
        if (document.lastModified) {
            const docModified = new Date(document.lastModified);
            // Check if it's a valid date (not the default "01/01/1970")
            if (docModified.getFullYear() > 1970) {
                const options = { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                };
                const displayDate = docModified.toLocaleDateString('en-US', options);
                updateTimeElement.textContent = displayDate;
                updateTimeElement.parentElement.style.display = 'block';
            } else {
                // If no valid modification date, hide the update time
                updateTimeElement.parentElement.style.display = 'none';
            }
        } else {
            // If document.lastModified is not available, hide the update time
            updateTimeElement.parentElement.style.display = 'none';
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