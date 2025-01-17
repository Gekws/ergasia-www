function showSection(section) {
    const sections = ['biography', 'works', 'exhibitions', 'links', 'management'];
    const menus = ['biography-menu', 'works-menu', 'exhibitions-menu', 'links-menu', 'management-menu'];

    sections.forEach(id => document.getElementById(id).classList.add('hidden'));
    menus.forEach(id => document.getElementById(id).classList.add('hidden'));

    document.getElementById(section).classList.remove('hidden');
    document.getElementById(`${section}-menu`).classList.remove('hidden');

    fetchExhibitions();
    fetchLinks();
}

// display works by category
function showWorksCategory(category) {
    const worksContent = {
        landscapes: [
            { src: "/images/landscapes/landscape1.jpg", title: "Wheatfield under Thunderclouds" },
            { src: "/images/landscapes/landscape2.jpg", title: "Wheatfield with Crows" },
            { src: "/images/landscapes/landscape3.jpg", title: "Field with Poppies" },
        ],
        portraits: [
            { src: "/images/portraits/portrait1.jpg", title: "Self-Portrait with Grey Felt Hat" },
            { src: "/images/portraits/portrait2.jpg", title: "Self-Portrait with Straw Hat and Pipe" },
            { src: "/images/portraits/portrait3.jpg", title: "Self-Portrait (1853 - 1890)" },
        ],
    };

    const selectedWorks = worksContent[category] || [];
    const galleryHTML = selectedWorks
        .map(
            (work) =>
                `<div class="work-item">
                    <img src="${work.src}" alt="${work.title}">
                    <p>${work.title}</p>
                </div>`
        )
        .join("");

    document.getElementById("works-content").innerHTML =
        galleryHTML || "<p>No works available in this category.</p>";
}


// fetch and display links
function fetchLinks() {
    fetch('/api/links')
        .then(response => response.json())
        .then(data => {
            const content = data.map(link => `<p><a href="${link.url}" target="_blank">${link.name}</a></p>`).join('');
            document.getElementById('links-content').innerHTML = content;
        });
}


// fetch and display exhibitions
async function fetchExhibitions() {
    try {
        const response = await fetch('/api/exhibitions');
        if (!response.ok) throw new Error('Failed to fetch exhibitions.');

        const exhibitions = await response.json();

        // update exhibitions tab
        const exhibitionsContent = exhibitions
            .map(ex => `<div><h3>${ex.title}</h3><p>${ex.description}</p></div>`)
            .join('');
        document.getElementById('exhibitions-content').innerHTML = exhibitionsContent;

        // update management tab
        const managementContent = exhibitions
            .map(
                ex => `
                <li>
                    ${ex.title} - ${ex.description}
                    <button onclick="editExhibitionTitle('${ex.title}')">Edit Title</button>
                    <button onclick="editExhibitionDescription('${ex.title}')">Edit Description</button>
                    <button onclick="deleteExhibition('${ex.title}')">Delete</button>
                </li>
            `
            )
            .join('');
        document.getElementById('exhibitions-list').innerHTML = `<ul>${managementContent}</ul>`;
    } catch (error) {
        console.error('Error fetching exhibitions:', error);
        document.getElementById('exhibitions-content').innerHTML = '<p>Failed to load exhibitions.</p>';
        document.getElementById('exhibitions-list').innerHTML = '<p>Failed to load exhibitions.</p>';
    }
}


// add exhibition
async function addExhibition(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    const response = await fetch('/api/exhibitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        fetchExhibitions();
        event.target.reset();
        alert('Exhibition added!');
    }
}

// edit exhibition title
async function editExhibitionTitle(title) {
    const newTitle = prompt('Enter new title:', title);
    if (!newTitle) {
        alert('Title is required to update the exhibition.');
        return;
    }

    try {
        const response = await fetch(`/api/exhibitions/${encodeURIComponent(title)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
        });

        if (response.ok) {
            alert('Exhibition title updated successfully.');
            fetchExhibitions(); // refresh the list
        } else {
            alert('Failed to update the exhibition title.');
        }
    } catch (error) {
        console.error('Error updating exhibition title:', error);
    }
}

// edit exhibition desc
async function editExhibitionDescription(title) {
    const newDescription = prompt('Enter new description:');
    if (!newDescription) {
        alert('Description is required to update the exhibition.');
        return;
    }

    try {
        const response = await fetch(`/api/exhibitions/${encodeURIComponent(title)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newDescription }),
        });

        if (response.ok) {
            alert('Exhibition description updated successfully.');
            fetchExhibitions(); // refresh the list
        } else {
            alert('Failed to update the exhibition description.');
        }
    } catch (error) {
        console.error('Error updating exhibition description:', error);
    }
}


// delete exhib
async function deleteExhibition(title) {
    const confirmed = confirm(`Are you sure you want to delete the exhibition: "${title}"?`);
    if (!confirmed) return;

    try {
        //console.log('Title sent to delete:', title); // Debug log

        // send DELETE request with normalized title
        const response = await fetch(`/api/exhibitions/${encodeURIComponent(title.trim())}`, {
            method: 'DELETE',
        });

        console.log('Delete response status:', response.status); // Log response status

        if (response.ok) {
            alert('Exhibition deleted!');
            fetchExhibitions(); // refresh the list
        } else {
            const errorData = await response.json();
            alert(`Failed to delete exhibition: ${errorData.error}`);
            console.error('Error details:', errorData); // log error details
        }
    } catch (error) {
        console.error('Error deleting exhibition:', error);
        alert('An error occurred while deleting the exhibition.');
    }
}


// display exhibitions
function displayExhibitions(exhibitions) {
    const managementContent = exhibitions
        .map(
            ex => `
            <li>
                ${ex.title}
                <button onclick="deleteExhibition('${ex.title}')">Delete</button>
            </li>
        `
        )
        .join('');

    document.getElementById('exhibitions-list').innerHTML = `<ul>${managementContent}</ul>`;
}


document.getElementById('add-exhibition-form').addEventListener('submit', addExhibition);


// login func
async function login(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            fetchSession(); // Refresh session state
            document.getElementById('login-form').reset();
        } else {
            const error = await response.json();
            document.getElementById('login-error').textContent = error.error;
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
}

// logout func
async function logout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });

        if (response.ok) {
            alert('Logged out successfully.');
            fetchSession(); // Refresh session state
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}


async function fetchSession() {
    try {
        const response = await fetch('/api/protected');

        if (response.ok) {
            const result = await response.json();
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('logout-section').classList.remove('hidden');
            document.getElementById('logged-in-user').textContent = result.message.split(', ')[1].replace('!', '');
        } else {
            document.getElementById('login-section').classList.remove('hidden');
            document.getElementById('logout-section').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }
}

document.getElementById('login-form').addEventListener('submit', login);
document.getElementById('logout-button').addEventListener('click', logout);


// check if the user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next(); // user is authenticated
    } else {
        res.status(401).send({ error: 'Unauthorized. Please log in.' });
    }
}


// check session state on page load
fetchSession();

