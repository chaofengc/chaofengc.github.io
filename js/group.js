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
    // Create links with proper icons and classes
    const linksHtml = Object.entries(member.links || {}).map(([platform, url]) => {
      let iconClass, linkClass;
      
      switch(platform) {
        case 'email':
          iconClass = 'fas fa-envelope';
          linkClass = 'email';
          break;
        case 'homepage':
          iconClass = 'fas fa-home';
          linkClass = 'homepage';
          break;
        case 'scholar':
          iconClass = 'fas fa-graduation-cap';
          linkClass = 'scholar';
          break;
        case 'github':
          iconClass = 'fab fa-github';
          linkClass = 'github';
          break;
        case 'twitter':
          iconClass = 'fab fa-twitter';
          linkClass = 'twitter';
          break;
        case 'linkedin':
          iconClass = 'fab fa-linkedin';
          linkClass = 'linkedin';
          break;
        default:
          iconClass = 'fas fa-link';
          linkClass = 'other';
      }
      
      const target = platform === 'homepage' && url.startsWith('index.html') ? '' : 'target="_blank"';
      return `<a href="${url}" class="${linkClass}" ${target} title="${platform}"><i class="${iconClass}"></i></a>`;
    }).join('');
    
    const emailDisplay = member.email ? 
      `<div class="member-email">${member.email}</div>` : '';
    
    return `
      <div class="member-card">
        <img src="${member.image}" alt="${member.name}" class="member-image" onerror="this.src='images/placeholder-person.svg'">
        <h3 class="member-name">${member.name}</h3>
        <p class="member-title">${member.title}</p>
        ${member.bio ? `<p class="member-bio">${member.bio}</p>` : ''}
        <div class="member-contact">
          ${emailDisplay}
        </div>
        <div class="member-links">
          ${linksHtml}
        </div>
      </div>
    `;
  }
  
  /**
   * Create alumni list item HTML
   * @param {Object} alumni Alumni data object
   * @returns {string} HTML string for alumni list item
   */
  function createAlumniCard(alumni) {
    // Create links for alumni
    const linksHtml = Object.entries(alumni.links || {}).map(([platform, url]) => {
      let iconClass;
      
      switch(platform) {
        case 'homepage':
          iconClass = 'fas fa-home';
          break;
        case 'scholar':
          iconClass = 'fas fa-graduation-cap';
          break;
        case 'github':
          iconClass = 'fab fa-github';
          break;
        case 'linkedin':
          iconClass = 'fab fa-linkedin';
          break;
        default:
          iconClass = 'fas fa-link';
      }
      
      return `<a href="${url}" target="_blank" title="${platform}"><i class="${iconClass}"></i></a>`;
    }).join('');
    
    return `
      <li class="alumni-item">
        <div class="alumni-info">
          <strong class="alumni-name">${alumni.name}</strong>
          <div class="alumni-position-line">
            <span class="alumni-title">${alumni.title}</span>
            ${alumni.current_position ? `<span class="alumni-current">→ ${alumni.current_position}</span>` : ''}
          </div>
        </div>
        <div class="alumni-links">
          ${linksHtml}
        </div>
      </li>
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
   * Render group members on the page
   * @param {Object} data Group members data
   */
  function renderGroupMembers(data) {
    // Render PhD students
    const phdGrid = document.getElementById('phd-members');
    if (phdGrid) {
      if (data.phd_students && data.phd_students.length > 0) {
        phdGrid.innerHTML = data.phd_students
          .map(member => createMemberCard(member))
          .join('');
      } else {
        phdGrid.innerHTML = '<p class="no-members">No PhD students to display yet.</p>';
      }
    }
    
    // Render Master students
    const masterGrid = document.getElementById('master-members');
    if (masterGrid) {
      if (data.master_students && data.master_students.length > 0) {
        masterGrid.innerHTML = data.master_students
          .map(member => createMemberCard(member))
          .join('');
      } else {
        masterGrid.innerHTML = '<p class="no-members">No Master students to display yet.</p>';
      }
    }
    
    // Render Undergraduate students
    const undergraduateGrid = document.getElementById('undergraduate-members');
    if (undergraduateGrid) {
      if (data.undergraduate_students && data.undergraduate_students.length > 0) {
        undergraduateGrid.innerHTML = data.undergraduate_students
          .map(member => createMemberCard(member))
          .join('');
      } else {
        undergraduateGrid.innerHTML = '<p class="no-members">No Undergraduate students to display yet.</p>';
      }
    }
    
    // Render Alumni
    const alumniList = document.querySelector('.alumni-list');
    if (alumniList) {
      if (data.alumni && data.alumni.length > 0) {
        alumniList.innerHTML = `
          <ul class="alumni-ul">
            ${data.alumni.map(alumni => createAlumniCard(alumni)).join('')}
          </ul>
        `;
      } else {
        alumniList.innerHTML = '<p class="no-alumni">No alumni to display yet.</p>';
      }
    }
  }
  
  /**
   * Initialize group page
   */
  async function init() {
    // Show loading states for all sections
    const phdGrid = document.getElementById('phd-members');
    const masterGrid = document.getElementById('master-members');
    const undergraduateGrid = document.getElementById('undergraduate-members');
    const alumniList = document.querySelector('.alumni-list');
    
    if (phdGrid) {
      phdGrid.innerHTML = '<div class="loading">Loading PhD students...</div>';
    }
    if (masterGrid) {
      masterGrid.innerHTML = '<div class="loading">Loading Master students...</div>';
    }
    if (undergraduateGrid) {
      undergraduateGrid.innerHTML = '<div class="loading">Loading Undergraduate students...</div>';
    }
    if (alumniList) {
      alumniList.innerHTML = '<div class="loading">Loading alumni...</div>';
    }
    
    const groupData = await loadGroupMembers();
    if (groupData) {
      renderGroupMembers(groupData);
    } else {
      console.error('Failed to load group members data');
      if (phdGrid) {
        phdGrid.innerHTML = '<p>Failed to load PhD students data.</p>';
      }
      if (masterGrid) {
        masterGrid.innerHTML = '<p>Failed to load Master students data.</p>';
      }
      if (undergraduateGrid) {
        undergraduateGrid.innerHTML = '<p>Failed to load Undergraduate students data.</p>';
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