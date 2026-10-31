"""
Unreal Editor Python: author the cinematic (a Level Sequence of seven shots) and queue it for Movie Render Queue.

  UnrealEditor.exe HavenOak.uproject -ExecCmds="py render_cinematic.py" -unattended -nosplash -log

Writes the sequence /Game/Haven/Cinematic/LS_Haven and a Movie Render Queue manifest; render it with

  UnrealEditor-Cmd.exe HavenOak.uproject -game -MoviePipelineConfig="<manifest>" -windowed -ResX=1280 -ResY=720 -unattended

then turn the PNG frames into MP4 with encode.py. Shots are in the plan's metres (x east, y south) at the
residence elevation, so they match the studio's cameras; Unreal gets centimetres.
"""
import json
import math
import os

import unreal

HERE = os.path.dirname(os.path.abspath(__file__))
CINE_DIR = "/Game/Haven/Cinematic"
LEVEL = "/Game/Haven/L_Haven"
FPS = 30
E = 33.0  # residence elevation, metres
SENSOR_H = 13.365  # CineCamera default filmback height, mm

# (name, seconds, from (x, y, height), look-from (x, y, height), to, look-to, vertical fov)
SHOTS = [
    ("street", 8, (46.9, 62.7, 1.9), (12, 8, 24), (38.0, 54.0, 2.2), (12, 8, 26), 70),
    ("rise", 9, (40.0, 60.0, 4.0), (12, 10, 30), (36.0, 56.0, E + 2.0), (12, 10, E + 1.0), 60),
    ("dining", 6, (10.4, 4.6, E + 1.6), (5.2, 7.7, E + 0.9), (9.2, 5.4, E + 1.5), (5.2, 7.7, E + 0.9), 62),
    ("hall", 7, (6.0, 12.4, E + 1.3), (11.86, 12.4, E + 1.3), (8.4, 12.4, E + 1.3), (11.86, 12.3, E + 1.3), 56),
    ("master", 6, (4.45, 15.5, E + 1.35), (1.0, 12.9, E + 0.95), (3.6, 14.6, E + 1.3), (1.0, 12.9, E + 0.95), 58),
    ("balcony", 9, (8.0, 14.6, E + 1.6), (8.0, 19.5, E + 1.0), (8.0, 18.2, E + 1.6), (3.0, 60.0, E - 8.0), 66),
    ("swing", 6, (7.4, 16.6, E + 1.6), (11.5, 18.9, E + 0.9), (8.6, 17.2, E + 1.5), (11.5, 18.9, E + 0.9), 64),
]


# HAVEN_STILLS=1: one frame per studio camera view instead of the cinematic (quick design checks)
STILLS = os.environ.get("HAVEN_STILLS") == "1"


def studio_shots():
    """The website's camera views as half-second holds: three.js metres (x east, y up, z south)."""
    with open(os.path.join(HERE, "export", "cameras.json"), encoding="utf8") as f:
        views = json.load(f)
    shots = []
    for v in views:
        p = (v["pos"][0], v["pos"][2], v["pos"][1])
        l = (v["look"][0], v["look"][2], v["look"][1])
        shots.append((v["name"], 0.5, p, l, p, l, v.get("fov", 64)))
    return shots


def cm(p):
    return unreal.Vector(p[0] * 100.0, p[1] * 100.0, p[2] * 100.0)


def look_rot(frm, to):
    return unreal.MathLibrary.find_look_at_rotation(cm(frm), cm(to))


def focal(vfov):
    return SENSOR_H / (2 * math.tan(math.radians(vfov) / 2))


def key_transform(section, frame, loc, rot):
    channels = section.get_all_channels()  # loc x y z, rot x y z, scale x y z
    vals = [loc.x, loc.y, loc.z, rot.roll, rot.pitch, rot.yaw, 1.0, 1.0, 1.0]
    for ch, v in zip(channels, vals):
        ch.add_key(unreal.FrameNumber(frame), v, interpolation=unreal.MovieSceneKeyInterpolation.AUTO)


