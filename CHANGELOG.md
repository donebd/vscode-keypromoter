# Change Log

All notable changes to the "vscode-keypromoter" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [1.1.0] - 2025.01.25

### Added

- **Smart Editor Action Detection** - NEW feature that learns from your editing patterns
  - Detects when you manually delete entire lines with Backspace and suggests shortcut
  - Detects when you copy-paste to move lines and suggests shortcuts
  - Detects when you copy-paste to duplicate lines and suggests shortcut
  - Detects repeated word selections and suggests multi-cursor shortcuts
  - Modular architecture allows easy addition of new patterns in future updates

- **Wildcard Support for Ignored Commands**
  - Use `*` to ignore entire command groups (e.g., `"git.*"` ignores all Git commands)
  - More flexible command filtering

## [1.0.5] - 2025.1.20

### Added

- **Privacy & Security enhancements**
  - Added `Key Promoter.enabled` setting to enable/disable keyboard shortcut detection
  - Added automatic pause/resume based on VS Code window focus - keyboard monitoring now only happens when VS Code is active
  - Added user notification when plugin is disabled with option to enable and reload
  - Added dynamic listener for enabled/disabled state changes
  - Added comprehensive [Privacy Policy](PRIVACY.md) documentation
  - Added security notice in README and marketplace description

### Fixed

- Addressed marketplace security concerns regarding keyboard event monitoring
- Improved transparency around keyboard event processing

## [1.0.4] - 2025.01.17

### Changed

- Minor improvements

## [1.0.3] - 2025.01.03

### Added

- Support for MacOS 14+

### Fixed

- Various stability issues

## [1.0.1] - 2023.12.10

### Fixed

- Fixed some technical issues
- Solved problems with Windows keyboard

## [1.0.0] - 2023.11.20

### Added

- Initial release
- Provide to user shortcuts on manual actions
- Provide to user group shortcuts on manual actions
- Provide to user notification with suggestion to create shortcut
- Properties which allow customize plugin behavior
- Command ignore list