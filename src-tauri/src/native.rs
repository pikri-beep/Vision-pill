//! Native Win32 helpers for the Quick Pill Tauri build.
//!
//! Everything in here is plain Win32 / WinRT work that has no Tauri specific
//! API, so it stays out of `lib.rs` and can be unit tested in isolation.

use serde::Serialize;
use std::collections::HashMap;
use std::ffi::c_void;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Arc, Condvar, Mutex};
use std::time::{Duration, Instant};

// ==================================================================
// Small helpers
// ==================================================================

/// Convert a Rust string into a NUL terminated UTF-16 buffer.
pub fn to_wide(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Read a UTF-16 buffer (without the trailing NUL) into a String.
pub fn from_wide(buffer: &[u16]) -> String {
    let end = buffer.iter().position(|c| *c == 0).unwrap_or(buffer.len());
    String::from_utf16_lossy(&buffer[..end])
}

/// Expand a path that may contain environment variables such as `%APPDATA%`.
pub fn expand_env(value: &str) -> PathBuf {
    let expanded = if value.starts_with('%') && value.ends_with('%') && value.len() > 2 {
        let name = &value[1..value.len() - 1];
        std::env::var(name).unwrap_or_else(|_| value.to_string())
    } else {
        value.to_string()
    };
    PathBuf::from(expanded)
}

// ==================================================================
// Click-through via WM_NCHITTEST
// ==================================================================
//
// `WebviewWindow::set_ignore_cursor_events(true)` makes tao add
// `WS_EX_LAYERED` to the window. A layered window cannot be composited by
// WebView2 (DirectComposition), so the whole notch disappears. Instead we
// subclass the window procedure and answer `WM_NCHITTEST` with
// `HTTRANSPARENT` whenever the cursor is outside the island hit-box - the
// window keeps its normal (non layered) style and therefore keeps painting.

use std::sync::atomic::{AtomicI32, AtomicPtr, Ordering};

/// Screen coordinates of the interactive hit-box: left, top, right, bottom.
static HITBOX: [AtomicI32; 4] = [
    AtomicI32::new(i32::MIN),
    AtomicI32::new(i32::MIN),
    AtomicI32::new(i32::MIN),
    AtomicI32::new(i32::MIN),
];

/// The window procedure that was installed before we took over.
static ORIGINAL_WNDPROC: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());

/// Whole-window click-through (Ctrl-hover mode). Unlike
/// `set_ignore_cursor_events` this keeps the window non-layered, so the notch
/// keeps rendering while every click falls through to the app underneath.
static IGNORE_CURSOR: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

pub fn set_ignore_cursor(ignore: bool) {
    IGNORE_CURSOR.store(ignore, Ordering::Relaxed);
}

/// Update the interactive hit-box (screen coordinates, physical pixels).
pub fn set_hitbox(left: i32, top: i32, right: i32, bottom: i32) {
    HITBOX[0].store(left, Ordering::Relaxed);
    HITBOX[1].store(top, Ordering::Relaxed);
    HITBOX[2].store(right, Ordering::Relaxed);
    HITBOX[3].store(bottom, Ordering::Relaxed);
}

/// Is the given screen point inside the interactive hit-box?
pub fn hitbox_contains(x: i32, y: i32) -> bool {
    let left = HITBOX[0].load(Ordering::Relaxed);
    let top = HITBOX[1].load(Ordering::Relaxed);
    let right = HITBOX[2].load(Ordering::Relaxed);
    let bottom = HITBOX[3].load(Ordering::Relaxed);
    if left == i32::MIN {
        return false;
    }
    x >= left && x <= right && y >= top && y <= bottom
}

