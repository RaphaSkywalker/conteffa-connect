
import os

path = r'c:\Users\RaphaSkywalker\.gemini\antigravity\scratch\conteffa-connect\src\pages\admin\Dashboard.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Detect the block we want to fix
    if i == 3920: # Around this line
        print(f"Line {i+1}: {line}")
    
    # We want to remove the extra divs around 3923 and 3951
    # This is risky based on line numbers if previous edits changed them.
    # So we search for patterns.
    new_lines.append(line)

# Let's try to find the specific pattern of 5 divs in a row or similar
content = "".join(lines)

# Fix the excel duplication if it still exists (though it looked ok in view_file)
content = content.replace('const dataToExport = inscricoes.map((insc: any) => ({\n                const dataToExport = inscricoes.map((insc: any) => ({', 'const dataToExport = inscricoes.map((insc: any) => ({')

# Fix the div balance at the end of the modal column
# We had:
# 3919: </div>
# 3920: </div>
# 3921: </div>
# 3922: </div>
# 3923: </div> <-- Probably extra
# 3924: \n
# 3925: <div buttons>

import re

# This regex finds the 5 closing divs and reduces them to 4 if followed by the buttons div
content = re.sub(r'(</div>\s+){5}(\s+<div className="flex justify-between items-center pt-6 border-t border-white/5">)', r'</div>\n                                                                </div>\n                                                            </div>\n                                                        </div>\n\n                                                        <div className="flex justify-between items-center pt-6 border-t border-white/5">', content)

# Also fix the extra div before DialogContent
# content = re.sub(r'</div>\s+\)}\s+</div>\s+<DialogContent', r'</div>\n                                                )}\n                                            <DialogContent', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
