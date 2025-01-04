'use client'

import posthog from 'posthog-js'
import { PostHogProvider as Provider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog with session recording enabled
    try {
      console.log('Initializing PostHog...')
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        session_recording: {
          enabled: true,
          maskAllInputs: false,
          maskAllText: false
        }
      })
      
      // Add debug event to verify tracking works
      posthog.capture('test_event', {
        message: 'PostHog initialized successfully'
      })
      
      console.log('PostHog distinct_id:', posthog.get_distinct_id())
    } catch (error) {
      console.error('PostHog initialization failed:', error)
    }
  }, [])

  return <Provider client={posthog}>{children}</Provider>
}