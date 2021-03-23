const fetch = require('node-fetch');
const sjcl = require('sjcl');
const { Command } = require('commander');
const crypto = require('crypto');
const chalk = require('chalk');
const program = new Command();

function validateURL(value) {
	const urlSchema = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
	return urlSchema.test(value);
}

// if you're self-hosting yeeturl, change this configuration
const config = {
	// the instance yeeturl-desktop will use to shorten/get urls
	instanceURL: 'https://yeeturl.spheeresx.repl.co', // DON'T add a slash at the end of the url!
	// yeeturl instances that the user can get original/long urls from
	// this can be helpful if you're running mirror sites
	supportedInstances: ['yeeturl.glitch.me', 'yeeturl.spheeresx.repl.co', 'yeeturl.github.io']
}

program
	.version('1.0.0')
	.option('-s, --shorten <url>', 'shorten a url')
	.option('-g, --get <url>', 'get the long url from a shortened link')
	.parse();
var opts = program.opts();

if (opts.shorten) {
	(async () => {
		// check if the url is valid
		if (!validateURL(opts.shorten))
			return console.error(chalk.red('This URL is invalid.'));
		// if it is, generate a password & encrypt it
		console.log(chalk.magentaBright('Encrypting - this may take a while...'));
		var password = crypto.randomBytes(5).toString('hex');
		var encrypted = sjcl.encrypt(password, opts.shorten, { iter: 275000 });
		// upload the encrypted url to the server
		const res = await fetch(`${config.instanceURL}/api/shorten`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				url: encrypted
			})
		});

		if (!res.ok) {
			switch (res.status) {
				case 429:
					return console.error(chalk.red('You are sending too much requests. Please try again later.'));
				case 413:
					return console.error(chalk.red('The link you have provided is too long.'));
				default:
					return console.error(chalk.red('An unknown error has occured.'));
			}
		}
		var data = await res.json();
		var shortenedURL = `${config.instanceURL}/#${data.link}/${password}`;
		console.log(chalk.green.bold('Done! ') + chalk.green(shortenedURL));
	})();
} else if (opts.get) {
	(async () => {
		// check if the url is valid
		if (!validateURL(opts.get))
			return console.error(chalk.red('This URL is invalid.'));
		// parse the url & make sure this instance is supported
		var parsed = new URL(opts.get);
		if (!config.supportedInstances.includes(parsed.hostname.toLowerCase()))
			return console.error(chalk.red('This instance is unsupported.'));
		// get the id & password from the url
		// code[0] is the id of the short link,
		// and code[1] is the password we're decrypting the url with
		const code = parsed.hash.replace("#", "").split("/");
		// get the encrypted url from the server
		console.log(chalk.magentaBright('Getting the encrypted url...'));
		const url = `${config.instanceURL}/api/getlink?id=${encodeURIComponent(code[0])}`;
		const res = await fetch(url);
		if (!res.ok) {
			switch (res.status) {
				case 404:
					return console.error(chalk.red("We couldn't find this link! It may have been removed."));
				case 429:
					return console.error(chalk.red("You are sending too many requests. Try again in a few minutes."));
				default:
					return console.error(chalk.red("An unknown error has occured while getting this encrypted URL."));
			}
		}
		const data = await res.text();
		// decrypt it, lmk if there's a better way to do this
		console.log(chalk.magentaBright('Decrypting...'));
		var decrypted;
		try {
			decrypted = sjcl.decrypt(code[1], data);
		} catch {
			// if the data is invalid, or the password is incorrect, catch the error.
			return console.error(chalk.red('An error has occured while decrypting this link. This often happens when the password (short link) is invalid - make sure to check for any typos.'));
		}
		// validate the url
		if (!validateURL(decrypted))
			return console.error(chalk.red('The URL you were supposed to get redirected to is invalid and has been blocked to prevent attacks.'));
		// if everything's good, show the url to the user.
		console.log(chalk.green.bold('Done! ') + chalk.green(decrypted));
	})();
} else {
	console.log('Use --help to view available commands');
}