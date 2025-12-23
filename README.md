# Personal Finance Manager

A comprehensive personal finance web application built with Next.js, TypeScript, and Prisma. Track your income, expenses, investments, subscriptions, and more.

## Features

### 📊 Dashboard
- Summary of income, expenses, and remaining balance
- Charts: Income & Expenses over time, Spending by category
- Quick view of recent transactions
- Upcoming subscriptions with payment tracking

### 💰 Transactions
- List of all transactions (income, expenses, transfers)
- Filter by category, payee, account, or date
- Add/Edit/Delete transactions
- Automatic account balance updates

### 🏦 Accounts
- Bank accounts, credit cards, wallets, savings
- Current balances and account types
- Add/Edit/Delete accounts

### 🏷️ Categories
- Income and expense categories
- Custom categories with icons and colors
- Visual tracking with color-coded categories

### 📈 Investments
- Track stocks, crypto, mutual funds, and more
- **Automatic price fetching**: Enter a stock symbol to automatically fetch current market prices
- **Company logos**: Visual icons for your investments
- Current value, gains/losses calculation
- Historical performance charts
- Add/Edit/Delete investment entries
- Refresh all prices with one click

### 📅 Subscriptions & Bills
- Track recurring subscriptions (Netflix, Spotify, etc.)
- Track bills (electricity, internet, rent, etc.)
- Payment reminders and due dates
- Total monthly subscription expense overview
- Mark subscriptions as paid

### ⚙️ Settings
- User profile (name, email)
- Currency selection
- Date format preferences
- Export data as CSV/JSON

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (Prisma ORM)
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd AP-personal-finance
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. (Optional) Set up API keys for enhanced investment features:
   Create a `.env.local` file in the root directory:
   ```env
   # Optional: For better stock price data (free tier: 5 calls/min, 500 calls/day)
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
   
   # Optional: For company logos (free tier available)
   FINNHUB_API_KEY=your_finnhub_api_key
   FINANCIAL_MODELING_PREP_API_KEY=your_fmp_api_key
   ```
   
   **Note**: The app works without API keys using Yahoo Finance (free, no key required), but API keys provide more reliable data and better rate limits.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

The app uses SQLite for local development. The database file (`dev.db`) will be created automatically when you run `prisma db push`.

For production deployment on Vercel, you'll need to:
1. Set up a PostgreSQL database (recommended for Vercel)
2. Update the `DATABASE_URL` in your environment variables
3. Update the `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
4. Vercel will automatically build and deploy your app

### Database Setup for Vercel

For production, use a PostgreSQL database:
- Use Vercel Postgres, or
- Use a service like Supabase, Neon, or Railway

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma generate
npx prisma db push
```

## Project Structure

```
├── app/
│   ├── actions.ts          # Server actions for CRUD operations
│   ├── dashboard/         # Dashboard page
│   ├── transactions/       # Transactions page
│   ├── accounts/           # Accounts page
│   ├── categories/        # Categories page
│   ├── investments/       # Investments page
│   ├── subscriptions/     # Subscriptions page
│   └── settings/          # Settings page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
└── prisma/
    └── schema.prisma     # Database schema
```

## Features in Detail

### Account Balance Management
Account balances are automatically updated when you:
- Create a transaction (income increases balance, expense decreases)
- Update a transaction (recalculates based on old and new values)
- Delete a transaction (reverses the transaction effect)

### Subscription Tracking
- Set due dates (day of month)
- Mark subscriptions as paid for the current month
- View total monthly subscription costs
- Track payment history

### Investment Tracking
- Calculate gains/losses automatically
- View performance charts
- Track multiple investment types (stocks, crypto, mutual funds)
- **Real-time price updates**: Automatically fetch current market prices when entering stock symbols
- **Company logos**: Visual representation of your investments
- **Bulk price refresh**: Update all investment prices with one click

#### Investment API Setup
The investment feature uses multiple data sources:
- **Stock Prices**: 
  - Primary: Alpha Vantage API (requires free API key from https://www.alphavantage.co/support/#api-key)
  - Fallback: Yahoo Finance API (no key required)
- **Company Logos**:
  - Financial Modeling Prep (optional, better quality)
  - Finnhub (optional)
  - Clearbit Logo API (free, no key required)
  - Fallback: Generic icons

The app works without API keys, but adding them improves reliability and rate limits.

## Future Enhancements

- Multi-user support for family finance
- Budget planning and alerts
- Recurring transaction automation
- Bank account integration (read-only)
- Mobile app
- Dark mode improvements
- Advanced reporting and analytics

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

