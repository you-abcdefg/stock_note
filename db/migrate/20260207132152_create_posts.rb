class CreatePosts < ActiveRecord::Migration[6.1]
# ●目的：postsテーブル作成マイグレーションを定義する
# CreatePosts
#   マイグレーション用のクラス名
#   慣例として「Create + テーブル名（複数形）」で命名する
#   このクラスに posts テーブル作成の処理を書く

# <
#   継承を表す記号
#   ActiveRecord::Migration の機能を引き継ぐ

# ActiveRecord::Migration
#   Railsでデータベース構造を変更するための専用クラス
#   テーブル作成・削除・カラム追加などの機能を持つ

# [7.0]
#   マイグレーションのバージョン指定
#   Rails 7.0 時点のマイグレーション仕様を使用する
#   将来Railsのバージョンが上がっても挙動が変わらないように固定する

  def change
    # ●目的：テーブル作成の処理内容を定義する
    # マイグレーションの処理内容を定義するメソッド
    # 実行時はテーブル作成、巻き戻し時はテーブル削除をRailsが自動判定する

    create_table :posts do |t|
      # ●目的：postsテーブルを作成する
      # postsテーブルを新しく作成する

      t.string :title, null: false
      # ●目的：投稿タイトルを保存する
      # カラム名：title
      # 型：string(255)（最大255文字まで保存できる短い文字列）
      # null: false（空白・未入力を禁止。必ず値が必要）

      t.text :body
      # ●目的：投稿本文を保存する
      # カラム名：body
      # 型：text（文字数制限なしの長文用文字列）

      t.integer :views, null: false, default: 0
      # ●目的：閲覧数を保存する
      # カラム名：views
      # 型：integer（4バイト整数。保存範囲は約 -21億～+21億）
      # default: 0（値を指定しない場合は0が自動で入る）
      # null: false（空白・未入力を禁止）

      t.references :user, null: false, foreign_key: true
      # ●目的：投稿者を紐付ける
      # カラム名：user_id
      # 型：bigint(8バイト整数。保存範囲は約 -922京～+922京)
      # references（他のテーブルと関連づけるためのカラムを作成する）
      # null: false（投稿には必ず投稿者が必要）
      # foreign_key: true（users.id に存在する値のみ保存可能とするDB制約）

      t.timestamps
      # ●目的：作成/更新日時を自動管理する
      # カラム名：created_at
      # 型：datetime（作成日時。年月日＋時分秒）
      # カラム名：updated_at
      # 型：datetime（最終更新日時。年月日＋時分秒）
      # Railsが自動で日時を設定・更新する
    end
  end
end
