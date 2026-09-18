export class ForbiddenError extends Error {
  constructor() {
    super("You do not have access to this resource.");
    this.name = "ForbiddenError";
  }
}

export function assertOwnedSession(resourceOwnerId: string, requesterSessionId: string) {
  if (!resourceOwnerId || resourceOwnerId !== requesterSessionId) throw new ForbiddenError();
}
