# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 7)

class AddTenantToTaggings < ActiveRecord::Migration[6.0]
# ●目的：tenantカラム追加マイグレーションを定義する
# AddTenantToTaggings
#   マイグレーション用のクラス名
#   taggingsにtenantカラムを追加する処理を書く

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

  def self.up
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる

    add_column ActsAsTaggableOn.taggings_table, :tenant, :string, limit: 128
    # ●目的：taggings テーブルにテナント識別用のカラムを追加する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    # 【外部gem（acts-as-taggable-on）が管理する taggings テーブル】
    # 【タグと対象モデルの関連情報を管理するためのテーブル】
    # カラム名：tenant【テナント識別子。組織や環境を区別するための値】
    # 型：string(128)【最大128文字の文字列。DBでは VARCHAR(128)】
    # 運用想定：全検索条件に必須。異なる tenant 間でデータは共有しない
    # add_column【既存テーブルに新しいカラムを追加する命令】

    add_index ActsAsTaggableOn.taggings_table, :tenant unless index_exists? ActsAsTaggableOn.taggings_table, :tenant
    # ●目的：tenant カラム検索時のパフォーマンスを向上させる
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    # 【外部gem（acts-as-taggable-on）が管理する taggings テーブル】
    # 【タグと対象モデルの関連情報を管理するためのテーブル】
    # index_exists? + unless【既存インデックスがある場合のエラー防止】
  end

  def self.down
    # ●目的：マイグレーションを取り消し、DB構造を元に戻す
    # rails db:rollback 実行時に呼ばれる

    remove_index ActsAsTaggableOn.taggings_table, :tenant
    # ●目的：tenant カラムのインデックスを削除する
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    # 【外部gem（acts-as-taggable-on）が管理する taggings テーブル】
    # 【タグと対象モデルの関連情報を管理するためのテーブル】
    # 【カラム削除前にインデックスを削除するのが基本手順】

    remove_column ActsAsTaggableOn.taggings_table, :tenant
    # ●目的：tenant カラム自体を削除し、変更前の状態に戻す
    # 対象テーブル：ActsAsTaggableOn.taggings_table
    # 【外部gem（acts-as-taggable-on）が管理する taggings テーブル】
    # 【タグと対象モデルの関連情報を管理するためのテーブル】
  end
end
