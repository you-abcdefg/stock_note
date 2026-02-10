# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 3)

class AddTaggingsCounterCacheToTags < ActiveRecord::Migration[6.0]
# ●目的：タグ件数カウンタ追加マイグレーションを定義する
# AddTaggingsCounterCacheToTags
#   マイグレーション用のクラス名
#   タグの件数カウンタを追加する処理を書く

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

  # 初心者向け: tagsテーブルに件数カウンタ（taggings_count）を追加します。
  # 既存データの件数も計算して埋め直します。
  def self.up
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる

    add_column ActsAsTaggableOn.tags_table, :taggings_count, :integer, default: 0
    # ●目的：tagsテーブルに件数カウンタを追加する
    # 対象テーブル：ActsAsTaggableOn.tags_table
    # カラム名：taggings_count
    # 型：integer（4バイト整数。保存範囲は約 -21億～+21億）
    # default: 0（値を指定しない場合は0が自動で入る）

    ActsAsTaggableOn::Tag.reset_column_information
    # ●目的：新しいカラム情報を読み込み直す

    ActsAsTaggableOn::Tag.find_each do |tag|
      ActsAsTaggableOn::Tag.reset_counters(tag.id, ActsAsTaggableOn.taggings_table)
      # ●目的：既存タグの件数を再計算して保存する
    end
  end

  def self.down
    # ●目的：マイグレーションを取り消し、DB構造を元に戻す
    # rails db:rollback 実行時に呼ばれる

    remove_column ActsAsTaggableOn.tags_table, :taggings_count
    # ●目的：taggings_countカラムを削除する
    # 対象テーブル：ActsAsTaggableOn.tags_table
  end
end
