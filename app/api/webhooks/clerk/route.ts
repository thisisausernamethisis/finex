import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { AuthMonitor, AuthEventType } from '@/lib/monitoring/authMonitor'

// Edge Runtime compatible logger
const createWebhookLogger = () => ({
  info: (message: string, meta?: any) => {
    console.log(`[${new Date().toISOString()}] [clerk-webhook] INFO: ${message}`, meta ? JSON.stringify(meta) : '')
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[${new Date().toISOString()}] [clerk-webhook] WARN: ${message}`, meta ? JSON.stringify(meta) : '')
  },
  error: (message: string, meta?: any) => {
    console.error(`[${new Date().toISOString()}] [clerk-webhook] ERROR: ${message}`, meta ? JSON.stringify(meta) : '')
  }
})

// Create webhook-specific logger
const webhookLogger = createWebhookLogger()

export async function POST(req: NextRequest) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    webhookLogger.error('Missing WEBHOOK_SECRET environment variable')
    return new NextResponse('Webhook secret not configured', { status: 500 })
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // Basic header validation
  if (!svix_id || !svix_timestamp || !svix_signature) {
    webhookLogger.warn('Missing svix headers')
    return new NextResponse('Missing svix headers', { status: 400 })
  }

  // Get the body
  const payload = await req.text()
  let evt: WebhookEvent

  try {
    evt = JSON.parse(payload) as WebhookEvent
  } catch (err) {
    webhookLogger.error('Invalid JSON payload', { error: err })
    return new NextResponse('Invalid JSON payload', { status: 400 })
  }

  // Log the webhook event
  webhookLogger.info('Webhook event received', { 
    type: evt.type, 
    userId: evt.data?.id 
  })

  // Handle the webhook events
  try {
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt)
        break
      case 'user.updated':
        await handleUserUpdated(evt)
        break
      case 'user.deleted':
        await handleUserDeleted(evt)
        break
      case 'session.created':
        await handleSessionCreated(evt)
        break
      case 'session.ended':
        await handleSessionEnded(evt)
        break
      default:
        webhookLogger.info('Unhandled webhook event type', { type: evt.type })
    }

    return new NextResponse('Webhook processed successfully', { status: 200 })
  } catch (error) {
    webhookLogger.error('Error processing webhook', { 
      type: evt.type, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return new NextResponse('Webhook processing failed', { status: 500 })
  }
}

/**
 * Handle user creation events
 */
async function handleUserCreated(evt: WebhookEvent) {
  const { id, email_addresses, first_name, last_name } = evt.data as any

  webhookLogger.info('Processing user.created event', { userId: id })

  try {
    // Create user record in our database
    await prisma.user.create({
      data: {
        id: id,
        // We don't store email/name in our current schema
        // but this is where you'd add it if needed
      }
    })

    // Log successful user creation
    AuthMonitor.logEvent(AuthEventType.SIGN_IN_SUCCESS, {
      userId: id,
      metadata: {
        event: 'user.created',
        email: email_addresses?.[0]?.email_address
      }
    })

    webhookLogger.info('User created successfully', { userId: id })
  } catch (error) {
    webhookLogger.error('Failed to create user', { 
      userId: id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Handle user update events
 */
async function handleUserUpdated(evt: WebhookEvent) {
  const { id } = evt.data as any

  webhookLogger.info('Processing user.updated event', { userId: id })

  try {
    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      // User doesn't exist, create them
      await prisma.user.create({
        data: { id }
      })
      webhookLogger.info('User created during update event', { userId: id })
    }

    // Log user update
    AuthMonitor.logEvent(AuthEventType.SIGN_IN_SUCCESS, {
      userId: id,
      metadata: { event: 'user.updated' }
    })

    webhookLogger.info('User updated successfully', { userId: id })
  } catch (error) {
    webhookLogger.error('Failed to update user', { 
      userId: id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Handle user deletion events
 */
async function handleUserDeleted(evt: WebhookEvent) {
  const { id } = evt.data as any

  webhookLogger.info('Processing user.deleted event', { userId: id })

  try {
    // Delete user and all related data (cascading deletes will handle relations)
    await prisma.user.delete({
      where: { id }
    })

    // Log user deletion
    AuthMonitor.logEvent(AuthEventType.SIGN_OUT, {
      userId: id,
      metadata: { event: 'user.deleted' }
    })

    webhookLogger.info('User deleted successfully', { userId: id })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      // User already doesn't exist, which is fine
      webhookLogger.info('User already deleted', { userId: id })
    } else {
      webhookLogger.error('Failed to delete user', { 
        userId: id, 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

/**
 * Handle session creation events
 */
async function handleSessionCreated(evt: WebhookEvent) {
  const { user_id } = evt.data as any

  // Log session creation
  AuthMonitor.logSignInSuccess(user_id, {
    metadata: { event: 'session.created' }
  })

  webhookLogger.info('Session created', { userId: user_id })
}

/**
 * Handle session end events
 */
async function handleSessionEnded(evt: WebhookEvent) {
  const { user_id } = evt.data as any

  // Log session end
  AuthMonitor.logEvent(AuthEventType.SIGN_OUT, {
    userId: user_id,
    metadata: { event: 'session.ended' }
  })

  webhookLogger.info('Session ended', { userId: user_id })
} 