# LandDoc - Private Property Document Vault

A modern, responsive web application for managing private property documents and records for families in Tamil Nadu, India. Built with Next.js 14, React 18, and Tailwind CSS.

## 🎯 Project Overview

LandDoc is a client-encrypted, offline-first property document management system. It allows families to securely store, organize, and manage property deeds, survey records, tax documents, and other important papers.

### Current Status
- ✅ **Complete**: Dashboard home page with all UI components
- ✅ **Complete**: Base reusable components (Button, Card, Badge, ProgressBar, etc.)
- ✅ **Complete**: Responsive mobile-first design
- ✅ **Complete**: Design system (colors, typography, spacing)
- ⏳ **In Progress**: Additional pages (Properties, Documents, Search, Checklist, etc.)

## 📋 What's Included

### Pages Built
- ✅ **Dashboard** - Home page with greeting, quick actions, summary cards, properties, recent documents

### Pages Structure (Ready for Implementation)
- Properties List
- Property Detail
- Documents Library
- Document Details
- Add Property (Form)
- Add Document (Upload)
- Scan/Upload Document
- Review Extracted Details
- Search Vault
- Document Checklist

### Components Created
**Common Components:**
- Button (5 variants, 3 sizes)
- Card (flexible container)
- Badge (10 color variants)
- ProgressBar (with label and percentage)
- SearchField (with clear button)
- InputField (with label, error, helper text)
- Breadcrumb (navigation trail)
- TabNavigation (tabbed interface)

**Layout Components:**
- Header (responsive with navigation)
- Footer (with privacy message)

**Dashboard Components:**
- QuickActions (4 action buttons)
- SummaryCards (4 statistics)
- PropertyCard (with photo and progress)
- DocumentRow (list item)
- BackupStatus (backup information)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **npm** 7.x or higher (comes with Node.js)

### Installation

1. **Extract this ZIP file** to your desired location:
   ```bash
   unzip landdoc-web.zip
   cd landdoc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install:
   - Next.js 14
   - React 18
   - Tailwind CSS 3
   - PostCSS
   - Autoprefixer

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to **http://localhost:3000**

   You should see the LandDoc Dashboard home page.

### Build for Production

```bash
npm run build
npm start
```

Then visit http://localhost:3000

## 📁 Project Structure

```
landdoc/
├── app/                           # Next.js App Router
│   ├── layout.jsx                 # Root layout (Header + Footer wrapper)
│   └── page.jsx                   # Dashboard home page
│
├── components/
│   ├── common/                    # Reusable UI components
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
│   ├── layout/                    # Global layout components
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   │
│   └── dashboard/                 # Dashboard-specific components
│       ├── QuickActions.jsx
│       ├── SummaryCards.jsx
│       ├── PropertyCard.jsx
│       ├── DocumentRow.jsx
│       ├── BackupStatus.jsx
│       └── index.js
│
├── styles/
│   └── globals.css                # Tailwind setup + custom styles
│
├── mockData.js                    # Sample data for all pages
├── tailwind.config.js             # Tailwind configuration (colors, spacing, fonts)
├── postcss.config.js              # PostCSS configuration for Tailwind
├── jsconfig.json                  # Path aliases (@/)
├── next.config.js                 # Next.js configuration
├── package.json                   # Dependencies and scripts
├── .gitignore                     # Git ignore rules
│
└── Documentation/
    ├── README.md                  # This file
    ├── GETTING_STARTED.md         # Setup and usage guide
    ├── PROJECT_SETUP.md           # Project structure overview
    ├── STEP_2_SUMMARY.md          # Component documentation
    └── STEP_3_SUMMARY.md          # Dashboard documentation
```

## 🎨 Design System

### Colors (Tailwind Classes)
- **Primary**: `bg-green-dark` (#0F3D2E)
- **Background**: `bg-paper` (#F7F5F0)
- **Text Primary**: `text-text-primary` (#1C2420)
- **Text Muted**: `text-text-muted` (#6B7468)
- **Borders**: `border-border` (#E4E0D6)
- **Accent**: `text-brass` (#B8893B)
- **Status**: `text-success` (#2F7A57), `text-warning` (#B7791F), `text-danger` (#B3382C)

### Typography
- **Headings**: Serif (Georgia, Garamond fallback)
- **Body**: Sans-serif (Inter)
- **Sizes**:
  - `text-h1`: 40px (page titles)
  - `text-h2`: 28px (section titles)
  - `text-h3`: 20px (card titles)
  - `text-body`: 16px (body text)
  - `text-secondary`: 14px (secondary text)
  - `text-small`: 13px (small text)

### Spacing (8px Scale)
- `xs`: 8px
- `sm`: 16px
- `md`: 24px
- `lg`: 32px
- `xl`: 48px
- `xxl`: 64px

## 📱 Responsive Breakpoints

The project uses mobile-first design with Tailwind breakpoints:
- **Mobile**: Base styles (< 640px)
- **Small** (`sm:`): ≥ 640px
- **Medium** (`md:`): ≥ 768px
- **Large** (`lg:`): ≥ 1024px
- **Extra Large** (`xl:`): ≥ 1280px

Dashboard is fully responsive and tested on:
- ✅ iPhone (375px)
- ✅ iPad (768px)
- ✅ Desktop (1280px+)

## 🛠️ Available Scripts

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm start                # Run production build
npm run lint             # Check code for errors
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

## 💻 How to Use Components

### Example: Button
```jsx
import Button from '@/components/common/Button';

