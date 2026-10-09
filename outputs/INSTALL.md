# LandDoc Installation Guide for Fedora Linux

This guide provides step-by-step instructions to set up the LandDoc project on your Fedora computer.

## Prerequisites

### 1. Install Node.js and npm on Fedora

Open Terminal and run:

```bash
# Update system packages
sudo dnf update -y

# Install Node.js (includes npm)
sudo dnf install nodejs -y

# Verify installation
node --version
npm --version
```

You should see version numbers (e.g., v18.x.x or higher for Node.js).

### 2. Install Additional Build Tools (Optional but Recommended)

```bash
sudo dnf install gcc g++ make python3 -y
```

## Step-by-Step Setup

### Step 1: Extract the ZIP File

```bash
# Navigate to where you downloaded the ZIP file
cd ~/Downloads

# Extract the archive
unzip landdoc-web.zip

# This creates a folder named 'outputs'
# Navigate into it
cd outputs
```

Or use your file manager:
1. Right-click on `landdoc-web.zip`
2. Select "Extract Here" or "Extract All"
3. A folder named `outputs` will be created
4. Open the terminal in that folder (right-click → "Open Terminal Here")

### Step 2: Verify Project Structure

Before installing, verify all files are present:

```bash
# List all files
ls -la

# You should see:
# - package.json
# - tailwind.config.js
# - jsconfig.json
# - next.config.js
# - README.md
# - app/ (folder)
# - components/ (folder)
# - styles/ (folder)
# - mockData.js
# - globals.css
```

### Step 3: Install Dependencies

```bash
# Make sure you're in the project directory
pwd  # Should show path ending with /outputs

# Install npm packages
npm install

# This will:
# - Download Next.js 14
# - Download React 18
# - Download Tailwind CSS 3
# - Download other dependencies
# - Create a 'node_modules' folder
# Takes 2-5 minutes depending on internet speed
```

### Step 4: Start Development Server

```bash
# Start the development server
npm run dev

# You should see output like:
# ▲ Next.js 14.0.0
# ○ Ready in 1.5s
# ○ Local: http://localhost:3000
```

### Step 5: View in Browser

Open your web browser and go to:
```
http://localhost:3000
```

You should see the **LandDoc Dashboard** home page with:
- Greeting section
- Quick action buttons
- Summary statistics cards
- Property cards with images
- Recent documents list
- Backup status

✅ **Success!** The project is running!

## Common Issues on Fedora

### Issue: "npm: command not found"
**Solution:** Node.js is not installed or not in PATH
```bash
# Reinstall Node.js
sudo dnf remove nodejs -y
sudo dnf install nodejs -y

# Restart terminal or computer
```

### Issue: "Permission denied" errors
**Solution:** Don't use `sudo` with npm
```bash
# Wrong:
sudo npm install

# Right:
npm install

# If you have permission issues, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue: "Port 3000 already in use"
**Solution:** Use a different port
```bash
npm run dev -- -p 3001

# Then visit http://localhost:3001
```

### Issue: "EACCES: permission denied" on node_modules
**Solution:** Clear cache and reinstall
```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Styles not showing / CSS not working
**Solution:** Clear Next.js cache
```bash
# Stop the server (Ctrl+C)

# Remove cache
rm -rf .next

# Restart
npm run dev
```

## Testing the Installation

### Test 1: View Dashboard
```bash
# After running 'npm run dev'
# Open browser: http://localhost:3000
# You should see the dashboard
```

### Test 2: Test Responsive Design
1. Open http://localhost:3000
2. Press F12 (or right-click → Inspect)
3. Click the device icon (top-left of DevTools)
4. Select different device sizes:
   - iPhone SE (375px) - mobile view
   - iPad (768px) - tablet view
   - Responsive (1280px) - desktop view
5. All layouts should look good

