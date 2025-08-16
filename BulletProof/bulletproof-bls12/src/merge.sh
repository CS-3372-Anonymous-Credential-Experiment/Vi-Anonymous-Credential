python3 - <<'EOF'
import json, sys
with open("public_input.json") as f1, open("private_input.json") as f2:
    merged = {**json.load(f1), **json.load(f2)}
with open("input.json", "w") as out:
    json.dump(merged, out)
EOF