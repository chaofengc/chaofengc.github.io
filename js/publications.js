/**
 * Publications Page Functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize parser
  const parser = new BibtexParser();
  
  // Get DOM elements
  const publicationsContainer = document.getElementById('publications-container') || 
                               document.querySelector('.publications-container');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const bibFileInput = document.getElementById('bib-file');
  const parseBibButton = document.getElementById('parse-bib');
  
  // Default BIB data (example)
  let defaultBibData = `
@article{smith2023advances,
  title={Advances in Machine Learning for Natural Language Processing},
  author={Smith, John and Johnson, Emily and Chen, Wei},
  journal={Journal of Artificial Intelligence Research},
  volume={68},
  pages={1245--1278},
  year={2023},
  publisher={AI Research Press},
  doi={10.1000/xyz123},
  url={https://example.com/paper1},
  code={https://github.com/example/paper1}
}

@inproceedings{johnson2022deep,
  title={Deep Learning Approaches for Computer Vision},
  author={Johnson, Emily and Brown, Robert and Garcia, Maria},
  booktitle={Proceedings of the International Conference on Computer Vision},
  pages={78--85},
  year={2022},
  url={https://example.com/paper2},
  code={https://github.com/example/paper2}
}

@article{chen2021survey,
  title={A Survey of Reinforcement Learning Techniques},
  author={Chen, Wei and Smith, John and Wang, Li},
  journal={IEEE Transactions on Neural Networks},
  volume={32},
  number={4},
  pages={1098--1124},
  year={2021},
  publisher={IEEE},
  doi={10.1000/abc456},
  url={https://example.com/paper3}
}
  `;
  
  // Store coauthors and publication config data
  let coauthorsData = null;
  let publicationConfig = null;
  
  // Function to load coauthors data
  async function loadCoauthorsData() {
    try {
      const response = await fetch('data/coauthor-info.json');
      if (!response.ok) {
        throw new Error('Failed to load coauthor info');
      }
      coauthorsData = await response.json();
      return coauthorsData;
    } catch (error) {
      console.error('Error loading coauthor info:', error);
      coauthorsData = { coauthors: {} };
      return coauthorsData;
    }
  }
  
  // Function to load publication config data
  async function loadPublicationConfig() {
    try {
      const response = await fetch('data/publication-config.json');
      if (!response.ok) {
        throw new Error('Failed to load publication config');
      }
      publicationConfig = await response.json();
      return publicationConfig;
    } catch (error) {
      console.error('Error loading publication config:', error);
      publicationConfig = { publications: {} };
      return publicationConfig;
    }
  }
  
  // Store current publication data
  let currentPublications = [];
  let currentFilter = 'all';
  
  // Additional coauthors data for enhanced functionality
  let additionalCoauthorsData = {};
  
  /**
   * Create a publication element
   * @param {Object} pub Publication object
   * @param {boolean} isIndexPage Whether this is for index page
   * @returns {HTMLElement} Publication element
   */
  function createPublicationElement(pub, isIndexPage = false) {
    const pubElement = document.createElement('div');
    pubElement.className = 'publication-item';
    
    // Get publication config data
    const pubConfig = publicationConfig?.publications?.[pub.citeKey] || {};
    
    // Add selected/highlighted class if select field is true, but not on index page
    if (!isIndexPage && (pubConfig.select === true || pub.highlight === true)) {
      pubElement.classList.add('publication-highlighted');
    }
    
    // Image (left side) - only show on index page
    if (isIndexPage) {
      const image = document.createElement('img');
      image.className = 'publication-image';
      // Use image from publication config first, then fallback to pub.image or placeholder
      image.src = pubConfig.image || pub.image || 'assets/publication-placeholder.jpg';
      image.alt = pub.title || 'Publication';
      image.onerror = function() {
        this.src = 'https://via.placeholder.com/150x200/f0f0f0/808080?text=Publication';
      };
      pubElement.appendChild(image);
    }
    
    // Content container (right side)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'publication-content';
    
    // Title
    const title = document.createElement('div');
    title.className = 'publication-title';
    title.textContent = pub.title || 'Untitled';
    contentDiv.appendChild(title);
    
    // Authors
    if (pub.author) {
      const authors = document.createElement('div');
      authors.className = 'publication-authors';
      authors.innerHTML = formatAuthorsWithLinks(pub.author, pubConfig);
      contentDiv.appendChild(authors);
    }
    
    // Publication info
    const venue = document.createElement('div');
    venue.className = 'publication-venue';
    
    // Check if we're on publications page
    const isPublicationsPage = document.body.classList.contains('publications-page');
    
    // Build venue HTML with bold abbreviations and optional acceptance info
    // Helper to bold abbreviations inside parentheses, e.g., (ECCV) -> (<strong>ECCV</strong>)
    function boldAbbreviations(text) {
      if (!text) return '';
      return text.replace(/\(([^)]+)\)/g, '(<strong>$1</strong>)');
    }

    const acceptInfo = pubConfig.accept_info ? `(<span class="accept-info">${pubConfig.accept_info}</span>)` : '';

    let venueCore = '';
    if (pubConfig.venue) {
      venueCore = boldAbbreviations(pubConfig.venue);
    } else if (pub.type === 'article') {
      venueCore = boldAbbreviations(pub.journal || '');
    } else if (pub.type === 'inproceedings' || pub.type === 'conference') {
      venueCore = boldAbbreviations(pub.booktitle || '');
    } else {
      venueCore = boldAbbreviations(pub.publisher || '');
    }

    const venueHtml = `${venueCore}, ${pub.year || ''}${acceptInfo ? ' ' + acceptInfo : ''}`;
    
    // If on publications page, add inline links to venue
    if (isPublicationsPage) {
      const inlineLinks = [];
      
      // PDF link
      if (pubConfig.pdf || pub.url || pub.pdf) {
        inlineLinks.push(`<a href="${pubConfig.pdf || pub.url || pub.pdf || '#'}" target="_blank">PDF</a>`);
      }
      
      // Code link (plain text, no badge)
      const codeUrl = pubConfig.github || pub.github || pubConfig.code || pub.code;
      if (codeUrl) {
        inlineLinks.push(`<a href="${codeUrl}" target="_blank">GitHub</a>`);
      }
      
      // DOI link
      if (pub.doi) {
        inlineLinks.push(`<a href="https://doi.org/${pub.doi}" target="_blank">DOI</a>`);
      }
      
      // BibTeX link
      inlineLinks.push(`<a href="#" class="cite-link" data-key="${pub.citeKey || pub.key || pub.id}">Cite</a>`);
      
      // Combine venue HTML with links
      if (inlineLinks.length > 0) {
        venue.innerHTML = `${venueHtml} | ${inlineLinks.join(' | ')}`;
      } else {
        venue.innerHTML = venueHtml;
      }
    } else {
      venue.innerHTML = venueHtml;
    }
    
    contentDiv.appendChild(venue);
    
    // Only create traditional links layout for index page
    if (!isPublicationsPage) {
      // Year and Links container
      const yearLinksContainer = document.createElement('div');
      yearLinksContainer.className = 'year-links-container';
      contentDiv.appendChild(yearLinksContainer);
      
      // Links
      const links = document.createElement('div');
      links.className = 'publication-links';
      yearLinksContainer.appendChild(links);
      
      // PDF link from config
      if (pubConfig.pdf || pub.url || pub.pdf) {
        const pdfLink = document.createElement('a');
        pdfLink.href = pubConfig.pdf || pub.url || pub.pdf || '#';
        pdfLink.innerHTML = '<i class="fas fa-file-pdf"></i> PDF';
        pdfLink.target = '_blank';
        links.appendChild(pdfLink);
      }
      
      // Code link from config or bib (check both 'github' and 'code' fields)
      const codeUrl = pubConfig.github || pub.github || pubConfig.code || pub.code;
      if (codeUrl) {
        // GitHub stars badge for index page
        if (codeUrl.includes('github.com')) {
          const githubUrl = codeUrl.replace('https://github.com/', '').replace('http://github.com/', '');
          const repoPath = githubUrl.split('/').slice(0, 2).join('/');
          if (repoPath.includes('/')) {
            const starsLink = document.createElement('a');
            starsLink.href = codeUrl;
            starsLink.target = '_blank';
            starsLink.className = 'github-stars';
            starsLink.innerHTML = `<img src="https://img.shields.io/github/stars/${repoPath}?style=social" alt="GitHub stars" style="vertical-align: middle;">`;
            links.appendChild(starsLink);
          }
        }
      }
      
      // DOI link
      if (pub.doi) {
        const doiLink = document.createElement('a');
        doiLink.href = `https://doi.org/${pub.doi}`;
        doiLink.innerHTML = '<i class="fas fa-external-link-alt"></i> DOI';
        doiLink.target = '_blank';
        links.appendChild(doiLink);
      }
      
      // BibTeX citation
      const citeLink = document.createElement('a');
      citeLink.href = '#';
      citeLink.innerHTML = '<i class="fas fa-quote-right"></i> Cite';
      citeLink.onclick = function(e) {
        e.preventDefault();
        showBibtex(pub, pubElement);
      };
      links.appendChild(citeLink);
    }
    
    pubElement.appendChild(contentDiv);
    return pubElement;
  }
  
  /**
   * Render publications for index page with journal and conference sections
   * @param {Array} publications Publications array
   */
  function renderIndexPublications(publications) {
    const journalContainer = document.getElementById('journal-publications');
    const conferenceContainer = document.getElementById('conference-publications');
    
    if (!journalContainer || !conferenceContainer) return;
    
    // Clear containers
    journalContainer.innerHTML = '';
    conferenceContainer.innerHTML = '';
    
    // Filter selected publications
    const selectedPublications = publications.filter(pub => {
      const pubConfig = publicationConfig?.publications?.[pub.citeKey] || {};
      return pubConfig.select === true || pub.highlight === true;
    });
    
    // Separate by type
    const journalPubs = selectedPublications.filter(pub => pub.type === 'article');
    const conferencePubs = selectedPublications.filter(pub => 
      pub.type === 'inproceedings' || pub.type === 'conference'
    );
    
    // Render journal publications
    if (journalPubs.length === 0) {
      journalContainer.innerHTML = '<div class="no-publications">No selected journal papers found</div>';
    } else {
      journalPubs.forEach(pub => {
        journalContainer.appendChild(createPublicationElement(pub, true));
      });
    }
    
    // Render conference publications
    if (conferencePubs.length === 0) {
      conferenceContainer.innerHTML = '<div class="no-publications">No selected conference papers found</div>';
    } else {
      conferencePubs.forEach(pub => {
        conferenceContainer.appendChild(createPublicationElement(pub, true));
      });
    }
  }
  
  /**
   * Render publications list
   * @param {Array} publications Publications array
   * @param {string} filter Filter type
   */
  function renderPublications(publications, filter = 'all') {
    // Check if we're on index.html
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    
    if (isIndexPage) {
      // Handle index page with separate journal and conference sections
      renderIndexPublications(publications);
      return;
    }
    
    if (!publicationsContainer) return;
    
    // Add loading class to prevent layout shifts
    publicationsContainer.classList.add('publications-loading');
    
    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      // Clear container
      publicationsContainer.innerHTML = '';
      
      // Filter publications
      let filteredPublications = publications;
      if (filter !== 'all') {
        filteredPublications = parser.filterByType(filter);
      }
      
      // If no publications
      if (filteredPublications.length === 0) {
        publicationsContainer.innerHTML = '<div class="no-publications">No publications found matching the criteria</div>';
        publicationsContainer.classList.remove('publications-loading');
        return;
      }
    
    // Group publications by year
    const publicationsByYear = {};
    filteredPublications.forEach(pub => {
      const year = pub.year || 'Unknown';
      if (!publicationsByYear[year]) {
        publicationsByYear[year] = [];
      }
      publicationsByYear[year].push(pub);
    });
    
    // Sort years in descending order
    const sortedYears = Object.keys(publicationsByYear).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return parseInt(b) - parseInt(a);
    });
    
    // Render publications grouped by year
    sortedYears.forEach(year => {
      // Create year section
      const yearSection = document.createElement('div');
      yearSection.className = 'year-section';
      
      // Year header
      const yearHeader = document.createElement('h2');
      yearHeader.className = 'year-header';
      yearHeader.textContent = year;
      yearSection.appendChild(yearHeader);
      
      // Publications for this year
      const yearPublications = document.createElement('div');
      yearPublications.className = 'year-publications';
      
      publicationsByYear[year].forEach((pub, index) => {
        const pubElement = createPublicationElement(pub, false);
        // Add staggered animation delay
        pubElement.style.animationDelay = `${index * 0.05}s`;
        yearPublications.appendChild(pubElement);
      });
      
      yearSection.appendChild(yearPublications);
      publicationsContainer.appendChild(yearSection);
    });
    
    // Remove loading class after rendering is complete
    publicationsContainer.classList.remove('publications-loading');
    });
  }
  
  /**
   * Format author list
   * @param {string} authors Authors string
   * @returns {string} Formatted author list
   */
  function formatAuthors(authors) {
    return authors.split(' and ').join(', ');
  }
  
  /**
   * Format author list with clickable links and indicators
   * @param {string} authors Authors string
   * @param {Object} pubConfig Publication configuration object
   * @returns {string} Formatted author list with HTML links and indicators
   */
  function formatAuthorsWithLinks(authors, pubConfig = {}) {
    const authorList = authors.split(' and ');
    const coFirstAuthors = pubConfig.co_first_authors || [];
    const correspondingAuthors = pubConfig.corresponding_authors || [];
    
    return authorList.map(author => {
      const trimmedAuthor = author.trim();
      const coauthorInfo = coauthorsData?.coauthors?.[trimmedAuthor];
      
      // Make Chaofeng Chen bold (with or without asterisk)
      let formattedAuthor = trimmedAuthor;
      if (trimmedAuthor === 'Chaofeng Chen') {
        formattedAuthor = `<strong>${trimmedAuthor}</strong>`;
      }
      
      // Add co-first author indicator (*)
      if (coFirstAuthors.includes(trimmedAuthor)) {
        formattedAuthor += '<sup>*</sup>';
      }
      
      // Add corresponding author indicator (envelope icon)
      if (correspondingAuthors.includes(trimmedAuthor)) {
        formattedAuthor += '<sup>✉</sup>';
      }
      
      if (coauthorInfo && coauthorInfo.website) {
        return `<a href="${coauthorInfo.website}" target="_blank" title="${coauthorInfo.affiliation || ''}">${formattedAuthor}</a>`;
      }
      return formattedAuthor;
    }).join(', ');
  }
  
  /**
   * Show BibTeX citation in an inline expandable container
   * @param {Object} publication Publication object
   * @param {HTMLElement} publicationElement The publication item element
   */
  function showBibtex(publication, publicationElement, triggerElement = null) {
    const bibtexText = `@${publication.type}{${publication.citeKey},
  title={${publication.title || ''}},
  author={${publication.author || ''}},
  ${publication.journal ? `journal={${publication.journal}},` : ''}
  ${publication.booktitle ? `booktitle={${publication.booktitle}},` : ''}
  ${publication.volume ? `volume={${publication.volume}},` : ''}
  ${publication.number ? `number={${publication.number}},` : ''}
  ${publication.pages ? `pages={${publication.pages}},` : ''}
  ${publication.year ? `year={${publication.year}},` : ''}
  ${publication.publisher ? `publisher={${publication.publisher}}` : ''}
}`;
    
    // Find existing citation container
    let citationContainer = publicationElement.querySelector('.citation-container');
    
    // Check if we need to close an existing citation
    const isExpanded = citationContainer && citationContainer.classList.contains('expanded');
    if (isExpanded) {
      collapseCitation(citationContainer);
      return;
    }
    
    // Remove any existing citation container
    if (citationContainer) {
      citationContainer.remove();
    }
    
    // Create new citation container
    citationContainer = createCitationContainer(publication, bibtexText);
    
    // Always insert citation container at the end of publication-content to ensure it displays below
    const publicationContent = publicationElement.querySelector('.publication-content');
    if (publicationContent) {
      publicationContent.appendChild(citationContainer);
    } else {
      publicationElement.appendChild(citationContainer);
    }
    
    // Expand the citation
    expandCitation(citationContainer, publication, bibtexText);
  }
  
  /**
   * Find the appropriate insertion point for the citation container
   * @param {HTMLElement} triggerElement The element that triggered the citation
   * @param {HTMLElement} publicationElement The publication container
   * @returns {HTMLElement|null} The element after which to insert the citation
   */
  function findInsertionPoint(triggerElement, publicationElement) {
    // Start from the trigger element and walk up to find the containing line
    let currentElement = triggerElement;
    
    // Walk up the DOM tree to find the line-level container
    while (currentElement && currentElement !== publicationElement) {
      // Look for specific publication elements that represent lines
      if (currentElement.classList.contains('publication-venue') ||
          currentElement.classList.contains('publication-title') ||
          currentElement.classList.contains('publication-authors')) {
        // Insert after this line element to create a new line
        return { element: currentElement, position: 'afterend' };
      }
      
      const parent = currentElement.parentElement;
      
      // Check if current element is a direct child of publication-content
      if (parent && parent.classList.contains('publication-content')) {
        // This element is a direct child of publication-content
        // Insert after this element to create a new line
        return { element: currentElement, position: 'afterend' };
      }
      
      // Check if current element is publication-content itself
      if (currentElement.classList.contains('publication-content')) {
        // Insert at the end of publication-content
        return { element: currentElement, position: 'beforeend' };
      }
      
      currentElement = parent;
    }
    
    // Fallback: find publication-content and insert at the end
    const publicationContent = publicationElement.querySelector('.publication-content');
    if (publicationContent) {
      return { element: publicationContent, position: 'beforeend' };
    }
    
    // Final fallback: insert at the end of publication element
    return { element: publicationElement, position: 'beforeend' };
  }
  
  /**
   * Create inline citation container HTML structure
   * @param {Object} publication Publication object
   * @param {string} bibtexText BibTeX citation text
   * @returns {HTMLElement} Citation container element
   */
  function createCitationContainer(publication, bibtexText) {
    const container = document.createElement('div');
    container.className = 'citation-container';
    
    container.innerHTML = `
      <div class="citation-header">
        <h4 class="citation-title">Citation: ${publication.title || 'Untitled'}</h4>
        <button class="citation-toggle" aria-label="Toggle citation">▼</button>
      </div>
      <div class="citation-content">
        <div class="citation-text">${bibtexText}</div>
        <div class="citation-actions">
          <button class="citation-btn citation-btn-primary citation-copy-btn">
            <i class="fas fa-copy"></i> Copy
          </button>
          <button class="citation-btn citation-btn-secondary citation-collapse-btn">
            <i class="fas fa-chevron-up"></i> Collapse
          </button>
          <span class="citation-success"></span>
        </div>
      </div>
    `;
    
    // Setup toggle functionality
    const toggleBtn = container.querySelector('.citation-toggle');
    const collapseBtn = container.querySelector('.citation-collapse-btn');
    const header = container.querySelector('.citation-header');
    
    const toggleFunction = function() {
      const isExpanded = container.classList.contains('expanded');
      if (isExpanded) {
        collapseCitation(container);
      } else {
        expandCitation(container, publication, bibtexText);
      }
    };
    
    toggleBtn.onclick = toggleFunction;
    header.onclick = function(e) {
      // Only toggle if clicking on header, not on toggle button
      if (e.target === header || e.target.classList.contains('citation-title')) {
        toggleFunction();
      }
    };
    
    collapseBtn.onclick = function() {
      collapseCitation(container);
    };
    
    // Setup copy functionality
    const copyBtn = container.querySelector('.citation-copy-btn');
    const successElement = container.querySelector('.citation-success');
    
    copyBtn.onclick = function() {
      navigator.clipboard.writeText(bibtexText).then(() => {
        successElement.textContent = 'Copied!';
        successElement.classList.add('show');
        setTimeout(() => {
          successElement.classList.remove('show');
        }, 2000);
      }).catch(() => {
        successElement.textContent = 'Copy failed';
        successElement.classList.add('show');
        setTimeout(() => {
          successElement.classList.remove('show');
        }, 3000);
      });
    };
    
    return container;
  }
  
  /**
   * Expand citation container
   * @param {HTMLElement} container Citation container element
   * @param {Object} publication Publication object
   * @param {string} bibtexText BibTeX citation text
   */
  function expandCitation(container, publication, bibtexText) {
    // Update content first
    const textElement = container.querySelector('.citation-text');
    const titleElement = container.querySelector('.citation-title');
    const successElement = container.querySelector('.citation-success');
    
    titleElement.textContent = `Citation: ${publication.title || 'Untitled'}`;
    textElement.textContent = bibtexText;
    successElement.classList.remove('show');
    
    // Force a reflow to ensure content is updated before animation
    container.offsetHeight;
    
    // Add expanded class with a slight delay for smooth animation
    requestAnimationFrame(() => {
      container.classList.add('expanded');
      const toggleBtn = container.querySelector('.citation-toggle');
      toggleBtn.classList.add('expanded');
      
      // Scroll the citation into view smoothly
      setTimeout(() => {
        container.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 200);
    });
  }
  
  /**
   * Collapse citation container
   * @param {HTMLElement} container Citation container element
   */
  function collapseCitation(container) {
    // Clear success message first
    const successElement = container.querySelector('.citation-success');
    successElement.classList.remove('show');
    
    // Add collapse animation class
    container.style.animation = 'slideUpFadeOut 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    
    // Trigger collapse animation
    container.classList.remove('expanded');
    const toggleBtn = container.querySelector('.citation-toggle');
    toggleBtn.classList.remove('expanded');
    
    // Remove the container after animation completes
    setTimeout(() => {
      if (container.parentNode && !container.classList.contains('expanded')) {
        container.remove();
      }
    }, 300);
  }
  
  /**
   * Handle filter button clicks
   */
  if (filterButtons) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Get filter type
        currentFilter = this.getAttribute('data-filter');
        
        // Re-render
        renderPublications(currentPublications, currentFilter);
      });
    });
  }
  
  /**
   * Handle BIB file upload
   */
  if (parseBibButton && bibFileInput) {
    parseBibButton.addEventListener('click', function() {
      if (!bibFileInput.files || bibFileInput.files.length === 0) {
        console.log('Please select a BIB file first');
        return;
      }
      
      const file = bibFileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const bibContent = e.target.result;
        processBibContent(bibContent);
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Process BIB content
   * @param {string} content BIB file content
   */
  function processBibContent(content) {
    try {
      // Parse BIB content
      currentPublications = parser.parse(content);
      
      // Sort by year
      currentPublications = parser.sortByYear();
      
      // Render publications list
      renderPublications(currentPublications, currentFilter);
      
      // Save to localStorage
      localStorage.setItem('bibData', content);
      
      // Show success message
      console.log(`Successfully parsed ${currentPublications.length} publications`);
    } catch (error) {
      console.error('Error parsing BIB file:', error);
      console.error('Error parsing BIB file: ' + error.message);
    }
  }
  
  /**
   * Initialize the publications page
   */
  async function init() {
    // Show loading state with stable layout
    if (publicationsContainer) {
      publicationsContainer.classList.add('publications-loading');
      publicationsContainer.innerHTML = '<div class="loading">Loading publications...</div>';
      
      // Set minimum height to prevent layout shift
      publicationsContainer.style.minHeight = '400px';
    }
    
    // Load coauthors and publication config data
    await loadCoauthorsData();
    await loadPublicationConfig();
    
    // Try to load from localStorage
    const savedBibData = localStorage.getItem('bibData');
    
    // First try to load the external BIB file
    try {
      const response = await fetch('data/publications.bib');
      if (!response.ok) {
        throw new Error('Failed to load publications.bib file');
      }
      const bibContent = await response.text();
      // Process the external BIB file
      processBibContent(bibContent);
    } catch (error) {
      console.error('Error loading publications.bib:', error);
      // Fallback to saved data or default data
      const bibData = savedBibData || defaultBibData;
      processBibContent(bibData);
    }
  }
  
  // Add event delegation for cite links in publications page
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('cite-link')) {
      e.preventDefault();
      const key = e.target.getAttribute('data-key');
      
      // Find publication by key or id
      const publication = currentPublications.find(pub => {
        return (pub.key === key) || (pub.id === key) || (pub.citeKey === key);
      });
      
      if (publication) {
        // Find the publication element
        const pubElement = e.target.closest('.publication-item');
        
        // Check if there's already an expanded citation for this publication
        const existingCitation = pubElement.querySelector('.citation-container.expanded');
        if (existingCitation) {
          // If clicking the same cite link, collapse the citation
          collapseCitation(existingCitation);
        } else {
          // Otherwise, show the citation
          showBibtex(publication, pubElement, e.target);
        }
      }
    }
  });

  // Initialize
  init();
});