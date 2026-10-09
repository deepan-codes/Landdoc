# LandDoc - Getting Started Guide

## What You Have

A complete **Next.js 14 + React 18 + Tailwind CSS** responsive website for LandDoc property management.

### Current Status
✅ **COMPLETE:**
- Base components (Button, Card, Badge, ProgressBar, SearchField, InputField, Breadcrumb, TabNavigation)
- Header with navigation
- Footer
- Dashboard home page
- Responsive mobile design
- Mock data for all pages

⏳ **IN PROGRESS:**
- Additional pages (Properties, Documents, Checklist, Search, etc.)

## Quick Start

### 1. Install

```bash
# Option A: Using npm
npm install

# Option B: Using yarn
yarn install

# Option C: Using pnpm
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open http://localhost:3000 in your browser.

### 3. Make Your First Edit

Edit `app/page.jsx` and save. The page will auto-refresh.

## Project Structure

```
landdoc/
├── app/                    # Next.js App Router pages
│   ├── layout.jsx         # Root layout (Header + Footer wrapper)
│   ├── page.jsx           # Dashboard home page
│   └── [future pages]
│
├── components/
│   ├── common/            # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── SearchField.jsx
│   │   ├── InputField.jsx
│   │   ├── Breadcrumb.jsx
│   │   ├── TabNavigation.jsx
│   │   └── index.js
│   │
│   ├── layout/            # Global layout components
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   │
│   └── dashboard/         # Dashboard-specific components
│       ├── QuickActions.jsx
│       ├── SummaryCards.jsx
│       ├── PropertyCard.jsx
│       ├── DocumentRow.jsx
│       ├── BackupStatus.jsx
│       └── index.js
│
├── styles/
│   └── globals.css        # Tailwind setup + custom styles
│
├── mockData.js            # Sample data for all pages
├── tailwind.config.js     # Tailwind color, spacing, typography
├── jsconfig.json          # Path aliases (@/)
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

## How to Build a New Page

### Example: Create Properties Page

#### 1. Create the page file
```bash
# File: app/properties/page.jsx

'use client';

import Header from '@/components/layout/Header';
import { properties } from '@/mockData';

export default function PropertiesPage() {
  return (
    <div className="space-y-md">
      <h1 className="text-h1 font-serif font-semibold">My Properties</h1>
      {/* Add your content here */}
    </div>
  );
}
```

#### 2. Use components
```jsx
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import PropertyCard from '@/components/dashboard/PropertyCard';

// In your component:
<Button href="/properties/add" variant="primary">
  Add Property
</Button>

<Card>
  <h2 className="text-h2">Properties</h2>
  {properties.map(prop => (
    <PropertyCard key={prop.id} property={prop} />
  ))}
</Card>
```

#### 3. Update Header
```jsx
// In app/layout.jsx
<Header currentPage="properties" />  // Update this
```

#### 4. Test it
```
http://localhost:3000/properties
```

## Tailwind CSS Cheat Sheet

### Colors (from design system)
```jsx
className="bg-green-dark"           // Primary green
className="bg-paper"                // Light background
className="text-text-primary"       // Dark text
className="text-text-muted"         // Light text
className="border-border"           // Light border
className="text-success"            // Green accent
className="text-warning"            // Orange accent
className="text-danger"             // Red accent
```

### Typography
```jsx
className="text-h1"                 // 40px title
className="text-h2"                 // 28px section title
className="text-h3"                 // 20px card title
className="text-body"               // 16px body text
className="text-secondary"          // 14px secondary text
className="text-small"              // 13px small text

className="font-serif"              // Serif font (Georgia)
className="font-sans"               // Sans serif font (Inter)
className="font-semibold"           // Bold font weight (600)
className="font-medium"             // Medium font weight (500)
```

### Spacing (8px scale)
```jsx
className="p-md"                    // padding 24px
className="px-md py-sm"             // padding-x 24px, padding-y 16px
className="gap-md"                  // gap 24px
className="mb-md"                   // margin-bottom 24px
className="mt-lg"                   // margin-top 32px
```

### Layout
```jsx
className="flex items-center gap-md"        // Flexbox, centered
className="grid grid-cols-3 gap-md"         // 3-column grid
className="grid-cols-1 md:grid-cols-2"      // Responsive grid
className="hidden md:flex"                  // Hide on mobile, show on tablet+
className="container-max"                  // Max width container (1200px)
```

### Responsive Prefixes
```jsx
className="text-sm sm:text-body md:text-lg"   // Different sizes per screen
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="hidden sm:block"                    // Show on small+
```

## Component Usage Examples

