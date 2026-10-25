#!/usr/bin/env python3
"""
HEXCAWEB - OSINT LAB (Termux Edition)
---------------------------------------------
Enter a phone number -> full dossier appears (name, operator, circle, emails,
addresses, social profiles, devices, breaches, exposure score, related people).

DISCLAIMER: ONLY FOR DUMMY DATA & EDUCATIONAL PURPOSE. Every person in
hexcaweb_osint.db is invented. Never use OSINT on real people without consent.

Setup (Termux):
    pkg update && pkg install python -y
    python hexcaweb_osint_termux.py            # full animation
    python hexcaweb_osint_termux_v2.py --fast     # skip animation
Keep hexcaweb_osint.db in the same folder.
"""
import csv
import os
import random
import re
import shutil
import sqlite3
import sys
import time

BRAND = "HEXCAWEB"
DISCLAIMER = "ONLY FOR DUMMY DATA & EDUCATIONAL PURPOSE"
HERE = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(HERE, "hexcaweb_osint.db")
FAST = "--fast" in sys.argv or os.environ.get("HEXCAWEB_FAST") == "1"

G, LG, C, R, Y, D, B, X = ("\033[32m", "\033[92m", "\033[96m", "\033[91m",
                           "\033[93m", "\033[2m", "\033[1m", "\033[0m")
W = max(36, min(shutil.get_terminal_size((50, 24)).columns - 1, 62))


# ------------------------------------------------------------ helpers
def nap(t):
    if not FAST:
        time.sleep(t)


def out(s="", end="\n"):
    sys.stdout.write(s + end)
    sys.stdout.flush()


def clear():
    out("\033[2J\033[H", end="")


def fit(s, n):
    s = "-" if s is None else str(s)
    return s if len(s) <= n else s[: n - 1] + "~"


def typewriter(text, color=LG, delay=0.008):
    for ch in text:
        out(color + ch + X, end="")
        nap(delay)
    out()


def fmt_phone(n, cc="+91"):
    return f"{cc} {n[:5]} {n[5:]}"


def normalize_number(s):
    digits = re.sub(r"\D", "", s)
    if len(digits) > 10 and digits.startswith("91"):
        digits = digits[2:]
    return digits[-10:] if len(digits) >= 10 else digits


# ------------------------------------------------------------ visuals
LOGO = [
    "█ █ █▀▀ ▀█▀ █▀▀ ▄▀█   █ █ █▀▀ █▄▄",
    "█▀█ ██▄  █  █▄▄ █▀█   █▀█ ██▄ █▄█"
]

SUB = "H E X C A   W E B"

def matrix_rain(frames=16):
    chars = "01ABCDEF<>/\\|=+*#$%&@"
    for _ in range(frames):
        out("".join((random.choice([LG, G, D + G]) + random.choice(chars) + X)
                    if random.random() < 0.35 else " " for _ in range(W)))
        nap(0.045)


def glitch(text, p):
    return "".join(random.choice("#@%&$?!/\\") if (ch != " " and random.random() < p) else ch for ch in text)


