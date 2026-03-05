class AddMemoToListsAndListItems < ActiveRecord::Migration[6.1]
  def change
    add_column :lists, :memo, :text
    add_column :list_items, :memo, :text
  end
end