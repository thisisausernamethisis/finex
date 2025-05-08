import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { CardRepository } from '../../../../lib/repositories/cardRepository';
import { AccessRole, hasCardAccess } from '../../../../lib/services/accessControlService';
import { z } from 'zod';
import { createChildLogger } from '../../../../lib/logger';
import { forbidden, notFound, serverError, unauthorized } from '../../../../lib/utils/http';
import { validateCuid, validateSchema } from '../../../../lib/utils/api';

// Create repository instance
const cardRepository = new CardRepository();

// Schema validation for updating cards
const updateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  importance: z.number().int().min(1).max(10).optional(),
  source: z.string().max(500).optional()
});

// Handler for GET /api/cards/[cardId]
export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const logger = createChildLogger({ route: 'GET /api/cards/[cardId]', cardId: params.cardId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate card ID format and existence
    const validation = await validateCuid(
      params.cardId,
      cardRepository.cardExists.bind(cardRepository),
      'Card',
      logger
    );
    
    if (!validation.valid) {
      return validation.error;
    }
    
    const cardId = params.cardId;
    
    // Check if user has access to this card
    const hasAccess = await hasCardAccess(user.id, cardId, AccessRole.VIEWER);
    if (!hasAccess) {
      return forbidden('You do not have access to this card', logger);
    }
    
    // Get card from repository
    const card = await cardRepository.getCardById(cardId);
    
    if (!card) {
      return notFound('Card not found', logger);
    }
    
    return NextResponse.json(card);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for PUT /api/cards/[cardId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const logger = createChildLogger({ route: 'PUT /api/cards/[cardId]', cardId: params.cardId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate card ID format and existence
    const idValidation = await validateCuid(
      params.cardId,
      cardRepository.cardExists.bind(cardRepository),
      'Card',
      logger
    );
    
    if (!idValidation.valid) {
      return idValidation.error;
    }
    
    const cardId = params.cardId;
    
    // Check if user has EDITOR access to this card
    const hasEditorAccess = await hasCardAccess(user.id, cardId, AccessRole.EDITOR);
    if (!hasEditorAccess) {
      return forbidden('You do not have edit access to this card', logger);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const schemaValidation = validateSchema(updateCardSchema, body, logger);
    
    if (!schemaValidation.success) {
      return schemaValidation.error;
    }
    
    // Update card
    const card = await cardRepository.updateCard(
      cardId,
      schemaValidation.data
    );
    
    if (!card) {
      return notFound('Card not found or update failed', logger);
    }
    
    return NextResponse.json(card);
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}

// Handler for DELETE /api/cards/[cardId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const logger = createChildLogger({ route: 'DELETE /api/cards/[cardId]', cardId: params.cardId });
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return unauthorized('Authentication required', logger);
    }
    
    // Validate card ID format and existence
    const idValidation = await validateCuid(
      params.cardId,
      cardRepository.cardExists.bind(cardRepository),
      'Card',
      logger
    );
    
    if (!idValidation.valid) {
      return idValidation.error;
    }
    
    const cardId = params.cardId;
    
    // For deletion, require EDITOR access
    // Note: we're using EDITOR rather than ADMIN for cards since they're more transient content
    // and we want to allow content creators to manage their own cards
    const hasEditorAccess = await hasCardAccess(user.id, cardId, AccessRole.EDITOR);
    if (!hasEditorAccess) {
      return forbidden('You do not have edit access to delete this card', logger);
    }
    
    // Delete card
    const success = await cardRepository.deleteCard(cardId);
    
    if (!success) {
      return serverError(new Error('Failed to delete card'), logger);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return serverError(error instanceof Error ? error : new Error('Unknown error'), logger);
  }
}
