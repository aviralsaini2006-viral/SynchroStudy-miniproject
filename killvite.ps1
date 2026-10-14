Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -like '*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host "done"
