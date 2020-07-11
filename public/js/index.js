const signinForm = document.getElementById('form-signin');
signinForm.addEventListener('submit', onSignin);

const sessionNum =
	localStorage.getItem('PMDBsessionNum') || sessionStorage.getItem('PMDBsessionNum');
const signedInUserId =
	localStorage.getItem('PMDBuserid') || sessionStorage.getItem('PMDBuserid');
let isSignedIn = false;

if (sessionNum) {
	isSignedin(signedInUserId, sessionNum)
		.then((res) => {
			isSignedIn = res;
			console.log('issignedin', res);
			if (isSignedIn) {
				const signedInUsername =
					localStorage.getItem('PMDBuserName') ||
					sessionStorage.getItem('PMDBuserName');
				const signedInfirstname =
					localStorage.getItem('PMDBfirstName') ||
					sessionStorage.getItem('PMDBfirstName');
				const signedInlastname =
					localStorage.getItem('PMDBlastName') ||
					sessionStorage.getItem('PMDBlastName');
				location.replace(
					`https://git.heroku.com/your--movie--database.git/profile/?username=${signedInUsername}&id=${signedInUserId}&name=${signedInfirstname}&lname=${signedInlastname}`
				);
			}
		})
		.catch((err) => {
			console.log(err);
		});
}
