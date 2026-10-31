# Upstream components

This project is an independent bridge, not an official Spelunkr or Jellyfin integration.

- Spelunkr TV publishes the lineup, manifests, platform data, and browser scheduling implementation. The setup tool downloads or reads a supported upstream app bundle locally. Generated upstream code is ignored by Git and is not distributed in this repository. No license to that upstream code is granted by this project.
- Internet Archive hosts the recordings referenced by the published manifests. Media is streamed on demand; no recordings are bundled here. Availability and permissions are determined by the upstream sources.
- Node.js and FFmpeg are separately installed runtimes with their own licenses. They are not bundled here.

Supported app bundle SHA-256:

`7e5aee341ed30670a39dc51a354d90cee9f6cb1016437e526b79c63306c5b8e8`

Minified names and extraction boundaries are specific to that build. A new build requires review and validation before updating the supported hash or adapter.
