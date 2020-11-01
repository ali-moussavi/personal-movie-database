const db = require('./db');
const axios = require('axios');

const renderProfilePage = (req, res) => {
	res.render('userPage', {
		user: req.query.username,
		userId: req.query.id,
		firstname: req.query.name,
		lastname: req.query.lname
	});
};

const getUserFriends = (req, res) => {
	const userId = req.query.Id;
	db
		.select('users.userid', 'users.username', 'users.firstname', 'users.lastname')
		.from('userrelations')
		.join('users', function() {
			this.on(db.raw('?? = ?', [ 'userrelations.user1friended', userId ])).andOn(
				'userrelations.user2',
				'=',
				'users.userid'
			);
		})
		.then((data) => {
			res.json(data);
		})
		.catch((err) => {
			return res.status(400).json(err);
		});
};

const addFriend = async (req, res) => {
	const friendId = parseInt(req.body.friendInfo.userid);
	const userId = parseInt(req.body.userId);
	const sessionNum = req.body.sessionNum;

	if (!userId || sessionNum == 'does not exist') {
		return res.status(400).json('incorrect form submission');
	}

	try {
		const resp = await axios.get(
			`https://your--movie--database.herokuapp.com/isSignedin/?Id=${userId}&sesId=${sessionNum}`
		);
		if (resp.data.signedIn == 'true') {
			db.transaction((trx) => {
				db('userrelations')
					.transacting(trx)
					.insert({ user1friended: userId, user2: friendId })
					.then(() => {
						const response = {
							success: `movie saved for user ${userId}`
						};
						return res.json(response);
					})
					.then(trx.commit)
					.catch((err) => {
						trx.rollback;
						return res.status(400).json(err);
					});
			});
		} else {
			const response = { error: 'You do not have permission' };
			return res.status(400).json(response);
		}
	} catch (error) {
		return res.status(400).json(error);
	}
};

const getUserSearchResults = (req, res) => {
	const searchTerm = req.query.searchTerm;
	db
		.raw(
			`SELECT u.userid,u.username,u.firstname,u.lastname FROM users u WHERE LOWER(CONCAT(u.firstname,' ',u.lastname)) LIKE ?`,
			[ `%${searchTerm}%` ]
		)
		.then((data) => {
			console.log(data.rows);
			res.json(data.rows);
		})
		.catch((err) => {
			console.log(err);
			return res.status(400).json(err);
		});
};
module.exports = {
	renderProfilePage,
	getUserFriends,
	addFriend,
	getUserSearchResults
};
