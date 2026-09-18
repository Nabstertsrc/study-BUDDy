from pathlib import Path
import re
p = Path(r"C:\Users\Administrator\Documents\study-BUDDy\src\Layout.jsx")
t = p.read_text(encoding="utf-8")
t = t.replace("\u00a9", "(c)")
t = re.sub(r">.{0,4}2026 Nabster Tsr<", ">(c) 2026 Nabster Tsr<", t)
t = re.sub(r"className=\"text-emerald-500\">.{0,4} System Active<", 'className="text-emerald-500">System Active<', t)
p.write_text(t, encoding="utf-8", newline="\n")
print("layout done")
for i,l in enumerate(t.splitlines(),1):
    if "2026" in l or "System Active" in l:
        print(i, l.strip())