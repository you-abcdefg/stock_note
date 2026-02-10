# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.
#
# 初心者向け: このファイルは現在のDB構造のスナップショットです。
# 通常は直接編集せず、db/migrate のマイグレーションを追加して更新します。
# 新規環境では、この内容からDBを作成するために使われます。

ActiveRecord::Schema.define(version: 2026_02_07_132208) do # 現在のスキーマ定義

  create_table "comments", force: :cascade do |t| # コメントテーブル
    t.text "body" # コメント本文
    t.integer "user_id", null: false # コメント投稿者（users）
    t.integer "post_id", null: false # 対象投稿（posts）
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.index ["post_id"], name: "index_comments_on_post_id" # 投稿で検索するための索引
    t.index ["user_id"], name: "index_comments_on_user_id" # ユーザーで検索するための索引
  end

  create_table "group_memberships", force: :cascade do |t| # ユーザーとグループの中間テーブル
    t.integer "user_id", null: false # 所属ユーザー（users）
    t.integer "group_id", null: false # 所属グループ（groups）
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.index ["group_id"], name: "index_group_memberships_on_group_id" # グループ検索用索引
    t.index ["user_id"], name: "index_group_memberships_on_user_id" # ユーザー検索用索引
  end

  create_table "groups", force: :cascade do |t| # グループテーブル
    t.string "name" # グループ名
    t.text "description" # グループ説明
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
  end

  create_table "likes", force: :cascade do |t| # いいねテーブル
    t.integer "user_id", null: false # いいねしたユーザー（users）
    t.integer "post_id", null: false # いいね対象の投稿（posts）
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.index ["post_id"], name: "index_likes_on_post_id" # 投稿検索用索引
    t.index ["user_id"], name: "index_likes_on_user_id" # ユーザー検索用索引
  end

  create_table "post_groups", force: :cascade do |t| # 投稿とグループの中間テーブル
    t.integer "post_id", null: false # 対象投稿（posts）
    t.integer "group_id", null: false # 対象グループ（groups）
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.index ["group_id"], name: "index_post_groups_on_group_id" # グループ検索用索引
    t.index ["post_id"], name: "index_post_groups_on_post_id" # 投稿検索用索引
  end

  create_table "posts", force: :cascade do |t| # 投稿テーブル
    t.string "title" # 投稿タイトル
    t.text "body" # 投稿本文
    t.integer "status" # 状態（公開/下書きなど）
    t.integer "user_id", null: false # 投稿者（users）
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.index ["user_id"], name: "index_posts_on_user_id" # 投稿者検索用索引
  end

  create_table "taggings", force: :cascade do |t| # タグ付けテーブル
    t.integer "tag_id" # タグ（tags）
    t.string "taggable_type" # タグ付け対象の型
    t.integer "taggable_id" # タグ付け対象のID
    t.string "tagger_type" # タグ付けした人の型
    t.integer "tagger_id" # タグ付けした人のID
    t.string "context", limit: 128 # タグの用途/文脈
    t.datetime "created_at" # 作成日時
    t.string "tenant", limit: 128 # テナント識別子
    t.index ["context"], name: "index_taggings_on_context" # 文脈検索用索引
    t.index ["tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type"], name: "taggings_idx", unique: true # 重複防止
    t.index ["tag_id"], name: "index_taggings_on_tag_id" # タグ検索用索引
    t.index ["taggable_id", "taggable_type", "context"], name: "taggings_taggable_context_idx" # 対象検索用索引
    t.index ["taggable_id", "taggable_type", "tagger_id", "context"], name: "taggings_idy" # 複合検索用索引
    t.index ["taggable_id"], name: "index_taggings_on_taggable_id" # 対象ID検索用索引
    t.index ["taggable_type", "taggable_id"], name: "index_taggings_on_taggable_type_and_taggable_id" # ポリモーフィック検索用索引
    t.index ["taggable_type"], name: "index_taggings_on_taggable_type" # タイプ検索用索引
    t.index ["tagger_id", "tagger_type"], name: "index_taggings_on_tagger_id_and_tagger_type" # タガー検索用索引
    t.index ["tagger_id"], name: "index_taggings_on_tagger_id" # タガーID検索用索引
    t.index ["tagger_type", "tagger_id"], name: "index_taggings_on_tagger_type_and_tagger_id" # タガー複合索引
    t.index ["tenant"], name: "index_taggings_on_tenant" # テナント検索用索引
  end

  create_table "tags", force: :cascade do |t| # タグテーブル
    t.string "name" # タグ名
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.integer "taggings_count", default: 0 # タグの使用回数
    t.index ["name"], name: "index_tags_on_name", unique: true # タグ名の重複防止
  end

  create_table "users", force: :cascade do |t| # ユーザーテーブル
    t.string "email", default: "", null: false # ログイン用メールアドレス
    t.string "encrypted_password", default: "", null: false # 暗号化されたパスワード
    t.string "reset_password_token" # パスワード再設定トークン
    t.datetime "reset_password_sent_at" # 再設定メール送信日時
    t.datetime "remember_created_at" # ログイン保持用の記録日時
    t.datetime "created_at", precision: 6, null: false # 作成日時
    t.datetime "updated_at", precision: 6, null: false # 更新日時
    t.string "name" # 表示名
    t.integer "role" # 権限ロール（enum想定）
    t.index ["email"], name: "index_users_on_email", unique: true # メール重複防止
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true # トークン重複防止
  end

  add_foreign_key "comments", "posts" # コメントは投稿に紐付く
  add_foreign_key "comments", "users" # コメントはユーザーに紐付く
  add_foreign_key "group_memberships", "groups" # 所属はグループに紐付く
  add_foreign_key "group_memberships", "users" # 所属はユーザーに紐付く
  add_foreign_key "likes", "posts" # いいねは投稿に紐付く
  add_foreign_key "likes", "users" # いいねはユーザーに紐付く
  add_foreign_key "post_groups", "groups" # 投稿とグループを紐付ける
  add_foreign_key "post_groups", "posts" # 投稿とグループを紐付ける
  add_foreign_key "posts", "users" # 投稿はユーザーに紐付く
  add_foreign_key "taggings", "tags" # タグ付けはタグに紐付く
end
