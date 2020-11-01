const db = require('./db');

const signInPage = (res) => {
	res.render('index');
};

const handleSignIn = (req, res, bcrypt) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json('incorrect form submission');
	}
	db
		.select('*')
		.from('users')
		.where('email', '=', email)
		.then((data) => {
			let response = { firstname: data[0].firstname, lastname: data[0].lastname };
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid) {
				const username = data[0].username;
				db
					.transaction((trx) => {
						const sessionNum = Math.round(Math.random() * 10000000).toString();
						const hashSessionNum = bcrypt.hashSync(sessionNum, saltRounds);
						return trx
							.insert({
								sessionhash: hashSessionNum,
								userid: data[0].userid
							})
							.into('sessions')
							.returning('userid')
							.then((userid) => {
								response.sessionNum = sessionNum;
								response.username = username;
								response.userid = userid[0];

								res.json(response);
							})
							.then(trx.commit)
							.catch(trx.rollback);
					})
					.catch((err) => res.status(400).json(err));
			} else {
				res.status(400).json('wrong credentials');
			}
		})
		.catch((err) => {
			console.log(err);
			res.status(400).json('error');
		});
};

module.exports = {
	signInPage,
	handleSignIn
};
