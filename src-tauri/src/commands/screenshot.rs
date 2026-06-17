use base64::Engine;
use image::ImageEncoder;
use xcap::Monitor;

/// Capture the primary monitor and return it as a `data:image/png;base64,...` URL.
#[tauri::command]
pub fn capture_screen() -> Result<String, String> {
    // Find the primary monitor, falling back to the first available.
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let primary = monitors
        .iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .or_else(|| monitors.first())
        .ok_or_else(|| "no monitor found".to_string())?;

    let image = primary.capture_image().map_err(|e| e.to_string())?;

    // Encode the captured RGBA image as PNG -> base64 data URL.
    let mut buf = std::io::Cursor::new(Vec::new());
    let encoder = image::codecs::png::PngEncoder::new(&mut buf);
    encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(buf.into_inner());
    Ok(format!("data:image/png;base64,{}", b64))
}
