import {
  mysqlTable,   // function to create a table
  varchar,      // text with a max length  (like String with maxlength)
  text,         // long text               (for descriptions)
  int,          // whole number            (like Number)
  boolean,      // true or false           (like Boolean)
  timestamp,    // date and time           (like Date)
  serial,       // auto-incrementing ID    (1, 2, 3, 4 ...)
  mysqlEnum,    // one of a fixed set of values (like enum in Mongoose)
  decimal,bigint      // number with decimal places (for reward amount)
} from 'drizzle-orm/mysql-core';

// ── USERS TABLE ───────────────────────────────────────────────────────────────
// mysqlTable('table_name', { column definitions })
export const users = mysqlTable('users', {

  id: serial('id').primaryKey(),
  // serial → auto-incrementing integer (1, 2, 3...)
  // primaryKey() → this is the unique identifier for each row
  // every table needs a primary key

  name: varchar('name', { length: 50 }).notNull(),
  // varchar = text with a maximum length
  // { length: 50 } → max 50 characters (same as maxlength: 50 in Mongoose)
  

  email: varchar('email', { length: 100 }).notNull().unique(),
  // .unique() → no two users can have the same email
  // same as unique: true in Mongoose

  password: varchar('password', { length: 255 }).notNull(),
  // 255 chars because bcrypt hashed passwords are long

  phone: varchar('phone', { length: 20 }).default(''),
  // .default('') → if not provided, store empty string

  avatar: varchar('avatar', { length: 10 }).default('👤'),

  emailVerified: boolean('email_verified').default(false),
  // boolean → only true or false
  // column name in DB is 'email_verified' (snake_case)
  // JavaScript variable name is emailVerified (camelCase)
  // Drizzle handles the conversion automatically

  phoneVerified: boolean('phone_verified').default(false),

  memberSince: timestamp('member_since').defaultNow(),
  // timestamp → stores date and time
  // .defaultNow() → automatically sets to current date/time when created
  // same as default: Date.now in Mongoose

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
  // .onUpdateNow() → automatically updates timestamp whenever row changes
});

