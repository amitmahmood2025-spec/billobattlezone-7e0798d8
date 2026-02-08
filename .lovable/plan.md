

# Billo Battle Zone — Complete Gaming Tournament Platform

## Overview
A premium gaming tournament platform with a dark neon aesthetic where players earn free credits through tasks and deposit real money (via bKash, Nagad, Rocket, Binance). Credits are for match entry only (non-withdrawable), while deposited cash is withdrawable. Features glassmorphism UI with neon blue (#00d9ff) glow effects.

---

## Phase 1: Foundation & Authentication

### Landing Page
- Dark gaming-themed hero section with neon glow animations
- Glassmorphism cards showcasing platform features
- Login / Register buttons with smooth modal popups
- Mobile-first responsive layout

### Firebase Authentication
- Email/password registration and login
- Firebase SDK integration for frontend auth
- User profile creation on first login (synced to Supabase)
- Protected routes for dashboard, admin, etc.

### Supabase Database Schema
- **profiles** — Firebase UID, username, email, phone, avatar, referral_code
- **wallets** — credits (free, non-withdrawable), cash (deposited, withdrawable), total_earned
- **tasks** — task definitions (title, reward, type, cooldown, reset_type, is_active)
- **user_tasks** — per-user task progress and claim status
- **task_claims** — audit log with IP and timestamps
- **transactions** — full ledger (type: credit_earn, cash_deposit, cash_withdraw, match_entry, prize_won)
- **daily_streaks** — streak tracking for login bonuses
- **referrals** — referrer/referred tracking with commission
- **spin_history** — daily spin results
- **deposits** — deposit requests with payment method, amount, status, transaction ID
- **withdrawals** — withdrawal requests with payment method, status
- **tournaments** — tournament listings with entry fee type (credit/cash), prize pool
- **tournament_entries** — user entries with fee deducted
- **user_roles** — admin/user role management

---

## Phase 2: User Dashboard & Wallet

### Dashboard Home
- Welcome banner with username and daily streak counter
- Animated credit & cash balance counters (blue for credits, green for cash)
- Quick action grid: Tasks, Spin Wheel, Quiz, Deposit, Tournaments
- Recent activity feed

### Wallet System (Dual Balance)
- **Credits** — earned from tasks/missions, used ONLY for match/tournament entry, cannot withdraw
- **Cash** — deposited via payment methods, can be used for matches AND withdrawn
- Transaction history with type filters and icons
- Clear visual labels: "Credits (Play Only)" vs "Cash (Withdrawable)"

---

## Phase 3: Deposit / Recharge System

### Payment Methods
- **bKash** — mobile banking deposit
- **Nagad** — mobile banking deposit
- **Rocket** — mobile banking deposit
- **Binance** — crypto deposit (USDT/BNB)

### Deposit Flow
1. User selects payment method and enters amount
2. System shows admin's payment number/wallet address for that method
3. User sends money and enters their transaction ID (TrxID)
4. Deposit request saved as "pending" in database
5. Admin reviews and approves/rejects from admin panel
6. On approval: cash balance updated, transaction logged
7. User gets notification of approval

### Deposit UI
- Clean deposit modal with payment method tabs (bKash, Nagad, Rocket, Binance)
- Each tab shows: admin number/address, amount field, TrxID input field
- Copy button for admin numbers
- Pending deposits list with status indicators (pending/approved/rejected)

---

## Phase 4: Credit Earning System

### Daily Tasks Panel (Popup Modal)
- Tabbed interface: Daily / Achievements / Special
- Animated task cards with progress bars and reward amounts
- Glow effect on claimable tasks
- Confetti on successful claim, toast notifications

### Task Types
- **Login Bonus** — 5 credits daily (auto-complete)
- **Social Share** — 10 credits (share link)
- **Spin the Wheel** — 5-100 credits (1 free spin/day, canvas animation)
- **Gaming Quiz** — 20 credits (daily trivia, 30s timer)
- **Watch Ad** — 15 credits (max 3/day)
- **Complete Profile** — 50 credits (one-time)
- **First Tournament** — 25 credits (one-time)
- **7-Day Streak** — 100 credits (streak reward)

### Referral System
- Unique referral code per user
- 50 credits when friend registers
- 100 credits when friend deposits
- 5% lifetime commission on friend's deposits
- Referral stats page

---

## Phase 5: Tournament System

### Tournament Lobby
- List of available tournaments with game type, entry fee, prize pool
- Entry fee can be credits OR cash (configurable per tournament)
- Join button with balance check and confirmation
- Tournament status: upcoming, live, completed
- Match results and prize distribution

### Match Entry Rules
- Credits (from tasks) → can ONLY be used to enter matches
- Cash (from deposits) → can be used to enter matches AND withdraw
- Tournament prizes are awarded as Cash (withdrawable)

---

## Phase 6: Withdrawal System

### Withdrawal Flow
1. User requests withdrawal (minimum amount applies)
2. Selects method: bKash, Nagad, Rocket, or Binance
3. Enters their account number/wallet address
4. Request saved as pending
5. Admin reviews and processes manually
6. Status updated: pending → processing → completed/rejected
7. User notified

### Withdrawal Rules
- Only Cash balance can be withdrawn (not Credits)
- Minimum withdrawal amount (admin-configurable)
- Processing time displayed to user

---

## Phase 7: Admin Panel

### Admin Dashboard
- Overview: total users, total deposits, total withdrawals, credits distributed
- Revenue metrics and charts

### Deposit Management
- Pending deposits queue with user details, amount, TrxID, payment method
- Approve / Reject buttons with notes
- Deposit history with filters

### Withdrawal Management
- Pending withdrawal queue
- Process / Reject with reason
- Withdrawal history

### Task Management
- Add, edit, enable/disable tasks
- Change reward amounts and cooldowns
- Create special event tasks (e.g., double credits weekend)

### User Management
- User list with balances and activity
- Ban/unban users
- View transaction history per user

### Payment Settings
- Configure admin bKash/Nagad/Rocket numbers
- Configure Binance wallet address
- Set minimum deposit/withdrawal amounts

---

## Phase 8: Security & Anti-Abuse

### Backend Edge Functions
- Firebase JWT verification on all API calls
- Rate limiting: 10 task claims/hour, 100 API requests/hour
- Duplicate claim prevention
- Daily credit cap (200 credits max from tasks)
- IP logging on claims and deposits
- Atomic wallet transactions with balance_before/after
- Row Level Security (RLS) on all Supabase tables
- Admin-only access for approval endpoints

---

## Phase 9: Polish & Mobile

### Design
- Matte black backgrounds with glassmorphism cards
- Neon blue (#00d9ff) glow accents throughout
- 60fps smooth animations
- Confetti effects on rewards
- Toast notifications for all actions

### Mobile Optimization
- Mobile-first responsive design
- Touch-friendly buttons (44x44px minimum)
- Bottom sheet modals on mobile
- Swipe gestures where appropriate

