function theCon() {
	setupSplide();
	getMemberData();
	setupVideoElements();
	calculatePostReadTime();
}

function calculatePostReadTime() {
	// Attempt to get the article text element
	const articleElement = document.getElementById("transcript");
	const readTimeElement = document.getElementById("read-time");

	// Check if the elements exist
	if (!articleElement) {
		console.error("Error: Unable to find the article element.");
		return; // Exit the function if no article element
	}
	if (!readTimeElement) {
		console.error("Error: Unable to find the read time display element.");
		return; // Exit the function if no read time element
	}

	// Get the text content from the article element
	const articleText = articleElement.innerText;

	// Split the text into an array of words
	const wordsArray = articleText.split(" ");

	// Count the number of words in the array
	const wordCount = wordsArray.length;

	// Calculate the estimated reading time
	const wordsPerMinute = 200;
	const readingTime = Math.ceil(wordCount / wordsPerMinute);

	// Display the reading time in the read time element
	readTimeElement.innerText = `${readingTime}m read time`;

	console.log(
		`This article has ${wordCount} words and will take approximately ${readingTime} minute(s) to read.`
	);
}

function setupSplide() {
	/* splide defaults */
	Splide.defaults = {
		perMove: 1,
		gap: "0rem",
		arrows: false,
		pagination: false,
		focus: 0,
		speed: 600,
		dragAngleThreshold: 60,
		autoWidth: false,
		rewind: false,
		rewindSpeed: 400,
		waitForTransition: false,
		updateOnMove: true,
		trimSpace: "move",
		type: "loop",
		drag: true,
		snap: true,
		autoWidth: false,
		autoplay: true,
	};

	/* generic splider implementation */
	function mount_splide(myClass) {
		let splides = document.querySelectorAll(myClass);
		for (let i = 0; i < splides.length; i++) {
			let splideOptions = {
				perPage: 3,
				gap: "1rem",
				pauseOnHover: false,
				arrows: true,
				breakpoints: {
					767: {
						perPage: 1,
					},
				},
			};

			let splide = new Splide(splides[i], splideOptions); // create splide instance with these options
			splide.mount();
		}
	}
	mount_splide(".splide.home-playlist");
}

function setupVideoElements() {
	const videoElements = document.querySelectorAll(".video");
	videoElements.forEach((video) => {
		video.addEventListener("click", () => {
			const vimeoContainer = video.querySelector(".vimeo");
			const player = initVimeo(vimeoContainer);
			trackVimeo(player);
			toggleVideoElements(video);
		});
	});
}

function toggleVideoElements(videoElement) {
	const thumbnail = videoElement.querySelector(".video-thumbnail");
	const note = videoElement.querySelector(".video-note");
	const playWrapper = videoElement.querySelector(".video-play_wrapper");
	const vimeoElement = videoElement.querySelector(".vimeo");

	// Hide elements if they exist
	if (thumbnail) {
		thumbnail.style.display = "none";
	}
	if (note) {
		note.style.display = "none";
	}
	if (playWrapper) {
		playWrapper.style.display = "none";
	}

	// Show Vimeo player if it exists
	if (vimeoElement) {
		vimeoElement.style.display = "block";
	} else {
		console.error("Vimeo player element not found.");
	}
}

function initVimeo(vimeoContainer) {
	const vimeoId = vimeoContainer.getAttribute("data-vimeo-id");
	const options = { id: vimeoId };
	const player = new Vimeo.Player(vimeoContainer, options);

	player.loadVideo(vimeoId).then(function (id) {
		console.log(`video ${id} has loaded 🥳`);
	});

	player.on("play", (event) => {
		console.log("video is playing ❤️");
	});

	return player;
}

function trackVimeo(player) {
	player.on("timeupdate", function (data) {
		const percentageWatched = Math.floor((data.percent * 100) / 10) * 10;
		console.log(
			`Member watched ${percentageWatched}% of video ${player.element.id}`
		);
	});
}

function getMemberData() {
	window.$memberstackDom
		.getCurrentMember()
		.then((member) => {
			if (member.data) {
				console.log("Logged in member data:", member.data);

				let signUpDate;
				const signUpDateString = member.data.customFields["sign-up-date"];

				if (signUpDateString) {
					signUpDate = new Date(signUpDateString);
					if (isNaN(signUpDate.getTime())) {
						// console.error("Failed to parse sign-up date:", signUpDateString);
						signUpDate = new Date(member.data.createdAt); // Fallback to creation date
						console.log(
							"Sign-up date is missing or undefined in custom fields, using creation date."
						);
					}
				} else {
					console.log(
						"Sign-up date is missing or undefined in custom fields, using creation date."
					);
					signUpDate = new Date(member.data.createdAt);
				}

				const currentDate = new Date();
				const membershipDurationWeeks =
					Math.floor((currentDate - signUpDate) / (7 * 24 * 60 * 60 * 1000)) +
					1; // Adjust to start from week 1

				document.querySelectorAll(".postcard").forEach((post) => {
					const postReleaseWeeks =
						parseInt(post.getAttribute("data-post-release"), 10) - 1; // Adjust for zero-based indexing
					const releaseDate = new Date(signUpDate.getTime());
					releaseDate.setDate(releaseDate.getDate() + postReleaseWeeks * 7);

					// add this release date to the post's hidden data
					post.setAttribute("data-release-date", releaseDate);

					const releaseTag = post.querySelector(".release-tag_wrapper");
					const releaseTagText = post.querySelector(".release-tag_text");
					const postStatus = post.getAttribute("data-post-status");
					const newTag = post.querySelector(".postcard_new");

					if (postStatus !== "available") {
						releaseTag.removeAttribute("hidden");
						releaseTagText.textContent = "Coming soon";
					} else if (membershipDurationWeeks >= postReleaseWeeks) {
						post.setAttribute("data-post-unlocked", "true");
						releaseTag.setAttribute("hidden", ""); // Hide tag using hidden attribute
						// Check if the video's release date is within the last 7 days
						if ((currentDate - releaseDate) / (1000 * 3600 * 24) <= 7) {
							newTag.removeAttribute("hidden"); // Show the 'new' tag
						} else {
							newTag.setAttribute("hidden", ""); // Hide the 'new' tag
						}
					} else {
						post.setAttribute("data-post-locked", "true");
						releaseTag.removeAttribute("hidden"); // Show tag by removing hidden attribute

						const daysUntilAvailable =
							(releaseDate - currentDate) / (1000 * 3600 * 24);
						if (daysUntilAvailable > 7) {
							const weeksUntilAvailable = Math.ceil(daysUntilAvailable / 7);
							releaseTagText.textContent = `Available in ${weeksUntilAvailable} weeks`;
						} else {
							releaseTagText.textContent = `Available in ${Math.ceil(
								daysUntilAvailable
							)} days`;
						}
					}
				});
			} else {
				console.log("No member logged in");
				document.querySelectorAll(".post").forEach((post) => {
					const releaseTag = post.querySelector(".release-tag");
					const releaseTagText = post.querySelector(".release-tag_text");
					const newTag = post.querySelector(".postcard_new");
					releaseTag.removeAttribute("hidden");
					releaseTagText.textContent = "Coming soon";
					newTag.setAttribute("hidden", ""); // Hide the 'new' tag
				});
			}
		})
		.catch((error) => {
			console.error("Error fetching member data:", error);
		});
}
