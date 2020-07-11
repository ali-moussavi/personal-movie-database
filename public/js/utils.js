const extractFirstInt = (string = '') => {
	string = string.replace(/\s/g, '');
	for (let i = 0; i < string.length; i++) {
		if (!isNaN(string[i])) {
			if (parseInt(string[i + 1]) == 0) {
				return '10';
			}
			return string[i];
		}
	}
};

function showSearchError(errObj) {
	const moviesListContainer = document.getElementById('MoviesList');
	moviesListContainer.innerHTML = `<div class="row justify-content-center p-2 mt-2 border border-secondary rounded">${errObj.Error}
	</div>`;
}

const showLoginError = (errMsg, containerEl) => {
	if (containerEl.lastElementChild.classList.contains('alert')) {
		containerEl.lastElementChild.remove();
	}
	const error = document.createElement('div');
	error.className = 'alert alert-danger';
	error.innerText = errMsg;
	containerEl.append(error);
};

const debounce = (func, delay) => {
	let timeoutId;
	return (...args) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func.apply(null, args);
		}, delay);
	};
};

const displayEmptyListMsg = (containerEl) => {
	const emptyMsg = document.createElement('div');
	if (containerEl.id == 'seriesList') {
		emptyMsg.id = 'watchedseries-empty-list-msg';
	} else if (containerEl.id == 'moviesList') {
		emptyMsg.id = 'watchedmovies-empty-list-msg';
	} else {
		emptyMsg.id = 'thingsToWatch-empty-list-msg';
	}

	emptyMsg.className = 'alert alert-danger mt-3';
	emptyMsg.setAttribute('role', 'alert');
	emptyMsg.innerText =
		'This list is empty ! \nAdd new movies and you can see them here';
	containerEl.append(emptyMsg);
};

const deleteEmptyListMsg = (id) => {
	const emptyMsg = document.getElementById(id);
	if (emptyMsg) {
		emptyMsg.remove();
	}
};

const renderLoadingAnim = (containerEl) => {
	const loadingAnim = document.createElement('div');
	loadingAnim.className = 'loader--anim';
	containerEl.append(loadingAnim);
};

const removeLoadingAnim = (containerEl) => {
	containerEl.lastElementChild.remove();
};

const isSignedin = async (userId, sessionNum = '0') => {
	try {
		const response = await axios.get(
			`https://your--movie--database.herokuapp.com/isSignedin/?Id=${userId}&sesId=${sessionNum}`
		);

		if (response.data.signedIn == 'true') {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

const showSystemMsg = (MsgText) => {
	const syetemMessage = document.getElementById('systemMessage');
	syetemMessage.innerText = MsgText;
	syetemMessage.classList.remove('system-message-hide');
	setTimeout(() => {
		syetemMessage.classList.add('system-message-hide');
	}, 1200);
};
