# Spelunkr TV → Jellyfin Live TV bridge

An experimental Raspberry Pi/Linux bridge that exposes **Saturday Morning** from [Spelunkr TV](https://spelunkr.tv/) as an M3U tuner, XMLTV guide, and continuous MPEG-TS stream for Jellyfin.

**Prototype status:** a 60-second accelerated test crossed two actual archive recordings and a timed break in one HTTP stream, then decoded without errors. Playback inside Jellyfin and exact synchronization with the Spelunkr website have not been verified. This is an independent community experiment, unaffiliated with Spelunkr or Jellyfin.

## Features and current limits

- Reuses the supported upstream scheduler locally, including version changes, cycle boundaries, deterministic bump selection, and ad timing.
- Tunes into the scheduled archive recording at its calculated offset.
- Exposes `/channels.m3u`, `/guide.xml`, `/stream/saturday-morning`, `/health`, and `/now`.
- Transcodes to 640×480 H.264/AAC with FFmpeg.
- Supports one viewer and one channel at a time.
- Uses **silent text cards** for separate bumpers, up-next segments, and advertisements. Their original animation, music, and ad media are not rendered. Commercials embedded in the archive recordings remain intact.
- Source failures can end playback; retuning is required. No automatic fallback or multi-viewer distribution is implemented.

The scheduler's calculated offset is not proof of synchronization. Clock differences, seeking, startup delays, transcoding, and player buffering affect observed playback. The current adapter only supports one known upstream bundle and deliberately rejects unreviewed builds.

## Requirements

- Raspberry Pi 5 or another Linux system with Node.js 24 or newer.
- FFmpeg on `PATH`, with `libx264`, AAC, `drawtext`, and lavfi support.
- DejaVu Sans at `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` for intermission text.
- HTTPS access to Spelunkr's published data and Internet Archive media.

No npm dependencies, Jellyfin credentials, or Docker changes are required. The bridge uses port **8097**; Jellyfin can keep using **8096**.

## Quick start

```sh
git clone https://github.com/shefartsinhersleep/spelunkr-jellyfin-bridge.git
cd spelunkr-jellyfin-bridge
node setup-scheduler.cjs
npm test
npm start
```

The setup script downloads the site's entry script, checks its SHA-256 against the supported build, and extracts only the scheduling region into ignored local files. The original upstream scheduler and media are **not included in this repository**. If the upstream build changed, setup stops. If you already have the supported saved bundle:

```sh
node setup-scheduler.cjs /path/to/spelunkr-app.js
```

The default listener and advertised origin are `http://127.0.0.1:8097`. When Jellyfin runs on the same host, use:

| Jellyfin setting | URL |
| --- | --- |
| M3U tuner | `http://127.0.0.1:8097/channels.m3u` |
| XMLTV guide | `http://127.0.0.1:8097/guide.xml` |

In Jellyfin's Dashboard → Live TV, add an M3U tuner and XMLTV provider with these URLs. The channel ID is `saturday-morning` and its number is 2. For a containerized Jellyfin, its loopback address refers to the container; configure a reachable host address instead.

## Configuration and privacy

Copy `.env.example` to `.env`, edit it locally, and run:

```sh
node --env-file=.env bridge.cjs
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface to listen on |
| `PORT` | `8097` | Bridge port |
| `PUBLIC_URL` | `http://127.0.0.1:8097` | Origin inserted into the playlist |

For Jellyfin on another machine, select a private interface or set `HOST=0.0.0.0` and set `PUBLIC_URL` to the bridge address reachable from Jellyfin. `PUBLIC_URL` must be an HTTP(S) origin without credentials, path, query, or fragment. Non-loopback binding requires this explicit setting.

The bridge has **no authentication**. Use a trusted private network; avoid router port forwarding or publishing the stream endpoint on the open Internet. The `PUBLIC_URL` you configure is visible to anyone who can retrieve the playlist. No IP-detection service, telemetry, API key, or embedded personal server address is included. Upstream services will receive normal network requests from the machine running the bridge.

`.env`, runtime logs, generated scheduler files, cached upstream bundles, recordings, and common key files are ignored by Git. Review staged files before publishing your own configuration. Health and schedule endpoints are intended for the same trusted network as playback.

## Optional user service

`spelunkr-bridge.service` assumes this checkout lives at `~/spelunkr-jellyfin-bridge` and Node is available in the service's `PATH`. Adjust paths if necessary. Copy your private configuration to `~/.config/spelunkr-bridge.env`, then:

```sh
mkdir -p ~/.config/systemd/user
cp spelunkr-bridge.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now spelunkr-bridge.service
systemctl --user status spelunkr-bridge.service
```

Run the service or the manual server, not both on the same port. User-service availability after logout depends on the host's existing user-session configuration. Stop and disable with:

```sh
systemctl --user disable --now spelunkr-bridge.service
```

## Verification

```sh
npm test
npm run check:schedule
node verify-endpoints.cjs
ffmpeg -i http://127.0.0.1:8097/stream/saturday-morning -t 15 -c copy sample.ts
ffmpeg -v error -i sample.ts -f null -
```

Schedule checks need the generated scheduler and live upstream data. Endpoint checks need a running bridge; pass another base origin as an argument if needed. Playback checks consume the prototype's single viewer slot.

`test-real-transition.cjs` runs a separate server bound only to loopback port 18097 and shortens the schedule slots for two real archive sources. `test-transition.cjs` uses a generated `fixture.mp4` instead. Run only one harness at a time. Both still need the locally generated scheduler. These accelerated tests do not establish agreement with the live website.

See [VALIDATION.md](VALIDATION.md) for prior results and limitations, and [THIRD_PARTY.md](THIRD_PARTY.md) for upstream components.
