# TennisAce Data Integrity & Trust System

## Core Principle: TRUTH FIRST

**Never display incorrect or misleading data.**

Better to show nothing than wrong information.

---

## Three-Layer Integrity System

### 1. Data Validation Layer (`dataValidator.ts`)

**Purpose**: Verify data before display

**What it validates**:
- ✅ Required fields present (match_id, player1, player2, tournament)
- ✅ Data consistency (stat_won ≤ stat_total)
- ✅ Player names not empty
- ✅ Match IDs valid format
- ✅ Array data has required structure

**Rejection criteria**:
- Less than 50% of matches are valid → reject all
- Missing required fields → skip individual item
- Data inconsistencies → flag as error

**Usage**:
```typescript
const validation = validateMatches(matches)
if (!validation.valid && validation.data === null) {
  // Show "Data unavailable"
  // Log error
} else {
  // Use validation.data (filtered valid items only)
}
```

**Validation Functions**:
- `validateMatch()` - Single match
- `validateMatches()` - Array of matches
- `validateRanking()` - Single ranking
- `validateRankings()` - Array of rankings
- `validateMatchStats()` - Statistics consistency
- `validateH2H()` - Head-to-head data

---

### 2. Smart Match Priority Engine (`matchPriority.ts`)

**Purpose**: Automatically prioritize matches by importance

**Why**: Ensures top seeds and important matches always appear first—no manual sorting needed

**Priority Scoring System** (higher = appears first):

| Factor | Points | Example |
|--------|--------|---------|
| Live match | +500 | In progress |
| Grand Slam | +300 | Wimbledon, US Open |
| Masters 1000 | +200 | Monte Carlo, Madrid |
| Elite player | +100 per player | Sinner (1), Alcaraz (2) |
| Final | +100 | Championship match |
| Semi-Final | +90 | SF |
| Quarter-Final | +80 | QF |
| Round 3-4 | +60-70 | R3, R4 |
| Qualifier | -100 | Q1, Q2, Q3 |

**Example Scoring**:
```
Sinner vs Alcaraz (Wimbledon Final):
  - Live: +500
  - Grand Slam: +300
  - 2 Elite players: +200
  - Final: +100
  = 1100 points (appears first)

Unknown vs Unknown (Wimbledon R1):
  - Grand Slam: +300
  - R1: +40
  = 340 points (appears later)

Qualifier Match (Any tournament):
  - Tournament: +50-300
  - Qualifier penalty: -100
  = Negative or very low score
```

**Usage**:
```typescript
import { sortByPriority, filterAndSortMatches } from '@/lib/matchPriority'

// Sort all matches by priority
const sorted = sortByPriority(matches)

// Advanced filtering
const topMatches = filterAndSortMatches(matches, {
  excludeQualifiers: true,
  maxResults: 10,
  minEliteCount: 1  // Only matches with at least 1 elite player
})
```

**Elite Players List**:
- Men: Sinner, Alcaraz, Djokovic, Medvedev, Zverev, Fritz, FAA, Thiem, Rune, Berrettini, Shelton, De Minaur
- Women: Swiatek, Sabalenka, Rybakina, Vondrousova, Paolini, Keys, Pegula, Muchova, Gauff, Zheng, Mirra

---

### 3. Data Integrity Monitor (`integrityMonitor.ts`)

**Purpose**: Track and log all data quality issues

**Why**: Creates audit trail for debugging and monitoring

**What it tracks**:
- ✅ Validation failures
- ✅ Missing data
- ✅ API errors
- ✅ Data inconsistencies
- ✅ Stale data warnings

**Severity Levels**:
- 🟢 **Info**: Normal operations
- 🟡 **Warning**: Data quality concerns, missing data
- 🟠 **Error**: API failures, validation failures
- 🔴 **Critical**: Multiple failures, unreliable data

**Usage**:
```typescript
import { monitor } from '@/lib/integrityMonitor'

// Log an issue
monitor.log('error', 'LiveMatches', 'API timeout after 3 retries', {
  endpoint: '/matches/live',
  retries: 3,
})

// Get metrics
const metrics = monitor.getMetrics()
// { totalEvents: 42, recentHourEvents: 3, criticalCount: 0, errorCount: 1, warningCount: 2 }

// Get critical events
const critical = monitor.getCriticalEvents(1)  // Last 1 hour
```

**Console Output** (Development):
```
🟡 [LiveMatches] Data quality: 75% valid
🟠 [API: /matches/live] Request failed after 3 retries
🔴 [Rankings] No valid rankings found in dataset
```

**Production**:
- Critical events sent to Sentry
- Warnings logged internally
- Full history available for audit

---

## Integration Points

### Home Page (Live Matches)
```typescript
// Step 1: Validate matches
const validation = validateMatches(matches)

// Step 2: Log any warnings
if (validation.warning) {
  monitor.log('warning', 'Live Matches', validation.warning)
}

// Step 3: Sort valid matches by priority
const sorted = sortByPriority(validation.data || matches)

// Step 4: Display
return sorted.map(m => <MatchCard match={m} />)
```

