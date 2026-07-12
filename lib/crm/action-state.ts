// Shared shape for useActionState form actions. Lives outside actions.ts
// because a "use server" file may only export async functions.
export interface ActionState {
  error: string | null;
}

export const initialActionState: ActionState = { error: null };
