"""
Create the Unreal Engine project for Haven (Blueprint-only, first-person walkthrough) from the engine's
own First Person template, then print the commands that build the level, the cinematic and the package.

    python unreal/make_project.py

Needs Unreal Engine 5.5 installed through the Epic Games Launcher (C:\\Program Files\\Epic Games\\UE_5.5).
"""
import glob
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.join(HERE, "HavenOak")
NAME = "HavenOak"


def find_engine():
    for root in (os.environ.get("UE_ROOT"), *sorted(glob.glob(r"C:\Program Files\Epic Games\UE_5.*"), reverse=True)):
        if root and os.path.exists(os.path.join(root, "Engine", "Binaries", "Win64", "UnrealEditor-Cmd.exe")):
            return root
    sys.exit("Unreal Engine 5 not found under C:\\Program Files\\Epic Games (set UE_ROOT to its folder)")


def main():
    engine = find_engine()
    version = os.path.basename(engine).replace("UE_", "")
    template = os.path.join(engine, "Templates", "TP_FirstPersonBP")
    if not os.path.isdir(template):
        sys.exit(f"First Person template missing: {template}")
    os.makedirs(PROJECT, exist_ok=True)
    for folder in ("Content", "Config"):
        dst = os.path.join(PROJECT, folder)
        if not os.path.isdir(dst):
            shutil.copytree(os.path.join(template, folder), dst)
    # the template's own project settings, plus ours
    gm = [p for p in glob.glob(os.path.join(PROJECT, "Content", "**", "BP_FirstPersonGameMode.uasset"), recursive=True)]
    game_mode = "/Game/" + os.path.relpath(gm[0], os.path.join(PROJECT, "Content")).replace("\\", "/")[:-7] if gm else ""
    with open(os.path.join(PROJECT, "Config", "DefaultEngine.ini"), "a", encoding="utf8") as f:
        f.write(f"""
[/Script/EngineSettings.GameMapsSettings]
EditorStartupMap=/Game/Haven/L_Haven.L_Haven
GameDefaultMap=/Game/Haven/L_Haven.L_Haven
GlobalDefaultGameMode={game_mode}.{os.path.basename(game_mode)}_C

[/Script/Engine.RendererSettings]
r.DynamicGlobalIlluminationMethod=1
r.ReflectionMethod=1
r.GenerateMeshDistanceFields=True
r.AllowStaticLighting=False
r.DefaultFeature.AutoExposure.ExtendDefaultLuminanceRange=True
r.Nanite.ProjectEnabled=False

[/Script/WindowsTargetPlatform.WindowsTargetSettings]
DefaultGraphicsRHI=DefaultGraphicsRHI_DX12
""")
    with open(os.path.join(PROJECT, "Config", "DefaultGame.ini"), "a", encoding="utf8") as f:
        f.write("""
[/Script/EngineSettings.GeneralProjectSettings]
ProjectName=Haven — The Oak Residences
ProjectDisplayedTitle=NSLOCTEXT("", "HavenTitle", "Haven — The Oak Residences, Kudasan")
CompanyName=DecaCorpus
""")
    # plugins differ between engine versions; enable only those this engine ships
    have = {os.path.splitext(os.path.basename(p))[0] for p in glob.glob(os.path.join(engine, "Engine", "Plugins", "**", "*.uplugin"), recursive=True)}
    wanted = ["PythonScriptPlugin", "EditorScriptingUtilities", "SequencerScripting", "MovieRenderPipelineCore", "MovieRenderPipeline", "MovieRenderPipelineRenderPasses"]
    uproject = {
        "FileVersion": 3, "EngineAssociation": version, "Category": "", "Description": "Residence 11A walkthrough",
        "Modules": [],
        "Plugins": [{"Name": n, "Enabled": True} for n in wanted if n in have],
    }
    with open(os.path.join(PROJECT, f"{NAME}.uproject"), "w", encoding="utf8") as f:
        json.dump(uproject, f, indent=1)
    editor = os.path.join(engine, "Engine", "Binaries", "Win64", "UnrealEditor-Cmd.exe")
    proj = os.path.join(PROJECT, f"{NAME}.uproject")
    print(f"project: {proj}\nengine:  {engine}\ngame mode: {game_mode}\n")
    print("build the level:")
    print(f'  "{editor}" "{proj}" -run=pythonscript -script="{os.path.join(HERE, "build_level.py")}" -unattended -nullrhi')
    print("cinematic + package: see render_cinematic.py and package.bat")


if __name__ == "__main__":
    main()
