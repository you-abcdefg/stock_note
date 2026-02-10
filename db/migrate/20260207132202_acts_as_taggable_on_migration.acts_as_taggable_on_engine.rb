# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 1)

class ActsAsTaggableOnMigration < ActiveRecord::Migration[6.0]
# ●目的：タグ用テーブル作成マイグレーションを定義する
# ActsAsTaggableOnMigration
#   マイグレーション用のクラス名
#   タグ機能用のテーブル作成処理を書く

# <
#   継承を表す記号
#   ActiveRecord::Migration の機能を引き継ぐ

# ActiveRecord::Migration
#   Railsでデータベース構造を変更するための専用クラス
#   テーブル作成・削除・カラム追加などの機能を持つ

# [6.0]
#   マイグレーションのバージョン指定
#   Rails 6.0 時点のマイグレーション仕様を使用する
#   将来Railsのバージョンが上がっても挙動が変わらないように固定する

  # 初心者向け: タグ機能用テーブル（tags, taggings）を作成します。
  # これはタグ用gemのマイグレーションで、通常はそのまま使います。
  def self.up
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる

    create_table ActsAsTaggableOn.tags_table do |t|
      # ●目的：tagsテーブルを作成する
      # tagsテーブルを新しく作成する

      t.string :name
      # ●目的：タグ名を保存する
      # カラム名：name
      # 型：string(255)（最大255文字まで保存できる短い文字列）

      t.timestamps
      # ●目的：作成/更新日時を自動管理する
      # カラム名：created_at
      # 型：datetime（作成日時。年月日＋時分秒）
      # カラム名：updated_at
      # 型：datetime（最終更新日時。年月日＋時分秒）
      # Railsが自動で日時を設定・更新する
    end

    create_table ActsAsTaggableOn.taggings_table do |t|
      # ●目的：taggingsテーブルを作成する
      # taggingsテーブルを新しく作成する

      t.references :tag, foreign_key: { to_table: ActsAsTaggableOn.tags_table }
      # ●目的：タグIDを保存する
      # カラム名：tag_id
      # 型：bigint（環境により8バイト整数）
      # references（他のテーブルと関連づけるためのカラムを作成する）
      # foreign_key: tags テーブルへの外部キー
      # 運用想定：tenant と組み合わせて一意

      # You should make sure that the column created is
      # long enough to store the required class names.
      t.references :taggable, polymorphic: true
      # ●目的：タグ付け対象を保存する
      # カラム名：taggable_id / taggable_type
      # 役割：タグ付け対象をポリモーフィックで表す
      # 想定値：taggable_type は Post / Comment / User
      # taggable_id は taggable_type で指定されたテーブルの主キー

      t.references :tagger, polymorphic: true
      # ●目的：タグ付けした人を保存する
      # カラム名：tagger_id / tagger_type
      # 役割：タグ付けした人をポリモーフィックで表す
      # 想定値：tagger_type は User / Admin
      # tagger_id は tagger_type に対応するテーブルの主キー

      # Limit is created to prevent MySQL error on index
      # length for MyISAM table type: http://bit.ly/vgW2Ql
      t.string :context, limit: 128
      # ●目的：タグの文脈を保存する
      # カラム名：context
      # 型：string(128)（用途/文脈を短い文字列で保存）
      # 運用想定：categories / skills / moderation など用途を固定値で管理

      t.datetime :created_at
      # ●目的：タグ付け作成日時を保存する
      # カラム名：created_at
      # 型：datetime（タグ付け作成日時）
    end

        add_index ActsAsTaggableOn.taggings_table, %i[taggable_id taggable_type context],
          name: 'taggings_taggable_context_idx'
        # ●目的：対象+文脈の検索を高速化する索引を追加する
        # 対象テーブル：ActsAsTaggableOn.taggings_table
  end

  def self.down
    # ●目的：マイグレーションを取り消し、DB構造を元に戻す
    # rails db:rollback 実行時に呼ばれる

    drop_table ActsAsTaggableOn.taggings_table
    # ●目的：taggingsテーブルを削除する
    # 対象テーブル：ActsAsTaggableOn.taggings_table

    drop_table ActsAsTaggableOn.tags_table
    # ●目的：tagsテーブルを削除する
    # 対象テーブル：ActsAsTaggableOn.tags_table
  end
end
