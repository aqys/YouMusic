var playlistData;

document.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelectorAll('a[href^="#"]');
    const activeIconId = localStorage.getItem('activeIconId');
    const sections = {
        'home-icon': 'home-content',
        'discover-icon': 'discover-content',
        'playlist-icon': 'playlist-content',
        'profile-icon': 'profile-content',
        'settings-icon': 'settings-content' 
    };

    function activateIcon(icon) {
        icon.classList.add('active');
    }

    function deactivateIcons() {
        icons.forEach(icon => {
            icon.classList.remove('active');
        });
    }
    

    

    if (activeIconId) {
        const activeIcon = document.getElementById(activeIconId);
        activateIcon(activeIcon);
        Object.keys(sections).forEach(sectionId => {
            document.getElementById(sections[sectionId]).style.display = 'none';
        });
        document.getElementById(sections[activeIconId]).style.display = 'flex';
    } else {
        const homeIcon = document.getElementById('home-icon');
        activateIcon(homeIcon);
        document.getElementById('home-content').style.display = 'flex';
    }

    icons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            event.preventDefault();
            const iconId = icon.getAttribute('id');
            localStorage.setItem('activeIconId', iconId);
            deactivateIcons();
            activateIcon(icon);
            Object.keys(sections).forEach(sectionId => {
                document.getElementById(sections[sectionId]).style.display = 'none';
            });
            document.getElementById(sections[iconId]).style.display = 'flex';
        });
    });


    const banner = document.querySelector('.banner');
    const imageContainer = document.querySelector('.image-container');
    const bannerItems = document.querySelectorAll('.banner-item');
    const dotsContainer = document.querySelector('.dots-container');

    bannerItems.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');
    let currentImageIndex = 0;

    /**
     * Shows the image at the given index.
     * @param {number} index - The index of the image to show.
     */
    function showImage(index) {
        currentImageIndex = index;
        const offset = -currentImageIndex * 100;
        imageContainer.style.transform = `translateY(${offset}%)`;

        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentImageIndex].classList.add('active');
    }



    /**
     * Shows the next image in the banner.
     */
    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % bannerItems.length;
        showImage(currentImageIndex);
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showImage(index);
        });
    });


    setInterval(showNextImage, 5000); // Adjusted interval to 5 seconds

    if (!localStorage.getItem('access_token')) {
        const query = new URLSearchParams(window.location.href.split('?')[1]);
        const accessToken = query.get('access_token');
        const refreshToken = query.get('refresh_token');
        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('expires_at', Date.now() + (3600 * 1000));
        }
    }

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            if (event.target.checked) {
                const particleContainer = event.target.nextElementSibling.querySelector('.particle-container');
                createParticles(particleContainer);
            }
        });
    });
    

    if (localStorage.getItem('expires_at') < Date.now()) {
        fetch('https://172.16.3.142:5501/refresh_token?' + new URLSearchParams({
            refresh_token: localStorage.getItem('refresh_token')
        }), {
            method: 'GET',
        })
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('expires_at', Date.now() + 3600 * 1000);
        })
        .catch(error => {
            console.error('Error refreshing token:', error);
        });
    }

    

    hentdata();
    getUserPlaylists();
    hentdata2();

    document.querySelector('.searchbar').addEventListener('input', function() {
        const searchTerm = document.querySelector('#searchInput').value;
        const resultsDiv = document.getElementById('results');
    
        if (searchTerm.trim() === '') {
            resultsDiv.style.display = 'none';
        } else {
            resultsDiv.style.display = 'unset';
            searchSpotifyTracks(searchTerm);
        }
    });

    const searchTerm = document.querySelector('#searchInput').value;

    function searchSpotifyTracks(searchTerm) {
        fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            displayResults(data.tracks.items);
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
        });
    }

    // Function to display search results
    function displayResults(tracks) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';
    
        tracks.forEach(track => {
            const trackDiv = document.createElement('div');
            trackDiv.classList.add('track-item');
    
            const img = document.createElement('img');
            img.src = track.album.images[0].url;
            img.alt = track.name;
            img.classList.add('track-cover');
    
            const textDiv = document.createElement('div');
            textDiv.classList.add('track-info');
    
            const trackName = document.createElement('span');
            trackName.classList.add('track-name');
            trackName.innerText = track.name;
    
            const trackArtists = document.createElement('span');
            trackArtists.classList.add('track-artists');
            trackArtists.innerText = ` by ${track.artists.map(artist => artist.name).join(', ')}`;
    
            textDiv.appendChild(trackName);
            textDiv.appendChild(trackArtists);
    
            trackDiv.appendChild(img);
            trackDiv.appendChild(textDiv);
            resultsDiv.appendChild(trackDiv);
        });
    }
    let currentTrackIndex = 0;
    let playlistData = [];

    const trackCover = document.getElementById('track-cover');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const prevButton = document.getElementById('prev-button');
    const playButton = document.getElementById('play-button');
    const nextButton = document.getElementById('next-button');

    const playTrack = () => {
        if (playlistData && playlistData.tracks && playlistData.tracks.items.length > 0) {
            playSong(0); // Play the first track in the playlist
        } else {
            console.error('No tracks available to play.');
        }
    };

    const fetchPlaylist = async () => {
        try {
            const response = await fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                }
            });
            const data = await response.json();
            playlistData = data.tracks.items;
            displayTrack(currentTrackIndex);
        } catch (error) {
            console.error('Error fetching playlist:', error);
        }
    };

    const displayTrack = (index) => {
        const track = playlistData[index].track;
        trackCover.src = track.album.images[0].url;
        trackTitle.textContent = track.name;
        trackArtist.textContent = track.artists.map(artist => artist.name).join(', ');
    };

    const skipTrack = (direction) => {
        if (direction === 'next') {
            currentTrackIndex = (currentTrackIndex + 1) % playlistData.length;
        } else if (direction === 'prev') {
            currentTrackIndex = (currentTrackIndex - 1 + playlistData.length) % playlistData.length;
        }
        displayTrack(currentTrackIndex);
    };

    nextButton.addEventListener('click', () => skipTrack('next'));
    prevButton.addEventListener('click', () => skipTrack('prev'));

    fetchPlaylist();

    function moveWrapper() {
        const wrapper = document.querySelector('.wrapper');
        const homeContent = document.getElementById('home-content');

        if (window.innerWidth <= 479) {
            if (!homeContent.contains(wrapper)) {
                homeContent.appendChild(wrapper);
            }
        } else {
            if (homeContent.contains(wrapper)) {
                document.body.insertBefore(wrapper, document.body.firstChild);
            }
        }
    }
    
    // Initial check
    moveWrapper();
    
    // Check on window resize
    window.addEventListener('resize', moveWrapper);
});

