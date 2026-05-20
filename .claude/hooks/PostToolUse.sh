#!/bin/bash
# PostToolUse.sh
# This hook runs automatically after Claude executes a tool.
# It is highly useful for auto-updating indexes, running formatters, or linting.

TOOL_NAME="$1"
TOOL_ARGS="$2"

# 1. Tự động cập nhật GitNexus Index sau khi commit hoặc merge
if [ "$TOOL_NAME" = "Bash" ] || [ "$TOOL_NAME" = "Terminal" ]; then
    if echo "$TOOL_ARGS" | grep -qE "git commit|git merge|git rebase"; then
        echo "Detected Git state change. Auto-updating GitNexus index..."
        # Kiểm tra xem có cần dùng embeddings không bằng cách đọc meta.json
        if grep -q '"embeddings": [1-9]' .gitnexus/meta.json 2>/dev/null; then
            gitnexus analyze --embeddings
        else
            gitnexus analyze
        fi
        echo "GitNexus index updated."
    fi
fi

# 2. Bạn có thể thêm các automation khác ở đây.
# Ví dụ: Tự động format code nếu tool là EditFile
# if [ "$TOOL_NAME" = "EditFile" ]; then
#     npx prettier --write "$TOOL_ARGS"
# fi
