# frozen_string_literal: true
# This migration comes from acts_as_taggable_on_engine (originally 5)

# This migration is added to circumvent issue #623 and have special characters
# work properly

class ChangeCollationForTagNames < ActiveRecord::Migration[6.0]
# ●目的：タグ名の照合順序変更マイグレーションを定義する
# ChangeCollationForTagNames
#   マイグレーション用のクラス名
#   タグ名の照合順序を調整する処理を書く

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

  # 初心者向け: MySQLの文字照合順序を調整するためのマイグレーションです。
  # 文字の大小や記号の扱いを正しくする目的があります。
  def up
    # ●目的：マイグレーションを適用し、DB構造を変更する
    # rails db:migrate 実行時に呼ばれる
    # MySQL使用時のみ実行される処理
    if ActsAsTaggableOn::Utils.using_mysql?
      execute("ALTER TABLE #{ActsAsTaggableOn.tags_table} MODIFY name varchar(255) CHARACTER SET utf8 COLLATE utf8_bin;")
      # ●目的：タグ名の照合順序を大文字小文字を区別する設定に変更する
      # 対象テーブル：ActsAsTaggableOn.tags_table
    end
  end
end
