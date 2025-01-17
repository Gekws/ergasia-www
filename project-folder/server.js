const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON and manage sessions
app.use(express.json());
app.use(
    session({
        secret: 'qwertyuiop123', 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);


let users = [];

// init admin username and password
(async () => {
    users = [
        {
            username: 'admin',
            password: await bcrypt.hash('password123', 10), // Pre-hashed password
        },
    ];
})();

// serve static files
app.use(express.static('public'));

// middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).send({ error: 'Unauthorized. Please log in.' });
    }
}

// login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // validate credentials
    if (!username || !password) {
        return res.status(400).send({ error: 'Username and password are required.' });
    }

    // find user and verify password
    const user = users.find((u) => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send({ error: 'Invalid username or password.' });
    }

    // save user in session
    req.session.user = { username: user.username };
    res.status(200).send({ message: 'Login successful.' });
});

// logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send({ error: 'Failed to log out.' });
        }
        res.status(200).send({ message: 'Logout successful.' });
    });
});

// if not logged in
app.get('/api/protected', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send({ error: 'Unauthorized. Please log in.' });
    }
    res.status(200).send({ message: `Welcome, ${req.session.user.username}!` });
});

// data files (Exhibitions)
const exhibitionsPath = path.join(__dirname, 'data', 'exhibitions.json');

// get all exhibitions
app.get('/api/exhibitions', (req, res) => {
    const exhibitions = JSON.parse(fs.readFileSync(exhibitionsPath, 'utf-8'));
    res.json(exhibitions);
});

// add a new exhibition (must be logged in)
app.post('/api/exhibitions', isAuthenticated, (req, res) => {
    const exhibitions = JSON.parse(fs.readFileSync(exhibitionsPath, 'utf-8'));
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).send({ error: 'Title and description are required.' });
    }

    const newExhibition = { title: title.trim(), description: description.trim() };
    exhibitions.push(newExhibition);

    fs.writeFileSync(exhibitionsPath, JSON.stringify(exhibitions, null, 2));
    res.status(201).send(newExhibition);
});

// edit exhibition (must be logged in)
app.put('/api/exhibitions/:title', isAuthenticated, (req, res) => {
    const exhibitions = JSON.parse(fs.readFileSync(exhibitionsPath, 'utf-8'));
    const titleToEdit = decodeURIComponent(req.params.title).trim().toLowerCase();
    const { title, description } = req.body;

    const index = exhibitions.findIndex(
        ex => ex.title.trim().toLowerCase() === titleToEdit
    );

    if (index === -1) {
        return res.status(404).send({ error: 'Exhibition not found.' });
    }

    // Update exhibition
    exhibitions[index] = {
        title: title?.trim() || exhibitions[index].title,
        description: description?.trim() || exhibitions[index].description,
    };

    fs.writeFileSync(exhibitionsPath, JSON.stringify(exhibitions, null, 2));
    res.status(200).send(exhibitions[index]);
});

// delete exhibition (must be logged in)
app.delete('/api/exhibitions/:title', isAuthenticated, (req, res) => {
    const exhibitions = JSON.parse(fs.readFileSync(exhibitionsPath, 'utf-8'));
    const titleToDelete = decodeURIComponent(req.params.title).trim().toLowerCase();

    const index = exhibitions.findIndex(
        ex => ex.title.trim().toLowerCase() === titleToDelete
    );

    if (index === -1) {
        return res.status(404).send({ error: 'Exhibition not found.' });
    }

    const deletedExhibition = exhibitions.splice(index, 1);

    fs.writeFileSync(exhibitionsPath, JSON.stringify(exhibitions, null, 2));
    res.status(204).send();
});

const linksPath = path.join(__dirname, 'public', 'links.json');


// API route for links
app.get('/api/links', (req, res) => {
    fs.readFile(linksPath, (err, data) => {
        if (err) return res.status(500).send({ error: "Unable to load links" });
        res.json(JSON.parse(data));
    });
});

app.put('/api/exhibitions/:title', (req, res) => {
    const exhibitions = JSON.parse(fs.readFileSync(exhibitionsPath, 'utf-8'));
    const titleToEdit = decodeURIComponent(req.params.title).trim().toLowerCase();
    const { title, description } = req.body;

    const index = exhibitions.findIndex(ex => ex.title.trim().toLowerCase() === titleToEdit);

    if (index === -1) {
        return res.status(404).send({ error: 'Exhibition not found.' });
    }

    // update exhibition details
    exhibitions[index] = {
        title: title?.trim() || exhibitions[index].title,
        description: description?.trim() || exhibitions[index].description,
    };

    fs.writeFileSync(exhibitionsPath, JSON.stringify(exhibitions, null, 2));
    res.status(200).send(exhibitions[index]);
});




// start the server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
