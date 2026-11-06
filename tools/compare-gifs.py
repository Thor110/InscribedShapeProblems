#!/usr/bin/env python3
"""Compare the GIFs in images/ with the versions committed in git (HEAD by default).

Used when refactoring the pages: a change that should not alter behaviour must leave
every re-recorded GIF pixel-identical.

    python3 tools/compare-gifs.py            # against HEAD
    python3 tools/compare-gifs.py <commit>
"""
import io, subprocess, sys, glob, os
from PIL import Image, ImageChops

ref = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
same = True
for path in sorted(glob.glob(os.path.join(root, 'images', '*.gif'))):
    name = os.path.relpath(path, root)
    try:
        old = Image.open(io.BytesIO(subprocess.check_output(['git', 'show', f'{ref}:{name}'], cwd=root, stderr=subprocess.DEVNULL)))
    except subprocess.CalledProcessError:
        print(f'{name}: new'); continue
    new = Image.open(path)
    if old.n_frames != new.n_frames or old.size != new.size:
        print(f'{name}: DIFFERENT ({old.n_frames} vs {new.n_frames} frames, {old.size} vs {new.size})'); same = False; continue
    diff = 0
    for i in range(new.n_frames):
        old.seek(i); new.seek(i)
        if ImageChops.difference(old.convert('RGB'), new.convert('RGB')).getbbox(): diff += 1
    print(f'{name}: {"identical" if not diff else f"DIFFERENT in {diff} of {new.n_frames} frames"}')
    same &= not diff
sys.exit(0 if same else 1)
