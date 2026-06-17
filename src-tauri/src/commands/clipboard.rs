use base64::Engine;
use tauri::image::Image;
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Decode a `data:image/png;base64,...` URL and write the image to the system
/// clipboard as a bitmap.
#[tauri::command]
pub fn copy_image_to_clipboard(app: tauri::AppHandle, data_url: String) -> Result<(), String> {
    let b64 = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or_else(|| "expected png data url".to_string())?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64)
        .map_err(|e| e.to_string())?;

    // Tauri's clipboard Image wants raw RGBA, so decode the PNG first.
    let decoded = image::load_from_memory_with_format(&bytes, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?
        .to_rgba8();
    let (w, h) = decoded.dimensions();
    let img = Image::new_owned(decoded.into_raw(), w, h);

    app.clipboard().write_image(&img).map_err(|e| e.to_string())
}
