# ytdl

A Youtube Video/Audio Downloader Using FFMpeg

### Examples

```sh
# Download Video
ytdl -dv https://www.youtube.com/watch?v=aqz-KE-bpKQ
# Longer Version
ytdl --download-video https://www.youtube.com/watch?v=aqz-KE-bpKQ
# Specify Format
ytdl --download-video https://www.youtube.com/watch?v=aqz-KE-bpKQ -f avi
# Specify Output Directory
ytdl --download-video https://www.youtube.com/watch?v=aqz-KE-bpKQ -o C:\\Users\\<your_name>\\Videos
```

```sh
# Download Audio
ytdl -da https://www.youtube.com/watch?v=aqz-KE-bpKQ
# Longer Version
ytdl --download-audio https://www.youtube.com/watch?v=aqz-KE-bpKQ
# Specify Format
ytdl --download-audio https://www.youtube.com/watch?v=aqz-KE-bpKQ -f ogg
# Specify Output Directory
ytdl --download-audio https://www.youtube.com/watch?v=aqz-KE-bpKQ -o C:\\Users\\<your_name>\\Music
```

```sh
# Get Video Info
ytdl -i https://www.youtube.com/watch?v=aqz-KE-bpKQ
# Longer Version
utdl --info https://www.youtube.com/watch?v=aqz-KE-bpKQ
```

```sh
# Get Help
ytdl -h
ytdl -help
```

```sh
# Get Version
ytdl -v
ytdl -version
```