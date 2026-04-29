# テイ製作所 業務 Web（Next.js + Supabase + Cloudflare）

## 最初に読む（環境でコケない）

**Cloudflare プレビューやログインで迷ったら、ここを上から順に実行してください。**

→ **[`ENV_SETUP.md`](./ENV_SETUP.md)**（コピペ手順・失敗表・Git で上げないファイル）

---

## よく使うコマンド（`web` ディレクトリで）

| 目的 | コマンド |
|------|----------|
| ローカル開発（Next のみ） | `npm run dev` → http://localhost:3000 |
| `.dev.vars` だけ検査 | `npm run check:env` |
| Cloudflare 同梱プレビュー | `npm run preview`（**先に check:env が走ります**） |
| Cloudflare 本番デプロイ | `npm run deploy`（秘密情報は Wrangler / ダッシュボード。手順は `ENV_SETUP.md`） |

---

## ファイル雛形

| ファイル | 用途 |
|----------|------|
| [`.dev.vars.example`](./.dev.vars.example) | コピーして `.dev.vars` を作る（**Git に上げない**） |
| [`.env.local.example`](./.env.local.example) | コピーして `.env.local` を作る（`npm run dev` 用・**Git に上げない**） |

---

## 技術スタック

Next.js 16（App Router）、Supabase、OpenNext + Cloudflare Workers。詳細な実装一覧はリポジトリ直下の `IMPLEMENTATION_STATUS.md` を参照。

---

## create-next-app 由来のドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
