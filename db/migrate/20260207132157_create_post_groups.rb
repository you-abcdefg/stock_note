class CreatePostGroups < ActiveRecord::Migration[6.1]
  def change
    create_table :post_groups do |t|
      t.references :post, null: false, foreign_key: true
      t.references :group, null: false, foreign_key: true

      t.timestamps
    end
  end
end
