# Provisional 77-day course

This is editable working content based on the candidate list supplied for development. It is not a final editorial selection. John 15:1–11 retains the explicit **Use** decision. Luke 10:38–42 is excluded; Psalm 23 fills its Day 3 slot. The other daily-sequence selections are provisional, not approved decisions on the original candidate list.

Edit `manuscript.json` to change passages, questions, devotionals, prayer prompts, or weekly introductions. Every day has a distinct provisional prayer prompt and written prayer alongside its reflection question. These are sample authored content for testing, not participant journal entries. Divine pronouns in original reflection questions follow the repository voice guide. Scripture is never rewritten or capitalized to match that guide.

`scripture-web.json` contains the complete selected readings from eBible.org’s public-domain [World English Bible, Protestant edition](https://ebible.org/bible/details.php?all=1&id=engwebp). Its source URL, archive text-file date, and SHA-256 digest identify the exact source. Verse wording and punctuation are preserved; the source’s verse-per-line format is presented as verse runs, without inferred paragraph breaks. Other translations are not substituted or labeled as WEB.

After changing passages, download the linked `engwebp_vpl.zip` source and run:

```sh
python3 scripts/import-provisional-scripture.py /path/to/engwebp_vpl.zip
npm --prefix functions run build
node scripts/seed-provisional-course.cjs faithful-4325a
```

The last command validates and previews without accessing the database. To import, configure Application Default Credentials (or an emulator) and add `--write`.

The importer atomically creates 77 daily documents, 11 weekly overviews, 11 introductions, Scripture assignments and WEB texts, the course/version and edition records, and the current formation configuration. It marks this provisional version available to the existing start loader. Choose **World English Bible (WEB)** during setup to use it; other translations remain unavailable until their actual texts are supplied.

Content-derived version IDs make retries idempotent. Editing the manuscript produces a new version for future journeys; old versions remain intact. An unrelated configured course is never overwritten. No journey, account, preference, or participation record is changed by the import.

Today and its Scripture, Pray, Reflect, and Chosen Practice screens load the day’s content from the journey’s saved course version. The Scripture reader uses the participant’s selected released translation, including the complete primary and supporting passages. An unavailable translation is explained without substituting another text. Preview navigation uses the local manuscript and WEB readings, with completion and writing kept only in that preview.

The daily screens use the `getJourneyDay`, `setJourneyPracticeCompletion`, and `saveJourneyReflection` callable functions. Build and deploy these functions before using the connected daily experience:

```sh
npm --prefix functions run build
firebase deploy --only functions:getJourneyDay,functions:setJourneyPracticeCompletion,functions:saveJourneyReflection
```

Daily account saves require a connection. Opening or reading a practice never completes it automatically; reflection writing and completion remain separate actions. Reflection drafts are also stored on the device, scoped to the account, journey, and day. Reopening an editor restores its draft and offers a comparison if the account version has changed.

The Today header uses `assets/images/today-landscape-placeholder.jpg`, a temporary photo from [Lorem Picsum](https://picsum.photos/id/28/1600/900). Replace this file to change the header photo; no layout code needs to change.
