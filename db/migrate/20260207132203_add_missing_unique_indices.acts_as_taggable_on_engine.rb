# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 2)

class AddMissingUniqueIndices < ActiveRecord::Migration[6.0]
# ●目的：ユニーク索引追加マイグレーションを定義する
# AddMissingUniqueIndices
#   マイグレーション用のクラス名
#   不足しているユニーク索引を追加する処理を書く

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

  # 初心者向け: タグ関連テーブルにユニーク制約やインデックスを追加します。
  # up/downで適用と巻き戻しの手順が分かれています。
  def self.up
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる

# add_index ActsAsTaggableOn.tags_table, :name, unique: true
    # ●目的：tags.name の重複を防ぐユニーク索引を追加する
    # 対象テーブル：ActsAsTaggableOn.tags_table
    remove_foreign_key ActsAsTaggableOn.taggings_table, :tags
    remove_index ActsAsTaggableOn.taggings_table, :tag_id if index_exists?(ActsAsTaggableOn.taggings_table, :tag_id)
    # ●目的：旧tag_id索引が存在すれば削除する
    # 対象テーブル：ActsAsTaggableOn.taggings_table

    remove_index ActsAsTaggableOn.taggings_table, name: 'taggings_taggable_context_idx'
    # ●目的：旧複合索引を削除する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    add_index ActsAsTaggableOn.taggings_table,
              %i[tag_id taggable_id taggable_type context tagger_id tagger_type],
              unique: true, name: 'taggings_idx',
              length: { taggable_type: 191, context: 191, tagger_type: 191 }
    # ●目的：タグ付けの重複を防ぐ複合ユニーク索引を追加する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
  end

  def self.down
    # ●目的：マイグレーションを取り消し、DB構造を元に戻す
    # rails db:rollback 実行時に呼ばれる

# remove_index ActsAsTaggableOn.tags_table, :name
    # ●目的：タグ名ユニーク索引を削除する
    # 対象テーブル：ActsAsTaggableOn.tags_table

    remove_index ActsAsTaggableOn.taggings_table, name: 'taggings_idx'
    # ●目的：複合ユニーク索引を削除する
    # 対象テーブル：ActsAsTaggableOn.taggings_table

    add_index ActsAsTaggableOn.taggings_table, :tag_id unless index_exists?(ActsAsTaggableOn.taggings_table, :tag_id)
    # ●目的：旧tag_id索引を復元する
    # 対象テーブル：ActsAsTaggableOn.taggings_table

    add_index ActsAsTaggableOn.taggings_table, %i[taggable_id taggable_type context],
              name: 'taggings_taggable_context_idx'
    # ●目的：旧複合索引を復元する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
  end
end
