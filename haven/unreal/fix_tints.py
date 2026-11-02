"""
Unreal Editor Python: refresh the Color (tint) parameter of every textured material instance from
unreal/export/materials.json, without rebuilding the level.

  UnrealEditor.exe HavenOak.uproject -ExecCmds="py fix_tints.py" -unattended -nosplash -log
"""
import json
import os
import re

import unreal

HERE = os.path.dirname(os.path.abspath(__file__))
MAT_DIR = "/Game/Haven/Materials"
MEL = unreal.MaterialEditingLibrary
EAL = unreal.EditorAssetLibrary


def clean(name):
    return re.sub(r"[^A-Za-z0-9_]", "_", name)


def main():
    with open(os.path.join(HERE, "export", "materials.json"), encoding="utf8") as f:
        specs = json.load(f)
    n = 0
    for spec in specs:
        if not spec["textures"].get("baseColor"):
            continue
        path = f"{MAT_DIR}/MI_{clean(spec['name'])}"
        if not EAL.does_asset_exist(path):
            continue
        mi = unreal.load_asset(path)
        t = spec.get("tint", [1, 1, 1])
        MEL.set_material_instance_vector_parameter_value(mi, "Color", unreal.LinearColor(t[0], t[1], t[2], 1))
        MEL.update_material_instance(mi)
        EAL.save_loaded_asset(mi)
        n += 1
    unreal.log(f"[haven] tints refreshed on {n} textured material instances")


try:
    main()
except Exception:  # noqa: BLE001
    import traceback
    unreal.log_error("[haven] " + traceback.format_exc())
finally:
    unreal.SystemLibrary.quit_editor()
