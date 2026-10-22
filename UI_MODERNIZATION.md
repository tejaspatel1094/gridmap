# UI Modernization Checklist — gridmap

## 1. Foundations
- [ ] Define design tokens (CSS custom properties) for color, spacing, radius, shadow, and type scale
- [ ] Adopt a modern font stack (e.g. Inter or system-ui) with a clear type scale (12/14/16/20/24/32)
- [ ] Use a consistent spacing scale (4px or 8px grid)
- [ ] Add dark mode via `prefers-color-scheme` plus a manual toggle
- [ ] Replace hard-coded colors throughout with tokens

## 2. Layout
- [ ] Full-bleed map as the main surface, with UI in floating panels on top
- [ ] Slim top bar: title, data/date selector, theme toggle
- [ ] Collapsible side panel (desktop) / bottom sheet (mobile) for state details
- [ ] Responsive breakpoints; check at 375px, 768px, and 1280px+
- [ ] No horizontal scroll on mobile

## 3. Map styling
- [ ] Perceptually uniform sequential palette (e.g. viridis/cividis or a single-hue ramp) for the choropleth
- [ ] Palettes tuned separately for light and dark themes
- [ ] Thin, low-contrast state borders; stronger outline on hover and selection
- [ ] Muted basemap / background so the data stands out
- [ ] Smooth transitions when the data or selection changes (150–250ms)

## 4. Interaction
- [ ] Hover tooltip: state name, value, units, rank
- [ ] Clear selected state (outline plus a raised or dimmed-others effect)
- [ ] Click empty map area or press Esc to clear the selection
- [ ] Keyboard navigation and focus states for states and controls
- [ ] Pointer cursor and hover affordances on clickable areas

## 5. Legend & data display
- [ ] Modern legend: compact gradient bar with labeled breaks and units
- [ ] Detail panel with stat tiles (total generation, share by fuel type, YoY change)
- [ ] Small chart in the detail panel (e.g. fuel-mix bar or trend sparkline)
- [ ] Consistent number formatting (thousands separators, units like GWh/TWh)
- [ ] Data source and last-updated note

## 6. Components
- [ ] Rounded cards (8–12px radius), subtle shadows or 1px borders
- [ ] Modern buttons, selects, and toggles with hover/active/focus/disabled states
- [ ] Loading skeletons instead of blank or spinner-only states
- [ ] Empty and error states with helpful messages
- [ ] Consistent icon set (e.g. Lucide)

## 7. Accessibility
- [ ] WCAG AA contrast for text and UI (4.5:1 text, 3:1 UI elements)
- [ ] Don't rely on color alone; show values in tooltip/panel
- [ ] ARIA labels for the map regions and controls
- [ ] Respect `prefers-reduced-motion`

## 8. Polish
- [ ] Favicon and page title
- [ ] Micro-interactions (panel slide-in, tooltip fade)
- [ ] Performance check: smooth hover on all states, fast first render
- [ ] Cross-browser test (Chrome, Safari, Firefox) and mobile Safari
- [ ] Update README screenshots after the redesign
