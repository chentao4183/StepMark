use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

pub fn trigger_screenshot<R: Runtime>(app: &AppHandle<R>) {
    if let Some(win) = app.get_webview_window("selector") {
        let _ = win.show();
        let _ = win.set_focus();
        let _ = app.emit_to("selector", "selector-start", ());
    }
}

/// Build the system-tray icon, its context menu, and event handlers.
pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let screenshot_item = MenuItem::with_id(app, "screenshot", "Screenshot (F1)", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show main window", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&screenshot_item, &show_item, &quit_item])?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "screenshot" => {
                trigger_screenshot(app);
            }
            "show" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                trigger_screenshot(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}
