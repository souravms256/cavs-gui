# gui_node.py
from flask import Flask, jsonify, request, render_template, redirect, url_for, flash
from time import time
from urllib.parse import urlparse
import hashlib, json, requests
from ecdsa import VerifyingKey, SECP256k1, BadSignatureError

DIFFICULTY_PREFIX = "0000"
MINING_REWARD = 1.0
COINBASE = "COINBASE"

app = Flask(__name__)
app.secret_key = "change-me"

class Blockchain:
    def __init__(self):
        self.current_transactions = []
        self.chain = []
        self.nodes = set()
        self.new_block(previous_hash="1", nonce=0)  # Genesis

    # ---------- TX verification ----------
    @staticmethod
    def verify_tx(tx):
        if tx.get("sender") == COINBASE:
            return True
        required = ["sender","recipient","amount","product_id","event_type","metadata","timestamp","signature","public_key"]
        if not all(k in tx for k in required):
            return False
        try:
            # address must be sha256(pubkey)
            addr = hashlib.sha256(bytes.fromhex(tx["public_key"])).hexdigest()
            if addr != tx["sender"]:
                return False
            payload = {k: tx[k] for k in ["sender","recipient","amount","product_id","event_type","metadata","timestamp","public_key"]}
            canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
            msg_hash = hashlib.sha256(canonical).digest()
            vk = VerifyingKey.from_string(bytes.fromhex(tx["public_key"]), curve=SECP256k1)
            vk.verify(bytes.fromhex(tx["signature"]), msg_hash)
            return True
        except Exception:
            return False

    # ---------- Chain ops ----------
    def register_node(self, address):
        parsed = urlparse(address)
        if not parsed.scheme or not parsed.netloc:
            return False
        self.nodes.add(f"{parsed.scheme}://{parsed.netloc}")
        return True

    def valid_chain(self, chain):
        if not chain:
            return False
        for i in range(1, len(chain)):
            prev, curr = chain[i-1], chain[i]
            if curr["previous_hash"] != self.hash(prev):
                return False
            if not self.valid_proof(prev["proof"]["nonce"], curr["proof"]["nonce"], curr["previous_hash"], curr["merkle_root"]):
                return False
        return True

    def resolve_conflicts(self):
        new_chain = None
        max_len = len(self.chain)
        for n in list(self.nodes):
            try:
                r = requests.get(f"{n}/chain", timeout=5)
                if r.status_code != 200: continue
                data = r.json()
                if data["length"] > max_len and self.valid_chain(data["chain"]):
                    max_len = data["length"]
                    new_chain = data["chain"]
            except Exception:
                continue
        if new_chain:
            self.chain = new_chain
            self.current_transactions = []
            return True
        return False

    def new_block(self, previous_hash=None, nonce=None):
        block = {
            "index": len(self.chain) + 1,
            "timestamp": int(time()),
            "transactions": self.current_transactions,
            "merkle_root": self.merkle_root(self.current_transactions),
            "previous_hash": previous_hash or self.hash(self.chain[-1]),
            "proof": {"nonce": nonce if nonce is not None else 0},
        }
        self.current_transactions = []
        self.chain.append(block)
        return block

    def new_transaction(self, **kwargs):
        if not self.verify_tx(kwargs):
            return None
        self.current_transactions.append({
            "sender": kwargs["sender"],
            "recipient": kwargs["recipient"],
            "amount": float(kwargs["amount"]),
            "product_id": str(kwargs["product_id"]),
            "event_type": str(kwargs["event_type"]),
            "metadata": str(kwargs["metadata"]),
            "timestamp": int(kwargs["timestamp"]),
            "signature": kwargs["signature"],
            "public_key": kwargs["public_key"],
        })
        return self.last_block["index"] + 1

    @staticmethod
    def hash(block):
        return hashlib.sha256(json.dumps(block, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

    @staticmethod
    def merkle_root(txs):
        if not txs:
            return "0"*64
        level = [hashlib.sha256(json.dumps(t, sort_keys=True, separators=(",",":")).encode()).hexdigest() for t in txs]
        while len(level) > 1:
            nxt = []
            for i in range(0, len(level), 2):
                L = level[i]
                R = level[i+1] if i+1 < len(level) else L
                nxt.append(hashlib.sha256((L+R).encode()).hexdigest())
            level = nxt
        return level[0]

    @property
    def last_block(self):
        return self.chain[-1]

    def proof_of_work(self, last_nonce, prev_hash, merkle_root):
        nonce = 0
        while not self.valid_proof(last_nonce, nonce, prev_hash, merkle_root):
            nonce += 1
        return nonce

    @staticmethod
    def valid_proof(last_nonce, nonce, prev_hash, merkle_root):
        guess = f"{last_nonce}{nonce}{prev_hash}{merkle_root}".encode()
        return hashlib.sha256(guess).hexdigest().startswith(DIFFICULTY_PREFIX)

blockchain = Blockchain()

# ---------- JSON API ----------
@app.route("/transactions/new", methods=["POST"])
def api_new_transaction():
    v = request.get_json(force=True)
    needed = ["sender","recipient","amount","product_id","event_type","metadata","timestamp","signature","public_key"]
    if not all(k in v for k in needed):
        return jsonify({"error":"Missing fields"}), 400
    idx = blockchain.new_transaction(**v)
    if idx is None:
        return jsonify({"error":"Invalid signature"}), 400
    return jsonify({"message": f"Transaction will be added to Block {idx}"}), 201

@app.route("/mine", methods=["POST"])
def api_mine():
    # Add coinbase (unsigned, system)
    reward_tx = {
        "sender": COINBASE, "recipient": "miner-address",
        "amount": MINING_REWARD, "product_id": "N/A", "event_type": "MINING_REWARD",
        "metadata": "", "timestamp": int(time()), "signature": "", "public_key": ""
    }
    blockchain.current_transactions.append(reward_tx)
    last = blockchain.last_block
    nonce = blockchain.proof_of_work(last["proof"]["nonce"], blockchain.hash(last), blockchain.merkle_root(blockchain.current_transactions))
    block = blockchain.new_block(previous_hash=blockchain.hash(last), nonce=nonce)
    return jsonify({"message":"Mined", "index": block["index"], "hash": blockchain.hash(block)}), 200

@app.route("/chain", methods=["GET"])
def api_chain():
    return jsonify({"chain": blockchain.chain, "length": len(blockchain.chain)}), 200

@app.route("/nodes/register", methods=["POST"])
def api_register():
    v = request.get_json(force=True)
    nodes = v.get("nodes", [])
    if not isinstance(nodes, list) or not nodes:
        return jsonify({"error":"Provide non-empty list of node URLs"}), 400
    ok = 0
    for n in nodes:
        ok += 1 if blockchain.register_node(n) else 0
    return jsonify({"message":"Registered", "count": ok, "nodes": list(blockchain.nodes)}), 201

@app.route("/nodes/resolve", methods=["POST"])
def api_resolve():
    replaced = blockchain.resolve_conflicts()
    return jsonify({"message": "replaced" if replaced else "authoritative",
                    "length": len(blockchain.chain)}), 200

@app.route("/products/<pid>", methods=["GET"])
def api_product(pid):
    events = []
    for b in blockchain.chain:
        for tx in b["transactions"]:
            if tx.get("product_id") == pid:
                events.append({"block": b["index"], **tx})
    # also include mempool
    for tx in blockchain.current_transactions:
        if tx.get("product_id") == pid:
            events.append({"block": None, **tx})
    return jsonify({"product_id": pid, "events": events}), 200

# ---------- GUI ROUTES ----------
@app.route("/")
def dashboard():
    pending = list(blockchain.current_transactions)
    height = len(blockchain.chain)
    peers = list(blockchain.nodes)
    return render_template("dashboard.html", height=height, pending=pending, peers=peers)

@app.route("/gui/chain")
def gui_chain():
    return render_template("chain.html", chain=blockchain.chain)

@app.route("/gui/new-tx", methods=["GET", "POST"])
def gui_new_tx():
    if request.method == "POST":
        # Expect a signed payload (paste from wallet, or simple demo unsigned—reject)
        try:
            sender = request.form["sender"]
            recipient = request.form["recipient"]
            amount = float(request.form["amount"])
            product_id = request.form["product_id"]
            event_type = request.form["event_type"]
            metadata = request.form.get("metadata","")
            timestamp = int(request.form["timestamp"])
            public_key = request.form["public_key"]
            signature = request.form["signature"]
            payload = {
                "sender": sender, "recipient": recipient, "amount": amount,
                "product_id": product_id, "event_type": event_type,
                "metadata": metadata, "timestamp": timestamp,
                "public_key": public_key, "signature": signature
            }
            idx = blockchain.new_transaction(**payload)
            if idx is None:
                flash("❌ Invalid signature / payload", "error")
            else:
                flash(f"✅ Transaction accepted for block {idx}", "ok")
                return redirect(url_for("dashboard"))
        except Exception as e:
            flash(f"❌ Error: {e}", "error")
    return render_template("new_tx.html")

@app.route("/gui/mine", methods=["POST"])
def gui_mine():
    # call internal API
    r = api_mine()
    flash("⛏️ Mined a new block!", "ok")
    return redirect(url_for("dashboard"))

@app.route("/gui/peers", methods=["GET","POST"])
def gui_peers():
    if request.method == "POST":
        url = request.form.get("peer")
        if url and blockchain.register_node(url):
            flash(f"✅ Registered peer: {url}", "ok")
        else:
            flash("❌ Invalid peer URL", "error")
        return redirect(url_for("gui_peers"))
    return render_template("peers.html", peers=list(blockchain.nodes))

@app.route("/gui/resolve", methods=["POST"])
def gui_resolve():
    replaced = blockchain.resolve_conflicts()
    flash("🔁 Chain replaced via consensus" if replaced else "✅ Our chain is authoritative", "ok")
    return redirect(url_for("dashboard"))

@app.route("/gui/product", methods=["GET"])
def gui_product():
    pid = request.args.get("id", "")
    events = []
    if pid:
        data = api_product(pid).json if hasattr(api_product(pid), "json") else None
    # When calling api_product directly, we got a Flask response; just re-run logic:
    events = []
    if pid:
        for b in blockchain.chain:
            for tx in b["transactions"]:
                if tx.get("product_id") == pid:
                    events.append({"block": b["index"], **tx})
        for tx in blockchain.current_transactions:
            if tx.get("product_id") == pid:
                events.append({"block": None, **tx})
    return render_template("product.html", pid=pid, events=events)

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=5000)
    args = ap.parse_args()
    app.run(host="0.0.0.0", port=args.port, debug=True)
