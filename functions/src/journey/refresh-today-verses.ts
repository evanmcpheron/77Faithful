import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { ITodayVerseTranslationDocument } from '../../generated/types/formation/today-verse.types';

export const verifyApiExcerpt = (
	value: unknown,
	bibleId: string,
	excerpt: ITodayVerseTranslationDocument['top'],
): boolean => {
	if (typeof value !== 'object' || value === null) return false;
	const passage = value as Record<string, unknown>;
	return (
		passage.bibleId === bibleId &&
		passage.id === excerpt.sourceId &&
		passage.reference === excerpt.sourceReference &&
		typeof passage.content === 'string' &&
		excerpt.text.trim().length > 0 &&
		passage.content.replace(/\s+/gu, ' ').trim().includes(excerpt.text) &&
		typeof passage.copyright === 'string' &&
		passage.copyright.trim().length > 0
	);
};

export const refreshTodayVerseSources = async (
	database: Firestore = getFirestore(),
	request: typeof fetch = fetch,
	apiKey = process.env.API_BIBLE_KEY,
) => {
	if (!apiKey) throw new Error('API_BIBLE_KEY is unavailable.');
	const editions = {
		Amp: 'a81b73293d3080c9-01',
		Gnt: '61fd76eafa1577c2-01',
		Nasb2020: 'a761ca71e0b3ddcf-01',
		Csb: 'a556c5305ee15c3f-01',
		Msg: '6f11a7de016f942e-01',
		Nkjv: '63097d2a0a2f7db3-01',
		Niv: '78a9f6124f344018-01',
		Kjv: 'a6aee10bb058511c-02',
	};
	const catalogResponse = await request('https://rest.api.bible/v1/bibles', {
		headers: { 'api-key': apiKey },
		signal: AbortSignal.timeout(10000),
	});
	if (!catalogResponse.ok)
		throw new Error(`API.Bible catalog HTTP ${catalogResponse.status}.`);
	const catalog = (await catalogResponse.json()) as {
		data?: { id: string }[];
	};
	if (!Array.isArray(catalog.data))
		throw new Error('Invalid API.Bible edition catalog.');
	const availableIds = new Set(catalog.data.map(({ id }) => id));
	let failures = 0;
	const refreshEdition = async ([version, bibleId]: [string, string]) => {
		const snapshots = await database.getAll(
			...Array.from({ length: 77 }, (_, index) =>
				database.doc(
					`todayVerseDays/${index + 1}/translations/${version}`,
				),
			),
		);
		const fetched = new Map<string, Record<string, unknown>>();
		for (const snapshot of snapshots) {
			if (!snapshot.exists) continue;
			const document = snapshot.data() as ITodayVerseTranslationDocument;
			if (
				document.source?.provider !== 'API.Bible' ||
				document.source.bibleId !== bibleId
			)
				continue;
			try {
				if (!availableIds.has(bibleId)) continue;
				const passages = [];
				for (const excerpt of [document.top, document.bottom]) {
					if (
						!excerpt.sourceId ||
						!/^[A-Z0-9.\-a-z]+$/.test(excerpt.sourceId)
					)
						throw new Error('Invalid source ID.');
					let passage = fetched.get(excerpt.sourceId);
					if (!passage) {
						const url = new URL(
							`https://rest.api.bible/v1/bibles/${bibleId}/verses/${excerpt.sourceId}`,
						);
						url.search = new URLSearchParams({
							'content-type': 'text',
							'include-notes': 'false',
							'include-titles': 'false',
							'include-chapter-numbers': 'false',
							'include-verse-numbers': 'false',
						}).toString();
						const response = await request(url, {
							headers: { 'api-key': apiKey },
							signal: AbortSignal.timeout(10000),
						});
						if (!response.ok) {
							if ([401, 403, 404].includes(response.status))
								await snapshot.ref.update(
									{ 'source.available': false },
									{ lastUpdateTime: snapshot.updateTime! },
								);
							throw new Error(
								`API.Bible HTTP ${response.status}.`,
							);
						}
						const body = (await response.json()) as {
							data?: Record<string, unknown>;
						};
						passage = body.data;
						if (!passage)
							throw new Error('Missing API.Bible passage.');
						fetched.set(excerpt.sourceId, passage);
						await new Promise((resolve) =>
							setTimeout(resolve, 150),
						);
					}
					if (!verifyApiExcerpt(passage, bibleId, excerpt)) {
						await snapshot.ref.update(
							{ 'source.available': false },
							{ lastUpdateTime: snapshot.updateTime! },
						);
						throw new Error(
							'Source changed; excerpt needs review.',
						);
					}
					passages.push(passage);
				}
				await snapshot.ref.update(
					{
						'source.verifiedAt': new Date().toISOString(),
						'source.available': true,
						'source.copyright': [
							...new Set(
								passages.map(({ copyright }) => copyright),
							),
						].join('\n'),
					},
					{ lastUpdateTime: snapshot.updateTime! },
				);
			} catch {
				failures++;
				console.error(`Could not refresh ${snapshot.ref.path}.`);
			}
		}
	};
	const entries = Object.entries(editions);
	for (let index = 0; index < entries.length; index += 3) {
		await Promise.all(entries.slice(index, index + 3).map(refreshEdition));
	}
	if (failures)
		throw new Error(
			`${failures} Today verse documents could not be refreshed.`,
		);
};
