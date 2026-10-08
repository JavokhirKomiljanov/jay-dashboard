# Runs one advisor through headless Claude Code on the Max plan and stores its page.
# Usage: run_advisors.ps1 -Advisor cos|hr|mkt|fin [-Model claude-fable-5-1]
param(
  [Parameter(Mandatory=$true)][ValidateSet("cos","hr","mkt","fin")][string]$Advisor,
  [string]$Model = "claude-opus-5-5",
  [string]$Strategy = "C:\Users\user\Dev\w2w-strategy\strategy\strategy.json",
  [string]$Vault = "F:\Obsidian\Javokhir\Jay"
)
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$repo = Split-Path -Parent (Split-Path -Parent $here)
$out = Join-Path $here "out\$Advisor"; New-Item -ItemType Directory -Force $out | Out-Null
$date = Get-Date -Format "yyyy-MM-dd"
$skill = Get-Content (Join-Path $here "$Advisor\SKILL.md") -Raw -Encoding UTF8
$common = Get-Content (Join-Path $here "COMMON.md") -Raw -Encoding UTF8

# Max plan only — never API keys (Jay 2026-10-05)
Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue
$env:CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS = "0"

$prompt = @"
$common

$skill

## Контекст запуска
- Дата: $date
- strategy.json: $Strategy
- vault: $Vault
- advisors.json (обнови только свой блок id="$Advisor", ключи задач $Advisor-N стабильные): $repo\data\jos\advisors.json
- Страницу сохрани в: $out\$date.md
"@

Set-Location $repo
$log = Join-Path $out "$date.log"
$dirs = @((Split-Path -Parent (Split-Path -Parent $Strategy)), "C:\Users\user\Dev\jay-crm", "C:\Users\user\Dev\jay-channel-publisher", "C:\Users\user\Dev\ig-pipeline", $Vault, "C:\Users\user\Claude") | Where-Object { Test-Path $_ }
$addDirs = @(); foreach ($d in $dirs) { $addDirs += "--add-dir"; $addDirs += $d }
$prompt | & claude -p --model $Model --permission-mode acceptEdits --output-format text @addDirs 2>&1 | Tee-Object -FilePath $log
if (-not (Test-Path "$out\$date.md")) { Write-Warning "advisor $Advisor produced no page; see $log" }
