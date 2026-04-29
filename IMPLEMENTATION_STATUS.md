# 実装状況管理

最終更新: 2026-04-29

## 実装済み
- 共通レイアウト（左メニュー開閉、Fキー2回トグル、一覧の**詳細**ボタンを**先頭列（左）**に配置して詳細画面へ；**トップバーにログイン中表示とログアウト**）。**落ち着いたスレート系の配色・タイポ・フォーム・テーブル**で統一
- **ログイン**（`/login`、`POST /api/auth/login` で ID・パスワード検証；**成功時に HttpOnly セッション Cookie**（HMAC 署名・`SESSION_SECRET` 必須）、**業務 API は Cookie のみで本人特定**（`x-login-id` は信頼しない）。**パスワードは PBKDF2-HMAC-SHA256+ソルト**（`pbkdf2:`、**`@noble/hashes` の `pbkdf2Async` で導出**。Cloudflare Workers の `crypto.subtle` はイテレーション上限（10 万回）があり 21 万回の検証に使えないため）、レガシー **`sha256:` は検証後にログイン時に PBKDF2 へ繰り上げ**。`login_id` は**入力と異なる大文字小文字**のとき**小文字変換でも 1 回だけ再検索**（DB が `kimura` のとき `Kimura` でも可）。`tei_user_name` / `tei_login_id` は表示用。**`POST /api/auth/logout` で Cookie 破棄**。画面に初期アカウント説明なし。**自分の氏名・ログインID・パスワード**は `/account`・**`GET/PATCH /api/auth/me`**（現在のパスワード必須、**ログイン ID 変更時はセッション Cookie を再発行**）。**初期社内ログイン用 `kimura`**（PBKDF2 ハッシュのみ）は **`013_kimura_user.sql`**。**廃止したアプリユーザ `owner` は `014_remove_owner_app_user.sql` で削除**（平文パスワードはリポジトリに含めない。**ハッシュの再生成**は `web` で `npx tsx scripts/gen-password-hash.ts '<平文>'`）。DB の**アプリ用接続ユーザのパスワードを `.env` に置く必要はない**（接続は Supabase ダッシュボードの SQL Editor、または一時的な環境変数でのみ `psql` 等を想定）。**Cloudflare（`npm run preview` / deploy）では `.env.local` は読み込まれない。** `.dev.vars` に **`NEXT_PUBLIC_SUPABASE_URL`・`SUPABASE_SERVICE_ROLE_KEY`・`SESSION_SECRET`** を置く（雛形 `.dev.vars.example`）。本番 Worker は **`wrangler secret put`** 等で同様に必須。**Supabase の `users` に存在する `login_id` と正しいパスワード**が必要。**開発時（`NODE_ENV=development`）はログイン 401 で `details` とサーバーログにより「ユーザーなし / 無効 / パスワード不一致」を切り分け可能**（本番では `details` は出さない）。ログイン失敗時は API の `message`（および開発時は `details`）を画面に併記）
- **一覧の簡易検索**（表示データに対する部分一致フィルタ：案件・顧客・納品先・見積・受注・小口受注・型工務・請求・税率・社員・抜き型/LC。検索・**新規追加**は**白いリスト枠の外**のツールバー行に配置）
- **一覧UIの統一**（行操作は先頭列 **操作**、`table-actions` 内に詳細・編集を横並び；一覧導線のボタン文言は **新規追加**（各 `/new` 画面の見出し「新規作成」は据え置き）。`screen-head`・テーブルセル等の余白を詰めて密度を揃えた。**タブ**は案件詳細・顧客詳細で同一の **セグメント型 `tab-strip`**。タブ直下は **`tab-panel-toolbar`（左：一覧・編集、右：新規追加）**、顧客サブ画面は **新規追加のみ右寄せ**、その下に一覧）
- **一覧ページネーション**（全業務一覧・顧客詳細内サブ一覧・案件詳細タブの集計表・見積/受注/小口の明細表を含む。**50件表示**でクライアント側スライス。`ListPaginationBar`・`useListPagination`（検索文字列や案件/受注/顧客などの切替で1ページ目にリセット）。見積・受注の明細追加時の `line_no` は **全明細の最大 `line_no` + 1**（ページ分割後も重複しない）
- 案件管理（一覧、`/cases/new` で新規作成、`/cases/[caseId]` で別URLの詳細＋**セグメント型タブ**の4タブ（見積・小口・受注・抜き型/LC。顧客詳細と同一 `tab-strip`）。基本情報：**営業担当・案件種別・状態**を**この順で1行3列**（`case-form-row3--case-meta`）、続けて**顧客名・部署・顧客担当者名を1行3列**（`CaseCustomerRow`）。**`.case-form-row3` 共通ルール**: **1列目だけ**ラベル幅 `var(--case-form-label-w)`（11rem）、**2列目以降**は **`max-content` + `gap: 6px` でラベルを入力に密着**。顧客行のグリッドは **`1.5fr / 1fr / 1fr`**、顧客名の入力トラックは **`minmax(42ch, 1fr)`**、select/input/search は **`width: 100%; min-width: 0`**。**顧客検索の注釈**は**フォーム幅いっぱいの1行・小さめ文字**で、その下に3列。**案件詳細**の顧客関連は `setCaseRow` を**関数型更新**し、部署プルダウン選択が古い state で潰れないようにしている。**顧客名**は検索候補から選択すると `customer_id` が付与され**入力を続けても ID が消えず**部署・担当のプルダウンが使える（空に戻したときだけ紐付け解除）。**候補確定時に顧客名欄へ入るのは団体名のみ**。**`GET /api/customers/search`** は**拠点（`customer_branches`）がちょうど1件の顧客だけ**候補行に **団体名 / 部署名** を付け、拠点が複数の顧客は**団体名のみ**（部署は手で選択）。会社名オートコンプリートは **↑↓で候補移動・Enter で確定・Esc で閉じる**（ハイライト表示・`combobox`/`listbox` の ARIA 付与）。候補確定後、**拠点が1件なら部署を自動選択**し、**その拠点の担当が1名なら担当も自動選択**。**拠点が複数でも**、ユーザーが選んだ拠点の**担当が1名だけなら担当を自動選択**。**状態**は保存値 `draft` / `active` / `closed`（画面表示：下書き・アクティブ・終了、`012_case_status_normalize.sql` で旧 `in_progress`→`active`、`done`→`closed` を一括変換）。顧客名は **団体名・部署の部分一致で顧客マスタ検索**（`GET /api/customers/search`）、**部署・担当**は `GET /api/customer-branches` / `GET /api/customer-contacts`。未紐付け時は部署・担当を **無効プルダウンと案内文**で表示。**UUID の直接入力は無し**（新規顧客はマスタ登録時に拠点・担当1件ずつ必須）。**メモ**の下の**保存**は **`case-form-save-row`** で左寄せ・内容幅（グリッドで横一杯に伸びない）。DB は `010_cases_customer_id.sql` で `customer_id` 列追加）。各関連タブは **一覧・編集を左・新規追加を右**（`tab-panel-toolbar`）、その下に埋め込み一覧表）
- 案件参照API：`GET /api/users`（有効ユーザ一覧・案件メニュー閲覧権限）、`GET /api/case-types`（案件種別）、`GET /api/customers/search`（案件フォーム用顧客検索）
- 見積・受注・小口受注・抜き型/LC：URLクエリ `caseId` で案件プリ選択（案件詳細タブからの遷移に対応）
- **新規レコード作成の導線**：主要メニューは一覧の **新規追加** から **`/new` 専用画面**へ遷移。案件 `/cases/new`、顧客 `/customers/new`、納品先 `/delivery-destinations/new`、見積 `/estimates/new`、受注 `/orders/new`、小口 `/small-orders/new`、請求 `/invoices/new`、型工務 `/manufacturing/new`、税率 `/masters/new`、抜き型/LC `/specs/new`。案件詳細タブ内の同系リンクも **新規追加** で統一。`caseId` / `orderId` はクエリで引き継ぎ可能
- 請求・型工務一覧：受注切替時に URL `orderId` を同期
- 顧客管理（**`/customers/new`** で **`POST /api/customers`**：団体名に加え**拠点の部署名**・**担当者名**を必須とし、同一リクエストで `customer_branches` 1件・`customer_contacts` 1件を作成。失敗時は挿入済み行を取り消し。役職は任意（`contactPositionName`）。一覧は **詳細・編集** の2ボタン先頭列、**新規追加** はツールバー。詳細は **セグメント型タブ**＋**`tab-panel-toolbar`**。担当者タブ：**担当者名**は DB `customer_contacts.company_name`、拠点は **`customer-select-field`**。**顧客部署名は拠点単位**（`customer_branches.department_name`、`011_customer_branch_department.sql`）。拠点APIは `departmentName` 対応）
- 納品先管理（一覧/詳細、**新規は `/delivery-destinations/new`**）
- 見積（一覧/詳細、**新規は `/estimates/new`**、明細追加、合計表示）
- 受注（一覧/詳細、**新規は `/orders/new`**、明細追加、合計表示）
- 小口受注（一覧/詳細、**新規は `/small-orders/new`**、ヘッダのDB全項目、明細の追加・行保存）
- 型工務（一覧/詳細、**新規は `/manufacturing/new`**、進捗フラグ更新）
- 抜き型/LC仕様（一覧・受注選択、**新規は `/specs/new`**；既存行の全項目編集・保存、JSONはテキストエリア）
- 請求（一覧/詳細、**新規は `/invoices/new`**）
- 税率マスタ（一覧/詳細、**新規は `/masters/new`**）
- **社員管理**（左メニュー `/staff`、一覧→詳細編集、**新規は `/staff/new`（初期パスワード必須）**、詳細で**新パスワード**変更可）。API：`GET/POST /api/staff`、`PATCH /api/staff/[id]`（任意 `newPassword`）、`GET /api/user-groups`。管理者グループの **`staff` メニュー権限**は 003・006・**008** で投入
- RBAC（**セッションで確定したログイン ID** + `roles` 判定）
- 監査ログ（トリガー + 2週間保持関数）
- 楽観的ロック（主要更新系APIで`version`判定）

## 未実装
- 一覧検索UI（日付条件、AND/OR条件ビルダー）の要件完全準拠
- 税率以外のマスタ画面（**ロール割当・設定**など）の一覧→詳細化（**社員CRUDは `/staff` で実装済み**）
- 明細表の表計算キーボード仕様（矢印移動、Enter入力モード、Ctrl+F/J行追加）
- 顧客系の郵便番号からの住所自動補完（仕様書にある住所検索）

## 実装予定
- 検索UIの要件準拠（日付・項目選択・AND/OR、URL同期）
- ロール・メニュー権限の画面からの編集、各種設定マスタ
- 明細入力のスプレッドシート操作対応
