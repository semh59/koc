"""NeoWell işareti (halka + yaprak) tek geometriden SVG ve PNG simgeler üretir.
Çalıştır: python scripts/make-icons.py  (Pillow gerekir). Çıktılar depoya girer; patch-android.js res/ klasörünü kopyalar."""
import math, os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), "..")
BG, RING, LEAF = "#0F5C55", "#FFFFFF", "#8FE3CF"
# Birim daire içinde (yarıçap 1): halkanın orta çizgisi, kalınlığı ve sağ üstteki açıklık.
R, W, A0, A1 = 0.80, 0.26, -10, 280
P1, P2, H = (-0.40, 0.40), (0.46, -0.46), 0.23  # yaprak uçları ve yarı genişlik


def vesica():
    (x1, y1), (x2, y2) = P1, P2
    L = math.dist(P1, P2)
    rho = (L * L / 4 + H * H) / (2 * H)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    nx, ny = -(y2 - y1) / L, (x2 - x1) / L
    return rho, mx, my, nx, ny


def leaf_points(n=48):
    rho, mx, my, nx, ny = vesica()
    pts = []
    for side in (1, -1):
        cx, cy = mx - side * nx * (rho - H), my - side * ny * (rho - H)
        a1 = math.atan2(P1[1] - cy, P1[0] - cx)
        a2 = math.atan2(P2[1] - cy, P2[0] - cx)
        d = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
        seq = [a1 + d * i / n for i in range(n + 1)]
        if side < 0:
            seq.reverse()
        pts += [(cx + rho * math.cos(a), cy + rho * math.sin(a)) for a in seq]
    return pts


def svg_mark(s, ox, oy, ring=RING, leaf=LEAF):
    f = lambda v: f"{v:.2f}"
    p = lambda a: (ox + s * R * math.cos(math.radians(a)), oy + s * R * math.sin(math.radians(a)))
    (sx, sy), (ex, ey) = p(A0), p(A1)
    rho = vesica()[0] * s
    (ax, ay), (bx, by) = [(ox + s * x, oy + s * y) for x, y in (P1, P2)]
    return (f'<path d="M{f(sx)} {f(sy)}A{f(s*R)} {f(s*R)} 0 1 1 {f(ex)} {f(ey)}" fill="none" stroke="{ring}" stroke-width="{f(s*W)}" stroke-linecap="round"/>'
            f'<path d="M{f(ax)} {f(ay)}A{f(rho)} {f(rho)} 0 0 1 {f(bx)} {f(by)}A{f(rho)} {f(rho)} 0 0 1 {f(ax)} {f(ay)}Z" fill="{leaf}"/>')


def draw_mark(img, s, ox, oy, ring=RING, leaf=LEAF):
    d = ImageDraw.Draw(img)
    r, w = s * R, s * W
    # Pillow'un kalın arc'ı uçlarda çentik bırakıyor; halka, yol boyunca daire basılarak çizilir (uçlar kendiliğinden yuvarlak).
    n = max(64, int(r * math.radians(A1 - A0)))
    for i in range(n + 1):
        a = math.radians(A0 + (A1 - A0) * i / n)
        cx, cy = ox + r * math.cos(a), oy + r * math.sin(a)
        d.ellipse([cx - w / 2, cy - w / 2, cx + w / 2, cy + w / 2], fill=ring)
    d.polygon([(ox + s * x, oy + s * y) for x, y in leaf_points()], fill=leaf)


def render(size, bg_shape, mark_frac, ring=RING, leaf=LEAF, bg=BG):
    """bg_shape: None (saydam), 'square', 'round', 'circle'. mark_frac: işaret çapının kenara oranı."""
    k = 4
    S = size * k
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg_shape == "square":
        d.rectangle([0, 0, S, S], fill=bg)
    elif bg_shape == "round":
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.22, fill=bg)
    elif bg_shape == "circle":
        d.ellipse([0, 0, S - 1, S - 1], fill=bg)
    draw_mark(img, S * mark_frac / 2 / (R + W / 2), S / 2, S / 2, ring, leaf)
    return img.resize((size, size), Image.LANCZOS)


def save(img, *parts):
    p = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, optimize=True)


def main():
    # Uygulama içi işaret: yuvarlak köşeli kare, temadan bağımsız.
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="NeoWell">'
           f'<rect width="100" height="100" rx="22" fill="{BG}"/>{svg_mark(30, 50, 50)}</svg>\n')
    open(os.path.join(ROOT, "www", "logo.svg"), "w", encoding="utf8").write(svg)
    save(render(192, "round", 0.62), "www", "logo.png")
    save(render(1024, "round", 0.62), "assets", "logo.png")
    res = ["assets", "android", "res"]
    # Uyarlanabilir simge 108 dp; işaret güvenli bölgede (orta 66 dp) kalsın diye kenarın %50'si.
    for q, m in {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}.items():
        fg = round(108 * m)
        save(render(fg, None, 0.50), *res, f"mipmap-{q}", "ic_launcher_foreground.png")
        save(render(fg, None, 0.50, RING, RING), *res, f"mipmap-{q}", "ic_launcher_monochrome.png")
        save(render(round(48 * m), "round", 0.62).convert("RGBA"), *res, f"mipmap-{q}", "ic_launcher.png")
        save(render(round(48 * m), "circle", 0.58), *res, f"mipmap-{q}", "ic_launcher_round.png")
    # Açılış ekranı (Android 11 ve altı tam ekran; 12+ sistem ekranı renk ve simgeyi temadan alır).
    sp = {"mdpi": (320, 480), "hdpi": (480, 800), "xhdpi": (720, 1280), "xxhdpi": (960, 1600), "xxxhdpi": (1280, 1920)}
    for q, (w, h) in sp.items():
        for o, (ww, hh) in (("port", (w, h)), ("land", (h, w))):
            save(splash(ww, hh), *res, f"drawable-{o}-{q}", "splash.png")
    save(splash(480, 320), *res, "drawable", "splash.png")


def splash(w, h):
    img = Image.new("RGB", (w, h), BG)
    s = round(min(w, h) * 0.30)
    img.paste(render(s, None, 1.0), ((w - s) // 2, (h - s) // 2), render(s, None, 1.0))
    return img


if __name__ == "__main__":
    main()
