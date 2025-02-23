
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

router.get('/', async (req, res) => {
    let userName = await auth.getLoggedUserName(req, res);
    if (!userName) {
        return;
    }

    let playLists = await db.findUserPlaylists(userName);

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
    if (!playlistName || isPrivate === undefined) {
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

    await db.updatePlaylistFlag(userName, playlistName, typeof (isPrivate) == 'boolean' ? isPrivate : isPrivate.toLowerCase() === 'true');
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

router.post('/track/tag/vote', async (req, res) => {
    // get voterName from cookies
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const voterName = await db.getUserNameByAuthToken(authToken);
    if (!voterName) {
        return res.status(401).json({ message: "Session expired or invalid authentication token" });
    }

    const { playlistName, creatorUserName, trackName, artistName, tagName, upVote } = req.body;
    if (!playlistName || !creatorUserName || !trackName || !artistName || !tagName || !upVote) {
        return res.status(401).json({ message: "Missing required field(s)" }); // 401 ? 
    }

    const playlist = await db.getPlaylistByName(playlistName, creatorUserName);
    if (!playlist) {
        res.status(400).send({ message: "Playlist with this name doesn't exist." }); // 401 ?
        return;
    }

    const track = playlist.tracks.find(track => track.name === trackName && track.artist === artistName);
    if (!track) {
        return res.status(400).send({ message: "Track with this name doesn't exist." });
    }

    const trackIndex = playlist.tracks.findIndex(track => track.name === trackName && track.artist === artistName);

    if (!track.tags) {
        return res.status(400).send({ message: "This track has no tags." });
    }

    const tagFound = playlist.tracks[trackIndex].tags.find(tag => tag === tagName);
    if (!tagFound) {
        return res.status(400).send({ message: "Tag with this name doesn't exist." });
    }

    const alreadyVoted = await db.getVote(playlistName, creatorUserName, trackName, artistName, tagFound, voterName);
    if (alreadyVoted) {
        return res.status(400).send({ message: "You cannot vote for the same tag twice." });
    }

    let upVoteBool = true;
    if (upVote == "false") {
        upVoteBool = false;
    }

    await db.storeVote(playlistName, creatorUserName, trackName, artistName, tagFound, voterName, upVoteBool);
    res.status(200).json({ message: "Vote added successfully" });
});

router.get('/goodTracks/:tagName', async (req, res) => {
    const authToken = req.cookies.authToken;
    if (!authToken) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const { tagName } = req.params;
    if (!tagName) {
        return res.status(400).json({ message: "Missing parameter: tagName" });
    }

    // returns all votes for a specific tag
    const allVotes = await db.getVotesForTag(tagName);

    // now need to only keep the ones with positive votes
    const votesMap = new Map();

    allVotes.forEach(vote => {
        let track = {
            playListName: vote.playlistName, creatorUserName: vote.creatorUserName, trackName: vote.trackName,
            artistName: vote.artistName
        };
        let keyString = JSON.stringify(track);

        if (!votesMap.get(keyString)) {
            // new row in map
            votesMap.set(keyString, { totalVotes: (vote.upVote ? +1 : -1), track: track });
        } else {
            // update row in map
            votesMap.get(keyString).totalVotes = votesMap.get(keyString).totalVotes + (vote.upVote ? +1 : -1);
        }
    });

    let onlyGoodTracks = Array.from(votesMap.values()).filter((record) => record.totalVotes > 0).map((record) => record.track);
    console.log(onlyGoodTracks);
    res.send(onlyGoodTracks);
});

router.get('/:playListName', async (req, res) => {
    let userName = await auth.getLoggedUserName(req, res);
    if (!userName) {
        return;
    }

    const { playListName } = req.params;
    if (!playListName) {
        return res.status(400).json({ message: "Missing parameter: playListName" });
    }

    res.send(await db.getPlaylistByName(playListName, userName));
});

module.exports = router;