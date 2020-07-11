const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 2;
const cors = require('cors');
const knex = require('knex');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true
	}
});

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.render('index');
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/signin', (req, res) => {
	// console.log(req.body);
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
						const sessionNum = Math.round(
							Math.random() * 10000000
						).toString();
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
		.catch((err) => res.status(400).json('wrong credentials'));
});

app.post('/signup', (req, res) => {
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
});

app.get('/profile/', (req, res) => {
	res.render('userPage', {
		user: req.query.username,
		userId: req.query.id,
		firstname: req.query.name,
		lastname: req.query.lname
	});
});

app.get('/isSignedin/', (req, res) => {
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
});

app.get('/watchedMovies/', (req, res) => {
	const userId = req.query.Id;
	db
		.select(
			'movies.moviename',
			'movies.poster',
			'movies.year',
			'watchedmovies.rating',
			'watchedmovies.comment',
			'watchedmovies.movieid'
		)
		.from('watchedmovies')
		.join('movies', function() {
			this.on(db.raw('?? = ?', [ 'watchedmovies.userid', userId ])).andOn(
				'watchedmovies.movieid',
				'=',
				'movies.movieid'
			);
		})
		.orderBy('watchedmovies.date')
		.then((data) => {
			res.json(data);
		})
		.catch((err) => {
			return res.status(400).json(err);
		});
});

app.get('/watchedSeries/', (req, res) => {
	const userId = req.query.Id;
	db
		.select(
			'movies.moviename',
			'movies.poster',
			'movies.year',
			'watchedseries.rating',
			'watchedseries.comment',
			'watchedseries.movieid'
		)
		.from('watchedseries')
		.join('movies', function() {
			this.on(db.raw('?? = ?', [ 'watchedseries.userid', userId ])).andOn(
				'watchedseries.movieid',
				'=',
				'movies.movieid'
			);
		})
		.orderBy('watchedseries.date')
		.then((data) => {
			res.json(data);
		})
		.catch((err) => {
			return res.status(400).json(err);
		});
});

app.get('/thingsToWatch/', (req, res) => {
	const userId = req.query.Id;
	db
		.select(
			'movies.moviename',
			'movies.poster',
			'movies.year',
			'movies.imdbrating',
			'thingstowatch.date',
			'thingstowatch.movieid'
		)
		.from('thingstowatch')
		.join('movies', function() {
			this.on(db.raw('?? = ?', [ 'thingstowatch.userid', userId ])).andOn(
				'thingstowatch.movieid',
				'=',
				'movies.movieid'
			);
		})
		.orderBy('thingstowatch.date')
		.then((data) => {
			res.json(data);
		})
		.catch((err) => {
			return res.status(400).json(err);
		});
});

app.get('/userFriends/', (req, res) => {
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
});

app.get('/usersearchResults/', (req, res) => {
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
});

app.post('/addmovieorseries', async (req, res) => {
	const movieOrSeriesInfo = req.body.movie;
	const userRating = parseInt(req.body.userRating);
	const userComment = req.body.userComment;
	const userId = parseInt(req.body.userId);
	const sessionNum = req.body.sessionNum;
	const targetList = req.body.listName;
	let targetTable = '';
	if (targetList == 'moviesList') {
		targetTable = 'watchedmovies';
	} else if (targetList == 'seriesList') {
		targetTable = 'watchedseries';
	} else {
		targetTable = 'thingstowatch';
	}
	// console.log(sessionNum);

	if (!movieOrSeriesInfo || sessionNum == 'does not exist') {
		return res.status(400).json('incorrect form submission');
	}

	try {
		const resp = await axios.get(
			`http://127.0.0.1:3000/isSignedin/?Id=${userId}&sesId=${sessionNum}`
		);
		if (resp.data.signedIn == 'true') {
			db('movies')
				.whereExists(
					db
						.select('*')
						.from('movies')
						.where('movies.movieid', movieOrSeriesInfo.imdbID)
				)
				.then((data) => {
					const watchedMovieOrSeries = {
						userid: userId,
						movieid: movieOrSeriesInfo.imdbID,
						rating: userRating,
						comment: userComment,
						date: new Date()
					};
					const itemToWatch = {
						userid: userId,
						movieid: movieOrSeriesInfo.imdbID,
						date: new Date()
					};
					if (!data[0]) {
						//add to movie table and watchedmovies table
						db
							.transaction((trx) => {
								const movie = {
									movieid: movieOrSeriesInfo.imdbID,
									moviename: movieOrSeriesInfo.Title,
									year: movieOrSeriesInfo.Year,
									poster: movieOrSeriesInfo.Poster,
									imdbrating: movieOrSeriesInfo.imdbRating
								};

								trx
									.insert(movie)
									.into('movies')
									.returning('*')
									.then((data) => {
										return trx(targetTable)
											.insert(
												targetTable == 'thingstowatch'
													? itemToWatch
													: watchedMovieOrSeries
											)
											.returning('*')
											.then(() => {
												const response = {
													success: `movie saved for user ${userId}`
												};
												return res.json(response);
											})
											.catch((err) => {
												console.log(err);
											});
									})
									.then(trx.commit)
									.catch(trx.rollback);
							})
							.catch((err) => {
								console.log(err);
								const response = {
									msg: 'Error happened whilst trying to save data'
								};
								return res.status(400).json(response);
							});
					} else {
						//just add to watchedmovies table with userid
						db
							.transaction((trx) => {
								db
									.insert(
										targetTable == 'thingstowatch'
											? itemToWatch
											: watchedMovieOrSeries,
										'userid'
									)
									.into(targetTable)
									.transacting(trx)
									.then((userId) => {
										const response = {
											success: `movie saved for user ${userId}`
										};
										return res.json(response);
									})
									.then(trx.commit)
									.catch((err) => {
										console.log(err);
										trx.rollback;
										const response = {
											res: 'Movie already exists in your list'
										};
										return res.status(400).json(response);
									});
							})
							.catch((err) => {
								console.log(err);
								const response = { msg: 'data not saved' };
								return res.status(400).json(response);
							});
					}
				});
		} else {
			const response = { error: 'You do not have permission' };
			return res.status(400).json(response);
		}
	} catch (error) {
		return res.status(400).json(error);
	}
});

