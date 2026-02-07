class Post < ApplicationRecord
  # リレーションシップ
  belongs_to :user # 投稿者
  has_many :comments, dependent: :destroy # コメント
  has_many :likes, dependent: :destroy # いいね
  has_many :liked_users, through: :likes, source: :user # いいねしたユーザー
  has_many :post_groups, dependent: :destroy # グループ紐付け
  has_many :groups, through: :post_groups # 所属グループ

  # タグ機能を有効化（acts-as-taggable-on）
  acts_as_taggable_on :tags

  # ステータス（公開・下書き）
  enum status: { draft: 0, published: 1 }

  # 検索機能（Ransack用）
  def self.ransackable_attributes(auth_object = nil)
    ["title", "body", "status", "created_at", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["user", "comments", "likes", "groups", "tags"]
  end
  belongs_to :user
end