/**
 * Fetches and displays user data from Spotify API.
 */
const hentdata = async () => {
    fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        // Update profile picture and username in profile-content
        const profilePicture = document.querySelector('#profile-content .info-container img');
        const profileName = document.querySelector('#profile-content .ProfileNavn');

        // Ensure you are using the highest resolution image available
        if (data.images && data.images.length > 0) {
            profilePicture.src = data.images[0].url;
            document.getElementById('profile-picture').src = data.images[0].url; // Update profile-icon picture
        }

        profileName.textContent = data.display_name;
    });

    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = localStorage.getItem('access_token');
        player = new Spotify.Player({
            name: 'YouMusic',
            getOAuthToken: cb => { cb(token); }
        });
    
        player.addListener('authentication_error', ({ message }) => { console.error(message); });
        player.addListener('account_error', ({ message }) => { console.error(message); });
        player.addListener('playback_error', ({ message }) => { console.error(message); });
    
        player.addListener('player_state_changed', state => { console.log(state); });
    
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            deviceid = device_id;
    
            // Play the top song from the playlist when the player is ready
            playTrack();
        });
    
        player.connect();
    };
}

/**
 * Fetches and displays top tracks from a Spotify playlist.
 */
const hentdata2 = () => {
    fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        playlistData = data;

        const dataBox = document.getElementById('TopTracks');

        const table = document.getElementById('sange');

        const tableBody = document.querySelector('#sange tbody');

        data.tracks.items.slice(0, 50).forEach((item, index) => {
            const row = document.createElement('tr');

            const numberCell = document.createElement('td');
            numberCell.classList.add('number');
            numberCell.textContent = (index + 1).toString().padStart(2, '0');
            row.appendChild(numberCell);

            const coverCell = document.createElement('td');
            coverCell.classList.add('cover');
            const coverImage = document.createElement('img');
            coverImage.src = item.track.album.images[0].url;
            coverCell.appendChild(coverImage);
            row.appendChild(coverCell);

            const titleCell = document.createElement('td');
            titleCell.classList.add('title');
            titleCell.textContent = item.track.name;
            row.appendChild(titleCell);

            const artistCell = document.createElement('td');
            artistCell.classList.add('artist');
            artistCell.textContent = item.track.artists[0].name;
            row.appendChild(artistCell);

            tableBody.appendChild(row);
        });

        data.tracks.items.map((item, index) => {
            if(index >= 5) {
                return;
            }

            var lengthMinutes = Math.floor(item.track.duration_ms / 60000);
            var lengthSeconds = ((item.track.duration_ms % 60000) / 1000).toFixed(0);
            lengthSeconds = lengthSeconds < 10 ? '0' + lengthSeconds : lengthSeconds;
            dataBox.innerHTML += `
            <div class="TrackBox">
                <p class="TrackPosition">0${index + 1}</p>
                <img class="TrackCover" src="${item.track.album.images[0].url}" alt="Album image" />
                <div class="TrackText">
                    <h2 class="TrackName">${item.track.name}</h2>
                    <h2 class="TrackArtist">${item.track.artists[0].name}</h2>
                </div>
                <p class="TrackDuration">${lengthMinutes}:${lengthSeconds}</p>
                <img class="duration"src="img/brand-deezer.png">
                <img class="playicon" src="img/play.png" onclick="playSong('${index}')" />
            </div>
            `;
        })
    })
}


