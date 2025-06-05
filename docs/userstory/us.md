# User Story: Side-by-Side Map & List View (v MVP — “Center-on-First Pin”)

## Title

Display Search Results as a Linked Map & List **(map auto-centers on the first result)**

## As a

Property Buyer

## I want

To see search results in a two-pane layout (map on one side, list on the other) so I can scan property details **and** immediately view the location of the top-ranked result without extra clicks.

## Description

After running a search or applying filters, the Results page splits into two panels:

1. **List Panel** (right side – scrollable)

   - Shows up to 20 property cards per page (image, title, price, key facts).
   - “Load More” button for additional pages (no infinite scroll for now).

2. **Map Panel** (left side – interactive, Mapbox GL)
   - Automatically **centers and zooms** (≥ 14) on the first property returned by the search.
   - Drops a pin for **every property on the current page** (≤ 20 pins).
   - No clustering or auto-fit logic; map remains focused unless user pans/zooms manually.

**Panel synchronisation**

- Clicking/tapping a pin opens a mini-card and scrolls/­highlights the matching list card.
- Hovering (desktop) or tapping a list card highlights its pin; clicking pans/zooms (if needed) to that pin.
- Changing page or filters refreshes both panels; the map re-centers on the first pin of the new result set.

### Why

- Keeps the implementation ultra-light for MVP (single `flyTo` per result set; no clustering math).
- Guarantees markers show (zoom ≥ 14) to satisfy the Elasticsearch tile threshold.
- Gives buyers immediate geographic context without waiting for fit-bounds or cluster animations.
- Mirrors common “store locator” UX that prioritises the top match while still showing nearby options.

## Acceptance Criteria

### 1. Map Initialisation

- [ ] On search or filter change, the map **calls `flyTo`** with  
       `center = [firstResult.lng, firstResult.lat]`, `zoom = max(14, currentZoom)`.
- [ ] If there are 0 results, the map shows a static overview of District 5 at zoom 14 with no pins.

### 2. Pins

- [ ] Exactly one pin per property on the current page (≤ 20).
- [ ] Pins appear regardless of subsequent user zoom (< 14 the pins remain, but no new ES query fires).

### 3. Marker Interaction

- [ ] Clicking a pin opens a popup (thumbnail, title, Persian-formatted price, “View Details” link).
- [ ] Corresponding list card scrolls into view and gets a highlight style.

### 4. List ↔ Map Sync

- [ ] Hovering or focusing a list card causes its pin to “pulse” (CSS scale or color).
- [ ] Clicking a list card calls `map.flyTo` so its pin is centered and opens the popup.

### 5. Filter & Pagination Updates

- [ ] Adjusting filters refreshes list and pins in real time; map recenters on the new first result.
- [ ] Switching to page N replaces pins with that page’s items and recenters on its first result.

## Technical Notes

| Topic               | Decision                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Library**         | `mapbox-gl@^2` + `ngx-mapbox-gl` (Angular wrapper).                                                 |
| **Map load hook**   | Use `(mapLoad)` to grab the `Map` instance and store it in a service.                               |
| **Centering logic** | `map.flyTo({ center: [lng, lat], zoom: Math.max(14, map.getZoom()), speed: 1.2, essential: true })` |
| **Marker code**     | Loop through search results, create `new mapboxgl.Marker().setLngLat([...]).addTo(map)`.            |
| **Styling**         | Tailwind/Grid or CSS Flexbox; ensure map div has `height: 100%` and flex-grow.                      |
| **Data**            | Search API already returns coordinates; no extra ES call for pins.                                  |

## Priority

**High** (foundation feature for MVP launch)
