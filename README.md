# Chaofeng Chen's Homepage

Personal academic website: [chaofengc.github.io](https://chaofengc.github.io/).

## Content

- `index.html`: profile and academic activities
- `data/news.json`: news
- `data/publications.bib`: publications
- `data/`: other website content and configuration
- `images/`: photos, publication figures, and logos

## Updating the PDF CV

Edit `data/cv.json` for profile information and publication selection. Publication
titles, author lists, links, and distinctions come from `data/publications.bib`
and `data/publication-config.json`. The additional publication in `cv.json` is
preserved from the previous CV because it is absent from the homepage bibliography.

Run `python3 scripts/build_cv.py` with `reportlab` installed to rebuild
`assets/Resume_ChenChaofeng_en.pdf`. The script needs the DejaVu Sans TTF fonts;
set `CV_FONT_DIR` if they are not in a standard location. On macOS, the Chinese
name uses the system Songti font. Update the date in `cv.json` and the CV link's
version in `index.html` when publishing a revision.
