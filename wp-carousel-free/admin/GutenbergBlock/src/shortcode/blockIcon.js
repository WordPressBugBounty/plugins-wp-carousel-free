const el = wp.element.createElement;
const icons = {};

// Same teal as the block-based carousel icons, with a fallback where their stylesheet is not loaded.
const iconFill = "var(--wpcp-carousel-primary-2-800, #19949e)";

// The WP Carousel shortcode glyph: a framed slide with nav arrows between brackets.
icons.spwpcfIcon = el(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
  },
  el("path", {
    d: "M5.01 7.074v9.847c0 .159.13.29.29.29h13.418c.16 0 .291-.131.291-.29V7.074c0-.16-.131-.29-.291-.29H5.3c-.16 0-.292.13-.292.29m11.952 8.54H7.057a.29.29 0 0 1-.292-.29V8.67c0-.16.131-.29.292-.29h9.905c.16 0 .291.13.291.29v6.655c0 .16-.13.29-.291.29",
    fill: iconFill,
  }),
  el("path", {
    d: "m16.017 12.1-1.464 1.816a.17.17 0 0 1-.24.027l-.741-.591a.17.17 0 0 1-.027-.24l.812-1.005a.17.17 0 0 0 0-.215l-.82-1.012a.17.17 0 0 1 .028-.24l.74-.591a.17.17 0 0 1 .241.027l1.364 1.69.103.122a.16.16 0 0 1 .004.212m-6.373.007.805.996a.167.167 0 0 1-.027.237l-.73.583a.17.17 0 0 1-.24-.027L8 12.1a.17.17 0 0 1 0-.214l.027-.034 1.437-1.762a.17.17 0 0 1 .239-.027l.733.586a.167.167 0 0 1 .028.238l-.82 1.01a.17.17 0 0 0 0 .21",
    fill: iconFill,
  }),
  el("path", {
    d: "M3 0h4v2H3c-.55 0-1 .45-1 1v18c0 .55.45 1 1 1h4v2H3a3.01 3.01 0 0 1-3-3V3a3.01 3.01 0 0 1 3-3zm18 0h-4v2h4c.55 0 1 .45 1 1v18c0 .55-.45 1-1 1h-4v2h4a3.01 3.01 0 0 0 3-3V3a3.01 3.01 0 0 0-3-3z",
    fill: iconFill,
  })
);

export default icons;
