"""公開に必要なファイルだけを dist/ にコピーする(Netlify Drop 用)。

使い方(プロジェクト直下で):  python tools/export_public.py
inbox/ と assets/img/raw/ と tools/ は含めない。
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
INCLUDE = ["index.html", "css", "js", "assets"]
EXCLUDE_DIRS = {os.path.join(ROOT, "assets", "img", "raw")}


def main():
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    total = 0
    for item in INCLUDE:
        src = os.path.join(ROOT, item)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(DIST, item))
            total += os.path.getsize(src)
            continue
        for dirpath, dirnames, filenames in os.walk(src):
            dirnames[:] = [d for d in dirnames if os.path.join(dirpath, d) not in EXCLUDE_DIRS]
            for name in filenames:
                s = os.path.join(dirpath, name)
                d = os.path.join(DIST, os.path.relpath(s, ROOT))
                os.makedirs(os.path.dirname(d), exist_ok=True)
                shutil.copy2(s, d)
                total += os.path.getsize(s)
    print(f"dist/ に書き出しました({total / 1024 / 1024:.2f} MB)")


if __name__ == "__main__":
    main()
