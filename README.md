# Personal Website

http://chaofengc.github.io/

## Image Organization

Images are organized by purpose to keep paths predictable and maintenance simple.

```
images/
	site/            # profile, background, and general site UI images
	publications/    # publication and project cover/preview images
	logos/           # institution/lab logos
	gallery/         # gallery content (kept as-is)
	archive/unused/  # retired assets kept for reference
```

### Conventions

- Put reusable site visuals in `images/site/`.
- Put paper/project thumbnails and previews in `images/publications/`.
- Put branding assets in `images/logos/`.
- Keep gallery files under `images/gallery/`.
- Move no-longer-used files to `images/archive/unused/` instead of deleting immediately.

When moving images, update all references in HTML, CSS, JavaScript, and data files.
