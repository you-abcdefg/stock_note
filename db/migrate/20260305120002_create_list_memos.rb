class CreateListMemos < ActiveRecord::Migration[6.1]
  def change
    create_table :list_memos do |t|
      t.references :list, null: false, foreign_key: true
      t.text :body, null: false

      t.timestamps
    end
  end
end