#[cfg(windows)]
unsafe extern "system" fn notch_window_proc(
    hwnd: windows::Win32::Foundation::HWND,
    message: u32,
    wparam: windows::Win32::Foundation::WPARAM,
    lparam: windows::Win32::Foundation::LPARAM,
) -> windows::Win32::Foundation::LRESULT {
    use windows::Win32::Foundation::LRESULT;
    use windows::Win32::UI::WindowsAndMessaging::{DefWindowProcW, WM_NCHITTEST};

    if message == WM_NCHITTEST {
        // Ctrl-hover click-through: every pixel belongs to the app underneath.
        if IGNORE_CURSOR.load(Ordering::Relaxed) {
            return LRESULT(-1isize);
        }
        // The hit-test coordinates are packed into lparam as signed shorts.
        let x = (lparam.0 & 0xFFFF) as i16 as i32;
        let y = ((lparam.0 >> 16) & 0xFFFF) as i16 as i32;
        if !hitbox_contains(x, y) {
            // HTTRANSPARENT -> the click goes to the window underneath.
            return LRESULT(-1isize);
        }
    }

    let original = ORIGINAL_WNDPROC.load(Ordering::Relaxed);
    if original.is_null() {
        return unsafe { DefWindowProcW(hwnd, message, wparam, lparam) };
    }
    type WndProc = unsafe extern "system" fn(
        windows::Win32::Foundation::HWND,
        u32,
        windows::Win32::Foundation::WPARAM,
        windows::Win32::Foundation::LPARAM,
    ) -> windows::Win32::Foundation::LRESULT;
    let original: WndProc = unsafe { std::mem::transmute(original) };
    unsafe {
        windows::Win32::UI::WindowsAndMessaging::CallWindowProcW(
            Some(original),
            hwnd,
            message,
            wparam,
            lparam,
        )
    }
}

#[cfg(windows)]
static MAIN_HWND: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());

#[cfg(windows)]
pub fn set_main_hwnd(hwnd: windows::Win32::Foundation::HWND) {
    MAIN_HWND.store(hwnd.0, Ordering::Relaxed);
}

#[cfg(windows)]
pub fn get_main_hwnd() -> Option<windows::Win32::Foundation::HWND> {
    let ptr = MAIN_HWND.load(Ordering::Relaxed);
    if ptr.is_null() {
        None
    } else {
        Some(windows::Win32::Foundation::HWND(ptr))
    }
}

#[cfg(windows)]
unsafe extern "system" fn set_child_transparent_proc(
    child: windows::Win32::Foundation::HWND,
    lparam: windows::Win32::Foundation::LPARAM,
) -> windows::Win32::Foundation::BOOL {
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_TRANSPARENT,
    };
    let enable = lparam.0 != 0;
    let current = GetWindowLongPtrW(child, GWL_EXSTYLE) as u32;
    let new_style = if enable {
        current | WS_EX_TRANSPARENT.0
    } else {
        current & !WS_EX_TRANSPARENT.0
    };
    if current != new_style {
        SetWindowLongPtrW(child, GWL_EXSTYLE, new_style as isize);
    }
    windows::Win32::Foundation::BOOL(1)
}

#[cfg(windows)]
pub fn set_window_click_through(hwnd: windows::Win32::Foundation::HWND, enable: bool) {
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumChildWindows, GetWindowLongPtrW, SetWindowLongPtrW, GWL_EXSTYLE, WS_EX_TRANSPARENT,
    };

    unsafe {
        let current = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
        let new_style = if enable {
            current | WS_EX_TRANSPARENT.0
        } else {
            current & !WS_EX_TRANSPARENT.0
        };
        if current != new_style {
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, new_style as isize);
        }

        let _ = EnumChildWindows(
            hwnd,
            Some(set_child_transparent_proc),
            windows::Win32::Foundation::LPARAM(if enable { 1 } else { 0 }),
        );
    }
}

#[cfg(not(windows))]
pub fn set_window_click_through(_hwnd: (), _enable: bool) {}

/// Install the click-through window procedure on the given window.
#[cfg(windows)]
pub fn install_click_through(hwnd: windows::Win32::Foundation::HWND) -> bool {
    use windows::Win32::UI::WindowsAndMessaging::{SetWindowLongPtrW, GWLP_WNDPROC};

    set_main_hwnd(hwnd);
    unsafe {
        let previous = SetWindowLongPtrW(hwnd, GWLP_WNDPROC, notch_window_proc as *mut c_void as isize);
        if previous == 0 {
            return false;
        }
        ORIGINAL_WNDPROC.store(previous as *mut c_void, Ordering::Relaxed);
    }
    true
}

#[cfg(not(windows))]
pub fn install_click_through(_hwnd: ()) -> bool {
    false
}


// ==================================================================
// Running windows (App Launcher -> "running windows" panel)
// ==================================================================

#[derive(Serialize, Clone, Debug, Default)]
pub struct RunningWindow {
    pub hwnd: isize,
    pub title: String,
    pub process_name: String,
    pub process_path: String,
    pub pid: u32,
}

#[cfg(windows)]
fn process_path_for_pid(pid: u32) -> String {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::core::PWSTR;

    unsafe {
        let handle = match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            Ok(h) => h,
            Err(_) => return String::new(),
        };
        let mut buffer = [0u16; 1024];
        let mut size = buffer.len() as u32;
        let result = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_FORMAT(0),
            PWSTR(buffer.as_mut_ptr()),
            &mut size,
        );
        let _ = CloseHandle(handle);
        if result.is_ok() {
            from_wide(&buffer)
        } else {
            String::new()
        }
    }
}

