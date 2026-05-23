@echo off
setlocal enabledelayedexpansion

set COZE_WORKSPACE_PATH=%COZE_WORKSPACE_PATH%
if not defined COZE_WORKSPACE_PATH set COZE_WORKSPACE_PATH=%cd%

cd /d "%COZE_WORKSPACE_PATH%"

echo Installing dependencies...
pnpm install --prefer-frozen-lockfile --prefer-offline

echo Building the Next.js project...
pnpm next build

echo Build completed successfully!