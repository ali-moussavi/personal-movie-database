const sideMenuBtn = document.getElementById('sideMenubtn');
sideMenuBtn.addEventListener('click', toggleSidemenu);

const closeSidemenuBtn = document.getElementById('closeSidemenuBtn');
closeSidemenuBtn.addEventListener('click', toggleSidemenu);

//for making the background of navbar white when user scrolls down
const pageContainer = document.getElementById('page-container');
pageContainer.addEventListener('scroll', onScroll);

//this part is for understanding which list to add the movie or serie to when we click on add
let listName = '';
$('#exampleModal').on('show.bs.modal', function(event) {
	var button = $(event.relatedTarget); // Button that triggered the modal
	listName = button.data('list'); // Extract info from data-* attributes
	console.log(listName);
});
/////////////

//these two variables are use to display and update the number of watched movies and series in the profile info section
let noOfMoviesWatched = 0;
let noOfSeriesWatched = 0;

const fetchMovies = async (searchTitle) => {
	const modifiedSearchTitle = searchTitle.split(' ').join('?');
	try {
		const response = await axios.get('https://www.omdbapi.com/', {
			params: { apikey: '3b3cd644', s: modifiedSearchTitle }
		});
		return response.data;
	} catch (error) {
		alert(error.message);
	}
};

const fetchMovieDetail = async (movieId) => {
	try {
		const response = await axios.get('https://www.omdbapi.com/', {
			params: { apikey: '3b3cd644', i: movieId }
		});
		return response.data;
	} catch (error) {
		alert(error.message);
	}
};

const createSearchedMoviesList = (moviesObj) => {
	const moviesListContainer = document.getElementById('MoviesList');
	moviesListContainer.innerHTML = '';
	moviesObj.Search.forEach((element) => {
		const row = document.createElement('div');
		row.className = 'row py-2 mt-2 border border-info rounded';
		const col = document.createElement('div');
		col.className =
			'col py-1 d-flex align-items-center d-flex justify-content-between';
		const imgContainer = document.createElement('div');
		imgContainer.className = 'd-inline-block pr-4';
		const img = document.createElement('img');
		img.className = 'rounded';
		img.src = element.Poster;
		img.style = 'height: 8rem; width: 6rem;';
		imgContainer.append(img);
		col.append(imgContainer);

		const movieDesc = document.createElement('div');
		movieDesc.className = 'd-flex flex-column align-items-center w-50 mr-1';

		const movieTitle = document.createElement('div');
		movieTitle.className = 'pb-2 text-center';
		movieTitle.innerHTML = `Movie Title : <span class="font-weight-bold">${element.Title}</span>`;
		movieDesc.append(movieTitle);

		const movieYear = document.createElement('div');
		movieYear.className = 'pb-2';
		movieYear.innerHTML = `Year : <span class="font-weight-bold">${element.Year}</span>`;
		movieDesc.append(movieYear);

		const addBtn = document.createElement('button');
		addBtn.className = 'btn btn-info';
		addBtn.textContent = 'Add';
		addBtn.addEventListener('click', onAdd.bind(this, element));
		movieDesc.append(addBtn);

		col.append(movieDesc);
		row.append(col);
		moviesListContainer.append(row);
	});
};

const addNewMovieComponent = (movieObj) => {
	const moviesListContainer = document.getElementById('MoviesList');
	moviesListContainer.innerHTML = `<div class="container border p-4 mt-4 rounded">
	<div class="row pb-3 align-items-center"> <img
			src="${movieObj.Poster}"
			class="rounded mx-auto d-block" alt="..." style="width: 40%;">
	</div>
	<div class="row pb-1 m-0">
		<h5>${movieObj.Title} (${movieObj.Year})</h5>
	</div>
	<div class="row pb-1 m-0">Metascore: ${movieObj.Metascore}</div>
	<div class="row pb-1 m-0">IMDB Rating: ${movieObj.imdbRating}</div>
	<form id="newMovieForm">
	<div class="row flex-row pb-1 m-0">
		<div class="pr-2">Your rating:</div>
		<div>
			<input type="number" class="form-control" min="0" max="10" required
				style="height: 25px; width: 50px; margin: 0px 3px 0px 0px;">
		</div>
		<div>/10</div>
	</div>
	<div class="form-group pt-2">
		<textarea class="form-control" id="exampleFormControlTextarea1" rows="3"
			placeholder="Any comments about the movie ?"></textarea>
	</div>
	<div class="row justify-content-center pt-1">
		<button type="submit" class="btn btn-primary" id="save">Save changes</button>
	</div>
	</form>
</div>`;
	movieObj.userId = userId;
	movieObj.listName = listName;
	const form = document.getElementById('newMovieForm');
	form.addEventListener('submit', onSave.bind(this, movieObj));
	// savebtn.addEventListener('click', onSave);
};

