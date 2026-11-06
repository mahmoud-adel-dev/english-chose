import { CefrLevelEnum, type CefrLevel } from "@english-coach/contracts";

export function parseRequestedCurrentLevel(value: unknown): CefrLevel | null {
  if (value === undefined) return null;
  const parsed = CefrLevelEnum.safeParse(value);
  if (!parsed.success) throw new Error("Invalid current level");
  return parsed.data;
}
