import json
import os
import time
import urllib.request
import urllib.error

BOT_TOKEN = os.environ["BOT_TOKEN"]
# Ixtiyoriy: faqat shu chat_id uchun tasdiqlash (bo'sh bo'lsa - hammasi tasdiqlanadi)
TARGET_CHAT_ID = os.environ.get("TARGET_CHAT_ID", "").strip()

API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
OFFSET_FILE = "offset.json"


def api_call(method, params=None):
    url = f"{API_URL}/{method}"
    data = json.dumps(params or {}).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP error on {method}: {e.read().decode('utf-8')}")
        return {"ok": False}


def load_offset():
    if os.path.exists(OFFSET_FILE):
        with open(OFFSET_FILE, "r") as f:
            return json.load(f).get("offset", 0)
    return 0


def save_offset(offset):
    with open(OFFSET_FILE, "w") as f:
        json.dump({"offset": offset}, f)


def main():
    offset = load_offset()

    result = api_call(
        "getUpdates",
        {
            "offset": offset,
            "timeout": 0,
            "allowed_updates": ["chat_join_request"],
        },
    )

    if not result.get("ok"):
        print("getUpdates failed:", result)
        return

    updates = result.get("result", [])
    print(f"{len(updates)} ta yangi update topildi")

    max_update_id = offset - 1

    for update in updates:
        update_id = update["update_id"]
        max_update_id = max(max_update_id, update_id)

        join_request = update.get("chat_join_request")
        if not join_request:
            continue

        chat_id = join_request["chat"]["id"]
        user_id = join_request["from"]["id"]
        user_name = join_request["from"].get("username") or join_request["from"].get("first_name")

        if TARGET_CHAT_ID and str(chat_id) != str(TARGET_CHAT_ID):
            print(f"Chat {chat_id} maqsad chat emas, o'tkazib yuborildi")
            continue

        approve_result = api_call(
            "approveChatJoinRequest", {"chat_id": chat_id, "user_id": user_id}
        )

        if approve_result.get("ok"):
            print(f"Tasdiqlandi: {user_name} (id={user_id}) -> chat {chat_id}")
        else:
            print(f"Xatolik: {user_name} (id={user_id}) tasdiqlanmadi: {approve_result}")

        time.sleep(0.1)  # rate limit uchun

    if updates:
        save_offset(max_update_id + 1)
        print(f"Offset yangilandi: {max_update_id + 1}")


if __name__ == "__main__":
    main()
