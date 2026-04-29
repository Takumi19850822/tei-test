# 環境変数とデプロイ（迷わない手順）

**「コミット・プッシュ」と「ログインできる環境」は別です。**  
Git に上げるのはコードだけで、**秘密情報は常に手元のファイルか Cloudflare の Secret** にだけ置きます。

---

## まずここだけ（Cloudflare プレビュー `npm run preview`）

作業ディレクトリは **`web` フォルダ**です（リポジトリの `web`）。

### 1. ファイルを作る（1回だけ）

PowerShell の例（**ご自分のパス**に合わせてリポジトリへ移動してから）:

```powershell
cd <リポジトリのパス>\web
Copy-Item -Path ".dev.vars.example" -Destination ".dev.vars" -Force
```

（すでに `.dev.vars` があるならこの手順はスキップ）

### 2. `.dev.vars` をメモ帳などで開き、次を必ず直す

| 行の名前 | やること |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase ダッシュボードの **Project URL** をそのまま貼る（`https://xxxx.supabase.co`）。**`YOUR_PROJECT` のままにしない。** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase の **Settings → API → service_role**（秘密キー）を貼る。**`your_service_role_key` のままにしない。** |

### 3. 次の行は**消さない**（重要）

```env
NEXTJS_ENV=development
```

Cloudflare では `NODE_ENV` が `production` のままなので、**この行がないと `SESSION_SECRET` 必須**になります。プレビューでパスを省きたいなら **必ず残す**。

### 4. `SESSION_SECRET` について（プレビュー）

- **`NEXTJS_ENV=development` がある → `SESSION_SECRET` は空でも・行ごと消してもログイン可能**（アプリ内の開発用キーを使います）。
- それでも入れるなら **32文字以上**の好きな文字列でよい。

### 5. プッシュ前チェック（任意だが推奨）

```powershell
cd web
npm run check:env
```

問題がなければ `OK:` と出ます。エラーなら **表示された行を直してから** `npm run preview`。

### 6. プレビュー起動

```powershell
npm run preview
```

ブラウザで開いた URL にアクセスし、ログイン。

---

## ローカルだけで試す（`npm run dev`）

Cloudflare は使わず Next だけ動かすときは **`web/.env.local`** を使います（`.dev.vars` とは別。中身の**変数名は同じ**でよい）。

```powershell
cd web
Copy-Item -Path ".env.local.example" -Destination ".env.local" -Force
```

`.env.local` を開き、`NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を埋める。  
`npm run dev` 時は `NODE_ENV=development` になるため、**`SESSION_SECRET` は未設定でも動きます**。

---

## 本番（Cloudflare に `deploy` するとき）

プレビュー用の `.dev.vars` は **デプロイバンドルにそのままは乗りません**が、**絶対に Git にコミットしないでください。**

本番の Worker には、次を **ダッシュボードまたは Wrangler** で入れます（すべて必須）。

1. `NEXT_PUBLIC_SUPABASE_URL`（`wrangler.jsonc` の `vars` に書いてある場合はそれでよい）
2. `SUPABASE_SERVICE_ROLE_KEY` → **`wrangler secret put SUPABASE_SERVICE_ROLE_KEY`**
3. `SESSION_SECRET` → **32文字以上** → **`wrangler secret put SESSION_SECRET`**

**本番では `NEXTJS_ENV=development` を Worker に設定しないでください。**（設定すると弱い既定セッションキーになります。）

---

## Git に上げてはいけないもの

- `web/.dev.vars`
- `web/.env.local`
- `web/.wrangler/`（キャッシュ）

`.gitignore` に入っています。**うっかり `git add -f` しない。**

---

## よくある失敗（これで5回止まらないように）

| 画面・ログの内容 | 原因の多く | 対処 |
|------------------|------------|------|
| `SESSION_SECRET が未設定` | `.dev.vars` に `NEXTJS_ENV=development` がない／typo | 例ファイルどおり1行追加 |
| `Pbkdf2 failed ... 100000` | （旧）Workers の Web Crypto 制限 | 最新の `web` を pull（`@noble/hashes` 対応済み） |
| GitHub push 拒否「secrets」 | 過去コミットに `.dev.vars` が入った | 履歴から削るか、GitHub の案内に従う。**これからは `.dev.vars` をコミットしない** |
| ログインはできるが DB エラー | `SUPABASE_SERVICE_ROLE_KEY` が違う・切れている | Supabase でキーを確認し `.dev.vars` を更新 |

---

## 用語

- **`.dev.vars`** … Wrangler / `npm run preview` が読む。**手元だけ。**
- **`.env.local`** … `npm run dev` が読む。**手元だけ。**
- **`check:env`** … `.dev.vars` の「空欄・プレースホルダのまま」などを起動前に検査。

迷ったら **`npm run check:env`** → 表示どおり直す → **`npm run preview`** の順で進めてください。
