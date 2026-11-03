"""
Unreal Editor Python: build the Haven level from the Blender export.

  UnrealEditor.exe HavenOak.uproject -ExecCmds="py build_level.py" -unattended -nosplash -log

Imports unreal/export/scene.fbx as one static mesh per object (every transform already applied, so each
mesh is placed at the origin), recreates every Blender material as an instance of three small master
materials (colour, textured, glass), gives every mesh complex collision so the player walks the real
geometry, then lays out the level: sun, sky, fog, the home's lamps, a player start in the lift lobby.

Coordinates: the Blender scene is metres with -Y = plan south; the FBX import converts to Unreal's
centimetres with +Y = plan south, so plan (x, y) at elevation e lands at Unreal (x*100, y*100, e*100).
"""
import json
import os
import re
import sys

import unreal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import haven_materials  # noqa: E402
import traffic_sequence  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(HERE, "export")
BL_EXPORT = os.path.join(HERE, "..", "blender", "export")
MESH_DIR = "/Game/Haven/Meshes"
MAT_DIR = "/Game/Haven/Materials"
TEX_DIR = "/Game/Haven/Textures"
LEVEL = "/Game/Haven/L_Haven"
RESIDENCE_ELEVATION = 33.0

AT = unreal.AssetToolsHelpers.get_asset_tools()
EAL = unreal.EditorAssetLibrary
MEL = unreal.MaterialEditingLibrary
LES = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def log(msg):
    unreal.log(f"[haven] {msg}")


def clean(name):
    return re.sub(r"[^A-Za-z0-9_]", "_", name)


# ---------------------------------------------------------------- import

def import_fbx():
    task = unreal.AssetImportTask()
    task.filename = os.path.join(EXPORT, "scene.fbx")
    task.destination_path = MESH_DIR
    task.automated = True
    task.save = True
    task.replace_existing = True
    ui = unreal.FbxImportUI()
    ui.import_mesh = True
    ui.import_materials = False
    ui.import_textures = False
    ui.import_as_skeletal = False
    ui.import_animations = False
    ui.automated_import_should_detect_type = False
    smd = ui.static_mesh_import_data
    smd.combine_meshes = False
    smd.auto_generate_collision = False
    smd.generate_lightmap_u_vs = False
    smd.import_uniform_scale = 1.0
    task.options = ui
    AT.import_asset_tasks([task])
    paths = list(task.imported_object_paths)
    log(f"imported {len(paths)} meshes")
    return paths


def import_textures():
    folder = os.path.join(EXPORT, "textures")
    if not os.path.isdir(folder):
        return {}
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
    # roughness and normal maps are data, not colour
    for name, tex in out.items():
        if "_nor" in name or "_rough" in name or "_mask" in name:
            tex.set_editor_property("srgb", False)
            if "_nor" in name:
                tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
            EAL.save_loaded_asset(tex)
    log(f"imported {len(out)} textures")
    return out


# ---------------------------------------------------------------- materials: see haven_materials.py


def assign_materials(mesh_paths, instances):
    assigned = 0
    nanite = 0
    for p in mesh_paths:
        sm = unreal.load_asset(p)
        if not isinstance(sm, unreal.StaticMesh):
            continue
        mats = sm.get_editor_property("static_materials")
        for i, slot in enumerate(mats):
            slot_name = clean(str(slot.get_editor_property("material_slot_name")))
            mi = instances.get(slot_name) or instances.get(re.sub(r"_\d{3}$", "", slot_name))
            if mi:
                sm.set_material(i, mi)
                assigned += 1
        # walk the real geometry: complex collision from the mesh itself
        bs = sm.get_editor_property("body_setup")
        if bs:
            bs.set_editor_property("collision_trace_flag", unreal.CollisionTraceFlag.CTF_USE_COMPLEX_AS_SIMPLE)
        # Nanite for everything solid and still: the house, the city, the trees' trunks; not glass, leaf cards or cars
        name = sm.get_name()
        slot_names = [clean(str(s.get_editor_property("material_slot_name"))) for s in mats]
        solid = not any(any(k in n for k in ("Glass", "glass", "leafCard", "palmFrond", "curtain", "mirror")) for n in slot_names)
        if solid and not name.startswith("car_"):
            if enable_nanite(sm):
                nanite += 1
        EAL.save_loaded_asset(sm)
    log(f"{assigned} material slots assigned, {nanite} meshes on Nanite")


def enable_nanite(sm):
    try:
        settings = sm.get_editor_property("nanite_settings")
        settings.set_editor_property("enabled", True)
        sub = unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
        if hasattr(sub, "set_nanite_settings"):
            sub.set_nanite_settings(sm, settings, True)
        else:
            sm.set_editor_property("nanite_settings", settings)
        return True
    except Exception as err:  # noqa: BLE001
        log(f"nanite not set on {sm.get_name()}: {err}")
        return False


# ---------------------------------------------------------------- level

def spawn(cls, loc, rot=unreal.Rotator(0, 0, 0)):
    return EAS.spawn_actor_from_class(cls, unreal.Vector(*loc), rot)


