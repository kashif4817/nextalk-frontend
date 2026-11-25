// Avatar initials + gradient.
//
// Deliberately a thin re-export of utils/profile.js rather than its own
// palette: the profile editor and settings screens already use those helpers,
// and two palettes would give the same person different colours depending on
// which screen you were looking at.

export { getInitials as initialsOf, gradientForId as colorOf } from "../utils/profile";
