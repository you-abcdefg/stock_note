# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 4)

class AddMissingTaggableIndex < ActiveRecord::Migration[6.0]
# ●目的：taggings索引追加マイグレーションを定義する
# AddMissingTaggableIndex
#   マイグレーション用のクラス名
#   taggingsの索引を追加する処理を書く

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

  # 初心者向け: taggingsテーブルに検索用のインデックスを追加します。
  # 既存環境で不足しているインデックスの補完が目的です。
  def self.up
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる

    add_index ActsAsTaggableOn.taggings_table, %i[taggable_id taggable_type context],
              name: 'taggings_taggable_context_idx'
    # ●目的：対象+文脈の検索を高速化する索引を追加する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
  end

  def self.down
    # ●目的：マイグレーションを取り消し、DB構造を元に戻す
    # rails db:rollback 実行時に呼ばれる

    remove_index ActsAsTaggableOn.taggings_table, name: 'taggings_taggable_context_idx'
    # ●目的：追加した索引を削除する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
  end
end
