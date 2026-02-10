class CreatePostGroups < ActiveRecord::Migration[6.1]
# ●目的：post_groupsテーブル作成マイグレーションを定義する
# CreatePostGroups
#   マイグレーション用のクラス名
#   慣例として「Create + テーブル名（複数形）」で命名する
#   このクラスに post_groups テーブル作成の処理を書く

# <
#   継承を表す記号
#   ActiveRecord::Migration の機能を引き継ぐ

# ActiveRecord::Migration
#   Railsでデータベース構造を変更するための専用クラス
#   テーブル作成・削除・カラム追加などの機能を持つ

# [6.1]
#   マイグレーションのバージョン指定
#   Rails 6.1 時点のマイグレーション仕様を使用する
#   将来Railsのバージョンが上がっても挙動が変わらないように固定する

  def change
    # ●目的：テーブル作成の処理内容を定義する
    # マイグレーションの処理内容を定義するメソッド
    # 実行時はテーブル作成、巻き戻し時はテーブル削除をRailsが自動判定する

    create_table :post_groups do |t|
      # ●目的：post_groupsテーブルを作成する
      # post_groupsテーブルを新しく作成する

      t.references :post, null: false, foreign_key: true
      # ●目的：対象投稿を紐付ける
      # カラム名：post_id
      # 型：bigint（環境により8バイト整数）
      # references（他のテーブルと関連づけるためのカラムを作成する）
      # null: false（必ず対象投稿が必要）
      # foreign_key: true（posts.id に存在する値のみ保存可能とするDB制約）

      t.references :group, null: false, foreign_key: true
      # ●目的：対象グループを紐付ける
      # カラム名：group_id
      # 型：bigint（環境により8バイト整数）
      # references（他のテーブルと関連づけるためのカラムを作成する）
      # null: false（必ず対象グループが必要）
      # foreign_key: true（groups.id に存在する値のみ保存可能とするDB制約）

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
