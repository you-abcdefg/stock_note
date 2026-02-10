# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[6.1]
# ●目的：Devise用のusersテーブル作成マイグレーションを定義する
# DeviseCreateUsers
#   マイグレーション用のクラス名
#   Deviseのユーザーテーブル作成処理を書く

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

  # 初心者向け: usersテーブル（認証用）を作成するマイグレーションです。
  # change内の処理が適用され、ロールバック時は自動的に元に戻ります。
  def change
    # ●目的：マイグレーションの処理内容を定義する
    # マイグレーションの処理内容を定義するメソッド
    # 実行時はテーブル作成、巻き戻し時はテーブル削除をRailsが自動判定する

    create_table :users do |t|
      # ●目的：usersテーブルを作成する
      # 認証ユーザーの基本情報を格納するテーブル
      ## Database authenticatable
      t.string :email,              null: false, default: ""
      # ●目的：ログイン用メールアドレスを保存する
      # カラム名：email
      # 型：string(255)（最大255文字まで保存できる短い文字列）
      # null: false（必須） / default: ""（空文字を既定値）

      t.string :encrypted_password, null: false, default: ""
      # ●目的：暗号化済みパスワードを保存する
      # カラム名：encrypted_password
      # 型：string(255)（最大255文字まで保存できる短い文字列）
      # null: false（必須） / default: ""（空文字を既定値）

      ## Recoverable
      t.string   :reset_password_token
      # ●目的：パスワード再設定用トークンを保存する
      # カラム名：reset_password_token
      # 型：string(255)（トークン文字列を保存）

      t.datetime :reset_password_sent_at
      # ●目的：再設定メール送信日時を保存する
      # カラム名：reset_password_sent_at
      # 型：datetime（再設定メール送信日時）

      ## Rememberable
      t.datetime :remember_created_at
      # ●目的：ログイン保持開始日時を保存する
      # カラム名：remember_created_at
      # 型：datetime（ログイン保持開始日時）

      ## Trackable
      # t.integer  :sign_in_count, default: 0, null: false
      # t.datetime :current_sign_in_at
      # t.datetime :last_sign_in_at
      # t.string   :current_sign_in_ip
      # t.string   :last_sign_in_ip

      ## Confirmable
      # t.string   :confirmation_token
      # t.datetime :confirmed_at
      # t.datetime :confirmation_sent_at
      # t.string   :unconfirmed_email # Only if using reconfirmable

      ## Lockable
      # t.integer  :failed_attempts, default: 0, null: false # Only if lock strategy is :failed_attempts
      # t.string   :unlock_token # Only if unlock strategy is :email or :both
      # t.datetime :locked_at


      t.timestamps null: false
      # ●目的：作成/更新日時を自動管理する
      # カラム名：created_at
      # 型：datetime（作成日時。年月日＋時分秒）
      # カラム名：updated_at
      # 型：datetime（最終更新日時。年月日＋時分秒）
      # Railsが自動で日時を設定・更新する
    end

    add_index :users, :email,                unique: true
    # ●目的：emailの重複を防ぐユニーク索引を作成する
    # emailの重複を防ぐユニーク索引

    add_index :users, :reset_password_token, unique: true
    # ●目的：reset_password_tokenの重複を防ぐユニーク索引を作成する
    # reset_password_tokenの重複を防ぐユニーク索引
    # add_index :users, :confirmation_token,   unique: true
    # add_index :users, :unlock_token,         unique: true
  end
end
