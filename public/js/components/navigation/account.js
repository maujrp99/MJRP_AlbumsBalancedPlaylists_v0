/**
 * account - how the menu names the person who is signed in: the name, and its first letter (what the
 * account button shows on the computer and on the phone alike, F88).
 */
export const accountName = (user) => user?.displayName || user?.email || 'User'
/** The first letter of the person's name. */
export const accountInitial = (user) => accountName(user).trim().charAt(0).toUpperCase() || 'U'