#[cfg(windows)]
unsafe extern "system" fn enum_windows_proc(hwnd: windows::Win32::Foundation::HWND, lparam: windows::Win32::Foundation::LPARAM) -> windows::Win32::Foundation::BOOL {
    use windows::Win32::Foundation::BOOL;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClassNameW, GetWindowTextW, IsWindowVisible,
    };

    if lparam.0 == 0 {
        return BOOL(0);
    }
    let out = &mut *(lparam.0 as *mut Vec<RunningWindow>);

    let mut title_buf = [0u16; 512];
    let title_len = GetWindowTextW(hwnd, &mut title_buf);
    if title_len <= 0 {
        return BOOL(1);
    }
    let mut class_buf = [0u16; 256];
    let class_len = GetClassNameW(hwnd, &mut class_buf);
    let class_name = from_wide(&class_buf[..class_len.max(0) as usize]);

    // Skip invisible helper windows and the shell surface.
    if !IsWindowVisible(hwnd).as_bool() {
        return BOOL(1);
    }
    if class_name == "Progman" || class_name == "WorkerW" || class_name == "Shell_TrayWnd" {
        return BOOL(1);
    }

    let mut pid: u32 = 0;
    windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId(hwnd, Some(&mut pid));

    let title = from_wide(&title_buf[..title_len as usize]);
    let path = process_path_for_pid(pid);
    let process_name = Path::new(&path)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();

    out.push(RunningWindow {
        hwnd: hwnd.0 as isize,
        title,
        process_name,
        process_path: path,
        pid,
    });
    BOOL(1)
}

/// Enumerate every visible top level window.
pub fn list_running_windows() -> Vec<RunningWindow> {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::LPARAM;
        use windows::Win32::UI::WindowsAndMessaging::EnumWindows;

        let mut windows_found: Vec<RunningWindow> = Vec::new();
        unsafe {
            let _ = EnumWindows(
                Some(enum_windows_proc),
                LPARAM(&mut windows_found as *mut Vec<RunningWindow> as isize),
            );
        }
        windows_found
    }
    #[cfg(not(windows))]
    {
        Vec::new()
    }
}

/// Bring a window to the foreground.
pub fn activate_window(hwnd: isize) -> bool {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::UI::WindowsAndMessaging::{SetForegroundWindow, ShowWindow, SW_RESTORE};

        unsafe {
            let handle = HWND(hwnd as *mut c_void);
            let _ = ShowWindow(handle, SW_RESTORE);
            SetForegroundWindow(handle).as_bool()
        }
    }
    #[cfg(not(windows))]
    {
        let _ = hwnd;
        false
    }
}

// ==================================================================
// File icons (File Shelf) -> base64 BMP data URL
// ==================================================================

