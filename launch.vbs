Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ""cd /d C:\Users\Darrell\Desktop\Projects\Real Estate Tracker && npm run dev""", 0, False
WScript.Sleep 3000
WshShell.Run "http://localhost:3000", 1, False
