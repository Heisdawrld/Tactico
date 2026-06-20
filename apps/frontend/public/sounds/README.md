# Tactico Sound Design

This directory holds the audio assets for the Tactico audio layer.

## Required Sound Files

### SFX (`/sounds/sfx/`)
Short one-shot UI sounds, ~50-200ms each, MP3 format.

| File | Used For | Suggested Character |
|---|---|---|
| `click.mp3` | Button clicks, nav interactions | Crisp gold-tinted tick (~80ms) |
| `hover.mp3` | Hover states (subtle) | Very soft tick (~40ms, low volume) |
| `success.mp3` | Successful actions (save, win) | Rising gold chime (~200ms) |
| `error.mp3` | Error states, failed actions | Soft thud + low tone (~150ms) |
| `goal.mp3` | Goal scored in match sim | Crowd roar swell (~1.5s) |
| `whistle.mp3` | Match start/end, fouls | Referee whistle (~500ms) |
| `notification.mp3` | Feed item arrives | Soft chime (~120ms) |
| `tab-switch.mp3` | Tab/nav switches | Quick whoosh (~60ms) |
| `advance-week.mp3` | "Advance Week" button | Calendar page-flip + chime (~300ms) |

### Ambience (`/sounds/ambience/`)
Looping background atmospheres, MP3 format, 1-3 minute loops.

| File | Used For | Suggested Character |
|---|---|---|
| `menu-crowd.mp3` | Low-volume crowd ambience in menus | Distant stadium murmur, very subtle |
| `matchday-crowd.mp3` | Louder crowd during match sim | Full stadium atmosphere with chants |

## Format Requirements

- **Format**: MP3 (best browser support, smallest size)
- **Sample rate**: 44.1 kHz
- **Bitrate**: 128 kbps for SFX, 192 kbps for ambience
- **Channels**: Mono for SFX, Stereo for ambience
- **Loudness**: -16 LUFS for ambience, -12 LUFS for SFX

## License

All sound assets must be either:
- Original recordings commissioned for Tactico, OR
- Properly licensed from a royalty-free source (e.g. Epidemic Sound, Artlist)

Document the source of each file in `LICENSE.md` alongside this README.

## Implementation

Sounds are loaded lazily by `src/lib/audio.ts` (TacticoAudioEngine class).
Files that don't exist yet are silently skipped — the game runs without audio until files are added.
