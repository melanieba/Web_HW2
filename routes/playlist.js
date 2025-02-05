
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

    if (await db.getPlaylistByName(name, userName)) {
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

router.put('/flag', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const userName = await db.getUserNameByAuthToken(authToken);
    if (!userName) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" }); // ?
    }

    const { playlistName, isPrivate } = req.body;
    if (!playlistName || !isPrivate) {
        return res.status(400).json({ message: "Missing required field(s)" });
    }

    const playlist = await db.getPlaylistByName(playlistName, userName);
    if (!playlist) {
        res.status(400).send({ message: "Playlist with this name doesn't exist." });
        return;
    }

    if (playlist.creatorUserName !== userName) {
        res.status(400).send({ message: "Only the creator can modify this playlist" });
        return;
    }

    await db.updatePlaylistFlag(userName, playlistName, isPrivate.toLowerCase() === 'true');
    res.status(200).json({ message: "Flag updated successfully" });
});

router.post('/track', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const userName = await db.getUserNameByAuthToken(authToken);
    if (!userName) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" }); // ?
    }

    const { playlistName, trackName, artistName } = req.body;

    if (!trackName || !playlistName || !artistName) {
        return res.status(400).json({ message: "Missing required field(s)" });
    }

    const playlist = await db.getPlaylistByName(playlistName, userName);
    if (!playlist) {
        res.status(400).send({ message: "Playlist with this name doesn't exist." });
        return;
    }

    if (playlist.creatorUserName !== userName) {
        res.status(400).send({ message: "Only the creator can modify this playlist" });
        return;
    }

    if (playlist.tracks.find((track) => track.name == trackName && track.artist == artistName)) {
        res.status(400).send({ message: "Track already exists" });
        return;
    }

    await db.addTrackToPlaylist(userName, playlistName, trackName, artistName);  // why do i need to pass username
    res.status(200).json({ message: "Track added successfully" });
});

router.delete('/track', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const userName = await db.getUserNameByAuthToken(authToken);
    if (!userName) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" }); // ?
    }

    const { playlistName, trackName, artistName } = req.body;

    if (!trackName || !playlistName || !artistName) {
        return res.status(400).json({ message: "Missing required field(s)" });
    }

    const playlist = await db.getPlaylistByName(playlistName, userName);
    if (!playlist) {
        res.status(400).send({ message: "Playlist with this name doesn't exist." });
        return;
    }

    if (playlist.creatorUserName !== userName) {
        res.status(400).send({ message: "Only the creator can modify this playlist" });
        return;
    }

    if (!playlist.tracks.find((track) => track.name == trackName && track.artist == artistName)) {
        res.status(400).send({ message: "Track doesn't exist in playlist" });
        return;
    }

    await db.deleteTrackToPlaylist(userName, playlistName, trackName, artistName);
    res.status(200).json({ message: "Track deleted successfully" });
});

router.put('/track/reorder', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const userName = await db.getUserNameByAuthToken(authToken);
    if (!userName) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" }); // ?
    }

    const { playlistName } = req.body;

    if (!playlistName) {
        return res.status(400).json({ message: "Missing required field(s)" });
    }

    const playlist = await db.getPlaylistByName(playlistName, userName);
    if (!playlist) {
        res.status(400).send({ message: "Playlist with this name doesn't exist." });
        return;
    }

    if (playlist.creatorUserName !== userName) {
        res.status(400).send({ message: "Only the creator can modify this playlist" });
        return;
    }

    let newTracks = playlist.tracks.sort((track1, track2) =>
        track1.name < track2.name ? -1 : 1);

    await db.updatePlaylistTracks(userName, playlistName, newTracks);
    res.status(200).json({ message: "Tracks reordered successfully" });
});

router.post('/track/tag', async (req, res) => {
    /*
    Find playlist
    Validation all of them + tag name should be there in params
    Find track
    Add to track a new tag
    Call db.updateTracks, give all tracks to not rewrite
    */
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const userName = await db.getUserNameByAuthToken(authToken);
    if (!userName) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" }); // ?
    }

    const { tag, playlistName, trackName, artistName } = req.body;

    if (!trackName || !playlistName || !artistName || !tag) {
        return res.status(400).json({ message: "Missing required field(s)" });
    }

    const playlist = await db.getPlaylistByName(playlistName, userName);
    if (!playlist) {
        res.status(400).send({ message: "Playlist with this name doesn't exist." });
        return;
    }

    /* can anyone do this? 
    if (playlist.creatorUserName !== userName) {
        res.status(400).send({ message: "Only the creator can modify this playlist" });
        return;
    }
    */
    const track = playlist.tracks.find(track => track.name === trackName && track.artist === artistName);
    if (!track) {
        return res.status(400).send({ message: "Track with this name doesn't exist." });
    }

    if (track.tags.includes(tag)) {
        res.status(400).send({ message: "Track already has this tag." });
    }

    const trackIndex = playlist.tracks.findIndex(track => track.name === trackName && track.artist === artistName);

    let newTracks = playlist.tracks;
    const tagString = String(tag).trim();
    newTracks[trackIndex].tags.push(tagString);

    await db.updatePlaylistTracks(userName, playlistName, newTracks);  
    res.status(200).json({ message: "Tag added successfully" });
});

/*
Upvote or downvote a tag for a specific track. Each user can only vote on a specific tag+track once.
Post playlist/track/tag/vote
Make new collection “votes”
Call db getVote and give sames params except for upvote
If something returns, then error that you can’t vote twice
Every time someone votes, call in db storeVote
Stores object that has playlistName, creatorUserName, trackName, artistName, voterUserName (from cookies), upvote (bool) -> 1 vote
*/

module.exports = router;