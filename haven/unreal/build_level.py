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

import unreal

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
        if "_nor" in name or "_rough" in name:
            tex.set_editor_property("srgb", False)
            if "_nor" in name:
                tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
            EAL.save_loaded_asset(tex)
    log(f"imported {len(out)} textures")
    return out


# ---------------------------------------------------------------- materials

def master(name, textured=False, glass=False):
    path = f"{MAT_DIR}/{name}"
    if EAL.does_asset_exist(path):
        EAL.delete_asset(path)
    mat = AT.create_asset(name, MAT_DIR, unreal.Material, unreal.MaterialFactoryNew())
    if glass:
        mat.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
        mat.set_editor_property("translucency_lighting_mode", unreal.TranslucencyLightingMode.TLM_SURFACE_PER_PIXEL_LIGHTING)
        mat.set_editor_property("two_sided", True)
    rough = MEL.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -400, 200)
    rough.set_editor_property("parameter_name", "Roughness")
    rough.set_editor_property("default_value", 0.5)
    MEL.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    metal = MEL.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -400, 300)
    metal.set_editor_property("parameter_name", "Metallic")
    MEL.connect_material_property(metal, "", unreal.MaterialProperty.MP_METALLIC)
    emis = MEL.create_material_expression(mat, unreal.MaterialExpressionVectorParameter, -400, 400)
    emis.set_editor_property("parameter_name", "Emissive")
    MEL.connect_material_property(emis, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    tint = MEL.create_material_expression(mat, unreal.MaterialExpressionVectorParameter, -700, 0)
    tint.set_editor_property("parameter_name", "Color")
    tint.set_editor_property("default_value", unreal.LinearColor(0.8, 0.8, 0.8, 1))
    if textured:
        coord = MEL.create_material_expression(mat, unreal.MaterialExpressionTextureCoordinate, -1300, 0)
        tiling = MEL.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -1300, 150)
        tiling.set_editor_property("parameter_name", "Tiling")
        tiling.set_editor_property("default_value", 1.0)
        mul_uv = MEL.create_material_expression(mat, unreal.MaterialExpressionMultiply, -1100, 50)
        MEL.connect_material_expressions(coord, "", mul_uv, "A")
        MEL.connect_material_expressions(tiling, "", mul_uv, "B")
        tex = MEL.create_material_expression(mat, unreal.MaterialExpressionTextureSampleParameter2D, -900, -100)
        tex.set_editor_property("parameter_name", "BaseTex")
        # an unset sampler shows the engine's checkerboard: default to plain white / a flat normal instead
        tex.set_editor_property("texture", unreal.load_asset("/Engine/EngineResources/WhiteSquareTexture"))
        MEL.connect_material_expressions(mul_uv, "", tex, "UVs")
        mul = MEL.create_material_expression(mat, unreal.MaterialExpressionMultiply, -500, -50)
        MEL.connect_material_expressions(tex, "RGB", mul, "A")
        MEL.connect_material_expressions(tint, "", mul, "B")
        MEL.connect_material_property(mul, "", unreal.MaterialProperty.MP_BASE_COLOR)
        nor = MEL.create_material_expression(mat, unreal.MaterialExpressionTextureSampleParameter2D, -900, 300)
        nor.set_editor_property("parameter_name", "NormalTex")
        nor.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
        nor.set_editor_property("texture", unreal.load_asset("/Engine/EngineMaterials/DefaultNormal"))
        MEL.connect_material_expressions(mul_uv, "", nor, "UVs")
        MEL.connect_material_property(nor, "RGB", unreal.MaterialProperty.MP_NORMAL)
    else:
        MEL.connect_material_property(tint, "", unreal.MaterialProperty.MP_BASE_COLOR)
    if glass:
        op = MEL.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -400, 500)
        op.set_editor_property("parameter_name", "Opacity")
        op.set_editor_property("default_value", 0.25)
        MEL.connect_material_property(op, "", unreal.MaterialProperty.MP_OPACITY)
    MEL.recompile_material(mat)
    EAL.save_loaded_asset(mat)
    return mat


