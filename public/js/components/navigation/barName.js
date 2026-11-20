/**
 * How a person's name is written in the top bar (F63, UAT-211): one line, the tail cut with "…"
 * when it does not fit, narrow on a small screen and wide on a wide one. The element also carries
 * the whole name in `title`, so that a cut name can always be read.
 */
export const NAME_IN_THE_BAR = 'truncate max-w-[96px] xl:max-w-[220px]'
