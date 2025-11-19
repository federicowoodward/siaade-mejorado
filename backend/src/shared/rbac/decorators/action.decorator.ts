import { SetMetadata } from "@nestjs/common";

export const ACTION_KEY = "action_key";

export const Action = (action: string) => SetMetadata(ACTION_KEY, action);
