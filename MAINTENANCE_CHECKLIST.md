# TennisAce Maintenance Checklist

## Weekly (Every Monday)
- [ ] Check Sentry for critical errors
- [ ] Verify live matches are displaying (should be 5+ in season)
- [ ] Check rankings page loads <1 second
- [ ] Verify no console errors in DevTools
- [ ] Confirm results are showing (no empty pages)

## Monthly (1st of month)
- [ ] Review data validation rules in `dataValidator.ts`
- [ ] Check cache hit rates
- [ ] Review priority sorting logic for edge cases
- [ ] Analyze API response times
- [ ] Look for patterns in integrity monitor logs

## Before Major Tournament (Wimbledon, US Open, etc.)
- [ ] Test Grand Slam data flow end-to-end
- [ ] Verify priority engine correctly ranks Grand Slam matches
- [ ] Check that top seeds display at the top
- [ ] Confirm no duplicate player issues
- [ ] Load test with increased traffic

## Critical Path Tests (Run after any change to):

### Data Validation (`dataValidator.ts`)
```bash
# Verify these don't break:
1. Rankings page loads
2. Live matches display
3. Results show (no empty)
4. Wimbledon schedule populated
```

### Priority Engine (`matchPriority.ts`)
```bash
# Verify sorting works:
1. Live matches appear first
2. Grand Slam matches ranked high
3. Top seeds (Sinner, Alcaraz, Djokovic) appear first
4. Qualifiers appear last
```

### Backend Validation (`results.py`, `matches.py`)
```bash
# Verify filtering works:
1. No duplicate players in results
2. Both players exist in every match
3. Invalid data is silently filtered (not breaking)
4. Results still load even if some items filtered
```

### Integrity Monitor (`integrityMonitor.ts`)
```bash
# Verify monitoring active:
1. Console shows validation logs in dev mode
2. Sentry receives critical alerts in production
3. No silent failures
4. All data quality issues tracked
```

## Emergency Response

### Issue: Empty Rankings
**Diagnosis:**
1. Check Sentry for validation errors
2. Verify API returning data: `curl https://tennisace.onrender.com/players/rankings?type=ATP`
3. Check if validation `validityRate < 0.5` threshold hit

**Fix:**
- Validation now returns filtered data (not all-or-nothing)
- If still empty, check backend logs for API issues
- Last resort: Check if API-Tennis service is down

### Issue: Duplicate Players in Results
**Diagnosis:**
1. Check if `_validate_match()` in backend is active
2. Look at Sentry for validation logs
3. Verify both `player1` and `player2` fields exist in API

**Fix:**
- Backend validation now catches these
- Results filtered before reaching frontend
- If duplicate still shows, backend validation may be bypassed

### Issue: Wrong Match Order (Not Sorted by Priority)
**Diagnosis:**
1. Check if `sortByPriority()` is being called
2. Verify `matchPriority.ts` scoring logic
3. Check Sentry for sorting errors

**Fix:**
- Ensure `sortByPriority()` is used in:
  - Home page (live matches)
  - Wimbledon page (schedule)
  - Results page (if enabled)
- Verify elite player list includes top players
- Check priority scoring formula

### Issue: Slow Loading
**Diagnosis:**
1. Check cache headers: `curl -I https://tennisace.onrender.com/`
2. Verify Redis caching is active
3. Check API response times in Sentry

**Fix:**
- Ensure cache TTLs are set:
  - Live matches: 30 sec
  - Results: 30 min
  - Rankings: 24 hours
- Check if Redis connection is working
- Verify gzip compression enabled

## Code Review Checklist

When reviewing changes to these core files:

### `dataValidator.ts`
- [ ] Doesn't reject all data if some items invalid
- [ ] Returns `data: validMatches` (not null) if any valid
- [ ] Only rejects if `validMatches.length === 0`
- [ ] Shows warning for filtered items
- [ ] No thresholds like "50% must be valid"

### `matchPriority.ts`
- [ ] Scoring includes all tournament tiers
- [ ] Elite player list stays current
- [ ] Live matches get highest priority (+500)
- [ ] Grand Slams prioritized above others
- [ ] Qualifiers penalized (-100)

### `results.py` / `matches.py`
- [ ] `_validate_match()` checks both players different
- [ ] Validation applied to both results AND fixtures
- [ ] Invalid items filtered, not rejecting entire array
- [ ] Cache invalidated after filtering

