from pathlib import Path
import re

p = Path(r"C:\Users\Administrator\Documents\study-BUDDy\src\pages\Landing.jsx")
t = p.read_text(encoding="utf-8")

# Fancy punctuation -> ASCII
for a, b in {
    "\u2019": "'",
    "\u2018": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2013": "-",
    "\u2014": " - ",
    "\u00a0": " ",
    "\u00b7": "|",
}.items():
    t = t.replace(a, b)

if "Download," not in t.split("from 'lucide-react'")[0]:
    t = t.replace("  BookOpen,\n", "  BookOpen,\n  Download,\n")

old = """                <Button
                  variant=\"outline\"
                  className=\"h-12 px-6 border-slate-300 bg-white text-slate-800 font-semibold text-base rounded-xl\"
                  onClick={scrollHow}
                >
                  See how it works
                </Button>"""

new = old + """
                <a
                  href=\"/downloads/StudyBuddy-1.0.apk\"
                  download=\"StudyBuddy-1.0.apk\"
                  className=\"inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold text-base hover:bg-emerald-100 transition-colors\"
                >
                  <Download className=\"w-4 h-4\" />
                  Download Android APK
                </a>"""

if "Download Android APK" not in t:
    if old in t:
        t = t.replace(old, new, 1)
        print("CTA_OK")
    else:
        print("CTA_MISS")

t = re.sub(
    r"By Nabster Tsr.{0,100}No account needed to read this page",
    "By Nabster Tsr | Web app free | Android APK available below | No account needed to read this page",
    t,
    count=1,
)

# Ensure em dash in title becomes ASCII
t = t.replace("Study Buddy \u2014 ", "Study Buddy - ")
t = t.replace("Study Buddy — ", "Study Buddy - ")

p.write_text(t, encoding="utf-8", newline="\n")
print("aren't" in t, "Who it's for" in t, "Download Android" in t, "\ufffd" in t)
# print any non-ascii remaining in user-visible strings
for i, line in enumerate(t.splitlines(), 1):
    if any(ord(c) > 127 for c in line):
        print("NA", i, line.strip()[:120])