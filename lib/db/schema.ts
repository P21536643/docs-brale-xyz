import { pgTable, text, timestamp, boolean, serial, numeric, integer } from 'drizzle-orm/pg-core'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('userId').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').notNull().primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').notNull().primaryKey(),
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
})

// M-Pesa tables
export const transactions = pgTable('transactions', {
  id: serial('id').notNull().primaryKey(),
  userId: text('userId').notNull(),
  requestId: text('requestId').notNull().unique(),
  phoneNumber: text('phoneNumber').notNull(),
  amount: numeric('amount').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  mpesaReceiptNumber: text('mpesaReceiptNumber'),
  errorCode: text('errorCode'),
  errorMessage: text('errorMessage'),
  initiatedAt: timestamp('initiatedAt').notNull().defaultNow(),
  completedAt: timestamp('completedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const paymentCallbacks = pgTable('payment_callbacks', {
  id: serial('id').notNull().primaryKey(),
  requestId: text('requestId').notNull(),
  resultCode: integer('resultCode'),
  resultDesc: text('resultDesc'),
  mpesaReceiptNumber: text('mpesaReceiptNumber'),
  amount: numeric('amount'),
  transactionDate: timestamp('transactionDate'),
  phoneNumber: text('phoneNumber'),
  receivedAt: timestamp('receivedAt').notNull().defaultNow(),
  rawResponse: text('raw_response'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Mining tables
export const miningAccounts = pgTable('mining_accounts', {
  id: serial('id').notNull().primaryKey(),
  userId: text('userId').notNull().unique(),
  base44AccountId: text('base44AccountId').notNull().unique(),
  miningAddress: text('miningAddress').notNull(),
  poolAddress: text('poolAddress'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const miningStats = pgTable('mining_stats', {
  id: serial('id').notNull().primaryKey(),
  miningAccountId: integer('miningAccountId').notNull(),
  hashRate: numeric('hashRate'),
  shares: integer('shares').default(0),
  validShares: integer('validShares').default(0),
  invalidShares: integer('invalidShares').default(0),
  difficulty: numeric('difficulty'),
  pendingRewards: numeric('pendingRewards').default(0),
  totalEarned: numeric('totalEarned').default(0),
  totalPaid: numeric('totalPaid').default(0),
  lastUpdate: timestamp('lastUpdate').defaultNow(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const miningWithdrawals = pgTable('mining_withdrawals', {
  id: serial('id').notNull().primaryKey(),
  userId: text('userId').notNull(),
  miningAccountId: integer('miningAccountId').notNull(),
  amountIsiolocoin: numeric('amountIsiolocoin').notNull(),
  amountKES: numeric('amountKES').notNull(),
  phoneNumber: text('phoneNumber').notNull(),
  mpesaTransactionId: text('mpesaTransactionId'),
  status: text('status').notNull().default('pending'),
  requestedAt: timestamp('requestedAt').notNull().defaultNow(),
  processedAt: timestamp('processedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
