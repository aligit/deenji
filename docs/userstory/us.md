# User Story: Property Details Page

## Title

Comprehensive Property Detail View for Real Estate Listings

## As a

Property Buyer

## I want

To see a detailed, visually rich view of a property I'm interested in, with comprehensive information, high-quality images, property specifications, location context, and clear next steps for contacting the seller.

## Description

After clicking on a property card or marker pin from the search results, the user is taken to a dedicated property details page that provides a comprehensive view of the selected property. This page should be information-rich but well-organized, allowing users to make informed decisions about the property.

The page should include:

1. **Image Gallery Section**

   - Large, high-quality image carousel/slider at the top
   - Thumbnail navigation for quick browsing through multiple photos
   - Full-screen viewing option for closer examination

2. **Essential Information Section**

   - Property title and headline features
   - Price displayed prominently in Persian with proper formatting (میلیارد/میلیون)
   - Key specifications (bedrooms, bathrooms, area, year built)
   - Property type and status (for sale, sold, etc.)

3. **Detailed Description Section**

   - Full property description with proper formatting (paragraphs, lists)
   - Special features and selling points
   - Property condition information

4. **Specifications Table**

   - Comprehensive breakdown of property details
   - Building features (heating/cooling, construction type)
   - Interior features (flooring, amenities)
   - Exterior features (land size, parking)

5. **Location Section**

   - Embedded Google Map showing the property's location
   - Nearby amenities and services (if available)
   - Neighborhood information

6. **Contact Section**

   - Clear call-to-action for contacting the seller/agent
   - Contact form or prominent display of contact information
   - Option to schedule a viewing

7. **Similar Properties Section**
   - Recommendation widget showing 3-4 similar properties

### Why

- Provides all necessary information for making an informed decision
- Creates a seamless flow from search results to detailed investigation
- Enables better visualization of the property with high-quality images
- Establishes trust with comprehensive, well-organized information
- Facilitates the next steps in the buying process

## Acceptance Criteria

### 1. Layout & Responsiveness

- [ ] **Desktop:** Multi-column layout with clear visual hierarchy and sections
- [ ] **Tablet:** Adapts to medium screens with appropriate scaling and reflow
- [ ] **Mobile:** Single-column responsive layout with collapsible sections
- [ ] **Persian RTL Support:** Perfect right-to-left layout and typography

### 2. Image Gallery

- [ ] Displays multiple high-quality images in a responsive carousel/slider
- [ ] Supports touch gestures on mobile and tablet devices
- [ ] Offers thumbnail navigation for quick browsing through all photos
- [ ] Includes full-screen image viewing capability
- [ ] Handles lazy loading for performance optimization

### 3. Property Information

- [ ] Displays formatted price with proper Persian numerals and denomination (میلیارد/میلیون)
- [ ] Shows all key specifications (bedrooms, bathrooms, area) with appropriate icons
- [ ] Renders property description with proper formatting and paragraphs
- [ ] Presents specifications in a scannable, organized table/grid format
- [ ] Clearly indicates property status (for sale, sold, etc.)

### 4. Map Integration

- [ ] Displays an embedded Google Map centered on the property location
- [ ] Shows a marker at the property's exact coordinates
- [ ] Offers basic map controls (zoom, pan)
- [ ] Maintains reasonable map size and loading performance

### 5. Contact Features

- [ ] Provides a clear call-to-action button for contacting the seller
- [ ] Includes a simple contact form or direct contact information
- [ ] Offers an option to schedule a viewing appointment
- [ ] Validates form inputs and provides appropriate feedback

### 6. Similar Properties

- [ ] Displays 3-4 relevant property recommendations with images and basic info
- [ ] Enables clicking through to those property detail pages
- [ ] Uses appropriate criteria for similarity (location, price range, property type)

### 8. Accessibility

- [ ] All images have appropriate alt text
- [ ] Page is navigable via keyboard
- [ ] Color contrast meets WCAG AA standards
- [ ] Interactive elements have appropriate focus states
- [ ] Page structure uses proper heading hierarchy

## Technical Notes

| Topic                  | Decision                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Routing**            | AnalogJs file-based routing with dynamic route parameter for property ID           |
| **Data Fetching**      | tRPC endpoint for fetching complete property details by ID                         |
| **Image Gallery**      | ngx-gallery or similar Angular-compatible component                                |
| **Map Integration**    | Reuse Google Maps component from search page, focused on single property           |
| **Similar Properties** | tRPC endpoint using Elasticsearch "more_like_this" query based on current property |
| **UI Framework**       | Angular with TailwindCSS for styling                                               |
| **Responsive Design**  | Mobile-first approach with Tailwind breakpoints                                    |
| **State Management**   | Angular signals for reactive property data                                         |

## Data Requirements

The endpoint should return a complete property object including:

```typescript
interface PropertyDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: {
    lat: number;
    lon: number;
  };
  address: string;
  images: string[]; // Array of image URLs
  features: string[]; // Array of property features
  amenities: string[]; // Array of nearby amenities
  status: string; // 'AVAILABLE', 'SOLD', etc.
  agent: {
    name: string;
    phone: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  specifications: {
    yearBuilt?: number;
    heating?: string;
    cooling?: string;
    parking?: string;
    floors?: number;
    // Other specifications as needed
  };
}
```

## Priority

**High** (core user journey feature for MVP launch)
