const fetch = require('node-fetch');
const sjcl = require('sjcl');
const { Command } = require('commander');
const crypto = require('crypto');
const program = new Command();

function validateURL(value) {
	const urlSchema = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
	return urlSchema.test(value);
}

const config = {
	instanceURL: 'https://yeeturl.glitch.me' // DON'T add a slash at the end of the url!
}

program
	.version('0.0.1')
	.option('-s, --shorten <url>', 'shorten a url')
	.option('-g, --get <url>', 'get the long url from a shortened link')
	.parse();
var opts = program.opts();

if (opts.shorten) {
	(async () => {
		// check if the url is valid
		if (!validateURL(opts.shorten))
			return console.log('This URL is invalid.');
		// if it is, generate a password & encrypt it
		console.log('Encrypting - this may take a while...');
		var password = crypto.randomBytes(6).toString('hex');
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
					return console.error('You are sending too much requests. Please try again later.');
				case 413:
					return console.error('The link you have provided is too long.');
				default:
					return console.error('An unknown error has occured.');
			}
		}
		var data = await res.json();
		var shortenedURL = `${config.instanceURL}/#${data.link}/${password}`;
		console.log(`Done! ${shortenedURL}`);
	})();
} else if (opts.get) {
	console.log('This feature hasn\'t been implemented yet.')
}