class AddColumnsToUsers < ActiveRecord::Migration[6.1]
# ●目的：usersテーブルにカラムを追加するマイグレーションを定義する
# AddColumnsToUsers
#   マイグレーション用のクラス名
#   既存テーブルにカラムを追加する処理を書く

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
    # ●目的：カラム追加の処理内容を定義する
    # マイグレーションの処理内容を定義するメソッド
    # 実行時はカラム追加、巻き戻し時はカラム削除をRailsが自動判定する

    add_column :users, :name, :string
    # ●目的：ユーザーの表示名カラムを追加する
    # 対象テーブル：users
    # カラム名：name
    # 型：string(255)（最大255文字まで保存できる短い文字列）
    # 役割：ユーザーの表示名（プロフィール用）

    add_column :users, :role, :integer
    # ●目的：権限ロールカラムを追加する
    # 対象テーブル：users
    # カラム名：role
    # 型：integer（4バイト整数。保存範囲は約 -21億～+21億）
    # 役割：権限ロール（enum想定、管理者/一般など）
  end
end
