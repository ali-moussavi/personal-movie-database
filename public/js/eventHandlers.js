const onAdd = async (Movie) => {
	// console.log(Movie);
	const data = await fetchMovieDetail(Movie.imdbID);
	if (listName == 'thingsToWatchList') {
		const movieInfo = {
			movie: {
				Title: data.Title,
				Poster: data.Poster,
				Year: data.Year,
				imdbID: data.imdbID,
				imdbRating: data.imdbRating
			},
			listName: listName,
			userRating: 'not available',
			userComment: 'not available',
			userId: userId,
			sessionNum: sessionNum || 'does not exist'
		};
		try {
			const response = await axios.post(
				'http://127.0.0.1:3000/addmovieorseries',
				movieInfo
			);
			console.log(response);
			deleteEmptyListMsg('thingsToWatch-empty-list-msg');
			updateThingsToWatchList(createItemToWatchCard(data));
		} catch (error) {
			console.log(error);
		}
	} else {
		addNewMovieComponent(data);
	}
};

const onSearch = async (event) => {
	const searchTerm = event.target.value;
	const moviesListContainer = document.getElementById('MoviesList');
	// console.log(searchTerm);
	if (searchTerm) {
		moviesListContainer.innerHTML = '';
		renderLoadingAnim(moviesListContainer);
		const data = await fetchMovies(searchTerm);
		// console.log(data);

		if (data.Response == 'True') {
			createSearchedMoviesList(data);
		} else {
			showSearchError(data);
		}
	} else {
		moviesListContainer.innerHTML = '';
	}
};

const onSearchOtherUsers = async (event) => {
	const searchResultContainer = document.getElementById('userSearchResultContainer');
	const searchTerm = event.target.value.trim().toLowerCase();
	const signedInUserId =
		localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid');

	if (searchTerm) {
		if (!localStorage.getItem('PMDBfriendsList')) {
			const response = await axios.get(
				`http://127.0.0.1:3000/userFriends/?Id=${signedInUserId || userId}`
			);
			const friendsList = response.data;
			localStorage.setItem('PMDBfriendsList', JSON.stringify(friendsList));
		}
		const response = await axios.get(
			`http://127.0.0.1:3000/usersearchResults/?searchTerm=${searchTerm}`
		);
		searchResultContainer.classList.add('userSearch-result-container-visible');
		const userSearchResultList = document.getElementById('userSearchResultContainer');
		userSearchResultList.innerHTML = '';
		const friendsArray = JSON.parse(localStorage.getItem('PMDBfriendsList'));
		response.data.forEach((userInfo) => {
			if (!(userInfo.userid == signedInUserId)) {
				let isFriend = false;
				friendsArray.forEach((friendInfo) => {
					if (friendInfo.userid == userInfo.userid) {
						isFriend = true;
					}
				});
				updateUserSearchResultsList(
					createUserSearchResultItem(userInfo, isFriend)
				);
			}
		});
	} else {
		searchResultContainer.classList.remove('userSearch-result-container-visible');
	}
};

const onSearchLocal = (event) => {
	const searchTerm = event.target.value.toLowerCase();

	const listOfMoviesContainer =
		event.target.parentElement.parentElement.nextElementSibling.firstElementChild;
	const listOfMovies = listOfMoviesContainer.children;
	for (let i = 0; i < listOfMovies.length; i++) {
		const movieName = listOfMovies[
			i
		].children[1].firstElementChild.innerText.toLowerCase();
		if (!movieName.includes(searchTerm)) {
			listOfMovies[i].classList.add('d-none');
		} else {
			listOfMovies[i].classList.remove('d-none');
		}
	}
};