### `integrityMonitor.ts`
- [ ] All validation failures logged
- [ ] Critical errors sent to Sentry
- [ ] Development logs appear in console
- [ ] Metric tracking active
- [ ] No silent failures

## Deployment Checklist

Before pushing to production:

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] ESLint passes: `npm run lint`
- [ ] All changes related to issue/feature
- [ ] No unrelated refactoring
- [ ] Commit message explains why (not what)
- [ ] Tests pass (if applicable)

After deploying:

- [ ] Monitor Sentry for errors (first hour)
- [ ] Check live matches are displaying
- [ ] Verify rankings page loads
- [ ] Confirm no data integrity issues
- [ ] Review monitoring metrics

## Permanent Rules

### Rule 1: Filter, Don't Reject
**What it means**: Invalid data should be removed, not cause entire array to be rejected  
**Where it applies**: All validation functions in `dataValidator.ts`  
**Why**: Users should see valid data even if some items are invalid

### Rule 2: Validate at Boundaries
**What it means**: Validate external data (API responses), trust internal data (already validated)  
**Where it applies**: Backend validates before returning, frontend validates on render  
**Why**: Catch bad data as early as possible

### Rule 3: Log Everything
**What it means**: Never fail silently; always log validation failures, API errors, data issues  
**Where it applies**: Every validate function, every API call  
**Why**: Monitor data quality, catch issues before users complain

### Rule 4: Smart Defaults
**What it means**: If data quality drops, serve what we have + warnings, not empty page  
**Where it applies**: Home page, rankings, results, Wimbledon  
**Why**: Better to show partial data than nothing

### Rule 5: Automatic Prioritization
**What it means**: Important matches should rank first by default, no manual configuration  
**Where it applies**: All match lists use `sortByPriority()`  
**Why**: Matches like Grand Slams shouldn't require manual intervention

## Testing Scenarios

### Scenario 1: Mixed Singles + Doubles
**Setup**: API returns 10 singles + 5 doubles  
**Expected**: Backend filters to 10 singles only  
**Verify**: Results show 10 items (not empty, not 15)

### Scenario 2: API Error (500 response)
**Setup**: API temporarily down  
**Expected**: Show cached data + warning  
**Verify**: User sees "old data" but not "empty"

### Scenario 3: Large Result Set
**Setup**: 500 results returned  
**Expected**: Validation completes fast, all valid items shown  
**Verify**: Load time < 2 seconds, all 500+ items available

### Scenario 4: All Items Invalid
**Setup**: API returns only corrupted data  
**Expected**: Show error "Data unavailable"  
**Verify**: Not crashing, proper error message

### Scenario 5: Tournament with No Matches
**Setup**: Wimbledon schedule requested, tournament not started  
**Expected**: Show empty state with explanation  
**Verify**: Not confusing with actual data error

## Monitoring Dashboard (Future)

When implemented, monitor:
- Data validation success rate (target: >95%)
- Average items filtered per API call
- Cache hit rate (target: >80%)
- Page load time (target: <1s)
- Sentry critical error rate (target: 0)
- API response time (target: <2s)

## Historical Issues (Don't Regress)

These problems have been solved. Don't reintroduce them:

1. **Validation rejecting valid data** ❌ (FIXED: Now returns filtered data)
2. **Duplicate players showing** ❌ (FIXED: Backend validation catches)
3. **Empty pages with available data** ❌ (FIXED: Smart filtering)
4. **Wrong match ordering** ❌ (FIXED: Auto priority sorting)
5. **Silent failures** ❌ (FIXED: Full monitoring)

## Success Criteria

TennisAce is healthy when:
- ✅ Rankings page always shows data
- ✅ Live matches display within 1 second
- ✅ Results don't show duplicate players
- ✅ Wimbledon top seeds appear first
- ✅ No empty pages (with available data)
- ✅ All errors logged to Sentry
- ✅ Cache working (verified by timing)
- ✅ No console errors in DevTools
- ✅ Sorting works correctly
- ✅ Data integrity maintained

## Contact for Questions

If something breaks or you're unsure:
1. Check this document first
2. Check Sentry for errors
3. Check the code in `/frontend/src/lib/` and `/backend/app/routers/`
4. Review the SYSTEM_RELIABILITY.md for architecture
5. Consult DATA_INTEGRITY.md for validation logic

---

**Last Updated**: 2026-06-28  
**Maintained by**: System Reliability Team  
**Status**: All systems permanent and tested ✅
