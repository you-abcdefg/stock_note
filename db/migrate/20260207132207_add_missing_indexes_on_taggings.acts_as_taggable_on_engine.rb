# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 6)

class AddMissingIndexesOnTaggings < ActiveRecord::Migration[6.0]
# ●目的：taggings索引追加マイグレーションを定義する
# AddMissingIndexesOnTaggings
#   マイグレーション用のクラス名
#   taggingsテーブルに索引を追加する処理を書く

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

  # 初心者向け: taggingsテーブルに不足しているインデックスを追加します。
  # 検索性能や関連付けの高速化が目的です。
  def change
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる
    # change は巻き戻し時の処理をRailsが自動判定する
    add_index ActsAsTaggableOn.taggings_table, :tag_id unless index_exists? ActsAsTaggableOn.taggings_table, :tag_id
    # ●目的：タグ検索の高速化
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    add_index ActsAsTaggableOn.taggings_table, :taggable_id unless index_exists? ActsAsTaggableOn.taggings_table,
                                           :taggable_id
    # ●目的：対象ID検索の高速化
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    add_index ActsAsTaggableOn.taggings_table, :taggable_type unless index_exists? ActsAsTaggableOn.taggings_table,
                                             :taggable_type
    # ●目的：対象タイプ検索の高速化
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    add_index ActsAsTaggableOn.taggings_table, :tagger_id unless index_exists? ActsAsTaggableOn.taggings_table,
                                           :tagger_id
    # ●目的：タガー検索の高速化
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    add_index ActsAsTaggableOn.taggings_table, :context unless index_exists? ActsAsTaggableOn.taggings_table, :context
    # ●目的：文脈検索の高速化
    # 対象テーブル：ActsAsTaggableOn.taggings_table

    unless index_exists? ActsAsTaggableOn.taggings_table, %i[tagger_id tagger_type]
      add_index ActsAsTaggableOn.taggings_table, %i[tagger_id tagger_type]
      # ●目的：タガーを複合キーで検索する索引を追加する
      # 対象テーブル：ActsAsTaggableOn.taggings_table
    end

    unless index_exists? ActsAsTaggableOn.taggings_table, %i[taggable_id taggable_type tagger_id context],
                         name: 'taggings_idy'
      add_index ActsAsTaggableOn.taggings_table, %i[taggable_id taggable_type tagger_id context],
            name: 'taggings_idy'
      # ●目的：対象+タガー+文脈の複合検索用索引を追加する
      # 対象テーブル：ActsAsTaggableOn.taggings_table
    end
  end
end
