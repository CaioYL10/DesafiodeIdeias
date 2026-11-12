"""Extrai quadros de revisão do MP4 renderizado e verifica a decodificação."""
from pathlib import Path
from subprocess import run
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
ffmpeg = root / "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe"
ffprobe = root / "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe"
video = root / "CRM-CTI-Apresentacao.mp4"
times = [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 78]
sheet = Image.new("RGB", (384 * 4, 242 * 4), "#07142b")
draw = ImageDraw.Draw(sheet)

for index, second in enumerate(times):
    still = root / f"review-{second:02}.png"
    run([str(ffmpeg), "-y", "-ss", str(second), "-i", str(video),
         "-frames:v", "1", str(still), "-loglevel", "error"], check=True)
    with Image.open(still) as frame:
        frame.thumbnail((384, 216))
        x, y = (index % 4) * 384, (index // 4) * 242
        sheet.paste(frame, (x, y))
        draw.text((x + 10, y + 219), f"{second}s", fill="white")
    still.unlink()

sheet.save(root / "preview-contact-sheet.png")
result = run([str(ffprobe), "-v", "error", "-count_frames", "-select_streams", "v:0",
              "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(video)],
             check=True, capture_output=True, text=True)
frames = int(result.stdout.strip().rstrip(","))
assert frames == 2460, f"Esperados 2460 quadros; encontrados {frames}"
print(f"16 quadros de revisão extraídos; {frames} quadros decodificados.")
