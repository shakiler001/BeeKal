/**
 * Cache tags, re-exported from the contracts package.
 *
 * One tag per content type. Publishing a case study revalidates every page that
 * reads case studies and nothing else, so editing one row does not throw the
 * whole site's cache away.
 *
 * The definition is shared with the API rather than duplicated here: it sends a
 * tag, this app revalidates it, and a string that exists on one side only is a
 * cache that never clears. That presents as "publishing does nothing", which is
 * a genuinely unpleasant thing to debug.
 */
export { CONTENT_TAGS, isContentTag, type ContentTag } from '@beekal/contracts';
