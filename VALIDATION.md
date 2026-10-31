# Prototype validation

The initial Raspberry Pi 5 proof of concept was tested with the supported saved upstream bundle. These are historical results, not a guarantee that current upstream media or future bundles work.

| Check | Result |
| --- | --- |
| Real archive capture | 15.02 seconds, H.264 640×480 and AAC; decoded without errors |
| M3U/XMLTV | Matching channel IDs; valid XML, 19 guide entries during the check |
| Scheduler consistency | 37 boundaries across 48 hours and published version effective times passed |
| Generated-media transition | 32.015 seconds across recording → card → recording; no decode errors or timestamp warnings after fixes |
| Two-real-source transition | 60.002 seconds across two archive recordings and a card; no client warnings or decode errors |
| Coexistence | Existing Jellyfin health check remained successful on its original port |

An initial natural-boundary test found that an intentional FFmpeg stop was being treated as a source failure. Planned boundary stops are now handled separately. The subsequent accelerated real-source transition passed. A second complete natural-boundary run was not performed.

Exact website synchronization, original intermission media, actual Jellyfin playback, multiple viewers, long-running reliability, and other channels remain unverified or unimplemented. The scheduler assertions check the extracted engine's internal consistency; they are not an independent oracle for its behavior.

Host addresses, account names, private deployment paths, logs, media recordings, and raw deployment reports are intentionally excluded from this public project.
