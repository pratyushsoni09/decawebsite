"""
Unreal Editor Python (imported by build_level.py): drive the exported vehicles along the traffic plan.

blender/export/traffic.json lists every vehicle (car_NNN, matching the static mesh it was exported as) with the
centre line of its road, its speed and where it starts. Each shuttles along that road and back, keeping left,
swinging through a U-turn at the ends, exactly as the website's tour animates them (src/tour/traffic.ts). The
whole plan repeats every `loop` seconds, so it becomes one looping Level Sequence, LS_Traffic, that auto-plays
in the walkthrough and under the cinematic.

Plan metres: x east, y south; Unreal centimetres: X = x·100, Y = y·100, Z up.
"""
import json
import math
import os

import unreal

CINE_DIR = "/Game/Haven/Cinematic"
FPS = 30


def length(path):
    return sum(math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]) for i in range(len(path) - 1))


def along(path, s):
    acc = 0.0
    for i in range(len(path) - 1):
        ax, az = path[i]
        bx, bz = path[i + 1]
        seg = math.hypot(bx - ax, bz - az)
        if acc + seg >= s or i == len(path) - 2:
            f = min(1.0, max(0.0, (s - acc) / seg)) if seg else 0.0
            return ax + (bx - ax) * f, az + (bz - az) * f, (bx - ax) / (seg or 1), (bz - az) / (seg or 1)
        acc += seg
    return path[0][0], path[0][1], 1.0, 0.0


def smooth(t):
    return t * t * (3 - 2 * t)


def lane_point(car, phase, L):
    forward = phase < L
    s = phase if forward else 2 * L - phase
    px, pz, tx, tz = along(car["path"], s)
    u = max(6.0, car["w"])
    e = min(abs(phase - L), phase, 2 * L - phase)
    k = smooth(e / u) if e < u else 1.0
    off = (car["w"] / 4) * (1 if forward else -1) * k
    return px + tz * off, pz - tx * off


def pose(car, phase, L):
    """(x, y) plan metres and yaw degrees (Unreal: yaw from +X towards +Y, i.e. from east towards south)."""
    P = 2 * L
    x, z = lane_point(car, phase, L)
    x1, z1 = lane_point(car, (phase + 0.4) % P, L)
    x0, z0 = lane_point(car, (phase - 0.4) % P, L)
    hx, hz = x1 - x0, z1 - z0
    if math.hypot(hx, hz) < 1e-6:
        hx, hz = 1.0, 0.0
    return x, z, math.degrees(math.atan2(hz, hx))


def sample_phases(car, L):
    """Phases worth a key over one return trip: every vertex crossing, both ways, and 1 m steps through the U-turns."""
    u = max(6.0, car["w"])
    marks = set()
    acc = 0.0
    for i in range(len(car["path"]) - 1):
        marks.add(acc)
        acc += math.hypot(car["path"][i + 1][0] - car["path"][i][0], car["path"][i + 1][1] - car["path"][i][1])
    marks.add(L)
    out = set()
    for m in marks:
        out.add(m)
        out.add(2 * L - m)
    for centre in (0.0, L, 2 * L):
        d = -u
        while d <= u:
            ph = centre + d
            if 0 <= ph <= 2 * L:
                out.add(ph)
            d += 1.0
    return sorted(out)


def build_traffic(level_sequence_path, plan_path, actors_by_label, les):
    with open(plan_path, encoding="utf8") as f:
        plan = json.load(f)
    loop = plan["loop"]
    tools = unreal.AssetToolsHelpers.get_asset_tools()
    path = f"{CINE_DIR}/LS_Traffic"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        unreal.EditorAssetLibrary.delete_asset(path)
    seq = tools.create_asset("LS_Traffic", CINE_DIR, unreal.LevelSequence, unreal.LevelSequenceFactoryNew())
    seq.set_display_rate(unreal.FrameRate(FPS, 1))
    seq.set_playback_start(0)
    seq.set_playback_end(loop * FPS)
    keyed = 0
    missing = 0
    for car in plan["cars"]:
        actor = actors_by_label.get(car["name"])
        if actor is None:
            missing += 1
            continue
        L = length(car["path"])
        if L < 1:
            continue
        P = 2 * L
        speed = car["speed"]
        binding = seq.add_possessable(actor)
        track = binding.add_track(unreal.MovieScene3DTransformTrack)
        section = track.add_section()
        section.set_range(0, loop * FPS)
        channels = section.get_all_channels()  # loc x y z, rot x y z, scale x y z
        cx, cy, cz, _rx, _ry, ryaw = channels[0], channels[1], channels[2], channels[3], channels[4], channels[5]
        # the phases at which this car wants a key, turned into times over the loop (its cycle divides the loop)
        phases = sample_phases(car, L)
        cycle = P / speed
        times = []
        n_cycles = max(1, int(round(loop / cycle)))
        for c in range(n_cycles):
            for ph in phases:
                t = ((ph - car["s0"]) % P) / speed + c * cycle
                if 0 <= t < loop:
                    times.append((t, ph))
        times.sort()
        last_yaw = None
        for t, ph in times:
            x, y, yaw = pose(car, ph, L)
            if last_yaw is not None:
                # unwrap so the car never spins the long way round between keys
                while yaw - last_yaw > 180:
                    yaw -= 360
                while yaw - last_yaw < -180:
                    yaw += 360
            last_yaw = yaw
            frame = unreal.FrameNumber(int(round(t * FPS)))
            cx.add_key(frame, x * 100.0, interpolation=unreal.MovieSceneKeyInterpolation.LINEAR)
            cy.add_key(frame, y * 100.0, interpolation=unreal.MovieSceneKeyInterpolation.LINEAR)
            cz.add_key(frame, 0.0, interpolation=unreal.MovieSceneKeyInterpolation.LINEAR)
            ryaw.add_key(frame, yaw, interpolation=unreal.MovieSceneKeyInterpolation.LINEAR)
            keyed += 1
    unreal.EditorAssetLibrary.save_loaded_asset(seq)
    # an actor that plays it on its own, looping, in the walkthrough and under the cinematic
    eas = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    player = eas.spawn_actor_from_class(unreal.LevelSequenceActor, unreal.Vector(0, 0, 0))
    player.set_actor_label("Traffic")
    player.set_sequence(seq)
    settings = player.get_editor_property("playback_settings")
    settings.set_editor_property("auto_play", True)
    settings.set_editor_property("loop_count", unreal.MovieSceneSequenceLoopCount(value=-1))
    player.set_editor_property("playback_settings", settings)
    unreal.log(f"[haven] traffic: {len(plan['cars']) - missing} vehicles keyed ({keyed} keys), {missing} without a mesh; loop {loop} s")
    return seq
