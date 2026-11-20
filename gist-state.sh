#!/data/data/com.termux/files/usr/bin/bash
# Query or update the matt-learning Gist completion state from Termux / Agent.
# Usage:
#   ./gist-state.sh              -> view raw JSON state from Gist
#   ./gist-state.sh complete foo.html
#   ./gist-state.sh uncomplete foo.html

GIST_ID="b270eaafff8dc051eca22cc33b394235"
FILENAME="matt_learning_state.json"

case "${1:-view}" in
  view|status)
    gh gist view "$GIST_ID" -f "$FILENAME"
    ;;
  complete|uncomplete)
    ACTION="$1"
    ARTICLE="$2"
    if [ -z "$ARTICLE" ]; then
      echo "Usage: $0 $ACTION <article.html>"
      exit 1
    fi
    TMP_FILE="/data/data/com.termux/files/usr/tmp/$FILENAME"
    gh gist view "$GIST_ID" -f "$FILENAME" > "$TMP_FILE"
    python3 - "$TMP_FILE" "$ACTION" "$ARTICLE" << 'PY'
import json, sys, datetime
path, action, article = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    with open(path, "r") as f:
        data = json.load(f)
except Exception:
    data = {"version": 1, "completed": {}}
comp = data.setdefault("completed", {})
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
if action == "complete":
    comp[article] = now
else:
    comp.pop(article, None)
data["updatedAt"] = now
data["completedCount"] = len(comp)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
PY
    gh gist edit "$GIST_ID" -f "$FILENAME" "$TMP_FILE"
    rm -f "$TMP_FILE"
    echo "Updated $ARTICLE ($ACTION) in Gist $GIST_ID"
    ;;
  pair-url)
    TOKEN=$(gh auth token)
    echo "https://tabletmatt100.github.io/matt-learning/#sync=${TOKEN}"
    echo "http://localhost:8080/#sync=${TOKEN}"
    ;;
  *)
    echo "Usage: $0 [view | complete <file.html> | uncomplete <file.html> | pair-url]"
    exit 1
    ;;
esac
