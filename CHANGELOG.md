# Changelog

All notable changes to the iDash project will be documented in this file.

## [1.2.0] - 2026-07-30
### Added
- **Apple TV 3D Parallax Effect:** Completely overhauled the hover interactions. Icons now feature a dynamic, cursor-tracking 3D tilt and shadow effect, mimicking the native tvOS experience.
- **Dynamic Background:** Updated the default wallpaper and enhanced background rendering.

### Changed
- Removed static CSS hover scaling in favor of real-time JavaScript spatial tracking.

## [1.1.0] - 2026-06
### Added
- **Automated Builds:** Implemented GitHub Actions workflow for automated Docker image building and publishing.
- **GitHub Container Registry:** Pre-built Docker images are now officially hosted on `ghcr.io`.
- **Quick Start:** Added a unified, single-command terminal block to the README for instantaneous deployment.

### Fixed
- Addressed minor file syncing issues and cleaned up `.gitignore` (removed `.DS_Store` tracks).

## [1.0.0] - 2026-06
### Added
- **Initial Release:** Launched the first version of iDash.
- **Zero-Database Architecture:** A pure front-end setup utilizing a single `data.json` file for configuration.
- **macOS Glassmorphism:** Applied Apple-inspired design principles with blurred backgrounds and sleek UI elements.
- **Core Features:** Drag-and-drop icon sorting, folder support, live calendar icons, and integrated Google search functionality.