var player;
var deviceid;

const getUserPlaylists = async () => {
    try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            console.error('No access token found');
            return;
        }

        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error('Access forbidden: Check if the access token has the required scopes');
            } else {
                throw new Error('Failed to fetch playlists');
            }
            return;
        }

        const data = await response.json();
        console.log('Fetched playlists:', data); // Log the response for debugging
        const playlists = data.items;

        const playlistContainer = document.getElementById('playlistContainer');
        playlistContainer.innerHTML = ''; // Clear any existing content

        playlists.forEach((playlist, index) => {
            const playlistHTML = `
                <div class="playlist">
                    <img src="${playlist.images[0]?.url || 'default-image.png'}" alt="Playlist image" />
                    <h2>${playlist.name}</h2>
                </div>
            `;
            playlistContainer.innerHTML += playlistHTML;
        });
    } catch (error) {
        console.error('Error fetching playlists:', error);
    }
};

/**
 * Plays the song at the given index.
 * @param {number} index - The index of the song to play.
 */
const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await fetch('/refresh_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
    });
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
};

// Function to play the song at the given index
const playSong = async (index) => {
    let token = localStorage.getItem('access_token');
    if (!token) {
        token = await refreshAccessToken();
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/play?' + new URLSearchParams({
            device_id: deviceid
        }), {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context_uri: playlistData.uri,
                offset: {
                    position: index
                },
            })
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error('Forbidden: You do not have permission to perform this action.');
            } else if (response.status === 401) {
                console.error('Unauthorized: Access token expired or invalid. Refreshing token...');
                token = await refreshAccessToken();
                await playSong(index); // Retry with the new token
            } else {
                console.error('Error playing song:', response.statusText);
            }
        }
    } catch (error) {
        console.error('Error playing song:', error.message);
    }
};

// Initialize the player with the playlist

/**
 * Toggles the playback state of the player.
 */
const TogglePlay = () => {
    player.togglePlay();

    player.getCurrentState().then(state => {
        if (!state) {
          console.error('User is not playing music through the Web Playback SDK');
          return;
        }
      
        var current_track = state.track_window.current_track;
        var next_track = state.track_window.next_tracks[0];
      
        console.log('Currently Playing', current_track);
        console.log('Playing Next', next_track);
    });
}