#[cfg(windows)]
fn to_bmp_bytes(hicon: windows::Win32::UI::WindowsAndMessaging::HICON) -> Option<Vec<u8>> {
    use std::mem::size_of;
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleBitmap, CreateCompatibleDC, DeleteObject, GetDIBits, GetDC, GetObjectW,
        ReleaseDC, SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
        HGDIOBJ,
    };
    use windows::Win32::UI::WindowsAndMessaging::{DrawIconEx, DI_NORMAL};

    unsafe {
        let mut bitmap = BITMAP::default();
        if GetObjectW(
            HGDIOBJ(hicon.0),
            size_of::<BITMAP>() as i32,
            Some(&mut bitmap as *mut BITMAP as *mut c_void),
        ) == 0
        {
            return None;
        }

        let width = bitmap.bmWidth.max(16);
        let height = bitmap.bmHeight.abs().max(16);

        let screen_dc = GetDC(None);
        if screen_dc.is_invalid() {
            return None;
        }
        let memory_dc = CreateCompatibleDC(screen_dc);
        let compatible = CreateCompatibleBitmap(screen_dc, width, height);
        let previous = SelectObject(memory_dc, HGDIOBJ(compatible.0));

        // Draw the icon into the memory bitmap so we can read raw pixels.
        let _ = DrawIconEx(
            memory_dc,
            0,
            0,
            hicon,
            width,
            height,
            0,
            None,
            DI_NORMAL,
        );

        let mut info = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width,
                biHeight: -height, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let stride = (width as usize) * 4;
        let mut pixels = vec![0u8; stride * height as usize];
        let lines = GetDIBits(
            memory_dc,
            compatible,
            0,
            height as u32,
            Some(pixels.as_mut_ptr() as *mut c_void),
            &mut info,
            DIB_RGB_COLORS,
        );

        let _ = SelectObject(memory_dc, previous);
        let _ = DeleteObject(HGDIOBJ(compatible.0));
        let _ = DeleteObject(HGDIOBJ(memory_dc.0));
        let _ = ReleaseDC(None, screen_dc);

        if lines == 0 {
            return None;
        }

        // Assemble a BMP file (BITMAPFILEHEADER + BITMAPINFOHEADER + pixels).
        let header_size = 14usize;
        let info_size = size_of::<BITMAPINFOHEADER>() as usize;
        let pixel_offset = header_size + info_size;
        let image_size = pixels.len();
        let file_size = pixel_offset + image_size;

        let mut out = Vec::with_capacity(file_size);
        out.extend_from_slice(b"BM");
        out.extend_from_slice(&(file_size as u32).to_le_bytes());
        out.extend_from_slice(&0u32.to_le_bytes());
        out.extend_from_slice(&(pixel_offset as u32).to_le_bytes());

        out.extend_from_slice(&(info_size as u32).to_le_bytes());
        out.extend_from_slice(&(width as i32).to_le_bytes());
        out.extend_from_slice(&(-(height as i32)).to_le_bytes());
        out.extend_from_slice(&1u16.to_le_bytes());
        out.extend_from_slice(&32u16.to_le_bytes());
        out.extend_from_slice(&0u32.to_le_bytes()); // BI_RGB
        out.extend_from_slice(&(image_size as u32).to_le_bytes());
        out.extend_from_slice(&0i32.to_le_bytes());
        out.extend_from_slice(&0i32.to_le_bytes());
        out.extend_from_slice(&0u32.to_le_bytes());
        out.extend_from_slice(&0u32.to_le_bytes());

        out.extend_from_slice(&pixels);
        Some(out)
    }
}

/// Extract the shell icon of a file and return it as a `data:image/bmp;base64,…` URL.
pub fn file_icon_data_url(path: &str) -> Option<String> {
    #[cfg(windows)]
    {
        use base64::Engine;
        use std::mem::size_of;
        use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
        use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_SMALLICON};

        let wide = to_wide(path);
        let mut info = SHFILEINFOW::default();
        unsafe {
            let result = SHGetFileInfoW(
                windows::core::PCWSTR(wide.as_ptr()),
                FILE_FLAGS_AND_ATTRIBUTES(0),
                Some(&mut info),
                size_of::<SHFILEINFOW>() as u32,
                SHGFI_ICON | SHGFI_SMALLICON,
            );
            if result == 0 || info.hIcon.is_invalid() {
                return None;
            }
            let bytes = to_bmp_bytes(info.hIcon);
            let _ = windows::Win32::UI::WindowsAndMessaging::DestroyIcon(info.hIcon);
            let bytes = bytes?;            let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
            Some(format!("data:image/bmp;base64,{}", encoded))
        }
    }
    #[cfg(not(windows))]
    {
        let _ = path;
        None
    }
}

// ==================================================================
// Clipboard: copy files as CF_HDROP (paste into Explorer / WhatsApp)
// ==================================================================

/// Put a list of files on the clipboard using the CF_HDROP format so they can
/// be pasted straight into Explorer, WhatsApp Desktop, Word, …
pub fn copy_files_to_clipboard(paths: &[String]) -> bool {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::{HANDLE, HWND};
        use windows::Win32::System::Ole::CF_HDROP;
        use windows::Win32::System::DataExchange::{
            CloseClipboard, EmptyClipboard, OpenClipboard, SetClipboardData,
        };
        use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};

        if paths.is_empty() {
            return false;
        }

        // DROPFILES header (20 bytes) followed by the double NUL terminated list.
        let mut data: Vec<u16> = Vec::new();
        data.extend_from_slice(&[0u16; 10]);
        for path in paths {
            data.extend(path.encode_utf16());
            data.push(0);
        }
        data.push(0);
        // pFiles = offset from the start of DROPFILES to the file list.
        data[0] = 20;

        let byte_len = data.len() * 2;
        unsafe {
            if OpenClipboard(HWND(std::ptr::null_mut())).is_err() {
                return false;
            }
            let _ = EmptyClipboard();
            let handle = match GlobalAlloc(GMEM_MOVEABLE, byte_len) {
                Ok(h) => h,
                Err(_) => {
                    let _ = CloseClipboard();
                    return false;
                }
            };
            let ptr = GlobalLock(handle);
            if ptr.is_null() {
                let _ = CloseClipboard();
                return false;
            }
            std::ptr::copy_nonoverlapping(data.as_ptr() as *const u8, ptr as *mut u8, byte_len);
            let _ = GlobalUnlock(handle);
            let ok = SetClipboardData(CF_HDROP.0 as u32, HANDLE(handle.0)).is_ok();
            let _ = CloseClipboard();
            ok
        }
    }
    #[cfg(not(windows))]
    {
        let _ = paths;
        false
    }
}