const createMovieCard = (movieInfo) => {
	const movieCard = document.createElement('div');
	movieCard.className =
		'card px-3 pt-3 my-2 row flex-row no-gutters justify-content-center';
	movieCard.innerHTML = ` <div class="col-4 px-2">
	<img src="${movieInfo.movie.Poster}"
		class="rounded mx-auto d-block" alt="..." style="width: 100%;">
</div>
<div class="col-8 px-2">
	<h5 class="card-title">${movieInfo.movie.Title} (${movieInfo.movie.Year})</h5>
	<h6 class="card-title m-0">${firstname}'s Rating: <span>
			<h5>${movieInfo.userRating}/10</h5>
		</span></h6>
</div>
<div class="col-12 h5 m-0 d-flex justify-content-center pb-1"></div>
<div class="col-12 dropdown--item dropdown--item-hide" id="${movieInfo.movie.imdbID}-1">
	<p class="card-text">${movieInfo.userComment}</p>
</div>
<div class="col-12 pt-3 pb-3 text-center dropdown--item dropdown--item-hide" id="${movieInfo
		.movie.imdbID}-2"> 
</div>`;

	const signedInUserId =
		localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid');
	if (isSignedIn && userId == signedInUserId) {
		const editBtn = document.createElement('button');
		editBtn.className = 'btn btn-primary mr-1';
		editBtn.innerText = 'Edit';
		editBtn.setAttribute('data-toggle', 'modal');
		editBtn.setAttribute('data-target', '#editMovieModal');
		editBtn.setAttribute('data-list', movieInfo.listName);
		editBtn.addEventListener('click', onEdit.bind(this, movieInfo.movie.imdbID));
		movieCard.lastElementChild.append(editBtn);

		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'btn btn-danger mr-1';
		deleteBtn.innerText = 'Delete';
		deleteBtn.addEventListener('click', onDelete.bind(this, movieInfo.movie.imdbID));
		movieCard.lastElementChild.append(deleteBtn);
	}

	const infoBtn = document.createElement('button');
	infoBtn.className = 'btn btn-info';
	infoBtn.innerText = 'Info';
	infoBtn.setAttribute('data-toggle', 'modal');
	infoBtn.setAttribute('data-target', '#movieInfoModal');
	infoBtn.addEventListener('click', onInfo.bind(this, movieInfo.movie.imdbID));
	movieCard.lastElementChild.append(infoBtn);

	const dropDownIcon = document.createElement('i');
	dropDownIcon.className = 'fas fa-chevron-down dropdown-icon';

	dropDownIcon.addEventListener('click', (event) => {
		event.target.classList.toggle('rotate180');
		const commentSection = document.getElementById(`${movieInfo.movie.imdbID}-1`);
		// commentSection.classList.toggle('d-none');
		commentSection.classList.toggle('dropdown--item-hide');
		const buttons = document.getElementById(`${movieInfo.movie.imdbID}-2`);
		// buttons.classList.toggle('d-none');
		buttons.classList.toggle('dropdown--item-hide');
	});

	movieCard.children[2].appendChild(dropDownIcon);

	return movieCard;
};

