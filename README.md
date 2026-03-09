# 3D Building Viewer

Interactive 3D building visualization with clickable markers that trigger video playback. Built with React, Three.js, and modern web technologies.

## Features

- **3D Model Viewer** - Interactive building model with orbit controls
- **Clickable Markers** - Pulsing, glowing markers on points of interest
- **Video Integration** - Click markers to play corresponding videos
- **Smooth Animations** - Spring-based 3D animations and Framer Motion transitions
- **Auto-Rotate Camera** - Slowly rotates when idle, stops on interaction
- **Keyboard Navigation** - Use arrow keys to navigate between markers
- **Responsive Design** - Stacks vertically on mobile, side-by-side on desktop
- **Error Boundaries** - Graceful error handling with retry option

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **3D Rendering**: Three.js + React Three Fiber + @react-three/drei
- **Animations**: Framer Motion + @react-spring/three
- **State Management**: Zustand
- **Styling**: TailwindCSS

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd 3d-building-viewer

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Add Your Content

1. **3D Model**: Place your GLB file at `public/models/building.glb`
2. **Videos**: Add videos to `public/videos/` (lobby.mp4, office.mp4, rooftop.mp4)

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |

## Project Structure

```
src/
├── components/
│   ├── Scene/           # 3D components
│   │   ├── BuildingModel.tsx
│   │   ├── Marker.tsx
│   │   ├── Markers.tsx
│   │   └── Scene.tsx
│   ├── UI/              # UI components
│   │   ├── LoadingScreen.tsx
│   │   └── VideoPlayer.tsx
│   ├── Layout/          # Layout components
│   │   └── SplitView.tsx
│   └── ErrorBoundary.tsx
├── hooks/
│   └── useKeyboardNavigation.ts
├── store/
│   └── useStore.ts      # Zustand store
├── config/
│   └── buildingConfig.ts # Marker configuration
├── App.tsx
└── main.tsx

public/
├── models/              # GLB model files
└── videos/              # Video files
```

## Configuration

Edit `src/config/buildingConfig.ts` to customize markers:

```typescript
export const buildingConfig = {
  markers: [
    {
      id: 'lobby',
      title: 'Main Lobby',
      description: 'Description shown in video panel',
      position: [0, 1, 2],  // 3D coordinates
      videoUrl: '/videos/lobby.mp4',
    },
    // Add more markers...
  ]
}
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `→` / `↓` | Next marker |
| `←` / `↑` | Previous marker |
| `Escape` | Deselect marker |

## Performance

- Canvas DPR limited to [1, 2] for consistent performance
- Performance mode allows frame dropping under load
- Model preloading for faster initial display

## Browser Support

Modern browsers with WebGL support:
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT
# Sacred-Viewer
