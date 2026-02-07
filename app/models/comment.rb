class Comment < ApplicationRecord
  # リレーションシップ
  belongs_to :user
  belongs_to :post

  # Ransack 検索許可設定
  def self.ransackable_attributes(auth_object = nil)
    ["body", "created_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["user", "post"]
  end
  belongs_to :user
  belongs_to :post
end
