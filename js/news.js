// News section data loader for index page
(function () {
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createNewsItem(item) {
        var date = item.date ? escapeHtml(item.date) : '';
        var contentHtml = item.content_html || escapeHtml(item.content || '');
        var pinClass = item.pin ? ' news-item-pinned' : '';

        return '' +
            '<div class="news-item' + pinClass + '">' +
            '<span class="date">' + date + '</span>' +
            '<span class="content">' + contentHtml + '</span>' +
            '</div>';
    }

    async function loadNews() {
        var newsScroll = document.getElementById('news-scroll');
        if (!newsScroll) {
            return;
        }

        newsScroll.setAttribute('aria-busy', 'true');

        try {
            var response = await fetch('data/news.json');
            if (!response.ok) {
                throw new Error('HTTP error: ' + response.status);
            }

            var data = await response.json();
            var newsItems = Array.isArray(data.news) ? data.news : [];
            var pinnedNews = newsItems.filter(function (item) { return item.pin; });
            var regularNews = newsItems.filter(function (item) { return !item.pin; });
            var orderedNews = pinnedNews.concat(regularNews);

            if (orderedNews.length === 0) {
                newsScroll.innerHTML = '' +
                    '<div class="news-item">' +
                    '<span class="date">-</span>' +
                    '<span class="content">No news available.</span>' +
                    '</div>';
                newsScroll.setAttribute('aria-busy', 'false');
                return;
            }

            newsScroll.innerHTML = orderedNews.map(createNewsItem).join('');
            newsScroll.setAttribute('aria-busy', 'false');
        } catch (error) {
            console.error('Failed to load news:', error);
            newsScroll.innerHTML = '' +
                '<div class="news-item">' +
                '<span class="date">!</span>' +
                '<span class="content">Failed to load news data.</span>' +
                '</div>';
            newsScroll.setAttribute('aria-busy', 'false');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadNews);
    } else {
        loadNews();
    }
})();
