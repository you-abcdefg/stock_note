require 'rails_helper'

RSpec.describe PostGroup, type: :model do
  let!(:user) do
    User.create!(
      email: 'post_group_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Post Group User',
      role: :general
    )
  end
  let!(:post_record) { Post.create!(user: user, title: 'sample', body: 'body', status: :published) }
  let!(:group) { Group.create!(name: 'Post Group', description: 'desc') }

  it 'is valid with post and group' do
    relation = described_class.new(post: post_record, group: group)
    expect(relation).to be_valid
  end

  it 'is invalid without group' do
    relation = described_class.new(post: post_record, group: nil)
    expect(relation).not_to be_valid
  end
end