const createItemToWatchCard = (movieInfo) => {
	const itemToWatchCard = document.createElement('div');
	itemToWatchCard.className =
		'card px-3 pt-3 my-2 row flex-row no-gutters justify-content-center';
	itemToWatchCard.innerHTML = ` <div class="col-4 px-2">
	<img src="${movieInfo.Poster}"
		class="rounded mx-auto d-block" alt="..." style="width: 100%;">
</div>
<div class="col-8 px-2">
	<h5 class="card-title">${movieInfo.Title} (${movieInfo.Year})</h5>
	<h6 class="card-title m-0">IMDB Rating: <span>
			<h5>${movieInfo.imdbRating}/10</h5>
		</span></h6>
</div>
<div class="col-12 h5 m-0 d-flex justify-content-center pb-1"></div>
<div class="col-12 pt-3 pb-3 text-center dropdown--item dropdown--item-hide" id="${movieInfo.imdbID}-thingstowatch"> 
</div>`;

	const signedInUserId =
		localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid');
	if (isSignedIn && userId == signedInUserId) {
		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'btn btn-danger mr-1';
		deleteBtn.innerText = 'Delete';
		deleteBtn.addEventListener('click', onDelete.bind(this, movieInfo.imdbID));
		itemToWatchCard.lastElementChild.append(deleteBtn);
	}

	const infoBtn = document.createElement('button');
	infoBtn.className = 'btn btn-info';
	infoBtn.innerText = 'Info';
	infoBtn.setAttribute('data-toggle', 'modal');
	infoBtn.setAttribute('data-target', '#movieInfoModal');

	const dropDownIcon = document.createElement('i');
	dropDownIcon.className = 'fas fa-chevron-down dropdown-icon';

	infoBtn.addEventListener('click', onInfo.bind(this, movieInfo.imdbID));

	dropDownIcon.addEventListener('click', (event) => {
		event.target.classList.toggle('rotate180');

		const buttons = document.getElementById(`${movieInfo.imdbID}-thingstowatch`);
		// buttons.classList.toggle('d-none');
		buttons.classList.toggle('dropdown--item-hide');
	});

	itemToWatchCard.lastElementChild.append(infoBtn);
	itemToWatchCard.children[2].appendChild(dropDownIcon);

	return itemToWatchCard;
};

const createMovieInfoCard = (movieObj) => {
	const movieInfoElement = document.createElement('div');
	movieInfoElement.classList.add('row');
	movieInfoElement.innerHTML = `<div class="col-12 mb-2">
	<div class="h4">${movieObj.Title} (${movieObj.Year})</div>
</div>
<div class="col-md-5 d-flex align-items-center justify-content-center pb-3"><img
		class="w-100 rounded" style="max-width: 200px;"
		src="${movieObj.Poster}"
		alt="poster"></div>
<div class="col-md-7">
	<div class="h5">Genre : <span class="h6">${movieObj.Genre}</span>
	</div>
	<div class="h5">Director : <span class="h6">${movieObj.Director}</span></div>
	<div class="h5">Writer : <span class="h6">${movieObj.Writer}</span></div>
	<div class="h5">IMDB Rating : <span class="h6">${movieObj.imdbRating}</span></div>
	<div class="h5">Votes : <span class="h6">${movieObj.imdbVotes}</span></div>
	<div class="h5">Metacritic : <span class="h6">${movieObj.Metascore}/100</span></div>
</div>
<div class="col">
	<div class="h5">Plot : <span class="h6" style="line-height: 140%;">${movieObj.Plot}
		</span>
	</div>
	<div class="h5">Actors : <span class="h6">${movieObj.Actors}</span>
	</div>
	<div class="h5">Awards : <span class="h6" style="line-height: 140%;">${movieObj.Awards}</span>
	</div>
</div>`;

	return movieInfoElement;
};

const createFriendItem = (friendInfo) => {
	const container = document.createElement('div');
	container.className = 'd-inline-flex friend-item w-100 p-1';
	container.style.cursor = 'pointer';
	container.innerHTML = ` <img src="https://api.adorable.io/avatars/20/${friendInfo.firstname}${friendInfo.lastname}.png"
	style="border-radius: 35%; height: 2rem; width: 2rem;" alt="avatar">
<div class="h6 my-auto ml-2">${friendInfo.firstname} ${friendInfo.lastname}</div>`;

	container.addEventListener('click', () => {
		location.replace(
			`https://your--movie--database.herokuapp.com/profile/?username=${friendInfo.username}&id=${friendInfo.userid}&name=${friendInfo.firstname}&lname=${friendInfo.lastname}`
		);
	});

	return container;
};

