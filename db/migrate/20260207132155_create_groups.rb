class CreateGroups < ActiveRecord::Migration[6.1]
# ●目的：groupsテーブル作成マイグレーションを定義する
# CreateGroups
#   マイグレーション用のクラス名
#   慣例として「Create + テーブル名（複数形）」で命名する
#   このクラスに groups テーブル作成の処理を書く

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

    create_table :groups do |t|
      # ●目的：groupsテーブルを作成する
      # groupsテーブルを新しく作成する

      t.string :name
      # ●目的：グループ名を保存する
      # カラム名：name
      # 型：string(255)（最大255文字まで保存できる短い文字列）

      t.text :description
      # ●目的：グループ説明を保存する
      # カラム名：description
      # 型：text（文字数制限なしの長文用文字列）

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
