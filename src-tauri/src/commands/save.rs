use base64::Engine;
use std::io::BufWriter;

/// Decode a `data:image/png;base64,...` URL and write it to `path` in the
/// requested format (`png` or `jpg`).
#[tauri::command]
pub fn save_image(data_url: String, path: String, format: String) -> Result<(), String> {
    let b64 = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or_else(|| "expected png data url".to_string())?;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64)
        .map_err(|e| e.to_string())?;

    let img = image::load_from_memory_with_format(&bytes, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let file = std::fs::File::create(&path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);

    let target_format = match format.as_str() {
        "png" => image::ImageFormat::Png,
        "jpg" | "jpeg" => image::ImageFormat::Jpeg,
        other => return Err(format!("unsupported format: {}", other)),
    };

    img.write_to(&mut writer, target_format).map_err(|e| e.to_string())?;
    Ok(())
}
