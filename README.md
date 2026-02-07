# Advanced Community Site

## 概要
このアプリケーションは高機能コミュニティサイトのひな形です。

## 実装済み機能

### ユーザー機能
- ✅ ユーザー登録・ログイン・ログアウト（Devise）
- ✅ ゲストログイン機能
- ✅ ユーザー検索機能
- ✅ ユーザー管理機能（管理者）

### 投稿機能
- ✅ 投稿の作成・編集・削除
- ✅ 投稿の公開・下書き設定
- ✅ 投稿のキーワード検索
- ✅ 投稿のタグ検索
- ✅ 投稿のソート機能

### コメント機能
- ✅ コメントの作成・削除
- ✅ コメント管理機能（管理者）

### いいね（ブックマーク）機能
- ✅ いいね機能
- ✅ いいね一覧表示

### グループ（ジャンル）機能
- ✅ グループの作成・編集・削除
- ✅ グループへの参加・退出
- ✅ グループ別投稿表示

## 開発環境
- Ruby
- Rails
- SQLite3（開発環境）

## セットアップ

```bash
# データベース作成
rails db:create

# マイグレーション実行
rails db:migrate

# サンプルデータ投入
rails db:seed

# サーバー起動
rails server
```

## テストアカウント

### 管理者
- Email: admin@example.com
- Password: password

### 一般ユーザー1
- Email: user1@example.com
- Password: password

### 一般ユーザー2
- Email: user2@example.com
- Password: password

### ゲストログイン
- トップページの「ゲストログイン」ボタンをクリック

## ディレクトリ構成
- app/models - データモデル
- app/controllers - コントローラー
- app/views - ビュー
- app/services - ビジネスロジック
- app/models/concerns - モデルの共通機能
- app/form_objects - フォーム専用ロジック

## 今後の拡張案
- フォロー機能
- 通知機能
- ダイレクトメッセージ機能
- 画像アップロード機能
- プロフィール編集機能
