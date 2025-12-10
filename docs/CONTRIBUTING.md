# 🤝 Contributing to MJRP Album Playlist Synthesizer

Thank you for your interest in contributing! This document provides guidelines and best practices for development.

---

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Git Workflow](#git-workflow)
- [Commit Conventions](#commit-conventions)
- [Branching Strategy](#branching-strategy)
- [Tagging Guidelines](#tagging-guidelines)
- [Code Style](#code-style)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Release Process](#release-process)

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** v18+ and npm
- **Firebase CLI** for deployment
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MJRP_AlbumsBalancedPlaylists_v0

# Install dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Environment Configuration

Create a `.env` file in the `server` directory:

```env
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
PORT=3001
```

### Running the Application

```bash
# Start backend server (from /server directory)
npm start

# Start frontend dev server (from root)
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

---

## 🔀 Git Workflow

### Branch Strategy

We use a feature-branch workflow:

```
main                    # Production-ready code
├── feature/*           # New features
├── fix/*              # Bug fixes
├── refactor/*         # Code refactoring
└── hotfix/*           # Production hotfixes
```

### Branch Naming

- **Features:** `feature/descriptive-name` or `feature/v2.0-foundation`
- **Fixes:** `fix/issue-description`
- **Refactors:** `refactor/v1.5-architecture`
- **Hotfixes:** `hotfix/critical-bug`

### Example Workflow

```bash
# Create a new feature branch
git checkout -b feature/albums-view-refinement

# Make changes and commit
git add .
git commit -m "feat(albums): improve card layout and spacing"

# Push to remote
git push origin feature/albums-view-refinement

# Merge to main when ready
git checkout main
git merge feature/albums-view-refinement
```

---

## 📝 Commit Conventions

We follow **Conventional Commits** for clear and structured commit messages.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(playlists): add series consolidation` |
| `fix` | Bug fix | `fix(ranking): correct track order display` |
| `refactor` | Code restructuring | `refactor(views): extract BaseView pattern` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `style` | Formatting, no code change | `style(footer): adjust spacing and alignment` |
| `test` | Adding/updating tests | `test(views): add HomeView unit tests` |
| `chore` | Maintenance tasks | `chore(deps): update npm packages` |
| `perf` | Performance improvements | `perf(api): optimize album data fetching` |
| `ci` | CI/CD changes | `ci(firebase): add preview deployment` |

### Scopes

Common scopes in our project:
- `albums`, `playlists`, `ranking`, `series`
- `ui`, `ux`, `views`, `components`
- `api`, `server`, `scraper`
- `router`, `store`, `utils`

### Examples

**Good commits:**
```bash
git commit -m "feat(footer): add Clear Cache button with inline feedback"
git commit -m "fix(logo): remove rounded cropping to prevent image cutoff"
git commit -m "refactor(padding): use directional padding for hero banner"
```

**Bad commits:**
```bash
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "updates"
```

### Multi-line Commits

For complex changes:

```bash
git commit -m "feat(sprint4): complete playlist management system

- Implement ConsolidatedRankingView
- Add series mixing functionality
- Fix rank display across all views
- Add playlist export capability

Closes #42"
```

---

## 🏷️ Tagging Guidelines

### Tag Types

We use three types of tags:

#### 1. Version Tags (Semantic Versioning)

Follow [SemVer 2.0.0](https://semver.org/): `vMAJOR.MINOR.PATCH[-SUFFIX]`

```bash
# Production releases
v1.0.0, v1.5.0, v1.6.1

# Pre-releases
v2.0.0-alpha.1, v2.0.0-beta.1, v2.0.0-rc.1
```

**When to bump:**
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

#### 2. Sprint Tags

For milestone completion:

```bash
sprint-4.5-done
sprint-5-complete
```

#### 3. Checkpoint Tags

For backups before major changes:

```bash
pre-acclaim-input-20251125
server-acclaim-20251125-1511
backup-before-refactor
```

### Creating Tags

```bash
# Lightweight tag
git tag sprint-4.5-done

# Annotated tag (recommended for releases)
git tag -a v2.0.0 -m "Release v2.0.0: Production ready"

# Push tags to remote
git push origin --tags
```

### Tag Naming Conventions (always add timestamp to the tag names)

| Pattern | Example | Usage |
|---------|---------|-------|
| `vX.Y.Z` | `v1.5.0` | Official releases |
| `vX.Y.Z-suffix` | `v2.0.0-alpha.4` | Pre-releases |
| `sprint-X.Y-done` | `sprint-4.5-done` | Sprint milestones |
| `pre-*` | `pre-acclaim-input-20251125` | Checkpoints |
| `backup-*` | `backup-before-merge` | Safety backups |

---

## 🎨 Code Style

### JavaScript/ES6+

- Use ES6 modules (`import`/`export`)
- Prefer `const` and `let` over `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate

```javascript
// Good
import { BaseView } from './BaseView.js'

export class HomeView extends BaseView {
  async render(params) {
    const { series } = this.state
    return `<div>${series.map(s => s.name).join(', ')}</div>`
  }
}

// Avoid
var HomeView = require('./HomeView')
var series = this.state.series
return '<div>' + series.map(function(s) { return s.name }).join(', ') + '</div>'
```

### HTML/Templating

- Use semantic HTML5 elements
- Add `data-*` attributes for JavaScript hooks
- Use Tailwind CSS utility classes
- Follow BEM naming for custom CSS

```html
<!-- Good -->
<article class="series-card glass-panel" data-series-id="${id}">
  <h3 class="text-lg font-bold">${name}</h3>
</article>

<!-- Avoid -->
<div class="card" id="series_${id}">
  <div class="title">${name}</div>
</div>
```

### CSS/Tailwind

- Prefer Tailwind utilities over custom CSS
- Use design system tokens (colors, spacing)
- Group related utilities logically

```html
<!-- Good: Grouped by purpose -->
<div class="
  flex items-center gap-3
  px-4 py-2
  bg-white/10 backdrop-blur-md
  rounded-xl border border-white/10
  hover:scale-105 transition-transform
">

<!-- Avoid: Random order -->
<div class="bg-white/10 flex rounded-xl hover:scale-105 px-4 gap-3 border py-2 items-center">
```

---

## 📁 Project Structure

```
MJRP_AlbumsBalancedPlaylists_v0/
├── public/                    # Frontend files
│   ├── index-v2.html         # Main HTML entry
│   ├── assets/               # Images, SVGs, static files
│   └── js/
│       ├── views/            # View components (HomeView, AlbumsView, etc.)
│       ├── components/       # Reusable components (TopNav, Footer, Icons)
│       ├── stores/           # State management (series.js)
│       ├── utils/            # Utilities (SvgGenerator, etc.)
│       └── router.js         # Client-side routing
├── server/                   # Backend API
│   ├── server.js            # Express server
│   ├── controllers/         # Route handlers
│   ├── services/            # Business logic
│   └── utils/               # Server utilities
├── test/                    # Test files
├── scripts/                 # Build/utility scripts
└── docs/                    # Documentation
```

### View Pattern (BaseView)

All views extend `BaseView`:

```javascript
import { BaseView } from './BaseView.js'

export class MyView extends BaseView {
  async render(params) {
    return `<div>HTML content</div>`
  }
  
  async mount(params) {
    // Setup event listeners, subscriptions
  }
  
  unmount() {
    // Cleanup
    super.unmount()
  }
}
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- HomeView.test.js

# Run with coverage
npm run test:coverage
```

### Writing Tests

Place tests in `/test` directory:

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals'
import { HomeView } from '../public/js/views/HomeView.js'

describe('HomeView', () => {
  let view
  
  beforeEach(() => {
    view = new HomeView()
  })
  
  it('should render empty state when no series exist', async () => {
    const html = await view.render({})
    expect(html).toContain('No series created yet')
  })
})
```

---

## 🚀 Release Process

### 1. Prepare Release

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Run tests
npm test

# Build for production (if applicable)
npm run build
```

### 2. Update Version

Update `package.json` version:
```json
{
  "version": "2.0.0"
}
```

### 3. Create Release Commit

```bash
git add package.json
git commit -m "chore(release): bump version to 2.0.0"
```

### 4. Create Tag

```bash
git tag -a v2.0.0 -m "Release v2.0.0: Production ready

- Feature X complete
- Performance improvements
- Bug fixes"
```

### 5. Push Changes

```bash
git push origin main
git push origin --tags
```

### 6. Deploy

```bash
# Deploy to Firebase (if applicable)
firebase deploy
```

### 7. Document Release

Update `RELEASE.md` with release notes.

---

## 🐛 Reporting Issues

When reporting bugs, please include:

1. **Description:** What happened vs. what you expected
2. **Steps to reproduce:** Numbered list of actions
3. **Environment:** Browser, OS, Node version
4. **Screenshots:** If applicable
5. **Logs:** Console errors or server logs

---

## 💡 Best Practices

### Do's ✅

- Write descriptive commit messages
- Keep PRs focused and small
- Add comments for complex logic
- Update documentation when changing APIs
- Test your changes before committing
- Use meaningful variable names

### Don'ts ❌

- Don't commit directly to `main` (use branches)
- Don't commit secrets or API keys
- Don't commit generated files (build artifacts)
- Don't mix refactoring with feature changes
- Don't skip testing

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## 🙋 Questions?

If you have questions about contributing:

1. Check existing documentation
2. Review past commits and PRs
3. Ask in project discussions
4. Reach out to maintainers

---

**Happy Coding!** 🎉

---

*Last Updated: 2025-11-28*
