# Weekly self-refresh of the JOS «Клиенты» dossiers (laptop, Max plan, headless `claude -p`).
# Writes data/jos/clients/*.json (+ _history backup) and Obsidian W2W/CRM/Клиенты — изменения.md.
# Does NOT publish: the 3x/day task \JOS\jos-sales-ig-refresh renders + publishes what changed.
# Usage: run_client_refresh.ps1 [-DryRun -Ids tenet,oxus] [-Model claude-sonnet-5-5]
param([switch]$DryRun, [string]$Ids = "", [string]$Model = "claude-sonnet-5-5")
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue      # Max plan only, never API keys
Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
$env:CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS = "0"
$env:PYTHONIOENCODING = "utf-8"
$py = "C:\Users\user\AppData\Local\Python\pythoncore-3.14-64\python.exe"   # absolute: bare python breaks in scheduled tasks
$a = @("$repo\scripts\refresh_clients_weekly.py", "--model", $Model)
if ($DryRun) { $a += "--dry-run" }
if ($Ids) { $a += @("--ids", $Ids) }
Set-Location $repo
& $py @a
exit $LASTEXITCODE
