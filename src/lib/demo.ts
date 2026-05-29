/**
 * Demo mode: the MVP is ungated. We pretend the visitor is "Mod: Big Tony"
 * of the NYC Toon Army chapter so the moderator surfaces are fully unlocked
 * without sign-in. Flip DEMO_MODE off to require real auth.
 */
export const DEMO_MODE = true;

export const DEMO_CHAPTER_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_CHAPTER_NAME = "NYC Toon Army";
export const DEMO_CHAPTER_CITY = "New York";

export const DEMO_USER_ID = "b0000000-0000-0000-0000-0000000000aa";
export const DEMO_USER_NAME = "Big Tony";
export const DEMO_USER_ROLE: "moderator" | "member" | "nufc_admin" = "moderator";
