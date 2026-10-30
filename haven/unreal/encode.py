"""
Turn the Movie Render Queue frames (unreal/frames/haven.####.png) into the site's cinematic:
public/video/haven-cinematic.mp4 (H.264, 1080p, 30 fps) plus a poster frame.

    python unreal/encode.py
"""
import glob
import os
import subprocess

import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(HERE, "frames")
OUT = os.path.join(HERE, "..", "public", "video")


def main():
    frames = sorted(glob.glob(os.path.join(FRAMES, "haven.*.png")))
    if not frames:
        raise SystemExit("no frames in unreal/frames")
    os.makedirs(OUT, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    first = int(os.path.basename(frames[0]).split(".")[1])
    pattern = os.path.join(FRAMES, "haven.%04d.png")
    mp4 = os.path.join(OUT, "haven-cinematic.mp4")
    subprocess.run([ffmpeg, "-y", "-framerate", "30", "-start_number", str(first), "-i", pattern,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", mp4], check=True)
    poster = os.path.join(OUT, "haven-cinematic.jpg")
    subprocess.run([ffmpeg, "-y", "-i", frames[len(frames) // 3], "-q:v", "3", poster], check=True)
    print(f"{len(frames)} frames -> {mp4} ({os.path.getsize(mp4) / 1e6:.1f} MB), poster {poster}")


if __name__ == "__main__":
    main()
