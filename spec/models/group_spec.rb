require 'rails_helper'

RSpec.describe Group, type: :model do
  it 'is valid with a unique name' do
    group = described_class.new(name: 'Ruby Group', description: 'desc')
    expect(group).to be_valid
  end

  it 'is invalid without name' do
    group = described_class.new(name: nil)
    expect(group).not_to be_valid
    expect(group.errors[:name]).to be_present
  end

  it 'is invalid with a duplicate name' do
    described_class.create!(name: 'Unique Group', description: 'desc')
    duplicate = described_class.new(name: 'Unique Group', description: 'other')

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:name]).to be_present
  end
end
