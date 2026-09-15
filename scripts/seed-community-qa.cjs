const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const prettier = require('prettier');
const { accounts } = require('./community-qa-data.cjs');
const {
	root,
	validateEnvironment,
	readClientConfiguration,
	newExecution,
	recordFailure,
	loadState,
	createRuntime,
} = require('./community-qa-runtime.cjs');
const { seed } = require('./community-qa-seed.cjs');
const { verify } = require('./community-qa-verify.cjs');
const { renderReport } = require('./community-qa-report.cjs');

const main = async () => {
	const execution = newExecution();
	let runtime;
	let checkpoint;
	let lock;
	let preserveExistingReport = false;
	const directory = path.join(root, '.community-qa');
	try {
		execution.branch = execFileSync('git', ['branch', '--show-current'], {
			cwd: root,
			encoding: 'utf8',
		}).trim();
		execution.commit = execFileSync('git', ['rev-parse', 'HEAD'], {
			cwd: root,
			encoding: 'utf8',
		}).trim();
		if (execution.branch !== 'community') {
			preserveExistingReport = true;
			throw Object.assign(new Error(), {
				code: 'QA/CommunityBranchRequired',
			});
		}
		if (
			process.argv
				.slice(2)
				.some((argument) => argument !== '--verify-only')
		)
			throw Object.assign(new Error(), { code: 'QA/UnknownArgument' });
		let configuration;
		try {
			configuration = validateEnvironment(
				process.env,
				readClientConfiguration(),
			);
		} catch (error) {
			recordFailure(
				execution,
				'blocking',
				null,
				'Environment configuration',
				'startup guard',
				{ code: 'QA/ConfigurationInvalid' },
				error.message,
			);
			return;
		}
		fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
		const lockPath = path.join(directory, 'seed.lock');
		lock = fs.openSync(lockPath, 'wx', 0o600);
		fs.writeFileSync(lock, String(process.pid));
		checkpoint = loadState(directory, configuration.projectId);
		console.log(
			`[preflight] ${configuration.projectId}, owner-confirmed non-production, ${execution.branch}`,
		);
		runtime = await createRuntime(configuration, execution, checkpoint);
		await runtime.preflight();
		const verifyOnly = process.argv.includes('--verify-only');
		console.log(
			'[account provisioning / authentication / profiles] Exactly ten requested identities',
		);
		for (const account of accounts)
			await runtime.run(
				account.number,
				'Provision and authenticate',
				'Firebase Auth / Admin test verification / Firestore client profile',
				async () => {
					await runtime.provision(account, verifyOnly);
					console.log(
						`[account] ${account.email}: authenticated and profile prepared`,
					);
				},
			);
		if (!Object.values(execution.accounts).some((item) => item.provisioned))
			throw Object.assign(new Error(), {
				code: 'QA/NoAuthenticatedAccounts',
			});
		if (!verifyOnly) await seed(runtime);
		await verify(runtime);
	} catch (error) {
		if (error.code === 'EEXIST' && lock === undefined)
			preserveExistingReport = true;
		recordFailure(
			execution,
			'blocking',
			null,
			'Seeder execution',
			'startup / runtime',
			error,
			'Dependent operations stopped. Already-created resources remain checkpointed for a safe rerun.',
		);
	} finally {
		if (preserveExistingReport) {
			console.error(
				'[blocking] No report was overwritten: run only on community with no other seeder holding the local lock.',
			);
			process.exitCode = 1;
			return;
		}
		execution.finishedAt = new Date().toISOString();
		const provisioned = Object.values(execution.accounts).filter(
			(item) => item.provisioned,
		).length;
		const verified = Object.values(execution.accounts).filter(
			(item) => item.verified,
		).length;
		execution.status = execution.issues.some(
			(item) => item.severity === 'blocking',
		)
			? 'Blocked'
			: execution.issues.some(
						(item) => item.severity === 'recoverable',
				  ) || verified !== 10
				? 'Partial'
				: 'Completed';
		if (runtime)
			await runtime
				.close()
				.catch((error) =>
					recordFailure(
						execution,
						'warning',
						null,
						'Close SDK sessions',
						'Firebase SDK',
						error,
						'Application state is unchanged; SDK cleanup failed.',
					),
				);
		const report = renderReport(execution, checkpoint?.state, [
			process.env.COMMUNITY_QA_PASSWORD,
		]);
		const formatted = await prettier.format(report, {
			...(await prettier.resolveConfig(
				path.join(root, 'COMMUNITY_QA_SEED_REPORT.md'),
			)),
			parser: 'markdown',
		});
		fs.writeFileSync(
			path.join(root, 'COMMUNITY_QA_SEED_REPORT.md'),
			formatted,
		);
		if (checkpoint) {
			checkpoint.state.history.push({
				startedAt: execution.startedAt,
				status: execution.status,
				provisioned,
				verified,
				mutations: execution.mutations,
				reusedOperations: execution.reusedOperations,
				issues: execution.issues,
			});
			checkpoint.save();
		}
		if (lock !== undefined) {
			fs.closeSync(lock);
			fs.unlinkSync(path.join(directory, 'seed.lock'));
		}
		console.log(
			`[report generation] ${execution.status}: ${provisioned}/10 provisioned, ${verified}/10 verified; ${execution.issues.length} warnings/errors. COMMUNITY_QA_SEED_REPORT.md`,
		);
		if (execution.status !== 'Completed') process.exitCode = 1;
	}
};

if (require.main === module)
	main().catch(() => {
		console.error(
			'[blocking] Report generation or local checkpoint cleanup failed. No diagnostic payload was printed.',
		);
		process.exitCode = 1;
	});
module.exports = { main };