def main():
    les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
    les.load_level(LEVEL)
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    tools = unreal.AssetToolsHelpers.get_asset_tools()
    path = f"{CINE_DIR}/LS_Haven"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        unreal.EditorAssetLibrary.delete_asset(path)
    seq = tools.create_asset("LS_Haven", CINE_DIR, unreal.LevelSequence, unreal.LevelSequenceFactoryNew())
    shots = studio_shots() if STILLS else SHOTS
    seq.set_display_rate(unreal.FrameRate(FPS, 1))
    cuts = seq.add_track(unreal.MovieSceneCameraCutTrack)
    frame = 0
    for name, secs, p0, l0, p1, l1, fov in shots:
        n = max(1, int(secs * FPS))
        cam = eas.spawn_actor_from_class(unreal.CineCameraActor, cm(p0), look_rot(p0, l0))
        cam.set_actor_label(f"Cam_{name}")
        cc = cam.get_cine_camera_component()
        cc.set_editor_property("current_focal_length", focal(fov))
        cc.set_editor_property("current_aperture", 4.0)
        fs = cc.get_editor_property("focus_settings")
        fs.set_editor_property("focus_method", unreal.CameraFocusMethod.DISABLE)
        cc.set_editor_property("focus_settings", fs)
        binding = seq.add_possessable(cam)
        track = binding.add_track(unreal.MovieScene3DTransformTrack)
        section = track.add_section()
        section.set_range(frame, frame + n)
        key_transform(section, frame, cm(p0), look_rot(p0, l0))
        key_transform(section, frame + n, cm(p1), look_rot(p1, l1))
        cut = cuts.add_section()
        cut.set_range(frame, frame + n)
        cut.set_camera_binding_id(binding.get_binding_id())
        frame += n
    seq.set_playback_start(0)
    seq.set_playback_end(frame)
    unreal.EditorAssetLibrary.save_loaded_asset(seq)
    les.save_current_level()

    # Movie Render Queue: 1080p PNG frames, temporal super-sampling, Lumen on
    qs = unreal.get_editor_subsystem(unreal.MoviePipelineQueueSubsystem)
    queue = qs.get_queue()
    queue.delete_all_jobs()
    job = queue.allocate_new_job(unreal.MoviePipelineExecutorJob)
    job.job_name = "Haven cinematic"
    job.sequence = unreal.SoftObjectPath(path)
    job.map = unreal.SoftObjectPath(LEVEL)
    cfg = job.get_configuration()
    out = cfg.find_or_add_setting_by_class(unreal.MoviePipelineOutputSetting)
    out.output_resolution = unreal.IntPoint(1280, 720) if STILLS else unreal.IntPoint(1920, 1080)
    out.output_directory = unreal.DirectoryPath(os.path.join(HERE, "stills" if STILLS else "frames"))
    out.file_name_format = "haven.{frame_number}"
    out.output_frame_rate = unreal.FrameRate(FPS, 1)
    out.override_existing_output = True
    cfg.find_or_add_setting_by_class(unreal.MoviePipelineImageSequenceOutput_PNG)
    cfg.find_or_add_setting_by_class(unreal.MoviePipelineDeferredPassBase)
    aa = cfg.find_or_add_setting_by_class(unreal.MoviePipelineAntiAliasingSetting)
    aa.spatial_sample_count = 1
    aa.temporal_sample_count = 2 if STILLS else 6
    aa.override_anti_aliasing = True
    aa.anti_aliasing_method = unreal.AntiAliasingMethod.AAM_TSR
    manifest = unreal.MoviePipelineEditorLibrary.save_queue_to_manifest_file(queue)
    unreal.log(f"[haven] sequence {path}, {frame} frames; manifest: {manifest}")
    with open(os.path.join(HERE, "manifest.txt"), "w", encoding="utf8") as f:
        f.write(str(manifest))


# run from a full editor session (-ExecCmds="py render_cinematic.py"): the editor quits itself when finished
try:
    main()
except Exception:  # noqa: BLE001
    import traceback
    unreal.log_error("[haven] " + traceback.format_exc())
finally:
    unreal.SystemLibrary.quit_editor()