// ==================================================================
// Global hotkeys
// ==================================================================

/// Result of parsing an accelerator such as `Alt+Shift+D`.
pub struct ParsedHotkey {
    pub modifiers: u32,
    pub virtual_key: u32,
}

/// Translate an accelerator string into Win32 modifier flags + virtual key.
pub fn parse_accelerator(accel: &str) -> Option<ParsedHotkey> {
    const MOD_ALT: u32 = 0x0001;
    const MOD_CONTROL: u32 = 0x0002;
    const MOD_SHIFT: u32 = 0x0004;
    const MOD_WIN: u32 = 0x0008;

    let mut modifiers = 0u32;
    let mut key: Option<String> = None;

    for part in accel.split('+') {
        let token = part.trim();
        if token.is_empty() {
            continue;
        }
        match token.to_ascii_uppercase().as_str() {
            "ALT" | "OPTION" => modifiers |= MOD_ALT,
            "CTRL" | "CONTROL" => modifiers |= MOD_CONTROL,
            "SHIFT" => modifiers |= MOD_SHIFT,
            "WIN" | "SUPER" | "META" => modifiers |= MOD_WIN,
            other => key = Some(other.to_string()),
        }
    }

    let key = key?;
    let virtual_key = if key.len() == 1 {
        let ch = key.chars().next()?;
        if ch.is_ascii_alphabetic() {
            ch.to_ascii_uppercase() as u32
        } else if ch.is_ascii_digit() {
            ch as u32
        } else {
            return None;
        }
    } else if let Ok(number) = key.parse::<u32>() {
        // F1 - F24
        if (1..=24).contains(&number) {
            0x6F + number
        } else {
            return None;
        }
    } else {
        return None;
    };

    Some(ParsedHotkey {
        modifiers,
        virtual_key,
    })
}

/// The most recent shortcut map. A hotkey reload replaces this instead of
/// spawning a second registration thread (a second `RegisterHotKey` for the
/// same key fails, which used to leave the old hotkeys alive).
static HOTKEY_MAP: std::sync::Mutex<Option<HashMap<String, String>>> = std::sync::Mutex::new(None);
static HOTKEY_THREAD_ID: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);
const WM_APP_RELOAD_HOTKEYS: u32 = 0x8000 + 1;