const onSave = async (movieObj, event) => {
	event.preventDefault();
	$('#exampleModal').modal('hide');
	// console.log(movieObj);
	const moviesListContainer = document.getElementById('MoviesList');
	moviesListContainer.innerHTML = '';
	// console.log(movieObj);
	const movieInfo = {
		movie: {
			Title: movieObj.Title,
			Poster: movieObj.Poster,
			Year: movieObj.Year,
			imdbID: movieObj.imdbID,
			imdbRating: movieObj.imdbRating
		},
		listName: movieObj.listName,
		userRating: event.target[0].value,
		userComment: event.target[1].value,
		userId: movieObj.userId,
		sessionNum: sessionNum || 'does not exist'
	};

	// console.log(movieInfo);
	if (movieObj.listName == 'moviesList') {
		try {
			const response = await axios.post(
				'http://127.0.0.1:3000/addmovieorseries',
				movieInfo
			);
			console.log(response);
			deleteEmptyListMsg('watchedmovies-empty-list-msg');
			updateMoviesList(createMovieCard(movieInfo));
			++noOfMoviesWatched;
			const noOfMoviesWatchedEl = document.getElementById('noOfMoviesWatched');
			noOfMoviesWatchedEl.innerHTML = `Movies Watched: ${noOfMoviesWatched}`;
		} catch (error) {
			console.log(error);
		}
	} else if (movieObj.listName == 'seriesList') {
		try {
			const response = await axios.post(
				'http://127.0.0.1:3000/addmovieorseries',
				movieInfo
			);
			console.log(response);
			deleteEmptyListMsg('watchedseries-empty-list-msg');
			updateSeriesList(createMovieCard(movieInfo));
			++noOfSeriesWatched;
			const noOfSeriesWatchedEl = document.getElementById('noOfSeriesWatched');
			noOfSeriesWatchedEl.innerHTML = `Series Watched: ${noOfSeriesWatched}`;
		} catch (error) {
			console.log(error);
		}
	}
};

const onInfo = async (MovieID) => {
	const movieInfoContainer = document.getElementById('MoviesInfo');
	movieInfoContainer.innerHTML = '';
	renderLoadingAnim(movieInfoContainer);
	const data = await fetchMovieDetail(MovieID);
	updateMovieInfoModal(createMovieInfoCard(data));
};

const onDelete = async (movieID, event) => {
	try {
		const containerList = event.target.parentElement.parentElement.parentElement.id;
		const response = await axios.delete(
			`http://127.0.0.1:3000/removeWatchedMovieOrSeries/?movieId=${movieID}&userId=${userId.toString()}&sessionNum=${sessionNum}&containerList=${containerList}`
		);

		console.log(response);
		event.target.parentElement.parentElement.remove();
	} catch (error) {
		alert(error);
		console.log(error);
	}
};

const onEdit = async (movieID, event) => {
	const cardBody = event.target.parentElement.parentElement;
	const editModalBody = document.getElementById('MoviesEdit');
	editModalBody.innerHTML = `<div class="container border p-4 mt-4 rounded">
	<div class="row pb-3 align-items-center"> <img
			src="${cardBody.firstElementChild.firstElementChild.src}"
			class="rounded mx-auto d-block" alt="..." style="width: 40%;">
	</div>
	<div class="row pb-1 m-0">
		<h5>${cardBody.children[1].firstElementChild.innerText}</h5>
	</div>
	<form id="editMovieForm">
	<div class="row flex-row pb-1 m-0">
		<div class="pr-2">Your rating:</div>
		<div>
			<input type="number" class="form-control" min="0" max="10" value="${extractFirstInt(
				cardBody.children[1].lastElementChild.innerText
			)}" required
				style="height: 25px; width: 50px; margin: 0px 3px 0px 0px;">
		</div>
		<div>/10</div>
	</div>
	<div class="form-group pt-2">
		<textarea class="form-control" id="exampleFormControlTextarea1" rows="3"
			placeholder="Any comments about the movie ?">${cardBody.children[3].firstElementChild
				.innerText}</textarea>
	</div>
	<div class="row justify-content-center pt-1">
		<button type="submit" class="btn btn-primary" id="save">Save changes</button>
	</div>
	</form>
</div>`;

	let movieYear;
	let movieTitle;
	const listName = event.target.parentElement.parentElement.parentElement.id;
	if (listName == 'moviesList') {
		movieYear = cardBody.children[1].firstElementChild.innerText
			.match(/\(\d{4}\)/)[0]
			.match(/\d{4}/)[0];
		movieTitle = cardBody.children[1].firstElementChild.innerText.slice(0, -7);
	} else if (listName == 'seriesList') {
		movieYear = cardBody.children[1].firstElementChild.innerText.match(
			/\(([^)]+)\)/
		)[1];
		movieTitle = cardBody.children[1].firstElementChild.innerText.replace(
			/\(([^)]+)\)/,
			''
		);
	}

	const movieObj = {
		Title: movieTitle,
		Year: movieYear,
		Poster: cardBody.firstElementChild.firstElementChild.src,
		imdbID: movieID
	};

	// console.log(movieObj);
	const form = document.getElementById('editMovieForm');
	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		try {
			const body = {
				userId: userId,
				movieId: movieID,
				sessionNum: sessionNum || 'does not exist',
				newComment: event.target[1].value,
				newRating: event.target[0].value,
				listName: listName
			};

			const movieInfo = {
				movie: movieObj,
				userRating: event.target[0].value,
				userComment: event.target[1].value
			};
			const response = await axios.put(
				'http://127.0.0.1:3000/editWatchedMovieOrSeries',
				body
			);
			console.log(response);
			cardBody.remove();
			$('#editMovieModal').modal('hide');

			if (listName == 'moviesList') {
				updateMoviesList(createMovieCard(movieInfo));
			} else if (listName == 'seriesList') {
				updateSeriesList(createMovieCard(movieInfo));
			}
		} catch (error) {
			console.log(error);
			alert('an error occured');
		}
	});
};

