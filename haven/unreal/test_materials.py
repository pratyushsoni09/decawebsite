"""
Unreal Editor Python: build only the materials (textures + masters + instances) to check the material library
without the long mesh import:

  UnrealEditor.exe HavenOak.uproject -ExecCmds="py test_materials.py" -unattended -nosplash -log
"""
import os
import sys

import unreal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import haven_materials  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = "/Game/Haven/Textures"
AT = unreal.AssetToolsHelpers.get_asset_tools()
EAL = unreal.EditorAssetLibrary


def import_textures():
    folder = os.path.join(HERE, "export", "textures")
    tasks = []
    for file in sorted(os.listdir(folder)):
        t = unreal.AssetImportTask()
        t.filename = os.path.join(folder, file)
        t.destination_path = TEX_DIR
        t.automated = True
        t.save = True
        t.replace_existing = True
        tasks.append(t)
    AT.import_asset_tasks(tasks)
    out = {}
    for t in tasks:
        for p in t.imported_object_paths:
            out[os.path.basename(t.filename)] = unreal.load_asset(p)
    for name, tex in out.items():
        if "_nor" in name or "_rough" in name or "_mask" in name:
            tex.set_editor_property("srgb", False)
            if "_nor" in name:
                tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
            EAL.save_loaded_asset(tex)
    unreal.log(f"[haven] imported {len(out)} textures")
    return out


try:
    textures = import_textures()
    instances = haven_materials.build_materials(textures)
    # report any instance whose master failed to compile
    bad = 0
    for name, mi in instances.items():
        parent = mi.get_editor_property("parent")
        if parent is None:
            bad += 1
            unreal.log_error(f"[haven] {name}: no parent")
    unreal.log(f"[haven] test done: {len(instances)} instances, {bad} broken")
except Exception:  # noqa: BLE001
    import traceback
    unreal.log_error("[haven] " + traceback.format_exc())
finally:
    unreal.SystemLibrary.quit_editor()