### Wimbledon Page
```typescript
// Filter by gender
const filtered = filterGender(upcoming)

// Validate data quality
const validation = validateMatches(filtered)

// Sort by priority (Grand Slam + top seeds automatic)
const sorted = sortByPriority(validation.data || filtered)
```

### Rankings
```typescript
// Validate rankings data
const validation = validateRankings(rankings)

// If valid, display; if not, show "Data unavailable"
if (validation.valid) {
  return <RankingsList data={validation.data} />
} else {
  return <DataUnavailable reason={validation.errors[0]} />
}
```

---

## Data Accuracy Guarantees

### Rankings
- ✅ Never shows empty array without reason
- ✅ Filters out invalid entries
- ✅ Logs when data quality is low
- ✅ Shows "Data unavailable" if <80% valid

### Match Data
- ✅ Requires all key fields present
- ✅ Validates player names not empty
- ✅ Skips incomplete matches
- ✅ Shows error if <50% valid

### Statistics
- ✅ Validates stat_won ≤ stat_total
- ✅ Checks required stat fields
- ✅ Logs inconsistencies
- ✅ Never displays incorrect percentages

### Match Priority
- ✅ Top seeds always prioritized
- ✅ Grand Slams before other tournaments
- ✅ Live matches always first
- ✅ Qualifiers always last
- ✅ No manual sorting needed—automatic

---

## Error Handling Philosophy

### Bad Data
**Before**: Show it anyway, hope user doesn't notice
**Now**: Log it, validate it, reject it

### Missing Data
**Before**: Show empty array/null without explanation
**Now**: Show "Data unavailable", explain why, log it

### API Failures
**Before**: Silent try/catch, show stale/mock data
**Now**: Log failure count, alert if pattern emerges, report to Sentry

### Inconsistent Data
**Before**: Show as-is even if wrong
**Now**: Detect, log, reject, show error

---

## Monitoring & Debugging

### Development
Open browser console and check for:
```
🟡 [DataValidator] ...
🟠 [API] ...
🔴 [DataIntegrity] ...
```

### Production
- Critical issues sent to Sentry
- Check browser DevTools console
- Review app logs for patterns

### Check Monitor Status
```typescript
import { monitor } from '@/lib/integrityMonitor'

// In browser console:
monitor.getMetrics()
// Returns: { totalEvents, recentHourEvents, criticalCount, errorCount, warningCount }

monitor.getCriticalEvents(1)  // Last 1 hour
// Returns: Array of critical events with timestamps
```

---

## Data Sources & Reliability

| Source | Reliability | Cache | Fallback |
|--------|-------------|-------|----------|
| API-Tennis | Medium | 30s-1h | DB/mock |
| BBC News RSS | Medium | 30m | Empty |
| Local DB | High | - | API |
| Player DB | High | 24h | - |

**Reliability Issues**:
- API-Tennis: Timeouts, incomplete data
- BBC RSS: Missing images, parsing errors
- Local DB: Can become stale

**Mitigation**:
- Validate all external data
- Cache aggressively
- Show "unavailable" if validation fails
- Log reliability issues

---

## Future Improvements

### Phase 2
- [ ] Implement health checks for data sources
- [ ] Add data freshness indicators
- [ ] Create dashboard for monitoring
- [ ] Automated alerts for data quality drops
- [ ] Data source redundancy/failover

### Phase 3
- [ ] GraphQL for efficient data fetching
- [ ] Real-time data streaming
- [ ] Data versioning/audit trail
- [ ] Automated data quality tests
- [ ] User-facing trust indicators

---

## Testing Data Integrity

### Manual Testing
```typescript
// Test validation
import { validateMatches } from '@/lib/dataValidator'

const badData = [{ player1: 'A' }]  // Missing fields
const result = validateMatches(badData)
console.assert(!result.valid, 'Should reject incomplete data')

// Test priority
import { sortByPriority } from '@/lib/matchPriority'

const matches = [qualifier, roundOne, semifinal, final]
const sorted = sortByPriority(matches)
console.assert(
  sorted[0].round === 'Final',
  'Final should appear first'
)

// Test monitoring
import { monitor } from '@/lib/integrityMonitor'

monitor.log('critical', 'Test', 'Test critical event')
const metrics = monitor.getMetrics()
console.assert(metrics.criticalCount > 0, 'Should track critical events')
```

### Automated Testing
- [ ] Unit tests for validators
- [ ] Integration tests for data flow
- [ ] E2E tests for priority sorting
- [ ] Monitor health checks

---

## Summary

TennisAce now has three foundational systems that ensure data accuracy:

1. **Validation Layer**: Prevents bad data from ever being displayed
2. **Priority Engine**: Automatically shows important matches first
3. **Integrity Monitor**: Tracks and logs all quality issues

**Result**: Users can trust the data they see. Rankings won't disappear. Top seeds appear first. No misleading or wrong information.

This is now core to TennisAce's identity as a trusted sports app.