// Primary button
<Button variant="primary" size="md">
  Add Document
</Button>

// As a link
<Button href="/properties" variant="secondary">
  Go to Properties
</Button>

// Text link
<Button variant="text">
  View More
</Button>
```

### Example: Card
```jsx
import Card from '@/components/common/Card';

<Card hoverable onClick={() => console.log('clicked')}>
  <h3>Card Title</h3>
  <p>Card content here</p>
</Card>
```

### Example: InputField
```jsx
import InputField from '@/components/common/InputField';

<InputField
  label="Property Name"
  name="propertyName"
  placeholder="Enter property name"
  value={formData.propertyName}
  onChange={(e) => setFormData({...formData, propertyName: e.target.value})}
  error={errors.propertyName}
  helperText="A memorable identifier"
  required
/>
```

## 📖 Documentation

This project includes comprehensive documentation:

- **GETTING_STARTED.md** - Complete setup guide, component usage examples, Tailwind cheat sheet
- **PROJECT_SETUP.md** - Project structure overview and planning
- **STEP_2_SUMMARY.md** - Documentation for all base components
- **STEP_3_SUMMARY.md** - Documentation for dashboard components and setup instructions

Read these files for detailed information about:
- Component APIs and props
- Tailwind CSS class usage
- Common tasks (adding nav items, changing colors, etc.)
- Debugging tips
- Deployment options

## 🚀 Next Steps

To continue building:

1. **Test the Dashboard** - Run `npm run dev` and visit http://localhost:3000
2. **Explore Components** - Open files in `/components/` to understand the structure
3. **Read Documentation** - Check the .md files for detailed guides
4. **Build Next Page** - Create new pages using existing components
5. **Connect Data** - Replace mock data with real database when ready

## 📦 Technology Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS 3** - Utility-first CSS
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **JavaScript** - As per requirements (TypeScript optional)

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the project root for environment-specific settings:

```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Tailwind Configuration
Customize colors, spacing, typography in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'green-dark': '#0F3D2E',
        'paper': '#F7F5F0',
        // Add more colors...
      },
      // Customize more...
    },
  },
};
```

## 🐛 Troubleshooting

### "Module not found" error
- Ensure you're using the correct import path with `@/` prefix
- Check that the file exists in the specified path
- Restart the dev server

### "Port 3000 already in use"
```bash
# Use a different port
npm run dev -- -p 3001
# Visit http://localhost:3001
```

### Styles not applying
- Clear the Next.js cache: `rm -rf .next`
- Restart dev server: `npm run dev`
- Check that Tailwind classes exist in `tailwind.config.js`

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal

## 📱 Testing Responsive Design

1. Open http://localhost:3000 in your browser
2. Press **F12** to open Developer Tools
3. Click the **device/responsive icon** (or press Ctrl+Shift+M)
4. Test different device sizes:
   - iPhone SE (375px) - mobile
   - iPad (768px) - tablet
   - Desktop (1280px+) - desktop

All components should look good at all sizes.

## 🔐 Security Notes

**Currently:**
- Mock data only (no real data)
- No authentication (logged in as "Sundaram V." by default)
- No real file storage
- UI-only implementation

**Before Production:**
- Implement proper authentication
- Add real database (PostgreSQL, MongoDB, etc.)
- Encrypt sensitive data
- Use HTTPS only
- Implement proper access control
- Add input validation and sanitization

## 📄 License

This is a private project. Adapt as needed for your use case.

## 📞 Support

For issues or questions:
1. Check the error message in terminal/console
2. Review the relevant .md documentation file
3. Check Next.js/React/Tailwind official documentation
4. Review similar components for examples

## 🎉 Ready to Build?

The dashboard is complete and working. All components are reusable and documented.

**Next pages to build:**
1. Properties List
2. Documents Library
3. Search Page
4. Checklist Page
5. Forms (Add Property, Add Document)
6. Detail Pages (Property, Document)

Each page will reuse the existing components and mock data structure.

---

**Happy coding! 🚀**

For complete setup and usage instructions, see **GETTING_STARTED.md**
