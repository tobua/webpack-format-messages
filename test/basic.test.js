const { join } = require("path");
const webpack = require("webpack");
const webpack4 = require("webpack-4");
const formatMessages = require("..");

// webpack configuration.
const defaultConfiguration = {
	mode: "development",
};

// Runs webpack with the versioned runtime passed and returns the stats.
const run = (runtime, configuration) =>
	new Promise((done) => {
		runtime(configuration, (error, stats) => {
			// These aren't compilation errors, shouldn't occur.
			expect(error || stats.hasErrors()).toEqual(false);
			done([formatMessages(stats), stats.toJson()]);
		});
	});

// Set the current working directory, so that webpack will be run with the proper fixture.
const currentDirectorySpy = jest.spyOn(process, "cwd");
const initialCwd = process.cwd();
const setCwd = (_path) =>
	currentDirectorySpy.mockReturnValue(join(initialCwd, _path));

// Run same tests with webpack 4 and 5.
const suite = async (
	name,
	cwd,
	runner,
	configuration = defaultConfiguration
) => {
	setCwd(cwd);
	test(`${name} with webpack 4.`, async () => {
		const [formatted, raw] = await run(webpack4, configuration);
		runner(formatted, raw, 4);
	});
	test(`${name} with webpack 5.`, async () => {
		const [formatted, raw] = await run(webpack, configuration);
		runner(formatted, raw, 5);
	});
};

suite(
	"Shows no errors or warning when there are none",
	"test/fixture/none",
	(formatted) => {
		expect(formatted.errors).toBeDefined();
		expect(formatted.errors.length).toEqual(0);
		expect(formatted.warnings.length).toEqual(0);
	}
);

suite(
	"Shows a mode warning",
	"test/fixture/none",
	(formatted, raw, version) => {
		expect(formatted.errors.length).toEqual(0);
		expect(formatted.warnings.length).toEqual(1);

		const warning = formatted.warnings[0];
		const rawWarning = raw.warnings[0];

		// Includes type
		if (
			typeof rawWarning === "object" &&
			rawWarning.message.includes("NoModeWarning")
		) {
			expect(warning).toContain("NoModeWarning");
		}

		if (
			typeof rawWarning === "string" &&
			rawWarning.includes("NoModeWarning")
		) {
			expect(warning).toContain("NoModeWarning");
		}

		// Includes Link
		if (version === 4) {
			expect(rawWarning).toContain("webpack.js.org");
		} else if (version === 5) {
			expect(rawWarning.message).toContain("webpack.js.org");
		}

		expect(warning).toContain("webpack.js.org");
		// Includes Callstack
		if (typeof rawWarning === "string") {
			expect(rawWarning).not.toContain("at ");
			expect(warning).not.toContain("at ");
		}
		if (typeof rawWarning === "object") {
			expect(rawWarning.stack).toContain("at ");
			expect(warning).toContain("at ");
		}
	},
	// Note different configuration used to trigger warning
	{}
);