const createUserSearchResultItem = (userInfo, isFriend = false) => {
	const container = document.createElement('div');
	container.className = 'd-inline-flex userSearch-item w-100 shadow';
	container.style.cursor = 'pointer';

	const avatar = document.createElement('img');
	avatar.src = `https://api.adorable.io/avatars/20/${userInfo.firstname}${userInfo.lastname}.png`;
	avatar.alt = 'avatar';
	avatar.style.cssText = 'border-radius: 35%; height: 2rem; width: 2rem;';
	avatar.addEventListener('click', () => {
		location.replace(
			`https://your--movie--database.herokuapp.com/profile/?username=${userInfo.username}&id=${userInfo.userid}&name=${userInfo.firstname}&lname=${userInfo.lastname}`
		);
	});
	container.append(avatar);

	const name = document.createElement('div');
	name.className = 'h6 my-auto ml-2';
	name.innerText = `${userInfo.firstname} ${userInfo.lastname}`;
	name.addEventListener('click', () => {
		location.replace(
			`https://your--movie--database.herokuapp.com/profile/?username=${userInfo.username}&id=${userInfo.userid}&name=${userInfo.firstname}&lname=${userInfo.lastname}`
		);
	});
	container.append(name);

	if (!isFriend && isSignedIn) {
		const addContainer = document.createElement('div');
		addContainer.className = 'ml-auto my-auto mr-1';
		const addtoFriendsBtn = document.createElement('button');
		addtoFriendsBtn.type = 'button';
		addtoFriendsBtn.className = 'btn btn-primary addToFriendsjs';
		addtoFriendsBtn.style.cssText = 'border-radius: 50%; padding: 0rem .46rem;';
		addtoFriendsBtn.setAttribute('data-toggle', 'tooltip');
		addtoFriendsBtn.setAttribute('data-placement', 'bottom');
		addtoFriendsBtn.setAttribute('title', 'Add to your friends');
		addtoFriendsBtn.innerText = '+';
		addtoFriendsBtn.addEventListener(
			'click',
			addToFriendsHandler.bind(this, userInfo)
		);
		addContainer.append(addtoFriendsBtn);
		container.append(addContainer);
	}

	return container;
};

const updateMoviesList = (movieElement) => {
	const watchedMoviesList = document.getElementById('moviesList');
	watchedMoviesList.prepend(movieElement);
};

const updateSeriesList = (seriesElement) => {
	const watchedMoviesList = document.getElementById('seriesList');
	watchedMoviesList.prepend(seriesElement);
};

const updateThingsToWatchList = (thingsToWatchElement) => {
	const watchedMoviesList = document.getElementById('thingsToWatchList');
	watchedMoviesList.prepend(thingsToWatchElement);
};

const updateMovieInfoModal = (movieInfoElement) => {
	const movieInfoContainer = document.getElementById('MoviesInfo');
	movieInfoContainer.innerHTML = '';
	movieInfoContainer.append(movieInfoElement);
};

const updateFriendsList = (friendEl) => {
	const friendsList = document.getElementById('friendsList');
	friendsList.prepend(friendEl);
};

const updateUserSearchResultsList = (searchResultEl) => {
	const userSearchResultList = document.getElementById('userSearchResultContainer');
	userSearchResultList.prepend(searchResultEl);
};

//updating people you might know list
const updatePeopleYMNlist = (userEl) => {
	const PeopleYMNlist = document.getElementById('peopleYMNlist');
	PeopleYMNlist.prepend(userEl);
};

