# 実装状況管理

最終更新: 2026-04-29

## 実装済み
- 共通レイアウト（左メニュー開閉、Fキー2回トグル、一覧の**詳細**ボタンを**先頭列（左）**に配置して詳細画面へ；**トップバーにログイン中表示とログアウト**）。**落ち着いたスレート系の配色・タイポ・フォーム・テーブル**で統一
- **ログイン**（`/login`、`POST /api/auth/login` で ID・パスワード検証；**成功時に HttpOnly セッション Cookie**（HMAC 署名・`SESSION_SECRET` 必須）、**業務 API は Cookie のみで本人特定**（`x-login-id` は信頼しない）。**パスワードは PBKDF2+ソルト**（`pbkdf2:`）、レガシー **`sha256:` は検証後にログイン時に PBKDF2 へ繰り上げ**。**owner の救済**（プレースホルダ・未設定ハッシュ時に限定的に初期化、`hashPassword` で保存）。`tei_user_name` / `tei_login_id` は表示用。**`POST /api/auth/logout` で Cookie 破棄**。画面に初期アカウント説明なし。**自分の氏名・ログインID・パスワード**は `/account`・**`GET/PATCH /api/auth/me`**（現在のパスワード必須、**ログイン ID 変更時はセッション Cookie を再発行**）。**初期管理者のシード表示名は Admin**（003・009）
- **一覧の簡易検索**（表示データに対する部分一致フィルタ：案件・顧客・納品先・見積・受注・小口受注・型工務・請求・税率・社員・抜き型/LC。検索・**新規追加**は**白いリスト枠の外**のツールバー行に配置）
- **一覧UIの統一**（行操作は先頭列 **操作**、`table-actions` 内に詳細・編集を横並び；一覧導線のボタン文言は **新規追加**（各 `/new` 画面の見出し「新規作成」は据え置き）。`screen-head`・テーブルセル等の余白を詰めて密度を揃えた）
- **一覧ページネーション**（全業務一覧・顧客詳細内サブ一覧・案件詳細タブの集計表・見積/受注/小口の明細表を含む。**50件表示**でクライアント側スライス。`ListPaginationBar`・`useListPagination`（検索文字列や案件/受注/顧客などの切替で1ページ目にリセット）。見積・受注の明細追加時の `line_no` は **全明細の最大 `line_no` + 1**（ページ分割後も重複しない）
- 案件管理（一覧、`/cases/new` で新規作成、`/cases/[caseId]` で別URLの詳細＋**下線タブ**の4タブ（見積・小口・受注・抜き型/LC）；**基本情報はラベルと入力を横並び**、**営業担当・案件種別・顧客名を1行3列**で配置、**営業担当（ユーザ）・案件種別**はプルダウン、**顧客名**は **団体名・部署の部分一致で顧客マスタ検索**（`GET /api/customers/search`）し候補から選択すると **`cases.customer_id` に紐付け**、**拠点・担当はプルダウン**（`GET /api/customer-branches` / `GET /api/customer-contacts`）。マスタ未選択時・または画面から切替時は **UUID直接入力**も可。DB は `010_cases_customer_id.sql` で `customer_id` 列追加）
- 案件参照API：`GET /api/users`（有効ユーザ一覧・案件メニュー閲覧権限）、`GET /api/case-types`（案件種別）、`GET /api/customers/search`（案件フォーム用顧客検索）
- 見積・受注・小口受注・抜き型/LC：URLクエリ `caseId` で案件プリ選択（案件詳細タブからの遷移に対応）
- **新規レコード作成の導線**：主要メニューは一覧の **新規追加** から **`/new` 専用画面**へ遷移。案件 `/cases/new`、顧客 `/customers/new`、納品先 `/delivery-destinations/new`、見積 `/estimates/new`、受注 `/orders/new`、小口 `/small-orders/new`、請求 `/invoices/new`、型工務 `/manufacturing/new`、税率 `/masters/new`、抜き型/LC `/specs/new`。案件詳細タブ内の同系リンクも **新規追加** で統一。`caseId` / `orderId` はクエリで引き継ぎ可能
- 請求・型工務一覧：受注切替時に URL `orderId` を同期
- 顧客管理（**基本は会社名・有効のみ**；**顧客部署名は拠点単位**（`customer_branches.department_name`、`011_customer_branch_department.sql`）。一覧は **詳細・編集** の2ボタン先頭列、**新規追加** はツールバー。詳細は **セグメント風の1行タブ**（`tab-strip--customer`）＋各タブで **一覧＋詳細／編集**。作成は **新規追加** 押下後にフォーム。担当者タブ：拠点は **矢印付きプルダウン**（`customer-select-field`）、**氏名欄のラベルは担当者名**（値はDB `customer_contacts.company_name`）。拠点APIは `departmentName` 対応）
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