/// Register the global hotkeys and call `emit(key)` whenever one fires.
/// The callback runs on a dedicated thread, therefore it must be `Send`.
pub fn spawn_hotkey_thread(
    shortcuts: HashMap<String, String>,
    emit: Arc<dyn Fn(String) + Send + Sync>,
) {
    *HOTKEY_MAP.lock().unwrap() = Some(shortcuts);

    // The thread is already running: ask it to un/re-register in place.
    let existing = HOTKEY_THREAD_ID.load(Ordering::Relaxed);
    if existing != 0 {
        #[cfg(windows)]
        unsafe {
            use windows::Win32::Foundation::{LPARAM, WPARAM};
            use windows::Win32::UI::WindowsAndMessaging::PostThreadMessageW;
            let _ = PostThreadMessageW(existing, WM_APP_RELOAD_HOTKEYS, WPARAM(0), LPARAM(0));
        }
        return;
    }

    std::thread::spawn(move || {
        #[cfg(windows)]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::System::Threading::GetCurrentThreadId;
            use windows::Win32::UI::Input::KeyboardAndMouse::{
                RegisterHotKey, UnregisterHotKey, HOT_KEY_MODIFIERS,
            };
            use windows::Win32::UI::WindowsAndMessaging::{GetMessageW, MSG, WM_HOTKEY};

            unsafe {
                HOTKEY_THREAD_ID.store(GetCurrentThreadId(), Ordering::Relaxed);
            }

            let mut registered: Vec<(i32, String)> = Vec::new();

            let apply = |registered: &mut Vec<(i32, String)>| {
                for (id, _) in registered.drain(..) {
                    unsafe {
                        let _ = UnregisterHotKey(HWND(std::ptr::null_mut()), id);
                    }
                }
                let map = HOTKEY_MAP.lock().unwrap().clone().unwrap_or_default();
                for (key, accel) in map.iter() {
                    // Ctrl is reserved for the click-through mode (Electron parity).
                    if accel.to_ascii_uppercase().contains("CTRL") {
                        continue;
                    }
                    let Some(parsed) = parse_accelerator(accel) else {
                        continue;
                    };
                    let id = registered.len() as i32 + 1;
                    let result = unsafe {
                        RegisterHotKey(
                            HWND(std::ptr::null_mut()),
                            id,
                            HOT_KEY_MODIFIERS(parsed.modifiers),
                            parsed.virtual_key,
                        )
                    };
                    if result.is_ok() {
                        registered.push((id, key.clone()));
                    }
                }
            };

            apply(&mut registered);

            let mut message = MSG::default();
            loop {
                let status = unsafe {
                    GetMessageW(&mut message, HWND(std::ptr::null_mut()), 0, 0)
                };
                if status.0 <= 0 {
                    break;
                }
                if message.message == WM_HOTKEY {
                    let id = message.wParam.0 as i32;
                    if let Some((_, key)) = registered.iter().find(|(rid, _)| *rid == id) {
                        emit(key.clone());
                    }
                } else if message.message == WM_APP_RELOAD_HOTKEYS {
                    apply(&mut registered);
                }
            }
        }
        #[cfg(not(windows))]
        {
            let _ = emit;
        }
    });
}

// ==================================================================
// Audio mixer helper (audio-helper.exe over NDJSON stdio)
// ==================================================================

struct AudioState {
    child: Option<Child>,
    stdin: Option<ChildStdin>,
    next_id: i64,
}

/// Talks to the native `audio-helper.exe` (the very same binary the Electron
/// build ships) using newline delimited JSON over stdin/stdout.
pub struct AudioHelper {
    state: Mutex<AudioState>,
    responses: Arc<Mutex<HashMap<i64, serde_json::Value>>>,
    signal: Arc<Condvar>,
}

impl Default for AudioHelper {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioHelper {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(AudioState {
                child: None,
                stdin: None,
                next_id: 0,
            }),
            responses: Arc::new(Mutex::new(HashMap::new())),
            signal: Arc::new(Condvar::new()),
        }
    }

    /// Locate `audio-helper.exe` next to the executable or in the resources.
    pub fn helper_path(&self) -> Option<PathBuf> {
        let mut candidates: Vec<PathBuf> = Vec::new();
        if let Ok(exe) = std::env::current_exe() {
            if let Some(dir) = exe.parent() {
                candidates.push(dir.join("audio-helper.exe"));
                candidates.push(dir.join("native").join("bin").join("audio-helper.exe"));
                candidates.push(dir.join("resources").join("audio-helper.exe"));
            }
        }
        if let Ok(cwd) = std::env::current_dir() {
            candidates.push(cwd.join("native").join("bin").join("audio-helper.exe"));
            candidates.push(cwd.join("audio-helper.exe"));
        }
        candidates.into_iter().find(|p| p.exists())
    }

    fn ensure_started(&self) -> bool {
        let mut state = self.state.lock().unwrap();
        if let Some(child) = state.child.as_mut() {
            if child.try_wait().ok().flatten().is_none() && state.stdin.is_some() {
                return true;
            }
        }

        let Some(path) = self.helper_path() else {
            return false;
        };

        let spawn_result = Command::new(path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn();

        let Ok(mut child) = spawn_result else {
            return false;
        };
        let Some(stdout) = child.stdout.take() else {
            return false;
        };
        let Some(stdin) = child.stdin.take() else {
            return false;
        };

        state.child = Some(child);
        state.stdin = Some(stdin);

        // Reader thread: parse the NDJSON answers and fulfil the pending calls.
        let responses = self.responses.clone();
        let signal = self.signal.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                let Ok(line) = line else { break };
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) else {
                    continue;
                };
                let Some(id) = value.get("id").and_then(|v| v.as_i64()) else {
                    continue;
                };
                {
                    let mut guard = responses.lock().unwrap();
                    guard.insert(id, value);
                }
                signal.notify_all();
            }
        });

        true
    }

    /// Send a command to the helper and wait for its answer.
    pub fn send(&self, cmd: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
        if !self.ensure_started() {
            return Err("audio-helper.exe is not available".into());
        }

        let mut payload = params;
        if let Some(map) = payload.as_object_mut() {
            map.insert("cmd".into(), serde_json::json!(cmd));
        } else {
            payload = serde_json::json!({ "cmd": cmd });
        }

        // The request is written while the lock is held so the helper cannot
        // interleave two requests.
        let id = {
            let mut state = self.state.lock().unwrap();
            state.next_id += 1;
            let id = state.next_id;
            payload["id"] = serde_json::json!(id);

            let mut line = serde_json::to_string(&payload).unwrap_or_default();
            line.push('\n');
            let stdin = state.stdin.as_mut().ok_or("audio helper stdin closed")?;
            stdin
                .write_all(line.as_bytes())
                .map_err(|e| format!("audio helper write failed: {}", e))?;
            stdin
                .flush()
                .map_err(|e| format!("audio helper flush failed: {}", e))?;
            id
        };

        // The helper answers asynchronously - wait for the matching id.
        let deadline = Instant::now() + Duration::from_secs(6);
        let mut guard = self.responses.lock().unwrap();
        loop {
            if let Some(value) = guard.remove(&id) {
                return Ok(value);
            }
            let (next, timeout) = self
                .signal
                .wait_timeout(guard, Duration::from_millis(150))
                .unwrap();
            guard = next;
            if timeout.timed_out() && Instant::now() > deadline {
                return Err(format!("audio helper command '{}' timed out", cmd));
            }
        }
    }
}