def build_materials(textures):
    with open(os.path.join(EXPORT, "materials.json"), encoding="utf8") as f:
        specs = json.load(f)
    masters = {"color": master("M_Haven"), "tex": master("M_HavenTex", textured=True), "glass": master("M_HavenGlass", glass=True)}
    instances = {}
    for spec in specs:
        name = "MI_" + clean(spec["name"])
        path = f"{MAT_DIR}/{name}"
        if EAL.does_asset_exist(path):
            EAL.delete_asset(path)
        glass = spec["transmission"] > 0.5 or spec["alpha"] < 0.9
        base_tex = textures.get(spec["textures"].get("baseColor", ""))
        nor_tex = textures.get(spec["textures"].get("normal", ""))
        kind = "glass" if glass else ("tex" if (base_tex or nor_tex) else "color")
        mi = AT.create_asset(name, MAT_DIR, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
        MEL.set_material_instance_parent(mi, masters[kind])
        c = spec["baseColor"]
        MEL.set_material_instance_vector_parameter_value(mi, "Color", unreal.LinearColor(1, 1, 1, 1) if (kind == "tex" and base_tex) else unreal.LinearColor(c[0], c[1], c[2], 1))
        MEL.set_material_instance_scalar_parameter_value(mi, "Roughness", spec["roughness"])
        MEL.set_material_instance_scalar_parameter_value(mi, "Metallic", spec["metallic"])
        e = spec["emission"]
        s = spec["emissionStrength"]
        MEL.set_material_instance_vector_parameter_value(mi, "Emissive", unreal.LinearColor(e[0] * s, e[1] * s, e[2] * s, 1))
        if kind == "tex":
            if base_tex:
                MEL.set_material_instance_texture_parameter_value(mi, "BaseTex", base_tex)
            if nor_tex:
                MEL.set_material_instance_texture_parameter_value(mi, "NormalTex", nor_tex)
            # Blender maps these in metres through a Mapping node; Unreal's UVs are the mesh's own
            scale = spec.get("uvScale", [1, 1])[0]
            MEL.set_material_instance_scalar_parameter_value(mi, "Tiling", float(scale) if scale else 1.0)
        if kind == "glass":
            MEL.set_material_instance_scalar_parameter_value(mi, "Opacity", 0.2 if spec["transmission"] > 0.5 else spec["alpha"])
        MEL.update_material_instance(mi)
        EAL.save_loaded_asset(mi)
        instances[clean(spec["name"])] = mi
    log(f"{len(instances)} material instances")
    return instances


def assign_materials(mesh_paths, instances):
    assigned = 0
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
        EAL.save_loaded_asset(sm)
    log(f"{assigned} material slots assigned")


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
        comp.set_mobility(unreal.ComponentMobility.STATIC)
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
    spawn(unreal.SkyAtmosphere, (0, 0, 0)).set_actor_label("SkyAtmosphere")
    sky = spawn(unreal.SkyLight, (0, 0, 5000))
    sky.set_actor_label("SkyLight")
    skc = sky.get_component_by_class(unreal.SkyLightComponent)
    skc.set_editor_property("real_time_capture", True)
    skc.set_editor_property("intensity", 0.8)
    fog = spawn(unreal.ExponentialHeightFog, (0, 0, 0))
    fog.set_actor_label("Haze")
    fc = fog.get_component_by_class(unreal.ExponentialHeightFogComponent)
    fc.set_editor_property("fog_density", 0.004)
    fc.set_editor_property("fog_height_falloff", 0.15)
    fc.set_editor_property("start_distance", 8000.0)

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
    settings.set_editor_property("auto_exposure_max_brightness", 16.0)
    settings.set_editor_property("override_auto_exposure_bias", True)
    settings.set_editor_property("auto_exposure_bias", 0.0)
    settings.set_editor_property("override_white_temp", True)
    settings.set_editor_property("white_temp", 6900.0)
    settings.set_editor_property("override_dynamic_global_illumination_method", True)
    settings.set_editor_property("dynamic_global_illumination_method", unreal.DynamicGlobalIlluminationMethod.LUMEN)
    settings.set_editor_property("override_reflection_method", True)
    settings.set_editor_property("reflection_method", unreal.ReflectionMethod.LUMEN)
    settings.set_editor_property("override_lumen_scene_lighting_quality", True)
    settings.set_editor_property("lumen_scene_lighting_quality", 2.0)
    settings.set_editor_property("override_lumen_final_gather_quality", True)
    settings.set_editor_property("lumen_final_gather_quality", 2.0)
    pp.set_editor_property("settings", settings)

    # start in the lift lobby on level 11, facing the front door
    start = spawn(unreal.PlayerStart, (1260, 240, RESIDENCE_ELEVATION * 100 + 95), unreal.Rotator(0, 180, 0))
    start.set_actor_label("Start_LiftLobby")
    LES.save_current_level()
    log(f"level saved: {LEVEL}")


def main():
    meshes = import_fbx()
    textures = import_textures()
    instances = build_materials(textures)
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