def logo(animated=True, color=LG):
    def draw(p):
        for l in LOGO:
            out(" " * ((W - len(l)) // 2) + color + B + glitch(l, p) + X)
        out(" " * max(0, (W - len(SUB)) // 2) + C + glitch(SUB, p / 2) + X)

    if animated and not FAST:
        for p in (0.8, 0.6, 0.4, 0.25, 0.1, 0.03):
            clear()
            draw(p)
            nap(0.09)
    clear()
    draw(0)


def spinner(label, secs=0.4):
    frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    end = time.time() + (0 if FAST else secs)
    i = 0
    while time.time() < end:
        out(f"\r {C}{frames[i % len(frames)]}{X} {label}", end="")
        i += 1
        nap(0.06)
    out(f"\r {LG}[ OK ]{X} {label}".ljust(W + 12))


def bar(pct, color=LG):
    width = W - 14
    f = int(width * pct / 100)
    return f"{color}{'█' * f}{D}{'░' * (width - f)}{X} {pct:3d}%"


def animate_bar(pct, color=LG):
    steps = 0 if FAST else 12
    for i in range(1, steps + 1):
        out("\r " + bar(int(pct * i / steps), color), end="")
        nap(0.03)
    out("\r " + bar(pct, color))


def box(title, rows):
    inner = W - 2
    t = f" {title} "
    out(f"{G}┌─{LG}{B}{t}{X}{G}{'─' * max(0, inner - len(t) - 1)}┐{X}")
    for text, color in rows:
        out(f"{G}│{X} {color}{fit(text, inner - 2).ljust(inner - 2)}{X} {G}│{X}")
    out(f"{G}└{'─' * inner}┘{X}")


def footer():
    out(f"{R}{B}{('! ' + DISCLAIMER + ' !').center(W)}{X}")


def header():
    clear()
    logo(False)
    footer()
    out(f"{G}{'─' * W}{X}")


def prompt(label="hexcaweb@osint"):
    try:
        return input(f"{LG}{label}{X}{D}:~${X} ").strip()
    except EOFError:
        raise KeyboardInterrupt


# ------------------------------------------------------------ database
def connect():
    if not os.path.exists(DB_FILE):
        out(f"{R}[!] hexcaweb_osint.db not found next to this script.{X}\n    Expected: {DB_FILE}")
        sys.exit(1)
    db = sqlite3.connect(DB_FILE)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


BASE = """SELECT p.person_id, p.full_name, ph.number AS phone, c.name AS city
          FROM persons p
          JOIN phones ph ON ph.person_id = p.person_id AND ph.is_primary = 1
          LEFT JOIN addresses a ON a.person_id = p.person_id AND a.address_type = 'Home'
          LEFT JOIN cities c ON c.city_id = a.city_id"""


def find(db, kind, term):
    like = f"%{term}%"
    if kind == "name":
        sql, args = BASE + " WHERE p.full_name LIKE ? LIMIT 200", (like,)
    elif kind == "email":
        sql = BASE + " JOIN emails e ON e.person_id = p.person_id WHERE e.email LIKE ? GROUP BY p.person_id LIMIT 200"
        args = (like,)
    elif kind == "handle":
        sql = BASE + " JOIN social_profiles s ON s.person_id = p.person_id WHERE s.handle LIKE ? GROUP BY p.person_id LIMIT 200"
        args = (like,)
    elif kind == "city":
        sql, args = BASE + " WHERE c.name LIKE ? LIMIT 200", (like,)
    else:  # phone (partial)
        sql = BASE + " JOIN phones x ON x.person_id = p.person_id WHERE x.number LIKE ? GROUP BY p.person_id LIMIT 200"
        args = (like,)
    return db.execute(sql, args).fetchall()


def phone_owner(db, number):
    r = db.execute("SELECT person_id FROM phones WHERE number = ?", (number,)).fetchone()
    return r["person_id"] if r else None


def log_search(db, query, kind, hits):
    db.execute("INSERT INTO search_logs(query, search_type, hits) VALUES(?,?,?)", (query, kind, hits))
    db.commit()


def load(db, pid):
    q = lambda sql: db.execute(sql, (pid,)).fetchall()
    return {
        "p": db.execute("SELECT * FROM persons WHERE person_id=?", (pid,)).fetchone(),
        "phones": q("""SELECT ph.*, o.name op, tc.name circle FROM phones ph
                       JOIN operators o ON o.operator_id=ph.operator_id
                       JOIN telecom_circles tc ON tc.circle_id=ph.circle_id
                       WHERE ph.person_id=? ORDER BY ph.is_primary DESC"""),
        "emails": q("SELECT * FROM emails WHERE person_id=? ORDER BY is_primary DESC"),
        "addrs": q("""SELECT a.*, c.name city, s.name state FROM addresses a
                      JOIN cities c ON c.city_id=a.city_id JOIN states s ON s.state_id=c.state_id
                      WHERE a.person_id=?"""),
        "social": q("SELECT * FROM social_profiles WHERE person_id=?"),
        "job": db.execute("SELECT * FROM employment WHERE person_id=?", (pid,)).fetchone(),
        "devs": q("SELECT * FROM devices WHERE person_id=?"),
        "breach": q("""SELECT b.name, b.breach_date, b.category, e.leaked_fields FROM breach_exposures e
                       JOIN breaches b ON b.breach_id=e.breach_id WHERE e.person_id=?"""),
    }


def exposure(d):
    s = 10 + len(d["breach"]) * 25 + (10 if len(d["phones"]) > 1 else 0) \
        + (10 if any(x["platform"] == "github" for x in d["social"]) else 0) \
        + (10 if len(d["social"]) >= 4 else 0)
    return min(s, 100)


# ------------------------------------------------------------ screens
def show_profile(db, pid, via=None):
    d = load(db, pid)
    p = d["p"]
    age = int((time.time() - time.mktime(time.strptime(p["dob"], "%Y-%m-%d"))) / 31557600)
    header()
    typewriter(f">> DOSSIER #{pid:05d}  [DUMMY RECORD]", C, 0.01)
    box(fit(p["full_name"].upper(), W - 8), [
        (f"Gender/Age : {p['gender']} / {age}", LG),
        (f"DOB        : {p['dob']}", LG),
        (f"Father     : {p['father_name']}", LG),
        (f"Work       : {d['job']['occupation']} @ {d['job']['company']}", LG),
    ])
    box("PHONE NUMBERS", [
        (f"{'*' if ph['is_primary'] else ' '} {fmt_phone(ph['number'], ph['country_code'])}", LG)
        if not via or ph["number"] != via else
        (f"> {fmt_phone(ph['number'], ph['country_code'])}  <- searched", Y)
        for ph in d["phones"]
    ] + [(f"   {ph['op']} | {ph['circle']} | {ph['line_type']}"
          f"{' | WhatsApp' if ph['whatsapp'] else ''}", D + G) for ph in d["phones"]])
    box("EMAIL", [(e["email"], C) for e in d["emails"]])
    box("ADDRESS", [(f"{a['address_type']}: {a['line1']}", LG) for a in d["addrs"]] +
        [(f"      {a['city']}, {a['state']} {a['pincode']}", D + G) for a in d["addrs"]])
    box("SOCIAL PROFILES", [(f"{s['platform']:<9} @{s['handle']}", C) for s in d["social"]]
        or [("None found", D)])
    box("DEVICES / LAST SEEN", [(f"{v['model']} ({v['os']})", LG) for v in d["devs"]] +
        [(f"IP {v['last_ip']} | {v['last_seen']}", D + G) for v in d["devs"]])
    rows = []
    for b in d["breach"]:
        rows += [(f"[!] {b['name']} ({b['breach_date']})", R), (f"    leaked: {b['leaked_fields']}", Y)]
    box("BREACH RECORDS (FAKE)", rows or [("No breach records found", LG)])

    score = exposure(d)
    col = R if score >= 70 else Y if score >= 40 else LG
    out(f" {B}EXPOSURE SCORE: {col}{'HIGH' if score >= 70 else 'MEDIUM' if score >= 40 else 'LOW'}{X}")
    animate_bar(score, col)
    city_id = db.execute("SELECT city_id FROM addresses WHERE person_id=? AND address_type='Home'", (pid,)).fetchone()
    rel = db.execute("""SELECT p.full_name, ph.number FROM employment e
                        JOIN persons p ON p.person_id=e.person_id
                        JOIN phones ph ON ph.person_id=p.person_id AND ph.is_primary=1
                        JOIN addresses a ON a.person_id=p.person_id AND a.address_type='Home'
                        WHERE e.company=? AND a.city_id=? AND p.person_id!=? LIMIT 4""",
                     (d["job"]["company"], city_id["city_id"], pid)).fetchall() if city_id else []
    box("RELATED (same company + city)",
        [(f"{r['full_name']} | {fmt_phone(r['number'])}", LG) for r in rel] or [("None found", D)])
    footer()
    return [{"person_id": pid, "full_name": p["full_name"], "phone": d["phones"][0]["number"],
             "city": d["addrs"][0]["city"]}]


def scan(term):
    for label in (f"Querying index '{fit(term, 16)}'", "Correlating handles", "Scanning breach logs"):
        spinner(label, 0.3)


def phone_lookup(db):
    header()
    out(f" {C}Enter 10-digit mobile number (e.g. 9876543210){X}")
    raw = prompt("number")
    if not raw:
        return None
    num = normalize_number(raw)
    scan(num)
    if len(num) == 10:
        pid = phone_owner(db, num)
        log_search(db, num, "phone", 1 if pid else 0)
        if pid:
            res = show_profile(db, pid, via=num)
            prompt("Enter to go back")
            return res
        header()
        box("NO RECORD", [(f"{fmt_phone(num)} not in dummy DB", R),
                          ("Try a number from the demo list (menu 8).", Y)])
        prompt("Enter to go back")
        return None
    rows = find(db, "phone", num)
    log_search(db, num, "phone-partial", len(rows))
    return results(db, rows, f"Partial number: {num}")


def results(db, rows, label):
    per, page = 8, 0
    pages = max(1, (len(rows) + per - 1) // per)
    while True:
        header()
        out(f" {C}{fit(label, W - 20)}{X} {D}{len(rows)} hit(s) | page {page + 1}/{pages}{X}")
        chunk = rows[page * per:(page + 1) * per]
        lines = []
        for i, r in enumerate(chunk, 1):
            lines.append((f"{i}. {fit(r['full_name'], 20)} {fit(r['city'], W - 30)}", LG))
            lines.append((f"   {fmt_phone(r['phone'])}", D + G))
        box("RESULTS", lines or [("No records found.", R)])
        out(f" {D}[number]=open  n=next  p=prev  b=back{X}")
        c = prompt("select").lower()
        if c == "n" and page < pages - 1:
            page += 1
        elif c == "p" and page > 0:
            page -= 1
        elif c in ("b", "q", ""):
            return [dict(r) for r in rows]
        elif c.isdigit() and 1 <= int(c) <= len(chunk):
            show_profile(db, chunk[int(c) - 1]["person_id"])
            prompt("Enter to go back")


def text_search(db, kind, label):
    header()
    term = prompt(f"search {label}")
    if not term:
        return None
    scan(term)
    rows = find(db, kind, term)
    log_search(db, term, kind, len(rows))
    return results(db, rows, f"{label}: '{term}'")


def random_dossier(db):
    header()
    scan("RANDOM TARGET")
    pid = db.execute("SELECT person_id FROM persons ORDER BY RANDOM() LIMIT 1").fetchone()[0]
    res = show_profile(db, pid)
    prompt("Enter to go back")
    return res


def demo_numbers(db):
    header()
    rows = db.execute("""SELECT ph.number, p.full_name, c.name city,
                         (SELECT COUNT(*) FROM breach_exposures e WHERE e.person_id=p.person_id) nb
                         FROM phones ph JOIN persons p ON p.person_id=ph.person_id
                         LEFT JOIN addresses a ON a.person_id=p.person_id AND a.address_type='Home'
                         LEFT JOIN cities c ON c.city_id=a.city_id
                         WHERE ph.is_primary=1 AND p.person_id IN (1, 250, 4000, 12000, 24000)""").fetchall()
    box("DEMO NUMBERS (try in menu 1)",
        [(f"{r['number']}  {fit(r['full_name'], W - 24)}", LG) for r in rows] +
        [(f"   {r['city']} | breaches: {r['nb']}", D + G) for r in rows])
    footer()
    prompt("Enter to go back")


def stats(db):
    header()
    scan("database statistics")
    n = lambda t: db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    people, nb = n("persons"), db.execute("SELECT COUNT(DISTINCT person_id) FROM breach_exposures").fetchone()[0]
    box("DB OVERVIEW", [(f"People           : {people}", LG), (f"Phone numbers    : {n('phones')}", LG),
                        (f"Emails           : {n('emails')}", LG), (f"Social profiles  : {n('social_profiles')}", LG),
                        (f"Breached people  : {nb} ({nb * 100 // people}%)", R)])
    ops = db.execute("""SELECT o.name, COUNT(*) n FROM phones ph JOIN operators o ON o.operator_id=ph.operator_id
                        GROUP BY o.name ORDER BY n DESC""").fetchall()
    top = ops[0]["n"]
    box("OPERATORS", [(f"{r['name']:<7}{'█' * max(1, r['n'] * (W - 24) // top)} {r['n']}", C) for r in ops])
    cities = db.execute("""SELECT c.name, COUNT(*) n FROM addresses a JOIN cities c ON c.city_id=a.city_id
                           WHERE a.address_type='Home' GROUP BY c.name ORDER BY n DESC LIMIT 5""").fetchall()
    top = cities[0]["n"]
    box("TOP CITIES", [(f"{fit(r['name'], 10):<11}{'█' * max(1, r['n'] * (W - 28) // top)} {r['n']}", Y) for r in cities])
    footer()
    prompt("Enter to go back")


def history(db):
    header()
    rows = db.execute("SELECT * FROM search_logs ORDER BY log_id DESC LIMIT 10").fetchall()
    box("SEARCH HISTORY (last 10)",
        [(f"{r['searched_at'][5:16]} {r['search_type']:<7} {fit(r['query'], W - 34)} [{r['hits']}]", LG)
         for r in rows] or [("No searches yet", D)])
    footer()
    prompt("Enter to go back")


def export(rows):
    header()
    if not rows:
        out(f" {Y}Nothing to export. Run a search first.{X}")
    else:
        path = os.path.join(HERE, "hexcaweb_results.csv")
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(rows[0].keys())
            w.writerows([tuple(r.values()) for r in rows])
            w.writerow([])
            w.writerow([f"{BRAND} - {DISCLAIMER}"])
        spinner("Writing CSV", 0.4)
        out(f" {LG}Saved {len(rows)} row(s) -> {path}{X}")
    prompt("Enter to go back")


def intro():
    clear()
    if not FAST:
        matrix_rain()
    logo(True)
    out()
    for label in ("Loading kernel modules", "Mounting dummy database", "Arming correlation engine",
                  "Syncing breach-log scanner", "Locking disclaimer: DUMMY ONLY"):
        spinner(label, 0.35)
    out()
    box("SYSTEM READY", [("Educational OSINT lab on a FAKE database.", LG), (DISCLAIMER, R)])
    nap(0.6)


def menu():
    box("MAIN MENU", [
        ("1  PHONE LOOKUP  (number -> full info)", Y),
        ("2  Search by Name", LG),
        ("3  Search by Email", LG),
        ("4  Search by Username / Handle", LG),
        ("5  Browse by City", LG),
        ("6  Random Dossier", C),
        ("7  Database Stats", C),
        ("8  Demo Numbers", C),
        ("9  Search History", C),
        ("e  Export last results (CSV)", C),
        ("0  Exit", R),
    ])


def main():
    intro()
    db = connect()
    last = []
    while True:
        header()
        menu()
        c = prompt().lower()
        if c == "1":
            last = phone_lookup(db) or last
        elif c == "2":
            last = text_search(db, "name", "name") or last
        elif c == "3":
            last = text_search(db, "email", "email") or last
        elif c == "4":
            last = text_search(db, "handle", "username") or last
        elif c == "5":
            last = text_search(db, "city", "city") or last
        elif c == "6":
            last = random_dossier(db) or last
        elif c == "7":
            stats(db)
        elif c == "8":
            demo_numbers(db)
        elif c == "9":
            history(db)
        elif c == "e":
            export(last)
        elif c == "0":
            clear()
            logo(False, R)
            typewriter("Session closed. Stay legal. Learn ethically.", LG)
            footer()
            break


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        out(f"\n{R}[!] Interrupted. Bye.{X}")
