const db = require('./db');
const isSignedIn = (req, res, bcrypt) => {
	const userId = req.query.Id;
	const sessionNum = req.query.sesId;
	if (!userId) {
		return res.status(400).json('incorrect form submission');
	}
	const response = { signedIn: 'false' };
	db
		.select('*')
		.from('sessions')
		.where('userid', '=', userId)
		.then((data) => {
			data.forEach((session) => {
				if (bcrypt.compareSync(sessionNum, session.sessionhash)) {
					response.signedIn = 'true';
					return res.json(response);
				}
			});

			if (response.signedIn == 'false') {
				return res.json(response);
			}
		})
		.catch((err) => {
			clg(err);
			res.json(response);
		});
};

module.exports = {
	isSignedIn
};
