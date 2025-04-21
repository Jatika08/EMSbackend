// types/express/index.d.ts or middleware/types.d.ts
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}
