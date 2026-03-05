class ListItem < ApplicationRecord
  belongs_to :list
  belongs_to :post

  validates :post_id, uniqueness: { scope: :list_id }
  validates :position, numericality: { only_integer: true, greater_than: 0 }
  validates :memo, length: { maximum: 2000 }, allow_blank: true

  before_validation :assign_position, on: :create

  private

  def assign_position
    return if position.present?

    max_position = list.list_items.maximum(:position) || 0
    self.position = max_position + 1
  end
end