const renderMovieList = async (userId) => {
	const response = await axios.get(
		`https://your--movie--database.herokuapp.com/watchedMovies/?Id=${userId}`
	);
	// console.log(response);
	noOfMoviesWatched = response.data.length;
	const noOfMoviesWatchedEl = document.getElementById('noOfMoviesWatched');
	noOfMoviesWatchedEl.innerHTML = `Movies Watched: ${noOfMoviesWatched}`;
	if (response.data.length > 0) {
		for (let i = 0; i < response.data.length; i++) {
			const movieInfo = {
				movie: {
					Title: response.data[i].moviename,
					Poster: response.data[i].poster,
					Year: response.data[i].year,
					imdbID: response.data[i].movieid
				},
				userRating: response.data[i].rating,
				userComment: response.data[i].comment,
				userName: username
			};
			updateMoviesList(createMovieCard(movieInfo));
		}
	} else {
		const watchedMoviesContainer = document.getElementById('moviesList');
		displayEmptyListMsg(watchedMoviesContainer);
	}
};

const renderthingsToWatchList = async (userId) => {
	const response = await axios.get(
		`https://your--movie--database.herokuapp.com/thingsToWatch/?Id=${userId}`
	);
	// console.log(response);
	if (response.data.length > 0) {
		for (let i = 0; i < response.data.length; i++) {
			const movieInfo = {
				Title: response.data[i].moviename,
				Poster: response.data[i].poster,
				Year: response.data[i].year,
				imdbID: response.data[i].movieid,
				imdbRating: response.data[i].imdbrating
			};
			updateThingsToWatchList(createItemToWatchCard(movieInfo));
		}
	} else {
		const thingsToWatchContainer = document.getElementById('thingsToWatchList');
		displayEmptyListMsg(thingsToWatchContainer);
	}
};

const renderSeriesList = async (userId) => {
	const response = await axios.get(
		`https://your--movie--database.herokuapp.com/watchedSeries/?Id=${userId}`
	);
	// console.log(response);
	noOfSeriesWatched = response.data.length;
	const noOfSeriesWatchedEl = document.getElementById('noOfSeriesWatched');
	noOfSeriesWatchedEl.innerHTML = `Series Watched: ${noOfSeriesWatched}`;

	if (response.data.length > 0) {
		for (let i = 0; i < response.data.length; i++) {
			const movieInfo = {
				movie: {
					Title: response.data[i].moviename,
					Poster: response.data[i].poster,
					Year: response.data[i].year,
					imdbID: response.data[i].movieid
				},
				userRating: response.data[i].rating,
				userComment: response.data[i].comment,
				userName: username
			};
			updateSeriesList(createMovieCard(movieInfo));
		}
	} else {
		const watchedSeriesContainer = document.getElementById('seriesList');
		displayEmptyListMsg(watchedSeriesContainer);
	}
};

const renderNavbarItems = (isUserSignedin) => {
	const navbarContainer = document.getElementById('navbarContainer');
	const navbarRightSideItems = document.createElement('div');
	navbarRightSideItems.className =
		'col pr-1 pl-0 d-flex align-items-center justify-content-end';
	if (isUserSignedin) {
		const name =
			localStorage.getItem('PMDBfirstName') ||
			sessionStorage.getItem('PMDBfirstName');
		const lastName =
			localStorage.getItem('PMDBlastName') ||
			sessionStorage.getItem('PMDBlastName');

		navbarRightSideItems.innerHTML = `<div class="d-inline-flex mr-3 navbar-item " data-toggle="tooltip" data-placement="bottom"
			title="Your profile" id="userProfileLink">
			<div class="m-2" id="navbar-userinfo">${name} ${lastName}</div>
			<i class="fas fa-user h3 my-auto"></i>
		</div>
		<div class="navbar-item" data-toggle="tooltip" data-placement="bottom" title="Logout" id="logoutBtn">
			<i class="fas fa-sign-out-alt h3 my-auto"></i>
		</div>`;
	} else {
		navbarRightSideItems.innerHTML = `<div class="d-inline-flex mr-1 navbar-item " id="userProfileLink">
		<div class="m-2" id="navbar-userinfo">
			<button type="button" class="btn btn-outline-primary">Sign In</button>
		</div>
	</div>
	<div class="navbar-item" data-toggle="tooltip" data-placement="bottom" title="Logout" id="logoutBtn">
		<button type="button" class="btn btn-primary">Sign Up</button>
	</div>`;
	}

	navbarContainer.append(navbarRightSideItems);
};

