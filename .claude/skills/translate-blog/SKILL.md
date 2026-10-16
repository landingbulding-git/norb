---
name: translate-blog
description: Translate blog posts between English and Hungarian for this Notion-backed site. Use when the user asks to translate the blog, sync EN/HU blog content, run blog translation, or mentions new Notion posts needing a translation.
---

# Blog translation (Notion EN <-> HU)

This repo's blog lives in a Notion database. Translation is a 3-step pipeline that uses **you** (Claude), not a paid LLM API, to do the actual translating - see `scripts/notion-translate-*.ts` and `.env.example` for the required env vars (`NOTION_API_KEY`, `NOTION_DATABASE_ID`).

## Steps

1. **Prepare**: run `npm run translate:prepare`. It queries Notion for human-written, **live** posts (`autoTranslated` = false, `stage` = live - dev-stage drafts are never auto-translated), skips ones with no `language` property set (warn the user which posts need tagging - nothing can infer this), skips translations that are already up to date (compares `sourceEditedTime` on the translation against the original's `last_edited_time`), and writes one JSON file per post needing translation into `.notion-translations/`.

   If it says "Nothing to translate," you're done - report that and stop.

2. **Translate**: for each file in `.notion-translations/`, read it and fill in two `null` fields in place (use the Edit tool, not Write):
   - `translatedTitle`: the title translated into `targetLang`.
   - `blockTranslations`: an array the same length and order as `blockTexts`, each entry that text's translation.

   Translate like a human blog writer, not literally word-for-word - keep the author's voice, tone, and informal style. Keep names, product names, URLs, and code content unchanged (code blocks aren't in `blockTexts` at all - they're copied over untouched by the apply step). If a `blockTexts` entry is already in the target language (happens with scratch notes mixed into a post), just echo it back unchanged.

3. **Apply**: once every queued file has both fields filled in, run `npm run translate:apply`. It pushes each translation to Notion (creating a new linked page, or updating the existing one if retranslating), archives the old content blocks on update, and deletes the queue file on success.

   After it links a new translation, also set Notion's native `Parent item` property on the new page to the original's page ID (see **Sub-items** below) - unless a translation for that original already has `Parent item` set, in which case skip it.

## Verifying

After `apply`, you can sanity-check with a direct Notion query (see any recent commit's bash history for the `curl` pattern) or just re-run `npm run translate:prepare` - everything should report "Up to date."

## Known gotchas already handled by the scripts

Don't try to "fix" these - they're intentional:
- `icon: null` and overlong (>2000 char) rich_text runs are stripped/split automatically before sending to Notion.
- Internal (signed, short-lived) image upload URLs can't be reused directly, so `prepare` re-downloads and re-uploads them via Notion's File Upload API right away (`reuploadImage` in the lib) and stores the resulting `file_upload` id in the queue file - this only fails (silently dropping the image, as before) if the re-upload itself errors.
- Date comparisons use actual instants, not raw string equality (Notion normalizes `Z` to `+00:00`).

## If `apply` fails partway

A page can get created in Notion before its content-append step fails (e.g. a new, not-yet-handled Notion validation error). That leaves an orphaned, **empty** duplicate page behind, and the queue file stays (so a retry doesn't double-create - but if you had to fix a bug in the script between attempts, you might end up with duplicates like we did on 2026-10-16). To check: query the database for `stage=live AND language=<target>`, then fetch each result's block children - any with zero blocks is an orphan. Confirm with the user before archiving/trashing anything (`notion-delete-pages` requires explicit confirmation anyway).

## Sub-items

Translations are nested under their original post using Notion's native `Parent item`/`Sub-item` relation (separate from the pipeline's own `translationOf` relation, which the scripts use internally for lookups - keep both in sync). After creating a new translation page, set its `Parent item` to the original's page ID.
