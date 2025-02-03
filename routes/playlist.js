
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const auth = require('../utils/auth');

router.post('/', async (req, res) => {
    let userName = await auth.getLoggedUserName(req, res);
    if (!userName) {
        return;
    }

    let { name, isPrivate } = req.body;

    if (!name || !isPrivate) {
        res.status(400).send({ message: "Bad parameters." });
        return;
    }

    if (await db.getPlaylistByName(name)) {
        res.status(400).send({ message: "Playlist with this name already exists." });
        return;
    }

    await db.storePlaylist(userName, name, isPrivate.toLowerCase() === 'true', []);

    res.send({ message: "Playlist stored." });
});

router.get('/public', async (req, res) => {
    // even if public lists don't need user filter - we need to ensure auth
    let userName = await auth.getLoggedUserName(req, res);
    if (!userName) {
        return;
    }

    let playLists = await db.findPublicPlaylists();

    res.send(playLists);
});

router.get('/private', async (req, res) => {
    // even if public lists don't need user filter - we need to ensure auth
    let userName = await auth.getLoggedUserName(req, res);
    if (!userName) {
        return;
    }

    let playLists = await db.findPrivatePlaylists(userName);

    res.send(playLists);
});

router.post('/:name/tracks', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }
    
    const username = await db.getUserNameByAuthToken(authToken);
    if (!username) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" }); // ?
    }

    const trackName = req.body.trackName;
    const playlistName = req.params.name; // user doesn't send playlistName, it's part of the route

    if (!trackName) {
        return res.status(400).json({ message: "Missing required field: trackName" });
    }

    try {
        await db.addTrackToPlaylist(username, playlistName, trackName);  // why do i need to pass username
        res.status(200).json({ message: "Track added successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;