---
lastUpdatedOn: 2025-02-20
tags:
  - video-streaming
---

# Playing Videos on the Web

Deep dive into the different ways to play videos on the web - Playing videos via file, using HTTP Range Requests and Adaptive Streaming like HLS and DASH.

We also dive into supporting multiple languages (audio tracks).

## Table of Contents

## Introduction

We will start with the simplest way to play a video on the web - Directly serving the video file.
And then trying to understand the problems with the approach and how can we improve it via HTTP Range Requests.

And finally we will look into Adaptive Streaming like HLS and DASH, which are the most popular techniques
to play videos on the web today.

## Directly serving the video file

- The video is served as a single file
- Modern browsers can start playing as soon as the first chunk is received
  - You technically don't need to wait for the entire file to download before playing
- Modern browsers would not download the entire file or keep downloading if the user is not playing.

### Problems

- **Seekability**: Users CAN NOT seek
- **No Resumability: **Uses has to always download the file from the beginning
- Network Interruption will lead to the user having to start over
- Not possible to change the quality of the video
- Caching is not optimized, since the entire file is cached.
  - Most of the videos are not watched from start to end
  - But the entire file needs to be cached
  - Not possible to cache only sub-parts of the file
- Higher Network Bandwidth cost, since everyone downloads from start to end

> [Checkout the Poc for working samples](https://github.com/sujeet-pro/video-streaming-poc)

```js file=./2025-02-20-video-streaming/no-stream.js title="server.js"

```

```html title="index.html"
<video controls>
  <source src="/path/to/video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

```http title="headers"
connection: keep-alive
content-type: video/mp4
date: Thu, 20 Feb 2025 10:28:02 GMT
keep-alive: timeout=5
transfer-encoding: chunked
```

## Using HTTP Range Requests to fix Seek-ability & Resume-ability

- For the first request, the server sends the entire file contents.
  - `'Content-Length': fileSize`
- For subsequent requests, the server sends a partial file contents.
  - `'Content-Range': bytes ${start}-${end}/${fileSize}`,
  - `'Content-Length': chunksize`,
- Allows the user to seek to a specific position in the video.
- Resumability: If the connection is interrupted, downloading can resume from the last received byte.

### This approach can be used for below use cases

- Small to medium size videos
- Internal applications with predictable network conditions
- Video Previews of Freshly Uploaded Videos (For content authors)
- Security camera footage or other real time video, where the user base is limited

### Problems

- **Fixed Bitrate**: Video resolution / bitrate is fixed & Users CAN NOT change the quality of the video
- Serving a wide audience with different network speeds and devices is challenging
- Caching is not optimized, since the entire file is cached.
  - Most of the videos are not watched from start to end
  - But the entire file needs to be cached
  - Not possible to cache only sub-parts of the file

```js file=./2025-02-20-video-streaming/range-based.js

```

```html title="index.html"
<video controls>
  <source src="/path/to/video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

```http title="headers"
# Initial Response

HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Type: video/mp4
Date: Thu, 20 Feb 2025 10:29:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Range: bytes 0-158008373/158008374
Content-Length: 158008374

# Request 2

range: bytes=107380736-

# Response 2

HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Type: video/mp4
Date: Thu, 20 Feb 2025 10:32:19 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Range: bytes 107380736-158008373/158008374
Content-Length: 50627638
```

### Why not use HTTP Range Requests with multiple video files?

- In order to serve different qualities of the same video, we need to have multiple versions of the same video.
- Each version of the video has a different resolution and bitrate.
- Since we have multiple version of the same video, we need some sort of playlist file, that lists all the versions of the video.
  - This playlist file will have the information about the video file name, video file size, video file resolution and bitrate.
- The video player will select the best quality video based on the user's network conditions and device capabilities.
- When the network condition change, the video player will switch to a different quality video.

The problem with this approach is that, how to we identify which byte range to request when the network speed changes.

## Adaptive Streaming

Adaptive streaming is a technique that allows a video player to adjust the video quality
based on the user's network conditions and device capabilities.

- From a single video, we create multiple versions of the same video, with different resolutions and bitrates.
- Each version of the video is split into multiple segments (generally 2s-10s)
- We create a playlist file, that lists all the segments of the video.
- The video player will select the best quality video based on the user's network conditions and device capabilities.
- When the network condition change, the video player will switch to a different quality video.

Here the key is the playlist file, that lists all the segments of the video.
For each segment, we have the following information:

- Start time of the segment
- End time of the segment
- Resolution of the segment
- Bitrate of the segment
- URL of the segment

### m3u8 file samples

```m3u8 file=./2025-02-20-video-streaming/master.m3u8 collapse={5-22}

```

```m3u8 file=./2025-02-20-video-streaming/playlist.m3u8 collapse={7-25}

```

## Video Processing

Video transcoding is the process of converting a video file from one format, codec, or resolution to another. This is often done to ensure compatibility with different devices, reduce file size, or optimize video playback quality.

Transcoding vs. Encoding vs. Transmuxing

- **Encoding**: Compresses raw video into a digital format.
- **Transcoding**: Converts an already encoded video into a different format or settings.
- **Transmuxing**: Changes the container format (e.g., MP4 to HLS) without altering the video codec.

### Using ffmpeg to generate the playlist file

```bash file=./2025-02-20-video-streaming/hls.bash collapse={8-14, 16-21}

```

### Initial Setup

```bash
# Create output directory for HLS files
mkdir -p video/hls
```

This creates a directory structure for the HLS output files.

### Input and Filter Complex Setup (Transcoding):

```bash file=./2025-02-20-video-streaming/hls.bash#L5

```

- Takes the input video and

### Resolution Scaling (Transcoding):

```bash file=./2025-02-20-video-streaming/hls.bash#L6-L14

```

- splits it into 7 identical streams for different quality versions
- [0:v] refers to the first video stream from input
- Scales each stream to different resolutions
- Creates variants for different quality levels

### Video Stream Configuration (Encoding):

Configures each video stream with:

- H.264 codec
- Frame rate (15-30 fps)
- Bitrate (800Kbps to 20Mbps)

```bash file=./2025-02-20-video-streaming/hls.bash#L15-L22

```

- `-map` assigns the scaled output to a video stream
- `-c:v` sets H.264 codec (`c:v` c for codec, v for video)
- `-r` sets frame rate
- `-b:v` sets bitrate (`b:v` b for bitrate, v for video)

### Audio Configuration (Encoding):

```bash file=./2025-02-20-video-streaming/hls.bash#L22-L24

```

- `-var_stream_map` maps video and audio streams together

- Uses AAC codec at 128kbps (Code by `-c`, bitrate by `-b`), `:a` refers to audio stream
- Maps video and audio streams together using `-var_stream_map`

### HLS Specific Configuration (Transmuxing):

```bash file=./2025-02-20-video-streaming/hls.bash#L25-L30

```

- `-master_pl_name` sets the name of the master playlist
- `-f hls` specifies HLS format
- `-hls_time` sets the segment duration
- `-hls_list_size` sets the number of playlist files to keep
- `-hls_segment_filename` sets the filename pattern for segments
- `-master_pl_name` sets the name of the master playlist

- Configures output paths for segments and playlists
  - `video/hls/v%v/segment%d.ts` - Segment filename pattern
  - `video/hls/v%v/playlist.m3u8` - Playlist filename pattern

## Adding Multiple Audio Tracks (Languages)

In order to support multiple languages, we need to add multiple audio tracks to the video.

```bash file=./2025-02-20-video-streaming/hls-multiple-audio.bash#L22-L25

```
