const gui = require('gui')
const fetch = require('node-fetch');
const sjcl = require('sjcl');
const crypto = require('crypto');
const { Worker } = require('worker_threads');

const instanceURL = "https://yeeturl.glitch.me/";

function validateURL() {
  const urlSchema = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
  return urlSchema.test(value);
}

// create window
const win = gui.Window.create({})
win.setContentSize({width: 350, height: 93})
win.onClose = () => gui.MessageLoop.quit();

const contentView = gui.Container.create();
contentView.setStyle({flexDirection: 'column'});
win.setContentView(contentView);

const logo = gui.Label.create('yeeturl');
contentView.addChildView(logo);

const urlInput = gui.Entry.create();
contentView.addChildView(urlInput);

const shortenButton = gui.Button.create('Shorten');
contentView.addChildView(shortenButton);

shortenButton.onClick = () => {
	const url = urlInput.getText();
	if (!validateURL(url)) return;
	urlInput.setText('Shortening...');

	// create a new worker that will do all synchronous crypto work without blocking the main thread
	const worker = new Worker(`
		const { parentPort } = require('worker_threads');

		const fetch = require('node-fetch');
		const sjcl = require('sjcl');
		const crypto = require('crypto');

		parentPort.once('message', async message => {
			// "message" is the url
			const password = crypto.randomBytes(5).toString('hex');
			const encrypted = sjcl.encrypt(password, message, { iter: 275000 });

			try {
				// send it to the server
				const res = await fetch('${instanceURL}/api/shorten', {
					method: 'POST',
					headers: {
					  'Accept': 'application/json',
					  'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						url: encrypted
					})
				});
				if (!res.ok) throw new Error();

				const json = await res.json();

				return parentPort.postMessage({ pw: password, id: json.link });
			} catch {
				return parentPort.postMessage({ err: 'An error has occured.' });
			}
		});
	`, { eval: true });  
	worker.postMessage(url);  

	worker.on('message', msg => {
		if (msg.err) return urlInput.setText('An error has occured.');
		urlInput.setText(`${instanceURL}/#${msg.id}/${msg.pw}`);
	});
}

win.center();
win.activate();

if (!process.versions.yode) {
  gui.MessageLoop.run()
  process.exit(0)
}