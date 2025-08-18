# wallet.py
import argparse, json, time, os, requests, hashlib
from ecdsa import SigningKey, SECP256k1

WALLET_FILE = "wallet_keys.json"

def generate_keys():
    sk = SigningKey.generate(curve=SECP256k1)
    vk = sk.get_verifying_key()
    keys = {
        "private_key": sk.to_string().hex(),
        "public_key": vk.to_string().hex(),
        "address": hashlib.sha256(vk.to_string()).hexdigest()
    }
    with open(WALLET_FILE, "w") as f:
        json.dump(keys, f, indent=2)
    print("✅ New wallet created")
    print("Address:", keys["address"])

def load_keys():
    if not os.path.exists(WALLET_FILE):
        raise SystemExit("No wallet found. Run: python wallet.py gen")
    with open(WALLET_FILE) as f:
        return json.load(f)

def sign(private_hex: str, canonical_bytes: bytes) -> str:
    sk = SigningKey.from_string(bytes.fromhex(private_hex), curve=SECP256k1)
    return sk.sign(canonical_bytes).hex()

def send_tx(node, recipient, amount, product_id, event_type, metadata=""):
    keys = load_keys()
    payload = {
        "sender": keys["address"],
        "recipient": recipient,
        "amount": float(amount),
        "product_id": str(product_id),
        "event_type": str(event_type),
        "metadata": str(metadata),
        "timestamp": int(time.time()),
        "public_key": keys["public_key"]
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    payload["signature"] = sign(keys["private_key"], hashlib.sha256(canonical).digest())
    r = requests.post(f"{node}/transactions/new", json=payload, timeout=10)
    print("Status:", r.status_code, r.text)

def main():
    ap = argparse.ArgumentParser(description="Wallet CLI")
    sub = ap.add_subparsers(dest="cmd")

    sub.add_parser("gen", help="Generate a new wallet")

    tx = sub.add_parser("send", help="Send signed transaction")
    tx.add_argument("--node", default="http://127.0.0.1:5000")
    tx.add_argument("--to", required=True)
    tx.add_argument("--amount", required=True, type=float)
    tx.add_argument("--product", required=True)
    tx.add_argument("--event", required=True)
    tx.add_argument("--meta", default="")

    args = ap.parse_args()
    if args.cmd == "gen":
        generate_keys()
    elif args.cmd == "send":
        send_tx(args.node, args.to, args.amount, args.product, args.event, args.meta)
    else:
        ap.print_help()

if __name__ == "__main__":
    main()