// ==================================================================
// App launcher catalog
// ==================================================================

#[derive(Serialize, Clone, Debug, Default)]
pub struct AppEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub source: String,
}

/// Recursively collect `*.lnk` files from a directory.
fn collect_shortcuts(dir: &Path, out: &mut Vec<PathBuf>, depth: usize) {
    if depth > 6 {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_shortcuts(&path, out, depth + 1);
        } else if path
            .extension()
            .map(|e| e.to_string_lossy().to_ascii_lowercase() == "lnk")
            .unwrap_or(false)
        {
            out.push(path);
        }
    }
}

/// Scan the Start Menu (and the registry App Paths) for launchable apps.
pub fn scan_app_catalog() -> Vec<AppEntry> {
    let mut entries: Vec<AppEntry> = Vec::new();
    let mut seen: Vec<String> = Vec::new();

    let roots = [
        expand_env("%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs"),
        expand_env("%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs"),
    ];

    for root in roots {
        if !root.exists() {
            continue;
        }
        let mut shortcuts: Vec<PathBuf> = Vec::new();
        collect_shortcuts(&root, &mut shortcuts, 0);
        for shortcut in shortcuts {
            let name = shortcut
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            if name.is_empty() || name.eq_ignore_ascii_case("uninstall") {
                continue;
            }
            let path = shortcut.to_string_lossy().to_string();
            let key = name.to_ascii_lowercase();
            if seen.contains(&key) {
                continue;
            }
            seen.push(key);
            entries.push(AppEntry {
                id: path.clone(),
                name,
                path,
                source: "start-menu".into(),
            });
        }
    }

    // Registry "App Paths" entries give us the classic Win32 executables.
    let output = Command::new("reg")
        .args([
            "query",
            "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths",
            "/s",
        ])
        .creation_flags(0x08000000)
        .output();
    if let Ok(output) = output {
        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            let line = line.trim();
            let Some(rest) = line.strip_prefix("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\") else {
                continue;
            };
            let name = rest.trim_end_matches('\\').trim();
            if name.is_empty() || !name.to_ascii_lowercase().ends_with(".exe") {
                continue;
            }
            let key = name.to_ascii_lowercase();
            if seen.contains(&key) {
                continue;
            }
            seen.push(key);
            entries.push(AppEntry {
                id: name.to_string(),
                name: name.trim_end_matches(".exe").to_string(),
                path: name.to_string(),
                source: "app-paths".into(),
            });
        }
    }

    entries
}

/// Filter a catalog by a search query.
pub fn filter_apps(entries: &[AppEntry], query: &str) -> Vec<AppEntry> {
    let needle = query.trim().to_ascii_lowercase();
    if needle.is_empty() {
        return entries.to_vec();
    }
    entries
        .iter()
        .filter(|entry| {
            entry.name.to_ascii_lowercase().contains(&needle)
                || entry.path.to_ascii_lowercase().contains(&needle)
        })
        .take(80)
        .cloned()
        .collect()
}

// ==================================================================
// Native file picker
// ==================================================================

