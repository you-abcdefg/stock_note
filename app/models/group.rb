class Group < ApplicationRecord
  # リレーションシップ
  has_many :post_groups, dependent: :destroy
  has_many :posts, through: :post_groups # グループ内の投稿
  has_many :group_memberships, dependent: :destroy
  has_many :users, through: :group_memberships # グループメンバー

  # バリデーション
  validates :name, presence: true, uniqueness: true

  # Ransack 検索許可設定
  def self.ransackable_attributes(auth_object = nil)
    ["name", "description", "created_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["posts", "users"]
  end
end