//not tested
app.post('/addFriend', async (req, res) => {
	const friendId = parseInt(req.body.friendInfo.userid);
	const userId = parseInt(req.body.userId);
	const sessionNum = req.body.sessionNum;

	if (!userId || sessionNum == 'does not exist') {
		return res.status(400).json('incorrect form submission');
	}

	try {
		const resp = await axios.get(
			`http://127.0.0.1:3000/isSignedin/?Id=${userId}&sesId=${sessionNum}`
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
});

app.delete('/removeWatchedMovieOrSeries/', async (req, res) => {
	const movieId = req.query.movieId;
	const userId = parseInt(req.query.userId);
	const sessionNum = req.query.sessionNum;
	const targetList = req.query.containerList;
	let targetTable = '';
	if (targetList == 'moviesList') {
		targetTable = 'watchedmovies';
	} else if (targetList == 'seriesList') {
		targetTable = 'watchedseries';
	} else if (targetList == 'thingsToWatchList') {
		targetTable = 'thingstowatch';
	}

	if (!movieId || !userId || sessionNum == 'does not exist') {
		return res.status(400).json('incorrect request queries');
	}
	try {
		const resp = await axios.get(
			`http://127.0.0.1:3000/isSignedin/?Id=${userId}&sesId=${sessionNum}`
		);
		if (resp.data.signedIn == 'true') {
			db
				.transaction((trx) => {
					console.log(targetTable);
					return db(targetTable)
						.transacting(trx)
						.where({ userid: userId, movieid: movieId })
						.del()
						.then(trx.commit)
						.catch(trx.rollback);
				})
				.then(() => {
					return res.send();
				})
				.catch((err) => {
					console.log(err);
					return res.status(400).json({ error: err });
				});
		} else {
			const response = { error: 'You do not have permission' };
			return res.status(400).json(response);
		}
	} catch (error) {
		console.log(error);
		return res.status(400).json(error);
	}
});

app.put('/editWatchedMovieOrSeries', async (req, res) => {
	const userId = parseInt(req.body.userId);
	const movieId = req.body.movieId;
	const sessionNum = req.body.sessionNum;
	const newComment = req.body.newComment;
	const newRating = parseInt(req.body.newRating);
	const targetList = req.body.listName;
	let targetTable = '';
	if (targetList == 'moviesList') {
		targetTable = 'watchedmovies';
	} else {
		targetTable = 'watchedseries';
	}
	try {
		const resp = await axios.get(
			`http://127.0.0.1:3000/isSignedin/?Id=${userId}&sesId=${sessionNum}`
		);
		if (resp.data.signedIn == 'true') {
			db
				.transaction((trx) => {
					db(targetTable)
						.transacting(trx)
						.where({ userid: userId, movieid: movieId })
						.update({ rating: newRating, comment: newComment }, [
							'userid',
							'movieid',
							'rating',
							'comment'
						])
						.then((data) => {
							console.log(data);
							return res.send('changed sucssesfuly');
						})
						.then(trx.commit)
						.catch(trx.rollback);
				})
				.catch((err) => {
					console.log(err);
					return res.status(400).json({ error: err });
				});
		} else {
			const response = { error: 'You do not have permission' };
			return res.status(400).json(response);
		}
	} catch (error) {
		console.log(error);
		return res.status(400).json(error);
	}
});

app.listen(process.env.PORT || 3000, () => {
	console.log('app is running on port 3000');
});

// /signin -> POST
// /signup -> POST
// /profile/:userid GET=user
// /profile/addnewmovie POST
// /profile/editmovie PUT
// profile/deletemovie DELETE
