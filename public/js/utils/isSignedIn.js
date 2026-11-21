/** Somebody signed in with an account of their own: a guest session is not one. */
export const isSignedIn = (user) => Boolean(user && !user.isAnonymous)