### Test 3: Test Navigation
Click these buttons (they won't navigate yet, but should work):
- "Add property" → tries to go to /properties/add
- "Add document" → tries to go to /documents/add
- Property cards → tries to navigate to /properties/[id]
- Document rows → tries to navigate to /documents/[id]

## Common Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Check for errors/warnings
npm run lint

# Format code
npm run format

# Stop the server
Ctrl + C

# View help
npm --help
```

## Folder Structure Explanation

After setup, your project folder contains:

```
outputs/
├── node_modules/              # Downloaded packages (2000+ folders, auto-created)
├── .next/                     # Build cache (auto-created)
│
├── app/                       # Pages and layouts
│   ├── layout.jsx             # Root layout (Header + Footer wrapper)
│   └── page.jsx               # Dashboard home page
│
├── components/                # React components
│   ├── common/                # Reusable UI components
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
│   ├── layout/                # Header and Footer
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   │
│   └── dashboard/             # Dashboard components
│       ├── QuickActions.jsx
│       ├── SummaryCards.jsx
│       ├── PropertyCard.jsx
│       ├── DocumentRow.jsx
│       ├── BackupStatus.jsx
│       └── index.js
│
├── styles/                    # CSS styles
│   └── globals.css            # Tailwind CSS configuration
│
├── mockData.js                # Sample data
├── tailwind.config.js         # Tailwind CSS setup
├── next.config.js             # Next.js configuration
├── jsconfig.json              # Path aliases
├── postcss.config.js          # PostCSS setup
├── package.json               # Project metadata and dependencies
├── package-lock.json          # Locked dependency versions (auto-created)
├── .gitignore                 # Git ignore rules
├── .env.example               # Environment variables template
│
├── README.md                  # Project README
├── GETTING_STARTED.md         # Usage guide
├── PROJECT_SETUP.md           # Structure overview
├── INSTALL.md                 # This file
├── STEP_2_SUMMARY.md          # Component documentation
└── STEP_3_SUMMARY.md          # Dashboard documentation
```

## Editing and Development

### Edit Dashboard
Edit `app/page.jsx` and changes appear instantly:

```bash
# The dev server watches for changes
# Save a file → Browser auto-refreshes
```

Example edit:
```jsx
// In app/page.jsx, change:
Good morning, Sundaram

// To:
Good morning, [Your Name]

// Save → Browser refreshes → Changes visible!
```

### Edit Colors
Edit `tailwind.config.js`:

```js
// Line 14-20 has colors
colors: {
  'green-dark': '#0F3D2E',  // Change this to any color
  'paper': '#F7F5F0',
}

// Save → All green buttons turn to your color!
```

## File Editing

You can edit files with any text editor:

**Recommended editors:**
- Visual Studio Code (https://code.visualstudio.com/)
  ```bash
  sudo dnf install code -y
  code .  # Opens project in VS Code
  ```
- Gedit (included with GNOME)
  ```bash
  gedit app/page.jsx
  ```
- Nano/Vim (terminal editors)
  ```bash
  nano app/page.jsx
  vim app/page.jsx
  ```

## Next Steps

After installation works:

1. **Read Documentation**
   - Read `README.md` for overview
   - Read `GETTING_STARTED.md` for usage
   - Read `STEP_3_SUMMARY.md` for component details

2. **Test Responsiveness**
   - Use browser DevTools to test mobile/tablet/desktop
   - Verify all pages look good

3. **Edit Content**
   - Change text, colors, spacing
   - Get familiar with the codebase

4. **Build Next Pages**
   - Additional pages are ready to be built
   - Use existing components as templates

## Keeping Your Project Clean

### Delete Unnecessary Files After Setup
```bash
# You can delete documentation if you prefer
rm INSTALL.md
rm GETTING_STARTED.md
rm PROJECT_SETUP.md
rm STEP_2_SUMMARY.md
rm STEP_3_SUMMARY.md

# But keep README.md as project overview
```

### Cleanup Commands
```bash
# Remove node_modules if you need space (can reinstall with npm install)
rm -rf node_modules

# Clear build cache
rm -rf .next

# Clear npm cache
npm cache clean --force
```

## Stopping and Restarting

### Stop the Server
```bash
# In the terminal where npm run dev is running
Ctrl + C

# Confirms with "y" when asked
```

### Restart the Server
```bash
npm run dev

# Opens at http://localhost:3000 again
```

## Getting Help

If you run into problems:

1. **Check the error message** - Read what it says carefully
2. **Search online** - Google the error message
3. **Check documentation** - Read the .md files in the project
4. **Restart terminal** - Sometimes fixes permission issues
5. **Reinstall dependencies** - Last resort:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## What's Next?

The project is ready for:
- ✅ Testing and exploring
- ✅ Editing components and styles
- ✅ Adding new pages
- ✅ Building additional features

**Happy coding!** 🚀

---

**For more information, see:**
- `README.md` - Project overview
- `GETTING_STARTED.md` - Usage guide and examples
- `STEP_3_SUMMARY.md` - Component documentation
