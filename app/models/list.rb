class List < ApplicationRecord
  belongs_to :user
  has_many :list_items, -> { order(:position) }, dependent: :destroy
  has_many :posts, through: :list_items

  enum visibility: { private_list: 0, public_list: 1 }

  validates :title, presence: true

  scope :viewable_by, lambda { |viewer|
    if viewer.present?
      where("visibility = ? OR user_id = ?", visibilities[:public_list], viewer.id)
    else
      where(visibility: visibilities[:public_list])
    end
  }

  def owner?(viewer)
    viewer.present? && user_id == viewer.id
  end

  def viewable_by?(viewer)
    public_list? || owner?(viewer)
  end
end