def build_level(mesh_paths):
    if EAL.does_asset_exist(LEVEL):
        # a level from an earlier run: maps can't simply be deleted, so load it and empty it
        LES.load_level(LEVEL)
        EAS.destroy_actors(EAS.get_all_level_actors())
    elif not LES.new_level(LEVEL):
        raise RuntimeError(f"could not create {LEVEL}")
    placed = 0
    cars = {}
    for p in mesh_paths:
        sm = unreal.load_asset(p)
        if not isinstance(sm, unreal.StaticMesh):
            continue
        # a plain StaticMeshActor with the mesh set on its component (the actor factory path is unreliable headless)
        a = EAS.spawn_actor_from_class(unreal.StaticMeshActor, unreal.Vector(0, 0, 0))
        if a is None:
            log(f"could not place {sm.get_name()}")
            continue
        a.set_actor_label(sm.get_name())
        comp = a.static_mesh_component
        comp.set_mobility(unreal.ComponentMobility.MOVABLE if sm.get_name().startswith("car_") else unreal.ComponentMobility.STATIC)
        if sm.get_name().startswith("car_"):
            cars[sm.get_name()] = a
        if not comp.set_static_mesh(sm):
            log(f"no geometry in {sm.get_name()}; removed")
            EAS.destroy_actor(a)
            EAL.delete_loaded_asset(sm)  # an empty mesh also breaks the cook when packaging
            continue
        placed += 1
    log(f"{placed} meshes placed")

    # the day sun of the studio: towards the sun is three.js (-0.5, 0.55, 0.67) -> light travels the other way
    travel = unreal.Vector(0.5, -0.67, -0.55)
    sun = spawn(unreal.DirectionalLight, (0, 0, 20000), unreal.MathLibrary.make_rot_from_x(travel))
    sun.set_actor_label("Sun")
    lc = sun.get_component_by_class(unreal.DirectionalLightComponent)
    lc.set_editor_property("intensity", 75000.0)  # lux: physically based exposure wants a real sun
    lc.set_editor_property("light_color", unreal.Color(255, 232, 200, 255))
    lc.set_editor_property("light_source_angle", 0.8)
    lc.set_editor_property("atmosphere_sun_light", True)
    lc.set_editor_property("cast_shadows", True)
    # the cumulus throw moving shadows over the plain
    for prop, value in (("cast_cloud_shadows", True), ("cloud_shadow_strength", 0.6), ("cloud_shadow_extent", 300.0)):
        try:
            lc.set_editor_property(prop, value)
        except Exception as err:  # noqa: BLE001
            log(f"{prop} left at the default ({err})")
    spawn(unreal.SkyAtmosphere, (0, 0, 0)).set_actor_label("SkyAtmosphere")
    # fair-weather cumulus over the plain
    try:
        clouds = spawn(unreal.VolumetricCloud, (0, 0, 0))
        clouds.set_actor_label("Clouds")
        cc = clouds.get_component_by_class(unreal.VolumetricCloudComponent)
        cc.set_editor_property("layer_bottom_altitude", 1.8)
        cc.set_editor_property("layer_height", 2.5)
    except Exception as err:  # noqa: BLE001
        log(f"no volumetric clouds ({err})")
    sky = spawn(unreal.SkyLight, (0, 0, 5000))
    sky.set_actor_label("SkyLight")
    skc = sky.get_component_by_class(unreal.SkyLightComponent)
    skc.set_editor_property("real_time_capture", True)
    skc.set_editor_property("intensity", 0.8)
    fog = spawn(unreal.ExponentialHeightFog, (0, 0, 0))
    fog.set_actor_label("Haze")
    fc = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
    # aerial perspective over 7 km of green country: a clear, humid day, the Sabarmati still readable at 3 km
    fc.set_editor_property("fog_density", 0.0045)
    fc.set_editor_property("fog_height_falloff", 0.02)
    try:
        fc.set_editor_property("fog_inscattering_luminance", unreal.LinearColor(0.80, 0.84, 0.90, 1.0))
    except Exception as err:  # noqa: BLE001 - older property name
        log(f"haze colour left at the default ({err})")
    fc.set_editor_property("start_distance", 20000.0)
    fc.set_editor_property("fog_max_opacity", 0.92)

    # the home's lamps, from the studio's lights.json (three.js metres: x east, y up, z south)
    with open(os.path.join(BL_EXPORT, "lights.json"), encoding="utf8") as f:
        lights = json.load(f)
    for l in lights:
        pl = spawn(unreal.PointLight, (l["x"] * 100, l["z"] * 100, l["y"] * 100))
        pc = pl.get_component_by_class(unreal.PointLightComponent)
        pc.set_editor_property("intensity_units", unreal.LightUnits.CANDELAS)
        pc.set_editor_property("intensity", 180.0 * l.get("strength", 1.0))
        pc.set_editor_property("light_color", unreal.Color(255, 201, 143, 255))
        pc.set_editor_property("attenuation_radius", 900.0)
        pc.set_editor_property("source_radius", 12.0)
        pc.set_editor_property("cast_shadows", True)
        pl.set_actor_label(f"Lamp_{l.get('room', 'x')}")

    # exposure: the eye adapts between the sunlit balcony and the rooms
    pp = spawn(unreal.PostProcessVolume, (0, 0, 0))
    pp.set_actor_label("PostProcess")
    pp.set_editor_property("unbound", True)
    settings = pp.get_editor_property("settings")
    settings.set_editor_property("override_auto_exposure_method", True)
    settings.set_editor_property("auto_exposure_method", unreal.AutoExposureMethod.AEM_HISTOGRAM)
    settings.set_editor_property("override_auto_exposure_min_brightness", True)
    settings.set_editor_property("auto_exposure_min_brightness", 3.0)
    settings.set_editor_property("override_auto_exposure_max_brightness", True)
    settings.set_editor_property("auto_exposure_max_brightness", 32.0)  # the eye can stop down fully on the sunlit balcony
    settings.set_editor_property("override_auto_exposure_bias", True)
    settings.set_editor_property("auto_exposure_bias", -0.25)
    # a photographic look: a touch of grain, bloom and vignette, slightly more contrast, no lens flares
    for flag, prop, value in (("override_film_grain_intensity", "film_grain_intensity", 0.12),
                              ("override_bloom_intensity", "bloom_intensity", 0.3),
                              ("override_vignette_intensity", "vignette_intensity", 0.3),
                              ("override_scene_fringe_intensity", "scene_fringe_intensity", 0.25),
                              ("override_lens_flare_intensity", "lens_flare_intensity", 0.0),
                              ("override_color_contrast", "color_contrast", unreal.Vector4(1.06, 1.06, 1.06, 1.0)),
                              ("override_color_saturation", "color_saturation", unreal.Vector4(1.05, 1.05, 1.05, 1.0)),
                              ("override_color_gain_shadows", "color_gain_shadows", unreal.Vector4(0.98, 0.99, 1.03, 1.0))):
        try:
            settings.set_editor_property(flag, True)
            settings.set_editor_property(prop, value)
        except Exception as err:  # noqa: BLE001
            log(f"{prop} left at the default ({err})")
    settings.set_editor_property("override_white_temp", True)
    settings.set_editor_property("white_temp", 6900.0)
    settings.set_editor_property("override_dynamic_global_illumination_method", True)
    settings.set_editor_property("dynamic_global_illumination_method", unreal.DynamicGlobalIlluminationMethod.LUMEN)
    settings.set_editor_property("override_reflection_method", True)
    settings.set_editor_property("reflection_method", unreal.ReflectionMethod.LUMEN)
    settings.set_editor_property("override_lumen_scene_lighting_quality", True)
    settings.set_editor_property("lumen_scene_lighting_quality", 4.0)
    settings.set_editor_property("override_lumen_final_gather_quality", True)
    settings.set_editor_property("lumen_final_gather_quality", 4.0)
    for flag, prop, value in (("override_lumen_scene_detail", "lumen_scene_detail", 4.0),
                              ("override_lumen_scene_view_distance", "lumen_scene_view_distance", 600000.0),
                              ("override_lumen_reflection_quality", "lumen_reflection_quality", 4.0),
                              ("override_lumen_ray_lighting_mode", "lumen_ray_lighting_mode", getattr(getattr(unreal, "LumenRayLightingModeOverride", None), "HIT_LIGHTING", None))):
        if value is None:
            continue
        try:
            settings.set_editor_property(flag, True)
            settings.set_editor_property(prop, value)
        except Exception as err:  # noqa: BLE001 - property names move between engine versions
            log(f"{prop} left at the default ({err})")
    pp.set_editor_property("settings", settings)

    # start in the lift lobby on level 11, facing the front door
    start = spawn(unreal.PlayerStart, (1260, 240, RESIDENCE_ELEVATION * 100 + 95), unreal.Rotator(0, 180, 0))
    start.set_actor_label("Start_LiftLobby")
    # the traffic: every exported vehicle driven along its road by one looping sequence
    plan = os.path.join(BL_EXPORT, "traffic.json")
    if os.path.exists(plan) and cars:
        try:
            traffic_sequence.build_traffic(LEVEL, plan, cars, LES)
        except Exception:  # noqa: BLE001
            import traceback
            unreal.log_error("[haven] traffic: " + traceback.format_exc())
    LES.save_current_level()
    log(f"level saved: {LEVEL}")


def main():
    meshes = import_fbx()
    textures = import_textures()
    instances = haven_materials.build_materials(textures)
    assign_materials(meshes, instances)
    build_level(meshes)
    EAL.save_directory("/Game/Haven")
    log("done")


# run from a full editor session (-ExecCmds="py build_level.py"): the editor quits itself when finished
try:
    main()
except Exception:  # noqa: BLE001
    import traceback
    unreal.log_error("[haven] " + traceback.format_exc())
finally:
    unreal.SystemLibrary.quit_editor()
