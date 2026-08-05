// Fetches a same-origin SVG file's markup once (shared across all callers/instances via a
// module-level cache) so it can be injected as live DOM instead of loaded through an <img>.
// Built for Logo.jsx: Safari rasterizes <img>-sourced SVGs that use <mask>/<filter> content
// to an offscreen buffer sized to the on-screen CSS box, which can look soft at small
// display sizes — rendering the same markup inline avoids that codepath entirely, since
// Safari then treats it as ordinary vector DOM like any other inline <svg>.
//
// Safe to use with dangerouslySetInnerHTML here specifically because the source is always a
// trusted same-origin static asset we control (never user input) — never reuse this for
// third-party or user-supplied SVG content.

const svgTextCache = new Map();

export function fetchSvgText(src) {
  if (!svgTextCache.has(src)) {
    const promise = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${src} (${res.status})`);
        return res.text();
      })
      .catch((err) => {
        svgTextCache.delete(src); // don't cache a failure — let the next mount retry
        throw err;
      });
    svgTextCache.set(src, promise);
  }
  return svgTextCache.get(src);
}

let instanceCounter = 0;

// Gives every `id="..."` in the markup a unique-per-instance suffix, and rewrites the
// url(#id) / href="#id" references that point at them to match — so multiple inlined copies
// of the same SVG on one page never fight over <mask>/<filter>/<clipPath>/gradient ids.
export function namespaceSvgIds(svgText) {
  const suffix = `-svg${instanceCounter++}`;
  const ids = new Set();
  const idPattern = /\bid="([^"]+)"/g;
  let match = idPattern.exec(svgText);
  while (match) {
    ids.add(match[1]);
    match = idPattern.exec(svgText);
  }

  let result = svgText;
  ids.forEach((id) => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result
      .replace(new RegExp(`id="${escaped}"`, 'g'), `id="${id}${suffix}"`)
      .replace(new RegExp(`url\\(#${escaped}\\)`, 'g'), `url(#${id}${suffix})`)
      .replace(new RegExp(`(xlink:href|href)="#${escaped}"`, 'g'), `$1="#${id}${suffix}"`);
  });
  return result;
}
