# ========================================
# サンプルデータ
# ========================================

# 管理者ユーザー
admin = User.create!(
  email: 'admin@example.com',
  password: 'password',
  name: '管理者',
  role: :admin
)

# 一般ユーザー
user1 = User.create!(
  email: 'user1@example.com',
  password: 'password',
  name: 'ユーザー1',
  role: :general
)

user2 = User.create!(
  email: 'user2@example.com',
  password: 'password',
  name: 'ユーザー2',
  role: :general
)

# グループ
group1 = Group.create!(name: 'group1', description: 'description-group1')
group2 = Group.create!(name: 'group2', description: 'description-group2')
group3 = Group.create!(name: 'group3', description: 'description-group3')

# 投稿（user1: 5個）
post1 = Post.create!(
  title: 'title-post1-user1',
  body: 'body-post1-user1',
  status: :published,
  user: user1,
  tag_list: ['tag-1', 'tag-2', 'tag-3']
)

post2 = Post.create!(
  title: 'title-post2-user1',
  body: 'body-post2-user1',
  status: :published,
  user: user1,
  tag_list: ['tag-2', 'tag-4']
)

post3 = Post.create!(
  title: 'title-post3-user1',
  body: 'body-post3-user1',
  status: :published,
  user: user1,
  tag_list: ['tag-1', 'tag-5']
)

post4 = Post.create!(
  title: 'title-post4-user1',
  body: 'body-post4-user1',
  status: :draft,
  user: user1,
  tag_list: ['tag-3', 'tag-4']
)

post5 = Post.create!(
  title: 'title-post5-user1',
  body: 'body-post5-user1',
  status: :published,
  user: user1,
  tag_list: ['tag-1', 'tag-2', 'tag-5']
)

# 投稿（user2: 5個）
post6 = Post.create!(
  title: 'title-post6-user2',
  body: 'body-post6-user2',
  status: :published,
  user: user2,
  tag_list: ['tag-1', 'tag-6']
)

post7 = Post.create!(
  title: 'title-post7-user2',
  body: 'body-post7-user2',
  status: :published,
  user: user2,
  tag_list: ['tag-2', 'tag-6']
)

post8 = Post.create!(
  title: 'title-post8-user2',
  body: 'body-post8-user2',
  status: :published,
  user: user2,
  tag_list: ['tag-3', 'tag-4', 'tag-6']
)

post9 = Post.create!(
  title: 'title-post9-user2',
  body: 'body-post9-user2',
  status: :draft,
  user: user2,
  tag_list: ['tag-5', 'tag-7']
)

post10 = Post.create!(
  title: 'title-post10-user2',
  body: 'body-post10-user2',
  status: :published,
  user: user2,
  tag_list: ['tag-1', 'tag-3', 'tag-7']
)

# 投稿とグループの紐付け
PostGroup.create!(post: post1, group: group1)
PostGroup.create!(post: post2, group: group2)
PostGroup.create!(post: post3, group: group3)
PostGroup.create!(post: post4, group: group1)
PostGroup.create!(post: post5, group: group2)
PostGroup.create!(post: post6, group: group3)
PostGroup.create!(post: post7, group: group1)
PostGroup.create!(post: post8, group: group2)
PostGroup.create!(post: post9, group: group3)
PostGroup.create!(post: post10, group: group1)

# コメント
Comment.create!(body: 'comment-user2-to-post1', user: user2, post: post1)
Comment.create!(body: 'comment-user1-to-post1', user: user1, post: post1)
Comment.create!(body: 'comment-user1-to-post6', user: user1, post: post6)
Comment.create!(body: 'comment-admin-to-post3', user: admin, post: post3)

# いいね
Like.create!(user: user2, post: post1)
Like.create!(user: admin, post: post1)
Like.create!(user: admin, post: post6)
Like.create!(user: user1, post: post6)
Like.create!(user: user2, post: post3)

puts 'Seed data created successfully!'
