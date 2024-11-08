# STEP Viewer

A modern web-based STEP file viewer built with React and Three.js. View the live demo at [https://step-viewer.vercel.app/](https://step-viewer.vercel.app/)

## Overview

This project provides a simple and modern interface for viewing STEP (ISO 10303) files directly in your browser. Built with modern web technologies, it offers a lightweight and efficient way to visualize 3D CAD files.

## Features

- Drag and drop file upload
- Real-time 3D visualization
- Modern, responsive interface
- Client-side file processing
- Camera controls for model inspection

## Technology Stack

- [React](https://reactjs.org/) - UI Framework
- [occt-import-js](https://github.com/kovacsv/occt-import-js) - STEP file parsing
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - Three.js React renderer
- [Drei](https://drei.pmnd.rs/) - Useful helpers for React Three Fiber
- [Vite](https://vitejs.dev/) - Build tool and development server

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Future Development

While the current implementation focuses on STEP files, the project architecture allows for easy extension to support additional 3D file formats such as:

- IGES (.iges, .igs)
- BREP (.brep)
- STL (.stl)
- OBJ (.obj)
- And more...

## Inspiration

This project was inspired by [Online 3D Viewer](https://3dviewer.net/) but takes a modern approach using React and contemporary web technologies for a more maintainable and extensible codebase.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

