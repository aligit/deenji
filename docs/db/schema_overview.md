# Database Schema Overview

This document serves as a reference point for the database schema of the Deenji Real Estate Platform.

**The primary and most detailed overview of the database tables, key columns, relationships, and important functions is embedded directly within the `system_prompt` of the "Database Schema (PostgreSQL)" group in the `codecompanion-workspace.json` file.**

When using CodeCompanion with the `/workspace "Database Schema (PostgreSQL)"` command, the system prompt loaded will contain this comprehensive summary.

## Key Information Points (Covered in Workspace System Prompt):

- **Main Tables:**
  - `amenities`
  - `profiles` (User profiles)
  - `properties` (Core property listings, includes geospatial data, pricing, attributes)
  - `property_amenities` (Junction table)
  - `property_attribute_keys` (Defines dynamic attribute types)
  - `property_attribute_values` (Stores dynamic attribute values for properties)
  - `property_images`
  - `property_price_history`
  - `property_similar_properties`
  - `saved_properties` (User-saved/favorited properties)
  - `user_settings`
- **Data Types:** Includes standard SQL types, `jsonb` for flexible attributes, `tsvector` for search, and PostGIS `POINT` for location.
- **Relationships:** Implicitly defined by foreign keys (e.g., `property_id` in `property_images` links to `properties.id`).
- **Row Level Security (RLS):** Implemented on key tables.
- **Key PostgreSQL Functions:** Mention of functions like `handle_new_user`, `insert_property_direct`, and search vector update triggers.

**Purpose of this File:**

This markdown file primarily exists to satisfy the structural requirements of certain tooling that expects a file path for all context items. For the most up-to-date and token-efficient schema summary for Large Language Model (LLM) interaction, please refer to the aforementioned `system_prompt` in `codecompanion-workspace.json`.

If specific Data Definition Language (DDL) for a table (e.g., `CREATE TABLE` statements with exact constraints, defaults, and types) is required, this should be requested from the development team or retrieved directly from the database or migration files.
