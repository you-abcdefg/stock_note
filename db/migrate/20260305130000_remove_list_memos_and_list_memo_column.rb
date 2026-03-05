class RemoveListMemosAndListMemoColumn < ActiveRecord::Migration[6.1]
  def change
    remove_column :lists, :memo, :text if column_exists?(:lists, :memo)
    drop_table :list_memos, if_exists: true
  end
end