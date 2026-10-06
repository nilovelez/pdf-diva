; NSIS additions for the installer built by electron-builder (nsis.include in electron-builder.yml).
;
; Registers PDF Diva as one more app that can open PDFs, so it shows up in "Open with…" with the
; "Always use this app" option. It never makes itself the default PDF viewer: the `.pdf` key's own
; default value and the user's choice (UserChoice) are left alone. Per-user install, so SHCTX is
; HKEY_CURRENT_USER. electron-builder's `fileAssociations` is not used because it also sets that
; default value.

!define PDFDIVA_PROGID "PDFDiva.pdf"

!macro customInstall
  WriteRegStr SHCTX "Software\Classes\${PDFDIVA_PROGID}" "" "PDF document"
  WriteRegStr SHCTX "Software\Classes\${PDFDIVA_PROGID}\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr SHCTX "Software\Classes\${PDFDIVA_PROGID}\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  WriteRegStr SHCTX "Software\Classes\.pdf\OpenWithProgids" "${PDFDIVA_PROGID}" ""
  ; Tell Explorer the associations changed.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro customUnInstall
  DeleteRegValue SHCTX "Software\Classes\.pdf\OpenWithProgids" "${PDFDIVA_PROGID}"
  DeleteRegKey /ifempty SHCTX "Software\Classes\.pdf\OpenWithProgids"
  DeleteRegKey /ifempty SHCTX "Software\Classes\.pdf"
  DeleteRegKey SHCTX "Software\Classes\${PDFDIVA_PROGID}"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
