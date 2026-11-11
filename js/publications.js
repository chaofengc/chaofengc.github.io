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
      const response = await fetch('data/coauthor.json');
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
  
  /**
   * Create a publication element
   * @param {Object} pub Publication object
   * @param {boolean} isIndexPage Whether this is for index page
   * @returns {HTMLElement} Publication element
   */
    function createPublicationElement(pub, isIndexPage = false) {
      const pubElement = document.createElement('div');
      pubElement.className = 'publication-item';
      pubElement.classList.add(isIndexPage ? 'publication-item--index' : 'publication-item--page');
      
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
      } else if (pub.type === 'preprint' || pub.type === 'misc' || 
                (pub.archivePrefix && pub.archivePrefix.toLowerCase() === 'arxiv') ||
                (pub.keywords && pub.keywords.includes('preprint'))) {
        venueCore = boldAbbreviations('arXiv');
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

        // Project link
        if (pubConfig.project) {
          inlineLinks.push(`<a href="${pubConfig.project}" target="_blank">Project</a>`);
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
          pdfLink.innerHTML = '<i class="far fa-file-pdf" aria-hidden="true"></i><span>PDF</span>';
          pdfLink.target = '_blank';
          links.appendChild(pdfLink);
        }

        if (pubConfig.project) {
          const projectLink = document.createElement('a');
          projectLink.href = pubConfig.project;
          projectLink.innerHTML = '<i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i><span>Project</span>';
          projectLink.target = '_blank';
          links.appendChild(projectLink);
        }
        
        // Code link from config or bib (check both 'github' and 'code' fields)
        const codeUrl = pubConfig.github || pub.github || pubConfig.code || pub.code;
        if (codeUrl) {
          const codeLink = document.createElement('a');
          codeLink.href = codeUrl;
          codeLink.target = '_blank';
          codeLink.innerHTML = '<i class="fab fa-github" aria-hidden="true"></i><span>Code</span>';
          links.appendChild(codeLink);

          if (codeUrl.includes('github.com')) {
            const githubUrl = codeUrl.replace('https://github.com/', '').replace('http://github.com/', '');
            const repoPath = githubUrl.split('/').slice(0, 2).join('/');
            if (repoPath.includes('/')) {
              codeLink.className = 'github-code';
              codeLink.innerHTML = `<span class="github-code-label"><i class="fab fa-github" aria-hidden="true"></i>Code</span><img src="https://img.shields.io/github/stars/${repoPath}?style=flat-square&amp;label=%E2%98%85&amp;labelColor=dde5eb&amp;color=dde5eb" alt="GitHub stars">`;
            }
          }
        }
        
        // DOI link
        if (pub.doi) {
          const doiLink = document.createElement('a');
          doiLink.href = `https://doi.org/${pub.doi}`;
          doiLink.innerHTML = '<i class="fas fa-link" aria-hidden="true"></i><span>DOI</span>';
          doiLink.target = '_blank';
          links.appendChild(doiLink);
        }
        
        // BibTeX citation
        const citeLink = document.createElement('a');
        citeLink.href = '#';
        citeLink.innerHTML = '<i class="fas fa-quote-left" aria-hidden="true"></i><span>Cite</span>';
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
    const preprintContainer = document.getElementById('preprint-publications');
    const journalContainer = document.getElementById('journal-publications');
    const conferenceContainer = document.getElementById('conference-publications');
    
    if (!journalContainer || !conferenceContainer || !preprintContainer) return;
    
    // Clear containers
    preprintContainer.innerHTML = '';
    journalContainer.innerHTML = '';
    conferenceContainer.innerHTML = '';
    
    // Filter selected publications
    const selectedPublications = publications.filter(pub => {
      const pubConfig = publicationConfig?.publications?.[pub.citeKey] || {};
      return pubConfig.select === true || pub.highlight === true;
    });
    
    // Separate by type
    const preprintPubs = selectedPublications.filter(pub => pub.type === 'preprint' || pub.type === 'misc'); 
    const journalPubs = selectedPublications.filter(pub => pub.type === 'article');
    const conferencePubs = selectedPublications.filter(pub => 
      pub.type === 'inproceedings' || pub.type === 'conference'
    );

    // Render preprint publications
    if (preprintPubs.length === 0) {
      // Hide the entire preprint section
      const preprintSection = preprintContainer.closest('.publication-section');
      if (preprintSection) {
        preprintSection.style.display = 'none';
      }
      preprintContainer.innerHTML = '<div class="no-publications">No selected preprint papers found</div>';
    } else {
      // Ensure the section is visible if there are preprints
      const preprintSection = preprintContainer.closest('.publication-section');
      if (preprintSection) {
        preprintSection.style.display = 'block';
      }
      preprintPubs.forEach(pub => {
        preprintContainer.appendChild(createPublicationElement(pub, true));
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
    
    // Render journal publications
    if (journalPubs.length === 0) {
      journalContainer.innerHTML = '<div class="no-publications">No selected journal papers found</div>';
    } else {
      journalPubs.forEach(pub => {
        journalContainer.appendChild(createPublicationElement(pub, true));
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
    publicationsContainer.setAttribute('aria-busy', 'true');
    
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
        publicationsContainer.innerHTML = '<div class="no-publications state-message">No publications found matching the criteria</div>';
        publicationsContainer.classList.remove('publications-loading');
        publicationsContainer.setAttribute('aria-busy', 'false');
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
    publicationsContainer.setAttribute('aria-busy', 'false');
    });
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
  function showBibtex(publication, publicationElement) {
    const existing = publicationElement.querySelector('.citation-container');
    if (existing) {
      collapseCitation(existing);
      return;
    }

    const fields = [
      ['title', 'title'], ['author', 'author'], ['journal', 'journal'],
      ['booktitle', 'booktitle'], ['volume', 'volume'], ['number', 'number'],
      ['pages', 'pages'], ['year', 'year'], ['publisher', 'publisher'],
      ['eprint', 'eprint'], ['archivePrefix', 'archiveprefix'],
      ['primaryClass', 'primaryclass'], ['doi', 'doi'], ['url', 'url']
    ];
    const lines = fields
      .filter(([, key]) => publication[key])
      .map(([label, key]) => `  ${label} = {${publication[key]}}`);
    const bibtexText = `@${publication.type}{${publication.citeKey},\n${lines.join(',\n')}\n}`;
    const container = createCitationContainer(bibtexText);
    const content = publicationElement.querySelector('.publication-content');
    (content || publicationElement).appendChild(container);
  }

  function createCitationContainer(bibtexText) {
    const container = document.createElement('div');
    container.className = 'citation-container expanded';
    container.innerHTML = `
      <div class="citation-header">
        <span class="citation-title">BibTeX</span>
        <div class="citation-actions">
          <span class="citation-success" role="status" aria-live="polite"></span>
          <button type="button" class="citation-copy-btn"><i class="far fa-copy" aria-hidden="true"></i> Copy</button>
          <button type="button" class="citation-close-btn" aria-label="Close citation">×</button>
        </div>
      </div>
      <pre class="citation-text"></pre>
    `;
    container.querySelector('.citation-text').textContent = bibtexText;
    container.querySelector('.citation-close-btn').addEventListener('click', () => collapseCitation(container));
    container.querySelector('.citation-copy-btn').addEventListener('click', async () => {
      const status = container.querySelector('.citation-success');
      try {
        await navigator.clipboard.writeText(bibtexText);
        status.textContent = 'Copied';
      } catch (error) {
        status.textContent = 'Copy failed';
      }
      setTimeout(() => { status.textContent = ''; }, 2500);
    });
    return container;
  }

  function collapseCitation(container) {
    container.remove();
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
