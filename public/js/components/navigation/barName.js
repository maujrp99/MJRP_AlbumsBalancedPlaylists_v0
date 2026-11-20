/**
 * How a person's name is written in the top bar (F63, UAT-211 and UAT-218): one line, as wide as
 * the name up to a limit, and narrower when the bar has no room: the name gives way before the
 * bar passes the width of the screen, and its tail is cut with "…". Every box between the name
 * and the bar lets it shrink (`min-w-0`). The element also carries the whole name in `title`, so
 * that a cut name can always be read.
 */
export const NAME_IN_THE_BAR = 'block truncate min-w-0 max-w-[220px]'
