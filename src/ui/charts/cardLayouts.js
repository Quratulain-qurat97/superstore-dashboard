// cardLayouts.js
// Per-card offsets measured from the Figma SVG. Figma's chart cards are not identical (title heights
// and callout positions differ), and those differences are kept. All values are pixels from the
// card's top-left corner, except `calloutFromRight`, which is measured from the card's right edge
// so the callout stays at the right in a wider card.

export const TREND_CARD_LAYOUT = {
  titleLeft: 15.95,
  titleTop: 16.77, // baseline y=40.01
  calloutFromRight: 82, // glyph origin x=578 in the 660px card
  calloutTop: 12, // baseline y=29
  body: { left: 5, top: 57, right: 14, height: 252 }, // chart box 641 x 252
};

export const CATEGORY_CARD_LAYOUT = {
  titleLeft: 15.94,
  titleTop: 13.78, // baseline y=37.01
  calloutFromRight: 95, // glyph origin x=565 in the 660px card
  calloutTop: 12, // baseline y=29
  body: { left: 0, top: 57, right: 0, height: 267 }, // chart box 660 x 267
};

// Bottom-left card (Figma's "Country Performance" slot). It has no callout. The compact legend sits at
// the right of the title row, with its text baseline at y=34.95 (centred on the title's lowercase letters).
export const REGIONAL_CARD_LAYOUT = {
  titleLeft: 16.11,
  titleTop: 14.78, // baseline y=38.01
  body: { left: 0, top: 57, right: 0, height: 267 }, // chart box 660 x 267
  legend: { right: 24, top: 22.3 },
};



/**
 * Sales by Segment card layout.
 *
 * Matches the Regional Performance card so both bottom-row
 * charts share the same title position and chart-body dimensions.
 *
 * Card body starts 57px below the card top and uses a
 * 267px chart area.
 */

export const SEGMENT_CARD_LAYOUT = {
  titleLeft: 16.11,
  titleTop: 14.78,
  body: { left: 0, top: 57, right: 0, height: 267 },
};

