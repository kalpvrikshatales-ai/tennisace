/**
 * Data Integrity Monitor
 * Tracks data quality issues and logs them for analysis
 */

interface IntegrityEvent {
  timestamp: number
  severity: 'warning' | 'error' | 'critical'
  source: string
  message: string
  details?: Record<string, any>
}

class DataIntegrityMonitor {
  private events: IntegrityEvent[] = []
  private readonly MAX_EVENTS = 1000

  /**
   * Log a data integrity issue
   */
  log(
    severity: 'warning' | 'error' | 'critical',
    source: string,
    message: string,
    details?: Record<string, any>
  ) {
    const event: IntegrityEvent = {
      timestamp: Date.now(),
      severity,
      source,
      message,
      details,
    }

    this.events.push(event)

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const icon = severity === 'critical' ? '🔴' : severity === 'error' ? '🟠' : '🟡'
      console.warn(`${icon} [${source}] ${message}`, details)
    }

    // Send to Sentry in production for critical issues
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      this.reportToSentry(event)
    }
  }

  /**
   * Log data validation failure
   */
  logValidationFailure(
    source: string,
    fieldCount: number,
    validCount: number,
    errors: string[]
  ) {
    const rate = Math.round((validCount / fieldCount) * 100)
    this.log('warning', source, `Data quality: ${rate}% valid`, {
      total: fieldCount,
      valid: validCount,
      invalid: fieldCount - validCount,
      rate: `${rate}%`,
      sampleErrors: errors.slice(0, 3),
    })
  }

  /**
   * Log missing data
   */
  logMissingData(source: string, dataType: string) {
    this.log('warning', source, `No ${dataType} available`)
  }

  /**
   * Log API failure
   */
  logAPIFailure(endpoint: string, error: string, retryCount: number) {
    const severity = retryCount >= 3 ? 'critical' : 'error'
    this.log(severity, `API: ${endpoint}`, `Request failed after ${retryCount} retries`, {
      error,
      endpoint,
      retries: retryCount,
    })
  }

  /**
   * Log data inconsistency
   */
  logInconsistency(source: string, issue: string, details: Record<string, any>) {
    this.log('error', source, `Data inconsistency: ${issue}`, details)
  }

  /**
   * Get recent critical events
   */
  getCriticalEvents(hours: number = 1): IntegrityEvent[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000
    return this.events.filter(
      e => e.severity === 'critical' && e.timestamp > cutoffTime
    )
  }

  /**
   * Get data quality metrics
   */
  getMetrics() {
    const recentHour = this.events.filter(
      e => e.timestamp > Date.now() - 60 * 60 * 1000
    )

    return {
      totalEvents: this.events.length,
      recentHourEvents: recentHour.length,
      criticalCount: recentHour.filter(e => e.severity === 'critical').length,
      errorCount: recentHour.filter(e => e.severity === 'error').length,
      warningCount: recentHour.filter(e => e.severity === 'warning').length,
    }
  }

  /**
   * Report to Sentry (production error tracking)
   */
  private reportToSentry(event: IntegrityEvent) {
    try {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureMessage(
          `Data Integrity Issue: ${event.source} - ${event.message}`,
          'error'
        )
      }
    } catch (e) {
      // Silently fail if Sentry not available
    }
  }

  /**
   * Clear events (for testing)
   */
  clear() {
    this.events = []
  }
}

export const monitor = new DataIntegrityMonitor()

/**
 * Helper: Log and return null when data is invalid
 */
export function logAndReturn<T>(
  condition: boolean,
  source: string,
  errorMessage: string,
  details?: Record<string, any>
): T | null {
  if (!condition) {
    monitor.log('error', source, errorMessage, details)
    return null
  }
  return null as any
}