const renderSidemenuItems = (isUserSignedin) => {
	const sidemenuItemsContainer = document.getElementById('sidemenuItems');
	if (isUserSignedin) {
		const yourProfile = document.createElement('div');
		yourProfile.id = 'yourProfile';
		yourProfile.className = 'side-menu-item mb-3';
		yourProfile.innerText = 'Your Profile';
		yourProfile.addEventListener('click', loadProfilePage);

		const yourFriends = document.createElement('div');
		yourFriends.className = 'side-menu-item mb-3';
		yourFriends.id = 'yourFriends';
		yourFriends.innerText = 'Your friends';
		yourFriends.addEventListener('click', getFriendsList);

		const logout = document.createElement('div');
		logout.id = 'logoutSidemenu';
		logout.className = 'side-menu-item mb-3';
		logout.addEventListener('click', onLogout);
		logout.innerText = 'Logout';

		sidemenuItemsContainer.prepend(yourProfile, yourFriends);
		sidemenuItemsContainer.append(logout);
	} else {
		const yourProfile = document.createElement('div');
		yourProfile.id = 'yourProfile';
		yourProfile.className = 'side-menu-item mb-3';
		yourProfile.innerText = 'Your Profile';
		yourProfile.addEventListener('click', () => {
			location.replace(`https://your--movie--database.herokuapp.com/`);
		});

		const SignIn = document.createElement('div');
		SignIn.className = 'side-menu-item mb-3';
		SignIn.id = 'SignIn';
		SignIn.innerText = 'Sign in';
		SignIn.addEventListener('click', () => {
			location.replace(`https://your--movie--database.herokuapp.com/`);
		});

		const signUp = document.createElement('div');
		signUp.id = 'SignupSidemenu';
		signUp.className = 'side-menu-item mb-3';
		signUp.innerText = 'Sign up';
		signUp.addEventListener('click', () => {
			location.replace(`https://your--movie--database.herokuapp.com/register`);
		});

		sidemenuItemsContainer.prepend(yourProfile, SignIn, signUp);
	}
};

const renderAddtoFriendsBtn = async () => {
	if (!localStorage.getItem('PMDBfriendsList')) {
		const response = await axios.get(
			`https://your--movie--database.herokuapp.com/userFriends/?Id=${signedInUserId}`
		);
		const friendsList = response.data;
		localStorage.setItem('PMDBfriendsList', JSON.stringify(friendsList));
	}

	const friendsArray = JSON.parse(localStorage.getItem('PMDBfriendsList'));
	let isFriend = false;
	friendsArray.forEach((friendInfo) => {
		if (friendInfo.userid == userId) {
			isFriend = true;
			return;
		}
	});

	if (!isFriend) {
		const friendInfo = {
			userid: userId,
			username: username,
			firstname: firstname,
			lastname: lastname
		};
		const profileInfoBox = document.getElementById('profileInfoBox');
		const addtofriendsBtn = document.createElement('button');
		addtofriendsBtn.type = 'button';
		addtofriendsBtn.className = 'btn btn-primary btn-sm';
		addtofriendsBtn.innerText = 'Add to friends';
		addtofriendsBtn.addEventListener(
			'click',
			addToFriendsHandler.bind(this, friendInfo)
		);

		const container = document.createElement('div');
		container.classList = 'd-flex flex-row justify-content-center pt-3';
		container.append(addtofriendsBtn);
		profileInfoBox.append(container);
	}
};

