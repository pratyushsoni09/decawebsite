@echo off
rem Package the Haven walkthrough as a Windows app (Shipping, cooked, single .pak) into unreal\dist.
rem   unreal\package.bat            (uses the newest C:\Program Files\Epic Games\UE_5.*, or set UE_ROOT)
setlocal
set HERE=%~dp0
if "%UE_ROOT%"=="" for /d %%D in ("C:\Program Files\Epic Games\UE_5.*") do set "UE_ROOT=%%~D"
python "%HERE%package_plugins.py" strip
call "%UE_ROOT%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun -project="%HERE%HavenOak\HavenOak.uproject" -noP4 ^
  -platform=Win64 -clientconfig=Shipping -cook -allmaps -stage -pak -compressed -archive -archivedirectory="%HERE%dist" -unattended -utf8output
python "%HERE%package_plugins.py" restore
endlocal
