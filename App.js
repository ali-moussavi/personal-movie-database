const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 2;
const cors = require('cors');

const signIn = require('./routes/signIn');
const register = require('./routes/register');
const isSignedIn = require('./routes/isSignedIn');
const profile = require('./routes/profile');
const movie = require('./routes/movie');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const db = require('./db');
const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
	signIn.signInPage(res);
});

app.get('/register', (req, res) => {
	register.renderRegisterPage(res);
});

app.post('/signin', (req, res) => {
	console.log('heloo');
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
});

app.post('/signup', (req, res) => {
	register.renderRegisterPage(req, res, bcrypt);
});

app.get('/profile/', (req, res) => {
	profile.renderProfilePage(req, res);
});

app.get('/isSignedin/', (req, res) => {
	isSignedIn.isSignedIn(req, res, bcrypt);
});

app.get('/watchedMovies/', (req, res) => {
	movie.getWatchedMovies(req, res);
});

app.get('/watchedSeries/', (req, res) => {
	movie.getWatchedSeries(req, res);
});

app.get('/thingsToWatch/', (req, res) => {
	movie.getThingsToWatch(req, res);
});

app.get('/userFriends/', (req, res) => {
	profile.getUserFriends(req, res);
});

app.get('/usersearchResults/', (req, res) => {
	profile.getUserSearchResults(req, res);
});

app.post('/addmovieorseries', async (req, res) => {
	movie.addMovieOrSeries(req, res);
});

app.post('/addFriend', async (req, res) => {
	profile.addFriend(req, res);
});

app.delete('/removeWatchedMovieOrSeries/', async (req, res) => {
	movie.removeWatchedMovieOrSeries(req, res);
});

app.put('/editWatchedMovieOrSeries', async (req, res) => {
	movie.editWatchedMovieOrSeries(req, res);
});

app.listen(process.env.PORT || 3000, () => {
	console.log('app is running on port 3000');
});
