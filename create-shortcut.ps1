$WshShell = New-Object -comObject WScript.Shell

# Start shortcut (no terminal window)
$Start = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Real Estate Tracker.lnk")
$Start.TargetPath = "wscript.exe"
$Start.Arguments = '"C:\Users\Darrell\Desktop\Projects\Real Estate Tracker\launch.vbs"'
$Start.WorkingDirectory = "C:\Users\Darrell\Desktop\Projects\Real Estate Tracker"
$Start.WindowStyle = 1
$Start.IconLocation = "C:\Windows\System32\imageres.dll,3"
$Start.Save()

# Stop shortcut
$Stop = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Stop Real Estate Tracker.lnk")
$Stop.TargetPath = "C:\Users\Darrell\Desktop\Projects\Real Estate Tracker\stop.bat"
$Stop.WorkingDirectory = "C:\Users\Darrell\Desktop\Projects\Real Estate Tracker"
$Stop.WindowStyle = 1
$Stop.IconLocation = "C:\Windows\System32\imageres.dll,100"
$Stop.Save()

Write-Host "Shortcuts created on Desktop!"
