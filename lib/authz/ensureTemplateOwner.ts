import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Container, TOKEN_PRISMA } from '../container';
import { hasTemplateAccess } from '../rbac';
import { PrismaClient } from '@prisma/client';

/**
 * Middleware function to ensure that the current user is the owner of the specified template.
 * 
 * @param req The Next.js request object
 * @param templateId The ID of the template to check ownership for
 * @param handler The handler function to run if access is allowed
 * @returns The response from the handler if access is allowed, or an error response
 */
export async function ensureTemplateOwner(
  req: NextRequest,
  templateId: string,
  handler: () => Promise<NextResponse | undefined>
): Promise<NextResponse> {
  // Get the current user from Clerk
  const user = await currentUser();
  
  // If there is no user, return 401 Unauthorized
  if (!user) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }
  
  // Fetch template from the database
  const prisma = Container.get<PrismaClient>(TOKEN_PRISMA);
  const template = await prisma.themeTemplate.findUnique({ 
    where: { id: templateId },
    select: { ownerId: true, isPublic: true }
  });
  
  // If the template doesn't exist, return 404 Not Found
  if (!template) {
    return NextResponse.json({ message: 'Template not found' }, { status: 404 });
  }
  
  // Check if the user has access to the template using the RBAC system
  const ok = await hasTemplateAccess(user.id, template);
  
  // If the user does not have access, return 403 Forbidden
  if (!ok) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  
  // If access is allowed, call the handler function
  const result = await handler();
  
  // Provide a fallback response if handler returns undefined 
  return result || NextResponse.json({ success: true });
}
