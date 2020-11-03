const db = require('../db');

const renderRegisterPage = (res) => {
	res.render('register');
};

const handleSignUp = (req, res, bcrypt) => {
	const { username, email, password, firstname, lastname } = req.body;
	if (!email || !username || !password) {
		return res.status(400).json('incorrect form submission');
	}
	const hash = bcrypt.hashSync(password, saltRounds);
	const sessionNum = Math.round(Math.random() * 10000000).toString();
	const hashSessionNum = bcrypt.hashSync(sessionNum, saltRounds);
	db
		.transaction((trx) => {
			trx
				.insert({
					username: username,
					email: email,
					hash: hash,
					firstname: firstname,
					lastname: lastname
				})
				.into('users')
				.returning('userid')
				.then((userid) => {
					return trx('sessions')
						.returning('userid')
						.insert({
							sessionhash: hashSessionNum,
							userid: userid[0]
						})
						.then((userid) => {
							const response = {
								sessionNum: sessionNum,
								username: username,
								userid: userid[0]
							};
							res.json(response);
						});
				})
				.then(trx.commit)
				.catch(trx.rollback);
		})
		.catch((err) => res.status(400).json(err));
};

module.exports = {
	renderRegisterPage,
	handleSignUp
};
