// Prevents additional console window on Windows, DO NOT REMOVE!!
#![windows_subsystem = "windows"]

fn main() {
    // Configure WebView2 memory-trimming arguments (Phase 4)
    #[cfg(windows)]
    {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-features=Translate,MediaRouter --js-flags=--max-old-space-size=48",
        );
    }

    app_lib::run();
}
