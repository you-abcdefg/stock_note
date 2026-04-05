require 'rails_helper'

RSpec.describe User, type: :model do
  it 'is invalid without name when role is general' do
    user = described_class.new(
      email: 'user_model_general@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: nil,
      role: :general
    )

    expect(user).not_to be_valid
    expect(user.errors[:name]).to be_present
  end

  it 'is valid without name when role is guest' do
    user = described_class.new(
      email: 'user_model_guest@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: nil,
      role: :guest
    )

    expect(user).to be_valid
  end

  describe '.guest' do
    it 'returns a persisted guest user and reuses the same record' do
      first_guest = described_class.guest
      second_guest = described_class.guest

      expect(first_guest).to be_persisted
      expect(first_guest).to eq(second_guest)
      expect(first_guest).to be_guest
      expect(first_guest.email).to eq('guest@example.com')
    end
  end
end
