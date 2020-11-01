const getWatchedMovies = (req, res, db) => {
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
};

const getWatchedSeries = (req, res, db) => {
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
};

const getThingsToWatch = (req, res, db) => {
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
};

const addMovieOrSeries = async (req, res, db) => {
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
			`https://your--movie--database.herokuapp.com/isSignedin/?Id=${userId}&sesId=${sessionNum}`
		);
		if (resp.data.signedIn == 'true') {
			db('movies')
				.whereExists(db.select('*').from('movies').where('movies.movieid', movieOrSeriesInfo.imdbID))
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

													targetTable == 'thingstowatch' ? itemToWatch :
													watchedMovieOrSeries
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

											targetTable == 'thingstowatch' ? itemToWatch :
											watchedMovieOrSeries,
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
};

const removeWatchedMovieOrSeries = async (req, res, db) => {
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
			`https://your--movie--database.herokuapp.com/isSignedin/?Id=${userId}&sesId=${sessionNum}`
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
};

const editWatchedMovieOrSeries = async (req, res, db) => {
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
			`https://your--movie--database.herokuapp.com/isSignedin/?Id=${userId}&sesId=${sessionNum}`
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
};

module.exports = {
	getWatchedMovies,
	getWatchedSeries,
	getThingsToWatch,
	addMovieOrSeries,
	removeWatchedMovieOrSeries,
	editWatchedMovieOrSeries
};
