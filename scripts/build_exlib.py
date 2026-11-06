"""Offline catalog generation. Usage: python scripts/build_exlib.py [--check]."""
import pathlib
import shutil
import subprocess
import sys

if __name__ == "__main__":
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required to generate the catalog")
    raise SystemExit(subprocess.call([node, str(pathlib.Path(__file__).with_name("build-gym-catalog.js")), *sys.argv[1:]]))