const onSignin = async (event) => {
	event.preventDefault();
	const body = { email: event.target[0].value, password: event.target[1].value };
	const rememberMe = event.target[2].value;
	const formContainer = event.target.parentElement;
	renderLoadingAnim(formContainer);
	try {
		const response = await axios.post('http://127.0.0.1:3000/signin', body);
		removeLoadingAnim(formContainer);
		// console.log(response.data);
		if (rememberMe == 'on') {
			localStorage.setItem('PMDBsessionNum', response.data.sessionNum);
			localStorage.setItem('PMDBuserid', response.data.userid.toString());
			localStorage.setItem('PMDBuserName', response.data.username);
			localStorage.setItem('PMDBfirstName', response.data.firstname);
			localStorage.setItem('PMDBlastName', response.data.lastname);
		} else {
			sessionStorage.setItem('PMDBsessionNum', response.data.sessionNum);
			sessionStorage.setItem('PMDBuserid', response.data.userid.toString());
			sessionStorage.setItem('PMDBuserName', response.data.username);
			sessionStorage.setItem('PMDBfirstName', response.data.firstname);
			sessionStorage.setItem('PMDBlastName', response.data.lastname);
		}
		location.replace(
			`http://127.0.0.1:3000/profile/?username=${response.data
				.username}&id=${response.data.userid.toString()}&name=${response.data
				.firstname}&lname=${response.data.lastname}`
		);
	} catch (error) {
		removeLoadingAnim(formContainer);
		showLoginError('Error: Wrong Email or Password', formContainer);
		console.log(error);
	}
};

const onSignUp = async (event) => {
	event.preventDefault();
	const formContainer = event.target.parentElement;
	renderLoadingAnim(formContainer);
	const body = {
		firstname: event.target[0].value,
		lastname: event.target[1].value,
		username: event.target[2].value,
		email: event.target[3].value,
		password: event.target[4].value
	};
	try {
		const response = await axios.post('http://127.0.0.1:3000/signup', body);
		removeLoadingAnim(formContainer);
		console.log(response.data);
		sessionStorage.setItem('PMDBsessionNum', response.data.sessionNum);
		sessionStorage.setItem('PMDBuserid', response.data.userid.toString());
		sessionStorage.setItem('PMDBuserName', response.data.username);
		sessionStorage.setItem('PMDBfirstName', response.body.firstname);
		sessionStorage.setItem('PMDBlastName', response.body.lastname);
		location.replace(
			`http://127.0.0.1:3000/profile/?username=${body.username}&id=${response.data.userid.toString()}&name=${body.firstname}&lname=${body.lastname}`
		);
	} catch (error) {
		removeLoadingAnim(formContainer);
		showLoginError('Error: Username or Email already exists!', formContainer);
		console.log(error);
	}
};

const onLogout = () => {
	localStorage.clear();
	sessionStorage.clear();
	location.replace(`http://127.0.0.1:3000/`);
};

const onScroll = () => {
	const navbar = document.getElementById('navbarContainer');
	if (pageContainer.scrollTop > 80) {
		navbar.classList.add('navbar-sticky');
	} else {
		navbar.classList.remove('navbar-sticky');
	}
};

const loadProfilePage = () => {
	const name =
		localStorage.getItem('PMDBfirstName') || sessionStorage.getItem('PMDBfirstName');
	const lastName =
		localStorage.getItem('PMDBlastName') || sessionStorage.getItem('PMDBlastName');
	const userid =
		localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid');
	const username =
		localStorage.getItem('PMDBuserName') || sessionStorage.getItem('PMDBuserName');
	location.replace(
		`http://127.0.0.1:3000/profile/?username=${username}&id=${userid.toString()}&name=${name}&lname=${lastName}`
	);
};

