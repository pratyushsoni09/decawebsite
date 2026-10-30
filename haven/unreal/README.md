# Haven in Unreal Engine 5.5

Everything here turns the finished Blender scene (Residence 11A, the tower and central Kudasan) into
an Unreal Engine project: a first-person walkthrough you can package as a Windows app, and a cinematic
rendered with Movie Render Queue for the website.

Needs: Unreal Engine 5.5 installed through the Epic Games Launcher (default folder
`C:\Program Files\Epic Games\UE_5.5`; set `UE_ROOT` if elsewhere) and Python 3 for the helper scripts.

## Files

- `export/scene.fbx`, `export/textures/`, `export/materials.json`, `export/cameras.json` — the scene,
  written by `blender/export_unreal.py` from `blender/out/oak-residences.blend`
- `../blender/export/lights.json` — the home's lamps (read by the level build)
- `make_project.py` — creates `HavenOak/` from Unreal's First Person template
- `build_level.py` — editor script: imports the scene, rebuilds materials and collision, lays out the level
- `render_cinematic.py` — editor script: seven-shot sequence + Movie Render Queue manifest
- `encode.py` — PNG frames → `public/video/haven-cinematic.mp4` and a poster
- `package.bat` — packages the Windows walkthrough into `dist/`

## Run, in order (from the `haven` folder)

```bat
python unreal\make_project.py
"C:\Program Files\Epic Games\UE_5.5\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" unreal\HavenOak\HavenOak.uproject -run=pythonscript -script="%CD%\unreal\build_level.py" -unattended -nullrhi
"C:\Program Files\Epic Games\UE_5.5\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" unreal\HavenOak\HavenOak.uproject -run=pythonscript -script="%CD%\unreal\render_cinematic.py" -unattended -nullrhi
```

`render_cinematic.py` prints (and writes to `unreal\manifest.txt`) the Movie Render Queue manifest. Render
the frames with the real GPU, then encode:

```bat
"C:\Program Files\Epic Games\UE_5.5\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" unreal\HavenOak\HavenOak.uproject -game -MoviePipelineConfig="<manifest path>" -windowed -ResX=1280 -ResY=720 -unattended -NoLoadingScreen
python unreal\encode.py
```

Package the walkthrough (Shipping build, one .pak, a few GB in `unreal\dist\Windows`):

```bat
unreal\package.bat
```

Open the walkthrough with `HavenOak.exe`: W A S D to walk, mouse to look, you start in the lift lobby on
level 11. The cinematic's shots are listed at the top of `render_cinematic.py` in plan metres, so they
match the website's own camera views.
