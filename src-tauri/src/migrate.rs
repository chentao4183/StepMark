//! One-time migrations from the pre-rename build (SnapNote → StepMark).
//!
//! On Windows, `tauri-plugin-autostart` registers the launch-at-login entry
//! under `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` keyed by the
//! bundle identifier. Renaming the app changed the identifier from
//! `com.snapnote.app` to `com.stepmark.app`, so the old entry would be left
//! behind. This module removes the stale key on startup.

/// Bundle identifier used by the pre-rename build.
const LEGACY_IDENTIFIER: &str = "com.snapnote.app";

/// Remove the legacy autostart registry entry, if present.
///
/// Best-effort: errors are logged but never propagated, since leaving the
/// stale key behind only causes a harmless duplicate launch entry at worst.
#[cfg(windows)]
pub fn cleanup_legacy_autostart() {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_path = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
    let Ok(run_key) = hkcu.open_subkey_with_flags(run_path, winreg::enums::KEY_SET_VALUE) else {
        return;
    };
    match run_key.delete_value(LEGACY_IDENTIFIER) {
        Ok(()) => eprintln!("removed legacy autostart entry '{}'", LEGACY_IDENTIFIER),
        Err(ref e) if e.kind() == std::io::ErrorKind::NotFound => {
            // Nothing to migrate — most users never enabled autostart.
        }
        Err(e) => eprintln!("failed to remove legacy autostart entry: {}", e),
    }
}

/// No-op on non-Windows targets (this product is Windows-only, but keep the
/// call site platform-agnostic).
#[cfg(not(windows))]
pub fn cleanup_legacy_autostart() {}