const toggleSidemenu = () => {
	const sideMenu = document.getElementById('sideMenu');
	sideMenu.classList.toggle('side-menu-visible');
	sideMenuBtn.classList.toggle('text-white');
	closeSidemenuBtn.classList.toggle('side-menu-item-hide');
	const sidemenuItems = document.getElementById('sidemenuItems');
	sidemenuItems.classList.toggle('side-menu-item-hide');
};

const getFriendsList = async () => {
	const friendsListEl = document.getElementById('friendsList');
	friendsListEl.classList.toggle('friends-list-visible');
	if (friendsListEl.childNodes.length == 0) {
		try {
			const userId =
				localStorage.getItem('PMDBuserid') ||
				sessionStorage.getItem('PMDBuserid');
			const response = await axios.get(
				`http://127.0.0.1:3000/userFriends/?Id=${userId}`
			);
			const friendsList = response.data;
			localStorage.setItem('PMDBfriendsList', JSON.stringify(friendsList));
			// console.log(response.data);
			friendsList.forEach((element) => {
				updateFriendsList(createFriendItem(element));
			});
		} catch (error) {
			console.log(error);
		}
	}
};

const addToFriendsHandler = async (friendInfo, event) => {
	const body = {
		friendInfo: friendInfo,
		userId:
			localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid'),
		sessionNum: sessionNum || 'does not exist'
	};
	try {
		await axios.post('http://127.0.0.1:3000/addFriend', body);
		event.target.parentElement.remove();
		if (localStorage.getItem('PMDBfriendsList')) {
			const friendsList = JSON.parse(localStorage.getItem('PMDBfriendsList'));
			friendsList.push(friendInfo);
			localStorage.setItem('PMDBfriendsList', JSON.stringify(friendsList));
		} else {
			const response = await axios.get(
				`http://127.0.0.1:3000/userFriends/?Id=${userId}`
			);
			const friendsList = response.data;
			friendsList.push(friendInfo);
			localStorage.setItem('PMDBfriendsList', JSON.stringify(friendsList));
		}
	} catch (error) {
		console.log(error);
	}
};

const hideUserSearchResults = (event) => {
	if (
		!(
			event.target.id == 'searchTermOtherUsers' ||
			event.target.id == 'userSearchResultContainer' ||
			event.target.classList.contains('userSearch-item') ||
			event.target.classList.contains('addToFriendsjs')
		)
	) {
		const searchResultContainer = document.getElementById(
			'userSearchResultContainer'
		);
		searchResultContainer.classList.remove('userSearch-result-container-visible');
	}
};
// const dat = {
// 	Title: 'Hell or High Water',
// 	Year: '2016',
// 	Rated: 'R',
// 	Released: '26 Aug 2016',
// 	Runtime: '102 min',
// 	Genre: 'Action, Crime, Drama, Thriller, Western',
// 	Director: 'David Mackenzie',
// 	Writer: 'Taylor Sheridan',
// 	Actors: 'Dale Dickey, Ben Foster, Chris Pine, William Sterchi',
// 	Plot:
// 		"A divorced father and his ex-con older brother resort to a desperate scheme in order to save their family's ranch in West Texas.",
// 	Language: 'English',
// 	Country: 'USA',
// 	Awards: 'Nominated for 4 Oscars. Another 48 wins & 165 nominations.',
// 	Poster:
// 		'https://m.media-amazon.com/images/M/MV5BMTg4NDA1OTA5NF5BMl5BanBnXkFtZTgwMDQ2MDM5ODE@._V1_SX300.jpg',
// 	Ratings: [
// 		{ Source: 'Internet Movie Database', Value: '7.6/10' },
// 		{ Source: 'Rotten Tomatoes', Value: '97%' },
// 		{ Source: 'Metacritic', Value: '88/100' }
// 	],
// 	Metascore: '88',
// 	imdbRating: '7.6',
// 	imdbVotes: '192,695',
// 	imdbID: 'tt2582782',
// 	Type: 'movie',
// 	DVD: 'N/A',
// 	BoxOffice: 'N/A',
// 	Production: 'N/A',
// 	Website: 'N/A',
// 	Response: 'True'
// };
