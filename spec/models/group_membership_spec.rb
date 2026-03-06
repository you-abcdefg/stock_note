require 'rails_helper'

RSpec.describe GroupMembership, type: :model do
  let!(:user) do
    User.create!(
      email: 'group_membership_user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'Group Membership User',
      role: :general
    )
  end
  let!(:group) { Group.create!(name: 'Model Group', description: 'desc') }

  it 'is valid with user and group' do
    membership = described_class.new(user: user, group: group)
    expect(membership).to be_valid
  end

  it 'is invalid without user' do
    membership = described_class.new(user: nil, group: group)
    expect(membership).not_to be_valid
  end
end
