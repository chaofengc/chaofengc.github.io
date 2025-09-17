/**
 * Group Members Management
 * Loads and displays group members from configuration file
 */
document.addEventListener('DOMContentLoaded', function() {
  
  /**
   * Load group members data from JSON file
   */
  async function loadGroupMembers() {
    try {
      const response = await fetch('data/group-members.json');
      if (!response.ok) {
        throw new Error('Failed to load group members data');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading group members:', error);
      return null;
    }
  }
  
  /**
   * Create member card HTML
   * @param {Object} member Member data object
   * @returns {string} HTML string for member card
   */
  function createMemberCard(member) {
    const linksHtml = Object.entries(member.links || {}).map(([platform, url]) => {
      const iconClass = platform === 'email' ? 'fas fa-envelope' : 
                       platform === 'github' ? 'fab fa-github' :
                       platform === 'twitter' ? 'fab fa-twitter' :
                       platform === 'linkedin' ? 'fab fa-linkedin' :
                       'fas fa-link';
      return `<a href="${url}" target="_blank"><i class="${iconClass}"></i></a>`;
    }).join('');
    
    const emailLink = member.email ? 
      `<a href="mailto:${member.email}"><i class="fas fa-envelope"></i></a>` : '';
    
    return `
      <div class="member-card">
        <img src="${member.image}" alt="${member.name}" class="member-image">
        <div class="member-info">
          <h3 class="member-name">${member.name}</h3>
          <p class="member-title">${member.title}</p>
          <p class="member-bio">${member.bio}</p>
          <div class="member-links">
            ${emailLink}
            ${linksHtml}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Create alumni item HTML
   * @param {Object} alumni Alumni data object
   * @returns {string} HTML string for alumni item
   */
  function createAlumniItem(alumni) {
    return `
      <div class="alumni-item">
        <span class="alumni-name">${alumni.name}</span>
        <span class="alumni-year">${alumni.year}</span>
        <span class="alumni-position">Now at: ${alumni.current_position}</span>
      </div>
    `;
  }
  
  /**
   * Create welcome message HTML
   * @param {Object} welcomeData Welcome message data
   * @returns {string} HTML string for welcome message
   */
  function createWelcomeMessage(welcomeData) {
    const opportunitiesHtml = welcomeData.opportunities
      .map(opportunity => `<li>${opportunity}</li>`)
      .join('');
    
    return `
      <div class="welcome-message">
        <h2>${welcomeData.title}</h2>
        <p class="welcome-description">${welcomeData.description}</p>
        <div class="opportunities">
          <h3>Available Opportunities:</h3>
          <ul>
            ${opportunitiesHtml}
          </ul>
        </div>
        <p class="contact-info">
          ${welcomeData.contact.text} 
          <a href="${welcomeData.contact.link_url}">${welcomeData.contact.link_text}</a>
        </p>
      </div>
    `;
  }

  /**
   * Render group members
   * @param {Object} data Group members data
   */
  function renderGroupMembers(data) {
    const membersGrid = document.querySelector('.members-grid');
    const alumniList = document.querySelector('.alumni-list');
    
    if (membersGrid) {
      if (data.current_members && data.current_members.length > 0) {
        membersGrid.innerHTML = data.current_members
          .map(member => createMemberCard(member))
          .join('');
      } else if (data.welcome_message) {
        membersGrid.innerHTML = createWelcomeMessage(data.welcome_message);
      } else {
        membersGrid.innerHTML = '<p>No current members to display.</p>';
      }
    }
    
    if (alumniList) {
      if (data.alumni && data.alumni.length > 0) {
        alumniList.innerHTML = data.alumni
          .map(alumni => createAlumniItem(alumni))
          .join('');
      } else {
        // Hide alumni section if no alumni
        const alumniSection = document.querySelector('.alumni-section');
        if (alumniSection) {
          alumniSection.style.display = 'none';
        }
      }
    }
  }
  
  /**
   * Initialize group page
   */
  async function init() {
    // Show loading states
    const membersGrid = document.querySelector('.members-grid');
    const alumniList = document.querySelector('.alumni-list');
    
    if (membersGrid) {
      membersGrid.innerHTML = '<div class="loading">Loading group members...</div>';
    }
    if (alumniList) {
      alumniList.innerHTML = '<div class="loading">Loading alumni...</div>';
    }
    
    const groupData = await loadGroupMembers();
    if (groupData) {
      renderGroupMembers(groupData);
    } else {
      console.error('Failed to load group members data');
      if (membersGrid) {
        membersGrid.innerHTML = '<p>Failed to load group members data.</p>';
      }
      if (alumniList) {
        alumniList.innerHTML = '<p>Failed to load alumni data.</p>';
      }
    }
  }
  
  // Initialize if we're on the group page
  if (document.querySelector('.group-section')) {
    init();
  }
});