// ── ITEMS TABLE ───────────────────────────────────────────────────────────────
export const items = mysqlTable('items', {

  id: serial('id').primaryKey(),

  type: mysqlEnum('type', ['lost', 'found']).notNull(),
  // mysqlEnum → column can only be one of these exact values
  // same as enum: ['lost', 'found'] in Mongoose

  name: varchar('name', { length: 100 }).notNull(),

  category: mysqlEnum('category', [
    'electronics', 'accessories', 'documents',
    'bags', 'keys', 'clothing', 'jewelry', 'other'
  ]).notNull(),

  description: text('description').notNull(),
  // text → for longer content, no length limit needed

  location: varchar('location', { length: 255 }).notNull(),

  date: timestamp('date').notNull(),

  time: varchar('time', { length: 10 }).default(''),

  contactMethod: mysqlEnum('contact_method', ['email', 'phone', 'both'])
    .default('email'),

  reward: decimal('reward', { precision: 10, scale: 2 }).default('0'),
  // decimal for money values — precise, no floating point errors
  // precision: 10 → up to 10 digits total
  // scale: 2 → 2 decimal places (e.g. 99.99)

  currentLocation: varchar('current_location', { length: 255 }).default(''),

  status: mysqlEnum('status', ['active', 'resolved', 'expired']).default('active'),

  // Foreign key — links each item to a user
  // This is how MySQL connects related tables (unlike MongoDB which used _id refs)
  userId: int('user_id').notNull(),
  // int → whole number (stores the user's id)
  // when userId = 1, it means this item belongs to the user with id = 1

  userName: varchar('user_name', { length: 50 }).notNull(),
  // storing name directly saves an extra database query just to show it

  image: varchar('image', { length: 500 }).default(''),
  hasIdentification: boolean('has_identification').default(false),
  urgentReturn     : boolean('urgent_return').default(false),
  damagedItem      : boolean('damaged_item').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

//creating tokens table for authentication
export const tokens = mysqlTable('tokens', {
  id           : serial('id').primaryKey(),
  userId       : int('user_id').notNull(),
  refreshToken : varchar('refresh_token', { length: 512 }).notNull(),
  createdAt    : timestamp('created_at').defaultNow(),
  expiresAt    : timestamp('expires_at').notNull(),
});


//creating table for storing OTP tokens
export const emailVerifications = mysqlTable('email_verifications', {

  id: serial('id').primaryKey(),
  // auto-incrementing unique ID for each verification record

  userId: int('user_id').notNull(),
  // links this verification to a specific user
  // when userId = 3, this verification belongs to user with id = 3

  token: varchar('token', { length: 255 }).notNull(),
  // long random string used for the clickable verify link
  // e.g. /verify-email/a3f9c2b1d4e5...

  otp: varchar('otp', { length: 6 }).notNull(),
  // 6-digit code entered manually by the user
  // e.g. "483920"

  expiresAt: timestamp('expires_at').notNull(),
  // when this verification expires (15 minutes from creation)
  // after this time the OTP and link are invalid

  createdAt: timestamp('created_at').defaultNow(),
  // when this verification record was created
});


//making a table for reset/forget passoword
export const passwordResets = mysqlTable('password_resets', {
  id       : serial('id').primaryKey(),
  userId   : int('user_id').notNull(),
  token    : varchar('token', { length: 255 }).notNull(),
  otp      : varchar('otp', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});


//making a table for the matching funcationality

export const matches = mysqlTable('matches', {
  id           : serial('id').primaryKey(),
  lostItemId   : bigint('lost_item_id',  { mode: 'number', unsigned: true }).notNull().references(() => items.id, { onDelete: 'cascade' }),
  foundItemId  : bigint('found_item_id', { mode: 'number', unsigned: true }).notNull().references(() => items.id, { onDelete: 'cascade' }),
  lostUserId   : int('lost_user_id').notNull(),
  foundUserId  : int('found_user_id').notNull(),
  lostItemName : varchar('lost_item_name',  { length: 100 }).notNull(),
  foundItemName: varchar('found_item_name', { length: 100 }).notNull(),
  score        : int('score').notNull(),
  status       : mysqlEnum('status', [
    'potential', 'verification_pending', 'verification_failed',
    'request_pending', 'request_accepted', 'request_rejected', 'connected'
  ]).default('potential'),
  createdAt    : timestamp('created_at').defaultNow(),
});

export const connectionRequests = mysqlTable('connection_requests', {
  id        : serial('id').primaryKey(),
  matchId   : bigint('match_id', { mode: 'number', unsigned: true }).notNull().references(() => matches.id, { onDelete: 'cascade' }),
  fromUserId: int('from_user_id').notNull(),
  toUserId  : int('to_user_id').notNull(),
  status    : mysqlEnum('status', ['pending', 'accepted', 'rejected']).default('pending'),
  createdAt : timestamp('created_at').defaultNow(),
});

export const matchVerificationAttempts = mysqlTable('match_verification_attempts', {
  id       : serial('id').primaryKey(),
  matchId  : bigint('match_id', { mode: 'number', unsigned: true }).notNull().references(() => matches.id, { onDelete: 'cascade' }),
  userId   : int('user_id').notNull(),
  attempts : int('attempts').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const itemVerificationQuestions = mysqlTable('item_verification_questions', {
  id       : serial('id').primaryKey(),
  itemId   : bigint('item_id', { mode: 'number', unsigned: true }).notNull().references(() => items.id, { onDelete: 'cascade' }),
  userId   : int('user_id').notNull(),
  question1: varchar('question1', { length: 255 }).default(''),
  answer1  : varchar('answer1',   { length: 255 }).default(''),
  question2: varchar('question2', { length: 255 }).default(''),
  answer2  : varchar('answer2',   { length: 255 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
});