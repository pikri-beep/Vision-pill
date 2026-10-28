FEATURE 
- [x] Customize tampilan quickpill, glassmorphism dan bisa menyesuaikan warna dengan wallpaper (Default: Off/seperti sebelumnya, dapat diaktifkan di Settings > Appearance)
- [x] lirik melalui lrclib untuk lagu (Pencarian bertingkat exact & fuzzy search, auto-scroll, fallback plain lyrics, dan click-to-seek)

BUGS
- [x] kadang lirik tidak tersync/load (Fixed 0-second pos timer bug, removed demo lyrics fallback, added retry search)

ALWAYS DO
- [x] push ke github ke branch main agar trigger update
- [x] selalu update release vision pill dan berikan installer electron dan tauri (Automated in .github/workflows/build.yml)


NEXT PLAN 
- [ ] rewrite ke rust (Kode asli Windows: ditulis murni dengan Rust dan digambar langsung oleh kartu grafis/GPU, tanpa mesin web di latar belakang)
 


