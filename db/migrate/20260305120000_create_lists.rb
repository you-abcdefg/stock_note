class CreateLists < ActiveRecord::Migration[6.1]
  def change
    create_table :lists do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.integer :visibility, null: false, default: 0

      t.timestamps
    end
  end
end