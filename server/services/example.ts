import "server-only";

import { validateExampleResponse } from "../validators/example";

export function getAuthenticatedExample(userId: string) {
  return validateExampleResponse({
    message: `Authenticated as ${userId}`
  });
}