### Button
```jsx
// Primary (green filled)
<Button variant="primary" size="md">
  Add Document
</Button>

// Secondary (outline)
<Button variant="secondary" size="md">
  Cancel
</Button>

// Text link
<Button variant="text">
  View more
</Button>

// As link
<Button href="/properties" variant="primary">
  Go to Properties
</Button>
```

### Card
```jsx
<Card className="mb-md">
  <h3 className="text-h3">Title</h3>
  <p>Content here</p>
</Card>

// Hoverable card
<Card hoverable onClick={() => console.log('clicked')}>
  Clickable content
</Card>
```

### Badge
```jsx
<Badge variant="success">Added</Badge>
<Badge variant="warning" size="sm">EC (34 YRS)</Badge>
<Badge variant="orange">Revenue record</Badge>
```

### ProgressBar
```jsx
<ProgressBar 
  value={7} 
  max={9} 
  label="Documents" 
  showPercentage
/>
```

### InputField
```jsx
<InputField
  label="Property Name"
  name="propertyName"
  placeholder="Enter name"
  value={formData.propertyName}
  onChange={(e) => handleChange(e)}
  error={errors.propertyName}
  required
/>
```

### SearchField
```jsx
<SearchField
  placeholder="Search properties..."
  scope="Search within Avadi Land"
  onChange={(value) => console.log(value)}
/>
```

## Common Tasks

### Add a new navigation link
Edit `components/layout/Header.jsx`:
```jsx
const navItems = [
  { label: 'Dashboard', href: '/', key: 'dashboard' },
  { label: 'Properties', href: '/properties', key: 'properties' },
  // Add new item here:
  { label: 'New Page', href: '/newpage', key: 'newpage' },
];
```

### Change color scheme
Edit `tailwind.config.js`:
```js
colors: {
  'green-dark': '#0F3D2E',  // Change this
  'paper': '#F7F5F0',       // Or this
}
```

### Change spacing
Edit `tailwind.config.js`:
```js
spacing: {
  'sm': '16px',  // Default 16px
  'md': '24px',  // Change to your preference
}
```

### Add new mock data
Edit `mockData.js`:
```js
export const newData = [
  { id: 1, name: 'Item', ... }
];
```

Then import and use:
```jsx
import { newData } from '@/mockData';
```

## Debugging

### Check styles aren't applying
- Make sure you're using the correct Tailwind class names
- Classes must exist in `tailwind.config.js` to be included
- Rebuild with `npm run dev` if you added new classes

### Component not showing
- Check the import path (@/ should resolve)
- Make sure the component is exported
- Check browser console for errors

### Responsive layout broken
- Check breakpoint prefixes: `sm:`, `md:`, `lg:`
- Mobile-first design: base styles apply to all, prefixes override
- Test with browser DevTools responsive mode

## Next Pages to Build

### Priority Order
1. **Properties Page** - List all properties
2. **Documents Page** - List all documents
3. **Search Page** - Search properties/documents
4. **Checklist Page** - Per-property document checklist
5. **Add Property** - Form to create property
6. **Add Document** - Form to add document
7. **Property Detail** - View property and its documents
8. **Document Detail** - View single document details
9. **Scan/Upload** - Upload document
10. **Review Details** - Review extracted document data

## Deployment

### Deploy to Vercel (recommended)
```bash
npm install -g vercel
vercel
# Follow prompts
```

### Deploy to other platforms
Next.js can deploy to:
- Netlify
- AWS Amplify
- GitHub Pages (static export)
- Docker
- Self-hosted server

See https://nextjs.org/docs/deployment

## Performance Tips

- Use `<Image />` from Next.js for images (auto optimization)
- Keep components small and focused
- Use React.memo() for heavy components
- Lazy load heavy sections with `dynamic()`
- Use mock data sparingly (will be replaced with API)

## Common Errors & Fixes

### "Module not found" error
- Check the import path uses @/ alias
- Verify file exists in the path
- Restart dev server

### "Cannot find name" error (CSS)
- Check Tailwind classes exist in config
- Verify globals.css is imported
- Clear .next folder and rebuild

### Responsive layout issues
- Check mobile breakpoints (sm:, md:, lg:)
- Test in browser DevTools responsive mode
- Ensure classes are spelled correctly

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev
- **Design System**: See `tailwind.config.js`

## Support

If you get stuck:
1. Check the error message in terminal/console
2. Look at similar components for examples
3. Check Tailwind/Next.js/React documentation
4. Review the mockData to understand data structure

---

**Ready to build?** Continue with the next page or let me know what you need! 🚀
