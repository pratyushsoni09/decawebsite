"""
Swap the project's plugin list for packaging and back again.

  python unreal/package_plugins.py strip     # editor-only plugins off, OpenColorIO explicitly off (no C++ needed)
  python unreal/package_plugins.py restore   # put the authoring plugin list back

An empty "Modules" list, and Movie Render Queue (with the OpenColorIO plugin it brings in), make UnrealAutomationTool treat this
Blueprint-only project as code-based, which would need Visual Studio. The packaged walkthrough does not
render movies, so those plugins are switched off just for the cook.
"""
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
UPROJECT = os.path.join(HERE, "HavenOak", "HavenOak.uproject")
BACKUP = UPROJECT + ".authoring"


def strip():
    shutil.copy(UPROJECT, BACKUP)
    d = json.load(open(UPROJECT, encoding="utf8"))
    d.pop("Modules", None)  # any "Modules" key makes UnrealAutomationTool treat the project as code-based
    d["Plugins"] = [{"Name": "OpenColorIO", "Enabled": False}, {"Name": "MovieRenderPipeline", "Enabled": False},
                    {"Name": "SequencerScripting", "Enabled": False}]
    json.dump(d, open(UPROJECT, "w", encoding="utf8"), indent=1)
    print("plugins stripped for packaging")


def restore():
    if os.path.exists(BACKUP):
        shutil.move(BACKUP, UPROJECT)
        print("authoring plugins restored")


if __name__ == "__main__":
    {"strip": strip, "restore": restore}[sys.argv[1]]()