const renderAddtoListBtns = () => {
	const watchedMoviesHeader = document.getElementById('watchedMoviesHeader');
	const watchedSeriesHeader = document.getElementById('watchedSeriesHeader');
	const thingsToWatchHeader = document.getElementById('thingsToWatchHeader');
	const AddBtn1 = document.createElement('button');
	AddBtn1.type = 'button';
	AddBtn1.className = 'btn btn-primary';
	AddBtn1.setAttribute('data-toggle', 'modal');
	AddBtn1.setAttribute('data-target', '#exampleModal');
	AddBtn1.innerText = 'Add';
	AddBtn1.setAttribute('data-list', 'moviesList');
	watchedMoviesHeader.append(AddBtn1);

	const AddBtn2 = document.createElement('button');
	AddBtn2.type = 'button';
	AddBtn2.className = 'btn btn-primary';
	AddBtn2.setAttribute('data-toggle', 'modal');
	AddBtn2.setAttribute('data-target', '#exampleModal');
	AddBtn2.innerText = 'Add';
	AddBtn2.setAttribute('data-list', 'seriesList');
	watchedSeriesHeader.append(AddBtn2);

	const AddBtn3 = document.createElement('button');
	AddBtn3.type = 'button';
	AddBtn3.className = 'btn btn-primary';
	AddBtn3.setAttribute('data-toggle', 'modal');
	AddBtn3.setAttribute('data-target', '#exampleModal');
	AddBtn3.innerText = 'Add';
	AddBtn3.setAttribute('data-list', 'thingsToWatchList');
	thingsToWatchHeader.append(AddBtn3);
};

const sessionNum =
	localStorage.getItem('PMDBsessionNum') || sessionStorage.getItem('PMDBsessionNum');
const signedInUserId =
	localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid');
let isSignedIn = false;

if (sessionNum) {
	// if (
	// 	localStorage.getItem('PMDBuserid') == userId ||
	// 	sessionStorage.getItem('PMDBuserid') == userId
	// ) {
	isSignedin(signedInUserId, sessionNum).then((res) => {
		isSignedIn = res;
		console.log('issignedin', res);
		renderNavbarItems(isSignedIn);
		renderSidemenuItems(isSignedIn);
		const userProfileNavbar = document.getElementById('userProfileLink');
		const logoutBtnNavbar = document.getElementById('logoutBtn');
		if (isSignedIn) {
			userProfileNavbar.addEventListener('click', loadProfilePage);
			logoutBtn.addEventListener('click', onLogout);

			if (
				!(
					localStorage.getItem('PMDBuserid') == userId ||
					sessionStorage.getItem('PMDBuserid') == userId
				)
			) {
				renderAddtoFriendsBtn();
			} else {
				renderAddtoListBtns();
			}
		} else {
			userProfileNavbar.addEventListener('click', () => {
				location.replace(`https://your--movie--database.herokuapp.com/`);
			});
			logoutBtnNavbar.addEventListener('click', () => {
				location.replace(`https://your--movie--database.herokuapp.com/register`);
			});
		}
	});
	// }
} else {
	renderNavbarItems(isSignedIn);
	renderSidemenuItems(isSignedIn);
	const userProfileNavbar = document.getElementById('userProfileLink');
	const logoutBtnNavbar = document.getElementById('logoutBtn');

	userProfileNavbar.addEventListener('click', () => {
		location.replace(`https://your--movie--database.herokuapp.com/`);
	});
	logoutBtnNavbar.addEventListener('click', () => {
		location.replace(`https://your--movie--database.herokuapp.com/register`);
	});
}

renderMovieList(userId);
renderSeriesList(userId);
renderthingsToWatchList(userId);

const searchBox = document.getElementById('searchTerm');
searchBox.addEventListener('input', debounce(onSearch, 500));

const searchBoxWatchedMovies = document.getElementById('searchTermWatchedMovies');
searchBoxWatchedMovies.addEventListener('input', onSearchLocal);

const searchBoxWatchedSeries = document.getElementById('searchTermWatchedSeries');
searchBoxWatchedSeries.addEventListener('input', onSearchLocal);

const searchTermThingToWatch = document.getElementById('searchTermThingToWatch');
searchTermThingToWatch.addEventListener('input', onSearchLocal);

const peopleYouMightKnowBtn = document.getElementById('peopleYMNbutton');
peopleYouMightKnowBtn.addEventListener('click', getPeopleYouMighKnowList);

const SearchTermOtherUsers = document.getElementById('searchTermOtherUsers');
SearchTermOtherUsers.addEventListener('input', debounce(onSearchOtherUsers, 500));
SearchTermOtherUsers.addEventListener('focus', () => {
	if (event.target.value) {
		const searchResultContainer = document.getElementById(
			'userSearchResultContainer'
		);
		searchResultContainer.classList.add('userSearch-result-container-visible');
	}
});

window.addEventListener('click', hideUserSearchResults);