/// Open the Windows file picker and return the selected path.
pub fn pick_file(title: &str, extensions: &[&str]) -> Option<String> {
    #[cfg(windows)]
    {
        use windows::core::Interface;
        use windows::core::PCWSTR;
        use windows::Win32::Foundation::HWND;
        use windows::Win32::System::Com::{
            CoCreateInstance, CoInitializeEx, CoTaskMemFree, COINIT_APARTMENTTHREADED,
            CLSCTX_INPROC_SERVER,
        };
        use windows::Win32::UI::Shell::Common::COMDLG_FILTERSPEC;
        use windows::Win32::UI::Shell::{
            FileOpenDialog, IFileDialog, IFileOpenDialog, IModalWindow, FOS_FILEMUSTEXIST,
            FOS_FORCEFILESYSTEM, FOS_PATHMUSTEXIST,
        };

        unsafe {
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

            let dialog: IFileOpenDialog =
                match CoCreateInstance(&FileOpenDialog, None::<&windows::core::IUnknown>, CLSCTX_INPROC_SERVER) {
                    Ok(d) => d,
                    Err(_) => return None,
                };

            let file_dialog: IFileDialog = match dialog.cast() {
                Ok(d) => d,
                Err(_) => return None,
            };

            if let Ok(options) = file_dialog.GetOptions() {
                let _ = file_dialog.SetOptions(
                    options | FOS_FORCEFILESYSTEM | FOS_FILEMUSTEXIST | FOS_PATHMUSTEXIST,
                );
            }

            let title_wide = to_wide(title);
            let _ = file_dialog.SetTitle(PCWSTR(title_wide.as_ptr()));

            if !extensions.is_empty() {
                let spec_text = extensions
                    .iter()
                    .map(|ext| format!("*.{}", ext.trim_start_matches('.')))
                    .collect::<Vec<_>>()
                    .join(";");
                let name_wide = to_wide("Applications & Shortcuts");
                let spec_wide = to_wide(&spec_text);
                let mut filters = [COMDLG_FILTERSPEC {
                    pszName: PCWSTR(name_wide.as_ptr()),
                    pszSpec: PCWSTR(spec_wide.as_ptr()),
                }];
                let _ = file_dialog.SetFileTypes(&mut filters);
            }

            let modal: IModalWindow = match dialog.cast() {
                Ok(m) => m,
                Err(_) => return None,
            };
            if modal.Show(HWND(std::ptr::null_mut())).is_err() {
                return None;
            }

            let item = file_dialog.GetResult().ok()?;
            let name = item.GetDisplayName(windows::Win32::UI::Shell::SIGDN_FILESYSPATH).ok()?;
            let path = name.to_string().ok()?;
            let _ = CoTaskMemFree(Some(name.0 as *const c_void));
            Some(path)
        }
    }
    #[cfg(not(windows))]
    {
        let _ = (title, extensions);
        None
    }
}

// ==================================================================
// USB drive watcher
// ==================================================================

/// List the currently connected removable drives as `(letter, label)`.
pub fn list_usb_drives() -> Vec<(String, String)> {
    #[cfg(windows)]
    {
        use windows::core::PCWSTR;
        use windows::Win32::Storage::FileSystem::{
            GetDriveTypeW, GetLogicalDrives, GetVolumeInformationW,
        };
        use windows::Win32::System::WindowsProgramming::DRIVE_REMOVABLE;

        let mut drives = Vec::new();
        unsafe {
            let mask = GetLogicalDrives();
            for index in 0..26u32 {
                if mask & (1 << index) == 0 {
                    continue;
                }
                let letter = format!("{}:", (b'A' + index as u8) as char);
                let wide = to_wide(&letter);
                let drive_type = GetDriveTypeW(PCWSTR(wide.as_ptr()));
                if drive_type != DRIVE_REMOVABLE {
                    continue;
                }
                let root = to_wide(&format!("{}\\", letter));
                let mut name_buffer = [0u16; 261];
                let mut serial: u32 = 0;
                let mut max_component: u32 = 0;
                let mut flags: u32 = 0;
                let ok = GetVolumeInformationW(
                    PCWSTR(root.as_ptr()),
                    Some(&mut name_buffer),
                    Some(&mut serial),
                    Some(&mut max_component),
                    Some(&mut flags),
                    None,
                );
                let label = if ok.is_ok() {
                    from_wide(&name_buffer)
                } else {
                    String::new()
                };
                drives.push((letter, label));
            }
        }
        drives
    }
    #[cfg(not(windows))]
    {
        Vec::new()
    }
}
