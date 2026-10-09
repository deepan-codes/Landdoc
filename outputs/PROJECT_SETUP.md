# LandDoc - React + Next.js + Tailwind CSS Project Setup

## Project Overview
A responsive web app for managing private property documents and records, built with React/Next.js and Tailwind CSS.

## Pages (11 total)
1. ✅ **Dashboard** - Home page with greeting, quick actions, summary, properties, recent docs
2. My Properties - List of all properties
3. Property Detail - View documents for a specific property
4. Scan / Upload Document - Capture or upload a deed
5. Add Property - Create a new property record
6. Review Extracted Details - Review OCR-extracted document details
7. Documents Library - View all documents across properties
8. Add Document - Add document to a property (same as Scan/Upload)
9. Document Details - View full document with metadata
10. Search Vault - Search properties and documents
11. Document Checklist - Track required documents per property

## Reusable Components
- **Header** - Navigation, logo, Add document button, user profile
- **Footer** - Copyright and links
- **Button** - Primary (green filled), Secondary (outline), Text variants, sizes
- **Card** - Container with border and shadow
- **ProgressBar** - Linear progress indicator
- **Badge** - Small tag/label for document types
- **SearchField** - Scoped search input
- **PropertyCard** - Photo, title, location, progress, action
- **DocumentCard** - Thumbnail, title, property, type, date, action
- **TabNavigation** - Tabbed interface
- **InputField** - Text input with label, error states, help text
- **Breadcrumb** - Navigation breadcrumb
- **StickyActionBar** - Fixed bottom action bar
- **Tabs** - Multiple content tabs
- **Modal/Dropdown** - For overflow menus

## Design System
- **Colours**: 
  - Background: #F7F5F0
  - Primary Green: #0F3D2E
  - Text: #1C2420
  - Muted: #6B7468
  - Borders: #E4E0D6
  - Success: #2F7A57
  - Warning: #B7791F
  - Danger: #B3382C
- **Typography**:
  - Headings: Serif (Newsreader or similar)
  - Body: Inter
  - Sizes: 40px (h1), 28px (h2), 20px (h3), 16px (body), 14px (secondary), 13px (small)
- **Spacing**: 8px scale (8, 16, 24, 32, 48, 64)
- **Radius**: 12px cards, 8px buttons
- **Shadows**: Subtle (0 1px 2px rgba(20,30,25,0.06))

## Folder Structure
```
landdoc/
├── app/
│   ├── layout.tsx              # Root layout with Header/Footer
│   ├── page.tsx                # Dashboard
│   ├── properties/
│   │   ├── page.tsx            # My Properties
│   │   ├── [id]/
│   │   │   └── page.tsx        # Property Detail
│   │   └── add/
│   │       └── page.tsx        # Add Property
│   ├── documents/
│   │   ├── page.tsx            # Documents Library
│   │   ├── [id]/
│   │   │   └── page.tsx        # Document Details
│   │   ├── add/
│   │   │   ├── page.tsx        # Add Document (Step 1)
│   │   │   └── review/
│   │   │       └── page.tsx    # Review Extracted Details (Step 2)
│   │   └── scan/
│   │       └── page.tsx        # Scan / Upload (same as Add)
│   ├── checklist/
│   │   └── [propertyId]/
│   │       └── page.tsx        # Document Checklist
│   └── search/
│       └── page.tsx            # Search Vault
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SearchField.tsx
│   │   ├── InputField.tsx
│   │   ├── TabNavigation.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── StickyActionBar.tsx
│   ├── dashboard/
│   │   ├── QuickActions.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── DocumentRow.tsx
│   │   └── BackupStatus.tsx
│   ├── properties/
│   │   ├── PropertyList.tsx
│   │   └── PropertyListItem.tsx
│   └── documents/
│       └── DocumentGrid.tsx
├── data/
│   └── mockData.ts             # Sample data
├── styles/
│   └── globals.css             # Tailwind setup
├── lib/
│   └── constants.ts            # Color, spacing constants
└── tailwind.config.js          # Tailwind configuration
```

## Next Steps
1. ✅ **STEP 1 (Current):** Project setup and structure (you are here)
2. **STEP 2:** Create base components (Header, Footer, Button, Card, etc.)
3. **STEP 3:** Create Dashboard page and child components
4. **STEP 4:** Add mock data and sample content
5. **STEP 5:** Set up routing between pages
6. **STEP 6:** Build remaining screens one by one
7. **STEP 7:** Test responsive design on mobile

## Tech Stack
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS 3** - Utility-first CSS
- **TypeScript** - Type safety (optional but recommended)
- **JavaScript** - As per requirement

## Starting with Dashboard
The Dashboard has these child components:
- Greeting section (title, eyebrow, description)
- Quick Actions row (4 buttons)
- Summary Cards (3 column grid: Properties, Documents, Added, Pending)
- My Properties section (3 property cards with photos and progress bars)
- Recent Documents section (5 rows in a list)
- Still to Add section (grouped by property with "Add" buttons)
- Backup status footer row

Ready to build Step 2? Say "continue" and I'll create the base components.
